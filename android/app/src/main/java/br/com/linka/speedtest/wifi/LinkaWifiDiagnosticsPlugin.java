package br.com.linka.speedtest.wifi;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.RouteInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.net.Inet4Address;
import java.net.InetAddress;

/**
 * Plugin nativo Android que expõe ao webview as informações do Wi-Fi
 * conectado (banda, canal, sinal, velocidade do link, gateway, IP local).
 *
 * Contrato (TS): src/features/local-wifi/types.ts -> LocalWifiRawInfo.
 * O JSObject retornado segue exatamente esse shape — qualquer mudança aqui
 * deve refletir lá. Estrutura mínima quando indisponível:
 *
 *   { available: false, permissionStatus: "denied" | "unknown",
 *     platform: "android" }
 *
 * Permissões: Android 9+ exige ACCESS_FINE_LOCATION para que
 * WifiManager#getConnectionInfo retorne SSID/BSSID reais. Sem permissão a
 * API ainda devolve o objeto, mas com SSID = "<unknown ssid>" e BSSID
 * "02:00:00:00:00:00".
 */
@CapacitorPlugin(
    name = "LinkaWifiDiagnostics",
    permissions = {
        @Permission(strings = { Manifest.permission.ACCESS_FINE_LOCATION }, alias = "location")
    }
)
public class LinkaWifiDiagnosticsPlugin extends Plugin {

    private static final String ALIAS_LOCATION = "location";

    @PluginMethod
    public void getWifiInfo(PluginCall call) {
        if (getPermissionState(ALIAS_LOCATION) != PermissionState.GRANTED) {
            // Pede a permissão. O callback (`permissionCallback`) reentra
            // neste fluxo já com o estado atualizado e termina o `call`.
            requestPermissionForAlias(ALIAS_LOCATION, call, "permissionCallback");
            return;
        }

        resolveWithWifiInfo(call);
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (getPermissionState(ALIAS_LOCATION) == PermissionState.GRANTED) {
            resolveWithWifiInfo(call);
            return;
        }

        JSObject denied = new JSObject();
        denied.put("available", false);
        denied.put("permissionStatus", "denied");
        denied.put("platform", "android");
        call.resolve(denied);
    }

    private void resolveWithWifiInfo(PluginCall call) {
        JSObject result = new JSObject();
        result.put("platform", "android");
        result.put("permissionStatus", "granted");

        Context context = getContext();
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        WifiManager wifiManager = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);

        if (wifiManager == null || !wifiManager.isWifiEnabled()) {
            result.put("available", false);
            call.resolve(result);
            return;
        }

        // 1) Tenta obter WifiInfo via NetworkCapabilities (API 29+); cai
        //    pra getConnectionInfo() em versões antigas. getConnectionInfo
        //    está deprecated a partir do Android 12 (API 31) mas continua
        //    funcionando — mantemos como fallback para devices < 29.
        WifiInfo wifiInfo = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && cm != null) {
            wifiInfo = extractWifiInfoFromCapabilities(cm);
        }
        if (wifiInfo == null) {
            try {
                wifiInfo = wifiManager.getConnectionInfo();
            } catch (SecurityException ignored) {
                wifiInfo = null;
            }
        }

        if (wifiInfo == null) {
            result.put("available", false);
            call.resolve(result);
            return;
        }

        result.put("available", true);

        String ssid = sanitizeSsid(wifiInfo.getSSID());
        if (ssid != null) result.put("ssid", ssid);

        String bssid = wifiInfo.getBSSID();
        if (bssid != null && !bssid.isEmpty() && !"02:00:00:00:00:00".equals(bssid)) {
            result.put("bssid", bssid);
        }

        int rssi = wifiInfo.getRssi();
        // RSSI inválido vira INVALID_RSSI = -127 em alguns devices; ignora.
        if (rssi != Integer.MIN_VALUE && rssi != -127 && rssi != 0) {
            result.put("rssiDbm", rssi);
        }

        int linkSpeed = wifiInfo.getLinkSpeed();
        if (linkSpeed > 0) {
            result.put("linkSpeedMbps", linkSpeed);
        }

        Integer frequency = readFrequencyMhz(wifiInfo);
        if (frequency != null) {
            result.put("frequencyMhz", frequency);
            Integer channel = frequencyToChannel(frequency);
            if (channel != null) result.put("channel", channel);
        }

        // 2) WiFi Standard (802.11a/b/g/n/ac/ax) — API 30+ via WifiInfo
        String wifiStandard = readWifiStandard(wifiInfo);
        if (wifiStandard != null) {
            result.put("wifiStandard", wifiStandard);
        }

        // 3) Gateway / IP local — depende de LinkProperties (API 21+).
        if (cm != null) {
            String[] route = readGatewayAndIp(cm);
            if (route[0] != null) result.put("gateway", route[0]);
            if (route[1] != null) result.put("ipAddress", route[1]);
        }

        // 4) Nearby networks — scan assíncrono
        if (wifiManager != null) {
            try {
                java.util.List<android.net.wifi.ScanResult> scanResults = wifiManager.getScanResults();
                if (scanResults != null && !scanResults.isEmpty()) {
                    com.getcapacitor.JSArray nearbyNetworks = new com.getcapacitor.JSArray();
                    for (android.net.wifi.ScanResult scanResult : scanResults) {
                        JSObject net = new JSObject();
                        net.put("ssid", sanitizeSsid(scanResult.SSID));
                        net.put("bssid", scanResult.BSSID);
                        net.put("frequencyMhz", scanResult.frequency);
                        net.put("rssiDbm", scanResult.level);
                        net.put("capabilities", scanResult.capabilities);
                        nearbyNetworks.put(net);
                    }
                    result.put("nearbyNetworks", nearbyNetworks);
                }
            } catch (SecurityException ignored) {
                // sem permissão — omite nearbyNetworks
            }
        }

        call.resolve(result);
    }

    /**
     * Tenta resgatar o WifiInfo pela API moderna (NetworkCapabilities) —
     * recomendada em API 29+ porque getConnectionInfo() ficou deprecated
     * em API 31. Em algumas OEMs antes da 31 a API moderna ainda retorna
     * null; nesse caso o caller cai para o fallback antigo.
     */
    private WifiInfo extractWifiInfoFromCapabilities(ConnectivityManager cm) {
        try {
            Network active = cm.getActiveNetwork();
            if (active == null) return null;
            NetworkCapabilities caps = cm.getNetworkCapabilities(active);
            if (caps == null) return null;
            if (!caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return null;

            Object transportInfo = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                transportInfo = caps.getTransportInfo();
            }
            if (transportInfo instanceof WifiInfo) {
                return (WifiInfo) transportInfo;
            }
        } catch (SecurityException | IllegalStateException ignored) {
            // Em alguns devices essa chamada lança quando a permissão
            // de localização foi negada após cache; cair pro fallback.
        }
        return null;
    }

    /**
     * Lê o gateway IPv4 e o IP local da Network ativa. Retorna
     * [gateway, ip] — qualquer entrada pode ser null se indisponível.
     */
    private String[] readGatewayAndIp(ConnectivityManager cm) {
        String[] result = new String[] { null, null };
        try {
            Network active = cm.getActiveNetwork();
            if (active == null) return result;
            LinkProperties props = cm.getLinkProperties(active);
            if (props == null) return result;

            for (RouteInfo route : props.getRoutes()) {
                if (!route.isDefaultRoute()) continue;
                InetAddress gw = route.getGateway();
                if (gw instanceof Inet4Address) {
                    result[0] = gw.getHostAddress();
                    break;
                }
            }

            for (java.net.InetAddress addr : asList(props)) {
                if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                    result[1] = addr.getHostAddress();
                    break;
                }
            }
        } catch (SecurityException ignored) {
            // sem permissão — devolve nulls
        }
        return result;
    }

    private static java.util.List<InetAddress> asList(LinkProperties props) {
        java.util.List<InetAddress> out = new java.util.ArrayList<>();
        if (props == null) return out;
        for (android.net.LinkAddress la : props.getLinkAddresses()) {
            out.add(la.getAddress());
        }
        return out;
    }

    /**
     * Em API 21+ existe WifiInfo#getFrequency, retornando MHz. Antes
     * disso não tem como saber a frequência — devolve null e o lado JS
     * deixa banda/canal em "unknown".
     */
    private Integer readFrequencyMhz(WifiInfo wifiInfo) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return null;
        int freq = wifiInfo.getFrequency();
        return freq > 0 ? freq : null;
    }

    /**
     * Lê o padrão WiFi da conexão ativa via WifiInfo#getWifiStandard() (API 30+).
     * Constantes WIFI_STANDARD_* são @hide no stub jar — usamos valores inteiros
     * documentados em android.net.wifi.WifiInfo (API 30, AOSP):
     *   1 = WIFI_STANDARD_LEGACY (802.11a/b/g)
     *   4 = WIFI_STANDARD_11N
     *   5 = WIFI_STANDARD_11AC
     *   6 = WIFI_STANDARD_11AX
     *   8 = WIFI_STANDARD_11BE (API 33+)
     */
    private String readWifiStandard(WifiInfo wifiInfo) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return null;
        int standard = wifiInfo.getWifiStandard();
        if (standard == 6) return "802.11ax";
        if (standard == 5) return "802.11ac";
        if (standard == 4) return "802.11n";
        if (standard == 8) return "802.11be";
        if (standard == 1) return "802.11a/b/g";
        return null;
    }

    /**
     * Conversão MHz -> canal Wi-Fi. Equivalente nativo de
     * `channelFromFrequency` (TS, src/features/local-wifi/LocalWifiService.ts):
     * - 2.4 GHz: 2412..2472 MHz -> 1..13 (passo 5), 2484 = canal 14
     * - 5 GHz:   5000..5900 MHz -> (freq - 5000) / 5
     * - 6 GHz:   5955..7115 MHz -> (freq - 5950) / 5
     */
    private Integer frequencyToChannel(int frequencyMhz) {
        if (frequencyMhz >= 2412 && frequencyMhz <= 2472) {
            return Math.round((frequencyMhz - 2407) / 5f);
        }
        if (frequencyMhz == 2484) return 14;
        if (frequencyMhz >= 5000 && frequencyMhz <= 5900) {
            return Math.round((frequencyMhz - 5000) / 5f);
        }
        if (frequencyMhz >= 5955 && frequencyMhz <= 7115) {
            return Math.round((frequencyMhz - 5950) / 5f);
        }
        return null;
    }

    /**
     * WifiManager#getSSID retorna a string entre aspas duplas
     * (ex.: '"linka_5G"') e em alguns OEMs o valor "<unknown ssid>"
     * quando a permissão é insuficiente. Normaliza ambos os casos.
     */
    private String sanitizeSsid(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) return null;
        if ("<unknown ssid>".equalsIgnoreCase(trimmed)) return null;
        if (trimmed.length() >= 2 && trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
            String inner = trimmed.substring(1, trimmed.length() - 1);
            return inner.isEmpty() ? null : inner;
        }
        return trimmed;
    }

    /**
     * Helper interno usado por testes ou debug. Mantido público porque
     * o registro automático do Capacitor já cobre o getWifiInfo. NÃO
     * remover sem ajustar a doc — a presença dessa função é referenciada
     * em DiagnosticoWifiNativo.md.
     */
    @SuppressWarnings("unused")
    public boolean hasLocationPermission() {
        return ContextCompat.checkSelfPermission(
            getContext(), Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;
    }
}
