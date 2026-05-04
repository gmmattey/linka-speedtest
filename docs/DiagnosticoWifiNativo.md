# Diagnóstico Wi-Fi Nativo

## O que este recurso faz

O Diagnóstico Wi-Fi coleta dados locais do link Wi-Fi no app nativo para estimar a qualidade da conexão naquele ponto da casa.

Dados usados:
- SSID e BSSID (quando disponíveis)
- RSSI (dBm)
- Velocidade negociada do link (Mbps)
- Frequência (MHz), banda (2.4/5/6 GHz) e canal
- Gateway e IP local (quando disponíveis)

Saída principal:
- Classificação: `excellent`, `good`, `fair`, `weak`, `critical`, `unknown`
- Título, explicação e ação principal
- Limitações explícitas

## O que este recurso não faz

- Não mede throughput real entre aparelho e roteador.
- Não substitui o SpeedTest v2 de internet fim-a-fim.
- Não identifica sozinho causa de problemas da operadora.

## Por que não aparece no PWA

No PWA/web, o recurso retorna indisponível por design. O browser não expõe com consistência os dados de Wi-Fi necessários.

- `getCapabilities().localWifiDiagnostics` retorna `false` no PWA
- A tela isolada exibe mensagem de indisponibilidade quando aberta fora do app nativo

## Limitações por permissão e sistema

- Algumas informações dependem de permissões do sistema operacional.
- O bridge pode retornar campos parciais.
- Sem bridge nativo instalado, o módulo retorna indisponível sem quebrar a aplicação.

## Conexão futura com diagnóstico combinado

Este módulo já expõe um adaptador para o contrato esperado do combinado:

```ts
toCombinedWifiInput(result)
```

Shape retornado:

```ts
{
  available: boolean;
  rssiDbm?: number;
  linkSpeedMbps?: number;
  band?: '2.4GHz' | '5GHz' | '6GHz';
  quality?: 'excellent' | 'good' | 'fair' | 'weak' | 'critical';
}
```

Regras:
- `band: 'unknown'` vira `undefined`
- `quality: 'unknown'` vira `undefined`

## Contrato do bridge nativo

O lado JS resolve o plugin nesta ordem (ver `src/features/local-wifi/LocalWifiBridge.ts` `resolveBridge()`):

1. `Capacitor.Plugins.LinkaWifiDiagnostics.getWifiInfo()` — padrão Capacitor 8 (registrado em `MainActivity.onCreate` via `registerPlugin`).
2. `window.LinkaWifiDiagnostics.getWifiInfo()` — fallback de compatibilidade caso uma build antiga ainda injete a bridge via `addJavascriptInterface`.

Shape do payload (idêntico nos dois caminhos):

```ts
getWifiInfo(): Promise<{
  available: boolean;
  ssid?: string;
  bssid?: string;
  rssiDbm?: number;
  linkSpeedMbps?: number;
  frequencyMhz?: number;
  channel?: number;
  gateway?: string;
  ipAddress?: string;
  permissionStatus?: 'granted' | 'denied' | 'unknown';
  platform?: 'android' | 'ios' | 'web' | 'unknown';
}>
```

Se o bridge não existir ou falhar, o módulo retorna indisponível com fallback seguro.

## Implementação Android (Capacitor)

Plugin Java vive em `android/app/src/main/java/br/com/linka/speedtest/wifi/LinkaWifiDiagnosticsPlugin.java`. Pontos principais:

- `@CapacitorPlugin(name = "LinkaWifiDiagnostics", permissions = { ACCESS_FINE_LOCATION alias "location" })`.
- Em `getWifiInfo`, valida a permissão de localização. Se ausente, dispara `requestPermissionForAlias("location", call, "permissionCallback")`. O callback termina o `PluginCall` com `{ available: false, permissionStatus: "denied" }` quando o usuário recusa.
- Coleta `WifiInfo` preferindo `ConnectivityManager#getNetworkCapabilities().getTransportInfo()` em API 29+, com fallback para `WifiManager#getConnectionInfo()`.
- Calcula o canal a partir de `frequencyMhz` (espelho do `channelFromFrequency` em TS).
- Lê gateway IPv4 e IP local via `LinkProperties` da `Network` ativa.
- Sanitiza SSID (remove aspas e descarta `<unknown ssid>`/BSSID padrão de "permissão negada").

Registro: `MainActivity.onCreate` chama `registerPlugin(LinkaWifiDiagnosticsPlugin.class)` ANTES de `super.onCreate()`. Como o plugin é interno (não vem de pacote npm), `capacitor.plugins.json` permanece `[]` — esse arquivo é regenerado pelo `npx cap sync` e lista apenas plugins NPM. O `registerPlugin` programático cobre o nosso caso.

Permissões em `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## Estado `permission-denied` no WifiSignalCard

`useWifiDiagnostics` distingue três modos de "sem dados":

| Status              | Quando ocorre                                                                | UI                                                                                                                          |
|---------------------|------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `loading`           | Chamada ao bridge em andamento                                               | "Lendo informações do Wi-Fi…"                                                                                               |
| `permission-denied` | Bridge respondeu mas `permissionStatus === 'denied'`                         | "Permissão de localização necessária para diagnóstico Wi-Fi. Habilite nas configurações do app." (cor `var(--warn)`)        |
| `unavailable`       | Bridge ausente (PWA puro) ou erro genérico                                   | "Wi-Fi: detalhes disponíveis somente no app instalado."                                                                     |
| `available`         | Plugin retornou `available: true`                                            | Renderiza grid 4 colunas (banda, canal, sinal, link).                                                                       |

A propagação de `permissionStatus`/`platform` do raw para o `WifiDiagnosticResult` foi adicionada em `getUnavailableWifiDiagnosticResult(raw)` para que a UI possa decidir a copy correta.

## Conexão na navegação

Conectado em:
- `App.tsx` com rota interna `screen: 'localwifi'`
- `ExploreScreen` em **Ferramentas de rede** com item **Diagnóstico Wi-Fi**

Comportamento mantido no PWA:
- abre a tela normalmente
- mostra indisponibilidade com fallback seguro quando `localWifiDiagnostics === false`
