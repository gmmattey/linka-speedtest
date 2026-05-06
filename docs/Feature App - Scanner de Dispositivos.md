# Linka — Especificação: Módulo de Network Scanning (Android)

> **Para:** Claude Code Sonnet 4.6  
> **Stack:** Android nativo · Kotlin · Coroutines · Jetpack  
> **Versão da spec:** 1.0 · Maio 2026  
> **Android mínimo suportado:** API 26 (Android 8.0) · Target: API 35  
> **Preparado para:** Android 17 (API 37) com `ACCESS_LOCAL_NETWORK`  
> **Excluído do escopo:** protocolos proprietários Ubiquiti (Discovery UDP/10001)

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura Modular](#2-arquitetura-modular)
3. [Permissões e Política de Acesso](#3-permissões-e-política-de-acesso)
4. [Módulo 1 — GatewayInfo](#4-módulo-1--gatewayinfo)
5. [Módulo 2 — AccessPointInfo](#5-módulo-2--accesspointinfo)
6. [Módulo 3 — HostDiscovery](#6-módulo-3--hostdiscovery)
7. [Módulo 4 — HostEnrichment](#7-módulo-4--hostenrichment)
8. [Módulo 5 — OuiDatabase](#8-módulo-5--ouidatabase)
9. [Módulo 6 — ScanOrchestrator](#9-módulo-6--scanorchestrator)
10. [Modelos de Dados](#10-modelos-de-dados)
11. [UX — Estados e Fluxo](#11-ux--estados-e-fluxo)
12. [Tratamento de Erros e Casos de Borda](#12-tratamento-de-erros-e-casos-de-borda)
13. [Performance e Bateria](#13-performance-e-bateria)
14. [Referências Open-Source e Documentação Oficial](#14-referências-open-source-e-documentação-oficial)
15. [Checklist de Implementação](#15-checklist-de-implementação)

---

## 1. Visão Geral

O módulo de Network Scanning do Linka tem como objetivo entregar ao usuário (cliente do ISP ou técnico) uma visão clara e acionável da rede Wi-Fi local: quem está conectado, qual tecnologia o roteador suporta, como está organizada a rede em meshes com múltiplos nós, e se há problemas de configuração ou excesso de dispositivos.

### 1.1 O que o módulo entrega

- **Informações do AP atual:** padrão Wi-Fi (4/5/6/6E/7), banda (2.4/5/6 GHz), largura de canal, RSSI, velocidade de link TX/RX, BSSID do nó conectado.
- **Gateway e topologia:** IP do gateway, DNS servidores, prefixo de rede (CIDR), detecção de nós mesh adicionais na mesma rede.
- **Inventário de dispositivos:** lista de hosts ativos com IP, hostname (quando resolvível), fabricante (via OUI), tipo inferido (router/phone/laptop/TV/IoT/printer/unknown) e serviços detectados.
- **Identificação do roteador/CPE:** modelo via HTTP banner do admin UI, fingerprint via serviços expostos (UPnP/SSDP `friendlyName`, mDNS, NetBIOS).
- **Alertas acionáveis:** AP isolation detectado, canal congestionado, dispositivos desconhecidos, firmware desatualizado (quando informado via SSDP/UPnP).

### 1.2 O que o módulo NÃO faz

- Não faz root scanning (sem raw sockets, sem `/proc/net/arp` — bloqueado desde Android 10).
- Não expõe MACs de terceiros como dado primário (impossível desde Android 13 sem root).
- Não gerencia ou modifica configurações de rede.
- Não acessa APIs proprietárias de fabricantes de roteador.

---

## 2. Arquitetura Modular

```
┌─────────────────────────────────────────────────────┐
│                  ScanOrchestrator                    │  ← ponto de entrada único
│  (coordena pipeline, expõe StateFlow para a UI)      │
└────────┬──────────────────────────────┬─────────────┘
         │                              │
┌────────▼────────┐          ┌──────────▼──────────┐
│  GatewayInfo    │          │  AccessPointInfo     │
│  (ConnMgr,      │          │  (WifiManager,       │
│   WifiManager)  │          │   ScanResult, IEs)   │
└────────┬────────┘          └──────────┬───────────┘
         │                              │
         └──────────┬───────────────────┘
                    │ subnetPrefix, gatewayIp
         ┌──────────▼───────────┐
         │    HostDiscovery     │
         │  (ICMP + TCP probe   │
         │   mDNS browse        │
         │   SSDP M-SEARCH      │
         │   NBNS node-status)  │
         └──────────┬───────────┘
                    │ List<DiscoveredHost>
         ┌──────────▼───────────┐
         │   HostEnrichment     │
         │  (PTR DNS, mDNS      │
         │   directed query,    │
         │   SSDP XML parse,    │
         │   HTTP admin banner, │
         │   OUI lookup,        │
         │   DeviceClassifier)  │
         └──────────┬───────────┘
                    │ List<NetworkDevice>
         ┌──────────▼───────────┐
         │    OuiDatabase       │
         │  (IEEE MA-L/MA-M/    │
         │   MA-S, offline DB,  │
         │   background updater)│
         └──────────────────────┘
```

Cada módulo é uma classe Kotlin independente com interface pública definida por `interface`. O `ScanOrchestrator` injeta dependências via construtor (sem framework de DI obrigatório — compatível com Hilt ou manual). Toda comunicação entre módulos usa `suspend fun` e `Flow<T>`.

### 2.1 Estrutura de pacotes

```
com.linka.networkscan/
├── orchestrator/
│   └── ScanOrchestrator.kt
├── gateway/
│   ├── GatewayInfoProvider.kt
│   └── GatewayInfo.kt              ← data class
├── accesspoint/
│   ├── AccessPointInfoProvider.kt
│   ├── ApCapabilities.kt            ← data class
│   └── InformationElementParser.kt  ← parser de IEs 802.11
├── discovery/
│   ├── HostDiscoveryEngine.kt
│   ├── probes/
│   │   ├── IcmpProbe.kt
│   │   ├── TcpProbe.kt
│   │   ├── MdnsBrowser.kt
│   │   ├── SsdpDiscovery.kt
│   │   └── NbnsProbe.kt
│   └── DiscoveredHost.kt            ← data class
├── enrichment/
│   ├── HostEnrichmentEngine.kt
│   ├── enrichers/
│   │   ├── PtrDnsEnricher.kt
│   │   ├── MdnsDirectEnricher.kt
│   │   ├── SsdpXmlEnricher.kt
│   │   ├── HttpBannerEnricher.kt
│   │   └── OuiEnricher.kt
│   ├── DeviceClassifier.kt
│   └── NetworkDevice.kt             ← data class
├── oui/
│   ├── OuiDatabase.kt
│   ├── OuiUpdateWorker.kt           ← WorkManager
│   └── oui_ieee.db                  ← SQLite snapshot
├── model/
│   ├── ScanResult.kt                ← resultado final
│   └── ScanState.kt                 ← estados para UI
└── util/
    ├── NetworkUtils.kt
    ├── IpUtils.kt
    └── PermissionHelper.kt
```

---

## 3. Permissões e Política de Acesso

### 3.1 AndroidManifest.xml

```xml
<!-- Acesso básico de rede -->
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE"/>

<!-- Wi-Fi scanning: Android ≤12 exige Fine Location -->
<uses-permission
    android:name="android.permission.ACCESS_FINE_LOCATION"
    android:maxSdkVersion="32"/>

<!-- Wi-Fi scanning: Android 13+ usa NEARBY_WIFI_DEVICES sem location -->
<uses-permission
    android:name="android.permission.NEARBY_WIFI_DEVICES"
    android:usesPermissionFlags="neverForLocation"
    tools:targetApi="33"/>

<!-- LAN access: Android 17 (API 37) obrigatório para mDNS, SSDP, ICMP, TCP scan -->
<!-- Declare desde já; em Android <17 é ignorada e não aparece no dialog -->
<uses-permission android:name="android.permission.ACCESS_LOCAL_NETWORK"/>

<!-- Para manter scan ativo em foreground service (não background) -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE"/>
```

### 3.2 Lógica de solicitação em runtime

```kotlin
// PermissionHelper.kt

object PermissionHelper {

    /** Permissões necessárias para API level do dispositivo atual. */
    fun requiredPermissions(apiLevel: Int = Build.VERSION.SDK_INT): List<String> {
        val perms = mutableListOf(
            Manifest.permission.ACCESS_NETWORK_STATE,
            Manifest.permission.ACCESS_WIFI_STATE,
        )
        when {
            apiLevel >= 37 -> {
                perms += Manifest.permission.NEARBY_WIFI_DEVICES
                perms += Manifest.permission.ACCESS_LOCAL_NETWORK
            }
            apiLevel >= 33 -> {
                perms += Manifest.permission.NEARBY_WIFI_DEVICES
                perms += Manifest.permission.ACCESS_FINE_LOCATION
            }
            else -> {
                perms += Manifest.permission.ACCESS_FINE_LOCATION
            }
        }
        return perms
    }

    /**
     * Retorna true se todas as permissões necessárias estão concedidas.
     * Deve ser verificado antes de iniciar qualquer scan.
     */
    fun hasAllRequired(context: Context): Boolean =
        requiredPermissions().all { perm ->
            ContextCompat.checkSelfPermission(context, perm) ==
                PackageManager.PERMISSION_GRANTED
        }

    /**
     * Retorna true se localização está habilitada no sistema.
     * Necessário para getScanResults() em Android 9+.
     */
    fun isLocationEnabled(context: Context): Boolean {
        val lm = context.getSystemService(LocationManager::class.java)
        return LocationManagerCompat.isLocationEnabled(lm)
    }
}
```

**IMPORTANTE:** No Android 17+ o sistema exibe um dialog específico para `ACCESS_LOCAL_NETWORK` separado dos outros. O rationale deve explicar claramente ao usuário o motivo: *"O Linka precisa ver os equipamentos na sua rede Wi-Fi para diagnosticar a conexão. Nenhum dado sai do aparelho."*

### 3.3 Throttling de scanning

`WifiManager.startScan()` é limitado pelo Android:

| Contexto | Limite |
|---|---|
| App em foreground | 4 scans em 2 minutos |
| App em background | 1 scan a cada 30 minutos |
| Modo de compatibilidade | scan único, resultado cacheado até próximo ciclo |

**Estratégia:** o Linka escuta passivamente `SCAN_RESULTS_AVAILABLE_ACTION` (broadcast do sistema, sem consumir quota) e só chama `startScan()` quando o cache tiver mais de 60 segundos. Nunca chamar `startScan()` em loop.

---

## 4. Módulo 1 — GatewayInfo

**Responsabilidade:** identificar o gateway padrão, servidores DNS, máscara de rede e prefixo CIDR para derivar o range de IPs a escanear.

### 4.1 Interface pública

```kotlin
interface GatewayInfoProvider {
    suspend fun get(): GatewayInfo?
}

data class GatewayInfo(
    val gatewayIp: InetAddress,
    val subnetPrefix: Int,           // ex: 24 para /24
    val subnetBase: InetAddress,     // ex: 192.168.1.0
    val deviceIp: InetAddress,
    val dnsServers: List<InetAddress>,
    val dhcpServer: InetAddress?,
    val isPrivateDnsActive: Boolean, // DoT/DoH ativo
    val privateDnsHostname: String?
)
```

### 4.2 Implementação

Usar `ConnectivityManager.getLinkProperties()` (API moderna, preferencial):

```kotlin
class GatewayInfoProviderImpl(
    private val context: Context
) : GatewayInfoProvider {

    override suspend fun get(): GatewayInfo? = withContext(Dispatchers.IO) {
        val cm = context.getSystemService(ConnectivityManager::class.java)
        val network = cm.activeNetwork ?: return@withContext null
        val props = cm.getLinkProperties(network) ?: return@withContext null
        val caps = cm.getNetworkCapabilities(network) ?: return@withContext null

        // Verificar que é Wi-Fi (não LTE/Ethernet)
        if (!caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return@withContext null

        val linkAddresses = props.linkAddresses
        val deviceLinkAddr = linkAddresses.firstOrNull { it.address is Inet4Address }
            ?: return@withContext null
        val deviceIp = deviceLinkAddr.address as Inet4Address
        val prefix = deviceLinkAddr.prefixLength

        // Gateway: rota padrão com gateway não-null
        val gateway = props.routes
            .firstOrNull { it.isDefaultRoute && it.gateway is Inet4Address }
            ?.gateway as? Inet4Address
            ?: return@withContext null

        val subnetBase = IpUtils.networkAddress(deviceIp, prefix)
        val dnsServers = props.dnsServers.filterIsInstance<Inet4Address>()

        // DNS privado (DoT/DoH) — API 28+
        val privateDnsActive = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            props.isPrivateDnsActive
        } else false

        val privateDnsHost = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            props.privateDnsServerName
        } else null

        // DHCP server — ainda funciona via DhcpInfo em Android 14
        val dhcpInfo = context.getSystemService(WifiManager::class.java).dhcpInfo
        val dhcpServer = if (dhcpInfo.serverAddress != 0) {
            IpUtils.intToInetAddress(dhcpInfo.serverAddress)
        } else null

        GatewayInfo(
            gatewayIp = gateway,
            subnetPrefix = prefix,
            subnetBase = subnetBase,
            deviceIp = deviceIp,
            dnsServers = dnsServers,
            dhcpServer = dhcpServer,
            isPrivateDnsActive = privateDnsActive,
            privateDnsHostname = privateDnsHost
        )
    }
}
```

**Utilitários de IP:**

```kotlin
// IpUtils.kt
object IpUtils {
    fun intToInetAddress(ip: Int): InetAddress {
        // Android guarda em little-endian
        val bytes = byteArrayOf(
            (ip and 0xFF).toByte(),
            (ip shr 8 and 0xFF).toByte(),
            (ip shr 16 and 0xFF).toByte(),
            (ip shr 24 and 0xFF).toByte()
        )
        return InetAddress.getByAddress(bytes)
    }

    fun networkAddress(ip: Inet4Address, prefix: Int): InetAddress {
        val ipInt = ByteBuffer.wrap(ip.address).int
        val mask = if (prefix == 0) 0 else (-1 shl (32 - prefix))
        return InetAddress.getByAddress(
            ByteBuffer.allocate(4).putInt(ipInt and mask).array()
        )
    }

    /** Gera lista de todos os IPs do /24 (ou /16 com limite de 512). */
    fun hostRange(base: InetAddress, prefix: Int): List<String> {
        val count = minOf(1 shl (32 - prefix), 512) // cap em 512 para /16+
        val baseInt = ByteBuffer.wrap(base.address).int
        return (1 until count - 1).map { offset ->
            val addr = ByteBuffer.allocate(4).putInt(baseInt + offset).array()
            InetAddress.getByAddress(addr).hostAddress!!
        }
    }
}
```

**Limitação conhecida:** em Android <21 `getLinkProperties()` não é público via SDK. Para API 21–22 usar `WifiManager.getDhcpInfo()` como fallback. API mínima deste módulo é 21, mas o projeto usa API 26+ então não é necessário o fallback.

---

## 5. Módulo 2 — AccessPointInfo

**Responsabilidade:** extrair capacidades do AP atual (padrão Wi-Fi, banda, canal, MIMO, largura) e listar todos os APs/BSSIDs visíveis (incluindo nós mesh do mesmo SSID).

### 5.1 Interface pública

```kotlin
interface AccessPointInfoProvider {
    /** Informações do AP ao qual o dispositivo está conectado. */
    suspend fun getConnectedAp(): ApCapabilities?

    /** Lista todos os APs visíveis (inclui outros SSIDs e outros nós mesh). */
    suspend fun getAllVisibleAps(): List<ApCapabilities>
}

data class ApCapabilities(
    val ssid: String?,
    val bssid: String,                   // MAC do AP (rádio)
    val frequency: Int,                  // MHz
    val band: WifiBand,
    val channelWidth: Int,               // 20, 40, 80, 160, 320 MHz
    val channel: Int,
    val rssi: Int,                       // dBm
    val wifiStandard: WifiStandard,
    val txLinkSpeedMbps: Int?,           // só para AP conectado
    val rxLinkSpeedMbps: Int?,           // só para AP conectado
    val supportsMuMimo: Boolean,
    val supportsHe: Boolean,             // Wi-Fi 6/6E
    val supportsEht: Boolean,            // Wi-Fi 7
    val supportsFtm: Boolean,            // Round-Trip Time
    val capabilities: String,           // string raw de segurança
    val vendorOui: String?,              // 3 primeiros bytes do BSSID
    val isCurrentAp: Boolean
)

enum class WifiBand { BAND_2_4_GHZ, BAND_5_GHZ, BAND_6_GHZ, UNKNOWN }

enum class WifiStandard {
    LEGACY,    // 802.11a/b/g
    WIFI_4,    // 802.11n (HT)
    WIFI_5,    // 802.11ac (VHT)
    WIFI_6,    // 802.11ax 2.4/5 GHz (HE)
    WIFI_6E,   // 802.11ax 6 GHz
    WIFI_7,    // 802.11be (EHT)
    UNKNOWN
}
```

### 5.2 Derivação da banda por frequência

```kotlin
fun Int.toWifiBand(): WifiBand = when {
    this in 2400..2499 -> WifiBand.BAND_2_4_GHZ
    this in 4900..5900 -> WifiBand.BAND_5_GHZ
    this in 5925..7125 -> WifiBand.BAND_6_GHZ
    else               -> WifiBand.UNKNOWN
}

fun Int.toChannel(): Int = when {
    this in 2412..2484 -> (this - 2412) / 5 + 1
    this in 5180..5825 -> (this - 5000) / 5
    this in 5955..7115 -> (this - 5955) / 5 + 1
    else               -> 0
}
```

### 5.3 Obter padrão Wi-Fi

```kotlin
fun ScanResult.toWifiStandard(): WifiStandard {
    // API 30+ — fonte oficial
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        return when (wifiStandard) {
            ScanResult.WIFI_STANDARD_LEGACY -> WifiStandard.LEGACY
            ScanResult.WIFI_STANDARD_11N    -> WifiStandard.WIFI_4
            ScanResult.WIFI_STANDARD_11AC   -> WifiStandard.WIFI_5
            ScanResult.WIFI_STANDARD_11AX   -> {
                // Distinguir Wi-Fi 6 de 6E pela frequência
                if (frequency > 5925) WifiStandard.WIFI_6E else WifiStandard.WIFI_6
            }
            ScanResult.WIFI_STANDARD_11BE   -> WifiStandard.WIFI_7
            else                            -> WifiStandard.UNKNOWN
        }
    }
    // Fallback para API <30: parsear capabilities string
    return when {
        "[EHT]" in capabilities -> WifiStandard.WIFI_7
        "[HE]"  in capabilities -> WifiStandard.WIFI_6
        "[VHT]" in capabilities -> WifiStandard.WIFI_5
        "[HT]"  in capabilities -> WifiStandard.WIFI_4
        else                    -> WifiStandard.LEGACY
    }
}
```

### 5.4 Detecção de MU-MIMO via Information Elements (API 30+)

```kotlin
// InformationElementParser.kt

object InformationElementParser {

    // IDs de Information Elements relevantes
    private const val IE_HT_CAPABILITIES    = 45
    private const val IE_VHT_CAPABILITIES   = 191
    private const val IE_EXTENDED_SUPPORTED = 255  // extensão para HE (tag 35) e EHT (tag 108)
    private const val HE_CAPABILITIES_EXT_TAG = 35
    private const val EHT_CAPABILITIES_EXT_TAG = 108

    data class ParsedCapabilities(
        val supportsMuMimo: Boolean,     // MU-MIMO (VHT ou HE)
        val supportsHe: Boolean,         // Wi-Fi 6/6E
        val supportsEht: Boolean,        // Wi-Fi 7
        val spatialStreams: Int?,         // nSS do HT/VHT
    )

    /**
     * Parseia a lista de IEs retornada por ScanResult.getInformationElements() (API 30+).
     * Referência: IEEE 802.11-2020, Section 9.4.2
     */
    fun parse(elements: List<ScanResult.InformationElement>): ParsedCapabilities {
        var muMimo = false
        var he = false
        var eht = false
        var streams: Int? = null

        for (ie in elements) {
            val bytes = ie.bytes
            when (ie.id) {

                IE_HT_CAPABILITIES -> {
                    // Byte 1-2: HT Capability Info
                    // Bit 5 em byte[0]: SM Power Save (SMPS) — não indica MU-MIMO
                    // Byte 6-9: Supported MCS Set (indica quantos streams)
                    if (bytes.limit() >= 10) {
                        val mcsSet = bytes.get(3).toInt() and 0xFF
                        streams = Integer.numberOfTrailingZeros(
                            Integer.highestOneBit(mcsSet + 1)
                        ).coerceAtMost(4)
                    }
                }

                IE_VHT_CAPABILITIES -> {
                    // Bytes 0-3: VHT Capabilities Info (4 bytes)
                    // Bits 19-20: MU Beamformee Capable, Bit 19 = MU Beamformer
                    if (bytes.limit() >= 4) {
                        val cap = (bytes.get(0).toInt() and 0xFF) or
                                  ((bytes.get(1).toInt() and 0xFF) shl 8) or
                                  ((bytes.get(2).toInt() and 0xFF) shl 16) or
                                  ((bytes.get(3).toInt() and 0xFF) shl 24)
                        muMimo = (cap shr 19) and 1 == 1 // MU Beamformer Capable
                    }
                }

                IE_EXTENDED_SUPPORTED -> {
                    if (bytes.limit() >= 1) {
                        val extTag = bytes.get(0).toInt() and 0xFF
                        when (extTag) {
                            HE_CAPABILITIES_EXT_TAG -> {
                                he = true
                                // Byte 7 (HE PHY Capabilities, octet 5)
                                // Bit 5: MU Beamformer = suporte HE MU-MIMO
                                if (bytes.limit() >= 8) {
                                    muMimo = muMimo || ((bytes.get(7).toInt() shr 5) and 1 == 1)
                                }
                            }
                            EHT_CAPABILITIES_EXT_TAG -> eht = true
                        }
                    }
                }
            }
        }
        return ParsedCapabilities(muMimo, he, eht, streams)
    }
}
```

### 5.5 Dados do AP conectado via WifiInfo

```kotlin
@Suppress("DEPRECATION")
private suspend fun buildConnectedApCaps(
    wifiManager: WifiManager,
    scanResults: List<ScanResult>
): ApCapabilities? {
    // API 31+: WifiInfo via NetworkCallback é mais segura
    // API <31: getConnectionInfo() ainda funcional
    val wifiInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        getWifiInfoViaCallback() // ver implementação abaixo
    } else {
        wifiManager.connectionInfo
    } ?: return null

    val bssid = wifiInfo.bssid?.takeIf { it != "02:00:00:00:00:00" }
        ?: return null // MAC mascarado pelo Android — AP não identificável

    val matchedScan = scanResults.firstOrNull { it.BSSID == bssid }

    val standard = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        wifiInfo.wifiStandard.toWifiStandard() // WifiInfo também tem wifiStandard em API 30
    } else {
        matchedScan?.toWifiStandard() ?: WifiStandard.UNKNOWN
    }

    val ieCapabilities = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && matchedScan != null) {
        InformationElementParser.parse(matchedScan.informationElements.toList())
    } else null

    val channelWidthInt = matchedScan?.channelWidth?.let { cw ->
        when (cw) {
            ScanResult.CHANNEL_WIDTH_20MHZ         -> 20
            ScanResult.CHANNEL_WIDTH_40MHZ         -> 40
            ScanResult.CHANNEL_WIDTH_80MHZ         -> 80
            ScanResult.CHANNEL_WIDTH_160MHZ        -> 160
            ScanResult.CHANNEL_WIDTH_80MHZ_PLUS_MHZ -> 160
            ScanResult.CHANNEL_WIDTH_320MHZ        -> 320   // Wi-Fi 7
            else                                   -> 20
        }
    } ?: 20

    return ApCapabilities(
        ssid = wifiInfo.ssid?.removeSurrounding("\""),
        bssid = bssid,
        frequency = wifiInfo.frequency,
        band = wifiInfo.frequency.toWifiBand(),
        channelWidth = channelWidthInt,
        channel = wifiInfo.frequency.toChannel(),
        rssi = wifiInfo.rssi,
        wifiStandard = standard,
        txLinkSpeedMbps = if (Build.VERSION.SDK_INT >= 29) wifiInfo.txLinkSpeedMbps else wifiInfo.linkSpeed,
        rxLinkSpeedMbps = if (Build.VERSION.SDK_INT >= 29) wifiInfo.rxLinkSpeedMbps else null,
        supportsMuMimo = ieCapabilities?.supportsMuMimo ?: false,
        supportsHe = ieCapabilities?.supportsHe ?: (standard == WifiStandard.WIFI_6 || standard == WifiStandard.WIFI_6E),
        supportsEht = ieCapabilities?.supportsEht ?: (standard == WifiStandard.WIFI_7),
        supportsFtm = matchedScan?.is80211mcResponder ?: false,
        capabilities = matchedScan?.capabilities ?: "",
        vendorOui = bssid.take(8).uppercase(),
        isCurrentAp = true
    )
}
```

**Para API 31+ — WifiInfo via NetworkCallback:**

```kotlin
private suspend fun getWifiInfoViaCallback(): WifiInfo? = suspendCoroutine { cont ->
    val cm = context.getSystemService(ConnectivityManager::class.java)
    val request = NetworkRequest.Builder()
        .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
        .build()
    var resumed = false
    val callback = object : ConnectivityManager.NetworkCallback(
        FLAG_INCLUDE_LOCATION_INFO // necessário para BSSID não mascarado
    ) {
        override fun onCapabilitiesChanged(
            network: Network,
            caps: NetworkCapabilities
        ) {
            if (!resumed) {
                resumed = true
                cm.unregisterNetworkCallback(this)
                cont.resume(caps.transportInfo as? WifiInfo)
            }
        }
        override fun onUnavailable() {
            if (!resumed) { resumed = true; cont.resume(null) }
        }
    }
    cm.requestNetwork(request, callback, Handler(Looper.getMainLooper()), 3000)
}
```

---

## 6. Módulo 3 — HostDiscovery

**Responsabilidade:** descobrir todos os hosts ativos na rede local usando múltiplas técnicas em paralelo. Retorna um `Flow<DiscoveredHost>` que emite à medida que hosts são encontrados (progressivo, não espera tudo).

### 6.1 Interface pública

```kotlin
interface HostDiscoveryEngine {
    /**
     * Inicia descoberta e emite hosts conforme são descobertos.
     * [gatewayInfo] fornece o range de IPs.
     * Completa quando todas as técnicas terminam ou [timeoutMs] expira.
     */
    fun discover(
        gatewayInfo: GatewayInfo,
        timeoutMs: Long = 15_000L
    ): Flow<DiscoveredHost>
}

data class DiscoveredHost(
    val ip: String,
    val discoveredVia: Set<DiscoveryMethod>,
    val openPorts: Set<Int>,
    val mdnsServices: List<MdnsService>,
    val ssdpInfo: SsdpBasicInfo?,
    val nbnsName: String?
)

data class MdnsService(
    val serviceType: String,  // ex: "_googlecast._tcp"
    val instanceName: String,
    val txtRecords: Map<String, String>
)

data class SsdpBasicInfo(
    val usn: String?,
    val server: String?,
    val location: String?  // URL para descrição XML
)

enum class DiscoveryMethod {
    ICMP_PING, TCP_PROBE, MDNS_BROWSE,
    SSDP_MSEARCH, NBNS_BROADCAST, PASSIVE_MDNS
}
```

### 6.2 Implementação do HostDiscoveryEngine

```kotlin
class HostDiscoveryEngineImpl : HostDiscoveryEngine {

    private val PROBE_PORTS = listOf(80, 443, 22, 53, 139, 445, 8080, 8443, 554, 7547, 5000, 631, 9100)
    private val TCP_TIMEOUT_MS = 300L
    private val ICMP_TIMEOUT_MS = 500L
    private val PARALLEL_WORKERS = 48

    override fun discover(gatewayInfo: GatewayInfo, timeoutMs: Long): Flow<DiscoveredHost> = channelFlow {
        val hosts = ConcurrentHashMap<String, DiscoveredHost>()
        val scope = this

        fun emit(host: DiscoveredHost) {
            hosts.merge(host.ip, host) { existing, new ->
                existing.copy(
                    discoveredVia = existing.discoveredVia + new.discoveredVia,
                    openPorts = existing.openPorts + new.openPorts,
                    mdnsServices = (existing.mdnsServices + new.mdnsServices).distinctBy { it.serviceType + it.instanceName },
                    ssdpInfo = new.ssdpInfo ?: existing.ssdpInfo,
                    nbnsName = new.nbnsName ?: existing.nbnsName
                )
            }
            scope.trySend(hosts[host.ip]!!)
        }

        val ipRange = IpUtils.hostRange(gatewayInfo.subnetBase, gatewayInfo.subnetPrefix)

        // Garante que o gateway está na lista (pode não estar no range /24 se for 192.168.1.1 em /16)
        val ipsToScan = (listOf(gatewayInfo.gatewayIp.hostAddress!!) + ipRange).distinct()

        withTimeoutOrNull(timeoutMs) {
            // Técnicas em paralelo
            val activeJob = launch {
                // Pool de workers para ICMP + TCP por IP
                ipsToScan.asFlow()
                    .buffer(PARALLEL_WORKERS)
                    .flatMapMerge(concurrency = PARALLEL_WORKERS) { ip ->
                        flow {
                            val icmpAlive = IcmpProbe.isReachable(ip, ICMP_TIMEOUT_MS)
                            val openPorts = TcpProbe.probe(ip, PROBE_PORTS, TCP_TIMEOUT_MS)
                            if (icmpAlive || openPorts.isNotEmpty()) {
                                emit(DiscoveredHost(
                                    ip = ip,
                                    discoveredVia = buildSet {
                                        if (icmpAlive) add(DiscoveryMethod.ICMP_PING)
                                        if (openPorts.isNotEmpty()) add(DiscoveryMethod.TCP_PROBE)
                                    },
                                    openPorts = openPorts.toSet(),
                                    mdnsServices = emptyList(),
                                    ssdpInfo = null,
                                    nbnsName = null
                                ))
                            }
                        }
                    }
                    .collect { emit(it) }
            }

            val mdnsJob = launch {
                MdnsBrowser.browse().collect { (ip, services) ->
                    emit(DiscoveredHost(
                        ip = ip,
                        discoveredVia = setOf(DiscoveryMethod.MDNS_BROWSE),
                        openPorts = emptySet(),
                        mdnsServices = services,
                        ssdpInfo = null,
                        nbnsName = null
                    ))
                }
            }

            val ssdpJob = launch {
                SsdpDiscovery.search().collect { (ip, ssdpInfo) ->
                    emit(DiscoveredHost(
                        ip = ip,
                        discoveredVia = setOf(DiscoveryMethod.SSDP_MSEARCH),
                        openPorts = emptySet(),
                        mdnsServices = emptyList(),
                        ssdpInfo = ssdpInfo,
                        nbnsName = null
                    ))
                }
            }

            val nbnsJob = launch {
                NbnsProbe.queryBroadcast(gatewayInfo.subnetBase, gatewayInfo.subnetPrefix)
                    .collect { (ip, name) ->
                        emit(DiscoveredHost(
                            ip = ip,
                            discoveredVia = setOf(DiscoveryMethod.NBNS_BROADCAST),
                            openPorts = emptySet(),
                            mdnsServices = emptyList(),
                            ssdpInfo = null,
                            nbnsName = name
                        ))
                    }
            }

            activeJob.join()
            delay(2000) // aguarda respostas tardias de mDNS/SSDP/NBNS
            listOf(mdnsJob, ssdpJob, nbnsJob).forEach { it.cancel() }
        }
    }.flowOn(Dispatchers.IO)
}
```

### 6.3 IcmpProbe

```kotlin
object IcmpProbe {
    /**
     * Tenta ICMP echo via InetAddress.isReachable().
     * No Android sem root, recai em TCP echo (porta 7) quando ICMP não
     * é permitido. Fallback: ping do sistema via Runtime.exec().
     */
    suspend fun isReachable(ip: String, timeoutMs: Long): Boolean =
        withContext(Dispatchers.IO) {
            try {
                val addr = InetAddress.getByName(ip)
                if (addr.isReachable(timeoutMs.toInt())) return@withContext true
                // Fallback: shell ping (mais confiável em Android para ICMP real)
                pingViaShell(ip, timeoutMs)
            } catch (e: Exception) {
                false
            }
        }

    private fun pingViaShell(ip: String, timeoutMs: Long): Boolean = try {
        val timeoutSec = maxOf(1, (timeoutMs / 1000).toInt())
        val proc = Runtime.getRuntime().exec(
            arrayOf("/system/bin/ping", "-c", "1", "-W", "$timeoutSec", ip)
        )
        proc.waitFor(timeoutMs + 500, TimeUnit.MILLISECONDS) && proc.exitValue() == 0
    } catch (e: Exception) {
        false
    }
}
```

### 6.4 TcpProbe

```kotlin
object TcpProbe {
    suspend fun probe(ip: String, ports: List<Int>, timeoutMs: Long): List<Int> =
        withContext(Dispatchers.IO) {
            ports.filter { port ->
                try {
                    Socket().use { socket ->
                        socket.connect(InetSocketAddress(ip, port), timeoutMs.toInt())
                        true
                    }
                } catch (e: Exception) {
                    false
                }
            }
        }
}
```

### 6.5 MdnsBrowser

```kotlin
/**
 * Browseia os service types mDNS mais comuns via NsdManager.
 * Emite pares (IP, List<MdnsService>) à medida que serviços são descobertos.
 *
 * Referência: developer.android.com/develop/connectivity/wifi/use-nsd
 * Nota: NsdManager tem limitações em redes com AP isolation — nesse caso,
 * a resolução de `*.local` em Android 12+ pode funcionar via getaddrinfo().
 */
object MdnsBrowser {

    private val SERVICE_TYPES = listOf(
        "_http._tcp",
        "_https._tcp",
        "_services._dns-sd._udp",
        "_googlecast._tcp",        // Chromecast, Google TV
        "_airplay._tcp",           // Apple TV, AirPlay
        "_spotify-connect._tcp",   // Spotify Connect
        "_printer._tcp",
        "_ipp._tcp",               // IPP printing
        "_workstation._tcp",       // avahi/Linux hosts
        "_smb._tcp",               // Samba/Windows shares
        "_homekit._tcp",           // Apple HomeKit
        "_matter._tcp",            // Matter/Thread IoT
        "_hap._tcp",               // HomeKit Accessory Protocol
        "_nvstream._tcp",          // NVIDIA GameStream
        "_androidtvremote2._tcp",  // Android TV
        "_eero._tcp",              // Eero mesh nodes
        "_dnssd._udp"
    )

    fun browse(): Flow<Pair<String, List<MdnsService>>> = callbackFlow {
        val nsd = context.getSystemService(NsdManager::class.java)
        val discovered = ConcurrentHashMap<String, MutableList<MdnsService>>()
        val listeners = mutableListOf<NsdManager.DiscoveryListener>()

        for (serviceType in SERVICE_TYPES) {
            val listener = object : NsdManager.DiscoveryListener {
                override fun onStartDiscoveryFailed(st: String, ec: Int) {}
                override fun onStopDiscoveryFailed(st: String, ec: Int) {}
                override fun onDiscoveryStarted(st: String) {}
                override fun onDiscoveryStopped(st: String) {}
                override fun onServiceLost(si: NsdServiceInfo) {}

                override fun onServiceFound(serviceInfo: NsdServiceInfo) {
                    nsd.resolveService(serviceInfo, object : NsdManager.ResolveListener {
                        override fun onResolveFailed(si: NsdServiceInfo, ec: Int) {}
                        override fun onServiceResolved(si: NsdServiceInfo) {
                            val ip = si.host?.hostAddress ?: return
                            val svc = MdnsService(
                                serviceType = si.serviceType,
                                instanceName = si.serviceName,
                                txtRecords = si.attributes.mapValues { (_, v) ->
                                    v?.decodeToString() ?: ""
                                }
                            )
                            discovered.getOrPut(ip) { mutableListOf() }.add(svc)
                            trySend(ip to discovered[ip]!!.toList())
                        }
                    })
                }
            }
            listeners += listener
            try { nsd.discoverServices(serviceType, NsdManager.PROTOCOL_DNS_SD, listener) }
            catch (e: Exception) { /* service type pode já estar sendo browsed */ }
        }

        awaitClose {
            listeners.forEach { l ->
                try { nsd.stopServiceDiscovery(l) } catch (e: Exception) {}
            }
        }
    }.flowOn(Dispatchers.IO)
}
```

### 6.6 SsdpDiscovery

```kotlin
/**
 * Envia M-SEARCH via multicast UDP 239.255.255.250:1900 e coleta respostas.
 * Referência: UPnP Device Architecture 2.0 — Section 1.3.2
 * Open-source de referência: custanator/android-upnp-discovery (GitHub)
 */
object SsdpDiscovery {

    private const val SSDP_ADDR = "239.255.255.250"
    private const val SSDP_PORT = 1900
    private const val RESPONSE_TIMEOUT_MS = 3000L

    private val MSEARCH_PAYLOAD = """
        M-SEARCH * HTTP/1.1\r\n
        HOST: 239.255.255.250:1900\r\n
        MAN: "ssdp:discover"\r\n
        MX: 3\r\n
        ST: ssdp:all\r\n
        \r\n
    """.trimIndent().replace("\n", "\r\n")

    fun search(): Flow<Pair<String, SsdpBasicInfo>> = callbackFlow {
        withContext(Dispatchers.IO) {
            val socket = MulticastSocket(0).apply {
                reuseAddress = true
                soTimeout = RESPONSE_TIMEOUT_MS.toInt()
                loopbackMode = false
                timeToLive = 4
            }
            try {
                val group = InetAddress.getByName(SSDP_ADDR)
                val payload = MSEARCH_PAYLOAD.toByteArray(Charsets.UTF_8)
                val sendPacket = DatagramPacket(payload, payload.size, group, SSDP_PORT)
                socket.send(sendPacket)

                val buffer = ByteArray(2048)
                val deadline = System.currentTimeMillis() + RESPONSE_TIMEOUT_MS
                while (System.currentTimeMillis() < deadline && isActive) {
                    try {
                        val recv = DatagramPacket(buffer, buffer.size)
                        socket.receive(recv)
                        val ip = recv.address.hostAddress ?: continue
                        val response = String(recv.data, 0, recv.length)
                        val info = parseSsdpResponse(response)
                        trySend(ip to info)
                    } catch (e: SocketTimeoutException) {
                        break
                    }
                }
            } finally {
                socket.close()
            }
        }
        close()
    }.flowOn(Dispatchers.IO)

    private fun parseSsdpResponse(raw: String): SsdpBasicInfo {
        val headers = raw.lines().drop(1).associate { line ->
            val idx = line.indexOf(':')
            if (idx < 0) "" to ""
            else line.substring(0, idx).trim().lowercase() to line.substring(idx + 1).trim()
        }
        return SsdpBasicInfo(
            usn = headers["usn"],
            server = headers["server"],
            location = headers["location"]
        )
    }
}
```

### 6.7 NbnsProbe

```kotlin
/**
 * Envia NetBIOS Name Service Node Status broadcast (RFC 1002).
 * Útil para PCs Windows, NAS com Samba, e alguns roteadores antigos.
 * Não esperar resultados em redes modernas com AP isolation ou em Android 13+.
 */
object NbnsProbe {

    private const val NBNS_PORT = 137
    private const val TIMEOUT_MS = 2000

    /**
     * Envia query broadcast para toda a subnet e coleta respostas.
     * Alternativamente, envie unicast para cada IP descoberto em outros probes.
     */
    fun queryBroadcast(subnetBase: InetAddress, prefix: Int): Flow<Pair<String, String>> =
        flow {
            val broadcastIp = IpUtils.broadcastAddress(subnetBase, prefix)
            val socket = DatagramSocket(0)
            socket.soTimeout = TIMEOUT_MS
            socket.setBroadcast(true)

            try {
                val query = buildNbnsNodeStatusQuery()
                socket.send(DatagramPacket(query, query.size,
                    InetAddress.getByName(broadcastIp), NBNS_PORT))

                val buffer = ByteArray(1024)
                val deadline = System.currentTimeMillis() + TIMEOUT_MS
                while (System.currentTimeMillis() < deadline) {
                    try {
                        val recv = DatagramPacket(buffer, buffer.size)
                        socket.receive(recv)
                        val ip = recv.address.hostAddress ?: continue
                        val name = parseNbnsResponse(recv.data, recv.length)
                        if (name != null) emit(ip to name)
                    } catch (e: SocketTimeoutException) { break }
                }
            } finally {
                socket.close()
            }
        }.flowOn(Dispatchers.IO)

    // NBNS Node Status query: transaction ID aleatório, FLAGS=0x0010, QDCOUNT=1
    // Question: "*\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0" (wildcard), QTYPE=0x21, QCLASS=0x01
    private fun buildNbnsNodeStatusQuery(): ByteArray {
        val txId = (Math.random() * 0xFFFF).toInt()
        return byteArrayOf(
            (txId shr 8).toByte(), txId.toByte(),
            0x00, 0x10,             // FLAGS: recursion desired, broadcast
            0x00, 0x01,             // QDCOUNT = 1
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // ANCOUNT, NSCOUNT, ARCOUNT
            0x20,                   // tamanho do nome (32 chars encoded)
            // Nome "*" codificado em NetBIOS First-Level Encoding:
            0x43, 0x4B, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41,
            0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41,
            0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41,
            0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41, 0x41,
            0x00,                   // fim do nome
            0x00, 0x21,             // QTYPE = NBSTAT (0x21)
            0x00, 0x01              // QCLASS = IN
        )
    }

    private fun parseNbnsResponse(data: ByteArray, len: Int): String? {
        if (len < 57) return null
        // Byte 56 = número de nomes na tabela
        val numNames = data[56].toInt() and 0xFF
        if (numNames == 0 || len < 57 + numNames * 18) return null
        // Cada entrada: 15 bytes de nome + 1 byte de flags + 2 bytes de nome flags
        val rawName = String(data, 57, 15, Charsets.ISO_8859_1).trimEnd()
        return rawName.takeIf { it.isNotBlank() && !it.startsWith("\u0000") }
    }
}
```

---

## 7. Módulo 4 — HostEnrichment

**Responsabilidade:** dado um `DiscoveredHost`, tentar obter hostname, tipo de dispositivo, modelo e fabricante. Retorna `NetworkDevice` enriquecido.

### 7.1 Interface pública

```kotlin
interface HostEnrichmentEngine {
    /**
     * Enriquece um host descoberto com hostname, tipo e informações adicionais.
     * Executa enrichers em sequência de prioridade, parando quando tem nome.
     */
    suspend fun enrich(
        host: DiscoveredHost,
        gatewayIp: String
    ): NetworkDevice
}
```

### 7.2 Chain de resolução de hostname (por prioridade)

| Prioridade | Fonte | Confiança | Condições |
|---|---|---|---|
| 1 | mDNS TXT record (`fn` ou `md` attr) | Alta | Host respondeu mDNS |
| 2 | SSDP XML `friendlyName` | Alta | Host tem porta SSDP com location URL |
| 3 | mDNS PTR record (`instanceName`) | Média-alta | Host tem mDNS |
| 4 | NetBIOS hostname | Média | Host respondeu NBNS |
| 5 | Reverse DNS PTR | Baixa | Roteador tem PTR records |
| 6 | OUI vendor + tipo inferido | Baixa | Sempre disponível |

### 7.3 DeviceType e classificação

```kotlin
enum class DeviceType {
    ROUTER_CPE,       // gateway / roteador principal
    MESH_NODE,        // nó adicional de rede mesh
    WIFI_EXTENDER,    // repetidor simples
    SMART_TV,
    STREAMING_DEVICE, // Chromecast, AppleTV, Fire TV
    SMART_SPEAKER,    // Echo, Google Home, Sonos
    PHONE,
    TABLET,
    LAPTOP,
    DESKTOP,
    NAS,
    PRINTER,
    GAME_CONSOLE,
    SMART_HOME_HUB,   // Philips Hue Bridge, SmartThings Hub
    CAMERA_IP,
    IOT_DEVICE,       // dispositivos genéricos IoT
    UNKNOWN
}

data class NetworkDevice(
    val ip: String,
    val hostname: String?,
    val friendlyName: String?,       // melhor nome disponível para exibir
    val macAddress: String?,         // disponível apenas quando acessível
    val vendorName: String?,         // da base OUI
    val vendorOui: String?,          // 3 bytes hex
    val deviceType: DeviceType,
    val wifiStandard: WifiStandard?, // se for AP/router
    val openPorts: Set<Int>,
    val services: List<String>,      // lista humanizada: "HTTP", "SMB", "AirPlay"
    val discoveredVia: Set<DiscoveryMethod>,
    val isGateway: Boolean,
    val rawApCaps: ApCapabilities?,  // preenchido se for AP/router com Wi-Fi
    val confidence: Float            // 0.0–1.0 confiança na identificação
)
```

### 7.4 SsdpXmlEnricher — extrai `friendlyName` da descrição UPnP

```kotlin
class SsdpXmlEnricher {
    suspend fun enrich(locationUrl: String): SsdpDeviceInfo? =
        withContext(Dispatchers.IO) {
            try {
                val conn = URL(locationUrl).openConnection() as HttpURLConnection
                conn.connectTimeout = 2000
                conn.readTimeout = 2000
                val xml = conn.inputStream.reader().readText()
                parseUPnPDescription(xml)
            } catch (e: Exception) { null }
        }

    data class SsdpDeviceInfo(
        val friendlyName: String?,
        val manufacturer: String?,
        val modelName: String?,
        val modelNumber: String?,
        val deviceType: String?,
        val serialNumber: String?
    )

    private fun parseUPnPDescription(xml: String): SsdpDeviceInfo {
        // XmlPullParser é mais leve que DOM em Android
        val parser = Xml.newPullParser()
        parser.setInput(xml.reader())
        var event = parser.eventType
        var inDevice = false
        val fields = mutableMapOf<String, String>()
        var currentTag = ""

        while (event != XmlPullParser.END_DOCUMENT) {
            when (event) {
                XmlPullParser.START_TAG -> {
                    currentTag = parser.name
                    if (currentTag == "device") inDevice = true
                }
                XmlPullParser.TEXT -> {
                    if (inDevice && currentTag in setOf(
                        "friendlyName", "manufacturer", "modelName",
                        "modelNumber", "deviceType", "serialNumber"
                    )) {
                        fields[currentTag] = parser.text.trim()
                    }
                }
                XmlPullParser.END_TAG -> {
                    if (parser.name == "device") inDevice = false
                    currentTag = ""
                }
            }
            event = parser.next()
        }

        return SsdpDeviceInfo(
            friendlyName = fields["friendlyName"],
            manufacturer = fields["manufacturer"],
            modelName = fields["modelName"],
            modelNumber = fields["modelNumber"],
            deviceType = fields["deviceType"],
            serialNumber = fields["serialNumber"]
        )
    }
}
```

### 7.5 HttpBannerEnricher — identifica roteador pelo admin HTTP

```kotlin
/**
 * Tenta acessar a admin UI do dispositivo (portas 80, 443, 8080, 8443)
 * e extrai informações do <title> e header Server:.
 * Útil principalmente para o gateway/CPE.
 */
class HttpBannerEnricher {
    suspend fun enrich(ip: String, ports: Set<Int>): RouterBannerInfo? =
        withContext(Dispatchers.IO) {
            val httpPorts = ports.intersect(setOf(80, 8080, 443, 8443))
            if (httpPorts.isEmpty()) return@withContext null

            for (port in httpPorts.sortedBy { if (it == 80) 0 else 1 }) {
                val scheme = if (port == 443 || port == 8443) "https" else "http"
                try {
                    val conn = URL("$scheme://$ip:$port/").openConnection() as HttpURLConnection
                    conn.connectTimeout = 1500
                    conn.readTimeout = 1500
                    conn.instanceFollowRedirects = false
                    // Não precisamos do body completo — só header e primeiras linhas
                    val server = conn.getHeaderField("Server")
                    val html = conn.inputStream.bufferedReader()
                        .readText().take(4096)
                    val title = Regex("<title[^>]*>(.*?)</title>", RegexOption.IGNORE_CASE)
                        .find(html)?.groupValues?.get(1)?.trim()
                    conn.disconnect()
                    if (server != null || title != null) {
                        return@withContext RouterBannerInfo(
                            serverHeader = server,
                            pageTitle = title,
                            port = port
                        )
                    }
                } catch (e: Exception) { /* tenta próxima porta */ }
            }
            null
        }

    data class RouterBannerInfo(
        val serverHeader: String?,
        val pageTitle: String?,
        val port: Int
    )
}
```

### 7.6 DeviceClassifier — regras de inferência de tipo

```kotlin
/**
 * Classifica o tipo do dispositivo com base nas informações coletadas.
 * Ordem de confiança: SSDP deviceType > mDNS service > OUI + portas.
 */
object DeviceClassifier {

    fun classify(
        host: DiscoveredHost,
        ssdpInfo: SsdpXmlEnricher.SsdpDeviceInfo?,
        ouiVendor: String?,
        isGateway: Boolean,
        bannerInfo: HttpBannerEnricher.RouterBannerInfo?
    ): Pair<DeviceType, Float> {

        if (isGateway) return DeviceType.ROUTER_CPE to 0.9f

        // SSDP deviceType string (UPnP)
        ssdpInfo?.deviceType?.let { dt ->
            return when {
                "InternetGatewayDevice" in dt -> DeviceType.ROUTER_CPE to 0.95f
                "MediaRenderer" in dt || "MediaServer" in dt -> DeviceType.SMART_TV to 0.8f
                "WLANAccessPoint" in dt -> DeviceType.MESH_NODE to 0.85f
                "Printer" in dt -> DeviceType.PRINTER to 0.95f
                else -> null
            } ?: (DeviceType.UNKNOWN to 0.0f)
        }

        // mDNS service types
        val serviceTypes = host.mdnsServices.map { it.serviceType }.toSet()
        val serviceResult = when {
            "_googlecast._tcp" in serviceTypes -> DeviceType.STREAMING_DEVICE to 0.9f
            "_airplay._tcp" in serviceTypes -> DeviceType.STREAMING_DEVICE to 0.85f
            "_androidtvremote2._tcp" in serviceTypes -> DeviceType.SMART_TV to 0.9f
            "_printer._tcp" in serviceTypes || "_ipp._tcp" in serviceTypes -> DeviceType.PRINTER to 0.9f
            "_homekit._tcp" in serviceTypes || "_hap._tcp" in serviceTypes -> DeviceType.SMART_HOME_HUB to 0.8f
            "_eero._tcp" in serviceTypes -> DeviceType.MESH_NODE to 0.9f
            "_nvstream._tcp" in serviceTypes -> DeviceType.DESKTOP to 0.7f
            "_smb._tcp" in serviceTypes || "_workstation._tcp" in serviceTypes -> DeviceType.DESKTOP to 0.7f
            else -> null
        }
        if (serviceResult != null) return serviceResult

        // Portas abertas
        val portResult = when {
            9100 in host.openPorts -> DeviceType.PRINTER to 0.85f
            554 in host.openPorts -> DeviceType.CAMERA_IP to 0.75f
            // 7547 = TR-069 (CWMP) — CPE gerenciado por ISP
            7547 in host.openPorts -> DeviceType.ROUTER_CPE to 0.8f
            else -> null
        }
        if (portResult != null) return portResult

        // HTTP banner
        bannerInfo?.let { banner ->
            val text = listOfNotNull(banner.pageTitle, banner.serverHeader)
                .joinToString(" ").lowercase()
            val routerKeywords = listOf("router", "roteador", "gateway", "modem",
                "tp-link", "asus", "netgear", "d-link", "xiaomi", "intelbras",
                "huawei", "zte", "nokia", "arris", "sagemcom", "technicolor")
            if (routerKeywords.any { it in text }) {
                return DeviceType.ROUTER_CPE to 0.75f
            }
        }

        // OUI fallback
        val vendor = ouiVendor?.lowercase() ?: ""
        return when {
            listOf("apple", "samsung", "xiaomi", "google", "oneplus", "oppo", "vivo",
                "realme", "motorola", "lg").any { it in vendor } ->
                DeviceType.PHONE to 0.5f
            listOf("intel", "lenovo", "dell", "hp", "asus", "acer",
                "microsoft").any { it in vendor } ->
                DeviceType.LAPTOP to 0.5f
            listOf("amazon").any { it in vendor } -> DeviceType.SMART_SPEAKER to 0.6f
            listOf("synology", "qnap", "western digital",
                "wd").any { it in vendor } -> DeviceType.NAS to 0.7f
            listOf("sony", "nintendo", "microsoft").any { it in vendor } ->
                DeviceType.GAME_CONSOLE to 0.55f
            else -> DeviceType.UNKNOWN to 0.0f
        }
    }
}
```

---

## 8. Módulo 5 — OuiDatabase

**Responsabilidade:** resolver os 3 primeiros octetos de um MAC address no nome do fabricante, usando uma base offline embarcada e atualização assíncrona em background.

### 8.1 Estratégia de dados

A IEEE publica as bases OUI gratuitamente em formato CSV:

- **MA-L (24-bit, ~38k entradas):** `https://standards-oui.ieee.org/oui/oui.csv`
- **MA-M (28-bit, ~7k entradas):** `https://standards-oui.ieee.org/oui28/mam.csv`
- **MA-S (36-bit/IAB, ~6k entradas):** `https://standards-oui.ieee.org/oui36/oui36.csv`

**Distribuição:** incluir snapshot das bases MA-L + MA-M em um arquivo SQLite na `assets/` do app. Atualizar via `WorkManager` quando o app estiver com Wi-Fi e carregando.

### 8.2 Schema SQLite

```sql
CREATE TABLE IF NOT EXISTS oui (
    prefix TEXT PRIMARY KEY,   -- ex: "A4:C3:F0" ou "A4:C3:F0:20" (MA-M)
    vendor  TEXT NOT NULL,
    type    TEXT NOT NULL      -- "MA-L", "MA-M", "MA-S"
);
CREATE INDEX IF NOT EXISTS idx_oui_prefix ON oui(prefix);
```

### 8.3 Interface pública

```kotlin
interface OuiDatabase {
    /** Retorna nome do fabricante para o OUI de 3 bytes. Ex: "A4:C3:F0" → "Apple Inc." */
    suspend fun lookup(oui: String): String?

    /** Extrai OUI dos primeiros 3 bytes de um MAC address. */
    fun extractOui(macAddress: String): String =
        macAddress.split(":").take(3).joinToString(":").uppercase()
}
```

### 8.4 OuiUpdateWorker

```kotlin
class OuiUpdateWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val urls = listOf(
                "https://standards-oui.ieee.org/oui/oui.csv",
                "https://standards-oui.ieee.org/oui28/mam.csv"
            )
            val db = OuiDatabaseImpl.getInstance(applicationContext)
            for (url in urls) {
                val csv = URL(url).readText()
                db.importCsv(csv)
            }
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }

    companion object {
        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<OuiUpdateWorker>(30, TimeUnit.DAYS)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.UNMETERED)
                        .setRequiresBatteryNotLow(true)
                        .build()
                )
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "oui_update",
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }
    }
}
```

---

## 9. Módulo 6 — ScanOrchestrator

**Ponto de entrada único da feature.** Expõe `StateFlow<ScanState>` para a UI e `Flow<NetworkDevice>` para receber dispositivos progressivamente.

### 9.1 Interface pública

```kotlin
interface ScanOrchestrator {
    val state: StateFlow<ScanState>
    val devices: StateFlow<List<NetworkDevice>>
    val gatewayInfo: StateFlow<GatewayInfo?>
    val apInfo: StateFlow<ApCapabilities?>

    suspend fun startScan()
    fun cancelScan()
}
```

### 9.2 ScanState

```kotlin
sealed class ScanState {
    object Idle : ScanState()

    data class CheckingPermissions(
        val missing: List<String>
    ) : ScanState()

    object GatheringNetworkInfo : ScanState()   // ~0.5s
    object ScanningAps : ScanState()            // ~1s
    data class Discovering(
        val progress: Float,                    // 0.0–1.0
        val hostsFound: Int
    ) : ScanState()
    data class Enriching(
        val progress: Float,
        val total: Int
    ) : ScanState()
    data class Complete(
        val durationMs: Long,
        val deviceCount: Int
    ) : ScanState()

    data class Error(
        val type: ScanErrorType,
        val message: String
    ) : ScanState()
}

enum class ScanErrorType {
    PERMISSION_DENIED,
    WIFI_DISCONNECTED,
    LOCATION_DISABLED,
    AP_ISOLATION_DETECTED,  // nenhum host respondeu além do gateway
    SCAN_THROTTLED,
    UNKNOWN
}
```

### 9.3 Implementação do Orchestrator

```kotlin
class ScanOrchestratorImpl(
    private val gatewayProvider: GatewayInfoProvider,
    private val apProvider: AccessPointInfoProvider,
    private val discoveryEngine: HostDiscoveryEngine,
    private val enrichmentEngine: HostEnrichmentEngine,
    private val scope: CoroutineScope
) : ScanOrchestrator {

    private val _state = MutableStateFlow<ScanState>(ScanState.Idle)
    override val state = _state.asStateFlow()

    private val _devices = MutableStateFlow<List<NetworkDevice>>(emptyList())
    override val devices = _devices.asStateFlow()

    private val _gatewayInfo = MutableStateFlow<GatewayInfo?>(null)
    override val gatewayInfo = _gatewayInfo.asStateFlow()

    private val _apInfo = MutableStateFlow<ApCapabilities?>(null)
    override val apInfo = _apInfo.asStateFlow()

    private var scanJob: Job? = null

    override suspend fun startScan() {
        scanJob?.cancel()
        scanJob = scope.launch {
            val startTime = System.currentTimeMillis()
            try {
                _state.value = ScanState.GatheringNetworkInfo

                // Etapa 1: info de rede
                val gw = gatewayProvider.get()
                if (gw == null) {
                    _state.value = ScanState.Error(
                        ScanErrorType.WIFI_DISCONNECTED, "Não conectado a Wi-Fi")
                    return@launch
                }
                _gatewayInfo.value = gw

                // Etapa 2: info do AP
                _state.value = ScanState.ScanningAps
                val ap = apProvider.getConnectedAp()
                _apInfo.value = ap

                // Etapa 3: descoberta de hosts
                val totalIps = IpUtils.hostRange(gw.subnetBase, gw.subnetPrefix).size.toFloat()
                var scannedCount = 0
                val discovered = mutableListOf<DiscoveredHost>()

                _state.value = ScanState.Discovering(0f, 0)

                discoveryEngine.discover(gw, timeoutMs = 20_000L)
                    .collect { host ->
                        discovered += host
                        scannedCount++
                        _state.value = ScanState.Discovering(
                            progress = (scannedCount / totalIps).coerceIn(0f, 1f),
                            hostsFound = discovered.size
                        )
                    }

                // Detectar AP isolation: se 0 hosts além do gateway
                val nonGatewayHosts = discovered.filter { it.ip != gw.gatewayIp.hostAddress }
                if (nonGatewayHosts.isEmpty() && discovered.size <= 1) {
                    _state.value = ScanState.Error(
                        ScanErrorType.AP_ISOLATION_DETECTED,
                        "Rede com isolamento de clientes ativo"
                    )
                    // Não retorna — ainda mostra o gateway como resultado parcial
                }

                // Etapa 4: enriquecimento
                val enriched = mutableListOf<NetworkDevice>()
                discovered.forEachIndexed { idx, host ->
                    _state.value = ScanState.Enriching(
                        progress = idx / discovered.size.toFloat(),
                        total = discovered.size
                    )
                    val device = enrichmentEngine.enrich(host, gw.gatewayIp.hostAddress!!)
                    enriched += device
                    _devices.value = enriched.sortedWith(
                        compareByDescending<NetworkDevice> { it.isGateway }
                            .thenBy { it.ip }
                    )
                }

                _state.value = ScanState.Complete(
                    durationMs = System.currentTimeMillis() - startTime,
                    deviceCount = enriched.size
                )

            } catch (e: CancellationException) {
                _state.value = ScanState.Idle
            } catch (e: Exception) {
                _state.value = ScanState.Error(ScanErrorType.UNKNOWN, e.message ?: "Erro desconhecido")
            }
        }
    }

    override fun cancelScan() {
        scanJob?.cancel()
        _state.value = ScanState.Idle
    }
}
```

---

## 10. Modelos de Dados

### 10.1 ScanReport — resultado final persistível

```kotlin
@Serializable
data class ScanReport(
    val id: String = UUID.randomUUID().toString(),
    val timestamp: Long = System.currentTimeMillis(),
    val durationMs: Long,
    val ssid: String?,
    val gatewayIp: String,
    val subnetCidr: String,             // ex: "192.168.1.0/24"
    val apCapabilities: ApCapabilities?,
    val devices: List<NetworkDevice>,
    val apIsolationDetected: Boolean,
    val meshNodes: List<ApCapabilities>  // APs com mesmo SSID e BSSIDs distintos
) {
    val deviceCount: Int get() = devices.size
    val routerInfo: NetworkDevice? get() = devices.firstOrNull { it.isGateway }
    val meshNodeCount: Int get() = meshNodes.size
}
```

---

## 11. UX — Estados e Fluxo

### 11.1 Tela de scan — mapa de estados

```
┌─────────────────────────────────────────────────────┐
│  IDLE                                               │
│  Botão "Escanear Rede" ativo                        │
└──────────────────────┬──────────────────────────────┘
                       │ tap
┌──────────────────────▼──────────────────────────────┐
│  CHECKING PERMISSIONS                               │
│  Se faltar: sheet de rationale + botão p/ Settings  │
└──────────────────────┬──────────────────────────────┘
                       │ granted
┌──────────────────────▼──────────────────────────────┐
│  GATHERING NETWORK INFO                             │
│  "Lendo configurações da rede..."                   │
│  → Mostra: SSID atual + banda + padrão Wi-Fi        │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  DISCOVERING                                        │
│  Progress bar animada                               │
│  "Encontrados: X dispositivos"                      │
│  Lista cresce em tempo real (cada dispositivo       │
│  aparece com animação de entrada conforme descoberto)│
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  ENRICHING                                          │
│  "Identificando dispositivos... X/Y"                │
│  Cards já aparecem, atualizam com nome/fabricante   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  COMPLETE                                           │
│  Header: "X dispositivos · Y s"                    │
│  Card especial do gateway/roteador no topo          │
│  Lista de dispositivos agrupada por tipo            │
│  Botão "Escanear Novamente" (respeita throttle)     │
└─────────────────────────────────────────────────────┘
```

### 11.2 Card do roteador (gateway)

Elemento de destaque no topo da tela de resultado:

```
┌─────────────────────────────────────────────────────┐
│ 🟣 Roteador                           [TP-Link]     │
│                                                     │
│ TP-Link Archer C6                                   │
│ 192.168.1.1 · A4:C3:F0:xx:xx:xx                    │
│                                                     │
│ ████████████████ Wi-Fi 5 (802.11ac)                 │
│ 5 GHz · Canal 36 · 80 MHz · MU-MIMO ✓              │
│ RSSI: -42 dBm · 433 Mbps ↓ · 433 Mbps ↑           │
│                                                     │
│ DNS: 8.8.8.8, 8.8.4.4                              │
│ DHCP: 192.168.1.1                                   │
└─────────────────────────────────────────────────────┘
```

### 11.3 Card de dispositivo comum

```
┌────────────────────────────────────────┐
│ 📱 iPhone de Ana                       │
│ 192.168.1.105 · Apple Inc.             │
│ mDNS: _airplay, _homekit               │
└────────────────────────────────────────┘
```

### 11.4 Alerta de AP Isolation

Quando detectado (0 dispositivos além do gateway), exibir banner de alerta:

```
⚠️ Isolamento de clientes ativo
Os dispositivos nesta rede não conseguem
ver uns aos outros. Diagnóstico de rede
completo não está disponível.
[Saiba mais]
```

### 11.5 Progressividade obrigatória

A lista de dispositivos **deve crescer em tempo real** conforme os hosts são descobertos. Não esperar o scan completo para mostrar resultados. Cada novo dispositivo entra com animação de slide/fade. O estado `Enriching` atualiza os cards existentes no lugar (não reinicia a lista).

### 11.6 Nós mesh

Se o SSID atual tiver mais de um BSSID nos scan results, mostrar seção separada:

```
Rede mesh · 3 nós detectados
• Nó principal  192.168.1.1  5 GHz  Canal 36  -42 dBm  [conectado]
• Nó sala       192.168.1.2  5 GHz  Canal 40  -61 dBm
• Nó quarto     192.168.1.3  2.4 GHz Canal 6  -74 dBm
```

---

## 12. Tratamento de Erros e Casos de Borda

| Situação | Detecção | Resposta ao usuário |
|---|---|---|
| Wi-Fi desconectado | `GatewayInfo` retorna null | "Conecte-se a uma rede Wi-Fi para escanear" |
| Location desabilitado | `isLocationEnabled()` false | "Ative a Localização nas configurações do Android para escanear redes Wi-Fi" |
| Permissão negada | `hasAllRequired()` false | Bottom sheet com explicação + botão para Settings |
| AP isolation | 0 hosts além do gateway | Alerta contextual, scan parcial ainda mostrado |
| Rede /16 ou maior | Range > 512 hosts | Cap em 512, avisar usuário "Rede grande — scan limitado aos primeiros 512 IPs" |
| Private DNS (DoH/DoT) ativo | `isPrivateDnsActive` true | Info no card do roteador: "DNS over TLS ativo" (não é erro) |
| Scan throttled | `startScan()` retorna false | Mostrar cache dos últimos results + timestamp |
| Timeout geral | `withTimeoutOrNull` | Mostrar resultados parciais com label "Scan incompleto" |
| VPN ativa | `TRANSPORT_VPN` nas capabilities | Aviso: "VPN detectada — scan de rede local pode estar limitado" |

---

## 13. Performance e Bateria

### 13.1 Constraints de performance

| Métrica | Target |
|---|---|
| Tempo total de scan (/24) | < 20 segundos |
| Primeiros hosts na tela | < 3 segundos |
| CPU uso médio durante scan | < 35% |
| Memória adicional | < 50 MB |
| Bateria por scan completo | < 1% |

### 13.2 Otimizações obrigatórias

**Parallelismo:** usar `flatMapMerge(concurrency = 48)` para os probes IP. Nunca fazer scan sequencial.

**TCP timeout conservador:** 300 ms por porta. Não usar mais que 8 portas por IP na varredura rápida.

**Scan passivo primeiro:** antes de qualquer probe ativo, escutar mDNS/SSDP por 1–2 segundos — muitos dispositivos anunciam sozinhos, sem necessidade de probe.

**Interromper no foreground:** se o app for para background, pausar o scan de hosts não descobertos e continuar só o enriquecimento dos já encontrados.

**Não usar `WifiManager.startScan()`** a não ser que os cached results tenham mais de 60 segundos. Sempre preferir `registerScanResultsCallback()` (API 30+) ou escutar `SCAN_RESULTS_AVAILABLE_ACTION` passivamente.

---

## 14. Referências Open-Source e Documentação Oficial

### 14.1 Repositórios open-source de referência

| Repositório | Linguagem | O que estudar |
|---|---|---|
| [VREMSoftwareDevelopment/WiFiAnalyzer](https://github.com/VREMSoftwareDevelopment/WiFiAnalyzer) | Kotlin | Parsing de `ScanResult`, detecção HT/VHT/HE/EHT, UI de canais |
| [csicar/Ning](https://github.com/csicar/Ning) | Kotlin | ICMP + TCP + mDNS scanner moderno, uso de coroutines |
| [custanator/android-upnp-discovery](https://github.com/custanator/android-upnp-discovery) | Java | M-SEARCH SSDP multicast, parse de resposta |
| [berndverst/android-ssdp](https://github.com/berndverst/android-ssdp) | Java | Alternativa SSDP |
| [felirox/Android-Network-Scanner](https://github.com/felirox/Android-Network-Scanner) | Kotlin | Scanner simples com ping sweep |
| [rorist/android-network-discovery](https://github.com/rorist/android-network-discovery) | Java | Referência clássica (mais antigo, útil para NBNS) |
| [alberto97/OUILookup](https://github.com/alberto97/OUILookup) | Kotlin | Offline OUI DB para Android |

### 14.2 Documentação oficial Android

| Link | Relevante para |
|---|---|
| [developer.android.com/develop/connectivity/wifi/wifi-scan](https://developer.android.com/develop/connectivity/wifi/wifi-scan) | Throttling, `startScan()`, `ScanResult` |
| [developer.android.com/develop/connectivity/wifi/wifi-permissions](https://developer.android.com/develop/connectivity/wifi/wifi-permissions) | `NEARBY_WIFI_DEVICES`, `ACCESS_FINE_LOCATION` por versão |
| [developer.android.com/develop/connectivity/network-ops/reading-network-state](https://developer.android.com/develop/connectivity/network-ops/reading-network-state) | `ConnectivityManager`, `LinkProperties`, `NetworkCallback` |
| [developer.android.com/about/versions/17/behavior-changes-17](https://developer.android.com/about/versions/17/behavior-changes-17) | `ACCESS_LOCAL_NETWORK` obrigatório no Android 17 |
| [developer.android.com/about/versions/16/behavior-changes-16](https://developer.android.com/about/versions/16/behavior-changes-16) | Local Network Protection opt-in no Android 16 |
| [developer.android.com/privacy-and-security/local-network-permission](https://developer.android.com/privacy-and-security/local-network-permission) | Documentação completa da nova permissão |
| [developer.android.com/develop/connectivity/wifi/use-nsd](https://developer.android.com/develop/connectivity/wifi/use-nsd) | `NsdManager` para mDNS |
| [source.android.com/docs/core/connect/wifi-7](https://source.android.com/docs/core/connect/wifi-7) | Wi-Fi 7 (EHT) no Android |

### 14.3 Referências de protocolos

| Spec | Relevante para |
|---|---|
| [RFC 1002](https://www.rfc-editor.org/rfc/rfc1002) | NetBIOS Name Service (NBNS) |
| [UPnP Device Architecture 2.0](https://openconnectivity.org/developer/specifications/upnp-resources/upnp/) | SSDP M-SEARCH, descrição XML |
| [IEEE 802.11-2020, Section 9.4.2](https://standards.ieee.org/ieee/802.11/7028/) | Information Elements (HT/VHT/HE/EHT Capabilities) |
| [standards-oui.ieee.org](https://standards-oui.ieee.org) | Bases OUI MA-L, MA-M, MA-S |
| [RFC 6762](https://www.rfc-editor.org/rfc/rfc6762) | mDNS (Multicast DNS) |
| [RFC 6763](https://www.rfc-editor.org/rfc/rfc6763) | DNS-SD (Service Discovery) |

### 14.4 Bibliotecas Kotlin/Android recomendadas

```kotlin
// build.gradle.kts
dependencies {
    // Lifecycle + Coroutines
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.7")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // WorkManager (OUI updater)
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    // Serialization (ScanReport persistência)
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    // Room (OUI database)
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")

    // JmDNS (mDNS avançado — complementa NsdManager)
    implementation("org.jmdns:jmdns:3.5.8")
}
```

---

## 15. Checklist de Implementação

### Fase 1 — Fundação (dias 1–3)
- [ ] Criar estrutura de pacotes conforme seção 2.1
- [ ] Implementar `IpUtils` (networkAddress, hostRange, broadcastAddress, intToInetAddress)
- [ ] Implementar `GatewayInfoProviderImpl` com fallback de API level
- [ ] Implementar `PermissionHelper` com lógica por API level
- [ ] Implementar `OuiDatabaseImpl` com Room + snapshot CSV na assets
- [ ] Agendar `OuiUpdateWorker` no Application.onCreate()
- [ ] Testes unitários para `IpUtils` e conversão de DhcpInfo

### Fase 2 — AP Info (dias 4–5)
- [ ] Implementar `AccessPointInfoProviderImpl`
- [ ] Implementar `InformationElementParser` (HT/VHT/HE caps, MU-MIMO bit)
- [ ] Implementar `getWifiInfoViaCallback()` para API 31+
- [ ] Mapear `ScanResult.channelWidth` → Int legível
- [ ] Fallback de `wifiStandard` via parsing da string `capabilities` para API <30
- [ ] Detectar mesh: múltiplos BSSIDs com mesmo SSID agrupados

### Fase 3 — Discovery (dias 6–9)
- [ ] Implementar `IcmpProbe` com fallback para shell ping
- [ ] Implementar `TcpProbe` com pool de coroutines
- [ ] Implementar `MdnsBrowser` com todos os service types listados
- [ ] Implementar `SsdpDiscovery` com M-SEARCH e parse de resposta
- [ ] Implementar `NbnsProbe` com broadcast e decode de resposta
- [ ] Implementar `HostDiscoveryEngineImpl` orquestrando tudo em paralelo
- [ ] Testar em dispositivo físico (emulator bloqueia multicast)

### Fase 4 — Enrichment (dias 10–12)
- [ ] Implementar `SsdpXmlEnricher` com XmlPullParser
- [ ] Implementar `HttpBannerEnricher` com timeout agressivo
- [ ] Implementar `PtrDnsEnricher` (getCanonicalHostName)
- [ ] Implementar `MdnsDirectEnricher` para queries direcionadas
- [ ] Implementar `OuiEnricher` consultando Room DB
- [ ] Implementar `DeviceClassifier` com todas as regras de inferência
- [ ] Implementar `HostEnrichmentEngineImpl` orquestrando a chain

### Fase 5 — Orchestration + UI (dias 13–16)
- [ ] Implementar `ScanOrchestratorImpl` com StateFlow completo
- [ ] ViewModel consumindo ScanOrchestrator
- [ ] Tela de scan com lista progressiva (LazyColumn + animações)
- [ ] Card especial do gateway/roteador
- [ ] Seção de nós mesh
- [ ] Alertas de AP isolation, VPN, rede grande
- [ ] Bottom sheet de permissões com rationale por permissão
- [ ] Botão "Escanear Novamente" com respeito ao throttle (60s mínimo)

### Fase 6 — Qualidade (dias 17–18)
- [ ] Testar em rede /24 comum (casa)
- [ ] Testar em rede mesh (3 nós)
- [ ] Testar com VPN ativa
- [ ] Testar com AP isolation (hotspot de telefone Android)
- [ ] Testar no Android 13+ (NEARBY_WIFI_DEVICES)
- [ ] Testar no Android emulador com API 37 preview (ACCESS_LOCAL_NETWORK)
- [ ] Verificar consumo de bateria via Android Profiler (target: <1% por scan)
- [ ] Verificar ausência de memory leaks (especialmente sockets MulticastSocket)

---

> **Nota para Claude Code:** Começar pela Fase 1 e perguntar ao usuário qual ViewModel/DI framework o projeto já usa (Hilt, Koin, ou manual) antes de implementar a injeção do `ScanOrchestrator`. O módulo foi projetado para funcionar com qualquer abordagem — as interfaces permitem mock e teste independente de cada camada.
