# LINKA SpeedTest â€” Feature: Contexto Wiâ€‘Fi via Atalho iOS

## 1. Resumo executivo

A feature **Contexto Wiâ€‘Fi via Atalho iOS** permite complementar o resultado do LINKA SpeedTest com informaÃ§Ãµes locais da rede Wiâ€‘Fi do iPhone, coletadas por um Atalho do app Atalhos do iOS.

O objetivo nÃ£o Ã© substituir o teste de velocidade do LINKA. O objetivo Ã© enriquecer o diagnÃ³stico com dados que o PWA, sozinho, nÃ£o consegue obter de forma confiÃ¡vel no iOS, como SSID, BSSID, canal, RSSI, ruÃ­do, padrÃ£o Wiâ€‘Fi e taxas de link RX/TX.

Com isso, o LINKA consegue separar melhor trÃªs cenÃ¡rios comuns:

- internet ruim;
- Wiâ€‘Fi local ruim;
- internet aparentemente boa, mas experiÃªncia ruim por latÃªncia, oscilaÃ§Ã£o ou perda.

A feature deve ser transparente para o usuÃ¡rio, sem coleta invisÃ­vel, sem automaÃ§Ã£o silenciosa e sem exposiÃ§Ã£o desnecessÃ¡ria de dados sensÃ­veis.

---

## 2. Problema

O LINKA SpeedTest mede a experiÃªncia real do aparelho/navegador atÃ© a internet, usando endpoints externos. Isso Ã© correto para medir navegaÃ§Ã£o, streaming, chamadas, jogos e trabalho remoto.

PorÃ©m, em iPhone/PWA, o navegador nÃ£o expÃµe de forma confiÃ¡vel dados locais do Wiâ€‘Fi. Isso limita o diagnÃ³stico, porque um teste ruim pode ser causado por:

- sinal Wiâ€‘Fi fraco;
- usuÃ¡rio longe do roteador;
- rede em 2.4 GHz congestionada;
- canal ruim;
- baixa taxa de link;
- instabilidade local;
- problema real da operadora;
- saturaÃ§Ã£o da rede domÃ©stica;
- limitaÃ§Ã£o do aparelho.

Sem contexto Wiâ€‘Fi, o app pode acertar a mediÃ§Ã£o, mas errar a explicaÃ§Ã£o.

---

## 3. Objetivo da feature

Permitir que usuÃ¡rios de iPhone rodem um Atalho iOS complementar antes do speedtest para coletar dados locais do Wiâ€‘Fi e devolver esses dados ao PWA LINKA.

O PWA deve entÃ£o usar esses dados para:

- exibir contexto do Wiâ€‘Fi no resultado;
- enriquecer o diagnÃ³stico final;
- sugerir aÃ§Ãµes prÃ¡ticas;
- diferenciar problema de Wiâ€‘Fi de problema de internet;
- registrar os dados no histÃ³rico local do teste;
- permitir exportaÃ§Ã£o controlada, com ocultaÃ§Ã£o de dados sensÃ­veis por padrÃ£o.

---

## 4. NÃ£o objetivos

Esta feature nÃ£o pretende:

- medir velocidade entre iPhone e roteador;
- medir throughput LAN real;
- medir sinal GPON/fibra;
- acessar dados administrativos do roteador;
- substituir ferramentas como iperf3;
- rodar automaticamente sem aÃ§Ã£o do usuÃ¡rio;
- coletar dados em segundo plano;
- prometer prova regulatÃ³ria contra operadora;
- expor IP, BSSID ou identificadores sensÃ­veis em relatÃ³rios pÃºblicos por padrÃ£o.

---

## 5. PÃºblico-alvo

### UsuÃ¡rio final

Pessoa comum que quer saber se a internet serve para:

- jogos online;
- streaming 4K;
- videochamadas;
- home office;
- navegaÃ§Ã£o geral.

Esse usuÃ¡rio nÃ£o deve ser exposto a termos tÃ©cnicos brutos como â€œRSSIâ€, â€œjitterâ€, â€œBSSIDâ€ e â€œTX Rateâ€ sem traduÃ§Ã£o.

### UsuÃ¡rio tÃ©cnico

Pessoa que quer ver detalhes avanÃ§ados do teste, Ãºtil para suporte, instalaÃ§Ã£o, diagnÃ³stico domÃ©stico ou comparaÃ§Ã£o entre cÃ´modos.

Para esse usuÃ¡rio, o app pode oferecer um bloco â€œDetalhes avanÃ§adosâ€.

---

## 6. VisÃ£o funcional

### Fluxo principal

1. UsuÃ¡rio abre o LINKA SpeedTest no iPhone.
2. O app detecta ambiente iOS/PWA.
3. O app exibe a opÃ§Ã£o: **Medir com contexto Wiâ€‘Fi do iPhone**.
4. UsuÃ¡rio toca no botÃ£o.
5. O PWA chama o deep link do app Atalhos.
6. O Atalho LINKA Wiâ€‘Fi Context Ã© executado.
7. O Atalho coleta os dados locais da rede Wiâ€‘Fi.
8. O Atalho abre de volta o PWA com os dados codificados na URL.
9. O PWA valida e salva temporariamente o contexto Wiâ€‘Fi.
10. O PWA inicia o speedtest ou oferece botÃ£o para iniciar.
11. Ao final, o resultado une:
    - mÃ©tricas do speedtest;
    - contexto Wiâ€‘Fi;
    - diagnÃ³stico combinado;
    - recomendaÃ§Ãµes prÃ¡ticas.

---

## 7. ExperiÃªncia do usuÃ¡rio

### 7.1 Tela inicial

Quando o app estiver em iOS, exibir dois caminhos:

```txt
Iniciar teste
```

```txt
Medir com contexto Wiâ€‘Fi do iPhone
```

Texto de apoio:

```txt
O contexto Wiâ€‘Fi ajuda a diferenciar problema de sinal do Wiâ€‘Fi de problema da internet.
```

### 7.2 UsuÃ¡rio sem atalho instalado

Se o usuÃ¡rio tocar no botÃ£o e o atalho nÃ£o existir, o iOS pode nÃ£o executar nada ou abrir o app Atalhos sem resultado Ãºtil.

O PWA deve mostrar uma tela de instruÃ§Ã£o antes da primeira tentativa:

```txt
Para medir tambÃ©m o sinal Wiâ€‘Fi do iPhone, instale o atalho LINKA Wiâ€‘Fi Context.
Depois volte aqui e toque novamente em â€œMedir com contexto Wiâ€‘Fiâ€.
```

Deve haver botÃ£o:

```txt
Instalar atalho
```

E outro:

```txt
Continuar sem contexto Wiâ€‘Fi
```

### 7.3 Retorno com sucesso

Quando o PWA receber os dados do atalho, exibir confirmaÃ§Ã£o discreta:

```txt
Contexto Wiâ€‘Fi recebido.
Agora vamos medir sua conexÃ£o.
```

### 7.4 Retorno incompleto

Se alguns campos vierem ausentes:

```txt
Recebemos parte dos dados do Wiâ€‘Fi. O teste continuarÃ¡ normalmente.
```

### 7.5 Falha ou cancelamento

Se o usuÃ¡rio cancelar o atalho ou voltar manualmente:

```txt
NÃ£o foi possÃ­vel coletar o contexto Wiâ€‘Fi.
VocÃª ainda pode fazer o teste normal.
```

---

## 8. Arquitetura geral

```mermaid
flowchart TD
    A[UsuÃ¡rio no PWA LINKA] --> B{Ambiente iOS?}
    B -- NÃ£o --> C[Teste normal]
    B -- Sim --> D[BotÃ£o: Medir com contexto Wiâ€‘Fi]
    D --> E[Deep link shortcuts://run-shortcut]
    E --> F[Atalho LINKA Wiâ€‘Fi Context]
    F --> G[Coleta dados locais do Wiâ€‘Fi]
    G --> H[Abre returnUrl do PWA com payload]
    H --> I[PWA valida payload]
    I --> J[Salva wifiContext temporÃ¡rio]
    J --> K[Executa LINKA SpeedTest]
    K --> L[Combina speedtest + wifiContext]
    L --> M[Resultado e diagnÃ³stico]
    M --> N[HistÃ³rico local]
    M --> O[PDF/Compartilhamento com privacidade]
```

---

## 9. Arquitetura em camadas

```mermaid
flowchart LR
    subgraph iOS
      S[App Atalhos]
      W[Atalho LINKA Wiâ€‘Fi Context]
    end

    subgraph PWA
      UI[UI LINKA]
      CB[Wifi Callback Handler]
      ST[SpeedTest Orchestrator]
      DX[Diagnostic Engine]
      HS[Local History]
      EX[PDF / Share]
    end

    subgraph External
      CF[Cloudflare Speed Endpoints]
    end

    UI -->|shortcuts://| S
    S --> W
    W -->|https://linkaSpeedtestPwa.../wifi-callback| CB
    CB --> UI
    UI --> ST
    ST --> CF
    ST --> DX
    CB --> DX
    DX --> HS
    DX --> EX
```

---

## 10. Componentes envolvidos

### 10.1 PWA LINKA

ResponsÃ¡vel por:

- detectar se o usuÃ¡rio estÃ¡ em iOS;
- exibir CTA de contexto Wiâ€‘Fi;
- abrir o atalho via deep link;
- receber retorno por URL;
- validar o payload;
- persistir contexto temporÃ¡rio;
- iniciar teste;
- cruzar dados Wiâ€‘Fi com speedtest;
- mostrar diagnÃ³stico combinado;
- salvar histÃ³rico;
- exportar relatÃ³rio respeitando privacidade.

### 10.2 Atalho iOS LINKA Wiâ€‘Fi Context

ResponsÃ¡vel por:

- receber `returnUrl` e `sessionId` do PWA;
- coletar dados de rede via aÃ§Ãµes do app Atalhos;
- montar payload de retorno;
- abrir o PWA novamente com os dados.

### 10.3 Motor de speedtest

ResponsÃ¡vel por:

- latÃªncia descarregada;
- download;
- upload;
- latÃªncia durante download;
- latÃªncia durante upload;
- bufferbloat;
- estabilidade;
- DNS;
- perda/falhas estimadas ou nativas quando disponÃ­veis.

### 10.4 Motor de diagnÃ³stico

ResponsÃ¡vel por combinar:

- velocidade medida;
- latÃªncia;
- oscilaÃ§Ã£o;
- perda/falha;
- estabilidade;
- tipo de conexÃ£o;
- contexto Wiâ€‘Fi local;
- perfil de uso do usuÃ¡rio.

---

## 11. Contrato de dados

### 11.1 Payload enviado do PWA para o Atalho

O PWA deve abrir o Atalho passando um JSON simples no parÃ¢metro `text`.

Exemplo:

```json
{
  "version": 1,
  "sessionId": "st_1730000000000_ab12cd",
  "returnUrl": "https://linkaSpeedtestPwa.pages.dev/wifi-callback",
  "startedAt": 1730000000000,
  "source": "linka-pwa"
}
```

### 11.2 Deep link para rodar o Atalho

Formato:

```txt
shortcuts://run-shortcut?name=LINKA%20WiFi%20Context&input=text&text=<payload-encoded>
```

Exemplo em TypeScript:

```ts
const payload = encodeURIComponent(JSON.stringify({
  version: 1,
  sessionId,
  returnUrl: `${window.location.origin}/wifi-callback`,
  startedAt: Date.now(),
  source: 'linka-pwa',
}));

window.location.href =
  `shortcuts://run-shortcut?name=LINKA%20WiFi%20Context&input=text&text=${payload}`;
```

### 11.3 Payload retornado pelo Atalho ao PWA

OpÃ§Ã£o recomendada: retornar via query string com payload compactado em Base64 URL-safe.

URL:

```txt
https://linkaSpeedtestPwa.pages.dev/wifi-callback?ctx=<base64url-json>
```

JSON interno:

```json
{
  "version": 1,
  "sessionId": "st_1730000000000_ab12cd",
  "collectedAt": 1730000008123,
  "platform": "ios-shortcut",
  "wifi": {
    "available": true,
    "ssid": "Minha Rede",
    "bssid": "aa:bb:cc:dd:ee:ff",
    "rssiDbm": -67,
    "noiseDbm": -91,
    "snrDb": 24,
    "channel": 149,
    "txRateMbps": 286,
    "rxRateMbps": 344,
    "wifiStandard": "802.11ax",
    "localIp": "192.168.1.42"
  }
}
```

### 11.4 Fallback simples por query string

Se Base64 for difÃ­cil no Atalho, usar query string explÃ­cita:

```txt
/wifi-callback?sid=st_123&rssi=-67&noise=-91&tx=286&rx=344&channel=149&standard=802.11ax
```

Menos elegante, mas mais fÃ¡cil de montar no app Atalhos.

---

## 12. Modelo de dados no PWA

### 12.1 Tipo TypeScript sugerido

```ts
export type WifiContextSource = 'ios-shortcut' | 'android-native' | 'manual' | 'unknown';

export interface WifiContext {
  version: number;
  source: WifiContextSource;
  sessionId: string;
  collectedAt: number;
  available: boolean;

  ssid?: string;
  bssid?: string;
  rssiDbm?: number;
  noiseDbm?: number;
  snrDb?: number;
  channel?: number;
  txRateMbps?: number;
  rxRateMbps?: number;
  linkSpeedMbps?: number;
  wifiStandard?: string;
  localIp?: string;

  privacy: {
    sensitiveFieldsPresent: boolean;
    hideSensitiveByDefault: boolean;
  };
}
```

### 12.2 IntegraÃ§Ã£o com resultado do speedtest

Adicionar ao `SpeedTestResult`:

```ts
export interface SpeedTestResult {
  dl: number;
  ul: number;
  latency: number;
  jitter: number;
  packetLoss: number;
  timestamp: number;
  mode: 'fast' | 'complete';

  wifiContext?: WifiContext;
  diagnostics: Diagnostic[];
}
```

---

## 13. ValidaÃ§Ã£o do payload

O PWA deve validar:

- `version` suportada;
- `sessionId` igual ao esperado, quando existir;
- `collectedAt` recente;
- campos numÃ©ricos dentro de faixas plausÃ­veis;
- ausÃªncia de caracteres perigosos em strings;
- tamanho mÃ¡ximo do payload;
- origem esperada da rota de callback.

### 13.1 Faixas sugeridas

```ts
const WIFI_LIMITS = {
  rssiDbm: { min: -100, max: -20 },
  noiseDbm: { min: -120, max: -20 },
  snrDb: { min: 0, max: 80 },
  channel: { min: 1, max: 233 },
  txRateMbps: { min: 0, max: 10000 },
  rxRateMbps: { min: 0, max: 10000 },
};
```

### 13.2 ExpiraÃ§Ã£o

Contexto Wiâ€‘Fi deve expirar rÃ¡pido.

RecomendaÃ§Ã£o:

```txt
Validade: 2 minutos
```

Motivo: o usuÃ¡rio pode trocar de rede, andar para outro cÃ´modo ou alternar entre Wiâ€‘Fi e dados mÃ³veis.

---

## 14. Regras de diagnÃ³stico Wiâ€‘Fi

### 14.1 ClassificaÃ§Ã£o por RSSI

```ts
function classifyRssi(rssi?: number) {
  if (rssi == null) return 'unknown';
  if (rssi >= -55) return 'excellent';
  if (rssi >= -67) return 'good';
  if (rssi >= -75) return 'fair';
  if (rssi >= -82) return 'weak';
  return 'critical';
}
```

### 14.2 ClassificaÃ§Ã£o por SNR

```ts
function classifySnr(snr?: number) {
  if (snr == null) return 'unknown';
  if (snr >= 35) return 'excellent';
  if (snr >= 25) return 'good';
  if (snr >= 18) return 'fair';
  if (snr >= 10) return 'weak';
  return 'critical';
}
```

### 14.3 ClassificaÃ§Ã£o por taxa de link

A taxa de link nÃ£o deve ser exibida como velocidade real. Ela deve ser chamada de â€œtaxa negociada com o Wiâ€‘Fiâ€ ou â€œcapacidade do link naquele momentoâ€.

```ts
function classifyLinkRate(rate?: number) {
  if (rate == null) return 'unknown';
  if (rate >= 600) return 'excellent';
  if (rate >= 300) return 'good';
  if (rate >= 120) return 'fair';
  if (rate >= 50) return 'weak';
  return 'critical';
}
```

---

## 15. DiagnÃ³stico combinado

### 15.1 Internet ruim + Wiâ€‘Fi ruim

CondiÃ§Ã£o:

- download baixo ou upload baixo;
- RSSI fraco/crÃ­tico ou SNR baixo.

Mensagem:

```txt
O teste ficou abaixo do esperado e o sinal Wiâ€‘Fi neste ponto tambÃ©m parece fraco. Antes de culpar a operadora, teste mais perto do roteador.
```

AÃ§Ã£o sugerida:

```txt
Aproxime o aparelho do roteador e repita o teste.
```

### 15.2 Internet ruim + Wiâ€‘Fi bom

CondiÃ§Ã£o:

- download/upload baixo;
- RSSI bom/excelente;
- SNR bom/excelente;
- taxa de link razoÃ¡vel.

Mensagem:

```txt
O Wiâ€‘Fi parece adequado neste ponto, mas a velocidade medida ficou baixa. O gargalo pode estar na internet, no roteador, no horÃ¡rio de uso ou na operadora.
```

AÃ§Ã£o sugerida:

```txt
Repita o teste em outro horÃ¡rio e, se possÃ­vel, compare com outro aparelho.
```

### 15.3 LatÃªncia ruim + Wiâ€‘Fi ruim

CondiÃ§Ã£o:

- latÃªncia alta, jitter alto ou bufferbloat;
- RSSI/SNR ruim.

Mensagem:

```txt
A resposta da conexÃ£o ficou instÃ¡vel e o Wiâ€‘Fi tambÃ©m parece fraco. Isso pode afetar jogos, chamadas e reuniÃµes mesmo quando hÃ¡ Mbps suficientes.
```

AÃ§Ã£o sugerida:

```txt
Teste mais perto do roteador ou use uma rede de 5 GHz/6 GHz, se disponÃ­vel.
```

### 15.4 Velocidade boa + Wiâ€‘Fi ruim

CondiÃ§Ã£o:

- download/upload bons;
- RSSI ruim.

Mensagem:

```txt
A velocidade passou, mas o sinal Wiâ€‘Fi estÃ¡ no limite. A conexÃ£o pode oscilar em chamadas, jogos ou ao se mover pela casa.
```

AÃ§Ã£o sugerida:

```txt
Considere melhorar a cobertura Wiâ€‘Fi nesse ambiente.
```

### 15.5 Wiâ€‘Fi bom + latÃªncia sob carga ruim

CondiÃ§Ã£o:

- RSSI bom;
- velocidade boa;
- latÃªncia durante download/upload sobe muito.

Mensagem:

```txt
O sinal Wiâ€‘Fi parece bom, mas a resposta piora quando a conexÃ£o estÃ¡ em uso. Isso indica possÃ­vel saturaÃ§Ã£o do roteador ou da conexÃ£o.
```

AÃ§Ã£o sugerida:

```txt
Evite downloads pesados durante chamadas e jogos, ou avalie um roteador com melhor controle de fila.
```

---

## 16. Linguagem para usuÃ¡rio final

Evitar termos tÃ©cnicos na superfÃ­cie principal.

### Preferir

```txt
resposta
oscilaÃ§Ã£o
sinal Wiâ€‘Fi
falhas na conexÃ£o
estabilidade
cobertura Wiâ€‘Fi
```

### Evitar na interface principal

```txt
latÃªncia
jitter
packet loss
RSSI
SNR
BSSID
TX Rate
RX Rate
bufferbloat
```

Esses termos podem aparecer apenas em â€œDetalhes avanÃ§adosâ€.

---

## 17. UI sugerida no resultado

### 17.1 Card simples

```txt
Contexto Wiâ€‘Fi

Sinal: Bom
Canal: 149
PadrÃ£o: Wiâ€‘Fi 6
Taxa negociada: 286 Mbps envio / 344 Mbps recepÃ§Ã£o

O Wiâ€‘Fi parece adequado neste ponto da casa.
```

### 17.2 Detalhes avanÃ§ados

```txt
Detalhes avanÃ§ados

SSID: Minha Rede
BSSID: oculto
RSSI: -67 dBm
RuÃ­do: -91 dBm
SNR: 24 dB
Canal: 149
TX Rate: 286 Mbps
RX Rate: 344 Mbps
PadrÃ£o: 802.11ax
IP local: oculto
```

### 17.3 Aviso sobre taxa de link

```txt
A taxa negociada do Wiâ€‘Fi nÃ£o Ã© a velocidade real da internet. Ela indica a qualidade do link entre o aparelho e o roteador naquele momento.
```

---

## 18. Privacidade e seguranÃ§a

### 18.1 Dados sensÃ­veis

Tratar como sensÃ­veis:

- BSSID;
- IP local;
- IP pÃºblico;
- SSID, dependendo do contexto;
- localizaÃ§Ã£o aproximada derivada de IP;
- timestamp combinado com identificadores de rede.

### 18.2 PolÃ­tica de exibiÃ§Ã£o

Por padrÃ£o:

- mostrar SSID apenas no app local;
- ocultar BSSID;
- ocultar IP local;
- ocultar IP pÃºblico em PDF/compartilhamento;
- permitir botÃ£o â€œmostrar detalhes avanÃ§adosâ€;
- mascarar identificadores.

Exemplo de mÃ¡scara:

```txt
BSSID: aa:bb:â€¢â€¢:â€¢â€¢:ee:ff
IP local: 192.168.1.xxx
```

### 18.3 Compartilhamento

Ao compartilhar resultado:

- nÃ£o incluir BSSID por padrÃ£o;
- nÃ£o incluir IP local por padrÃ£o;
- nÃ£o incluir IP pÃºblico por padrÃ£o;
- incluir apenas diagnÃ³stico textual e mÃ©tricas principais;
- oferecer opÃ§Ã£o avanÃ§ada: â€œincluir dados tÃ©cnicosâ€, desativada por padrÃ£o.

### 18.4 Armazenamento

O histÃ³rico continua local.

Os dados Wiâ€‘Fi devem ser salvos apenas no histÃ³rico local do navegador, sem backend, salvo decisÃ£o futura explÃ­cita.

---

## 19. Rotas sugeridas

### 19.1 `/`

Tela inicial e teste normal.

### 19.2 `/wifi-callback`

Rota de retorno do Atalho.

Responsabilidades:

- ler query string;
- decodificar payload;
- validar dados;
- salvar `wifiContext` temporÃ¡rio;
- redirecionar para tela de teste ou iniciar mediÃ§Ã£o.

### 19.3 `/shortcut-help`

Tela de instruÃ§Ã£o para instalar/configurar o Atalho.

### 19.4 `/result/:id`

Resultado com contexto Wiâ€‘Fi, quando disponÃ­vel.

---

## 20. ImplementaÃ§Ã£o no PWA

### 20.1 DetecÃ§Ã£o de iOS

```ts
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
```

### 20.2 DetecÃ§Ã£o de PWA standalone

```ts
export function isStandalonePwa(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
}
```

### 20.3 Abrir o Atalho

```ts
export function runWifiShortcut(sessionId: string) {
  const returnUrl = `${window.location.origin}/wifi-callback`;

  const payload = encodeURIComponent(JSON.stringify({
    version: 1,
    sessionId,
    returnUrl,
    startedAt: Date.now(),
    source: 'linka-pwa',
  }));

  const shortcutUrl =
    `shortcuts://run-shortcut?name=LINKA%20WiFi%20Context&input=text&text=${payload}`;

  window.location.href = shortcutUrl;
}
```

### 20.4 Ler retorno

```ts
export function parseWifiCallback(search: string): WifiContext | null {
  const params = new URLSearchParams(search);
  const ctx = params.get('ctx');

  if (ctx) {
    const json = decodeBase64UrlJson(ctx);
    return validateWifiContext(json);
  }

  return validateWifiContext({
    version: 1,
    source: 'ios-shortcut',
    sessionId: params.get('sid'),
    collectedAt: Number(params.get('t')) || Date.now(),
    available: params.get('available') !== 'false',
    rssiDbm: toNumber(params.get('rssi')),
    noiseDbm: toNumber(params.get('noise')),
    snrDb: toNumber(params.get('snr')),
    channel: toNumber(params.get('channel')),
    txRateMbps: toNumber(params.get('tx')),
    rxRateMbps: toNumber(params.get('rx')),
    wifiStandard: params.get('standard') || undefined,
    ssid: params.get('ssid') || undefined,
    bssid: params.get('bssid') || undefined,
    localIp: params.get('localIp') || undefined,
  });
}
```

### 20.5 Salvar temporariamente

```ts
const WIFI_CONTEXT_KEY = 'linka.pendingWifiContext';

export function savePendingWifiContext(ctx: WifiContext) {
  sessionStorage.setItem(WIFI_CONTEXT_KEY, JSON.stringify(ctx));
}

export function consumePendingWifiContext(): WifiContext | null {
  const raw = sessionStorage.getItem(WIFI_CONTEXT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(WIFI_CONTEXT_KEY);

  try {
    const ctx = JSON.parse(raw) as WifiContext;
    if (Date.now() - ctx.collectedAt > 2 * 60 * 1000) return null;
    return ctx;
  } catch {
    return null;
  }
}
```

---

## 21. ImplementaÃ§Ã£o do Atalho iOS

### 21.1 Nome do Atalho

```txt
LINKA WiFi Context
```

O nome deve ser estÃ¡vel, pois serÃ¡ chamado pelo deep link.

### 21.2 Entrada

O Atalho deve receber texto contendo JSON.

Campos esperados:

- `version`;
- `sessionId`;
- `returnUrl`;
- `startedAt`;
- `source`.

### 21.3 AÃ§Ãµes principais no Atalho

Fluxo sugerido:

```txt
1. Receber entrada do atalho
2. Obter texto da entrada
3. Extrair JSON ou tratar como texto
4. Obter returnUrl
5. Obter sessionId
6. Get Network Details â†’ Network Name
7. Get Network Details â†’ BSSID
8. Get Network Details â†’ Wiâ€‘Fi Standard
9. Get Network Details â†’ RSSI
10. Get Network Details â†’ Noise
11. Calcular SNR = RSSI - Noise
12. Get Network Details â†’ Channel Number
13. Get Network Details â†’ TX Rate
14. Get Network Details â†’ RX Rate
15. Get Network Details â†’ Local IP Address, se disponÃ­vel
16. Montar payload
17. Codificar payload ou montar query string
18. Abrir URL de retorno
```

### 21.4 Retorno simples recomendado para primeira versÃ£o

Para reduzir dificuldade no Atalho, usar query string simples na V1:

```txt
returnUrl
  ?sid=<sessionId>
  &t=<timestamp>
  &ssid=<ssid>
  &bssid=<bssid>
  &rssi=<rssi>
  &noise=<noise>
  &snr=<snr>
  &channel=<channel>
  &tx=<txRate>
  &rx=<rxRate>
  &standard=<wifiStandard>
  &localIp=<localIp>
```

Na V2, migrar para `ctx=<base64url-json>`.

---

## 22. Estados de erro

### 22.1 Atalho nÃ£o instalado

Sintoma:

- deep link nÃ£o retorna;
- usuÃ¡rio permanece no app Atalhos;
- usuÃ¡rio volta sem contexto.

Tratamento:

- oferecer teste normal;
- manter instruÃ§Ã£o de instalaÃ§Ã£o;
- nÃ£o bloquear o produto.

### 22.2 Dados ausentes

Sintoma:

- iOS nÃ£o retorna campo especÃ­fico;
- usuÃ¡rio nÃ£o estÃ¡ em Wiâ€‘Fi;
- aÃ§Ã£o do Atalho falha.

Tratamento:

- preencher apenas campos disponÃ­veis;
- `available=false` se nenhum dado Ãºtil foi coletado;
- continuar teste normal.

### 22.3 Dados expirados

Sintoma:

- callback antigo aberto depois;
- usuÃ¡rio alternou rede.

Tratamento:

- descartar contexto se passou de 2 minutos;
- exibir aviso.

### 22.4 Retorno abre Safari em vez do PWA

Sintoma:

- iOS abre o domÃ­nio no Safari.

Tratamento:

- app deve funcionar normalmente no Safari;
- nÃ£o depender exclusivamente de estado em memÃ³ria;
- usar query string e sessionStorage/localStorage;
- manter UX tolerante.

---

## 23. HistÃ³rico

Adicionar `wifiContext` ao histÃ³rico local.

No histÃ³rico, exibir resumo:

```txt
Wiâ€‘Fi: Bom sinal â€¢ Canal 149 â€¢ Wiâ€‘Fi 6
```

Em detalhes do histÃ³rico:

```txt
Sinal: -67 dBm
RuÃ­do: -91 dBm
SNR: 24 dB
Taxa negociada: 286/344 Mbps
```

Dados sensÃ­veis devem continuar ocultos por padrÃ£o.

---

## 24. ExportaÃ§Ã£o PDF

### 24.1 PDF padrÃ£o

Incluir:

- diagnÃ³stico final;
- download;
- upload;
- resposta;
- oscilaÃ§Ã£o;
- estabilidade;
- resumo Wiâ€‘Fi sem identificadores sensÃ­veis.

NÃ£o incluir por padrÃ£o:

- BSSID;
- IP local;
- IP pÃºblico;
- SSID completo, caso o usuÃ¡rio escolha ocultar.

### 24.2 PDF tÃ©cnico

Permitir opÃ§Ã£o:

```txt
Incluir detalhes tÃ©cnicos do Wiâ€‘Fi
```

Deve vir desligada por padrÃ£o.

---

## 25. Compatibilidade

### 25.1 iOS

Fluxo principal via Atalho.

Requisitos:

- usuÃ¡rio precisa instalar o Atalho;
- usuÃ¡rio precisa tocar no botÃ£o;
- retorno via URL;
- sem execuÃ§Ã£o silenciosa.

### 25.2 Android PWA

Sem Atalho.

Usar fluxo atual de detecÃ§Ã£o web quando disponÃ­vel.

### 25.3 Android APK / Capacitor

Usar bridge nativa existente ou futura para coletar dados locais.

A arquitetura deve tentar unificar tudo em `WifiContext`, independentemente da origem:

```txt
ios-shortcut
android-native
manual
unknown
```

### 25.4 Desktop

NÃ£o exibir CTA de Atalho iOS.

---

## 26. Plano de implementaÃ§Ã£o

### Fase 1 â€” MVP funcional

1. Criar rota `/wifi-callback`.
2. Criar tipo `WifiContext`.
3. Criar parser de query string simples.
4. Criar botÃ£o no PWA para abrir Atalho.
5. Criar Atalho iOS V1 com query string simples.
6. Salvar contexto em sessionStorage.
7. Anexar `wifiContext` ao prÃ³ximo resultado.
8. Exibir card simples no resultado.

### Fase 2 â€” DiagnÃ³stico combinado

1. Criar classificador Wiâ€‘Fi.
2. Criar regras cruzando Wiâ€‘Fi + speedtest.
3. Ajustar textos para usuÃ¡rio final.
4. Criar detalhes avanÃ§ados.
5. Adicionar contexto ao histÃ³rico.

### Fase 3 â€” Privacidade e exportaÃ§Ã£o

1. Mascarar BSSID/IP.
2. Atualizar PDF.
3. Atualizar compartilhamento.
4. Criar opÃ§Ã£o â€œincluir dados tÃ©cnicosâ€.
5. Revisar textos de privacidade.

### Fase 4 â€” Robustez

1. Migrar retorno para `ctx=base64url-json`.
2. Adicionar validaÃ§Ã£o forte.
3. Adicionar expiraÃ§Ã£o.
4. Criar testes unitÃ¡rios.
5. Testar iOS Safari e PWA instalado.
6. Testar cancelamento e atalho ausente.

---

## 27. CritÃ©rios de aceite

### Funcionais

- UsuÃ¡rio em iOS vÃª opÃ§Ã£o de medir com contexto Wiâ€‘Fi.
- BotÃ£o abre o Atalho instalado.
- Atalho coleta dados disponÃ­veis da rede.
- Atalho retorna ao PWA com dados.
- PWA valida e salva contexto.
- Resultado mostra bloco de contexto Wiâ€‘Fi.
- Teste normal continua funcionando sem Atalho.
- Cancelamento nÃ£o quebra o app.
- HistÃ³rico registra resumo Wiâ€‘Fi quando disponÃ­vel.
- PDF nÃ£o expÃµe BSSID/IP por padrÃ£o.

### TÃ©cnicos

- Parser ignora dados invÃ¡lidos.
- Payload expira apÃ³s tempo definido.
- Campos sensÃ­veis sÃ£o mascarados.
- CÃ³digo nÃ£o depende de estado em memÃ³ria apÃ³s retorno.
- Feature nÃ£o quebra Android, desktop ou PWA normal.
- Testes cobrem parsing, validaÃ§Ã£o e classificaÃ§Ã£o Wiâ€‘Fi.

### UX

- UsuÃ¡rio entende que o Atalho Ã© opcional.
- UsuÃ¡rio entende que taxa Wiâ€‘Fi nÃ£o Ã© velocidade real da internet.
- Mensagens evitam tecnicÃªs na visÃ£o principal.
- Detalhes tÃ©cnicos ficam acessÃ­veis, mas nÃ£o dominam a tela.

---

## 28. Testes sugeridos

### 28.1 Testes unitÃ¡rios

- `parseWifiCallback()` com payload completo.
- `parseWifiCallback()` com campos faltando.
- `parseWifiCallback()` com valores fora da faixa.
- `validateWifiContext()` com payload expirado.
- `classifyRssi()`.
- `classifySnr()`.
- `classifyLinkRate()`.
- regras de diagnÃ³stico combinado.

### 28.2 Testes manuais iOS

- iPhone em Wiâ€‘Fi 2.4 GHz.
- iPhone em Wiâ€‘Fi 5 GHz.
- iPhone longe do roteador.
- iPhone perto do roteador.
- iPhone em dados mÃ³veis.
- Atalho instalado.
- Atalho ausente.
- Atalho cancelado.
- PWA instalado.
- Safari normal.
- retorno abrindo Safari em vez do PWA.

### 28.3 Testes de privacidade

- PDF padrÃ£o sem IP/BSSID.
- Compartilhamento sem IP/BSSID.
- HistÃ³rico local com detalhes ocultos.
- BotÃ£o de detalhes tÃ©cnicos funcionando.

---

## 29. Riscos e mitigaÃ§Ã£o

### Risco: Atalho nÃ£o instalado

MitigaÃ§Ã£o:

- feature opcional;
- tela de instalaÃ§Ã£o;
- teste normal sempre disponÃ­vel.

### Risco: iOS muda comportamento do deep link

MitigaÃ§Ã£o:

- fluxo tolerante;
- fallback manual;
- nÃ£o tornar o Atalho obrigatÃ³rio.

### Risco: retorno abre no Safari

MitigaÃ§Ã£o:

- callback por URL completa;
- app funcional fora do standalone;
- estado persistido via URL/sessionStorage.

### Risco: usuÃ¡rio interpreta TX/RX como velocidade contratada

MitigaÃ§Ã£o:

- texto claro;
- chamar de â€œtaxa negociada do Wiâ€‘Fiâ€;
- explicar que nÃ£o Ã© velocidade real da internet.

### Risco: exposiÃ§Ã£o de identificadores

MitigaÃ§Ã£o:

- ocultar por padrÃ£o;
- mascarar;
- opÃ§Ã£o avanÃ§ada desligada.

---

## 30. Roadmap futuro

### 30.1 ComparaÃ§Ã£o por ambiente

Permitir nomear local do teste:

```txt
Sala
Quarto
EscritÃ³rio
Perto do roteador
```

Com isso, o usuÃ¡rio consegue comparar cobertura Wiâ€‘Fi por cÃ´modo.

### 30.2 RelatÃ³rio de cobertura simples

Gerar resumo:

```txt
O quarto apresentou sinal fraco e menor estabilidade que a sala.
```

### 30.3 QR Code do Atalho

Gerar QR Code ou link curto para instalar o Atalho LINKA.

### 30.4 Modo suporte tÃ©cnico

Criar modo com mais detalhes para tÃ©cnicos:

- BSSID mascarado;
- canal;
- banda inferida;
- taxa de link;
- RSSI/SNR;
- horÃ¡rio;
- comparaÃ§Ã£o com teste anterior.

### 30.5 IntegraÃ§Ã£o nativa iOS futura

Caso o LINKA vire app nativo iOS, substituir o Atalho por coleta nativa via APIs permitidas.

---

## 31. DecisÃ£o recomendada

Implementar a feature como complemento opcional, com fluxo assistido pelo usuÃ¡rio.

NÃ£o tentar executar o Atalho automaticamente de forma invisÃ­vel.

NÃ£o tentar transformar o Atalho em speedtest paralelo.

O Atalho deve coletar somente o contexto local do Wiâ€‘Fi. O LINKA continua responsÃ¡vel por medir velocidade, estabilidade, resposta e diagnÃ³stico.

Essa separaÃ§Ã£o deixa a arquitetura mais limpa, reduz risco tÃ©cnico e melhora a explicaÃ§Ã£o para o usuÃ¡rio final.

---

## 32. Nome sugerido da feature

OpÃ§Ãµes:

- **Contexto Wiâ€‘Fi**
- **DiagnÃ³stico Wiâ€‘Fi do iPhone**
- **Prova de Wiâ€‘Fi**
- **LINKA Wiâ€‘Fi Context**
- **Teste com contexto Wiâ€‘Fi**

RecomendaÃ§Ã£o:

```txt
Teste com contexto Wiâ€‘Fi
```

Motivo: Ã© claro para usuÃ¡rio comum e nÃ£o promete mais do que entrega.

---

## 33. Checklist final para desenvolvimento

```txt
[ ] Criar tipo WifiContext
[ ] Criar rota /wifi-callback
[ ] Criar parser de retorno simples
[ ] Criar validaÃ§Ã£o de payload
[ ] Criar sessionStorage para contexto pendente
[ ] Criar botÃ£o iOS no StartScreen
[ ] Criar tela de instruÃ§Ã£o do Atalho
[ ] Criar Atalho LINKA WiFi Context
[ ] Testar deep link shortcuts://run-shortcut
[ ] Testar retorno para PWA
[ ] Anexar wifiContext ao SpeedTestResult
[ ] Criar card de contexto Wiâ€‘Fi no resultado
[ ] Criar detalhes avanÃ§ados
[ ] Criar regras de diagnÃ³stico combinado
[ ] Atualizar histÃ³rico
[ ] Atualizar PDF
[ ] Atualizar compartilhamento
[ ] Mascarar dados sensÃ­veis
[ ] Criar testes unitÃ¡rios
[ ] Validar em iOS Safari
[ ] Validar em PWA instalado
[ ] Validar fallback sem Atalho
```


