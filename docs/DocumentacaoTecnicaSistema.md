# Documentação Técnica do Sistema — linka SpeedTest PWA

> Arquitetura, tipos, hooks, utils, componentes e infraestrutura de deploy.

---

## 1. Stack e versões

| Tecnologia | Versão | Função |
|---|---|---|
| Vite | ^7.0 | Build tool + dev server |
| React | ^19 | Framework UI |
| TypeScript | ^6 | Tipagem estática |
| vite-plugin-pwa | ^1.2 | Manifest + service worker |
| Capacitor | ^8 | Empacotamento Android nativo do PWA |
| Android SDK | Platform 36 / Build Tools 36.1 | Build do APK |
| **APK versão** | **v1.0.0 (code 1000000)** | **[2026-05-04] Debug build assinado; logo PWA integrado** |
| JDK | 21 LTS | Compilação Gradle/Android |
| Recharts | latest | Gráficos (HistoryScreen) |
| jsPDF | latest | Geração de PDF |
| html2canvas | latest | Captura de DOM para PDF |
| Vitest | latest | Testes unitários |

> **Nota:** vite-plugin-pwa 1.x é incompatível com Vite 8+. Não atualizar Vite sem validar a versão do plugin.

---

## 2. Tipos (`src/types/index.ts`)

Todos os tipos compartilhados do projeto vivem em um único arquivo.

### Enums/Unions

```ts
type Quality = 'excellent' | 'good' | 'fair' | 'slow' | 'unavailable'
type Tag = 'highLatency' | 'lowUpload' | 'unstable' | 'packetLoss' | 'veryUnstable'
type DeviceType = 'mobile' | 'tablet' | 'desktop'
type ConnectionType = 'wifi' | 'mobile' | 'cable' | 'unknown'
type TestPhase = 'idle' | 'latency' | 'download' | 'upload' | 'load' | 'done' | 'error'
type SpeedTestMode = 'quick' | 'fast' | 'complete' | 'normal' | 'advanced'
type BufferbloatSeverity = 'low' | 'moderate' | 'high' | 'critical'
type GamingProfile = 'off' | 'casual' | 'moba' | 'fps' | 'cloud'
type RecommendationAction =
  | 'repeat_test' | 'move_closer_router' | 'restart_router'
  | 'try_cable' | 'compare_location' | 'contact_operator'
  | 'run_proof_mode' | 'run_gamer_mode' | 'none'

interface SpeedTestSample {
  tMs: number;   // ms relativo ao início da fase
  mbps: number;
  phase: 'download' | 'upload';
}

interface SpeedTestDiagnostics {
  streamingVerdict: 'good' | 'acceptable' | 'poor';
  gamingVerdict:    'good' | 'acceptable' | 'poor';
  videoCallVerdict: 'good' | 'acceptable' | 'poor';
  primaryBottleneck: 'none' | 'latency' | 'upload' | 'bufferbloat' | 'packetLoss';
  summaryText: string;
}
```

### Interfaces principais

```ts
interface SpeedTestResult {
  dl: number          // Mbps download (média da janela estável — Motor v2)
  ul: number          // Mbps upload (média da janela estável — Motor v2)
  latency: number     // ms mediana das amostras idle
  jitter: number      // ms MAD da latência idle
  packetLoss: number  // % perda de pacotes (0–100)
  timestamp: number   // Unix ms
  mode?: SpeedTestMode
  // ── Motor v2 (opcionais) ─────────────────────────────
  stabilityScore?: number;         // 0–100 derivado da série temporal (100 = mínima variação)
  peakDlMbps?: number;             // pico de download Mbps
  peakUlMbps?: number;             // pico de upload Mbps
  bufferbloatSeverity?: BufferbloatSeverity;
  latencyUnloaded?: number;        // ms — mediana idle (mesmo que latency)
  latencyDownload?: number;        // ms — mediana durante DL simultâneo
  latencyUpload?: number;          // ms — mediana durante UL simultâneo
  diagnostics?: SpeedTestDiagnostics;
  dlSamples?: SpeedTestSample[];
  ulSamples?: SpeedTestSample[];
  // ── DNS feature (2026-05) ───────────────────────────
  dnsLatencyMs?: number | null;    // ms — Resource Timing API (null = sem amostra válida)
  dnsResolverIp?: string | null;   // IP do resolver via DoH whoami
  dnsProvider?: string | null;     // 'Cloudflare' | 'Google' | 'Quad9' | … | 'DNS do provedor'
  // ── Tempo total do teste (2026-05) ──────────────────
  elapsedMs?: number;              // ms entre início e fim do `runSpeedTestV2()`; consumido pelo accordion "Avançado" (item "Tempo total do teste"). Sem fallback runtime — registros legados ficam undefined.
  // ── Resultado parcial (2026-05) ─────────────────────
  ulFailed?: boolean;              // true quando upload falhou mas DL+latência OK (típico em uplink celular saturado). UI exibe "—" + "não medido" no upload e banner "Resultado parcial". Falhas de DL/latência continuam invalidando o teste todo.
  // ── Contexto Wi-Fi via Atalho iOS (2026-05) ─────────
  wifiContext?: WifiContext;       // dados coletados pelo Atalho LINKA WiFi Context antes do teste; undefined = sem atalho
  // ── Advanced mode legado (opcionais) ────────────────
  dlP25?: number; dlP75?: number   // Mbps — intervalo de estabilidade DL
  ulP25?: number; ulP75?: number   // Mbps — intervalo de estabilidade UL
  latencyLoaded?: number           // ms — latência mediana sob carga (legado)
  jitterLoaded?: number            // ms — MAD da latência sob carga (legado)
  bufferbloatGrade?: 'A'|'B'|'C'|'D'|'F'
  bufferbloatDeltaMs?: number      // ms de degradação (loaded − idle)
}

interface SpeedTestProgress {
  phase: TestPhase
  instantMbps: number | null  // velocidade instantânea da rodada atual
  overallProgress: number     // 0–1
  partial?: Partial<SpeedTestResult>
}

interface ServerInfo {
  id: string        // ex: 'cloudflare'
  name: string      // ex: 'Cloudflare'
  ip: string        // IP público do cliente
  colo: string      // PoP de conexão (ex: 'GIG')
  loc: string       // Localização (ex: 'BR')
  isp: string       // Operadora (ex: 'Vivo Fibra')
  available: boolean
}

interface DeviceInfo {
  deviceType: DeviceType
  connectionType: ConnectionType
}

interface TestRecord {
  id: string
  timestamp: number
  dl: number; ul: number; latency: number; jitter: number; packetLoss: number
  quality: Quality
  tags: Tag[]
  serverName: string
  isp?: string              // opcional — compatibilidade com registros antigos
  deviceType: DeviceType
  connectionType: ConnectionType
  testMode?: SpeedTestMode  // opcional — ausente em registros gravados antes desta versão
  connectionProfile?: ConnectionProfile
  ruleSetVersion?: RuleSetVersion
  locationTag?: string      // etiqueta de cômodo/local (Teste por local)
  // ── Motor v2 (opcionais) ─────────────────────────────
  stabilityScore?: number;
  bufferbloatSeverity?: BufferbloatSeverity;
  diagnosticSummary?: string;
  peakDlMbps?: number;
  peakUlMbps?: number;
  // ── DNS feature (2026-05) ─────────────────────────────
  dnsLatencyMs?: number | null;
  dnsResolverIp?: string | null;
  dnsProvider?: string | null;
}

interface Classification {
  primary: Quality
  tags: Set<Tag>
}

interface ComparisonResult {
  downloadDropPercent: number       // % de queda de DL (near → far)
  uploadDropPercent: number         // % de queda de UL
  latencyIncreasePercent: number    // % de aumento de latência
  diagnosis: 'coverage_issue' | 'both_bad' | 'both_good' | 'other'
  message: string                   // texto explicativo em pt-BR
}

interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  actionType: RecommendationAction
}
```

---

## 3. Utils (`src/utils/`)

### 3.1 Motor v2 — Medição Cloudflare direta

O motor legado (`speedtest.ts` e `bufferbloat.ts`) foi removido e substituído por cinco módulos independentes. O Motor v2 implementa medição temporal com paralelismo progressivo e bufferbloat integrado durante DL/UL.

---

#### 3.1a `cloudflareSpeedTest.ts` — Primitivas HTTP

Endpoints Cloudflare usados diretamente (sem SDK):

| Propósito | Método | URL |
|---|---|---|
| Download | GET | `https://speed.cloudflare.com/__down?bytes=N&_cb={ts}_{rand}` |
| Upload | POST | `https://speed.cloudflare.com/__up` |
| Latência / Ping | GET | `https://speed.cloudflare.com/__down?bytes=0&_cb={ts}_{rand}` |

Anti-cache: `_cb={Date.now()}_{Math.random()}` em todo request; `Cache-Control: no-store`.

```ts
export const DL_SIZES = [100_000, 1_000_000, 10_000_000, 25_000_000, 100_000_000] as const;
export const UL_SIZES = [256_000, 1_000_000, 5_000_000, 10_000_000] as const;

cfDownloadStream(bytes, signal): Promise<ReadableStreamDefaultReader<Uint8Array>>
cfPing(signal): Promise<number | null>  // RTT em ms; null = timeout
cfUploadChunk(buffer, signal): Promise<number>  // resolve com bytes enviados
```

**CORS no `/__up`** — `speed.cloudflare.com/__up` não responde a preflight (OPTIONS retorna HTTP 400). Para evitar preflight, `cfUploadChunk` é uma **simple CORS request**: POST + `ArrayBuffer`, sem `setRequestHeader` e **sem nenhum listener em `xhr.upload`** (registrar `upload.onprogress`/`onload`/etc. torna o request non-simple e força preflight). Em troca, perdemos progresso intra-POST: o sampler de `uploadProbe` contabiliza os bytes apenas na conclusão de cada POST. Os `sizeIndex` 5 MB/10 MB são alinhados ao próprio `speed.cloudflare.com` — chunks grandes amortizam o overhead TCP/TLS por POST, condição necessária para medir corretamente conexões > 100 Mbps.

---

#### 3.1b `latencyProbe.ts` — Medição de latência

```ts
interface LatencyPhaseResult {
  medianMs: number;        // métrica principal
  meanMs: number;
  jitterMs: number;
  timeoutRate: number;     // 0–1
  approximateLoss: number; // %
}

runLatencyPhase(pingCount, signal, onProgress): Promise<LatencyPhaseResult>
runPingLoop(signal, intervalMs, onPing): Promise<void>
```

- `runLatencyPhase`: 15–25 pings; descarta o 1º; remove outliers > 3× mediana
- `runPingLoop`: loop contínuo de pings — usado em paralelo com DL/UL para medir bufferbloat

---

#### 3.1c `downloadProbe.ts` — Motor de download time-based

| Config | durationMs | initialStreams | maxStreams | sizeIndex | warmupMs |
|---|---|---|---|---|---|
| `DOWNLOAD_CONFIG_FAST` | 7.000 | 2 | 4 | 2 (10 MB) | 1.000 |
| `DOWNLOAD_CONFIG_COMPLETE` | 18.000 | 2 | 8 | 3 (25 MB) | 2.000 |

**Algoritmo:**
- Abre `initialStreams` streams via `cfDownloadStream`; tick de amostragem a cada 300 ms
- Cada stream: ao terminar, reabre nova requisição com novo `_cb` (fluxo contínuo)
- Paralelismo progressivo (modo completo): a cada 4 s, se ganho ≥ 10% e streams < maxStreams → abre +2 streams
- Encerramento: `AbortController` com timeout = `durationMs`

**Cálculo final (MÉDIA — não mediana, não P90):**
```
valid  = samples com tMs ≥ warmupMs
stable = valid.slice(Math.ceil(len * 0.35))   // últimos 65%
throughputMbps = mean(stable)
peakMbps       = max(valid)
stabilityScore = clamp(100 − (std/mean × 150), 0, 100)
```

**Fallback:** stream falha → tenta `DL_SIZES[i−1]` (até 2×). Todos falham → `SpeedTestError('download_failed')`.

```ts
interface DownloadProbeResult { throughputMbps; peakMbps; stabilityScore; samples: SpeedTestSample[]; }
runDownloadProbe(config, signal, onInstant): Promise<DownloadProbeResult>
```

---

#### 3.1d `uploadProbe.ts` — Motor de upload time-based

Espelho do `downloadProbe`, usando `cfUploadChunk` (XHR sem listeners em `xhr.upload`, ver §3.1a). O sampler de 300 ms é alimentado pelos bytes do buffer ao **completar cada POST** — não há progresso intra-POST por restrição de CORS.

| Config | durationMs | initialStreams | maxStreams | sizeIndex | warmupMs |
|---|---|---|---|---|---|
| `UPLOAD_CONFIG_FAST` | 7.000 | 4 | 4 | 2 (5 MB) | 1.000 |
| `UPLOAD_CONFIG_COMPLETE` | 18.000 | 8 | 8 | 3 (10 MB) | 2.000 |

Mesma lógica de janela estável (65%) e fallback com `UL_SIZES[i−1]`.

**Os antigos presets `UPLOAD_CONFIG_MOBILE_FAST/COMPLETE` (256 KB×3 / 1 MB×4) ficaram obsoletos** após o Bug-fix 2026-05 (upload mobile <2 Mbps). Continuam exportados em `uploadProbe.ts` para inspeção, mas não são mais consumidos pelo orchestrator. O perfil `mobile_broadband` agora usa o motor adaptativo descrito abaixo.

**`runAdaptiveUploadProbe(signal, onInstant)` — modo adaptativo (Bug-fix 2026-05, upload mobile <2 Mbps):**

```ts
runAdaptiveUploadProbe(signal: AbortSignal, onInstant: (mbps: number) => void): Promise<UploadProbeResult>
```

Estratégia em rodadas progressivas. Cada rodada faz N uploads paralelos de buffers idênticos; mede `roundDuration`. Se `roundDuration < 2s` e ainda há margem → escala (chunk×4, +1 stream). 2 rodadas lentas consecutivas → para. Limites: 4 rodadas máximas, 25 s totais, timeout de 6 s por rodada.

| Rodada típica em uplink ~10 Mbps | chunk | streams | duração esperada |
|---|---|---|---|
| 1 | 64 KB | 1 | ~0,06 s |
| 2 | 256 KB | 2 | ~0,4 s |
| 3 | 1 MB | 3 | ~2,4 s |
| 4 | 2 MB | 4 | ~6,4 s (timeout) |

Em uplink ~0,5 Mbps:

| Rodada | chunk | streams | duração esperada |
|---|---|---|---|
| 1 | 64 KB | 1 | ~1,0 s |
| 2 | 64 KB | 1 (não escalou) | ~1,0 s |
| 2× lento → para | | | |

Em ambos os cenários retorna `samples` reais. Lança `upload_failed` apenas quando NENHUMA rodada produz amostras (rede catastroficamente offline — não simplesmente lenta).

---

#### 3.1e `speedTestOrchestrator.ts` — Orquestrador

```ts
type SpeedTestErrorCode = 'download_failed' | 'upload_failed' | 'latency_failed' | 'network_offline' | 'server_unavailable'
class SpeedTestError extends Error { readonly code: SpeedTestErrorCode }

runSpeedTestV2(mode: 'fast' | 'complete', onProgress, signal, connectionType?): Promise<SpeedTestResult>
```

**Sequência de execução:**

1. **Latência** — `runLatencyPhase(15|25)` → emite `partial: { latency, jitter, packetLoss }`
2. **Download + bufferbloat DL** — `runPingLoop(dlPingCtrl.signal)` em background; `await runDownloadProbe`; `dlPingCtrl.abort(); await dlPingPromise` → `latencyDownload`; emite `partial: { dl }`
3. **Upload + bufferbloat UL** — mesmo padrão com `ulPingCtrl` → `latencyUpload`
4. **Diagnóstico** — `dlDelta = max(0, latencyDownload − latencyUnloaded)`; `ulDelta` idem; `severity = classifyBufferbloatSeverity(max(dlDelta, ulDelta))`; `buildDiagnostics(partialResult)`
5. Retorna `SpeedTestResult` completo com campos v2 (inclui `elapsedMs = Date.now() - testStartTime`, capturado no início do passo 1 — duração total do teste exposta no accordion "Avançado", item "Tempo total do teste")

**Seleção da estratégia de upload por perfil (Bug-fix 2026-05):** antes de iniciar a fase 1, o orchestrator chama `toConnectionProfile(connectionType)` e ramifica:
- `fixed_broadband` → `runUploadProbe(UPLOAD_CONFIG_FAST|COMPLETE, ...)` (preset fixo).
- `mobile_broadband` → `runAdaptiveUploadProbe(signal, ...)` (rodadas progressivas, ver §3.1d).

Download e latência seguem os mesmos presets em ambos os perfis — o motor `runDownloadProbe` contabiliza bytes via `ReadableStream.read()` em tempo real, sem depender de conclusão.

O `ulProgressBudget` (mapeamento da fase de upload no `overallProgress`) é o `durationMs` do preset em fixa e fixo em 25 s no modo adaptativo (teto do orçamento adaptativo).

**Resultado parcial em falha de upload (Bug-fix 2026-05):** se `runUploadProbe` lançar (ex.: nenhum chunk completou em uplink celular saturado, mesmo com presets mobile), o orchestrator:
- Distingue abort externo (`AbortError`) e offline (`navigator.onLine === false`) — esses **continuam** lançando `SpeedTestError`.
- Em qualquer outra falha, marca `ulFailed = true`, define `ul = 0`, `peakUlMbps = 0`, `ulSamples = []`, `latencyUpload = latencyUnloaded` (fallback do bufferbloat). DL e latência ficam intactos.
- Retorna `SpeedTestResult` válido. ResultScreen detecta `result.ulFailed` e exibe "—" + "não medido" na cell de upload, mais um banner "Upload não pôde ser medido. Resultado parcial." abaixo do banner de contexto.

Esse caminho preserva o teste em vez de invalidá-lo, alinhado com a UX de teste de internet em mobile (medição de DL+latência sozinha já é útil para diagnóstico).

**Mapeamento de progresso:**

A função `computeRanges(mode)` (exportada para teste em `__tests__/speedtest.test.ts`) deriva os pesos a partir do número real de amostras esperadas em cada fase: `pingCount` (latência), `dlDuration / 300ms` e `ulDuration / 300ms`. Substituiu o objeto estático `PROGRESS_RANGES` (Bloco Motion, 2026-05).

| Fase | Rápido (15+23+23) | Completo (25+60+60) |
|---|---|---|
| Latência | 0–24,6% | 0–17,2% |
| Download | 24,6–62,3% | 17,2–58,6% |
| Upload   | 62,3–100% | 58,6–100% |

**Bug fix do progresso (Bloco Motion, 2026-05):** O cálculo `local = (performance.now() % durationMs) / durationMs` era não-monotônico — `performance.now()` é tempo desde o load da página, não da fase, e `% durationMs` causa wraps. Substituído por `local = (performance.now() - phaseStart) / durationMs`, com `phaseStart` capturado imediatamente antes de `runDownloadProbe` / `runUploadProbe`. O resultado é progresso suave dentro da fase, sem oscilação para trás. Helper público `mapProgress(range, local)` clampa `local` em `[0,1]` e projeta no `range`.

### 3.2 `classifier.ts` — Classificador de qualidade

> **Fase 6 (legado removido):** Arquivo podado para < 50 linhas — contém apenas `RULE_SET_VERSION` e `classify()`. Todas as demais funções (`qualityHeadline`, `tagLabel`, `stability`, `stabilityLabel`, `buildShortPhrase`, `buildDiagnosis`, `clamp`) foram deletadas. Chamadores migrados para `interpretSpeedTestResult()` + `resolveCopy()`.

**`classify(r: SpeedTestResult): Classification`**

Tags avaliadas primeiro (independentes):
| Tag | Condição |
|---|---|
| `highLatency` | `latency > 80` ms |
| `lowUpload` | `ul < 5` Mbps |
| `unstable` | `jitter > 50` ms |
| `packetLoss` | `packetLoss > 2%` |
| `veryUnstable` | `packetLoss > 5% OR jitter > 80` ms |

Quality (avaliado em ordem, primeira correspondência vence):
| Quality | Condição |
|---|---|
| `unavailable` | `dl === 0 AND ul === 0` |
| `excellent` | DL≥100, UL≥30, lat≤30, jitter≤5, loss≤0.5% |
| `good` | DL≥50, UL≥10, lat≤60, jitter≤15, loss≤1.5% |
| `fair` | DL≥10, UL≥3, lat≤100, loss≤2% |
| `slow` | `dl > 0 OR ul > 0` |
| `unavailable` | fallback |

### 3.3 `serverRegistry.ts` — Registro de servidores

**Interface `ServerProvider`:**
```ts
interface ServerProvider {
  id: string
  name: string
  getInfo(): Promise<ServerInfo>
  checkAvailability(): Promise<boolean>
}
```

**`CloudflareProvider`:**
- `getInfo()`: fetch paralelo de `speed.cloudflare.com/cdn-cgi/trace` (IP, colo, loc) e `speed.cloudflare.com/meta` (asOrganization para ISP) via `Promise.allSettled`
- `checkAvailability()`: HEAD request para `/__down?_cb=<ts>`
- Timeout: 8s
- O `asOrganization` retornado pelo Cloudflare costuma ser o nome corporativo da ASN (ex.: "TELEFONICA BRASIL S.A."). A função interna `friendlyIsp()` mapeia para nome comercial conhecido pelo usuário brasileiro: TELEFONICA/VIVO → "Vivo", AMERICA MOVIL/CLARO/NET SERVICOS → "Claro", TIM → "TIM", OI/TELEMAR → "Oi", ALGAR → "Algar". Sem match: preserva o `asOrganization` original.

**`SERVERS: ServerProvider[]`** — array com todos os provedores ativos (atualmente só Cloudflare)

**`getDefaultServer()`, `getServer(id: string)`** — helpers para acessar o registro

### 3.4 `history.ts` — Histórico local

Chave localStorage: `linka.speedtest.history.v1`

```ts
loadHistory(): TestRecord[]      // mais recente primeiro, max 50
appendRecord(result, meta): void // FIFO, descarta mais antigos se >50
previousRecord(): TestRecord | null  // retorna o registro mais recente antes do novo
clearHistory(): void
```

`appendRecord` constrói `TestRecord` a partir de `SpeedTestResult + { serverName, isp?, deviceType, connectionType, testMode?, locationTag? }`. Os campos opcionais garantem backward-compatibility com registros gravados em versões anteriores.

`locationTag` é preenchido pelo `locationTagRef` de `App.tsx` quando o teste foi iniciado via `RoomTestScreen` ou Prova Real com cômodo selecionado. Limpo (`null`) imediatamente após `appendRecord` ser chamado.

### 3.5 `pdfExport.ts` — Exportação de PDF

**`exportResultPdf(result, serverName, isp?): Promise<void>`**
- Cria div oculto (`position:fixed; left:-9999px`) com HTML/CSS inline
- Renderiza via `html2canvas` com `scale:2` e `backgroundColor:'#FFFFFF'`
- Converte canvas para PNG → adiciona ao jsPDF A4 portrait
- Conteúdo: logo linka, data, banner de qualidade, DL/UL, lat/jitter/estabilidade, diagnóstico
- Salva como `linka-speedtest-YYYY-MM-DD.pdf`

**`exportHistoryPdf(items: TestRecord[]): Promise<void>`**
- Mesma abordagem, jsPDF A4 landscape, `scale:1.5`
- Conteúdo: logo, resumo de médias, tabela completa (Data, DL, UL, Resposta, Oscilação, Perda, Qualidade, Operadora)
- Salva como `linka-speedtest-historico-YYYY-MM-DD.pdf`

**`loadLogoBase64(): Promise<string | null>`**
- Fetch `/logo.png` → `FileReader.readAsDataURL` → base64 para `jsPDF.addImage`

### 3.6 `recommendations.ts` — Recomendações contextuais (em desuso)

> ⚠️ **Refator 2026-05.** A `RecommendScreen` foi removida e este utilitário
> deixou de ter callers ativos. As recomendações foram fundidas com a
> avaliação por métrica em `diagnosisItems.ts` (ver §3.6.1) — uma única
> lista `[problema] → [ação]` no card de Diagnóstico da ResultScreen.
>
> O arquivo segue disponível para o caso de a UX trazer de volta uma
> superfície dedicada (ou o motor unificado consumir as regras), mas
> hoje é código morto.

**`buildRecommendations(result, classification, recentHistory?): Recommendation[]`**

Gera até 3 recomendações priorizadas com base no resultado e histórico recente:

| Condição | Recomendação | Prioridade |
|---|---|---|
| `unavailable` | Repetir o teste | high |
| `packetLoss` tag — recorrente em histórico | Acionar modo Prova Real | high |
| `packetLoss` tag — pontual | Repetir o teste | high |
| `unstable` tag — recorrente | Reiniciar roteador | medium |
| `unstable` tag — pontual | Comparar localização | medium |
| `highLatency` tag | Aproximar-se do roteador | high |
| DL baixo (slow/fair) — recorrente | Contatar operadora | high |
| DL baixo (slow/fair) — pontual | Fechar apps em segundo plano | medium |
| UL < 5 Mbps | Tentar cabo + sugestão de UL fraco | medium |

Ordenado por priority (`high → medium → low`). Máximo de 3 itens retornados. "Recorrente" = ≥ 2 registros recentes com mesma condição.

### 3.6.1 `diagnosisItems.ts` — Lista compacta `[problema] → [ação]` (refator 2026-05)

Utilitário novo. Substitui a lógica que vivia espalhada na `DiagnosticScreen` (cards Internet/Wi-Fi/Resposta/Oscilação/Falhas) e alimenta a lista compacta do card de Diagnóstico na ResultScreen.

```ts
type DiagnosisSeverity = 'fail' | 'warn';

interface DiagnosisItem {
  id: string;
  icon: string;       // nome no set de icons.tsx (bolt, wifi, ping, jitter, loss, upload)
  problem: string;    // ex.: "Wi-Fi instável"
  action: string;     // ex.: "Reinicie o roteador"
  severity: DiagnosisSeverity;
}

function buildDiagnosisItems(
  result: SpeedTestResult,
  connectionType: ConnectionType | null,
): DiagnosisItem[];
```

**Thresholds por métrica** (replicam os critérios da DiagnosticScreen original):

| Métrica       | `null` (good) | `warn`        | `fail`        |
|---------------|---------------|---------------|---------------|
| Download      | dl ≥ 25       | dl ≥ 5        | dl < 5        |
| Upload        | ul ≥ 5        | ul ≥ 2        | ul < 2        |
| Latência      | lat ≤ 60      | lat ≤ 100     | lat > 100     |
| Jitter        | jit ≤ 15      | jit ≤ 30      | jit > 30      |
| Packet loss   | loss = 0      | loss ≤ 1      | loss > 1      |

Itens em `null` (good) somem da lista. Quando `connectionType === 'wifi'` e a latência dispara warn/fail, gera item específico de "Wi-Fi instável" / "Wi-Fi com sinal fraco" — e nesse caso o item genérico de "Resposta" é suprimido (evitar duplicação pelo mesmo sintoma).

**Ordenação.** `fail` > `warn`. Sort estável preserva a ordem declarativa entre itens da mesma severidade (Internet → Upload → Wi-Fi → Resposta → Oscilação → Falhas).

**Caller:** `DiagnosticActionList` interno em `ResultScreen.tsx`. Mostra os 3 primeiros + "Ver mais N" inline para o resto.

**Severidade agregada** (refator 2026-05). Helper exposto pelo mesmo módulo:

```ts
type DiagnosisAggregate = 'healthy' | 'warn' | 'fail';

function aggregateDiagnosisSeverity(items: DiagnosisItem[]): DiagnosisAggregate;
```

Regra: lista vazia → `healthy`; algum `fail` → `fail`; senão → `warn`. Não consulta `combineDiagnostics` por design — o sinal vem das métricas individuais. Usado pela ResultScreen para escolher o glow do card de Diagnóstico (verde / amarelo / vermelho via `--diag-glow-color`, ver §6.x tokens).

### 3.7 `comparison.ts` — Análise de cobertura Wi-Fi

**`calculateComparison(near, far): ComparisonResult`**

Calcula a degradação entre perto e longe do roteador. Avalia download **e** upload como sinais independentes de problema de cobertura:

| `diagnosis` | Condição |
|---|---|
| `coverage_issue` (DL forte) | DL cai > 75% E near.dl ≥ 10 Mbps |
| `coverage_issue` (UL forte) | UL cai > 75% E near.ul ≥ 3 Mbps (independente de DL) |
| `coverage_issue` (moderado) | DL > 50% OU (UL > 50% E near.ul ≥ 3 Mbps) E near.dl ≥ 10 Mbps |
| `both_bad` | near e far com DL < 10 Mbps |
| `both_good` | near e far com DL ≥ 10 Mbps e latência aceitável |
| `other` | Qualquer outra combinação |

`nearGood = near.dl >= 10 && near.latency <= 100`; `nearUploadGood = near.ul >= 3`.

Retorna percentuais de variação de DL, UL e latência, mais mensagem interpretativa em pt-BR. Testado em `src/__tests__/compare.test.ts` (12 cenários).

### 3.8 `historyInsights.ts` — Insights de tendência histórica

**`buildHistoryInsights(records: TestRecord[]): HistoryInsight[]`**

Requer ≥ 3 registros. Retorna até **4** `HistoryInsight` em ordem de avaliação (não re-ordenados por severidade):

```ts
interface HistoryInsight {
  id: string
  type: 'trend' | 'drop' | 'improvement' | 'recurring_issue' | 'stable_period' | 'info'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
}
```

Análises realizadas (em ordem de avaliação):

| Id | Condição | Severidade |
|---|---|---|
| `dl_drop_trend` | DL nova metade < DL metade antiga em > 20% (com ≥ 6 registros) | warning (>40% → critical) |
| `dl_improvement` | DL nova metade > DL metade antiga em > 20% (com ≥ 6 registros) | info |
| `recurring_latency` | ≥ 3 dos últimos 5 com latência > 80 ms | warning (≥4 → critical) |
| `recurring_loss` | ≥ 3 dos últimos 5 com packetLoss > 2% | critical |
| `low_upload` | Média de UL dos últimos 5 < 5 Mbps | warning |
| `stable_period` | ≥ 4 dos últimos 5 com jitter ≤ 15 ms E loss ≤ 1% (apenas se nenhum outro insight gerado) | info |
| `ul_drop` | UL recente < 70% da média histórica (com ≥ 6 registros, sem `low_upload`) | warning |
| `week_drop` | DL desta semana < DL da semana anterior em > 20% (≥ 2 registros em cada janela, sem outro `drop`) | warning (>40% → critical) |
| `week_improvement` | DL desta semana > DL da semana anterior em > 20% (sem outro `improvement`) | info |
| `peak_hour` | DL do pior período do dia < DL do melhor em > 30% (≥ 2 registros por período, ≥ 6 total) | warning (>50% → critical) |

**Períodos do dia para análise de horário de pico:** madrugada (0–6h), manhã (6–12h), tarde (12–18h), noite (18–24h). Baseado em `new Date(record.timestamp).getHours()`.

### 3.9 `beforeAfter.ts` — Comparação antes/depois

**`calculateBeforeAfter(before, after): BeforeAfterResult`**

```ts
type BeforeAfterVerdict = 'improved' | 'no_change' | 'worse'

interface BeforeAfterResult {
  verdict: BeforeAfterVerdict
  message: string                  // texto explicativo em pt-BR
  dlDeltaPercent: number           // (after.dl − before.dl) / before.dl × 100
  ulDeltaPercent: number
  latencyDeltaPercent: number      // (before.latency − after.latency) / before.latency × 100 (positivo = melhora)
}
```

Regras de veredicto:

| Condição | Verdict |
|---|---|
| `dlDeltaPercent > 15` OU `latencyDeltaPercent > 20` | `'improved'` |
| `dlDeltaPercent < -15` OU `latencyDeltaPercent < -20` | `'worse'` |
| Nenhum dos acima | `'no_change'` |

### 3.10 `provaReal.ts` — Média de múltiplos testes

**`averageSpeedResults(results: SpeedTestResult[]): SpeedTestResult`**

Calcula a média aritmética de `dl`, `ul`, `latency`, `jitter` e `packetLoss` sobre N resultados. O `timestamp` do resultado médio é o do último teste. Lança erro se `results` for vazio. Usado pela Prova Real para produzir um resultado consolidado de 3 medições consecutivas.

### 3.11 `dnsBenchmark.ts` — Benchmark de servidores DNS

Mede a latência de 5 servidores DNS via DNS over HTTPS (DoH) e escolhe o mais rápido.

**Servidores testados:** Cloudflare (1.1.1.1), Google (8.8.8.8), AdGuard (94.140.14.14), Quad9 (9.9.9.9), OpenDNS (208.67.222.222)

**Domínios de teste:** google.com, youtube.com, facebook.com, amazon.com.br, netflix.com

**Parâmetros:** `WARMUP_ROUNDS = 2`, `MEASURE_ROUNDS = 2` por domínio, `QUERY_TIMEOUT_MS = 5000`, `MIN_SERVER_PACING = 1500 ms`

```ts
runDNSBenchmark(signal: AbortSignal, onProgress?): Promise<DnsBenchmarkResult>
loadLastDnsResult(): DnsBenchmarkResult | null  // lê localStorage 'linka.dns.result.v1'
chooseDnsRecommendation(currentLatencyMs, benchmark[]): DnsRecommendation
```

**Tipos:**
```ts
interface DnsServerResult { id, name, ip, p50, p95, samples, grade: 'A'|'B'|'C'|'D' }
interface DnsBenchmarkResult { servers, winner, testedAt, nativeDnsMs }

type DnsRecommendation =
  | { type: 'switch'; target: DnsServerResult; deltaMs: number; deltaPct: number }
  | { type: 'already_good'; fastest: DnsServerResult }
  | { type: 'no_data' }
```

**Grades:** A (≤15 ms), B (≤30 ms), C (≤50 ms), D (>50 ms)

**Vencedor:** servidor com menor p50 entre os que têm `samples > 0`. Resultado salvo em `localStorage` na chave `linka.dns.result.v1`.

**`chooseDnsRecommendation` (Bug-1 fix 2026-05):** decide se vale trocar de DNS comparando `currentLatencyMs` (vem de `result.dnsLatencyMs`) com o servidor de menor p50 do benchmark. Sem latência atual ou sem amostras válidas → `no_data`. Caso contrário, recomenda `switch` **somente se** `deltaMs ≥ 20 ms` **E** `deltaPct ≥ 30 %` — ambos os cortes são necessários para evitar duas classes de falsos positivos:

- **AND ≥ 20 ms:** corta ganhos absolutos imperceptíveis (ex.: trocar 5 ms por 3 ms = 40 % de ganho relativo, mas 2 ms é ruído de jitter móvel — usuário não sente).
- **AND ≥ 30 %:** corta ganhos relativos pequenos (ex.: trocar 200 ms por 175 ms = 25 ms absolutos, mas só 12,5 % — não muda a percepção; provável outlier do benchmark).

Falhando qualquer um, devolve `already_good` (mantém o `fastest` para a UI mostrar como referência opcional). A UI do `DNSGuideSheet` consome o discriminated union direto: `switch` → hero comparativo + chip `−Xms · −Y%` + "Copiar IPs"; `already_good` → card único centralizado + CTA só "Fechar"; `no_data` → hero com "—" + "Medindo…".

**Integração:** DNS não faz parte do fluxo de speed test. É invocado on-demand pelo accordion "DNS" da `ResultScreen` (Mais detalhes) — disparado **uma única vez** na primeira `open` do accordion via prop `onToggle` do `<Accordion>`. Resultado fica em memória local do `<DnsAccordionBody>`; opens subsequentes reaproveitam sem refazer o teste. Timeout por servidor: 5 s; total ~5-15 s. Falha em um servidor (CORS estrito Safari, timeout, offline) renderiza `samples=0` e a tabela mostra "—" sem quebrar o resto. Status legado: a `DNSBenchmarkScreen` original foi removida no refator de arquitetura 2026-05; a função é o único caller atual.

**UI no accordion DNS:** linha por servidor com nome + chips ("Em uso" para o provider atual; "Mais rápido" para o vencedor — podem coexistir) + latência p50 + delta vs "em uso" (`±X ms`, verde se mais rápido / vermelho se mais lento). Linhas ordenadas por `samples > 0` desc → `p50` asc; falhas no fim da lista com opacidade reduzida. Estado de carregamento: "Testando N de 5 · <nome>" derivado do callback `onProgress` do `runDNSBenchmark`.

### 3.11.1 `dnsTiming.ts` — Fallback de latência DNS via Resource Timing (Fase A 2026-05)

Captura passiva da latência da primeira resolução DNS observada durante o speed test. Não inicia novos requests — só lê os `PerformanceResourceTiming` que o navegador já emitiu.

```ts
type DnsLatencyGrade = 'excellent' | 'good' | 'fair' | 'slow' | 'poor';

getDnsLatencyMs(): number | null
classifyDnsLatency(ms: number | null): DnsLatencyGrade | null
dnsLatencyLabel(grade: DnsLatencyGrade): string  // pt-BR
```

**Heurística de coleta:** filtra entries com `domainLookupEnd > domainLookupStart` E delta > 1ms (descarta cache hit zerado e ruído de timer); pega a primeira entry válida — costuma ser a primeira request da sessão. Quando todas as entries têm timing zerado (cache total ou bloqueio CORS sem `Timing-Allow-Origin: *`), retorna `null`.

**Faixas de classificação:** <20ms excellent · <50ms good · <100ms fair · <300ms slow · ≥300ms poor.

**Status (2026-05, fix Safari):** `getDnsLatencyMs` deixou de ser a fonte primária da latência DNS — passou a **fallback** secundário. Razão: Safari mobile zera os campos DNS de Resource Timing para recursos cross-origin sem header `Timing-Allow-Origin: *` (cenário dos endpoints Cloudflare Speed Test), tornando essa estratégia inviável no iOS. A medição primária agora vem de `probeDnsResolver()` em `dnsProbe.ts` (medição direta via `performance.now()`). Esta função permanece exportada e é chamada no orchestrator quando o probe DoH retorna `latencyMs === null`.

**`classifyDnsLatency` / `dnsLatencyLabel`** continuam sendo as funções públicas usadas pela UI para classificar e rotular a latência (independente da fonte).

### 3.11.2 `dnsProbe.ts` — Identificação do resolver E latência DNS (Fase B 2026-05; refator Safari 2026-05)

Pergunta ao endpoint DoH `whoami.cloudflare.com` (via `https://cloudflare-dns.com/dns-query`) qual resolver serviu a query e mede o roundtrip do próprio fetch via `performance.now()`. Devolve latência, IP do resolver e provider mapeado em uma única chamada.

**Bug-3 fix 2026-05 (DNS não identificado):** a URL anterior `whoami.cloudflare-dns.com` não existe e retornava NXDOMAIN, causando "Não identificado" em produção. A correção (a) aponta para `whoami.cloudflare.com` (domínio válido) e (b) adapta o parsing para a nova resposta TXT — agora Cloudflare retorna múltiplos registros (asn, country_code, remote_ip) e o code extrai apenas o `remote_ip`.

```ts
type DnsProbeResult = {
  latencyMs:  number | null;
  resolverIp: string | null;
  provider:   string | null;
};

probeDnsResolver(signal?: AbortSignal): Promise<DnsProbeResult>  // nunca lança
identifyDnsProvider(ip: string): string  // 'Cloudflare' | 'Google' | … | 'DNS do provedor'
```

**Por que medir latência aqui (e não via Resource Timing):** Safari mobile zera `domainLookupStart/End` para cross-origin sem `Timing-Allow-Origin: *`. A leitura passiva via `PerformanceResourceTiming` retorna `null` quase sempre no iOS, deixando a 4ª cell DNS da ResultScreen vazia. Medindo diretamente `performance.now()` em volta do fetch, o número resultante inclui DNS-do-sistema + TLS + RTT HTTP — não é DNS puro, mas é uma proxy honesta da latência percebida pelo usuário e funciona em todos os browsers, incluindo iOS Safari.

**Mapeamento IP → provedor:** array de RegExps cobrindo Cloudflare (1.1.1.0/1, 1.0.0.0/1), Google (8.8.8.8, 8.8.4.4), Quad9 (9.9.9.x, 149.112.112.x), OpenDNS (208.67.220/222.220/222), AdGuard (94.140.14.x, 94.140.15.x), Yandex (77.88.8.1/8). IPs não mapeados retornam `'DNS do provedor'` — heurística de "provavelmente resolver default da operadora".

**Tolerância a falha:** offline, CORS, timeout, JSON inválido — todos retornam `{ latencyMs: null, resolverIp: null, provider: null }`. O speedtest **não** falha quando o probe falha. Falhas (exceto `AbortError`) são logadas em `console.warn('[dnsProbe] …')` para auxiliar debug em campo via DevTools mobile. Quando o fetch tem sucesso mas o parse do JSON falha, `latencyMs` é preservado (a medição valeu) e os outros campos viram `null`.

**Integração:** chamado em `speedTestOrchestrator.ts` no início da fase upload (paralelo ao `runUploadProbe`). O `await dnsProbePromise` acontece após o término do upload — qualquer atraso é coberto pela duração do próprio upload. Se `result.latencyMs === null`, o orchestrator tenta `getDnsLatencyMs()` (Resource Timing) como fallback secundário.

**Reuso em `dnsBenchmark.ts`:** a função `probeDnsLatency()` (que mede o "DNS atual" no benchmark on-demand da `DNSBenchmarkScreen`) também delega ao `probeDnsResolver` desde 2026-05, eliminando uma duplicação de estratégia e o problema Safari naquela tela.

### 3.12 `shareCard.ts` — Geração de card de compartilhamento

**`generateShareCard(result, quality, unit?, options?): Promise<Blob>`**

```ts
interface ShareCardOptions {
  headline?: string;     // título qualitativo (resolveCopy(copyKeys.headlineKey))
  isp?: string | null;   // operadora detectada (server.isp); '—' é tratado como null
}
```

Gera PNG **1080×1080 (quadrado)** via Canvas API. Refatorado no Bloco 3 (Polimento, 2026-05) para destacar a headline e os 4 números.

Layout:
- Topo: barra accent 8px + logo "linka SpeedTest"
- Headline qualitativa em Geist 700/64px, com word-wrap em 2 linhas (largura máx. 920px)
- Grid 2×2 de cards de métrica (DL azul, UL verde, Resposta/Oscilação em texto neutro), cada card com label + valor 84px Geist 700 + unidade
- Rodapé: ISP + timestamp à esquerda, "linka.app" em accent à direita

Por que Canvas API (e não html2canvas): independe de DOM montado, mais previsível com fontes web (`document.fonts.ready`), e o utilitário pré-existia. html2canvas só faria sentido se quiséssemos espelhar o DOM exato — o que aumenta variabilidade entre browsers.

Aguarda `document.fonts.ready` antes de desenhar. Retorna `Blob` com `type: 'image/png'`. ResultScreen consome em 3 contextos: WhatsApp button (com fallback `wa.me` texto), botão "Compartilhar imagem" (Web Share API com fallback download via `URL.createObjectURL`), HamburgerMenu → onShare.

### 3.12.1 `haptics.ts` — Vibração tátil (Bloco 3 Polimento, 2026-05)

**`triggerHaptic(pattern: HapticPattern, enabled: boolean): void`**

```ts
type HapticPattern = 'phaseChange' | 'success' | 'error';
```

Wrapper sobre `navigator.vibrate(...)`. Web standard — Capacitor traduz automaticamente para haptics nativos no Android. iOS Safari/PWA ignora silenciosamente (sem equivalente público). Falha silenciosa em todos os caminhos: nunca lança.

Padrões internos:
- `phaseChange` → `30` (ms) — entre fases ativas (ex.: download → upload)
- `success` → `50` (ms) — conclusão do teste (`phase === 'done'`)
- `error` → `[100, 50, 100]` — erro (`phase === 'error'`)

Quando `enabled` é `false`, retorna sem chamar a API (curto-circuito antes de qualquer side effect). Consumido pelo `RunningScreen` via `useEffect` que monitora mudança de `phase`. A flag `enabled` vem de `useSettings().settings.useHaptics` propagado por `App.tsx` → `RunningScreen` (prop `useHaptics`).

`latency` (primeira fase) **não dispara** vibração para não competir com o tap do botão "Iniciar".

### 3.13 `combinedDiagnosis.ts` — Diagnóstico combinado

Função pura que cruza `SpeedTestResult` com dados opcionais de sinal Wi-Fi ou rede móvel para produzir um diagnóstico único em linguagem leiga.

```ts
combineDiagnostics(input: CombineDiagnosticsInput): CombinedDiagnosis
```

**Limiar `speedBad`:** `dl < 50 OR ul < 10 OR latency > 80 OR jitter > 30 OR packetLoss > 2 OR bufferbloatDeltaMs > 100`

**Fluxos de decisão:**

| `connectionType` | Dados | Causa | Confiança |
|---|---|---|---|
| `wifi` | sem `wifi` + speed ruim | `inconclusive` | low |
| `wifi` | sem `wifi` + speed bom | `healthy` | medium |
| `wifi` | speed ruim + wifi ruim | `wifi_bottleneck` | high |
| `wifi` | speed ruim + wifi bom | `operator_or_wan_issue` | high/medium |
| `wifi` | speed bom + wifi bom | `healthy` | high |
| `wifi` | speed bom + wifi ruim | `local_wifi_risk` | medium |
| `mobile` | sem `mobile` + speed ruim | `mobile_network_issue` | medium |
| `mobile` | sem `mobile` + speed bom | `healthy` | medium |
| `mobile` | speed ruim + sinal ruim | `mobile_signal_risk` | high |
| `mobile` | speed ruim + sinal bom | `mobile_network_issue` | medium |
| `mobile` | speed bom + sinal ruim | `mobile_signal_risk` | medium |
| `cable` / `unknown` | speed ruim | `internet_issue` | low |
| `cable` / `unknown` | speed bom | `healthy` | medium |

No PWA, `wifi` e `mobile` são sempre `undefined` — a função degrada graciosamente. Os tipos `WifiDiagnosticResult` e `MobileDiagnosticResult` são o contrato para integração nativa futura.

---

### 3.12 `format.ts` — Formatação

```ts
formatMbps(v: number, unit?: 'mbps'|'gbps'): string  // divide por 1000 se gbps
formatMs(v: number): string    // arredonda para inteiro
formatDate(ts: number): string // dd/MM/yyyy HH:mm
formatDateIsoLike(ts: number): string // YYYY-MM-DD para nome de arquivo
```

### 3.13.1 `appRefresh.ts` — Orquestrador do pull-to-refresh (2026-05)

```ts
performAppRefresh(opts: { reloadDeviceInfo: () => Promise<void> | void }): Promise<void>
```

Executado pelo gesto pull-to-refresh nas telas `StartScreen` e `HistoryScreen`. Estratégia em duas tentativas, na ordem:

1. **Service Worker update.** Pega `navigator.serviceWorker.getRegistration()`, chama `registration.update()` para forçar re-check de `/sw.js`. Se houver `registration.waiting` (nova versão já baixada), envia `postMessage({ type: 'SKIP_WAITING' })`, aguarda `controllerchange` (com timeout failsafe de 1.2s) e dispara `window.location.reload()`. Se reload acontece, a função nem chega ao fim.
2. **Reload deviceInfo.** Se o passo 1 não rodou (sem registration, sem versão pendente, ou Capacitor APK), chama `reloadDeviceInfo()` — geralmente `useDeviceInfo.reload`, que bumpa o `reloadKey` e dispara re-fetch do trace Cloudflare (IP/colo/ISP) + re-execução do effect Capacitor (`getLocalWifiRawInfoFromBridge`).

**Min duration de 600ms.** O spinner muito rápido fica feio ("piscou e sumiu"). A função aguarda `MIN_DURATION_MS - elapsed` antes de resolver. Gera feedback visual sólido mesmo quando o refresh é cache-hit instantâneo.

**Nunca lança.** Pull-to-refresh é UX, não lógica de negócio. Erros do SW (offline, transient) e do `reloadDeviceInfo` são engolidos — o spinner some e o usuário pode tentar de novo.

### 3.14 `relativeTime.ts` — Tempo relativo pt-BR (pacote premium 2026-05)

```ts
formatRelativeTime(timestamp: number, now?: number): string
// "agora" | "há N min" | "há N h" | "há N d" | "há N sem"
```

Pura, sem libs (sem `Intl.RelativeTimeFormat` para garantir consistência de
output entre browsers/Android WebView). Janelas: `< 60s → "agora"`, `< 1h →
"há N min"`, `< 24h → "há N h"`, `< 7d → "há N d"`, `≥ 7d → "há N sem"`.
Timestamps inválidos (NaN, ≤ 0) e futuros (skew de relógio) viram `''`/
`"agora"` respectivamente — guarda contra `há -2 min`.

Consumida pelo banner de contexto da `ResultScreen` (linha discreta entre
Large Title e bloco PRIMARY: `server · loc · isp · há N min`).

### 3.14.1 `anatelColor.ts` — cores semânticas Anatel (2026-05)

```ts
type AnatelGrade = 'good' | 'warn' | 'bad';

anatelGrade(
  deliveredMbps: number,
  contractedMbps: number | null | undefined,
  profile: ConnectionProfile,
): AnatelGrade | null

anatelGradeColorVar(grade: AnatelGrade): string  // 'var(--success)' | 'var(--warn)' | 'var(--error)'
anatelGradeGlowVar(grade: AnatelGrade): string   // 'var(--success-glow)' | 'var(--warn-glow)' | 'var(--error-glow)'
```

Avalia a velocidade entregue contra a contratada conforme as faixas da
**Resolução Anatel nº 717/2019** (RQUAL — Regulamento de Qualidade dos
Serviços de Telecomunicações):

| Perfil | `good` (verde) | `warn` (amarelo) | `bad` (vermelho) |
|---|---|---|---|
| `fixed_broadband` | ≥ 80% | 40 ≤ x < 80% | < 40% |
| `mobile_broadband` | ≥ 60% | 20 ≤ x < 60% | < 20% |

A meta da fixa (80%) corresponde ao limite mensal do RQUAL para velocidade
instantânea contratada; o piso de 40% é o ponto onde a entrega passa a ser
considerada inaceitável. Para móvel, os patamares são deflacionados (60% /
20%) refletindo a tolerância regulatória maior para conexões celulares.

**Fronteiras inclusivas no limite superior** (`pct >= 80` é `good`, `pct >= 40` é `warn`). Sem cap em 100% — overdelivery (rajada > plano) cai naturalmente em `good`.

**Retorna `null`** quando:

- `contractedMbps` é `null`, `undefined`, `0` ou negativo (plano não cadastrado / inválido);
- `deliveredMbps` é `0`, negativo, `Infinity` ou `NaN`.

A UI deve interpretar `null` como "voltar ao comportamento neutro" — no caso da `ResultScreen`, isso significa preservar `var(--dl)` / `var(--ul)` (azul/verde de marca) e o glow padrão `--dl-glow` / `--ul-glow`.

**Consumo (único hoje):** `ResultScreen.tsx`, bloco PRIMARY. Quando o usuário cadastrou velocidade contratada via `HamburgerMenu → Plano`, cada cell de Download/Upload computa `anatelGrade(result.dl|ul, contractedDown|Up, profile)` e, quando o resultado é não-nulo, aplica:

- `style.color = anatelGradeColorVar(grade)` no `.lk-result__primary-cell-value` (substitui `var(--dl)` / `var(--ul)`);
- `style['--cell-glow'] = anatelGradeGlowVar(grade)` no mesmo elemento — a regra CSS do glow lê `var(--cell-glow, var(--dl-glow))` (fallback no token de marca quando a custom property não foi setada);
- `style.color = anatelGradeColorVar(grade)` no `.lk-result__primary-cell-plan-pct` (apenas o `97%` ganha a cor; a fração `/ 600 Mbps` permanece neutra).

`profile` chega no ResultScreen via `toConnectionProfile(connectionType ?? undefined)` — mesma derivação já consumida pelo motor de interpretação. Quando `connectionType` é `undefined` (caso "Não identificada" do iOS Safari sem `navigator.connection`), o default conservador `fixed_broadband` se aplica.

**Supressão em mobile_broadband (Bug-fix 2026-05):** a `ResultScreen` força `dlAnatel = ulAnatel = null` quando `profile === 'mobile_broadband'`, mesmo que o usuário tenha cadastrado plano. Razão: a noção regulatória de "velocidade contratada" é diferente em banda larga móvel — planos celulares vendem cota de dados, não taxa garantida em Mbps. A função `anatelGrade()` continua funcional para móvel (60/20%) — esta é uma decisão de **renderização**, não do modelo. As cores revertem para `--dl` / `--ul` de marca e a linha `/ X Mbps · Y%` é suprimida (volta a aparecer "Mbps" como unidade). Em paralelo, o `HamburgerMenu` já oculta os campos de plano contratado quando `connectionType === 'mobile'` (prop `showContracted`).

Não cria tokens novos — reusa `--success` / `--warn` / `--error` (cores) e `--success-glow` / `--warn-glow` / `--error-glow` (glows), todos já existentes em `tokens.css` (criados pelo card de Diagnóstico).

Ver: `src/utils/anatelColor.ts` + `src/__tests__/anatelColor.test.ts`.

### 3.14.2 `historyTrends.ts` — Comparação inteligente entre testes (2026-05)

```ts
interface TrendComparison {
  current:  { dlAvg: number; ulAvg: number; latencyAvg: number; testCount: number };
  previous: { dlAvg: number; ulAvg: number; latencyAvg: number; testCount: number };
  dlChangePct: number;        // positivo = melhorou (DL/UL)
  ulChangePct: number;
  latencyChangePct: number;   // positivo = piorou (latência maior)
  windowLabel: string;        // "essa semana" | "esse mês"
}

computeWeeklyTrend(records: TestRecord[], now?): TrendComparison | null
computeMonthlyTrend(records: TestRecord[], now?): TrendComparison | null

describeTrend(trend): {
  headline: string;     // "Sua média essa semana é 580 Mbps"
  comparison: string;   // "▼ 12% pior que a semana passada."
  severity: 'good' | 'neutral' | 'bad';
}

isTrendSignificant(trend): boolean   // true quando algum delta >= 10%
```

Particiona o histórico em duas janelas adjacentes (atual: últimos N dias; anterior: N-2N dias atrás) e calcula delta percentual de DL/UL/latência. Mínimo de 5 testes em cada janela; abaixo disso retorna `null`. Convenção de sinais: positivo = melhorou (DL/UL); positivo na latência = piorou. `describeTrend()` inverte o sinal da latência na exibição para que `▼` sempre signifique "piora" do ponto de vista do usuário.

Thresholds:
- `>= 10%` (`SIGNIFICANT_PCT`) — variação suficiente para renderizar o card.
- `>= 20%` (`SEVERE_PCT`) — adjetivo "bem melhor" / "bem pior" (em vez de "melhor" / "pior" simples).

**Consumo:** `HistoryScreen` chama `computeWeeklyTrend(items)` e cai para `computeMonthlyTrend(items)` quando a janela semanal não tem amostras significativas. Se nenhuma das duas é significativa, o card não aparece. O delta entra como border-left colorido pelo `severity` (`good`/`bad`/`neutral`) — sem box-shadow.

Testes: `src/__tests__/historyTrends.test.ts` cobre janelas insuficientes, mudanças positivas/negativas/zero, severidade, narrativa por DL e por latência, formatação Mbps→Gbps.

### 3.14.3 `anatelReport.ts` — Relatório de denúncia Anatel (2026-05)

```ts
interface AnatelComplaintData {
  contractedDownMbps: number;
  contractedUpMbps:   number;
  testRecords:        TestRecord[];   // janela analisada
  belowThresholdCount: number;        // < 80% do plano
  belowCriticalCount:  number;        // < 40% do plano
  averageDeliveredPct: number;        // % média entregue
  windowDays:          number;        // 30 (default)
}

isAnatelComplaintEligible(records, contractedDl, contractedUl, now?): AnatelComplaintData | null
generateAnatelReport(data, isp): Promise<void>   // dispara download de PDF A4
```

`isAnatelComplaintEligible` retorna `null` (não há reclamação) quando:

- plano não cadastrado (`contractedDl <= 0`);
- menos de 5 testes nos últimos 30 dias;
- entrega média ≥ 80% (Resolução Anatel 717/2019 — limite para banda larga fixa).

Caso contrário retorna o snapshot de evidências. `HistoryScreen` consome o snapshot para renderizar o card "Anatel — entrega abaixo do contratado" (ícone de escudo `--warn`, descrição com a % média + contagem de testes, CTA "Gerar relatório"). O card é suprimido em planos móveis (`dominantProfile(items) === 'mobile_broadband'`) — a Resolução 717/2019 trata banda larga fixa de modo distinto.

`generateAnatelReport` produz PDF A4 retrato via `jsPDF` + `html2canvas` (mesma infra de `pdfExport.ts`):

1. Header com logo `linka` + título + linha "Resolução Anatel 717/2019".
2. Identificação: provedor (ISP dominante), plano contratado, período avaliado, número de medições.
3. Headline com border-left `--error`: "Entrega média: X% do plano contratado" + parágrafo legal.
4. Estatísticas 4-col: média/mediana de DL e UL.
5. Tabela cronológica: cada teste com data, DL, UL, latência e % do plano (cor do % por threshold: vermelho `< 40%`, amarelo `< 80%`, verde `≥ 80%`).
6. Rodapé com instruções de uso (operadora + Procon + Anatel) + ressalva de "não substitui aferição EAQ".

O PDF respeita multi-página (loop com `addPage` quando o canvas excede a altura A4). Nome do arquivo: `linka-anatel-YYYY-MM-DD.pdf`.

Não usa libs novas — reusa `jspdf`, `html2canvas` e `format.ts`.

---

## 3.10 Motor unificado (`src/core/`)

Camada introduzida na Fase 1 do plano de unificação (PWA + linka Flutter). Pura, sem dependência de React, DOM, navegador ou localStorage.

**Estado atual (Fase 6 concluída — migração completa):** `ResultScreen`, `HistoryScreen` e `pdfExport.ts` usam exclusivamente `interpretSpeedTestResult()` + `resolveCopy()`. O `classifier.ts` legado foi podado — mantém só `RULE_SET_VERSION` e `classify()` (ainda necessário para `TestRecord.quality` e bridge de recomendações). `ResultScreen` deriva o `ConnectionProfile` a partir do `connectionType`; `HistoryScreen` usa o perfil dominante da amostra analisada.

**Dispersão histórica no resumo:** O card "Média dos seus testes" da HistoryScreen usa `syntheticLoss` (% de testes slow/unavailable nos últimos 5) como proxy de instabilidade temporal — evita que históricos alternando excelente/péssimo apareçam como "bons". Quando `stability.level === 'unstable' | 'oscillating'`, exibe o rótulo de estabilidade em vez do headline de quality.

**Copy (Fase 5):** `<dt>Perda de pacotes</dt>` substituído por `<dt>Perda de sinal</dt>` em ResultScreen e HistoryScreen — alinhado com o chip tag `flag.packetLoss`. Grep por "Perda de pacotes", "Jitter", "pacotes" em `src/screens/` retorna zero.

**Fase 6 (legado removido):** `pdfExport.ts` migrado para `interpretSpeedTestResult()` + `resolveCopy()` — sem mais imports de `classifier.ts`. `useUnifiedEngine` removido de `useSettings`. `LiveChart.tsx` foi deletado nesta fase e **re-introduzido** no Bloco Motion (2026-05) como mini-gráfico SVG inline (sem libs).

**Polimento UX 2026-05 (Top 5 quick wins):** Padronização de vocabulário consumido pelas telas via `resolveCopy`. Chaves novas adicionadas ao `copyDictionary.ts`:

- `metric.packetLoss` (`Falhas`) e `metric.packetLoss.long` (`Falhas na conexão`) — substituem "Perda" / "Perda de pacotes" em HistoryScreen, `flag.packetLoss`, `diagnosis.packetLoss`, `diagnosis.history.loss`, `historyInsights.recurring_loss` e `recommendations.repeat_loss`.
- `metric.latency` (`Resposta`), `metric.latency.short` (`RESP`), `metric.latency.loaded` (`Resposta com a rede ocupada`) e `metric.latency.loadedValue` (`Resposta com tráfego`) — substituem `PING`/`LAT` no RunningScreen e `Latência sob carga`/`Latência carregada` no DetailsScreen.
- `useCase.<id>.label` / `.label.short` e `useCase.status.<good|maybe|limited>` / `.short` — versão única dos nomes de use cases (longo p/ recomendações, curto p/ chip apertado). Eliminam duplicação local em `ResultScreen.ucLabel` e `recommendations.derivePositiveUsecases`.
- `theme.light` / `theme.dark` (`Claro` / `Escuro`) — usados pelo StartScreen.

ResultScreen ganhou um bloco de headline qualitativa no topo do scroll: chip de variant cor por `quality` + título (`copyKeys.headlineKey`) + subtítulo (`copyKeys.shortPhraseKey`). É a única peça que consome diretamente os copy keys do motor — o resto da tela ainda usa thresholds locais e será migrado em fase posterior. Layout dos blocos abaixo intacto.

**Bloco 2 — Hero confiante (2026-05):** o `lk-result__headline` (texto solto sem fundo) foi promovido a `lk-result__hero` — superfície destacada com `var(--surface)` + `var(--border)` + `var(--radius-lg)` e padding 18px. O título migrou para 26px / weight 700 (antes 22px / weight 600), `font-display`, `letter-spacing: -0.01em`. A linha superior (`lk-result__hero-row`) coloca título à esquerda (`flex: 1`) e o `Chip` de estabilidade à direita; o subtítulo fica abaixo. Tipografia dos 4 números do grid (`lk-result__metric-val--lg/--md`) também migrou: de `var(--font-mono)` weight 600 → `var(--font-display)` weight 700, com tamanho subindo de 26→28px (lg) e 20→22px (md). `useCountUp` continua animando os mesmos targets.

**Refactor visual ResultScreen (2026-05):** revisão de hierarquia. Mudanças principais:

- **Hero card removido.** As regras `.lk-result__hero*` e `.lk-result__headline-*` saíram do CSS e do JSX. O motor (`interpret.ts`) continua produzindo `copyKeys.headlineKey` e `shortPhraseKey` — só não são mais consumidos pela tela (a headline qualitativa segue sendo usada na composição do `shareCard`). TopBar agora exibe `title="Último teste"` quando `scrolled`, ocupando o papel de identificador da tela.
- **Large Title pattern (frente B 2026-05).** O sentinel virou o próprio `<PageHeader ref={sentinelRef} size="md" title="Último teste">` no início do scroll content — mesmo padrão de Explore/History/Diagnostic. Substitui a iteração anterior, que usava um `<div className="lk-result__sentinel" aria-hidden />` 1×1 invisível absolute. O `.lk-result__scroll` voltou a ter `padding-top: 0` (o `PageHeader` compensa a altura do TopBar internamente) e perdeu o `position: relative` que servia ao sentinel absolute. Resultado: na abertura, TopBar transparente e título grande no scroll; ao rolar, glass + título pequeno — igual às demais telas.
- **Métricas em dois blocos com pesos distintos.** O grid 2×2 antigo foi substituído por `lk-result__primary-block` (DOWNLOAD + UPLOAD em 52px mobile / 64px desktop, font-display 700, cor por métrica via `var(--dl)` / `var(--ul)`) e `lk-result__secondary-block` (RESPOSTA + OSCILAÇÃO + FALHAS). **Reajuste 2026-05 (frente A):** o secondary-block recebeu nova proporção visual igualada à linha de use cases — `secondary-cell-value` 14px mobile / 15px desktop, peso 500, cor `var(--text-2)`; `secondary-cell-label` 9px peso 600 uppercase letter-spacing 0.08em (idêntico ao label dos use cases); `secondary-cell-unit` 10px. O bloco é "info de rodapé compacta", não compete mais com o primary. Padronização Polimento UX: `packetLoss` aparece como **"Falhas"** (curto). Todos os números usam `font-variant-numeric: tabular-nums` para evitar tremor durante `useCountUp`. Os badges A-F por métrica saíram — as grades agora vivem nos use cases.
- **Grades A-F nos use cases.** Cada item de `lk-result__use-row` ganhou um chip `<grade> · <label>` (ex.: `B · Bom`) no lugar do antigo `OK / Atenção / Ruim`. A cor segue `gradeStyle(grade)` (mesmas CSS vars `--grade-a..f` + backgrounds `--color-good/warn/bad-bg`). **Ajuste 2026-05 (consistência visual):** o ícone do use case agora também usa `gradeStyle(grade)` — o mesmo objeto `{background, color}` é aplicado tanto no wrapper do ícone quanto no chip, garantindo que ícone e chip nunca divirjam (antes o ícone consumia `verdict.status` enquanto o chip consumia `useCaseGrade()`, gerando casos como ícone amarelo + chip verde). Os helpers `ucIconBg(status)` / `ucIconColor(status)` foram removidos.
- **Helper novo `src/core/useCaseGrade.ts`.** Pure (sem React/DOM, segue a regra do `src/core/`). `useCaseGrade(verdict, metrics, profile)` retorna `'A'|'B'|'C'|'D'|'F'`: pega o pior grade entre as métricas que o use case considera (mapeamento espelha `buildUseCaseEvaluators()` em `interpret.ts`). Cortes A-F vêm dos thresholds de qualidade do profile (`PROFILES[profile].quality.excellent/good/fair`) — `flags.unstable` / `flags.veryUnstable` cobrem o degrau C/D do jitter (não há `fair.jitter`) e `flags.packetLoss * 2.5` (limite veryUnstable de perda) cobre o degrau D do packet loss. Reexportado em `src/core/index.ts`. Também exporta `gradeMetric()` para teste isolado por métrica. Testes em `src/__tests__/useCaseGrade.test.ts` cobrem: tudo A; mistura A+B; mistura A+F; packet loss alto bloqueando gaming; mesmo download em fixed vs mobile (grade diferente).

**Pacote premium ResultScreen (2026-05).** Camada de polimento aditivo sobre o refactor visual acima — não toca em `interpret.ts`/`copyDictionary.ts`/`speedTestOrchestrator.ts`/`core/*` e não cria componentes JSX novos (tudo inline + classes CSS):

- **Banner de contexto** (`.lk-result__context-bar`) entre Large Title e bloco PRIMARY. Linha única discreta `server.name · server.loc · server.isp · formatRelativeTime(result.timestamp)` em `--font-display` peso 500 11/12px cor `--text-2`. Cada pedaço some individualmente quando o campo é nulo ou `'—'` (CloudflareProvider devolve `'—'` para campos não detectados); a linha inteira só some se TODOS os pedaços sumirem (caso em que vira `--verdict-only` justify-end com só o chip).
- **Verdict chip** (`.lk-result__verdict-chip`) — chip pequeno na ponta direita do banner com label pt-BR derivado de `interpreted.quality`. Mapping local em `verdictLabel()`/`verdictStyle()` no próprio `ResultScreen.tsx` (não há keys `quality.<X>.adj` no `copyDictionary.ts`, e o dicionário é zona "não tocar"). Cores reaproveitam tokens `--color-good-bg` / `--color-warn-bg` / `--color-bad-bg` × `--grade-a`/`-c`/`-f`, mantendo coerência com os chips de grade dos use cases.
- **Plano vs entregue.** Quando `contractedDown`/`contractedUp` (de `useSettings`) são truthy e `> 0`, cada cell do `lk-result__primary-block` ganha uma sub-linha `.lk-result__primary-cell-plan` com `/ Y Mbps · Z%` (Z = `Math.round((dl/contractedDl)*100)`, sem cap em 100% — overdelivery aparece como `102%`). O hero number animado (`useCountUp`) continua sendo o entregue absoluto; a porcentagem é computada sobre `result.dl` final (não animada — por design, percentual é contexto, número absoluto é o que o usuário lê primeiro). Quando o campo contratado é `null`/`0`, o cell preserva a unit-line tradicional `.lk-result__primary-cell-unit`.
- **Glow nos hero numbers.** `text-shadow: 0 0 16px var(--cell-glow, var(--dl-glow|--ul-glow)) !important` aplicado SOMENTE em `.lk-result__primary-cell:nth-child(1|2) .lk-result__primary-cell-value`. `!important` é necessário pra bater o reset universal de `text-shadow` em `tokens.css`. Tokens novos `--dl-glow` (rgba 0.40 dark / 0.30 light) e `--ul-glow` (idem) — ver §7 Tokens globais e §7 Regras globais. A custom property `--cell-glow` (sem token global, setada inline pelo `ResultScreen.tsx` quando o plano contratado está cadastrado) sobrescreve o glow padrão para a família semântica Anatel — ver §3.14.1.
- **Stagger fade-in (CSS-only).** `@keyframes lk-fade-up` (8px → 0, opacity 0 → 1, 320ms `cubic-bezier(0.2,0.7,0.2,1)`, `animation-fill-mode: backwards`) aplicado a cada bloco principal do scroll content com `animation-delay` escalonado: PageHeader 0ms → context-bar 60ms → primary 120ms → secondary 180ms → use-row 240ms → wifi-card 300ms → combined 360ms → tools/footer 420ms. Bloqueado por `@media (prefers-reduced-motion: reduce) { animation: none !important }`. **Refeito em 2026-05 com a unificação dos 4 cards** — ver bloco abaixo.
- **Helper novo `src/utils/relativeTime.ts`** — ver §3.14.
- **Helper novo `src/utils/anatelColor.ts`** (2026-05) — cores semânticas Anatel para Download/Upload quando o plano contratado está cadastrado. Ver §3.14.1.

**Card unificado de teste (2026-05).** Mais um passo em cima do Pacote premium: os 4 blocos (PRIMARY, SECONDARY, USE CASES, WI-FI) deixaram de ser 4 cards empilhados e viraram 4 seções internas de UM único container `.lk-result__test-card`. O verdict da medição, antes comunicado por um chip flutuante (`.lk-result__verdict-chip`) na ponta direita do banner de contexto, agora é comunicado pela cor de um **ribbon de 3px no topo do card** (border-top). Mudanças:

- **Wrapper `.lk-result__test-card`** (`background: var(--surface-deep)`, `border: 1px solid var(--border)`, `border-top: 3px solid var(--ribbon-color, var(--border))`, `border-radius: var(--radius-lg)`, `overflow: hidden`). A cor do ribbon vem de uma **CSS custom property inline** `style={{ '--ribbon-color': qualityRibbonColor(quality) }}` (cast `as CSSProperties`). Helper `qualityRibbonColor(q: Quality)` em `ResultScreen.tsx`: `excellent|good → var(--success)`, `fair → var(--warn)`, `slow|unavailable → var(--error)`. Decisão consciente: usamos os tokens **cheios** (`--success/--warn/--error`) e não os `--color-*-bg` (alpha 0.08-0.10 ficaria invisível em 3px). Fallback `var(--border)` quando a custom property não foi setada (não acontece no fluxo normal — defesa).
- **Blocos internos perderam fundo/borda/raio/margem.** `.lk-result__primary-block`, `.lk-result__secondary-block`, `.lk-result__use-row` e `.lk-wifi-card` herdam o background do card; `border`/`border-radius`/`margin-bottom` saíram. Padding interno foi mantido (e padronizado para 16px lateral nos 3 blocos não-primary, contra 20px do primary). Como `.lk-wifi-card` só é renderizado dentro do `.lk-result__test-card` (verificado por busca global em 2026-05), o estilo aplica diretamente sem `:not()`.
- **Hairlines internas.** `.lk-result__secondary-block`, `.lk-result__use-row` e `.lk-wifi-card` ganharam `border-top: 1px solid var(--border-subtle)`. O primeiro filho (`.lk-result__primary-block`) NÃO ganha hairline — o ribbon do card cumpre o papel de "topo". Token `--border-subtle` já existia em `tokens.css` (dark `#1F1F2A`, light `#F0EEE8`); nenhum token novo foi criado.
- **Chip flutuante removido.** O JSX de `.lk-result__verdict-chip` saiu (do banner de contexto e da variante `--verdict-only`); o CSS do chip e da variante também. O texto do verdict permanece acessível via `aria-label="Resultado: {verdictLabel}"` no `<section>` e via `<span className="sr-only">Verdict: …</span>` como primeiro filho. Utility `.sr-only` (clip + width 1px clássico) foi adicionada localmente em `ResultScreen.css` por não existir como global no projeto. `verdictStyle()` foi removido (não há mais consumer); `verdictLabel()` ficou (usado pelo aria-label/sr-only).
- **Banner de contexto sem peças → some inteiro.** Antes, quando todas as peças do banner eram nulas, ele virava `--verdict-only` justify-end com só o chip. Como o chip foi embora, o banner agora retorna `null` se `parts.length === 0` — uma linha vazia não tem razão de existir.
- **Stagger fade-in atualizado.** Os 4 blocos internos não animam mais individualmente. O card inteiro anima como peça única com `animation-delay: 120ms`. Sequência nova: PageHeader 0ms → context-bar 60ms → **test-card 120ms** → combined 240ms → tools/footer 320ms. As regras de `prefers-reduced-motion: reduce` foram atualizadas para o novo seletor.

Trechos chave:

- `src/screens/ResultScreen.tsx` — helper `qualityRibbonColor(q)` (sem export — local), `<section className="lk-result__test-card" style={...} aria-label={...}>` envolvendo os 4 blocos, `<span className="sr-only">` no topo do card, banner de contexto sem o chip.
- `src/screens/ResultScreen.css` — `.lk-result__test-card`, `.sr-only`, blocos internos sem bg/border, hairlines, stagger refeito.
- `src/features/local-wifi/WifiSignalCard.css` — `.lk-wifi-card` perdeu bg/border/radius/margin e ganhou `border-top: 1px solid var(--border-subtle)`.

### 3.10.1 Contrato — `interpretSpeedTestResult(input)`

```ts
function interpretSpeedTestResult(input: InterpretInput): InterpretedResult

interface InterpretInput {
  metrics: SpeedTestResult
  profile: ConnectionProfile
  history?: TestRecord[]
}

interface InterpretedResult {
  ruleSetVersion: RuleSetVersion        // versão das regras aplicadas (atualmente 'v1')
  profile: ConnectionProfile             // ecoado da entrada
  quality: Quality                       // excellent | good | fair | slow | unavailable
  flags: InterpretFlags                  // 6 booleanos (highLatency, lowUpload, unstable, packetLoss, veryUnstable, highBufferbloat)
  stability: { score: number; level: StabilityLevel }
  useCases: UseCaseVerdict[]             // 4 cenários: gaming, streaming_4k, home_office, video_call
  recommendations: Array<{               // disparos rastreáveis para a fase de UX
    id: string
    priority: 'low' | 'medium' | 'high'
    triggeredBy: Array<keyof InterpretFlags | 'history' | 'useCase'>
  }>
  copyKeys: {                            // chaves para resolveCopy() — não strings
    headlineKey: string
    shortPhraseKey: string
    diagnosisKeys: string[]
    stabilityLabelKey: string
  }
}
```

**Princípios de design:**

- O motor retorna **chaves de copy**, não strings. O dicionário pt-BR vive em `copyDictionary.ts`. Isso permite que o app Flutter use o mesmo motor com seu próprio dicionário.
- Os **UseCases** olham todas as métricas relevantes (download, upload, latência, jitter, perda) — não só uma fração. Streaming 4K com perda alta cai de "good"; Games com latência boa não cai para "limited" só por jitter levemente alto.
- O ajuste de **stability** rebaixa um nível quando `latency > rules.flags.highLatency × 1.5`. Resolve o caso "Muito estável" exibido junto com "Resposta alta" (achado da auditoria).
- **`highBufferbloat`** (flag v2): disparado quando `bufferbloatSeverity === 'high' | 'critical'`. Penaliza quality um nível quando severity é `'critical'` (excellent→good, good→fair). Gera recomendação com prioridade `'high'`.
- **`stabilityScore`** (campo v2): quando presente no input, `computeStability()` usa o valor calculado pela série temporal do Motor v2 em vez de derivar o score das métricas sumárias.

### 3.10.2 `ConnectionProfile` — fixa vs. móvel

`ConnectionProfile` (em `src/types/index.ts`) é o eixo regulatório Anatel:

- `fixed_broadband` — Wi-Fi, cabo, ethernet. Thresholds em paridade com o `classifier.ts` legado nesta fase.
- `mobile_broadband` — rede celular. Thresholds deflacionados: download/upload exigem ~50% do que a fixa exige; latência tolera +30 ms; jitter e perda são iguais (não há razão regulatória para afrouxar).

A função `toConnectionProfile(connectionType)` em `src/utils/connectionProfile.ts` faz o mapeamento `wifi/cable → fixed_broadband`, `mobile → mobile_broadband`, `undefined → fixed_broadband` (default conservador).

### 3.10.3 `RULE_SET_VERSION`

Exportado por `src/utils/classifier.ts` e reusado pelo motor. Versiona o conjunto de regras gravado em cada `TestRecord` (`record.ruleSetVersion`). Bump quando os thresholds mudarem materialmente — assim, registros antigos podem ser reinterpretados (ou marcados como sob regra antiga) ao recarregar o histórico.

Atualmente: `'v1'`. Os thresholds de `fixed_broadband` têm paridade com o legado — bump será necessário quando os thresholds divergirem materialmente (Fase 4/5, calibração de copy e ajuste fino de regras).

### 3.10.4 Arquivos

| Arquivo | Conteúdo |
|---|---|
| `src/core/types.ts` | `UseCaseId`, `UseCaseStatus`, `BlockingFactor`, `StabilityLevel`, `UseCaseVerdict`, `InterpretFlags`, `InterpretedResult`, `InterpretInput` |
| `src/core/profiles.ts` | `QualityThresholds`, `FlagThresholds`, `UseCaseThresholds`, `ProfileRules`, `PROFILES: Record<ConnectionProfile, ProfileRules>` + `GamingProfileId`, `GamingProfileThresholds`, `GamingProfileDef`, `GAMING_PROFILES` |
| `src/core/copyDictionary.ts` | Map `chave → string pt-BR` + `resolveCopy(key, params?)` com interpolação `{name}` |
| `src/core/interpret.ts` | `interpretSpeedTestResult(input)` — função principal |
| `src/core/networkQualityClassifier.ts` | `gradeFrom(deltaMs)` (migrado de `bufferbloat.ts`), `classifyBufferbloatSeverity(deltaMs)`, `computeStabilityFromSamples(samples)`, `buildDiagnostics(result)`, `severityToGrade(s)` |
| `src/core/index.ts` | Reexporta o contrato público para uso externo (Fase 7 / Flutter embed) |

**`GAMING_PROFILES`** — thresholds de desempenho por perfil de gamer:

```ts
type GamingProfileId = 'casual' | 'moba' | 'fps' | 'cloud'

interface GamingProfileThresholds { dl: number; latency: number; jitter: number; packetLoss: number }
interface GamingProfileDef { label: string; good: GamingProfileThresholds }

GAMING_PROFILES: Record<GamingProfileId, GamingProfileDef> = {
  casual: { label: 'Casual',       good: { dl: 3,  latency: 150, jitter: 50,  packetLoss: 3   } },
  moba:   { label: 'MOBA',         good: { dl: 5,  latency: 50,  jitter: 20,  packetLoss: 1   } },
  fps:    { label: 'FPS',          good: { dl: 15, latency: 30,  jitter: 10,  packetLoss: 0.5 } },
  cloud:  { label: 'Cloud Gaming', good: { dl: 35, latency: 40,  jitter: 15,  packetLoss: 0.5 } },
}
```

Usado por `GamingVerdict` na ResultScreen para avaliar se as métricas do teste atendem ao perfil selecionado.

---

## 4. Hooks (`src/hooks/`)

### 4.1 `useDeviceInfo(serverId = 'cloudflare')`

**Retorno:** `{ device, server, loading, error, reload }`

**Fluxo:**
1. `detectDevice()` (síncrono) → analisa UA + viewport → `DeviceInfo` inicial.
2. Em paralelo, se `Capacitor.isNativePlatform()` for true → `getLocalWifiRawInfoFromBridge()` refina `connectionType` (Bug-fix 2026-05, ver "Cascata de detecção" abaixo).
3. `navigator.connection?.type` e `?.effectiveType` → `connectionType` (na versão síncrona).
4. `provider.getInfo()` → busca `ServerInfo` (trace + meta Cloudflare).
5. `provider.checkAvailability()` → HEAD request de verificação.
6. AbortController no cleanup do useEffect (`cancelled = true`).
7. `reload()` → incrementa `reloadKey` para re-executar o efeito (e o effect Capacitor escuta `reloadKey`, então re-checa o plugin a cada teste).

**Estratégia de refresh do ISP (Bug-fix 2026-05):** o `ServerInfo` (IP, colo, ISP) era resolvido **uma única vez** no mount do App e ficava congelado mesmo após troca de rede (Wi-Fi → 4G ou troca de operadora). Três gatilhos de refresh foram adicionados:

1. **`navigator.connection.change`** — Chrome Android dispara confiavelmente; o handler atualiza `device` (re-detecta `connectionType`) **e** bumpa `reloadKey` para refetch de `getInfo()`.
2. **`window.online`** — caso clássico iOS Safari (modo avião → 5G) que não expõe `navigator.connection`. Bumpa `reloadKey` igualmente.
3. **Início de cada teste** — `App.tsx` ouve `test.phase === 'latency'` e chama `deviceInfoReloadRef.current()` (ref para evitar re-disparo quando o objeto `deviceInfo` muda). O fetch corre em paralelo com o teste; quando `phase === 'done'` (10–20 s depois), `appendRecord` captura o ISP atualizado.

A combinação garante: (a) StartScreen mostra ISP correto após troca de rede mesmo sem iniciar teste; (b) o registro persistido em histórico (`TestRecord.isp`) reflete a rede ativa no momento da medição.

**Cascata de detecção de `connectionType`** (Bug-fix 2026-05 — rede móvel/Wi-Fi):

Antes da correção, a heurística tentava `navigator.connection.type` e, se ausente (Safari iOS / Firefox / Capacitor com `type='unknown'`), caía em "se for mobile device → assume mobile" — o que classificava erroneamente PWA iOS em casa (Wi-Fi) como `mobile`. APK Capacitor, idem. A nova ordem é:

1. **Capacitor APK** (`Capacitor.isNativePlatform() === true`): `getLocalWifiRawInfoFromBridge()` → se `available && ssid` → `wifi`; caso contrário (sem Wi-Fi visível, permissão negada, etc.) → `mobile` (no APK não há cabo). Este é um effect async paralelo: o state inicial vem da heurística web (passo 2-4) e é refinado pelo plugin nativo logo depois. O effect re-executa quando `reloadKey` é bumpado (App.tsx faz isso no início de cada teste — ver §`useDeviceInfo` passo 7).
2. `connection.type === 'wifi'` → `wifi`
3. `connection.type === 'cellular'` → `mobile`
4. `connection.type === 'ethernet' | 'wimax'` → `cable`
5. `connection.type === 'bluetooth'` → `mobile` (tethering)
6. Sem `type` mas `effectiveType` em `'2g' | '3g' | 'slow-2g'` → `mobile`
7. **Fallback final**: `deviceType === 'desktop'` → `cable`; mobile/tablet → `wifi` (PWA standalone em casa é o caso mais comum). Log `console.warn` para diagnóstico.

> O override manual em **Configurações → Conexão** sempre vence (ver `App.tsx::effectiveConnection`) — não passa pela cascata.

**Listeners de mudança de rede:**
- `navigator.connection.change` (Chrome Android, confiável) → re-detecta + bumpa `reloadKey`.
- `window.online` / `window.offline` (caso clássico iOS Safari: avião → 5G) → idem.
- Início de cada teste (`App.tsx` ouve `test.phase === 'latency'` e chama `deviceInfoReloadRef.current()`) → bumpa `reloadKey`, dispara re-fetch do ISP **e** re-execução do effect Capacitor.

**`serverId`** é passado como prop de `App.tsx`. Atualmente fixo em `'cloudflare'`.

### 4.2 `useSpeedTest()`

**Retorno:** `{ phase, instantMbps, overallProgress, result, error, live, start, cancel, reset }`

**Assinatura de `start`**: `start(connectionType?: ConnectionType, mode?: SpeedTestMode)`. O hook mapeia `mode` para `'fast' | 'complete'` e chama `runSpeedTestV2(v2Mode, onProgress, signal, connectionType)`. Modos `'normal'` e `'quick'` mapeiam para `'fast'`; `'complete'` e `'advanced'` mapeiam para `'complete'`.

**Erros classificados:** no `catch`, instâncias de `SpeedTestError` têm seu `code` mapeado para mensagens pt-BR amigáveis via `errorMessageFor(code)`:
- `network_offline` → "Sem conexão com a internet."
- `server_unavailable` → "Servidor não disponível no momento."
- `download_failed` → "Falha ao medir o download."
- `upload_failed` → "Falha ao medir o upload."
- `latency_failed` → "Falha ao medir a latência."

**`live: LivePoint[]`** — buffer dos últimos 60 pontos `{ t: number, speed: number, phase: 'download'|'upload' }`. Mantido por compatibilidade interna; **não é mais consumido** pela RunningScreen.

**Suavização do `instantMbps`:**
- `targetMbpsRef` recebe o valor bruto do callback `onProgress`
- `requestAnimationFrame` roda loop de EMA: `next = 0.25 * target + 0.75 * rendered`
- `renderedMbpsRef` → `setState({ instantMbps: next })`

**Parciais progressivos (`SpeedTestProgress.partial`):**  
O orchestrator emite `partial: { latency, jitter, packetLoss }` após a fase de latência e `partial: { dl }` após o download. A RunningScreen pode consumir esses valores para exibição progressiva enquanto a fase seguinte corre.

### 4.3 `useSettings()`

**Retorno:** `{ settings: Settings, update: (patch: Partial<Settings>) => void }`

```ts
interface Settings {
  unit: 'mbps' | 'gbps'            // padrão: 'mbps'
  connectionOverride: 'auto' | 'wifi' | 'cable' | 'mobile'  // padrão: 'auto'
  hideIpOnShare: boolean            // padrão: true — oculta IP ao compartilhar resultado
  gamingProfile: GamingProfile      // padrão: 'off' — perfil de gamer para veredicto na ResultScreen
  defaultMode: 'fast' | 'complete' // padrão: 'complete' — modo selecionado na StartScreen, persiste entre sessões
  useHaptics: boolean              // padrão: true — vibração tátil em transições de fase / conclusão / erro (Bloco 3 Polimento, 2026-05)
}
```

`gamingProfile` controla o bloco `GamingVerdict` da ResultScreen e o hint da StartScreen. Quando `'off'`, nenhum desses elementos é exibido. Configurado no BottomSheet → seção Configurações via seletor segmentado `[Off] Casual MOBA FPS Cloud`.

`defaultMode` é atualizado toda vez que o usuário altera o seletor de modo na StartScreen, garantindo que o modo persista após fechar e reabrir o app.

Chave localStorage: `linka.speedtest.settings.v1`  
`update` faz merge com settings atual e persiste imediatamente.

> **Bloco 6 — UX uniforme (2026-05):** o campo órfão `scale` foi removido do tipo `Settings` e dos `DEFAULTS`. `load()` continua usando `{ ...DEFAULTS, ...stored }`, que tolera silenciosamente o campo extra em localStorage de usuários antigos — o spread copia a chave para o objeto runtime sem efeito (não há leitor) e ela é descartada na próxima escrita parcial via `update()` se este reescrever só campos válidos. Sem migração explícita, sem risco de quebra.

### 4.4 `usePullToRefresh(scrollContainerRef, onRefresh, options?)` — Pull-to-refresh universal (2026-05)

Hook que habilita o gesto "puxar pra atualizar" sobre qualquer scroll container. Funciona idêntico em PWA web (mobile/desktop) e APK Capacitor — o caminho touch trata mobile com `preventDefault` confiável; o caminho pointer (apenas `pointerType !== 'touch'`) cobre mouse no desktop sem mexer com scroll do navegador.

**Assinatura:**

```ts
usePullToRefresh(
  scrollContainerRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<void>,
  options?: { threshold?: number; resistanceFactor?: number; enabled?: boolean },
): { pullDistance: number; isRefreshing: boolean; isReady: boolean }
```

**Defaults:** `threshold = 80px` (pull em px após resistência para entrar em "ready"), `resistanceFactor = 0.5` (puxar 100px no dedo move 50px no spinner).

**Lógica do gesto:**

1. `touchstart`/`pointerdown` arma SOMENTE quando: (a) `scrollContainer.scrollTop === 0`; (b) o alvo NÃO está dentro de `.lk-dsheet` (sheet aberto rouba o gesto). Se já scrollou pra baixo ou está sob um sheet, o hook deixa o gesto passar inteiro.
2. `touchmove`/`pointermove`: se `dy > 0` (puxando pra baixo), aplica resistência e chama `preventDefault()` (`touchmove` apenas, e só quando armado) — anula rubber-band do iOS Safari sem comprometer scroll normal.
3. `touchend`/`pointerup`: `pullDistance < threshold` → snap back animado, no-op. `pullDistance ≥ threshold` → entra em `isRefreshing`, aguarda `onRefresh()`, snap back.

**Co-existência com `useScrollHeader`:** ambos os hooks operam sobre o mesmo `scrollContainerRef` (StartScreen / HistoryScreen) sem conflito — um lê `scroll`, o outro intercepta `touchmove`/`pointermove`. As listeners são adicionadas via `addEventListener` direto (sem React synthetic events), com `touchmove` em `{ passive: false }` para permitir `preventDefault`.

**Co-existência com `DraggableSheet`:** o predicado `target.closest('.lk-dsheet')` é avaliado no `touchstart`/`pointerdown` — se o gesto começou dentro de um sheet aberto, o hook não arma e o sheet processa o drag-to-resize normalmente. Importante: o `.lk-dsheet__backdrop` cobre 100% da tela quando aberto, então mesmo que o usuário toque "fora" do pill do sheet, o evento alvo é o backdrop, que NÃO tem `.lk-dsheet` como ancestor — neste caso o pull-to-refresh do scroll container abaixo armaria. Para evitar isso, telas que possam abrir sheets passam `enabled: !!onRefresh && !sheetIsOpen` quando aplicável (ex.: HistoryScreen desliga o gesto quando `selected` — detalhe de registro — está aberto).

**Co-existência com swipe lateral do `App.tsx`:** o swipe para `goBack`/`goForward` exige `dx > dy * 1.5` (mais horizontal que vertical) — gesto vertical do pull-to-refresh nunca dispara navegação por engano.

### 4.5 `useCountUp(target, durationMs?, decimals?)` — Bloco Motion

Hook RAF puro que anima um número de 0 (ou do último valor renderizado) até `target`, com easing `easeOutCubic`. Retorna sempre um `number` — o caller continua chamando `formatMbps` / `formatMs` com o valor animado.

**Assinatura:** `useCountUp(target: number | null | undefined, durationMs = 700, decimals = 1): number`

- `null` / `undefined` / `NaN` / `Infinity` são normalizados para `0` via `normalizeTarget`.
- Mudanças menores que `epsilon = 10^(-decimals) / 2` no target não disparam re-animação — protege contra renders intermediários da React que reentregam o mesmo valor com ruído de ponto flutuante.
- Helpers puros (`easeOutCubic`, `lerpEased`, `normalizeTarget`, `epsilonFor`, `shouldStartAnimation`) são exportados para teste em `__tests__/useCountUp.test.ts`.

**Fix StrictMode dev (2026-05):** o predicado de re-animação foi trocado de "comparar `safeTarget` com `targetRef.current`" para `shouldStartAnimation(safeTarget, valueRef.current, epsilon)`. O bug original deixava os 4 cards do `ResultScreen` em `0/—` mesmo com o teste salvando os valores reais no histórico: em StrictMode dev o efeito roda duas vezes no mount; a 1ª invocação mutava `targetRef = 604` e a 2ª caía no early-return porque `|604 − 604| < ε`, sem reiniciar o RAF que o cleanup havia cancelado. Comparar com `valueRef.current` (que continua em 0) resolve o caso e cobre também o cenário "target chega depois do mount" (renderização inicial com `result.dl == null`). Regressão coberta em `useCountUp.test.ts` no bloco `describe('shouldStartAnimation (regressão ResultScreen)')`.

**Uso atual:** `ResultScreen` aplica em `result.dl`, `result.ul`, `result.latency`, `result.jitter`. Para `formatMs` (que retorna `'—'` quando `v ≤ 0`), o caller passa `Math.max(0.1, animValue)` quando o `target > 0` — evita o glifo `—` aparecer no início da animação enquanto o RAF rampa de 0 ao alvo.

> `hideIpOnShare: true` é o padrão — ao compartilhar via texto ou PDF, o IP público é substituído por "Oculto" na seção Detalhes da ResultScreen.

---

## 5. Componentes (`src/components/`)

### 5.1 `PathRow`

Props: `device, server, loading`

Três nós SVG conectados por linhas:  
`[DeviceIcon]───[ConnectionIcon]───[IconServer]`

- Labels abaixo de cada nó (ex: "Celular", "Wi-Fi", "Cloudflare")
- Linha animada com `stroke-dashoffset` via CSS keyframes ao carregar
- Ícones importados de `icons.tsx`

### 5.2 `BottomSheet`

Props: `open, onToggle, onClose, device, server, loading, settings, onUpdateSettings`

- `position:fixed; bottom:0; max-width:480px; margin:auto`
- Fechado: `transform: translateX(-50%) translateY(calc(100% - 110px))` (peek de 110px)
- Aberto: `transform: translateX(-50%) translateY(0)`
- Backdrop fade em/out; click fora fecha
- **Gestos verticais** ligados em `.lk-sheet__handle-area`: `onTouchStart/Move/End` aplicam `transform` em tempo real durante o arrasto e, ao soltar, decidem com base em threshold de 60 px se chamam `onToggle()` (abrir) ou `onClose()` (fechar)
- O click em `.lk-sheet__handle-area` segue funcionando como fallback para taps rápidos
- A SettingRow "Gráfico" foi removida; o array `SCALE_OPTS` foi removido do componente
- Subcomponente interno `Seg<T>` para controles segmentados
- **Seção de privacidade:** toggle "IP ao compartilhar" (`['hide','show']`) que altera `settings.hideIpOnShare`. Nota informativa abaixo: "Seus testes ficam salvos neste aparelho. Você decide quando exportar ou compartilhar."

### 5.3 `Gauge` (redesenhado)

Props: `value: number (0–1), phase: string, num: string, unit: string, color: string, size?: number`

SVG com dois `<circle>`: track (`--surface-3`) e fill (cor dinâmica) com `strokeDasharray={2πr}`, `strokeDashoffset = 2πr × (1 – value)`, `strokeLinecap="round"`. Overlay central absolutamente posicionado exibe:
- `.lk-gauge__phase` — label da fase (10px, uppercase, `--accent`)
- `.lk-gauge__num` — número hero (80px, Geist 700, `tnum`) — Bloco 2 (Hero confiante, 2026-05) bumpou de 72px/`--font-mono` weight 600 para 80px/`--font-display` weight 700, alinhando com o Manifesto §5 ("números de métrica sempre em Geist")

**Bloco 3 — Polimento (2026-05):** o arco ativo do gauge ganhou `filter: drop-shadow(0 0 ${4 + value*3}px ${color})` aplicado inline no `<circle>` do fill. Glow é sutil (4-7px de blur) e escala levemente com o `value` (progresso da fase), produzindo a sensação de "ganhar energia" enquanto a barra completa. A cor herda do `stroke`, então acompanha a fase: `--dl` no download, `--ul` no upload, `--accent` em latency. Geometria, dasharray e linecap não mudaram. `transition` foi estendido para incluir `filter` (mesma duração e curva).
- `.lk-gauge__unit` — unidade (12px, `--text-3`)

Usado em `RunningScreen` com helpers que calculam `gaugePhaseLabel(phase)` e `gaugeColor(phase)`. O `value` (preenchimento do arco) vem do `overallProgress` contínuo emitido pelo orchestrator (Bloco Motion) — passado como prop nova `overallProgress` desde `App.tsx`. Há fallback `gaugeProgressFallback(phase)` (degrau 0 → 0.15 → 0.5 → 0.85 → 1) usado apenas quando o consumidor não fornece o progresso, mantendo o componente utilizável fora do fluxo padrão. **Fix saltos do arco (2026-05):** antes o `value` vinha sempre de `gaugeProgressFallback(phase)`, então a transição latência → download → upload pulava em saltos visíveis. Trocar para `overallProgress` deixou o arco fluindo monotonicamente — a transição CSS de 0.5s já existente ficou imperceptível porque os updates chegam a cada ~300 ms e a magnitude entre eles é pequena.

### 5.3.1 `LiveChart` — mini-gráfico ao vivo (Bloco Motion, 2026-05)

Props: `points: LivePoint[], phase: TestPhase, width?, height?`

Mini sparkline SVG inline (sem libs) que renderiza a velocidade instantânea durante o teste. Usa `viewBox="0 0 320 64"` com `preserveAspectRatio="none"` — ajusta-se ao container responsivo (`.lk-running__chart` na RunningScreen, `max-width: 320px`). Cor da linha por fase: `var(--dl)` para download, `var(--ul)` para upload. Auto-escala vertical pelo máximo de `speed` na série filtrada da fase atual (descarta pontos de fases anteriores → reset visual implícito ao trocar download → upload). `vector-effect="non-scaling-stroke"` mantém a espessura constante apesar do `preserveAspectRatio="none"`.

Importa `LivePoint` de `useSpeedTest` (`{ t, speed, phase: 'download'|'upload' }`). O hook já throttle os pontos a 200 ms e mantém no máximo 60 (`MAX_POINTS`), então o componente apenas renderiza o que recebe.

### 5.3.2 `Accordion` — bloco expansível (refator 2026-05)

Props:

```ts
interface AccordionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  onToggle?: (open: boolean) => void;
}
```

Componente em `src/components/Accordion.tsx` + `.css`. Foi criado no refator de arquitetura 2026-05 para os 3 expansives da section "Mais detalhes" da ResultScreen (Avançado / Modo Gamer / DNS). **No refator drag-to-resize 2026-05 perdeu seus callers** — a section "Mais detalhes" virou 3 rows clicáveis que abrem bottom sheets dedicados (`AdvancedSheet`, `GamerSheet`, `DNSGuideSheet`). O componente permanece disponível para uso futuro (não foi deletado).

**Visual.** Container `var(--surface-deep)` + border + `border-radius: var(--radius-lg)`, `overflow: hidden`. Header é um `<button>` com `aria-expanded` (preferimos botão a `<details>/<summary>` para controle total do estilo do header sem polyfill de `::marker`). Layout do header: `[icon] title [chevron]`. Chevron rotaciona 180° quando aberto (`transform: rotate(-180deg)`, transição 240ms cubic-bezier).

**Animação.** Conteúdo anima via `max-height` lendo `scrollHeight` do `contentRef` (sem `auto`, que não anima). Transição 320ms cubic-bezier. `prefers-reduced-motion: reduce` zera ambas as animações.

**Acessibilidade.** Header é botão semântico com `aria-controls` apontando para o `id` gerado pelo `useId()`. Conteúdo carrega `role="region"` + `aria-hidden` espelhando o estado.

### 5.3.3 `DraggableSheet` — base universal de bottom sheet (refator drag-to-resize 2026-05)

Props:

```ts
type SnapPoint = 'compact' | 'expanded';

interface DraggableSheetProps {
  open: boolean;
  onClose: () => void;
  initialSnap?: SnapPoint;       // default 'compact'
  children: ReactNode;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  nested?: boolean;              // eleva z-index para empilhar (default false)
}
```

Componente em `src/components/DraggableSheet.tsx` + `.css`. **Base obrigatória de todo bottom sheet do app.** Substituiu as animações próprias do `DNSGuideSheet`, `WifiDetailsSheet` e `WifiOptimizeSheet`, e é a base dos novos `AdvancedSheet` e `GamerSheet`.

**Snap points.** Dois pontos de parada definidos como % do viewport:

- `compact` = 60vh (default ao abrir).
- `expanded` = 88vh.

**Drag math.** Pointer events ficam SÓ na `__handle-area` (28px de altura, full width, com a barra 40×4 centralizada). Não vão no `__content` para não conflitar com scroll interno. Convenção: `dy > 0` (pointer descendo) reduz a altura; `dy < 0` aumenta. A altura efetiva é convertida de pixels para vh dividindo por `window.innerHeight` e multiplicando por 100. Resistência (`OVERDRAG_RESISTANCE = 0.3`) é aplicada quando o usuário tenta exceder `expanded` — sem isso o sheet "estica" infinito.

**Snap logic em `pointerup`.** Avaliada nesta ordem:

1. Velocidade descendente > 0.8 px/ms (≈ 800 px/s) → fecha.
2. Velocidade ascendente > 0.8 px/ms → snap para `expanded`.
3. Distância: arrastou pra baixo > 30% da altura inicial → fecha.
4. Senão, snap para o ponto mais próximo (compact ou expanded).

A velocidade é medida entre o último e o penúltimo `pointermove` (janela curta = medida instantânea). Não usa rolling average — basta para fast-swipe-detection.

**Animações.** Sem transition durante drag (responsivo); 300ms `cubic-bezier(0.32, 0.72, 0, 1)` ao soltar (snap). Animação de entrada: `lk-dsheet-slide-up` 280ms `transform: translateY(100%) → 0`. Backdrop fade 220ms. Backdrop opacity escala com a altura — quando o usuário puxa pra baixo, o backdrop começa a desaparecer junto, dando feedback visual de "está fechando".

**Stacking (`nested`).** Ativa modifiers `--nested` que sobem o z-index pro stacking acima de outro sheet (backdrop 10000, sheet 10001). Usado pelo `WifiOptimizeSheet`, que abre por cima do `WifiDetailsSheet`. Sem `nested`, defaults são 9998/9999.

**Body scroll lock + Esc.** Ambos são tratados aqui (centralizados) — os consumidores não duplicam a lógica.

**Acessibilidade.** `role="dialog"` + `aria-modal="true"` no container; o consumidor passa `ariaLabel` ou `ariaLabelledBy` apontando para o título do header.

### 5.3.4 `PullToRefreshIndicator` — pill flutuante do pull-to-refresh (2026-05)

Props:

```ts
interface Props {
  pullDistance: number;
  isRefreshing: boolean;
  isReady: boolean;
  threshold?: number; // default 80
}
```

Componente em `src/components/PullToRefreshIndicator.tsx` + `.css`. Renderiza um pill 36×36 com spinner SVG inline, posicionado `position: fixed; top: calc(var(--safe-top) + 56px)` (logo abaixo do TopBar), centralizado horizontalmente. A `transform: translate(-50%, …px)` é controlada via inline style — segue o dedo durante o pull e segura na posição "ready" durante `isRefreshing`.

**Spinner pre-refresh.** Arco SVG (`<circle r="9" stroke="…" />`) cuja `stroke-dashoffset` cresce conforme `pullDistance / threshold` (0 → 270° de arco). Cor: `var(--accent)` (decisão consciente — accent é a cor de "ação ativa" do produto; mais alinhado com o feedback de "algo está acontecendo" do que `var(--text)`). Quando `isReady`, a borda do pill ganha `var(--accent-border)` para sinalizar "solte agora".

**Spinner refreshing.** SVG inteiro recebe `animation: lk-ptr-spin 1s linear infinite` (rotação contínua). O arco usa `dashoffset = perimeter * 0.25` (¾ visíveis), produzindo o efeito clássico de spinner indeterminado.

**Sem box-shadow.** Regra do projeto. A separação visual do conteúdo abaixo vem de `background: var(--surface-deep)` + `border 1px var(--border)`.

**`prefers-reduced-motion`.** Para a rotação contínua via `@media (prefers-reduced-motion: reduce)`. O arco do pre-refresh continua reagindo ao input do usuário (não é animação automática) — não foi suprimido.

**Acessibilidade.** `role="status"` + `aria-live="polite"` no container; texto sr-only alterna entre "Puxe para atualizar" / "Solte para atualizar" / "Atualizando" conforme estado.

### 5.3.5 `Skeleton` — placeholder com shimmer (loading states, 2026-05)

```tsx
interface SkeletonProps {
  width?: string | number;     // default '100%'
  height?: string | number;    // default 16
  variant?: 'rect' | 'pill' | 'circle';  // default 'rect'
  className?: string;
  style?: React.CSSProperties;
  ariaBusy?: boolean;
}
```

Placeholder visual com animação shimmer linear. Substitui textos "Carregando…" por retângulos animados que dão pista do shape do conteúdo a vir. Sem box-shadow (regra do projeto). Cores via `--surface` e `--surface-2`.

**Visual.** Background gradient `linear-gradient(90deg, var(--surface) 25%, var(--surface-2) 50%, var(--surface) 75%)` com `background-size: 200% 100%`. Animação `lk-skeleton-shimmer` 1.5s linear infinite translada o gradient (200% → -200% no eixo X).

**Variants.**
- `rect` (default) — `border-radius: var(--radius-sm)`. Card placeholders.
- `pill` — `border-radius: 999px`. Texto inline e badges.
- `circle` — `border-radius: 50%`. Avatares e ícones.

**`prefers-reduced-motion`.** Override em `@media`: animação removida, fica estático em `--surface-2`.

**Acessibilidade.** Por default `aria-hidden="true"` — o componente é ornamental e o parent dita o estado de loading. Quando o caller passa `ariaBusy`, o Skeleton ganha `role="status"` + `aria-busy="true"` (raro — em geral o parent gerencia via `aria-busy` no container).

**Locais de uso (2026-05).**

| Local | Estado de loading | Skeleton render |
|---|---|---|
| `App.tsx` → `ScreenLoadingFallback` | Chunk lazy de tela secundária baixando | TopBar pill 36×36 + título central 140×16 + 2 cards (80px e 60px) |
| `WifiSignalSection` | `useWifiDiagnostics` em `loading` | 3 linhas: kicker pill 40×12 + label pill 120×16 + barra rect 8×100% |
| `DNSGuideSheet` | `running && !effectiveBench` (benchmark sem seed) | 5 rows com nome do server + skeleton pill 32×16 — cada row se "completa" individualmente conforme o callback `onServerComplete` do `runDNSBenchmark` reporta o servidor |
| `HistoryScreen` | `records === undefined` (edge case) | Não implementado — `useState(() => loadHistory())` é síncrono; o estado nunca é `undefined` na prática |

**`runDNSBenchmark` — callback `onServerComplete` (2026-05).** Adicionado para alimentar o skeleton incremental do DNSGuideSheet. Assinatura:

```ts
runDNSBenchmark(
  signal: AbortSignal,
  onProgress?: (done: number, total: number, current: string) => void,
  onServerComplete?: (server: DnsServerResult) => void,
): Promise<DnsBenchmarkResult>
```

Disparado dentro do loop de servers logo após `benchmarkServer` resolver — antes do `MIN_SERVER_PACING`. Permite à UI remover o placeholder de cada server progressivamente sem esperar o benchmark completo.

### 5.3.6 `InfoTooltip` — botão `?` educacional (a11y, 2026-05)

```tsx
interface InfoTooltipProps {
  label: string;          // texto explicativo, 1-2 frases pt-BR
  ariaLabel?: string;     // texto alternativo p/ screen readers
}
```

Botão `?` 16×16 inline com balão flutuante explicativo. Click ou Enter/Space alterna; click fora ou ESC fecha. Posicionamento: padrão abaixo do `?`; se overflow no viewport bottom, aparece acima (calculado via `getBoundingClientRect` no momento da abertura). A11y: `<button aria-expanded>` real (não div fake) com `aria-describedby` apontando para o balão `role="tooltip"`. Sem dependência de hover (mobile-friendly).

**Consumo (2026-05).**

| Tela / Sheet | Métricas com tooltip |
|---|---|
| `ResultScreen` SECONDARY | Resposta, Oscilação, Falhas |
| `AdvancedSheet` | Latência sob carga (Bufferbloat A-F), Latência sob carga (valor), Oscilação carregada, Estabilidade do download |
| `WifiDetailsSheet` | Sinal (RSSI), Velocidade do link, Banda |

`IOSList` foi estendido com a prop opcional `titleAfter?: ReactNode` para encaixar o tooltip ao lado do label sem mudar o tipo de `title` (que continua `string`). Consumidores legados ignoram a prop.

### 5.4 `IOSList`

```tsx
interface IOSListItem {
  icon?: ReactNode;       // conteúdo do quadrado 28×28
  iconBg?: string;        // cor de fundo do ícone (CSS var ou hex)
  title: string;
  titleAfter?: ReactNode; // conteúdo opcional após o título (ex.: <InfoTooltip>)
  subtitle?: string;
  trailing?: ReactNode;   // valor ou chip à direita
  showChevron?: boolean;
  onClick?: () => void;
}
```

Lista estilo iOS Settings. Fundo `--surface`, borda `--border`, `border-radius: --radius`, `overflow: hidden`. Cada row: flex, `padding: 13px 14px`, separada por `border-bottom: 1px solid var(--hairline)`. Ícone: `28×28px`, `border-radius: 7px`. Última row sem border-bottom.

Usada em: ResultScreen (métricas DL/UL/lat), GamerScreen (avaliação por jogo), StartScreen (informações do servidor).

### 5.5 `Chip`

```tsx
type ChipVariant = 'good' | 'maybe' | 'bad' | 'accent' | 'neutral';
interface ChipProps { variant: ChipVariant; children: ReactNode; }
```

Badge/pílula com 5 variantes semânticas. Estilos:

| Variante | Fundo | Texto |
|---|---|---|
| `good` | `--ul-tint` | `--ul` |
| `maybe` | `rgba(245,166,35,0.16)` | `--warn` |
| `bad` | `rgba(255,69,58,0.16)` | `--error` |
| `accent` | `--accent-tint` | `--accent` |
| `neutral` | `--surface-2` + borda `--border` | `--text-2` |

Usada em: ResultScreen (badge de qualidade, chips de casos de uso), GamerScreen (badge "Otimizado p/ jogos").

### 5.6 `icons.tsx` — Biblioteca de ícones

Todos os ícones são SVGs inline. Componente primitivo `<Icon name={...} size={...} color={...} />` que consulta o mapa `ICON_PATHS`. Os exports nomeados legados (`DeviceIcon`, `ConnectionIcon`, etc.) são preservados.

Ícones disponíveis no mapa `ICON_PATHS`:

| Nome | Uso |
|---|---|
| `download` / `upload` | Indicadores de velocidade |
| `ping` / `jitter` / `loss` | Métricas de latência |
| `wifi` / `router` / `home` | Wi-Fi e roteador |
| `history` | Histórico |
| `game` | Modo Gamer |
| `bolt` | Internet / velocidade |
| `shield` | Qualidade de uso |
| `bulb` | Recomendações |
| `cog` | Configurações |
| `refresh` | Refazer teste |
| `share` | Compartilhar |
| `check` | Aprovado |
| `close` | Fechar |
| `chevron` | Seta de navegação |
| `arrowDown` | Download |
| `pin` | Localização |
| `signal` | Sinal |

Componentes nomeados mantidos para compatibilidade com PathRow e BottomSheet: `DeviceIcon`, `ConnectionIcon`, `IconServer`, `IconBuilding`, `IconGames`, `IconStream`, `IconWork`, `IconVideoCall`, `IconPdf`, `IconShare`, `IconWhatsApp`.

**`ConnectionIcon` (consumo expandido em 2026-05 — Bug-fix rede móvel):** o componente já existia e era usado em `PathRow` e `HistoryScreen` (lista). Após o Bug-fix de detecção/UX de rede móvel, passou a ser consumido também em:

- `ResultScreen` — banner de contexto, canto direito (size 16, cor `var(--text-2)`). Renderizado quando `connectionType ∈ {wifi, mobile, cable}`. `aria-label` `"Conexão: <Wi-Fi|Rede móvel|Cabo>"`.
- `HistoryScreen` (HistoryDetail) — hero do detalhe, abaixo do subtítulo (size 20, cor `var(--text-2)`), com label textual ao lado.

Assinatura do componente (`{ kind: ConnectionType; size?: number }`) não mudou — `'unknown'` é tratado pelo consumer (Result/HistoryDetail só renderiza para os 3 tipos canônicos).

### 5.7 Bloco 5 — TopBar System (2026-05)

Sistema de cabeçalho universal aplicado em todas as 14+ telas. Substitui os headers inline pré-Bloco 5 (`‹ Voltar`, `‹ Início`, `lk-*__head` específico de cada tela) por uma família consistente de componentes.

**Estrutura visual:**
- `<TopBar>` posicionado em `position: absolute; top: 0; z-index: 50`. Altura 56px + safe-top.
- Estado `scrolled = false`: fundo transparente, sem borda.
- Estado `scrolled = true`: fundo `var(--surface-translucent)` com `backdrop-filter: blur(20px) saturate(160%)` e borda inferior `var(--border-subtle)`.
- Transições: 200ms ease (background, blur e border simultaneamente).

**Componentes:**

| Arquivo | Função |
|---|---|
| `TopBar.tsx` / `.css` | Container do header. Slots: `leftSlot` (ou `onBack`), `title` + `showTitle`, `rightActions[]`. Aceita `scrolled: boolean` e `useHaptics?: boolean`. |
| `BackButton.tsx` / `.css` | Pill 36×36 com chevron único. Área tocável 44×44. Active scale(0.94). Dispara `triggerHaptic('phaseChange', useHaptics)` no clique. |
| `IconButton.tsx` / `.css` | Mesmo padrão visual do `BackButton`, slot livre para qualquer SVG. Usado para hamburger, share, PDF, history. |
| `PageHeader.tsx` / `.css` | Título grande no início do scroll. `size: 'lg'` (32→40px @480px) ou `size: 'md'` (24→28px). Aceita `subtitle` e `trailing` (slot direito para chips). Padding-top compensa altura do TopBar. |
| `useScrollHeader.ts` | Hook com `IntersectionObserver`. Retorna `{ scrolled, scrollContainerRef, sentinelRef }`. O sentinel é o próprio `<PageHeader ref={sentinelRef}>`. Quando o sentinel sai da viewport, `scrolled` vira `true` e o TopBar ganha glass + título pequeno. |

**Padrão de uso:**

```tsx
const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

return (
  <div className="lk-tela">
    <TopBar
      onBack={onBack}
      scrolled={scrolled}
      title="Histórico"
      showTitle={scrolled}
      useHaptics={useHaptics}
      rightActions={[{ icon: <IconPdf size={18} />, onClick: handlePdf, ariaLabel: 'Exportar PDF' }]}
    />
    <div className="lk-tela__scroll" ref={scrollContainerRef}>
      <PageHeader ref={sentinelRef} title="Histórico" subtitle="Seus testes recentes" />
      ...
    </div>
  </div>
);
```

**Migração:** o título da página agora vive no scroll content como `<PageHeader>` Geist 700 32px. Quando o usuário rola e o título grande sai da viewport, ele migra para o slot pequeno do TopBar (Geist 600 14px) com fade-in. Telas sem rolagem (StartScreen) usam apenas o TopBar e podem omitir `showTitle`.

**Telas exceções:**
- `StartScreen`: `leftSlot={<Logo />}` em vez de back; sem PageHeader (orb central já é o hero). **Bloco 6 — UX uniforme (2026-05):** ganhou `<div className="lk-start__sentinel" ref={sentinelRef} />` posicionado em `position: absolute; top: calc(var(--safe-top) + 56px)`, e `scrollContainerRef` ligado ao próprio `.lk-start` (que é o container com `overflow-y: auto`). Comportamento atual idêntico (sem rolagem, sem glass), mas se a tela ganhar conteúdo, o glass passa a aparecer automaticamente.
- `RunningScreen`: sem `onBack` (não dá para voltar mid-test); título "Medindo…" sempre visível (`showTitle={true}` permanente).

**Helper testável:** `deriveScrolled(isIntersecting: boolean): boolean` — espelha a regra de decisão do hook. Coberto por `src/__tests__/useScrollHeader.test.ts`.

---

## 6. `App.tsx` — Estado global e roteamento

Estado gerenciado em `App.tsx`:

| State | Tipo | Descrição |
|---|---|---|
| `theme` | `'dark'\|'light'` | Tema atual, persiste em localStorage |
| `screen` | `Screen` | Tela ativa: `'start'\|'running'\|'result'\|'history'\|'comparison'\|'beforeafter'\|'roomtest'\|'explore'\|'localwifi'`. **Refator 2026-05:** removidos `'diagnostic'`, `'gamer'`, `'recommend'`, `'dnsbenchmark'`, `'dnsguide'`, `'details'` (consolidados na ResultScreen). |
| `isOnline` | `boolean` | Conectividade detectada via eventos `online`/`offline` do browser |
| `previous` | `TestRecord\|null` | Registro do teste anterior à sessão atual (para comparação na ResultScreen) |
| `lastRecord` | `TestRecord\|null` | Último registro do histórico, exibido como card na StartScreen |
| `historyInitialId` | `string\|undefined` | Id pré-selecionado quando se abre o HistoryScreen direto no detalhe |
| `testMode` | `'fast'\|'complete'` | Modo selecionado na StartScreen; inicializado a partir de `settings.defaultMode` (lido do localStorage); atualizado via `handleStart` e via `StartScreen.handleModeChange` |
| `comparisonStep` | `ComparisonStep` | Passo da ComparisonScreen: `'near'\|'far'\|'done'` |
| `comparisonNear` | `SpeedTestResult\|null` | Resultado do teste perto do roteador |
| `comparisonFar` | `SpeedTestResult\|null` | Resultado do teste longe do roteador |
| `baStep` | `BeforeAfterStep` | Passo da BeforeAfterScreen: `'before'\|'after'\|'done'` |
| `baBefore` | `SpeedTestResult\|null` | Resultado do teste "antes" |
| `baAfter` | `SpeedTestResult\|null` | Resultado do teste "depois" |
| `provaRealSession` | `number\|null` | Número do teste atual (1, 2 ou 3) durante Prova Real; `null` fora do modo |
| `provaRealOverride` | `SpeedTestResult\|null` | Resultado médio calculado ao fim da Prova Real; passado para ResultScreen |

Refs (não disparam re-render):

| Ref | Tipo | Descrição |
|---|---|---|
| `comparisonModeRef` | `'near'\|'far'\|null` | Intercepta o done-effect para rotear para ComparisonScreen |
| `baModeRef` | `'before'\|'after'\|null` | Intercepta o done-effect para rotear para BeforeAfterScreen |
| `provaRealResultsRef` | `SpeedTestResult[]` | Acumula os 3 resultados intermediários da Prova Real |
| `provaRealPendingRef` | `boolean` | Sinaliza que o próximo teste da Prova Real deve ser iniciado assim que `test.phase === 'idle'` |
| `locationTagRef` | `string\|null` | Etiqueta de cômodo definida em RoomTestScreen; limpa após `appendRecord` |
| `recordedRef` | `boolean` | Evita gravação duplicada no histórico |
| `backStackRef` | `Screen[]` | Pilha de telas anteriores para swipe → |
| `forwardStackRef` | `Screen[]` | Pilha de telas avançáveis para swipe ← |
| `returnToRef` | `Screen` | Guarda a origem de fluxos modais/avançados |
| `screenRef` | `Screen` | Espelha a tela atual para handlers estáveis |

Hooks usados:
- `useDeviceInfo('cloudflare')` → `deviceInfo`
- `useSpeedTest()` → `test`
- `useSettings()` → `settings, updateSettings`

**Pilha de navegação:**

```
goTo(next):    push(currentScreen) em backStack; clear forwardStack; setScreen(next)
goBack():      pop() de backStack → push(currentScreen) em forwardStack; setScreen(prev)
goForward():   pop() de forwardStack → push(currentScreen) em backStack; setScreen(next)
goToReturnTarget(): clear forwardStack; setScreen(returnToRef.current) sem empilhar a tela atual
```

Transições normais usam `goTo`, alimentando a pilha de back automaticamente. Retornos de fluxos avançados (`Comparison`, `BeforeAfter`, `RoomTest`, `History`) usam `goToReturnTarget()` para voltar à origem sem criar loop na pilha.

**Swipe lateral:** wrapper `<div onTouchStart onTouchEnd>` em torno da view ativa. Em `onTouchStart` registra `{x, y, valid}` (válido se o alvo não está em `.lk-sheet`, `.lk-history__list`, `button`, `input`, `textarea` ou `a`). Em `onTouchEnd` calcula `dx`/`dy`; aceita gesto se `|dx| ≥ 80 px` e `|dx| > |dy| × 1.5`. `dx > 0` → `goBack`; `dx < 0` → `goForward`.

**`effectiveConnection`:** computado em todo render como `settings.connectionOverride !== 'auto' ? override : deviceInfo.device?.connectionType`. Usado em `handleStart`/`handleRetry` ao chamar `test.start(effectiveConnection)`.

**Fluxo de gravação automática:**

```
test.phase === 'done' && test.result && !recordedRef.current
  ─── Prova Real ativa (provaRealSession !== null): ───────────────────────────────
  → provaRealResultsRef.push(result)
  → se provaRealSession < 3:
      setProvaRealSession(session + 1); recordedRef = false
      provaRealPendingRef = true; test.reset()
      [efeito idle]: provaRealPendingRef → test.start(effectiveConnection, 'complete')
  → se provaRealSession === 3:
      averaged = averageSpeedResults(provaRealResultsRef)
      appendRecord(averaged, { ..., locationTag? })
      locationTagRef = null; setProvaRealOverride(averaged) → goTo('result')

  ─── Fluxo normal: ───────────────────────────────────────────────────────────────
  → previousRecord() → setPrevious(prev)
  → appendRecord(test.result, { serverName, isp, deviceType, connectionType, testMode, locationTag? })
  → locationTagRef = null; setLastRecord(novoRegistro)
  → comparisonModeRef === 'near' → setComparisonNear(result)    → goTo('comparison')
  → comparisonModeRef === 'far'  → setComparisonFar(result)     → goTo('comparison')
  → baModeRef === 'before'       → setBaBefore(result)          → goTo('beforeafter')
  → baModeRef === 'after'        → setBaAfter(result)           → goTo('beforeafter')
  → else                         → goTo('result')
```

**Fluxo de comparação (ComparisonScreen):**

```
handleStartComparison() → setStep('near') → goTo('comparison')
  [Passo 1] → handleComparisonStartNear()
    → comparisonModeRef = 'near'; goTo('running'); test.start(effectiveConnection, 'complete')
    → [done] → setComparisonNear(result); setStep('far'); goTo('comparison')
  [Passo 2] → handleComparisonStartFar()
    → comparisonModeRef = 'far'; goTo('running'); test.start(effectiveConnection, 'complete')
    → [done] → setComparisonFar(result); setStep('done'); goTo('comparison')
  [Resultado] → calculateComparison(nearResult, farResult)
```

**Fluxo Antes e Depois (BeforeAfterScreen):**

```
handleStartBeforeAfter() → setBaStep('before'); goTo('beforeafter')
  [Passo 1] → handleBAStartBefore()
    → baModeRef = 'before'; goTo('running'); test.start(effectiveConnection, 'complete')
    → [done] → setBaBefore(result); setBaStep('after'); goTo('beforeafter')
  [Passo 2] → handleBAStartAfter()
    → baModeRef = 'after'; goTo('running'); test.start(effectiveConnection, 'complete')
    → [done] → setBaAfter(result); setBaStep('done'); goTo('beforeafter')
  [Resultado] → calculateBeforeAfter(beforeResult, afterResult)
```

**Fluxo Prova Real:**

```
handleStartProvaReal()
  → provaRealResultsRef = []; setProvaRealSession(1); setProvaRealOverride(null)
  → goTo('running'); test.start(effectiveConnection, 'complete')
  → [done × 3, automático] → averageSpeedResults → appendRecord → goTo('result')
  RunningScreen recebe sessionLabel = "Teste X de 3 — Prova Real"
```

**Fluxo Teste por local (RoomTestScreen):**

```
handleOpenRoomTest() → goTo('roomtest')
  [RoomTestScreen] → handleRoomStart(locationTag)
    → locationTagRef = locationTag; goTo('running'); test.start(effectiveConnection, 'complete')
    → [done] → appendRecord(result, { ..., locationTag }); locationTagRef = null; goTo('result')
```

**Carregamento inicial do último resultado:**

Um `useEffect` sem deps (executa só na montagem) chama `previousRecord()` e popula `lastRecord`, garantindo que o card da StartScreen apareça mesmo na primeira abertura do PWA na sessão.

---

## 6.bis Acessibilidade (a11y, 2026-05)

Auditoria conduzida em maio/2026. Pontos cobertos:

1. **Skip-to-main-content** — `<a class="lk-skip-link" href="#main-content">` no topo do `App.tsx`. Invisível visualmente (translate -200%), materializa-se ao receber foco por teclado. Pula TopBar/back/menu e leva direto pro container principal (`<div id="main-content">`).
2. **Focus visível** — regra global em `tokens.css` (`:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`). Ativada apenas quando o foco vem do teclado (não polui clique). Cobre todos os elementos focáveis sem precisar de override por componente.
3. **`<button>` real onde havia `<div role="button">`** — DNS cell na ResultScreen (cell SECONDARY 4ª coluna) e itens do Histórico. Substituem o par `role="button" + tabIndex + onKeyDown` manual por `<button>` nativo com keyboard activation gratuita.
4. **`aria-live="polite"` em status dinâmico** — frase narrativa da `RunningScreen` ("Medindo download…"/"Medindo upload…"), banner de upload parcial da `ResultScreen` (`ulFailed=true`), banner "Nova versão disponível" do `PwaUpdatePrompt`.
5. **`aria-busy`** — `Skeleton` aceita prop `ariaBusy`; `WifiSignalSection` no estado `loading` aplica `aria-busy="true"` no container.
6. **`aria-modal="true"`** — `DraggableSheet` (base universal de sheets) já renderiza `role="dialog" aria-modal="true"` com `aria-labelledby` apontando para o título da sheet. Body scroll lock + ESC fecha vivem no DraggableSheet, herdados pelos consumidores (AdvancedSheet, GamerSheet, DNSGuideSheet, WifiDetailsSheet, WifiOptimizeSheet).
7. **Inputs sem label visível** — campos de plano contratado em `HamburgerMenu` ganharam `aria-label` ("Velocidade contratada de download em Mbps", idem upload) e `inputMode="numeric"` para teclado correto em mobile.
8. **`aria-label` em botões só com ícone** — `BackButton`, `IconButton`, `IconPdf`/`IconShare` no TopBar. Já existiam; auditoria confirmou.
9. **SVGs decorativos com `aria-hidden`** — primitivos `SVG` e `Icon` em `icons.tsx` agora setam `aria-hidden="true" focusable="false"` por default. Os labels textuais ao lado já comunicam significado; sem isso, o screen reader leria "imagem · texto" em duplicidade.
10. **`IOSList` rows clicáveis** — `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space) padronizado dentro do componente, eliminando a necessidade de cada caller adicionar handlers manuais.

`prefers-reduced-motion: reduce` é respeitado pelo `screen-enter`, `Skeleton`, `LiveChart`, `useCountUp` e `InfoTooltip`.

---

## 7. CSS e tokens (`src/tokens.css`)

### Temas

```css
[data-theme="dark"]  { --bg: #09090F; --bg-elev: #0A0A0C; --surface: #131318; --surface-2: #1C1C24; --surface-3: #25252F; --border: rgba(255,255,255,0.08); --hairline: rgba(255,255,255,0.06); --text: #F5F5FA; ... }
[data-theme="light"] { --bg: #F2F2F7; --bg-elev: #FFFFFF; --surface: #FFFFFF; --surface-2: #F2F2F7; --surface-3: #ECECF1; --border: rgba(0,0,0,0.08); --hairline: rgba(0,0,0,0.06); --text: #0D0D1A; ... }
```

`--bg: #F2F2F7` no light segue o System Gray 6 do iOS (linguagem iOS-Calma do design system).

### Tokens globais (ambos os temas)

| Token | Valor | Uso |
|---|---|---|
| `--accent` | `#6C2BFF` | Cor primária da marca |
| `--accent-tint` | `rgba(108,43,255,0.14)` | Fundo tintado de elementos accent |
| `--dl` | `#3AB6FF` | Download (azul) |
| `--dl-tint` | `rgba(58,182,255,0.14)` | Fundo tintado DL |
| `--dl-glow` | `rgba(96,165,250,0.40)` dark / `rgba(37,99,235,0.30)` light | **Glow tokens (pacote premium 2026-05)** — exclusivo do hero number Download da `ResultScreen`. Aplicado via `text-shadow: 0 0 16px var(--dl-glow) !important` no `.lk-result__primary-cell-value` da primeira coluna. Override do reset universal (ver §7 Regras globais). Alpha menor em light pra mesma percepção. |
| `--ul` | `#22C55E` | Upload (verde) |
| `--ul-tint` | `rgba(34,197,94,0.14)` | Fundo tintado UL / Chip good |
| `--ul-glow` | `rgba(52,211,153,0.40)` dark / `rgba(22,163,74,0.30)` light | Pareado com `--dl-glow`, mesma mecânica para Upload (segunda coluna do bloco PRIMARY). |
| `--success-glow` | `rgba(52,211,153,0.30)` dark / `rgba(22,163,74,0.22)` light | **Glow do card de Diagnóstico — estado healthy.** Aplicado via `box-shadow` no `.lk-result__combined` quando `aggregateDiagnosisSeverity` retorna `healthy`. Selecionado no TSX como `var(--success-glow)` e injetado como `--diag-glow-color`. |
| `--warn-glow` | `rgba(251,191,36,0.30)` dark / `rgba(217,119,6,0.22)` light | **Glow do card de Diagnóstico — estado warn.** Mesma mecânica do `--success-glow` para a severidade `warn` (algum item warn, nenhum fail). |
| `--error-glow` | `rgba(248,113,113,0.30)` dark / `rgba(220,38,38,0.22)` light | **Glow do card de Diagnóstico — estado fail.** Severidade `fail` (algum item fail). Animação `lk-result-diag-glow` faz pulse 24px ↔ 32px de blur em loop infinito de 4s; mesmo tempo nos 3 estados, só a cor muda. |
| `--warn` | `#F5A623` | Atenção / amarelo |
| `--error` | `#FF453A` | Erros e falhas |
| `--info` | `#3AB6FF` | Informação |
| `--font-display` | `'Geist', system-ui, -apple-system, sans-serif` | Números hero e títulos |
| `--font-body` | `'Geist', system-ui, -apple-system, sans-serif` | Texto corrido |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` | Valores numéricos monospace |
| `--bg-radial` | `radial-gradient(120vmax 120vmax at 50% 30%, ...)` | Fundo do `body` com radial sutil para dar profundidade — Bloco 3 (Polimento, 2026-05). Centro 1-2 stops mais claro que a borda em ambos os temas. Containers raiz das telas (`.lk-start`, `.lk-running`, `.lk-result`, etc.) usam `background: transparent` para que o radial apareça por trás. **Recalibração 2026-05 (terceira passada — depth fade removido):** edges achatadas para reduzir contraste com `--surface-deep` dos cards. Dark: edge `#06060A` → `#0E0F18` (de ~10 para ~3 pontos por canal abaixo do centro `#11121A`); stop intermediário (60%) eliminado — radial é agora 0% → 100% direto. Light: edge `#F2F1EC` → `#FAFAF7` (= `--bg`); ~3 pontos por canal abaixo do centro `#FDFDFB`. Profundidade ainda existe, mas o "step" visível onde o card termina e o body aparece (zona escura do radial vs `--surface-deep` claro) deixa de ser perceptível como faixa. |
| `--surface-deep` | `#11121A` (dark) / `#FBFBFD` (light) | **Tom canônico de card.** Em dark, replica o centro do `--bg-radial` para que o card pareça "vazar" no body — alinha visualmente com o bloco Resposta/Oscilação/Falhas (`.lk-result__secondary-block`, transparent). Aplicado em todos os cards principais: `.lk-result__primary-block`, `.lk-result__use-row`, `.lk-result__combined`, `.lk-history__diagnosis`, `.lk-history__list`, `.lk-history__insight`, `.lk-hist-detail__hero`, `.lk-cmp__preview`, `.lk-cmp__verdict`, `.lk-cmp__table`, `.lk-wifi-card`, `.lk-ba__preview`, `.lk-ba__verdict`, `.lk-ba__table`, `.lk-diag__card`, `.lk-rec-screen__card`, `.lk-section-card`, `.lk-history-card`, `.lk-dns__current`, `.lk-start__last-card`, `.lk-local-wifi__card`, `.lk-ios-list` (container do IOSList — fechamento da unificação 2026-05) e `.card` (utility global em `tokens.css`). `--surface` ficou reservado a sheets sobrepostas (HamburgerMenu, BottomSheet) que precisam contrastar com o body. |
| `--radius` | `16px` | Border-radius de cards |
| `--radius-sm` | `8px` | Border-radius pequeno |
| `--radius-lg` | `20px` | Border-radius grande |
| `--radius-xl` | `28px` | Border-radius extra-largo |
| `--radius-button` | `12px` | Border-radius de botões |
| `--radius-pill` | `100px` | Border-radius de pílulas/chips |
| `--t-fast` | `180ms cubic-bezier(0.32,0.72,0,1)` | Transições rápidas |
| `--t-med` | `280ms cubic-bezier(0.32,0.72,0,1)` | Transições padrão |
| `--t-slow` | `480ms cubic-bezier(0.32,0.72,0,1)` | Transições lentas |
| `--space-xs` | `4px` | Espaçamento base |
| `--space-sm` | `8px` | |
| `--space-md` | `12px` | |
| `--space-lg` | `16px` | |
| `--space-xl` | `24px` | |
| `--space-2xl` | `32px` | |
| `--space-3xl` | `48px` | |

### Bloco 4 — Propagação tipográfica e hero card pattern (2026-05)

Sequência de polimentos em CSS-only que estende o trabalho do Bloco 2 (Hero confiante) para fora da ResultScreen, sem novos tokens, sem novas libs e sem alterar JSX.

**Propagação tipográfica `--font-mono` → `--font-display`:** valores numéricos em destaque migrados de JetBrains Mono para Geist em telas onde a densidade do mono não compensa a inconsistência com a marca. Arquivos tocados:

- `StartScreen.css` — `.lk-start__last-values` (peso 700, 13px) e label do `.lk-start__orb` (peso 700, 22px, era 600/20).
- `HistoryScreen.css` — `.lk-history__summary-metrics` (display 700, 22px com `tabular-nums`).
- `ComparisonScreen.css` — `.lk-cmp__val` (display 600) e `.lk-cmp__drop` (display 700), ambos preservando `tabular-nums` para alinhamento tabular.
- `GamerScreen.css` — `.lk-gamer__stat-value` (display 700, 22px, era mono 600).
- `DetailsScreen.css` — `.lk-details__metric-sub` ganhou `font-family: var(--font-display)` peso 600 (antes herdava body sem family explícita).

A lista do histórico (`.lk-history__row2`, `.lk-history__date`) **não foi migrada** — mantém mono para preservar densidade em rolagem longa de registros. DiagnosticScreen não foi tocada (badges já 600, hero-title já display 700/24px desde Bloco 2).

**Hero card pattern (canônico em `.lk-result__hero`):** flex column, gap 8, padding `18px 18px 16px`, margin-bottom 14, `background: var(--surface-deep)` (era `--surface` antes da unificação visual de 2026-05), `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)`. Título Geist 700 26px line 1.15 letter `-0.01em`; subtítulo Geist 14px line 1.4 color `--text-2`. Adotado em:

- `HistoryScreen.css` `.lk-hist-detail__hero` — anteriormente apenas padding solto; agora card visível com chip + título + subtítulo (título bumpou de 20→26px, sub de 12→14px).
- `ComparisonScreen.css` `.lk-cmp__verdict` — variante "verdict" do hero card. Mantém o `border-left: 4px solid` característico (declarado depois de `border: 1px solid`, sobrepondo apenas a esquerda) e os modificadores de cor por diagnóstico (`--coverage_issue`, `--both_bad`, `--both_good`). Tipografia da mensagem promovida a Geist 700 24px line 1.2 letter `-0.01em` — a mensagem do verdict virou o headline do card.

**Glow do orb (StartScreen):** `.lk-start__orb` usa `filter: drop-shadow(0 0 14px var(--accent-glow))` para o glow circular. **Bloco 6 — UX uniforme (2026-05):** o `box-shadow: 0 20px 40px -15px var(--accent-glow)` foi removido para cumprir a regra global "zero box-shadow"; o blur do drop-shadow subiu de 10px → 14px para compensar. `transition` reduzida (sem `box-shadow`).

### Regras globais

- Zero `box-shadow` — proibido pelo branding linka
- Zero `text-shadow` — reforçado por reset universal `*, *::before, *::after { text-shadow: none !important }` em `tokens.css`. **Exceção única (pacote premium 2026-05):** o hero number do bloco PRIMARY da `ResultScreen` (`.lk-result__primary-cell-value`) recebe glow controlado via `text-shadow: 0 0 16px var(--dl-glow|--ul-glow) !important`. Confinado às duas células. Qualquer novo `text-shadow` deve ser justificado e documentado aqui.
- `body { background-color: var(--bg); background-image: var(--bg-radial); background-attachment: fixed; ... }` — radial sutil aplicado no `body`; containers raiz das telas usam `background: transparent`. **O `background-color: var(--bg)` é o backstop sólido do body** (caso o radial não pinte alguma região).
- **Depth fade do rodapé (Bloco 7 — Polimento, 2026-05) — REMOVIDO em 2026-05 (terceira passada).** Original: `#root` ganhava `position: relative; isolation: isolate;` + `#root::after` com `linear-gradient(to top, var(--bg-fade-bottom), transparent)` nos últimos 140-200px do viewport. **Por que foi removido:** mesmo com alpha reduzido para 0.18 (segunda passada), o usuário continuava lendo o efeito como "barra escura" no rodapé, não como fade contínuo. Investigação revelou que a faixa visível **não vinha do `#root::after`** — vinha do contraste do próprio `--bg-radial`: o edge `#06060A` (~10 pts por canal abaixo do `--surface-deep` `#11121A`) criava um step perceptível na zona onde o card termina e o body aparece. Reduzir o alpha do fade não resolveu porque o fade não era a causa. Solução final: remover `#root::after` + token `--bg-fade-bottom` (dark e light) + `position: relative` e `isolation: isolate` do `#root` (existiam **só** para conter o pseudo-element — verificação via grep confirmou que nenhum descendente depende deles), e achatar o radial (ver `--bg-radial`). Os z-index dos descendentes de #root (TopBar 50, BottomSheet 99/100, HamburgerMenu 100, DNSGuide 199/200, PwaUpdatePrompt 9999) ficam no stacking context da raiz da página — sem regressão porque não há nenhum elemento fora de #root competindo com eles. **Aprendizagem registrada para evitar recorrência:** (1) alpha agressivo em curva curta vira banding, não fade; (2) faixas visíveis no rodapé costumam ser contraste de fundo (radial edge vs surface-deep dos cards), não overlay — investigar a causa raiz antes de ajustar o overlay; (3) tons de borda em radials full-viewport devem ficar a poucos pontos do tom dos cards opacos para não criar "step" visível na transição. **Próximo passo se mesmo assim o usuário reportar barra:** eliminar o radial inteiramente (`--bg-radial: var(--bg)`) — cor sólida no body, sem efeito de profundidade, mas zero contraste indesejado.
- **PWA iOS standalone — fix da faixa branca no home indicator (2026-05):** `html`, `body` e `#root` recebem `background-color: var(--bg)` (cor sólida) além do radial no body. O `html` **não** recebe o gradiente — só cor sólida. Motivo: com `viewport-fit=cover` no `index.html`, o canvas se estende por baixo da home indicator do iPhone; se o `html` ficar com `background-color: transparent` (default ou efeito do shorthand `background:` sem cor), o iOS pinta essa área de branco em PWA standalone. Manter cor sólida no `html` garante que a faixa do home indicator combine com o tema. `#root` também recebe a cor como backstop para regiões de rubber band. Telas (`.lk-result`, `.lk-history`, `.lk-start`, etc.) continuam com `background: transparent` para o radial do body aparecer entre cards. Acompanhante obrigatório: `index.html` precisa ter `<meta name="viewport" content="..., viewport-fit=cover">` + `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` + `<meta name="theme-color" content="#0A0A0F" media="(prefers-color-scheme: dark)">` / `#FAFAF7` light.

---

## 8. PWA (`vite.config.ts`)

Plugin VitePWA configurado com:

```ts
manifest: {
  name: 'linka SpeedTest',       // "linka" minúsculo — obrigatório por branding
  short_name: 'linka Speed',
  theme_color: '#0A0A0F',          // alinhado com --bg dark e meta theme-color do index.html
  background_color: '#0A0A0F',     // splash screen sem flash roxo (era #6C2BFF antes do fix de 2026-05)
  display: 'standalone',
  icons: [
    { src: '/icon-192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png',          sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: '/icon.svg',              sizes: 'any',     type: 'image/svg+xml', purpose: 'any' },
  ]
}
```

#### 8.0 Audit de ícones e manifest (2026-05)

**Inventário de assets** (`public/` e `android/app/src/main/res/mipmap-*`):

| Categoria | Tamanho | Arquivo | Status |
|---|---|---|---|
| PWA web (any) | 192×192 | `public/icon-192.png` | ✅ presente, declarado |
| PWA web (any) | 512×512 | `public/icon-512.png` | ✅ presente, declarado |
| PWA web (maskable) | 192×192 | `public/icon-maskable-192.png` | ✅ presente, declarado |
| PWA web (maskable) | 512×512 | `public/icon-maskable-512.png` | ✅ presente, declarado |
| PWA web (vetor) | any | `public/icon.svg` | ✅ presente, declarado (2026-05) |
| Favicon | 16/32 | `public/favicon.ico` | ✅ presente, declarado em `index.html` (2026-05) |
| Apple touch icon | 180×180 | `public/apple-touch-icon.png` | ✅ presente, declarado (2026-05 — antes apontava para `icon-maskable-192.png`, tamanho errado) |
| Apple touch icon | 152×152 | `public/touch-icon/ios/AppIcon@2x~ipad.png` | ✅ presente, declarado (2026-05) |
| Apple touch icon | 167×167 | `public/touch-icon/ios/AppIcon-83.5@2x~ipad.png` | ✅ presente, declarado (2026-05) |
| Apple touch icon | 120×120 | `public/touch-icon/ios/AppIcon@2x.png` | ✅ presente, declarado (2026-05) |
| iOS legacy | 76, 60, 40, 29, 20 | `public/touch-icon/ios/*.png` | ✅ presentes, **não declarados em index.html** (cobertos por size mais próximo) |
| Splash iOS standalone | múltiplos | — | ❌ **GAP** — `apple-touch-startup-image` não declarado; iOS standalone mostra splash branco |
| Android Adaptive (mdpi→xxxhdpi) | 48→192 | `android/.../res/mipmap-*/ic_launcher.png` | ✅ presentes |
| Android foreground | 108→432 | `android/.../res/mipmap-*/ic_launcher_foreground.png` | ✅ presentes |
| Android background | cor sólida | `android/.../res/values/ic_launcher_background.xml` | ✅ presente (drawable em XML) |
| Android adaptive (anydpi-v26) | — | `android/.../res/mipmap-anydpi-v26/ic_launcher.xml` | ✅ presente |
| Android Play Store | 512×512 | `public/android/play_store_512.png` | ✅ presente (uso para upload de Play Store) |

**Bugs corrigidos no audit (2026-05).**

1. `<link rel="apple-touch-icon" sizes="192x192" href="/icon-maskable-192.png">` — tamanho declarado errado (192) e arquivo errado (maskable, que iOS renderiza com cantos quadrados, não circulares). Corrigido para `sizes="180x180" href="/apple-touch-icon.png"`.
2. `index.html` não declarava `<link rel="icon" href="/favicon.ico" sizes="any">` mesmo com o arquivo presente — alguns user agents (Edge legacy, Safari macOS) usam o ICO como fallback de bookmark.
3. `<meta name="apple-mobile-web-app-title">` ausente — quando o usuário adiciona à home screen no iOS, o nome curto sai como "linka SpeedTest" inteiro. Adicionado com valor `"linka Speed"`.

**Pendências conhecidas.**

- **Splash screens iOS standalone** — sem `apple-touch-startup-image`, o PWA iOS adicionado à home screen mostra splash branco antes do `--bg`. Solução simples: gerar 1 splash 2048×2732 com logo centralizado e declarar como genérico. Solução completa: gerar 8+ splashes específicos por device (1290×2796 iPhone 15 Pro Max, 1284×2778 iPhone 14 Plus, 1170×2532 iPhone 13/14, 750×1334 iPhone SE, etc.) com `media` queries.
- **Android monochrome icon** (Android 13+ themed icons) — existe `public/android/res/mipmap-*/ic_launcher_monochrome.png` mas não está copiado para `android/app/src/main/res/mipmap-*`. Pendência: copiar os 5 PNGs e declarar `<monochrome>` no `mipmap-anydpi-v26/ic_launcher.xml`.

#### Comando ImageMagick para regenerar ícones a partir do SVG mestre

`public/icon.svg` é o mestre (logo branco arco + ponto sobre fundo `#5B3FE8`, 100×100 viewBox). Quando precisar regenerar PNGs em qualquer tamanho ou trocar o branding, rodar a partir da raiz do repo:

```bash
# Requer ImageMagick 7+ (`magick` em vez de `convert` desde IM 7) e librsvg
# (mais fiel a SVG complexo que o renderer interno do IM).

# PWA web base (any)
magick -background none -resize 192x192 public/icon.svg public/icon-192.png
magick -background none -resize 512x512 public/icon.svg public/icon-512.png

# Maskable (Android adaptive). Padding interno de 20% (área "safe zone"
# que mascara não corta). Renderiza o SVG num canvas 80% do tamanho final
# centralizado, com fundo da cor da marca.
magick -background "#5B3FE8" -resize 154x154 public/icon.svg \
       -gravity center -extent 192x192 public/icon-maskable-192.png
magick -background "#5B3FE8" -resize 410x410 public/icon.svg \
       -gravity center -extent 512x512 public/icon-maskable-512.png

# Apple touch icon (iPhone moderno)
magick -background "#5B3FE8" -resize 180x180 public/icon.svg public/apple-touch-icon.png

# Favicon multi-resolução
magick -background none public/icon.svg \
       -define icon:auto-resize=16,32,48,64 public/favicon.ico

# Android Play Store
magick -background "#5B3FE8" -resize 512x512 public/icon.svg public/android/play_store_512.png
```

Para os Android Adaptive Icons (`mipmap-*/ic_launcher_foreground.png`), o foreground precisa ser 432×432 com a área visível centralizada num círculo de raio ~132 (264×264). Comando:

```bash
# Foreground com safe-zone 264×264 centralizada em canvas 432×432 transparente
for density in mdpi:108 hdpi:162 xhdpi:216 xxhdpi:324 xxxhdpi:432; do
  IFS=: read -r d size <<< "$density"
  inner=$((size * 264 / 432))
  magick -background none -resize ${inner}x${inner} public/icon.svg \
         -gravity center -extent ${size}x${size} \
         android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png
done
```

Importante: rodar `npx cap sync android` após substituir ícones em `public/` ou `android/.../res/` se o build for via Capacitor — para sincronizar `dist/` e `capacitor.config.ts`.

Service worker gerado automaticamente. Sem runtime caching configurado (app não tem assets dinâmicos para cachear além do shell).

Testes com Vitest: `test: { environment: 'node' }` na mesma config.

#### Service Worker e atualização ágil (2026-05)

Problema motivador: no Safari/iOS, o ciclo de vida padrão do SW é conservador — um SW novo só assume controle quando todas as abas/instâncias da PWA são fechadas. Em prática, atualizações ficavam "presas" por dias.

Combinação aplicada no projeto:

1. **`registerType: 'autoUpdate'`** (no plugin VitePWA): registra o SW automaticamente e dispara o ciclo de update quando o `sw.js` muda.
2. **`workbox.skipWaiting: true`** + **`workbox.clientsClaim: true`**: o SW novo entra em `activate` imediatamente após `install` e assume controle de todas as páginas abertas — sem precisar fechar a aba.
3. **`workbox.cleanupOutdatedCaches: true`**: remove caches Workbox antigos no activate, evitando que conteúdo stale sobreviva.
4. **Verificação periódica a cada 60s** via `registration.update()`: força o navegador a re-baixar `/sw.js` e comparar; se mudou, dispara `onNeedRefresh`. Configurada em `src/components/PwaUpdatePrompt.tsx`.
5. **Banner UX** (`PwaUpdatePrompt`): quando `needRefresh === true`, mostra um pill fixo no rodapé com "Nova versão disponível" + botão **Atualizar** (chama `updateServiceWorker(true)` que ativa o SW novo e recarrega) + botão fechar (snooze até a próxima visita). Renderizado no nível raiz de `App.tsx`.

Tipos para o módulo virtual `virtual:pwa-register/react` ficam em `src/types/pwa.d.ts` (o `tsconfig.app.json` declara apenas `vite/client` em `types`, então o ambient module do `vite-plugin-pwa/client` não é carregado automaticamente).

**Recomendação para o servidor de PWA hospedada (Cloudflare Pages / Nginx):**

Cabeçalhos de cache obrigatórios para que o ciclo acima funcione de fato — caso contrário, a CDN entrega `sw.js` antigo do edge cache e o cliente nunca vê a nova versão.

```
/sw.js              → Cache-Control: no-cache, no-store, must-revalidate
/workbox-*.js       → Cache-Control: no-cache, no-store, must-revalidate
/manifest.webmanifest → Cache-Control: no-cache
Demais assets       → cache normal (hash no nome do arquivo já é cache-buster)
```

Em Cloudflare Pages, configurar via arquivo `_headers`:

```
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
/workbox-*.js
  Cache-Control: no-cache, no-store, must-revalidate
```

> Pendência: o arquivo `_headers` ainda não foi criado. Quem fizer o próximo deploy hospedado deve adicioná-lo na raiz de `public/` antes de publicar. Sem isso, a CDN cacheia `sw.js` por TTL padrão e a estratégia perde efeito.

**APK Capacitor:** o ciclo de update do Service Worker é independente do ciclo de update do APK. O APK serve `dist/` empacotado via `capacitor://localhost`; quando uma nova versão do APK é instalada (Play Store / sideload), todos os assets são substituídos, o SW detecta `sw.js` novo no próximo open e o `skipWaiting`/`clientsClaim` aplica a atualização. Nenhum ajuste específico no Capacitor é necessário.

#### Globais injetadas via `define` (2026-05)

| Global | Tipo | Origem | Consumidor |
|---|---|---|---|
| `__APP_VERSION__` | `string` | `package.json` lido via `readFileSync` no `vite.config.ts` | Accordion "Avançado" da `ResultScreen` (item "Versão do app") |

Declarações TypeScript em `src/global.d.ts`. Em ambientes onde a global não é injetada (alguns runners de teste, fixtures), o ResultScreen guarda com `typeof __APP_VERSION__ !== 'undefined'` e o item simplesmente some.

### 8.1 Android nativo via Capacitor

O APK Android é gerado a partir do mesmo `dist/` do PWA usando Capacitor.

**Configuração:** `capacitor.config.ts`

```ts
appId: 'br.com.linka.speedtest'
appName: 'linka SpeedTest'
webDir: 'dist'
```

**Projeto nativo:** `android/`

- `android/app/src/main/AndroidManifest.xml` declara apenas `android.permission.INTERNET`.
- `android/app/src/main/java/br/com/linka/speedtest/MainActivity.java` é a Activity Capacitor.
- `android/app/src/main/res/values/strings.xml` mantém branding `linka SpeedTest`.

**Toolchain local:** `_android-toolchain/` (ignorado pelo Git)

- Android Command-line Tools: `cmdline-tools/latest`.
- SDK instalado: `platform-tools`, `platforms;android-36`, `build-tools;36.1.0`.
- JDK local: Microsoft OpenJDK 21 LTS.
- Gradle cache: `_android-toolchain/gradle-home`.

**Build de APK debug:**

```powershell
npm run android:apk
```

Saída obrigatória: `builds/apk/linka-speedtest-v{versionName}-code{versionCode}-{buildType}-{yyyyMMdd-HHmmss}-{gitSha}.apk`.

**Regra obrigatória de versionamento e entrega:**

- Nenhuma IA deve entregar APK diretamente de `android/app/build/outputs/...`.
- Nenhuma IA deve sobrescrever APK anterior.
- O script `scripts/build-android-apk.ps1` copia o APK para `builds/apk/` e falha se o arquivo de destino já existir.
- `versionName` vem de `package.json` e deve seguir SemVer (`MAJOR.MINOR.PATCH`).
- `versionCode` segue padrão compatível com distribuição Android: `MAJOR*1000000 + MINOR*10000 + PATCH*100 + BuildNumber`.
- Build debug usa `BuildNumber=0` por padrão.
- Build release/mercado exige `-BuildType release -BuildNumber N`, com `N > 0`, para manter versionCode monotônico.
- Para Play Store, o formato de mercado é AAB. APK neste projeto é artefato para instalação manual, homologação ou distribuição interna.

Exemplos:

```powershell
npm run android:apk
.\scripts\build-android-apk.ps1 -BuildType release -BuildNumber 1
```

---

## 9. Deploy — Cloudflare Pages

**Projeto:** `linka-speedtest`  
**Branch de produção:** `main`

**Comando de build:**
```bash
npm run build    # → dist/
```

**Comando de deploy:**
```bash
npx wrangler pages deploy dist --project-name linka-speedtest --branch main
```

**Endpoints Cloudflare usados:**

| Endpoint | Uso |
|---|---|
| `speed.cloudflare.com/__down?bytes=N` | Download (GET, retorna N bytes aleatórios) |
| `speed.cloudflare.com/__up` | Upload (POST com Blob) |
| `speed.cloudflare.com/cdn-cgi/trace` | IP, colo, localização |
| `speed.cloudflare.com/meta` | ISP (campo `asOrganization`) |

---

## 10. Testes (`src/__tests__/`)

**Framework:** Vitest com `environment: 'node'`

| Arquivo | Testes | Cobertura |
|---|---|---|
| `classifier.test.ts` | 12 | `RULE_SET_VERSION`, `classify()` — 5 quality + 7 tags |
| `connectionProfile.test.ts` | 4 | `toConnectionProfile()` — mapeamento ConnectionType → ConnectionProfile |
| `interpret.test.ts` | 95 | `interpretSpeedTestResult()` — motor unificado |
| `combinedDiagnosis.test.ts` | 14 | `combineDiagnostics()` — causas combinadas e confiança |
| `LocalWifiService.test.ts` | 19 | helpers de frequência/canal/qualidade + fallback PWA |
| `share.test.ts` | 4 | `buildShareText()`, `shareResultText()` |
| `compare.test.ts` | 12 | `calculateComparison()` — coverage_issue, both_bad, both_good, percentuais, edge cases |

**Total:** 175 testes passando.

**Comando:** `npm test`

**Regra:** os testes **nunca podem ser quebrados** sem justificativa documentada e plano de substituição. Mudanças em `classifier.ts` ou `src/core/` exigem atualização dos testes correspondentes.

---

## 11. Diagnóstico Wi-Fi nativo (`src/features/local-wifi/`)

Feature isolada para estimar qualidade do link Wi-Fi local no app nativo. No PWA, o item de navegação fica oculto; se a rota for acessada diretamente, o fallback seguro informa indisponibilidade sem tentar bridge nativa.

### Capability (`src/platform/capabilities.ts`)

```ts
interface AppCapabilities { localWifiDiagnostics: boolean }
getCapabilities(): AppCapabilities
isNativeApp(): boolean
```

Detecção atual: `window.Capacitor`, `window.ReactNativeWebView` ou userAgent contendo `LinkaNative`.

### Serviço (`LocalWifiService.ts`)

Exports públicos:
- `bandFromFrequency`
- `channelFromFrequency`
- `classifyWifiQuality`
- `classifyWifiChannel`
- `buildWifiCopy`
- `wifiQualityLabel` (2026-05) — único conversor `WifiQuality` → label pt-BR ("Excelente / Bom / Razoável / Fraco / Crítico / Indisponível"). Substitui maps inline antes existentes em `LocalWifiScreen` e `WifiSignalCard` — proíbe strings em inglês na UI.
- `toCombinedWifiInput`
- `runLocalWifiDiagnostics`

Comportamento:
- PWA/web (`localWifiDiagnostics === false`) → indisponível
- nativo (`true`) → tenta bridge via `Capacitor.Plugins.LinkaWifiDiagnostics.getWifiInfo()` (padrão Capacitor 8) ou fallback `window.LinkaWifiDiagnostics.getWifiInfo()` (compat builds antigas)
- falha/ausência de bridge → indisponível (fallback seguro)
- permissão de localização negada (Android) → `WifiDiagnosticResult.permissionStatus === 'denied'` propagado via `getUnavailableWifiDiagnosticResult({ permissionStatus, platform })`
- avaliação de canal (MVP heurístico) por banda:
  - `2.4GHz`: bom `1/6/11`; médio adjacentes; ruim demais canais; sugestão do mais próximo em `1/6/11` quando ruim
  - `5GHz`: bom não-DFS comuns `36/40/44/48/149/153/157/161`; médio outros válidos; ruim inválido/desconhecido com sugestão não-DFS mais próxima
  - `6GHz`: médio por padrão; bom quando canal válido conhecido; sem sugestão agressiva

### Bridge (`LocalWifiBridge.ts`)

Normaliza payload do bridge para `LocalWifiRawInfo` e valida tipos de número/texto.

`resolveBridge()` (2026-05) escolhe o caminho:
1. `Capacitor.Plugins.LinkaWifiDiagnostics?.getWifiInfo` — padrão Capacitor 8 quando o plugin é registrado em `MainActivity.onCreate` via `registerPlugin(LinkaWifiDiagnosticsPlugin.class)`.
2. `window.LinkaWifiDiagnostics?.getWifiInfo` — fallback de compat para builds antigas que injetavam a bridge via `addJavascriptInterface`.

### Plugin nativo Android (`LinkaWifiDiagnosticsPlugin.java`) — 2026-05

Localizado em `android/app/src/main/java/br/com/linka/speedtest/wifi/LinkaWifiDiagnosticsPlugin.java`. Anotado com `@CapacitorPlugin(name = "LinkaWifiDiagnostics", permissions = { @Permission(strings = ACCESS_FINE_LOCATION, alias = "location") })`.

Fluxo de `getWifiInfo`:
1. Verifica `getPermissionState("location")`. Se não for `GRANTED`, dispara `requestPermissionForAlias("location", call, "permissionCallback")`.
2. Se permissão concedida, lê `WifiInfo` preferindo `ConnectivityManager#getNetworkCapabilities().getTransportInfo()` (API 29+) com fallback para `WifiManager#getConnectionInfo()` (deprecated em 31 mas ainda funcional).
3. Calcula canal a partir da `frequencyMhz` (espelho exato de `channelFromFrequency` em TS).
4. Lê gateway IPv4 e IP local via `LinkProperties` da `Network` ativa.
5. Sanitiza SSID (remove aspas, descarta `<unknown ssid>` e BSSID padrão `02:00:00:00:00:00`).
6. Resolve com `JSObject` com o shape do `LocalWifiRawInfo`.

`@PermissionCallback permissionCallback` reentra no fluxo após a resposta do diálogo. Se o usuário negou, resolve com `{ available: false, permissionStatus: "denied", platform: "android" }`.

Permissões adicionadas em `AndroidManifest.xml`: `ACCESS_WIFI_STATE`, `ACCESS_NETWORK_STATE`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`. `INTERNET` já existia.

Registro: feito em `MainActivity.onCreate` via `registerPlugin(LinkaWifiDiagnosticsPlugin.class)` ANTES de `super.onCreate()`. Plugin interno (não vem de pacote npm) — `capacitor.plugins.json` permanece `[]` porque ele é regenerado por `npx cap sync` apenas com plugins NPM; `registerPlugin` programático cobre o nosso caso.

### Adaptador para diagnóstico combinado

`toCombinedWifiInput(result)` retorna shape mínimo compatível com `WifiDiagnosticResult` global (`src/types/index.ts`) sem alterar o contrato existente.

Regras de normalização:
- `band: 'unknown'` => `undefined`
- `quality: 'unknown'` => `undefined`

### Hook (`useLocalWifi.ts`)

Estado padrão:

```ts
{ loading: boolean; result: WifiDiagnosticResult | null; error: string | null }
```

API: `run()` executa diagnóstico e devolve resultado/null.

Usado pela `LocalWifiScreen` (modo on-demand). Para auto-fetch embutido em outras superfícies, ver `useWifiDiagnostics` abaixo.

### Hook auto-fetch (`useWifiDiagnostics.ts`) — 2026-05

Variante de `useLocalWifi` pensada para ser embutida em superfícies onde o diagnóstico deve aparecer sem clique do usuário (ex.: card Wi-Fi na `ResultScreen`).

Estado público:

```ts
type WifiDiagnosticsStatus = 'loading' | 'unavailable' | 'permission-denied' | 'available';
interface WifiDiagnosticsState {
  status: WifiDiagnosticsStatus;
  data?: WifiDiagnosticResult;
}
```

Comportamento: dispara `runLocalWifiDiagnostics()` em `useEffect(..., [])`. Distinção de "indisponível" (2026-05):
- `result.available === true` → `status: 'available'`.
- `result.available === false && result.permissionStatus === 'denied'` → `status: 'permission-denied'` (Android: usuário negou ACCESS_FINE_LOCATION). UI mostra mensagem com call-to-action específico.
- demais casos (PWA puro, bridge ausente, exceção) → `status: 'unavailable'`.

Cancela atualização de estado se o componente desmontar antes da resposta. Não tem `error` nem `run()` — quem precisa de retry usa `useLocalWifi` direto.

Não duplica lógica: `runLocalWifiDiagnostics` segue como ponto único de classificação (banda, qualidade, canal).

### Seção embutida (`WifiSignalSection.tsx` + `WifiSignalBar.tsx`, `WifiDetailsSheet.tsx`) — refator 2026-05

Componente puro renderizado pela `ResultScreen` quando `connectionType === 'wifi'`. A própria `ResultScreen` controla o gating; o componente só monta se for visível, evitando fetch desnecessário quando o usuário está em cabo ou rede móvel.

**Refator 2026-05 (barra horizontal):** a representação INLINE no card unificado deixou de ser um card de 4 cells (SSID + chip canal color-coded + WiFi std) e virou uma barra horizontal de qualidade do sinal — `<WifiSignalBar>`. O orquestrador `<WifiSignalSection>` substitui o antigo `<WifiSignalCard>` (que está marcado `@deprecated` mas preservado no repo).

**Estados da seção (`WifiSignalSection`):**
- `status === 'loading'` — placeholder discreto ("Lendo informações do Wi-Fi…").
- `status === 'permission-denied'` — mensagem específica em pt-BR: **"Permissão de localização necessária para diagnóstico Wi-Fi. Habilite nas configurações do app."** Cor `var(--warn)`.
- `status === 'unavailable'` ou `data.rssiDbm == null` — mensagem única hardcoded em pt-BR: **"Wi-Fi: detalhes disponíveis somente no app instalado."**.
- `status === 'available'` com `rssiDbm` numérico — `<WifiSignalBar>` clicável (abre `<WifiDetailsSheet>`).

**Componente `<WifiSignalBar>` (substitui o card 4-cells inline):**

Layout em 3 linhas dentro do bloco do card unificado (padding `14px 16px`, `border-top: 1px solid var(--border-subtle)` — paridade com `.lk-result__use-row`):

1. **Header** — `[WI-FI label]` à esquerda (uppercase 11px tracking 0.08em, `var(--text-3)`) + ícone Wi-Fi sutil 14px à direita (`color: var(--text-3); opacity: 0.65`).
2. **Linha info** — `SSID · Canal X` em Geist body 14–15px. SSID em weight 600; separador `·` em `var(--text-3)`; "Canal X" em `var(--text-2)` com `tabular-nums`. Quando `ssid` é null/vazio, fallback "Sua rede"; quando `channel` é null, suprime " · Canal X" inteiro.
3. **Barra + %** — flex row com gap 12px:
   - Container 8px de altura, `background: var(--surface-2)`, `border-radius: 999px`, `overflow: hidden`.
   - Fill com `width: ${pct}%` inline, `transition: width 600ms cubic-bezier(0.2, 0.7, 0.2, 1)`. Cor por threshold: `var(--success)` ≥80%, `var(--warn)` 50–79%, `var(--error)` <50%.
   - `% numérico` à direita, peso 600, `tabular-nums`, cor matching o fill.

**Helpers (`wifiSignal.ts`) — 2026-05:**

- `rssiToPercent(rssiDbm: number | null | undefined): number | null` — fórmula linear `2 * (rssi + 100)` clamped 0–100. Retorna `null` quando o input é null/undefined (consumidor decide o fallback).
- `signalQualityColor(pct: number): 'good' | 'warn' | 'bad'` — threshold visual da barra (≥80 / 50–79 / <50).

A separação para um módulo dedicado (em vez de `LocalWifiService`) é proposital: a conversão dBm→% e o mapeamento de cor da barra são preocupações puramente de UI. O `classifyWifiQuality` (técnico, mistura RSSI + linkSpeed + banda em 5 níveis) continua sendo a fonte de verdade do copy do diagnóstico — não é substituído pelo `signalQualityColor`.

**Animação de mount:** `WifiSignalBar` usa `useState(0)` + `useEffect` com `requestAnimationFrame` para setar `width` ao percentual final no próximo frame — a CSS transition cuida do desliza. O `% numérico` cristaliza no valor final desde o 1º render (não anima count-up) para acessibilidade: leitor de tela / pausa de motion-reduce mostra o valor correto. `prefers-reduced-motion: reduce` desliga a transição.

**Decisão: representação inline vs sheet:** o card unificado mostra apenas qualidade visual (SSID curto + canal + barra colorida + %) — leitura imediata sem fricção. Ao clicar, a `<WifiDetailsSheet>` abre com os 4 dados completos (banda, link speed, padrão WiFi, gráfico de canais vizinhos, recomendações). O usuário que só quer saber "tá bom?" lê a barra; o usuário que precisa otimizar abre a sheet.

**Componente: `WifiDetailsSheet.tsx` (refator "premium" 2026-05)**

Popup bottom-sheet que abre ao clicar no card compacto. Props:
```ts
interface WifiDetailsSheetProps {
  isOpen: boolean;
  diagnostics: WifiDiagnosticResult;
  onClose: () => void;
}
```

**Estrutura visual (refator "premium" 2026-05):** o sheet saiu do dump de
dados em listas `dl/dt` para uma hierarquia clara em 5 blocos:

1. **Hero verdict** — card com `border-top: 3px solid var(--ribbon-color)`,
   ícone Wi-Fi 44×44 com tint matching a severidade, kicker "Estado do
   Wi-Fi", título grande do verdict (`Excelente`/`Bom`/`Razoável`/`Fraco`/
   `Crítico` via `wifiQualityLabel()`) e sub-frase contextual
   ("Sinal forte, canal limpo" / "Sinal médio, canal congestionado").
   Cor da ribbon = `var(--success)` para excellent/good, `var(--warn)`
   para fair/weak, `var(--error)` para critical, `var(--text-3)` para
   unknown.
2. **Métricas 2x2** — cards compactos lado a lado: Sinal (cor por dBm:
   ≥−60 verde, ≥−75 amarelo, <−75 vermelho), Velocidade do link (cor
   apenas em casos ruins: <30 Mbps amarelo, <10 vermelho), Banda, Canal.
   Valores em `var(--font-mono)` com `tabular-nums`.
3. **Visualização de canais** — quando `nearbyNetworks.length > 0`,
   header com "Canais &lt;banda&gt; na área" + count, seguido do
   `<ChannelQualityChart>` (componente preservado). Quando o scan não
   retornou nada (PWA puro ou Android <13 sem permissão), fallback
   simples "Canal X (banda)" + hint "Lista de redes vizinhas
   indisponível neste aparelho".
4. **Recomendação inline** — `aside` com `var(--accent-tint)` + ícone
   `bulb`. Aparece apenas quando há ação útil. Prioridade:
   (a) `channelQuality === 'bad'` + `suggestedChannel != null` →
   "Canal X está mais limpo · Pode reduzir interferência se trocar";
   (b) `quality === 'weak' | 'critical'` → "Sinal fraco · aproxime-se
   ou troque para 2.4 GHz" (texto adapta ao band atual);
   (c) `linkSpeedMbps` muito abaixo da capacidade da banda →
   "Velocidade abaixo do esperado · Verifique padrão Wi-Fi (ax/ac)".
   Quando nenhuma condição bate, recomendação não aparece — Wi-Fi
   saudável não merece UI extra.
5. **Footer fixo (CTA pareado)** — botão primary `var(--accent)`
   "Como otimizar Wi-Fi" abre `<WifiOptimizeSheet>` por cima; secondary
   outline "Fechar".

Animação: slide-up de baixo com backdrop fade (200-300ms via `cubic-bezier(0.34, 1.56, 0.64, 1)`). ESC key ou click no backdrop fecha. Body scroll locked enquanto aberto. Sem box-shadow (regra de branding).

**Novo componente: `WifiOptimizeSheet.tsx`**

Bottom-sheet montado por cima do `WifiDetailsSheet` (z-index 10000/10001).
Tutorial em pt-BR com 3 categorias hardcoded:

- **Trocar o canal Wi-Fi** — instruções para acessar painel do roteador
  e escolher canais 1/6/11 (2.4 GHz) ou 36-48 (5 GHz).
- **Escolher a banda certa** — quando 5 GHz vs 2.4 GHz; recomendação
  para roteadores dual-band manterem ambas com nomes diferentes.
- **Posicionar o roteador** — local central, em altura, longe de
  microondas/bluetooth.

Cada categoria tem 4 passos numerados em chip purple (`var(--accent-tint)`/
`var(--accent)`). Ícone por categoria: `swap` (canal), `wifi` (banda),
`router` (posição). CTA único "Fechar". O conteúdo é fixo (não depende
do diagnóstico atual) — não passa por `copyDictionary`.

**Novo componente: `ChannelQualityChart.tsx`**

Análise visual de canais Wi-Fi. Props:
```ts
interface ChannelQualityChartProps {
  nearbyNetworks?: LocalWifiNetworkInfo[];
  currentChannel?: number;
  suggestedChannel?: number;
  isLoading?: boolean;
}
```

Lógica:
- `analyzeChannels()` agrupa `nearbyNetworks` por canal derivado de `frequencyMhz`
- Calcula RSSI médio por canal e classifica qualidade via `classifyRssi()`
- Renderiza flex bar chart com altura proporcional à contagem de APs
- Cores baseadas em dBm: excellent ≥ -50, good ≥ -60, fair ≥ -70, weak ≥ -80, critical < -80

Estados:
- `isLoading === true` — placeholder "Analisando canais…"
- sem `nearbyNetworks` — "Nenhum canal detectado"
- com dados — gráfico com legenda 2-col e recomendação opcional

**Extensão do plugin Android — `LinkaWifiDiagnosticsPlugin.java`**

Novos campos adicionados a `resolveWithWifiInfo()`:
1. `wifiStandard` — via `readWifiStandard(WifiInfo)` (API 30+). Retorna "802.11ax", "802.11ac", etc., ou null se < API 30.
2. `nearbyNetworks` — via `wifiManager.getScanResults()`. Array de `{ ssid, bssid, frequencyMhz, rssiDbm, capabilities }`. Nullable se scan não retornar resultados ou permissão negada.

Ambos os campos são opcionais (`?:`) na interface `LocalWifiRawInfo`; bridge pode retornar apenas dados legíveis conforme disponibilidade de API/permissão.

**Bridge normalização — `LocalWifiBridge.ts`**

Novo helper `toLocalWifiNetworkArray()` valida e filtra `nearbyNetworks`:
- Requer `ssid`, `bssid`, `frequencyMhz`, `rssiDbm`, `capabilities` válidos (textos/números finitos)
- Omite entries malformadas
- Retorna `undefined` se array vazio ou input inválido

Ambos os campos (`wifiStandard`, `nearbyNetworks`) adicionados ao return de `getLocalWifiRawInfoFromBridge()` e propagados via `runLocalWifiDiagnostics()` até `WifiDiagnosticResult`.

### Tela (`LocalWifiScreen.tsx`)

Conectada em `App.tsx` via rota interna `screen: 'localwifi'`. O item aparece na `ExploreScreen` somente quando `getCapabilities().localWifiDiagnostics === true`.
No PWA comum, a rota mantém fallback de indisponibilidade sem tocar bridge nativa caso seja acessada diretamente.
Quando o diagnóstico retorna canal, a tela exibe:
- `Canal atual: X`
- `Qualidade do canal: bom/médio/ruim` com cor semântica (`--ul`/`--warn`/`--error`)
- `Canal sugerido: Y` somente quando a qualidade do canal é ruim

---

## 11.bis Plugin nativo `PacketLoss` (Android, 2026-05)

Plugin Capacitor interno que mede packet loss real via UDP em vez da heurística HTTP/CORS do PWA web.

### Arquivos

- `android/app/src/main/java/br/com/linka/speedtest/packetloss/PacketLossPlugin.java` — plugin Java registrado em `MainActivity.onCreate` via `registerPlugin(PacketLossPlugin.class)`.
- `src/utils/packetLoss.ts` — bridge web `measurePacketLossNative()`.

### Contrato

Plugin Capacitor expõe `Capacitor.Plugins.PacketLoss.measurePacketLoss(opts)`:

```ts
measurePacketLoss(opts?: {
  host?: string;        // default '1.1.1.1'
  port?: number;        // default 53 (DNS)
  packetCount?: number; // default 50
  timeoutMs?: number;   // default 1000
  spacingMs?: number;   // default 20
}): Promise<{
  sent: number;
  received: number;
  lossPercent: number;  // arredondado 0..100
  avgRttMs: number;     // -1 quando nenhum pacote voltou
  platform: 'android';
}>
```

### Funcionamento

Para cada pacote (default 50): cria um `DatagramSocket`, envia uma query DNS minimal (12 bytes) para `host:port`, espera resposta com timeout (default 1000ms). Pacote sem resposta no timeout é contado como perdido. Roda em thread separada (`new Thread(...)`) — UDP I/O bloqueante não pode ficar na main thread Android.

Permissão necessária: `android.permission.INTERNET` (já declarada no `AndroidManifest.xml`).

### Integração no orchestrator

`src/utils/speedTestOrchestrator.ts` dispara `measurePacketLossNative()` em paralelo com a fase de upload (mesmo padrão do `probeDnsResolver`). Quando o resultado nativo está disponível, sobrescreve o `packetLoss` heurístico no `SpeedTestResult` final. O campo `packetLossSource` registra a origem:

| Valor | Significado |
|---|---|
| `'native'` | Plugin Capacitor PacketLoss (UDP real, Android APK) |
| `'estimated'` | Heurística do PWA web (timeouts de ping HTTP/CORS) |
| `undefined` | Registro legado ou origem desconhecida |

A UI (`ResultScreen` cell "Falhas" + `AdvancedSheet` row "Falhas na conexão") mostra label sutil "estimado" — `font-size: 10px`, cor `--text-3`, italic — quando `packetLossSource !== 'native'`. Transparência ao usuário: o número está lá, mas é estimativa.

`packetLossSource` é propagado pelo `appendRecord` para `TestRecord` e devolvido pelo `recordToResult`, mantendo o label "estimado" coerente em revisitas pelo histórico.

### Limitações

- **iOS:** plugin é apenas Android. Para iOS é preciso plugin Capacitor separado em Swift (Network framework / NWConnection) com provisioning Apple. **Pendente** — o bridge `measurePacketLossNative()` retorna `{ available: false }` no PWA iOS e o orchestrator preserva a estimativa.
- **NAT/CGNAT pesado em rede móvel:** RTT médio pode incluir buffer da operadora; contagem de perda permanece confiável.
- **Roteadores que bloqueiam respostas DNS UDP:** o teste retornará 100% de perda. Reduzir o `packetCount` ou apontar para outro `host:port` (ex.: 8.8.8.8:53) é o workaround.

### Bridge `src/utils/packetLoss.ts`

```ts
type PacketLossPlatform = 'android' | 'ios' | 'web';

interface PacketLossResult {
  available: boolean;
  sent?: number;
  received?: number;
  lossPercent?: number;
  avgRttMs?: number;
  platform?: PacketLossPlatform;
}

export async function measurePacketLossNative(opts?: { ... }): Promise<PacketLossResult>;
export function isPacketLossNativeAvailable(): boolean;
```

`measurePacketLossNative` é tolerante a falhas — sempre resolve, nunca lança; em caso de erro do plugin retorna `{ available: false }` e o caller (orchestrator) cai pra estimativa.

---

## 12. Feature DNS — `src/features/dns/` (refator 2026-05)

Pasta nova para abrigar o bottom sheet do guia de DNS, criado quando a `DNSGuideScreen` foi descontinuada.

### `DNSGuideSheet.tsx` + `.css` (refator "premium" 2026-05 → drag-to-resize 2026-05)

Substitui a antiga `DNSGuideScreen` (rota dedicada). Acionado pela row "DNS" da section "Mais detalhes" da ResultScreen. **No refator drag-to-resize 2026-05, passou a usar o `DraggableSheet` como base** — backdrop, container fixed, slide-up animation e drag handle vivem agora no `DraggableSheet`; o `DNSGuideSheet` mantém só os estilos de conteúdo (header, hero, pills, tabs, steps, footer) sob a classe `.lk-dns-sheet__inner`.

**Props:**

```ts
interface Props {
  open: boolean;
  onClose: () => void;
  /** Resultado do speedtest atual — usado no hero "Recomendação". */
  result?: SpeedTestResult;
  /** Benchmark já executado pela ResultScreen (opcional — sheet roda o seu se ausente). */
  benchmark?: DnsBenchmarkResult | null;
  /** Compatibilidade com chamadas legadas; ignorado. */
  serverId?: string;
}
```

**Estrutura visual (refator "premium" 2026-05):** sai do dump de passos
por plataforma para uma hierarquia "recomendação-first":

1. **Hero "Recomendação" — 3 estados (Bug-1 fix 2026-05)** — o estado
   é decidido por `chooseDnsRecommendation(currentLatencyMs, sortedServers)`
   importada de `utils/dnsBenchmark.ts`:
   - **`switch`** — grid 1fr · auto · 1fr. Lado esquerdo: kicker
     "Seu DNS", nome (`currentDnsLabel`, ver Bug-2 abaixo), latência
     atual em destaque (cor por threshold: ≥100ms vermelho, ≥50ms
     amarelo, <50ms verde). Lado direito: kicker "Recomendado",
     `recommendation.target.name`, latência verde + chip
     `−X ms · −Y%` mostrando ganho. Setinha entre os lados.
   - **`already_good`** — classe modificadora `--already-good`
     desativa o grid 3-col e empilha verticalmente: ícone
     `check-circle` verde + título "Seu DNS está excelente" + sub
     `<provedor> · <X> ms — sem necessidade de trocar`.
   - **`no_data`** — fallback do `switch` com `—` no lado direito e
     "Medindo…" enquanto `running === true`.
2. **Pills compactas (interativos, 2026-05)** — em `switch`, exclui o `fastest`. Em
   `already_good`, mostra os 3 mais rápidos. Pills `border-radius:
   999px` com nome em `var(--font-display)` + latência em
   `var(--font-mono)`. **Pills são botões clicáveis** (`<button>` semântico)
   que disparam `setSelectedServerId(p.id)` (state local `useState<string | null>`).
   Pill ativo recebe classe `.lk-dns-sheet__pill--active` (fundo
   `var(--accent-tint)` + borda `var(--accent)` + nome em `var(--accent)`).
   Ao selecionar um pill, `selectedServerStatic` (useMemo) atualiza e
   consequentemente `steps` e `copyIPs` refletem o servidor escolhido.
   Permite explorar recomendações de providers alternativos sem forçar
   adoção imediata.
3. **Tabs por plataforma** — `ios | android | router`. Auto-detecção
   inicial via `navigator.userAgent` (procura `iPhone|iPad|iPod` →
   `ios`, `Android` → `android`, fallback `android`). Tabs em pill,
   ativa em `var(--accent)`.
4. **Steps** — 4 passos numerados por plataforma. Cada step em card
   compacto com chip purple (`var(--accent-tint)`) à esquerda. Conteúdo
   por plataforma:
   - **iOS** (4): Ajustes → Wi-Fi → ⓘ → Configurar DNS → Manual → IPs.
   - **Android** (4): Configurações → Rede e internet → DNS privado →
     hostname DoT, com fallback de IP estático na rede Wi-Fi.
   - **Roteador** (4): painel `192.168.0.1`, login admin/admin, seção
     WAN/DNS, salvar.
5. **Linha de IPs** — texto centralizado discreto mostrando os IPs do
   servidor selecionado em `var(--font-mono)` para conferência rápida.
6. **Footer fixo (CTA estado-dependente)** — em `switch`/`no_data`:
   primary `var(--accent)` "Copiar IPs" →
   `navigator.clipboard.writeText('1.1.1.1, 1.0.0.1')` (fallback
   `document.execCommand` em iOS standalone antigo) + toast pill "IPs
   copiados" + secondary outline "Fechar". Em `already_good`: apenas
   primary "Fechar" (sem incentivar troca desnecessária).

**Bug-2 fix 2026-05 — fallback do nome do "Seu DNS":** o hero antes
exibia `result?.dnsProvider ?? 'Detectando…'`, mostrando "Detectando…"
mesmo após o speedtest ter terminado quando o probe falhou em mapear
o IP do resolver. Agora há um fallback em cascata em `currentDnsLabel`:

```ts
const currentDnsLabel =
  result?.dnsProvider          // nome conhecido (Cloudflare, Google, …)
  ?? result?.dnsResolverIp     // IP cru detectado mas não mapeado
  ?? 'Não identificado';       // probe DoH falhou completamente
```

Não há mais o estado "Detectando…" — o sheet só abre depois do teste
terminar; o estado de detecção do **provider** (vem do `probeDnsResolver`
do orchestrator) é independente do estado de **benchmark dos DoH
alternativos** (`runDNSBenchmark` rodando dentro do sheet).

**Comportamento dos dados:**

- Quando o pai passa `benchmark`, o sheet usa direto. Quando ausente,
  `useEffect` no abrir dispara `runDNSBenchmark()`. Para feedback
  imediato, faz seed do `loadLastDnsResult()` antes do benchmark
  terminar — UI já mostra o último resultado conhecido enquanto o
  refresh roda em background.
- Servidor selecionado para os steps = `fastest` do benchmark
  (`sortedServers[0]`) **mesmo no estado `already_good`** — quem
  decide trocar mesmo assim ainda precisa dos IPs. Sem benchmark
  ainda, fallback Cloudflare.
- Pills filtram para `samples > 0` (servidor que falhou no benchmark
  some da lista — Safari iOS bloqueia DoH com CORS estrito em alguns
  resolvers).

**Atalho de abertura (refator drag-to-resize 2026-05).** O sheet abre
pela row "DNS" da section "Mais detalhes" (`onClick={() => setActiveSheet('dns')}`)
e pela 4ª cell do bloco `.lk-result__secondary-block` (cell "DNS"),
que mantém `lk-result__secondary-cell--clickable` (cursor pointer +
hover/focus realça `cell-label` em `var(--accent)`), `role="button"`,
`tabIndex={0}` e handler de Enter/Espaço para acessibilidade. Os dois
caminhos coexistem e disparam o mesmo `setActiveSheet('dns')`.

**Comportamento do sheet:**

- Renderiza `null` quando `!open` (delegado ao `DraggableSheet`).
- Base visual e drag-to-resize fornecidos pelo `DraggableSheet` —
  snap entre 60vh (compact) e 88vh (expanded), pull-down threshold de
  30% fecha, fast-swipe-down (vel > 800 px/s) também fecha.
- Tecla `Esc` fecha; body scroll lock — ambos centralizados no
  `DraggableSheet`.
- `prefers-reduced-motion: reduce` bloqueia animação de entrada/saída.

**Por que sheet em vez de rota.** Encurta o caminho de volta; o usuário já está na ResultScreen, o sheet é um overlay leve. Também evita poluir o `screen` enum em `App.tsx`.

---

## 13. Feature Result Detail — `src/features/result-detail/` (refator drag-to-resize 2026-05)

Pasta nova para abrigar as 2 sheets que substituíram os accordions inline "Avançado" e "Modo Gamer" da section "Mais detalhes" da ResultScreen. O DNS já vivia em `features/dns/DNSGuideSheet`; agora os 3 caminhos seguem o mesmo padrão (row clicável → bottom sheet montado sobre `DraggableSheet`).

### Section "Mais detalhes" da ResultScreen (refator drag-to-resize 2026-05)

```
[ícone] Avançado            [chevron→]
[ícone] Modo Gamer          [chevron→]
[ícone] DNS                 [chevron→]
```

Renderizada como uma única `IOSList` com 3 items, cada um com `onClick: () => setActiveSheet(...)`. O estado `activeSheet: 'advanced' | 'gamer' | 'dns' | null` é mantido na ResultScreen e unifica a lógica de "qual sheet está aberta" (antes eram estados separados `dnsSheetOpen` e `dnsBenchStarted`). Os 3 sheets ficam sempre montados no DOM (`<AdvancedSheet open={activeSheet === 'advanced'} ... />` etc.) — o `open` controla a visibilidade.

### `AdvancedSheet.tsx` + `.css`

Porto do antigo `AdvancedAccordionBody`. Estrutura visual:

1. **Header sticky** — title "Avançado" + close button (mesmo padrão das demais sheets).
2. **Hero** — kicker "Detalhes técnicos" + título "Métricas, telemetria e histórico" + ícone settings 26px à esquerda, com border-top neutro.
3. **3 grupos hairlined**, cada um com `<IOSList>`:
   - Métricas avançadas: bufferbloat (latência sob carga), latência carregada, oscilação carregada, estabilidade DL (P25–P75), falhas, velocidade média (DL/UL via samples), IP público, provedor.
   - Sobre o teste: tempo total, distância estimada, timestamp absoluto, versão do app.
   - Histórico: comparação com média dos últimos 10 testes (delta % colorido por sinal).
4. **Footer fixo** — CTA "Fechar".

Todas as helpers (`bufferbloatColor`, `bufferbloatLabel`, `packetLossColor`, `packetLossLabel`, `formatFullDateTime`, `formatElapsedMs`, `averageFromSamples`, `historicalAverageDl`, `estimateDistanceKm`) foram migradas do `ResultScreen.tsx` para este arquivo — não há duplicação.

Empty-state preserva o legado: quando `metricItems`, `aboutItems` e `historyItems` estão todos vazios (extremamente raro — falhas na conexão sempre adiciona algo), exibe `<p className="lk-adv-sheet__empty">Sem dados avançados disponíveis para este teste.</p>`.

### `GamerSheet.tsx` + `.css`

Porto do antigo `GamerAccordionBody`. Estrutura visual:

1. **Header sticky** — title "Modo Gamer" + close.
2. **Hero** — kicker "Avaliação" + título com `overallLabel` ("Boa para jogos online." / "Atenção…" / "Conexão fraca…") + ícone gamepad colorido pelo `overallTone`. Border-top do hero pega a mesma cor (`--ribbon-color` inline).
3. **Stat cards 3 cols** — Resposta (latência), Oscilação (jitter), Falhas (perda) com cor por tone.
4. **Lista de jogos** — `<IOSList>` com 4 categorias (FPS competitivo, MOBA/BR, MMO/RPG, Cloud Gaming), cada uma com verdict colorido por tone (`good` / `maybe` / `bad`).
5. **Footer fixo** — CTA "Fechar".

A lógica `evaluateGames(result)` foi migrada do `ResultScreen.tsx` integralmente — mesma classificação por jogo, mesmos thresholds.

### Por que separar das tabs Wi-Fi (`features/local-wifi/`)

A pasta `local-wifi` é específica do diagnóstico Wi-Fi nativo (com plugin Capacitor associado). As sheets `AdvancedSheet` e `GamerSheet` consomem só o `SpeedTestResult` puro (sem capabilities nativas) — separação por domínio justifica a pasta nova.

---

## 14. Feature Contexto Wi-Fi via Atalho iOS — `src/features/ios-wifi-context/` (2026-05)

### Objetivo
Complementar o resultado do speedtest com dados locais do Wi-Fi do iPhone coletados pelo Atalho iOS "LINKA WiFi Context". O PWA não consegue obter SSID, RSSI, canal, padrão Wi-Fi e taxas de link de forma confiável no iOS — o atalho preenche essa lacuna.

### Tipos novos (em `src/types/index.ts`)
```ts
type WifiContextSource = 'ios-shortcut' | 'android-native' | 'manual' | 'unknown';

interface WifiContext {
  version: number;
  source: WifiContextSource;
  sessionId: string;
  collectedAt: number;    // Unix ms — usado para expiração (TTL 2 min)
  available: boolean;
  ssid?: string;
  bssid?: string;
  rssiDbm?: number;       // faixa válida: -100 a -20
  noiseDbm?: number;      // faixa válida: -120 a -20
  snrDb?: number;         // faixa válida: 0 a 80
  channel?: number;       // faixa válida: 1 a 233
  txRateMbps?: number;
  rxRateMbps?: number;
  linkSpeedMbps?: number;
  wifiStandard?: string;  // ex.: '802.11ax'
  localIp?: string;
}
```

### Arquivos da feature
- **`wifiShortcut.ts`** — `isIOS()`, `runWifiShortcut(sessionId)` (abre deep link `shortcuts://`), `parseWifiCallback(search)` (query string → `WifiContext`), `savePendingWifiContext` / `consumePendingWifiContext` (sessionStorage, TTL 2 min), `classifyRssi`, `rssiLabel`, `formatWifiStandard`.
- **`WifiContextCard.tsx` + `.css`** — card no resultado com IOSList mostrando sinal, canal, padrão e taxa negociada. Exibido na ResultScreen quando `result.wifiContext` está presente.

### Fluxo
1. StartScreen detecta iOS via `isIOS()` e exibe botão outlined "Medir com contexto Wi-Fi do iPhone".
2. Toque chama `runWifiShortcut(sessionId)` — abre `shortcuts://run-shortcut?name=LINKA%20WiFi%20Context&...`.
3. Atalho coleta dados e abre `https://<app>/wifi-callback?sid=...&rssi=...&channel=...`.
4. No mount do App, `useEffect` detecta `pathname === '/wifi-callback'` ou `search.includes('sid=')`, parseia, salva em `sessionStorage` e limpa a URL (`history.replaceState`).
5. Ao final do teste, `pendingWifiContextRef` é consumido e anexado a `test.result!.wifiContext` antes de chamar `appendRecord`.
6. `appendRecord` em `history.ts` propaga `wifiContext` para `TestRecord`.
7. ResultScreen renderiza `<WifiContextCard>` quando o campo está presente.

### SPA routing
`public/_redirects` com `/* /index.html 200` garante que a Cloudflare Pages sirva o app para `/wifi-callback?...` em vez de retornar 404.

### Fases futuras
- **Fase 2:** classificadores avançados + diagnóstico combinado Wi-Fi × speedtest.
- **Fase 3:** mascaramento de BSSID/IP no PDF/compartilhamento.
- **Fase 4:** migração para `ctx=base64url-json` no retorno do atalho.

---

## 15. Onboarding (primeira execução, 2026-05)

### Objetivo
Apresentar o app a quem abre pela primeira vez sem prejudicar quem já o conhece. Carousel de 3 cards exibido como overlay full-screen apenas na primeira execução; não é uma rota e não bloqueia o histórico de back/forward.

### Componentes
- **`src/screens/OnboardingScreen.tsx` + `OnboardingScreen.css`** — overlay puramente apresentacional. Recebe `onComplete: () => void` e dispara quando o usuário avança após o último card OU clica "Pular". Estado interno (`index`) controla qual card aparece. Animação: `translateX(-${index * 100}%)` com `transition: 320ms cubic-bezier(0.32, 0.72, 0, 1)`. Respeita `prefers-reduced-motion: reduce`.
- **3 cards (conteúdo hardcoded em pt-BR):**
  1. Gauge SVG inline + "Mede sua internet com precisão"
  2. Trio gamepad/tv/briefcase + "Descubra se serve pra Jogos, 4K, Trabalho"
  3. Cadeado + "Permissões necessárias" com 2 bullets (Localização, Notificações)
- **Footer:** dots indicators (3 pílulas pequenas, ativa em `--accent`) + botão CTA `Avançar` que vira `Começar` no último card. Topo direito: "Pular" text-link.
- **Swipe horizontal interno** entre cards (threshold 60px, ratio 1.4 — não conflita com o swipe lateral global do `App.tsx` porque o overlay tem z-index alto e captura o touch primeiro).
- **SVGs inline** seguem o padrão dos icons em `src/components/icons.tsx` — `stroke="currentColor"`, `strokeWidth=1.6/2.2`, sem dependências externas.

### Gate em `App.tsx`
- Constante `ONBOARDING_KEY = 'linka.onboarding.done'` em localStorage.
- `readOnboardingDone()` lê `'1'` de forma síncrona no init do state `onboardingDone`.
- Render condicional FORA do `view` principal (acima da árvore de telas, abaixo do `<PwaUpdatePrompt />`):
  ```tsx
  {!onboardingDone && (
    <Suspense fallback={null}>
      <OnboardingScreen onComplete={handleOnboardingComplete} />
    </Suspense>
  )}
  ```
- `handleOnboardingComplete`: `localStorage.setItem(ONBOARDING_KEY, '1')` + `setOnboardingDone(true)`.
- `handleResetOnboarding`: `localStorage.removeItem(ONBOARDING_KEY)` + `setOnboardingDone(false)`. Repassado para a `ExploreScreen` → `HamburgerMenu` como prop opcional `onResetOnboarding`.

### "Ver tutorial novamente"
- `HamburgerMenu` ganhou prop opcional `onResetOnboarding?: () => void`. Quando presente, renderiza um item `Ver tutorial novamente` (ícone `bulb`) acima da seção "Velocidade contratada". O item aparece atualmente só na `ExploreScreen` (Settings hub). Pode ser propagado para outros consumers do menu sem mudar a API.

### Acessibilidade e travas
- `role="dialog"`, `aria-modal="true"`, `aria-label="Bem-vindo à linka"`.
- Trava `document.body.style.overflow = 'hidden'` enquanto o overlay está montado (cleanup no unmount).
- Dots são `role="tab"` com `aria-selected` para refletir o card ativo.

### Risco
Em iOS standalone, o body do app já está com `overflow: hidden` (regra global em `tokens.css`). A trava local do overlay é redundante mas inofensiva — protege em browsers desktop usados para QA/dev.

---

## 15. Code splitting (2026-05)

### Decisão
Bundle principal pré-refator era ~1.2 MB. Telas e sheets que não fazem parte do caminho principal são lazy-imported via `React.lazy` + `Suspense`, com chunks separados pelo Vite/Rollup default.

### Componentes lazy
**App.tsx (screens secundárias):**
- `ComparisonScreen`
- `BeforeAfterScreen`
- `RoomTestScreen`
- `ExploreScreen`
- `LocalWifiScreen` (em `features/local-wifi/`)
- `LocalNetworkScreen` (em `features/local-network/`)
- `OnboardingScreen` (overlay, exibido apenas na 1ª execução)

**ResultScreen.tsx (sheets de "Mais detalhes"):**
- `AdvancedSheet`
- `GamerSheet`
- `DNSGuideSheet`

**WifiSignalSection.tsx:**
- `WifiDetailsSheet`

**WifiDetailsSheet.tsx:**
- `WifiOptimizeSheet`

### Eager (não lazy, intencional)
- `StartScreen` — entrypoint frio
- `RunningScreen` — precisa estar pronta no instante em que o teste inicia (delay seria visível)
- `HistoryScreen` — uso muito frequente
- `ResultScreen` — caminho principal pós-teste; manter eager evita um Suspense fallback no fluxo "abriu app → resultado anterior"

### Padrão de wrapper
Todos os componentes lazy têm `export function NomeComponente` (named export). React.lazy exige um módulo com `default`. O wrapper:
```tsx
const X = lazy(() => import('./X').then((m) => ({ default: m.X })));
```

### Mount condicional × always-mounted
Antes do refator, sheets como `AdvancedSheet` ficavam sempre montadas, com prop `open` controlando a visibilidade (e o `DraggableSheet` interno retornando `null` quando fechado). Para que o lazy realmente difira o download do chunk, o pattern foi convertido para:
```tsx
{activeSheet === 'advanced' && (
  <Suspense fallback={null}>
    <AdvancedSheet open onClose={...} ... />
  </Suspense>
)}
```
Sem isso, o `import()` dispararia já no mount da `ResultScreen` e o ganho seria zero.

### Fallback `<ScreenLoadingFallback>`
Componente local em `App.tsx`, full-screen com `var(--bg)` + texto "Carregando…" centralizado. Sem TopBar/PageHeader — qualquer esqueleto mais elaborado tende a piscar em conexões rápidas. Sheets usam `fallback={null}` (aparecem rápido o suficiente; um placeholder atrapalharia o gesto).

### Verificação esperada após `npm run build`
- Chunk principal cai para ~600–800 KB (alvo: ≥ 20% de redução).
- Chunks novos com nomes derivados do componente: `ComparisonScreen-XXXX.js`, `AdvancedSheet-XXXX.js`, etc.
- Primeiro click em uma sheet/tela secundária pode ter 100–200 ms de delay aceitável (chunk + parse).

### Risco e mitigação
- **Imports circulares:** os componentes lazy não importam `App.tsx` nem componentes eager que voltariam para si. Cada um depende só de `components/`, `hooks/`, `utils/`, `core/`, `types/`.
- **Tipos compartilhados:** `ComparisonStep` e `BeforeAfterStep` continuam importados de forma estática como `import type {...}` — não puxam runtime.
- **Service Worker:** o Workbox precachea `**/*.{js,css,...}` por glob, então os novos chunks entram no precache normalmente.

---

## 16. Descoberta de dispositivos na rede local (Android nativo)

### Decisão

Descoberta LAN não é implementável em PWA puro. Browser não expõe ARP/MAC, UDP 137, multicast SSDP/mDNS nem TCP scan arbitrário. A feature roda via Capacitor Android e cai para indisponibilidade transparente no PWA.

### Contratos

- `DeviceObservation`: evidência por fonte (`arp`, `tcp`, `ssdp`, `mdns`, `netbios`, `router`, `cache`).
- `DeviceRegistry`: ponto único de merge. Agrupa por IP/MAC, preserva fontes, escolhe nome por prioridade e calcula confiança.
- `ClientIdentityProvider`: contrato para identidade vinda de modem/roteador por MAC normalizado ou IP. Não é DHCP provider; a origem pode ser DHCP leases, clientes Wi-Fi, LAN, mesh/repeater ou nomes salvos no equipamento.

Hierarquia de nome:

1. nome personalizado
2. modem/roteador
3. SSDP `friendlyName`
4. mDNS instance name
5. NetBIOS name
6. reverse DNS/PTR
7. fabricante + tipo inferido
8. IP/MAC
9. `Dispositivo desconhecido`

Confiança:

- `confirmed`: 3+ fontes
- `medium`: 2 fontes
- `probable`: 1 fonte
- `inferred`: cache apenas

### Fontes nativas

`LocalNetworkDiscoveryPlugin.java` emite observações, nunca devices finais:

- ARP: lê `/proc/net/arp` quando disponível.
- TCP probe: tenta portas comuns com timeout curto.
- SSDP/UPnP: `M-SEARCH` + fetch do XML de descrição para `friendlyName`, `manufacturer`, `modelName`.
- mDNS/DNS-SD: consulta multicast `_services._dns-sd._udp.local` e extrai nome legível quando possível.
- NetBIOS NBNS: Node Status Query UDP 137, ignorando `WORKGROUP`, `MSHOME`, `__MSBROWSE__` e nomes técnicos/hex.

Limites: 64 alvos por varredura, TCP 350 ms, UDP ~2,3 s. Redes/OEMs podem bloquear ARP ou multicast; isso reduz confiança, não cria lista paralela.

### UI e testes

`LocalNetworkScreen` fica em `features/local-network/`, lazy-loaded no `App.tsx` e acessível pela `ExploreScreen` apenas no nativo. Reutiliza `TopBar`, `PageHeader` e `IOSList`.

`src/__tests__/localNetworkRegistry.test.ts` cobre normalização de MAC, merge único, prioridade de nomes, filtro de NetBIOS técnico, ClientIdentityProvider e labels pt-BR.

### DNS Probe — compatibilidade de parser

`probeDnsResolver()` aceita respostas TXT em dois formatos: `remote_ip: <ip>` e IP direto (`"1.1.1.1"`). Isso mantém compatibilidade com fixtures antigas sem mudar o contrato público `{ latencyMs, resolverIp, provider }`.

---

## 8. Mudanças 2026-05-04 (commit `3367a07`)

### Refresh ISP ao Iniciar Teste

**Otimização:** `App.tsx` agora dispara `deviceInfo.reload()` quando `test.phase === 'latency'` (início da medição). Implementação via `useRef` (`deviceInfoReloadRef`) para evitar múltiplos disparos causados por mudanças no objeto `deviceInfo` durante rerenders.

**Impacto:** O ISP capturado em `appendRecord()` (fase `done`) reflete a rede ativa no momento da medição, não a rede no mount do app. Combinado com os gatilhos existentes (`navigator.connection.change`, `window.online`), garante que:
1. StartScreen mostra ISP correto após troca de rede
2. Registro persistido em histórico (`TestRecord.isp`) é precisamente o do momento do teste

### Melhorias em Upload e Retry

**`uploadProbe.ts` e `speedTestOrchestrator.ts`:**
- Lógica de retry aprimorada para falhas de upload em conexões mobile
- Fallback progressivo entre presets (mobile_broadband vs fixed_broadband)
- Resultado parcial (`result.ulFailed`) é persistido corretamente no histórico

### Expansão Visual ResultScreen

**`ResultScreen.tsx`:**
- Incremento na hierarquia visual dos blocos principais (PRIMARY, SECONDARY, USE-CASES)
- Melhor espaçamento e proporção entre seções
- Ribbon de cor de verdict agora reflete quality com mais precisão em todos os breakpoints

### Logo Android Integrado

**`android/app/src/main/res/drawable/ic_launcher.png`:**
- Substituído com `public/icon-512.png` (logo PWA)
- APK agora exibe o logo da marca linka em todos os estados (launcher, notificações, etc.)
- Manutenção unificada: mudanças no logo PWA propagam automaticamente ao APK no próximo build
