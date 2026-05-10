# DocumentaÃ§Ã£o TÃ©cnica do Sistema â€” linka SpeedTest PWA

> Arquitetura, tipos, hooks, utils, componentes e infraestrutura de deploy.

---

## 1. Stack e versÃµes

| Tecnologia | VersÃ£o | FunÃ§Ã£o |
|---|---|---|
| Vite | ^7.0 | Build tool + dev server |
| React | ^19 | Framework UI |
| TypeScript | ^6 | Tipagem estÃ¡tica |
| vite-plugin-pwa | ^1.2 | Manifest + service worker |
| Capacitor | ^8 | Empacotamento Android nativo do PWA |
| Android SDK | Platform 36 / Build Tools 36.1 | Build do APK |
| **APK versÃ£o** | **v1.0.0 (code 1000000)** | **[2026-05-04] Debug build assinado; logo PWA integrado** |
| JDK | 21 LTS | CompilaÃ§Ã£o Gradle/Android |
| Recharts | latest | GrÃ¡ficos (HistoryScreen) |
| jsPDF | latest | GeraÃ§Ã£o de PDF |
| html2canvas | latest | Captura de DOM para PDF |
| Vitest | latest | Testes unitÃ¡rios |

> **Nota:** vite-plugin-pwa 1.x Ã© incompatÃ­vel com Vite 8+. NÃ£o atualizar Vite sem validar a versÃ£o do plugin.

---

## 2. Tipos (`src/types/index.ts`)

Todos os tipos compartilhados do projeto vivem em um Ãºnico arquivo.

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
  tMs: number;   // ms relativo ao inÃ­cio da fase
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
  dl: number          // Mbps download (mÃ©dia da janela estÃ¡vel â€” Motor v2)
  ul: number          // Mbps upload (mÃ©dia da janela estÃ¡vel â€” Motor v2)
  latency: number     // ms mediana das amostras idle
  jitter: number      // ms MAD da latÃªncia idle
  packetLoss: number  // % perda de pacotes (0â€“100)
  timestamp: number   // Unix ms
  mode?: SpeedTestMode
  // â”€â”€ Motor v2 (opcionais) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  stabilityScore?: number;         // 0â€“100 derivado da sÃ©rie temporal (100 = mÃ­nima variaÃ§Ã£o)
  peakDlMbps?: number;             // pico de download Mbps
  peakUlMbps?: number;             // pico de upload Mbps
  bufferbloatSeverity?: BufferbloatSeverity;
  latencyUnloaded?: number;        // ms â€” mediana idle (mesmo que latency)
  latencyDownload?: number;        // ms â€” mediana durante DL simultÃ¢neo
  latencyUpload?: number;          // ms â€” mediana durante UL simultÃ¢neo
  diagnostics?: SpeedTestDiagnostics;
  dlSamples?: SpeedTestSample[];
  ulSamples?: SpeedTestSample[];
  // â”€â”€ DNS feature (2026-05) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  dnsLatencyMs?: number | null;    // ms â€” Resource Timing API (null = sem amostra vÃ¡lida)
  dnsResolverIp?: string | null;   // IP do resolver via DoH whoami
  dnsProvider?: string | null;     // 'Cloudflare' | 'Google' | 'Quad9' | â€¦ | 'DNS do provedor'
  // â”€â”€ Tempo total do teste (2026-05) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  elapsedMs?: number;              // ms entre inÃ­cio e fim do `runSpeedTestV2()`; consumido pelo accordion "AvanÃ§ado" (item "Tempo total do teste"). Sem fallback runtime â€” registros legados ficam undefined.
  // â”€â”€ Resultado parcial (2026-05) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ulFailed?: boolean;              // true quando upload falhou mas DL+latÃªncia OK (tÃ­pico em uplink celular saturado). UI exibe "â€”" + "nÃ£o medido" no upload e banner "Resultado parcial". Falhas de DL/latÃªncia continuam invalidando o teste todo.
  // â”€â”€ Advanced mode legado (opcionais) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  dlP25?: number; dlP75?: number   // Mbps â€” intervalo de estabilidade DL
  ulP25?: number; ulP75?: number   // Mbps â€” intervalo de estabilidade UL
  latencyLoaded?: number           // ms â€” latÃªncia mediana sob carga (legado)
  jitterLoaded?: number            // ms â€” MAD da latÃªncia sob carga (legado)
  bufferbloatGrade?: 'A'|'B'|'C'|'D'|'F'
  bufferbloatDeltaMs?: number      // ms de degradaÃ§Ã£o (loaded âˆ’ idle)
}

interface SpeedTestProgress {
  phase: TestPhase
  instantMbps: number | null  // velocidade instantÃ¢nea da rodada atual
  overallProgress: number     // 0â€“1
  partial?: Partial<SpeedTestResult>
}

interface ServerInfo {
  id: string        // ex: 'cloudflare'
  name: string      // ex: 'Cloudflare'
  ip: string        // IP pÃºblico do cliente
  colo: string      // PoP de conexÃ£o (ex: 'GIG')
  loc: string       // LocalizaÃ§Ã£o (ex: 'BR')
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
  isp?: string              // opcional â€” compatibilidade com registros antigos
  deviceType: DeviceType
  connectionType: ConnectionType
  testMode?: SpeedTestMode  // opcional â€” ausente em registros gravados antes desta versÃ£o
  connectionProfile?: ConnectionProfile
  ruleSetVersion?: RuleSetVersion
  locationTag?: string      // etiqueta de cÃ´modo/local (Teste por local)
  // â”€â”€ Motor v2 (opcionais) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  stabilityScore?: number;
  bufferbloatSeverity?: BufferbloatSeverity;
  diagnosticSummary?: string;
  peakDlMbps?: number;
  peakUlMbps?: number;
  // â”€â”€ DNS feature (2026-05) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  dnsLatencyMs?: number | null;
  dnsResolverIp?: string | null;
  dnsProvider?: string | null;
}

interface Classification {
  primary: Quality
  tags: Set<Tag>
}

interface ComparisonResult {
  downloadDropPercent: number       // % de queda de DL (near â†’ far)
  uploadDropPercent: number         // % de queda de UL
  latencyIncreasePercent: number    // % de aumento de latÃªncia
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

### 3.1 Motor v2 â€” MediÃ§Ã£o Cloudflare direta

O motor legado (`speedtest.ts` e `bufferbloat.ts`) foi removido e substituÃ­do por cinco mÃ³dulos independentes. O Motor v2 implementa mediÃ§Ã£o temporal com paralelismo progressivo e bufferbloat integrado durante DL/UL.

---

#### 3.1a `cloudflareSpeedTest.ts` â€” Primitivas HTTP

Endpoints Cloudflare usados diretamente (sem SDK):

| PropÃ³sito | MÃ©todo | URL |
|---|---|---|
| Download | GET | `https://speed.cloudflare.com/__down?bytes=N&_cb={ts}_{rand}` |
| Upload | POST | `https://speed.cloudflare.com/__up` |
| LatÃªncia / Ping | GET | `https://speed.cloudflare.com/__down?bytes=0&_cb={ts}_{rand}` |

Anti-cache: `_cb={Date.now()}_{Math.random()}` em todo request; `Cache-Control: no-store`.

```ts
export const DL_SIZES = [100_000, 1_000_000, 10_000_000, 25_000_000, 100_000_000] as const;
export const UL_SIZES = [256_000, 1_000_000, 5_000_000, 10_000_000] as const;

cfDownloadStream(bytes, signal): Promise<ReadableStreamDefaultReader<Uint8Array>>
cfPing(signal): Promise<number | null>  // RTT em ms; null = timeout
cfUploadChunk(buffer, signal): Promise<number>  // resolve com bytes enviados
```

**CORS no `/__up`** â€” `speed.cloudflare.com/__up` nÃ£o responde a preflight (OPTIONS retorna HTTP 400). Para evitar preflight, `cfUploadChunk` Ã© uma **simple CORS request**: POST + `ArrayBuffer`, sem `setRequestHeader` e **sem nenhum listener em `xhr.upload`** (registrar `upload.onprogress`/`onload`/etc. torna o request non-simple e forÃ§a preflight). Em troca, perdemos progresso intra-POST: o sampler de `uploadProbe` contabiliza os bytes apenas na conclusÃ£o de cada POST. Os `sizeIndex` 5 MB/10 MB sÃ£o alinhados ao prÃ³prio `speed.cloudflare.com` â€” chunks grandes amortizam o overhead TCP/TLS por POST, condiÃ§Ã£o necessÃ¡ria para medir corretamente conexÃµes > 100 Mbps.

---

#### 3.1b `latencyProbe.ts` â€” MediÃ§Ã£o de latÃªncia

```ts
interface LatencyPhaseResult {
  medianMs: number;        // mÃ©trica principal
  meanMs: number;
  jitterMs: number;
  timeoutRate: number;     // 0â€“1
  approximateLoss: number; // %
}

runLatencyPhase(pingCount, signal, onProgress): Promise<LatencyPhaseResult>
runPingLoop(signal, intervalMs, onPing): Promise<void>
```

- `runLatencyPhase`: 15â€“25 pings; descarta o 1Âº; remove outliers > 3Ã— mediana
- `runPingLoop`: loop contÃ­nuo de pings â€” usado em paralelo com DL/UL para medir bufferbloat

---

#### 3.1c `downloadProbe.ts` â€” Motor de download time-based

| Config | durationMs | initialStreams | maxStreams | sizeIndex | warmupMs |
|---|---|---|---|---|---|
| `DOWNLOAD_CONFIG_FAST` | 7.000 | 2 | 4 | 2 (10 MB) | 1.000 |
| `DOWNLOAD_CONFIG_COMPLETE` | 18.000 | 2 | 8 | 3 (25 MB) | 2.000 |

**Algoritmo:**
- Abre `initialStreams` streams via `cfDownloadStream`; tick de amostragem a cada 300 ms
- Cada stream: ao terminar, reabre nova requisiÃ§Ã£o com novo `_cb` (fluxo contÃ­nuo)
- Paralelismo progressivo (modo completo): a cada 4 s, se ganho â‰¥ 10% e streams < maxStreams â†’ abre +2 streams
- Encerramento: `AbortController` com timeout = `durationMs`

**CÃ¡lculo final (MÃ‰DIA â€” nÃ£o mediana, nÃ£o P90):**
```
valid  = samples com tMs â‰¥ warmupMs
stable = valid.slice(Math.ceil(len * 0.35))   // Ãºltimos 65%
throughputMbps = mean(stable)
peakMbps       = max(valid)
stabilityScore = clamp(100 âˆ’ (std/mean Ã— 150), 0, 100)
```

**Fallback:** stream falha â†’ tenta `DL_SIZES[iâˆ’1]` (atÃ© 2Ã—). Todos falham â†’ `SpeedTestError('download_failed')`.

```ts
interface DownloadProbeResult { throughputMbps; peakMbps; stabilityScore; samples: SpeedTestSample[]; }
runDownloadProbe(config, signal, onInstant): Promise<DownloadProbeResult>
```

---

#### 3.1d `uploadProbe.ts` â€” Motor de upload time-based

Espelho do `downloadProbe`, usando `cfUploadChunk` (XHR sem listeners em `xhr.upload`, ver Â§3.1a). O sampler de 300 ms Ã© alimentado pelos bytes do buffer ao **completar cada POST** â€” nÃ£o hÃ¡ progresso intra-POST por restriÃ§Ã£o de CORS.

| Config | durationMs | initialStreams | maxStreams | sizeIndex | warmupMs |
|---|---|---|---|---|---|
| `UPLOAD_CONFIG_FAST` | 7.000 | 4 | 4 | 2 (5 MB) | 1.000 |
| `UPLOAD_CONFIG_COMPLETE` | 18.000 | 8 | 8 | 3 (10 MB) | 2.000 |

Mesma lÃ³gica de janela estÃ¡vel (65%) e fallback com `UL_SIZES[iâˆ’1]`.

**Os antigos presets `UPLOAD_CONFIG_MOBILE_FAST/COMPLETE` (256 KBÃ—3 / 1 MBÃ—4) ficaram obsoletos** apÃ³s o Bug-fix 2026-05 (upload mobile <2 Mbps). Continuam exportados em `uploadProbe.ts` para inspeÃ§Ã£o, mas nÃ£o sÃ£o mais consumidos pelo orchestrator. O perfil `mobile_broadband` agora usa o motor adaptativo descrito abaixo.

**`runAdaptiveUploadProbe(signal, onInstant)` â€” modo adaptativo (Bug-fix 2026-05, upload mobile <2 Mbps):**

```ts
runAdaptiveUploadProbe(signal: AbortSignal, onInstant: (mbps: number) => void): Promise<UploadProbeResult>
```

EstratÃ©gia em rodadas progressivas. Cada rodada faz N uploads paralelos de buffers idÃªnticos; mede `roundDuration`. Se `roundDuration < 2s` e ainda hÃ¡ margem â†’ escala (chunkÃ—4, +1 stream). 2 rodadas lentas consecutivas â†’ para. Limites: 4 rodadas mÃ¡ximas, 25 s totais, timeout de 6 s por rodada.

| Rodada tÃ­pica em uplink ~10 Mbps | chunk | streams | duraÃ§Ã£o esperada |
|---|---|---|---|
| 1 | 64 KB | 1 | ~0,06 s |
| 2 | 256 KB | 2 | ~0,4 s |
| 3 | 1 MB | 3 | ~2,4 s |
| 4 | 2 MB | 4 | ~6,4 s (timeout) |

Em uplink ~0,5 Mbps:

| Rodada | chunk | streams | duraÃ§Ã£o esperada |
|---|---|---|---|
| 1 | 64 KB | 1 | ~1,0 s |
| 2 | 64 KB | 1 (nÃ£o escalou) | ~1,0 s |
| 2Ã— lento â†’ para | | | |

Em ambos os cenÃ¡rios retorna `samples` reais. LanÃ§a `upload_failed` apenas quando NENHUMA rodada produz amostras (rede catastroficamente offline â€” nÃ£o simplesmente lenta).

---

#### 3.1e `speedTestOrchestrator.ts` â€” Orquestrador

```ts
type SpeedTestErrorCode = 'download_failed' | 'upload_failed' | 'latency_failed' | 'network_offline' | 'server_unavailable'
class SpeedTestError extends Error { readonly code: SpeedTestErrorCode }

runSpeedTestV2(mode: 'fast' | 'complete', onProgress, signal, connectionType?): Promise<SpeedTestResult>
```

**SequÃªncia de execuÃ§Ã£o:**

1. **LatÃªncia** â€” `runLatencyPhase(15|25)` â†’ emite `partial: { latency, jitter, packetLoss }`
2. **Download + bufferbloat DL** â€” `runPingLoop(dlPingCtrl.signal)` em background; `await runDownloadProbe`; `dlPingCtrl.abort(); await dlPingPromise` â†’ `latencyDownload`; emite `partial: { dl }`
3. **Upload + bufferbloat UL** â€” mesmo padrÃ£o com `ulPingCtrl` â†’ `latencyUpload`
4. **DiagnÃ³stico** â€” `dlDelta = max(0, latencyDownload âˆ’ latencyUnloaded)`; `ulDelta` idem; `severity = classifyBufferbloatSeverity(max(dlDelta, ulDelta))`; `buildDiagnostics(partialResult)`
5. Retorna `SpeedTestResult` completo com campos v2 (inclui `elapsedMs = Date.now() - testStartTime`, capturado no inÃ­cio do passo 1 â€” duraÃ§Ã£o total do teste exposta no accordion "AvanÃ§ado", item "Tempo total do teste")

**SeleÃ§Ã£o da estratÃ©gia de upload por perfil (Bug-fix 2026-05):** antes de iniciar a fase 1, o orchestrator chama `toConnectionProfile(connectionType)` e ramifica:
- `fixed_broadband` â†’ `runUploadProbe(UPLOAD_CONFIG_FAST|COMPLETE, ...)` (preset fixo).
- `mobile_broadband` â†’ `runAdaptiveUploadProbe(signal, ...)` (rodadas progressivas, ver Â§3.1d).

Download e latÃªncia seguem os mesmos presets em ambos os perfis â€” o motor `runDownloadProbe` contabiliza bytes via `ReadableStream.read()` em tempo real, sem depender de conclusÃ£o.

O `ulProgressBudget` (mapeamento da fase de upload no `overallProgress`) Ã© o `durationMs` do preset em fixa e fixo em 25 s no modo adaptativo (teto do orÃ§amento adaptativo).

**Resultado parcial em falha de upload (Bug-fix 2026-05):** se `runUploadProbe` lanÃ§ar (ex.: nenhum chunk completou em uplink celular saturado, mesmo com presets mobile), o orchestrator:
- Distingue abort externo (`AbortError`) e offline (`navigator.onLine === false`) â€” esses **continuam** lanÃ§ando `SpeedTestError`.
- Em qualquer outra falha, marca `ulFailed = true`, define `ul = 0`, `peakUlMbps = 0`, `ulSamples = []`, `latencyUpload = latencyUnloaded` (fallback do bufferbloat). DL e latÃªncia ficam intactos.
- Retorna `SpeedTestResult` vÃ¡lido. ResultScreen detecta `result.ulFailed` e exibe "â€”" + "nÃ£o medido" na cell de upload, mais um banner "Upload nÃ£o pÃ´de ser medido. Resultado parcial." abaixo do banner de contexto.

Esse caminho preserva o teste em vez de invalidÃ¡-lo, alinhado com a UX de teste de internet em mobile (mediÃ§Ã£o de DL+latÃªncia sozinha jÃ¡ Ã© Ãºtil para diagnÃ³stico).

**Mapeamento de progresso:**

A funÃ§Ã£o `computeRanges(mode)` (exportada para teste em `__tests__/speedtest.test.ts`) deriva os pesos a partir do nÃºmero real de amostras esperadas em cada fase: `pingCount` (latÃªncia), `dlDuration / 300ms` e `ulDuration / 300ms`. Substituiu o objeto estÃ¡tico `PROGRESS_RANGES` (Bloco Motion, 2026-05).

| Fase | RÃ¡pido (15+23+23) | Completo (25+60+60) |
|---|---|---|
| LatÃªncia | 0â€“24,6% | 0â€“17,2% |
| Download | 24,6â€“62,3% | 17,2â€“58,6% |
| Upload   | 62,3â€“100% | 58,6â€“100% |

**Bug fix do progresso (Bloco Motion, 2026-05):** O cÃ¡lculo `local = (performance.now() % durationMs) / durationMs` era nÃ£o-monotÃ´nico â€” `performance.now()` Ã© tempo desde o load da pÃ¡gina, nÃ£o da fase, e `% durationMs` causa wraps. SubstituÃ­do por `local = (performance.now() - phaseStart) / durationMs`, com `phaseStart` capturado imediatamente antes de `runDownloadProbe` / `runUploadProbe`. O resultado Ã© progresso suave dentro da fase, sem oscilaÃ§Ã£o para trÃ¡s. Helper pÃºblico `mapProgress(range, local)` clampa `local` em `[0,1]` e projeta no `range`.

### 3.2 `classifier.ts` â€” Classificador de qualidade

> **Fase 6 (legado removido):** Arquivo podado para < 50 linhas â€” contÃ©m apenas `RULE_SET_VERSION` e `classify()`. Todas as demais funÃ§Ãµes (`qualityHeadline`, `tagLabel`, `stability`, `stabilityLabel`, `buildShortPhrase`, `buildDiagnosis`, `clamp`) foram deletadas. Chamadores migrados para `interpretSpeedTestResult()` + `resolveCopy()`.

**`classify(r: SpeedTestResult): Classification`**

Tags avaliadas primeiro (independentes):
| Tag | CondiÃ§Ã£o |
|---|---|
| `highLatency` | `latency > 80` ms |
| `lowUpload` | `ul < 5` Mbps |
| `unstable` | `jitter > 50` ms |
| `packetLoss` | `packetLoss > 2%` |
| `veryUnstable` | `packetLoss > 5% OR jitter > 80` ms |

Quality (avaliado em ordem, primeira correspondÃªncia vence):
| Quality | CondiÃ§Ã£o |
|---|---|
| `unavailable` | `dl === 0 AND ul === 0` |
| `excellent` | DLâ‰¥100, ULâ‰¥30, latâ‰¤30, jitterâ‰¤5, lossâ‰¤0.5% |
| `good` | DLâ‰¥50, ULâ‰¥10, latâ‰¤60, jitterâ‰¤15, lossâ‰¤1.5% |
| `fair` | DLâ‰¥10, ULâ‰¥3, latâ‰¤100, lossâ‰¤2% |
| `slow` | `dl > 0 OR ul > 0` |
| `unavailable` | fallback |

### 3.3 `serverRegistry.ts` â€” Registro de servidores

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
- O `asOrganization` retornado pelo Cloudflare costuma ser o nome corporativo da ASN (ex.: "TELEFONICA BRASIL S.A."). A funÃ§Ã£o interna `friendlyIsp()` mapeia para nome comercial conhecido pelo usuÃ¡rio brasileiro: TELEFONICA/VIVO â†’ "Vivo", AMERICA MOVIL/CLARO/NET SERVICOS â†’ "Claro", TIM â†’ "TIM", OI/TELEMAR â†’ "Oi", ALGAR â†’ "Algar". Sem match: preserva o `asOrganization` original.

**`SERVERS: ServerProvider[]`** â€” array com todos os provedores ativos (atualmente sÃ³ Cloudflare)

**`getDefaultServer()`, `getServer(id: string)`** â€” helpers para acessar o registro

### 3.4 `history.ts` â€” HistÃ³rico local

Chave localStorage: `linka.speedtest.history.v1`

```ts
loadHistory(): TestRecord[]      // mais recente primeiro, max 50
appendRecord(result, meta): void // FIFO, descarta mais antigos se >50
previousRecord(): TestRecord | null  // retorna o registro mais recente antes do novo
clearHistory(): void
```

`appendRecord` constrÃ³i `TestRecord` a partir de `SpeedTestResult + { serverName, isp?, deviceType, connectionType, testMode?, locationTag? }`. Os campos opcionais garantem backward-compatibility com registros gravados em versÃµes anteriores.

`locationTag` Ã© preenchido pelo `locationTagRef` de `App.tsx` quando o teste foi iniciado via `RoomTestScreen` ou Prova Real com cÃ´modo selecionado. Limpo (`null`) imediatamente apÃ³s `appendRecord` ser chamado.

### 3.5 `pdfExport.ts` â€” ExportaÃ§Ã£o de PDF

**`exportResultPdf(result, serverName, isp?): Promise<void>`**
- Cria div oculto (`position:fixed; left:-9999px`) com HTML/CSS inline
- Renderiza via `html2canvas` com `scale:2` e `backgroundColor:'#FFFFFF'`
- Converte canvas para PNG â†’ adiciona ao jsPDF A4 portrait
- ConteÃºdo: logo linka, data, banner de qualidade, DL/UL, lat/jitter/estabilidade, diagnÃ³stico
- Salva como `linkaSpeedtestPwa-YYYY-MM-DD.pdf`

**`exportHistoryPdf(items: TestRecord[]): Promise<void>`**
- Mesma abordagem, jsPDF A4 landscape, `scale:1.5`
- ConteÃºdo: logo, resumo de mÃ©dias, tabela completa (Data, DL, UL, Resposta, OscilaÃ§Ã£o, Perda, Qualidade, Operadora)
- Salva como `linkaSpeedtestPwa-historico-YYYY-MM-DD.pdf`

**`loadLogoBase64(): Promise<string | null>`**
- Fetch `/logo.png` â†’ `FileReader.readAsDataURL` â†’ base64 para `jsPDF.addImage`

### 3.6 `recommendations.ts` â€” RecomendaÃ§Ãµes contextuais (em desuso)

> âš ï¸ **Refator 2026-05.** A `RecommendScreen` foi removida e este utilitÃ¡rio
> deixou de ter callers ativos. As recomendaÃ§Ãµes foram fundidas com a
> avaliaÃ§Ã£o por mÃ©trica em `diagnosisItems.ts` (ver Â§3.6.1) â€” uma Ãºnica
> lista `[problema] â†’ [aÃ§Ã£o]` no card de DiagnÃ³stico da ResultScreen.
>
> O arquivo segue disponÃ­vel para o caso de a UX trazer de volta uma
> superfÃ­cie dedicada (ou o motor unificado consumir as regras), mas
> hoje Ã© cÃ³digo morto.

**`buildRecommendations(result, classification, recentHistory?): Recommendation[]`**

Gera atÃ© 3 recomendaÃ§Ãµes priorizadas com base no resultado e histÃ³rico recente:

| CondiÃ§Ã£o | RecomendaÃ§Ã£o | Prioridade |
|---|---|---|
| `unavailable` | Repetir o teste | high |
| `packetLoss` tag â€” recorrente em histÃ³rico | Acionar modo Prova Real | high |
| `packetLoss` tag â€” pontual | Repetir o teste | high |
| `unstable` tag â€” recorrente | Reiniciar roteador | medium |
| `unstable` tag â€” pontual | Comparar localizaÃ§Ã£o | medium |
| `highLatency` tag | Aproximar-se do roteador | high |
| DL baixo (slow/fair) â€” recorrente | Contatar operadora | high |
| DL baixo (slow/fair) â€” pontual | Fechar apps em segundo plano | medium |
| UL < 5 Mbps | Tentar cabo + sugestÃ£o de UL fraco | medium |

Ordenado por priority (`high â†’ medium â†’ low`). MÃ¡ximo de 3 itens retornados. "Recorrente" = â‰¥ 2 registros recentes com mesma condiÃ§Ã£o.

### 3.6.1 `diagnosisItems.ts` â€” Lista compacta `[problema] â†’ [aÃ§Ã£o]` (refator 2026-05)

UtilitÃ¡rio novo. Substitui a lÃ³gica que vivia espalhada na `DiagnosticScreen` (cards Internet/Wi-Fi/Resposta/OscilaÃ§Ã£o/Falhas) e alimenta a lista compacta do card de DiagnÃ³stico na ResultScreen.

```ts
type DiagnosisSeverity = 'fail' | 'warn';

interface DiagnosisItem {
  id: string;
  icon: string;       // nome no set de icons.tsx (bolt, wifi, ping, jitter, loss, upload)
  problem: string;    // ex.: "Wi-Fi instÃ¡vel"
  action: string;     // ex.: "Reinicie o roteador"
  severity: DiagnosisSeverity;
}

function buildDiagnosisItems(
  result: SpeedTestResult,
  connectionType: ConnectionType | null,
): DiagnosisItem[];
```

**Thresholds por mÃ©trica** (replicam os critÃ©rios da DiagnosticScreen original):

| MÃ©trica       | `null` (good) | `warn`        | `fail`        |
|---------------|---------------|---------------|---------------|
| Download      | dl â‰¥ 25       | dl â‰¥ 5        | dl < 5        |
| Upload        | ul â‰¥ 5        | ul â‰¥ 2        | ul < 2        |
| LatÃªncia      | lat â‰¤ 60      | lat â‰¤ 100     | lat > 100     |
| Jitter        | jit â‰¤ 15      | jit â‰¤ 30      | jit > 30      |
| Packet loss   | loss = 0      | loss â‰¤ 1      | loss > 1      |

Itens em `null` (good) somem da lista. Quando `connectionType === 'wifi'` e a latÃªncia dispara warn/fail, gera item especÃ­fico de "Wi-Fi instÃ¡vel" / "Wi-Fi com sinal fraco" â€” e nesse caso o item genÃ©rico de "Resposta" Ã© suprimido (evitar duplicaÃ§Ã£o pelo mesmo sintoma).

**OrdenaÃ§Ã£o.** `fail` > `warn`. Sort estÃ¡vel preserva a ordem declarativa entre itens da mesma severidade (Internet â†’ Upload â†’ Wi-Fi â†’ Resposta â†’ OscilaÃ§Ã£o â†’ Falhas).

**Caller:** `DiagnosticActionList` interno em `ResultScreen.tsx`. Mostra os 3 primeiros + "Ver mais N" inline para o resto.

**Severidade agregada** (refator 2026-05). Helper exposto pelo mesmo mÃ³dulo:

```ts
type DiagnosisAggregate = 'healthy' | 'warn' | 'fail';

function aggregateDiagnosisSeverity(items: DiagnosisItem[]): DiagnosisAggregate;
```

Regra: lista vazia â†’ `healthy`; algum `fail` â†’ `fail`; senÃ£o â†’ `warn`. NÃ£o consulta `combineDiagnostics` por design â€” o sinal vem das mÃ©tricas individuais. Usado pela ResultScreen para escolher o glow do card de DiagnÃ³stico (verde / amarelo / vermelho via `--diag-glow-color`, ver Â§6.x tokens).

### 3.7 `comparison.ts` â€” AnÃ¡lise de cobertura Wi-Fi

**`calculateComparison(near, far): ComparisonResult`**

Calcula a degradaÃ§Ã£o entre perto e longe do roteador. Avalia download **e** upload como sinais independentes de problema de cobertura:

| `diagnosis` | CondiÃ§Ã£o |
|---|---|
| `coverage_issue` (DL forte) | DL cai > 75% E near.dl â‰¥ 10 Mbps |
| `coverage_issue` (UL forte) | UL cai > 75% E near.ul â‰¥ 3 Mbps (independente de DL) |
| `coverage_issue` (moderado) | DL > 50% OU (UL > 50% E near.ul â‰¥ 3 Mbps) E near.dl â‰¥ 10 Mbps |
| `both_bad` | near e far com DL < 10 Mbps |
| `both_good` | near e far com DL â‰¥ 10 Mbps e latÃªncia aceitÃ¡vel |
| `other` | Qualquer outra combinaÃ§Ã£o |

`nearGood = near.dl >= 10 && near.latency <= 100`; `nearUploadGood = near.ul >= 3`.

Retorna percentuais de variaÃ§Ã£o de DL, UL e latÃªncia, mais mensagem interpretativa em pt-BR. Testado em `src/__tests__/compare.test.ts` (12 cenÃ¡rios).

### 3.8 `historyInsights.ts` â€” Insights de tendÃªncia histÃ³rica

**`buildHistoryInsights(records: TestRecord[]): HistoryInsight[]`**

Requer â‰¥ 3 registros. Retorna atÃ© **4** `HistoryInsight` em ordem de avaliaÃ§Ã£o (nÃ£o re-ordenados por severidade):

```ts
interface HistoryInsight {
  id: string
  type: 'trend' | 'drop' | 'improvement' | 'recurring_issue' | 'stable_period' | 'info'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
}
```

AnÃ¡lises realizadas (em ordem de avaliaÃ§Ã£o):

| Id | CondiÃ§Ã£o | Severidade |
|---|---|---|
| `dl_drop_trend` | DL nova metade < DL metade antiga em > 20% (com â‰¥ 6 registros) | warning (>40% â†’ critical) |
| `dl_improvement` | DL nova metade > DL metade antiga em > 20% (com â‰¥ 6 registros) | info |
| `recurring_latency` | â‰¥ 3 dos Ãºltimos 5 com latÃªncia > 80 ms | warning (â‰¥4 â†’ critical) |
| `recurring_loss` | â‰¥ 3 dos Ãºltimos 5 com packetLoss > 2% | critical |
| `low_upload` | MÃ©dia de UL dos Ãºltimos 5 < 5 Mbps | warning |
| `stable_period` | â‰¥ 4 dos Ãºltimos 5 com jitter â‰¤ 15 ms E loss â‰¤ 1% (apenas se nenhum outro insight gerado) | info |
| `ul_drop` | UL recente < 70% da mÃ©dia histÃ³rica (com â‰¥ 6 registros, sem `low_upload`) | warning |
| `week_drop` | DL desta semana < DL da semana anterior em > 20% (â‰¥ 2 registros em cada janela, sem outro `drop`) | warning (>40% â†’ critical) |
| `week_improvement` | DL desta semana > DL da semana anterior em > 20% (sem outro `improvement`) | info |
| `peak_hour` | DL do pior perÃ­odo do dia < DL do melhor em > 30% (â‰¥ 2 registros por perÃ­odo, â‰¥ 6 total) | warning (>50% â†’ critical) |

**PerÃ­odos do dia para anÃ¡lise de horÃ¡rio de pico:** madrugada (0â€“6h), manhÃ£ (6â€“12h), tarde (12â€“18h), noite (18â€“24h). Baseado em `new Date(record.timestamp).getHours()`.

### 3.9 `beforeAfter.ts` â€” ComparaÃ§Ã£o antes/depois

**`calculateBeforeAfter(before, after): BeforeAfterResult`**

```ts
type BeforeAfterVerdict = 'improved' | 'no_change' | 'worse'

interface BeforeAfterResult {
  verdict: BeforeAfterVerdict
  message: string                  // texto explicativo em pt-BR
  dlDeltaPercent: number           // (after.dl âˆ’ before.dl) / before.dl Ã— 100
  ulDeltaPercent: number
  latencyDeltaPercent: number      // (before.latency âˆ’ after.latency) / before.latency Ã— 100 (positivo = melhora)
}
```

Regras de veredicto:

| CondiÃ§Ã£o | Verdict |
|---|---|
| `dlDeltaPercent > 15` OU `latencyDeltaPercent > 20` | `'improved'` |
| `dlDeltaPercent < -15` OU `latencyDeltaPercent < -20` | `'worse'` |
| Nenhum dos acima | `'no_change'` |

### 3.10 `provaReal.ts` â€” MÃ©dia de mÃºltiplos testes

**`averageSpeedResults(results: SpeedTestResult[]): SpeedTestResult`**

Calcula a mÃ©dia aritmÃ©tica de `dl`, `ul`, `latency`, `jitter` e `packetLoss` sobre N resultados. O `timestamp` do resultado mÃ©dio Ã© o do Ãºltimo teste. LanÃ§a erro se `results` for vazio. Usado pela Prova Real para produzir um resultado consolidado de 3 mediÃ§Ãµes consecutivas.

### 3.11 `dnsBenchmark.ts` â€” Benchmark de servidores DNS

Mede a latÃªncia de 5 servidores DNS via DNS over HTTPS (DoH) e escolhe o mais rÃ¡pido.

**Servidores testados:** Cloudflare (1.1.1.1), Google (8.8.8.8), AdGuard (94.140.14.14), Quad9 (9.9.9.9), OpenDNS (208.67.222.222)

**DomÃ­nios de teste:** google.com, youtube.com, facebook.com, amazon.com.br, netflix.com

**ParÃ¢metros:** `WARMUP_ROUNDS = 2`, `MEASURE_ROUNDS = 2` por domÃ­nio, `QUERY_TIMEOUT_MS = 5000`, `MIN_SERVER_PACING = 1500 ms`

```ts
runDNSBenchmark(signal: AbortSignal, onProgress?): Promise<DnsBenchmarkResult>
loadLastDnsResult(): DnsBenchmarkResult | null  // lÃª localStorage 'linka.dns.result.v1'
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

**Grades:** A (â‰¤15 ms), B (â‰¤30 ms), C (â‰¤50 ms), D (>50 ms)

**Vencedor:** servidor com menor p50 entre os que tÃªm `samples > 0`. Resultado salvo em `localStorage` na chave `linka.dns.result.v1`.

**`chooseDnsRecommendation` (Bug-1 fix 2026-05):** decide se vale trocar de DNS comparando `currentLatencyMs` (vem de `result.dnsLatencyMs`) com o servidor de menor p50 do benchmark. Sem latÃªncia atual ou sem amostras vÃ¡lidas â†’ `no_data`. Caso contrÃ¡rio, recomenda `switch` **somente se** `deltaMs â‰¥ 20 ms` **E** `deltaPct â‰¥ 30 %` â€” ambos os cortes sÃ£o necessÃ¡rios para evitar duas classes de falsos positivos:

- **AND â‰¥ 20 ms:** corta ganhos absolutos imperceptÃ­veis (ex.: trocar 5 ms por 3 ms = 40 % de ganho relativo, mas 2 ms Ã© ruÃ­do de jitter mÃ³vel â€” usuÃ¡rio nÃ£o sente).
- **AND â‰¥ 30 %:** corta ganhos relativos pequenos (ex.: trocar 200 ms por 175 ms = 25 ms absolutos, mas sÃ³ 12,5 % â€” nÃ£o muda a percepÃ§Ã£o; provÃ¡vel outlier do benchmark).

Falhando qualquer um, devolve `already_good` (mantÃ©m o `fastest` para a UI mostrar como referÃªncia opcional). A UI do `DNSGuideSheet` consome o discriminated union direto: `switch` â†’ hero comparativo + chip `âˆ’Xms Â· âˆ’Y%` + "Copiar IPs"; `already_good` â†’ card Ãºnico centralizado + CTA sÃ³ "Fechar"; `no_data` â†’ hero com "â€”" + "Medindoâ€¦".

**IntegraÃ§Ã£o:** DNS nÃ£o faz parte do fluxo de speed test. Ã‰ invocado on-demand pelo accordion "DNS" da `ResultScreen` (Mais detalhes) â€” disparado **uma Ãºnica vez** na primeira `open` do accordion via prop `onToggle` do `<Accordion>`. Resultado fica em memÃ³ria local do `<DnsAccordionBody>`; opens subsequentes reaproveitam sem refazer o teste. Timeout por servidor: 5 s; total ~5-15 s. Falha em um servidor (CORS estrito Safari, timeout, offline) renderiza `samples=0` e a tabela mostra "â€”" sem quebrar o resto. Status legado: a `DNSBenchmarkScreen` original foi removida no refator de arquitetura 2026-05; a funÃ§Ã£o Ã© o Ãºnico caller atual.

**UI no accordion DNS:** linha por servidor com nome + chips ("Em uso" para o provider atual; "Mais rÃ¡pido" para o vencedor â€” podem coexistir) + latÃªncia p50 + delta vs "em uso" (`Â±X ms`, verde se mais rÃ¡pido / vermelho se mais lento). Linhas ordenadas por `samples > 0` desc â†’ `p50` asc; falhas no fim da lista com opacidade reduzida. Estado de carregamento: "Testando N de 5 Â· <nome>" derivado do callback `onProgress` do `runDNSBenchmark`.

### 3.11.1 `dnsTiming.ts` â€” Fallback de latÃªncia DNS via Resource Timing (Fase A 2026-05)

Captura passiva da latÃªncia da primeira resoluÃ§Ã£o DNS observada durante o speed test. NÃ£o inicia novos requests â€” sÃ³ lÃª os `PerformanceResourceTiming` que o navegador jÃ¡ emitiu.

```ts
type DnsLatencyGrade = 'excellent' | 'good' | 'fair' | 'slow' | 'poor';

getDnsLatencyMs(): number | null
classifyDnsLatency(ms: number | null): DnsLatencyGrade | null
dnsLatencyLabel(grade: DnsLatencyGrade): string  // pt-BR
```

**HeurÃ­stica de coleta:** filtra entries com `domainLookupEnd > domainLookupStart` E delta > 1ms (descarta cache hit zerado e ruÃ­do de timer); pega a primeira entry vÃ¡lida â€” costuma ser a primeira request da sessÃ£o. Quando todas as entries tÃªm timing zerado (cache total ou bloqueio CORS sem `Timing-Allow-Origin: *`), retorna `null`.

**Faixas de classificaÃ§Ã£o:** <20ms excellent Â· <50ms good Â· <100ms fair Â· <300ms slow Â· â‰¥300ms poor.

**Status (2026-05, fix Safari):** `getDnsLatencyMs` deixou de ser a fonte primÃ¡ria da latÃªncia DNS â€” passou a **fallback** secundÃ¡rio. RazÃ£o: Safari mobile zera os campos DNS de Resource Timing para recursos cross-origin sem header `Timing-Allow-Origin: *` (cenÃ¡rio dos endpoints Cloudflare Speed Test), tornando essa estratÃ©gia inviÃ¡vel no iOS. A mediÃ§Ã£o primÃ¡ria agora vem de `probeDnsResolver()` em `dnsProbe.ts` (mediÃ§Ã£o direta via `performance.now()`). Esta funÃ§Ã£o permanece exportada e Ã© chamada no orchestrator quando o probe DoH retorna `latencyMs === null`.

**`classifyDnsLatency` / `dnsLatencyLabel`** continuam sendo as funÃ§Ãµes pÃºblicas usadas pela UI para classificar e rotular a latÃªncia (independente da fonte).

### 3.11.2 `dnsProbe.ts` â€” IdentificaÃ§Ã£o do resolver E latÃªncia DNS (Fase B 2026-05; refator Safari 2026-05)

Pergunta ao endpoint DoH `whoami.cloudflare.com` (via `https://cloudflare-dns.com/dns-query`) qual resolver serviu a query e mede o roundtrip do prÃ³prio fetch via `performance.now()`. Devolve latÃªncia, IP do resolver e provider mapeado em uma Ãºnica chamada.

**Bug-3 fix 2026-05 (DNS nÃ£o identificado):** a URL anterior `whoami.cloudflare-dns.com` nÃ£o existe e retornava NXDOMAIN, causando "NÃ£o identificado" em produÃ§Ã£o. A correÃ§Ã£o (a) aponta para `whoami.cloudflare.com` (domÃ­nio vÃ¡lido) e (b) adapta o parsing para a nova resposta TXT â€” agora Cloudflare retorna mÃºltiplos registros (asn, country_code, remote_ip) e o code extrai apenas o `remote_ip`.

```ts
type DnsProbeResult = {
  latencyMs:  number | null;
  resolverIp: string | null;
  provider:   string | null;
};

probeDnsResolver(signal?: AbortSignal): Promise<DnsProbeResult>  // nunca lanÃ§a
identifyDnsProvider(ip: string): string  // 'Cloudflare' | 'Google' | â€¦ | 'DNS do provedor'
```

**Por que medir latÃªncia aqui (e nÃ£o via Resource Timing):** Safari mobile zera `domainLookupStart/End` para cross-origin sem `Timing-Allow-Origin: *`. A leitura passiva via `PerformanceResourceTiming` retorna `null` quase sempre no iOS, deixando a 4Âª cell DNS da ResultScreen vazia. Medindo diretamente `performance.now()` em volta do fetch, o nÃºmero resultante inclui DNS-do-sistema + TLS + RTT HTTP â€” nÃ£o Ã© DNS puro, mas Ã© uma proxy honesta da latÃªncia percebida pelo usuÃ¡rio e funciona em todos os browsers, incluindo iOS Safari.

**Mapeamento IP â†’ provedor:** array de RegExps cobrindo Cloudflare (1.1.1.0/1, 1.0.0.0/1), Google (8.8.8.8, 8.8.4.4), Quad9 (9.9.9.x, 149.112.112.x), OpenDNS (208.67.220/222.220/222), AdGuard (94.140.14.x, 94.140.15.x), Yandex (77.88.8.1/8). IPs nÃ£o mapeados retornam `'DNS do provedor'` â€” heurÃ­stica de "provavelmente resolver default da operadora".

**TolerÃ¢ncia a falha:** offline, CORS, timeout, JSON invÃ¡lido â€” todos retornam `{ latencyMs: null, resolverIp: null, provider: null }`. O speedtest **nÃ£o** falha quando o probe falha. Falhas (exceto `AbortError`) sÃ£o logadas em `console.warn('[dnsProbe] â€¦')` para auxiliar debug em campo via DevTools mobile. Quando o fetch tem sucesso mas o parse do JSON falha, `latencyMs` Ã© preservado (a mediÃ§Ã£o valeu) e os outros campos viram `null`.

**IntegraÃ§Ã£o:** chamado em `speedTestOrchestrator.ts` no inÃ­cio da fase upload (paralelo ao `runUploadProbe`). O `await dnsProbePromise` acontece apÃ³s o tÃ©rmino do upload â€” qualquer atraso Ã© coberto pela duraÃ§Ã£o do prÃ³prio upload. Se `result.latencyMs === null`, o orchestrator tenta `getDnsLatencyMs()` (Resource Timing) como fallback secundÃ¡rio.

**Reuso em `dnsBenchmark.ts`:** a funÃ§Ã£o `probeDnsLatency()` (que mede o "DNS atual" no benchmark on-demand da `DNSBenchmarkScreen`) tambÃ©m delega ao `probeDnsResolver` desde 2026-05, eliminando uma duplicaÃ§Ã£o de estratÃ©gia e o problema Safari naquela tela.

### 3.12 `shareCard.ts` â€” GeraÃ§Ã£o de card de compartilhamento

**`generateShareCard(result, quality, unit?, options?): Promise<Blob>`**

```ts
interface ShareCardOptions {
  headline?: string;     // tÃ­tulo qualitativo (resolveCopy(copyKeys.headlineKey))
  isp?: string | null;   // operadora detectada (server.isp); 'â€”' Ã© tratado como null
}
```

Gera PNG **1080Ã—1080 (quadrado)** via Canvas API. Refatorado no Bloco 3 (Polimento, 2026-05) para destacar a headline e os 4 nÃºmeros.

Layout:
- Topo: barra accent 8px + logo "linka SpeedTest"
- Headline qualitativa em Geist 700/64px, com word-wrap em 2 linhas (largura mÃ¡x. 920px)
- Grid 2Ã—2 de cards de mÃ©trica (DL azul, UL verde, Resposta/OscilaÃ§Ã£o em texto neutro), cada card com label + valor 84px Geist 700 + unidade
- RodapÃ©: ISP + timestamp Ã  esquerda, "linka.app" em accent Ã  direita

Por que Canvas API (e nÃ£o html2canvas): independe de DOM montado, mais previsÃ­vel com fontes web (`document.fonts.ready`), e o utilitÃ¡rio prÃ©-existia. html2canvas sÃ³ faria sentido se quisÃ©ssemos espelhar o DOM exato â€” o que aumenta variabilidade entre browsers.

Aguarda `document.fonts.ready` antes de desenhar. Retorna `Blob` com `type: 'image/png'`. ResultScreen consome em 3 contextos: WhatsApp button (com fallback `wa.me` texto), botÃ£o "Compartilhar imagem" (Web Share API com fallback download via `URL.createObjectURL`), HamburgerMenu â†’ onShare.

### 3.12.1 `haptics.ts` â€” VibraÃ§Ã£o tÃ¡til (Bloco 3 Polimento, 2026-05)

**`triggerHaptic(pattern: HapticPattern, enabled: boolean): void`**

```ts
type HapticPattern = 'phaseChange' | 'success' | 'error';
```

Wrapper sobre `navigator.vibrate(...)`. Web standard â€” Capacitor traduz automaticamente para haptics nativos no Android. iOS Safari/PWA ignora silenciosamente (sem equivalente pÃºblico). Falha silenciosa em todos os caminhos: nunca lanÃ§a.

PadrÃµes internos:
- `phaseChange` â†’ `30` (ms) â€” entre fases ativas (ex.: download â†’ upload)
- `success` â†’ `50` (ms) â€” conclusÃ£o do teste (`phase === 'done'`)
- `error` â†’ `[100, 50, 100]` â€” erro (`phase === 'error'`)

Quando `enabled` Ã© `false`, retorna sem chamar a API (curto-circuito antes de qualquer side effect). Consumido pelo `RunningScreen` via `useEffect` que monitora mudanÃ§a de `phase`. A flag `enabled` vem de `useSettings().settings.useHaptics` propagado por `App.tsx` â†’ `RunningScreen` (prop `useHaptics`).

`latency` (primeira fase) **nÃ£o dispara** vibraÃ§Ã£o para nÃ£o competir com o tap do botÃ£o "Iniciar".

### 3.13 `combinedDiagnosis.ts` â€” DiagnÃ³stico combinado

FunÃ§Ã£o pura que cruza `SpeedTestResult` com dados opcionais de sinal Wi-Fi ou rede mÃ³vel para produzir um diagnÃ³stico Ãºnico em linguagem leiga.

```ts
combineDiagnostics(input: CombineDiagnosticsInput): CombinedDiagnosis
```

**Limiar `speedBad`:** `dl < 50 OR ul < 10 OR latency > 80 OR jitter > 30 OR packetLoss > 2 OR bufferbloatDeltaMs > 100`

**Fluxos de decisÃ£o:**

| `connectionType` | Dados | Causa | ConfianÃ§a |
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

No PWA, `wifi` e `mobile` sÃ£o sempre `undefined` â€” a funÃ§Ã£o degrada graciosamente. Os tipos `WifiDiagnosticResult` e `MobileDiagnosticResult` sÃ£o o contrato para integraÃ§Ã£o nativa futura.

---

### 3.12 `format.ts` â€” FormataÃ§Ã£o

```ts
formatMbps(v: number, unit?: 'mbps'|'gbps'): string  // divide por 1000 se gbps
formatMs(v: number): string    // arredonda para inteiro
formatDate(ts: number): string // dd/MM/yyyy HH:mm
formatDateIsoLike(ts: number): string // YYYY-MM-DD para nome de arquivo
```

### 3.13.1 `appRefresh.ts` â€” Orquestrador do pull-to-refresh (2026-05)

```ts
performAppRefresh(opts: { reloadDeviceInfo: () => Promise<void> | void }): Promise<void>
```

Executado pelo gesto pull-to-refresh nas telas `StartScreen` e `HistoryScreen`. EstratÃ©gia em duas tentativas, na ordem:

1. **Service Worker update.** Pega `navigator.serviceWorker.getRegistration()`, chama `registration.update()` para forÃ§ar re-check de `/sw.js`. Se houver `registration.waiting` (nova versÃ£o jÃ¡ baixada), envia `postMessage({ type: 'SKIP_WAITING' })`, aguarda `controllerchange` (com timeout failsafe de 1.2s) e dispara `window.location.reload()`. Se reload acontece, a funÃ§Ã£o nem chega ao fim.
2. **Reload deviceInfo.** Se o passo 1 nÃ£o rodou (sem registration, sem versÃ£o pendente, ou Capacitor APK), chama `reloadDeviceInfo()` â€” geralmente `useDeviceInfo.reload`, que bumpa o `reloadKey` e dispara re-fetch do trace Cloudflare (IP/colo/ISP) + re-execuÃ§Ã£o do effect Capacitor (`getLocalWifiRawInfoFromBridge`).

**Min duration de 600ms.** O spinner muito rÃ¡pido fica feio ("piscou e sumiu"). A funÃ§Ã£o aguarda `MIN_DURATION_MS - elapsed` antes de resolver. Gera feedback visual sÃ³lido mesmo quando o refresh Ã© cache-hit instantÃ¢neo.

**Nunca lanÃ§a.** Pull-to-refresh Ã© UX, nÃ£o lÃ³gica de negÃ³cio. Erros do SW (offline, transient) e do `reloadDeviceInfo` sÃ£o engolidos â€” o spinner some e o usuÃ¡rio pode tentar de novo.

### 3.14 `relativeTime.ts` â€” Tempo relativo pt-BR (pacote premium 2026-05)

```ts
formatRelativeTime(timestamp: number, now?: number): string
// "agora" | "hÃ¡ N min" | "hÃ¡ N h" | "hÃ¡ N d" | "hÃ¡ N sem"
```

Pura, sem libs (sem `Intl.RelativeTimeFormat` para garantir consistÃªncia de
output entre browsers/Android WebView). Janelas: `< 60s â†’ "agora"`, `< 1h â†’
"hÃ¡ N min"`, `< 24h â†’ "hÃ¡ N h"`, `< 7d â†’ "hÃ¡ N d"`, `â‰¥ 7d â†’ "hÃ¡ N sem"`.
Timestamps invÃ¡lidos (NaN, â‰¤ 0) e futuros (skew de relÃ³gio) viram `''`/
`"agora"` respectivamente â€” guarda contra `hÃ¡ -2 min`.

Consumida pelo banner de contexto da `ResultScreen` (linha discreta entre
Large Title e bloco PRIMARY: `server Â· loc Â· isp Â· hÃ¡ N min`).

### 3.14.1 `anatelColor.ts` â€” cores semÃ¢nticas Anatel (2026-05)

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
**ResoluÃ§Ã£o Anatel nÂº 717/2019** (RQUAL â€” Regulamento de Qualidade dos
ServiÃ§os de TelecomunicaÃ§Ãµes):

| Perfil | `good` (verde) | `warn` (amarelo) | `bad` (vermelho) |
|---|---|---|---|
| `fixed_broadband` | â‰¥ 80% | 40 â‰¤ x < 80% | < 40% |
| `mobile_broadband` | â‰¥ 60% | 20 â‰¤ x < 60% | < 20% |

A meta da fixa (80%) corresponde ao limite mensal do RQUAL para velocidade
instantÃ¢nea contratada; o piso de 40% Ã© o ponto onde a entrega passa a ser
considerada inaceitÃ¡vel. Para mÃ³vel, os patamares sÃ£o deflacionados (60% /
20%) refletindo a tolerÃ¢ncia regulatÃ³ria maior para conexÃµes celulares.

**Fronteiras inclusivas no limite superior** (`pct >= 80` Ã© `good`, `pct >= 40` Ã© `warn`). Sem cap em 100% â€” overdelivery (rajada > plano) cai naturalmente em `good`.

**Retorna `null`** quando:

- `contractedMbps` Ã© `null`, `undefined`, `0` ou negativo (plano nÃ£o cadastrado / invÃ¡lido);
- `deliveredMbps` Ã© `0`, negativo, `Infinity` ou `NaN`.

A UI deve interpretar `null` como "voltar ao comportamento neutro" â€” no caso da `ResultScreen`, isso significa preservar `var(--dl)` / `var(--ul)` (azul/verde de marca) e o glow padrÃ£o `--dl-glow` / `--ul-glow`.

**Consumo (Ãºnico hoje):** `ResultScreen.tsx`, bloco PRIMARY. Quando o usuÃ¡rio cadastrou velocidade contratada via `HamburgerMenu â†’ Plano`, cada cell de Download/Upload computa `anatelGrade(result.dl|ul, contractedDown|Up, profile)` e, quando o resultado Ã© nÃ£o-nulo, aplica:

- `style.color = anatelGradeColorVar(grade)` no `.lk-result__primary-cell-value` (substitui `var(--dl)` / `var(--ul)`);
- `style['--cell-glow'] = anatelGradeGlowVar(grade)` no mesmo elemento â€” a regra CSS do glow lÃª `var(--cell-glow, var(--dl-glow))` (fallback no token de marca quando a custom property nÃ£o foi setada);
- `style.color = anatelGradeColorVar(grade)` no `.lk-result__primary-cell-plan-pct` (apenas o `97%` ganha a cor; a fraÃ§Ã£o `/ 600 Mbps` permanece neutra).

`profile` chega no ResultScreen via `toConnectionProfile(connectionType ?? undefined)` â€” mesma derivaÃ§Ã£o jÃ¡ consumida pelo motor de interpretaÃ§Ã£o. Quando `connectionType` Ã© `undefined` (caso "NÃ£o identificada" do iOS Safari sem `navigator.connection`), o default conservador `fixed_broadband` se aplica.

**SupressÃ£o em mobile_broadband (Bug-fix 2026-05):** a `ResultScreen` forÃ§a `dlAnatel = ulAnatel = null` quando `profile === 'mobile_broadband'`, mesmo que o usuÃ¡rio tenha cadastrado plano. RazÃ£o: a noÃ§Ã£o regulatÃ³ria de "velocidade contratada" Ã© diferente em banda larga mÃ³vel â€” planos celulares vendem cota de dados, nÃ£o taxa garantida em Mbps. A funÃ§Ã£o `anatelGrade()` continua funcional para mÃ³vel (60/20%) â€” esta Ã© uma decisÃ£o de **renderizaÃ§Ã£o**, nÃ£o do modelo. As cores revertem para `--dl` / `--ul` de marca e a linha `/ X Mbps Â· Y%` Ã© suprimida (volta a aparecer "Mbps" como unidade). Em paralelo, o `HamburgerMenu` jÃ¡ oculta os campos de plano contratado quando `connectionType === 'mobile'` (prop `showContracted`).

NÃ£o cria tokens novos â€” reusa `--success` / `--warn` / `--error` (cores) e `--success-glow` / `--warn-glow` / `--error-glow` (glows), todos jÃ¡ existentes em `tokens.css` (criados pelo card de DiagnÃ³stico).

Ver: `src/utils/anatelColor.ts` + `src/__tests__/anatelColor.test.ts`.

### 3.14.2 `historyTrends.ts` â€” ComparaÃ§Ã£o inteligente entre testes (2026-05)

```ts
interface TrendComparison {
  current:  { dlAvg: number; ulAvg: number; latencyAvg: number; testCount: number };
  previous: { dlAvg: number; ulAvg: number; latencyAvg: number; testCount: number };
  dlChangePct: number;        // positivo = melhorou (DL/UL)
  ulChangePct: number;
  latencyChangePct: number;   // positivo = piorou (latÃªncia maior)
  windowLabel: string;        // "essa semana" | "esse mÃªs"
}

computeWeeklyTrend(records: TestRecord[], now?): TrendComparison | null
computeMonthlyTrend(records: TestRecord[], now?): TrendComparison | null

describeTrend(trend): {
  headline: string;     // "Sua mÃ©dia essa semana Ã© 580 Mbps"
  comparison: string;   // "â–¼ 12% pior que a semana passada."
  severity: 'good' | 'neutral' | 'bad';
}

isTrendSignificant(trend): boolean   // true quando algum delta >= 10%
```

Particiona o histÃ³rico em duas janelas adjacentes (atual: Ãºltimos N dias; anterior: N-2N dias atrÃ¡s) e calcula delta percentual de DL/UL/latÃªncia. MÃ­nimo de 5 testes em cada janela; abaixo disso retorna `null`. ConvenÃ§Ã£o de sinais: positivo = melhorou (DL/UL); positivo na latÃªncia = piorou. `describeTrend()` inverte o sinal da latÃªncia na exibiÃ§Ã£o para que `â–¼` sempre signifique "piora" do ponto de vista do usuÃ¡rio.

Thresholds:
- `>= 10%` (`SIGNIFICANT_PCT`) â€” variaÃ§Ã£o suficiente para renderizar o card.
- `>= 20%` (`SEVERE_PCT`) â€” adjetivo "bem melhor" / "bem pior" (em vez de "melhor" / "pior" simples).

**Consumo:** `HistoryScreen` chama `computeWeeklyTrend(items)` e cai para `computeMonthlyTrend(items)` quando a janela semanal nÃ£o tem amostras significativas. Se nenhuma das duas Ã© significativa, o card nÃ£o aparece. O delta entra como border-left colorido pelo `severity` (`good`/`bad`/`neutral`) â€” sem box-shadow.

Testes: `src/__tests__/historyTrends.test.ts` cobre janelas insuficientes, mudanÃ§as positivas/negativas/zero, severidade, narrativa por DL e por latÃªncia, formataÃ§Ã£o Mbpsâ†’Gbps.

### 3.14.3 `anatelReport.ts` â€” RelatÃ³rio de denÃºncia Anatel (2026-05)

```ts
interface AnatelComplaintData {
  contractedDownMbps: number;
  contractedUpMbps:   number;
  testRecords:        TestRecord[];   // janela analisada
  belowThresholdCount: number;        // < 80% do plano
  belowCriticalCount:  number;        // < 40% do plano
  averageDeliveredPct: number;        // % mÃ©dia entregue
  windowDays:          number;        // 30 (default)
}

isAnatelComplaintEligible(records, contractedDl, contractedUl, now?): AnatelComplaintData | null
generateAnatelReport(data, isp): Promise<void>   // dispara download de PDF A4
```

`isAnatelComplaintEligible` retorna `null` (nÃ£o hÃ¡ reclamaÃ§Ã£o) quando:

- plano nÃ£o cadastrado (`contractedDl <= 0`);
- menos de 5 testes nos Ãºltimos 30 dias;
- entrega mÃ©dia â‰¥ 80% (ResoluÃ§Ã£o Anatel 717/2019 â€” limite para banda larga fixa).

Caso contrÃ¡rio retorna o snapshot de evidÃªncias. `HistoryScreen` consome o snapshot para renderizar o card "Anatel â€” entrega abaixo do contratado" (Ã­cone de escudo `--warn`, descriÃ§Ã£o com a % mÃ©dia + contagem de testes, CTA "Gerar relatÃ³rio"). O card Ã© suprimido em planos mÃ³veis (`dominantProfile(items) === 'mobile_broadband'`) â€” a ResoluÃ§Ã£o 717/2019 trata banda larga fixa de modo distinto.

`generateAnatelReport` produz PDF A4 retrato via `jsPDF` + `html2canvas` (mesma infra de `pdfExport.ts`):

1. Header com logo `linka` + tÃ­tulo + linha "ResoluÃ§Ã£o Anatel 717/2019".
2. IdentificaÃ§Ã£o: provedor (ISP dominante), plano contratado, perÃ­odo avaliado, nÃºmero de mediÃ§Ãµes.
3. Headline com border-left `--error`: "Entrega mÃ©dia: X% do plano contratado" + parÃ¡grafo legal.
4. EstatÃ­sticas 4-col: mÃ©dia/mediana de DL e UL.
5. Tabela cronolÃ³gica: cada teste com data, DL, UL, latÃªncia e % do plano (cor do % por threshold: vermelho `< 40%`, amarelo `< 80%`, verde `â‰¥ 80%`).
6. RodapÃ© com instruÃ§Ãµes de uso (operadora + Procon + Anatel) + ressalva de "nÃ£o substitui aferiÃ§Ã£o EAQ".

O PDF respeita multi-pÃ¡gina (loop com `addPage` quando o canvas excede a altura A4). Nome do arquivo: `linka-anatel-YYYY-MM-DD.pdf`.

NÃ£o usa libs novas â€” reusa `jspdf`, `html2canvas` e `format.ts`.

---

## 3.10 Motor unificado (`src/core/`)

Camada introduzida na Fase 1 do plano de unificaÃ§Ã£o (PWA + linka Flutter). Pura, sem dependÃªncia de React, DOM, navegador ou localStorage.

**Estado atual (Fase 6 concluÃ­da â€” migraÃ§Ã£o completa):** `ResultScreen`, `HistoryScreen` e `pdfExport.ts` usam exclusivamente `interpretSpeedTestResult()` + `resolveCopy()`. O `classifier.ts` legado foi podado â€” mantÃ©m sÃ³ `RULE_SET_VERSION` e `classify()` (ainda necessÃ¡rio para `TestRecord.quality` e bridge de recomendaÃ§Ãµes). `ResultScreen` deriva o `ConnectionProfile` a partir do `connectionType`; `HistoryScreen` usa o perfil dominante da amostra analisada.

**DispersÃ£o histÃ³rica no resumo:** O card "MÃ©dia dos seus testes" da HistoryScreen usa `syntheticLoss` (% de testes slow/unavailable nos Ãºltimos 5) como proxy de instabilidade temporal â€” evita que histÃ³ricos alternando excelente/pÃ©ssimo apareÃ§am como "bons". Quando `stability.level === 'unstable' | 'oscillating'`, exibe o rÃ³tulo de estabilidade em vez do headline de quality.

**Copy (Fase 5):** `<dt>Perda de pacotes</dt>` substituÃ­do por `<dt>Perda de sinal</dt>` em ResultScreen e HistoryScreen â€” alinhado com o chip tag `flag.packetLoss`. Grep por "Perda de pacotes", "Jitter", "pacotes" em `src/screens/` retorna zero.

**Fase 6 (legado removido):** `pdfExport.ts` migrado para `interpretSpeedTestResult()` + `resolveCopy()` â€” sem mais imports de `classifier.ts`. `useUnifiedEngine` removido de `useSettings`. `LiveChart.tsx` foi deletado nesta fase e **re-introduzido** no Bloco Motion (2026-05) como mini-grÃ¡fico SVG inline (sem libs).

**Polimento UX 2026-05 (Top 5 quick wins):** PadronizaÃ§Ã£o de vocabulÃ¡rio consumido pelas telas via `resolveCopy`. Chaves novas adicionadas ao `copyDictionary.ts`:

- `metric.packetLoss` (`Falhas`) e `metric.packetLoss.long` (`Falhas na conexÃ£o`) â€” substituem "Perda" / "Perda de pacotes" em HistoryScreen, `flag.packetLoss`, `diagnosis.packetLoss`, `diagnosis.history.loss`, `historyInsights.recurring_loss` e `recommendations.repeat_loss`.
- `metric.latency` (`Resposta`), `metric.latency.short` (`RESP`), `metric.latency.loaded` (`Resposta com a rede ocupada`) e `metric.latency.loadedValue` (`Resposta com trÃ¡fego`) â€” substituem `PING`/`LAT` no RunningScreen e `LatÃªncia sob carga`/`LatÃªncia carregada` no DetailsScreen.
- `useCase.<id>.label` / `.label.short` e `useCase.status.<good|maybe|limited>` / `.short` â€” versÃ£o Ãºnica dos nomes de use cases (longo p/ recomendaÃ§Ãµes, curto p/ chip apertado). Eliminam duplicaÃ§Ã£o local em `ResultScreen.ucLabel` e `recommendations.derivePositiveUsecases`.
- `theme.light` / `theme.dark` (`Claro` / `Escuro`) â€” usados pelo StartScreen.

ResultScreen ganhou um bloco de headline qualitativa no topo do scroll: chip de variant cor por `quality` + tÃ­tulo (`copyKeys.headlineKey`) + subtÃ­tulo (`copyKeys.shortPhraseKey`). Ã‰ a Ãºnica peÃ§a que consome diretamente os copy keys do motor â€” o resto da tela ainda usa thresholds locais e serÃ¡ migrado em fase posterior. Layout dos blocos abaixo intacto.

**Bloco 2 â€” Hero confiante (2026-05):** o `lk-result__headline` (texto solto sem fundo) foi promovido a `lk-result__hero` â€” superfÃ­cie destacada com `var(--surface)` + `var(--border)` + `var(--radius-lg)` e padding 18px. O tÃ­tulo migrou para 26px / weight 700 (antes 22px / weight 600), `font-display`, `letter-spacing: -0.01em`. A linha superior (`lk-result__hero-row`) coloca tÃ­tulo Ã  esquerda (`flex: 1`) e o `Chip` de estabilidade Ã  direita; o subtÃ­tulo fica abaixo. Tipografia dos 4 nÃºmeros do grid (`lk-result__metric-val--lg/--md`) tambÃ©m migrou: de `var(--font-mono)` weight 600 â†’ `var(--font-display)` weight 700, com tamanho subindo de 26â†’28px (lg) e 20â†’22px (md). `useCountUp` continua animando os mesmos targets.

**Refactor visual ResultScreen (2026-05):** revisÃ£o de hierarquia. MudanÃ§as principais:

- **Hero card removido.** As regras `.lk-result__hero*` e `.lk-result__headline-*` saÃ­ram do CSS e do JSX. O motor (`interpret.ts`) continua produzindo `copyKeys.headlineKey` e `shortPhraseKey` â€” sÃ³ nÃ£o sÃ£o mais consumidos pela tela (a headline qualitativa segue sendo usada na composiÃ§Ã£o do `shareCard`). TopBar agora exibe `title="Ãšltimo teste"` quando `scrolled`, ocupando o papel de identificador da tela.
- **Large Title pattern (frente B 2026-05).** O sentinel virou o prÃ³prio `<PageHeader ref={sentinelRef} size="md" title="Ãšltimo teste">` no inÃ­cio do scroll content â€” mesmo padrÃ£o de Explore/History/Diagnostic. Substitui a iteraÃ§Ã£o anterior, que usava um `<div className="lk-result__sentinel" aria-hidden />` 1Ã—1 invisÃ­vel absolute. O `.lk-result__scroll` voltou a ter `padding-top: 0` (o `PageHeader` compensa a altura do TopBar internamente) e perdeu o `position: relative` que servia ao sentinel absolute. Resultado: na abertura, TopBar transparente e tÃ­tulo grande no scroll; ao rolar, glass + tÃ­tulo pequeno â€” igual Ã s demais telas.
- **MÃ©tricas em dois blocos com pesos distintos.** O grid 2Ã—2 antigo foi substituÃ­do por `lk-result__primary-block` (DOWNLOAD + UPLOAD em 52px mobile / 64px desktop, font-display 700, cor por mÃ©trica via `var(--dl)` / `var(--ul)`) e `lk-result__secondary-block` (RESPOSTA + OSCILAÃ‡ÃƒO + FALHAS). **Reajuste 2026-05 (frente A):** o secondary-block recebeu nova proporÃ§Ã£o visual igualada Ã  linha de use cases â€” `secondary-cell-value` 14px mobile / 15px desktop, peso 500, cor `var(--text-2)`; `secondary-cell-label` 9px peso 600 uppercase letter-spacing 0.08em (idÃªntico ao label dos use cases); `secondary-cell-unit` 10px. O bloco Ã© "info de rodapÃ© compacta", nÃ£o compete mais com o primary. PadronizaÃ§Ã£o Polimento UX: `packetLoss` aparece como **"Falhas"** (curto). Todos os nÃºmeros usam `font-variant-numeric: tabular-nums` para evitar tremor durante `useCountUp`. Os badges A-F por mÃ©trica saÃ­ram â€” as grades agora vivem nos use cases.
- **Grades A-F nos use cases.** Cada item de `lk-result__use-row` ganhou um chip `<grade> Â· <label>` (ex.: `B Â· Bom`) no lugar do antigo `OK / AtenÃ§Ã£o / Ruim`. A cor segue `gradeStyle(grade)` (mesmas CSS vars `--grade-a..f` + backgrounds `--color-good/warn/bad-bg`). **Ajuste 2026-05 (consistÃªncia visual):** o Ã­cone do use case agora tambÃ©m usa `gradeStyle(grade)` â€” o mesmo objeto `{background, color}` Ã© aplicado tanto no wrapper do Ã­cone quanto no chip, garantindo que Ã­cone e chip nunca divirjam (antes o Ã­cone consumia `verdict.status` enquanto o chip consumia `useCaseGrade()`, gerando casos como Ã­cone amarelo + chip verde). Os helpers `ucIconBg(status)` / `ucIconColor(status)` foram removidos.
- **Helper novo `src/core/useCaseGrade.ts`.** Pure (sem React/DOM, segue a regra do `src/core/`). `useCaseGrade(verdict, metrics, profile)` retorna `'A'|'B'|'C'|'D'|'F'`: pega o pior grade entre as mÃ©tricas que o use case considera (mapeamento espelha `buildUseCaseEvaluators()` em `interpret.ts`). Cortes A-F vÃªm dos thresholds de qualidade do profile (`PROFILES[profile].quality.excellent/good/fair`) â€” `flags.unstable` / `flags.veryUnstable` cobrem o degrau C/D do jitter (nÃ£o hÃ¡ `fair.jitter`) e `flags.packetLoss * 2.5` (limite veryUnstable de perda) cobre o degrau D do packet loss. Reexportado em `src/core/index.ts`. TambÃ©m exporta `gradeMetric()` para teste isolado por mÃ©trica. Testes em `src/__tests__/useCaseGrade.test.ts` cobrem: tudo A; mistura A+B; mistura A+F; packet loss alto bloqueando gaming; mesmo download em fixed vs mobile (grade diferente).

**Pacote premium ResultScreen (2026-05).** Camada de polimento aditivo sobre o refactor visual acima â€” nÃ£o toca em `interpret.ts`/`copyDictionary.ts`/`speedTestOrchestrator.ts`/`core/*` e nÃ£o cria componentes JSX novos (tudo inline + classes CSS):

- **Banner de contexto** (`.lk-result__context-bar`) entre Large Title e bloco PRIMARY. Linha Ãºnica discreta `server.name Â· server.loc Â· server.isp Â· formatRelativeTime(result.timestamp)` em `--font-display` peso 500 11/12px cor `--text-2`. Cada pedaÃ§o some individualmente quando o campo Ã© nulo ou `'â€”'` (CloudflareProvider devolve `'â€”'` para campos nÃ£o detectados); a linha inteira sÃ³ some se TODOS os pedaÃ§os sumirem (caso em que vira `--verdict-only` justify-end com sÃ³ o chip).
- **Verdict chip** (`.lk-result__verdict-chip`) â€” chip pequeno na ponta direita do banner com label pt-BR derivado de `interpreted.quality`. Mapping local em `verdictLabel()`/`verdictStyle()` no prÃ³prio `ResultScreen.tsx` (nÃ£o hÃ¡ keys `quality.<X>.adj` no `copyDictionary.ts`, e o dicionÃ¡rio Ã© zona "nÃ£o tocar"). Cores reaproveitam tokens `--color-good-bg` / `--color-warn-bg` / `--color-bad-bg` Ã— `--grade-a`/`-c`/`-f`, mantendo coerÃªncia com os chips de grade dos use cases.
- **Plano vs entregue.** Quando `contractedDown`/`contractedUp` (de `useSettings`) sÃ£o truthy e `> 0`, cada cell do `lk-result__primary-block` ganha uma sub-linha `.lk-result__primary-cell-plan` com `/ Y Mbps Â· Z%` (Z = `Math.round((dl/contractedDl)*100)`, sem cap em 100% â€” overdelivery aparece como `102%`). O hero number animado (`useCountUp`) continua sendo o entregue absoluto; a porcentagem Ã© computada sobre `result.dl` final (nÃ£o animada â€” por design, percentual Ã© contexto, nÃºmero absoluto Ã© o que o usuÃ¡rio lÃª primeiro). Quando o campo contratado Ã© `null`/`0`, o cell preserva a unit-line tradicional `.lk-result__primary-cell-unit`.
- **Glow nos hero numbers.** `text-shadow: 0 0 16px var(--cell-glow, var(--dl-glow|--ul-glow)) !important` aplicado SOMENTE em `.lk-result__primary-cell:nth-child(1|2) .lk-result__primary-cell-value`. `!important` Ã© necessÃ¡rio pra bater o reset universal de `text-shadow` em `tokens.css`. Tokens novos `--dl-glow` (rgba 0.40 dark / 0.30 light) e `--ul-glow` (idem) â€” ver Â§7 Tokens globais e Â§7 Regras globais. A custom property `--cell-glow` (sem token global, setada inline pelo `ResultScreen.tsx` quando o plano contratado estÃ¡ cadastrado) sobrescreve o glow padrÃ£o para a famÃ­lia semÃ¢ntica Anatel â€” ver Â§3.14.1.
- **Stagger fade-in (CSS-only).** `@keyframes lk-fade-up` (8px â†’ 0, opacity 0 â†’ 1, 320ms `cubic-bezier(0.2,0.7,0.2,1)`, `animation-fill-mode: backwards`) aplicado a cada bloco principal do scroll content com `animation-delay` escalonado: PageHeader 0ms â†’ context-bar 60ms â†’ primary 120ms â†’ secondary 180ms â†’ use-row 240ms â†’ wifi-card 300ms â†’ combined 360ms â†’ tools/footer 420ms. Bloqueado por `@media (prefers-reduced-motion: reduce) { animation: none !important }`. **Refeito em 2026-05 com a unificaÃ§Ã£o dos 4 cards** â€” ver bloco abaixo.
- **Helper novo `src/utils/relativeTime.ts`** â€” ver Â§3.14.
- **Helper novo `src/utils/anatelColor.ts`** (2026-05) â€” cores semÃ¢nticas Anatel para Download/Upload quando o plano contratado estÃ¡ cadastrado. Ver Â§3.14.1.

**Card unificado de teste (2026-05).** Mais um passo em cima do Pacote premium: os 4 blocos (PRIMARY, SECONDARY, USE CASES, WI-FI) deixaram de ser 4 cards empilhados e viraram 4 seÃ§Ãµes internas de UM Ãºnico container `.lk-result__test-card`. O verdict da mediÃ§Ã£o, antes comunicado por um chip flutuante (`.lk-result__verdict-chip`) na ponta direita do banner de contexto, agora Ã© comunicado pela cor de um **ribbon de 3px no topo do card** (border-top). MudanÃ§as:

- **Wrapper `.lk-result__test-card`** (`background: var(--surface-deep)`, `border: 1px solid var(--border)`, `border-top: 3px solid var(--ribbon-color, var(--border))`, `border-radius: var(--radius-lg)`, `overflow: hidden`). A cor do ribbon vem de uma **CSS custom property inline** `style={{ '--ribbon-color': qualityRibbonColor(quality) }}` (cast `as CSSProperties`). Helper `qualityRibbonColor(q: Quality)` em `ResultScreen.tsx`: `excellent|good â†’ var(--success)`, `fair â†’ var(--warn)`, `slow|unavailable â†’ var(--error)`. DecisÃ£o consciente: usamos os tokens **cheios** (`--success/--warn/--error`) e nÃ£o os `--color-*-bg` (alpha 0.08-0.10 ficaria invisÃ­vel em 3px). Fallback `var(--border)` quando a custom property nÃ£o foi setada (nÃ£o acontece no fluxo normal â€” defesa).
- **Blocos internos perderam fundo/borda/raio/margem.** `.lk-result__primary-block`, `.lk-result__secondary-block`, `.lk-result__use-row` e `.lk-wifi-card` herdam o background do card; `border`/`border-radius`/`margin-bottom` saÃ­ram. Padding interno foi mantido (e padronizado para 16px lateral nos 3 blocos nÃ£o-primary, contra 20px do primary). Como `.lk-wifi-card` sÃ³ Ã© renderizado dentro do `.lk-result__test-card` (verificado por busca global em 2026-05), o estilo aplica diretamente sem `:not()`.
- **Hairlines internas.** `.lk-result__secondary-block`, `.lk-result__use-row` e `.lk-wifi-card` ganharam `border-top: 1px solid var(--border-subtle)`. O primeiro filho (`.lk-result__primary-block`) NÃƒO ganha hairline â€” o ribbon do card cumpre o papel de "topo". Token `--border-subtle` jÃ¡ existia em `tokens.css` (dark `#1F1F2A`, light `#F0EEE8`); nenhum token novo foi criado.
- **Chip flutuante removido.** O JSX de `.lk-result__verdict-chip` saiu (do banner de contexto e da variante `--verdict-only`); o CSS do chip e da variante tambÃ©m. O texto do verdict permanece acessÃ­vel via `aria-label="Resultado: {verdictLabel}"` no `<section>` e via `<span className="sr-only">Verdict: â€¦</span>` como primeiro filho. Utility `.sr-only` (clip + width 1px clÃ¡ssico) foi adicionada localmente em `ResultScreen.css` por nÃ£o existir como global no projeto. `verdictStyle()` foi removido (nÃ£o hÃ¡ mais consumer); `verdictLabel()` ficou (usado pelo aria-label/sr-only).
- **Banner de contexto sem peÃ§as â†’ some inteiro.** Antes, quando todas as peÃ§as do banner eram nulas, ele virava `--verdict-only` justify-end com sÃ³ o chip. Como o chip foi embora, o banner agora retorna `null` se `parts.length === 0` â€” uma linha vazia nÃ£o tem razÃ£o de existir.
- **Stagger fade-in atualizado.** Os 4 blocos internos nÃ£o animam mais individualmente. O card inteiro anima como peÃ§a Ãºnica com `animation-delay: 120ms`. SequÃªncia nova: PageHeader 0ms â†’ context-bar 60ms â†’ **test-card 120ms** â†’ combined 240ms â†’ tools/footer 320ms. As regras de `prefers-reduced-motion: reduce` foram atualizadas para o novo seletor.

Trechos chave:

- `src/screens/ResultScreen.tsx` â€” helper `qualityRibbonColor(q)` (sem export â€” local), `<section className="lk-result__test-card" style={...} aria-label={...}>` envolvendo os 4 blocos, `<span className="sr-only">` no topo do card, banner de contexto sem o chip.
- `src/screens/ResultScreen.css` â€” `.lk-result__test-card`, `.sr-only`, blocos internos sem bg/border, hairlines, stagger refeito.
- `src/features/local-wifi/WifiSignalCard.css` â€” `.lk-wifi-card` perdeu bg/border/radius/margin e ganhou `border-top: 1px solid var(--border-subtle)`.

### 3.10.1 Contrato â€” `interpretSpeedTestResult(input)`

```ts
function interpretSpeedTestResult(input: InterpretInput): InterpretedResult

interface InterpretInput {
  metrics: SpeedTestResult
  profile: ConnectionProfile
  history?: TestRecord[]
}

interface InterpretedResult {
  ruleSetVersion: RuleSetVersion        // versÃ£o das regras aplicadas (atualmente 'v1')
  profile: ConnectionProfile             // ecoado da entrada
  quality: Quality                       // excellent | good | fair | slow | unavailable
  flags: InterpretFlags                  // 6 booleanos (highLatency, lowUpload, unstable, packetLoss, veryUnstable, highBufferbloat)
  stability: { score: number; level: StabilityLevel }
  useCases: UseCaseVerdict[]             // 4 cenÃ¡rios: gaming, streaming_4k, home_office, video_call
  recommendations: Array<{               // disparos rastreÃ¡veis para a fase de UX
    id: string
    priority: 'low' | 'medium' | 'high'
    triggeredBy: Array<keyof InterpretFlags | 'history' | 'useCase'>
  }>
  copyKeys: {                            // chaves para resolveCopy() â€” nÃ£o strings
    headlineKey: string
    shortPhraseKey: string
    diagnosisKeys: string[]
    stabilityLabelKey: string
  }
}
```

**PrincÃ­pios de design:**

- O motor retorna **chaves de copy**, nÃ£o strings. O dicionÃ¡rio pt-BR vive em `copyDictionary.ts`. Isso permite que o app Flutter use o mesmo motor com seu prÃ³prio dicionÃ¡rio.
- Os **UseCases** olham todas as mÃ©tricas relevantes (download, upload, latÃªncia, jitter, perda) â€” nÃ£o sÃ³ uma fraÃ§Ã£o. Streaming 4K com perda alta cai de "good"; Games com latÃªncia boa nÃ£o cai para "limited" sÃ³ por jitter levemente alto.
- O ajuste de **stability** rebaixa um nÃ­vel quando `latency > rules.flags.highLatency Ã— 1.5`. Resolve o caso "Muito estÃ¡vel" exibido junto com "Resposta alta" (achado da auditoria).
- **`highBufferbloat`** (flag v2): disparado quando `bufferbloatSeverity === 'high' | 'critical'`. Penaliza quality um nÃ­vel quando severity Ã© `'critical'` (excellentâ†’good, goodâ†’fair). Gera recomendaÃ§Ã£o com prioridade `'high'`.
- **`stabilityScore`** (campo v2): quando presente no input, `computeStability()` usa o valor calculado pela sÃ©rie temporal do Motor v2 em vez de derivar o score das mÃ©tricas sumÃ¡rias.

### 3.10.2 `ConnectionProfile` â€” fixa vs. mÃ³vel

`ConnectionProfile` (em `src/types/index.ts`) Ã© o eixo regulatÃ³rio Anatel:

- `fixed_broadband` â€” Wi-Fi, cabo, ethernet. Thresholds em paridade com o `classifier.ts` legado nesta fase.
- `mobile_broadband` â€” rede celular. Thresholds deflacionados: download/upload exigem ~50% do que a fixa exige; latÃªncia tolera +30 ms; jitter e perda sÃ£o iguais (nÃ£o hÃ¡ razÃ£o regulatÃ³ria para afrouxar).

A funÃ§Ã£o `toConnectionProfile(connectionType)` em `src/utils/connectionProfile.ts` faz o mapeamento `wifi/cable â†’ fixed_broadband`, `mobile â†’ mobile_broadband`, `undefined â†’ fixed_broadband` (default conservador).

### 3.10.3 `RULE_SET_VERSION`

Exportado por `src/utils/classifier.ts` e reusado pelo motor. Versiona o conjunto de regras gravado em cada `TestRecord` (`record.ruleSetVersion`). Bump quando os thresholds mudarem materialmente â€” assim, registros antigos podem ser reinterpretados (ou marcados como sob regra antiga) ao recarregar o histÃ³rico.

Atualmente: `'v1'`. Os thresholds de `fixed_broadband` tÃªm paridade com o legado â€” bump serÃ¡ necessÃ¡rio quando os thresholds divergirem materialmente (Fase 4/5, calibraÃ§Ã£o de copy e ajuste fino de regras).

### 3.10.4 Arquivos

| Arquivo | ConteÃºdo |
|---|---|
| `src/core/types.ts` | `UseCaseId`, `UseCaseStatus`, `BlockingFactor`, `StabilityLevel`, `UseCaseVerdict`, `InterpretFlags`, `InterpretedResult`, `InterpretInput` |
| `src/core/profiles.ts` | `QualityThresholds`, `FlagThresholds`, `UseCaseThresholds`, `ProfileRules`, `PROFILES: Record<ConnectionProfile, ProfileRules>` + `GamingProfileId`, `GamingProfileThresholds`, `GamingProfileDef`, `GAMING_PROFILES` |
| `src/core/copyDictionary.ts` | Map `chave â†’ string pt-BR` + `resolveCopy(key, params?)` com interpolaÃ§Ã£o `{name}` |
| `src/core/interpret.ts` | `interpretSpeedTestResult(input)` â€” funÃ§Ã£o principal |
| `src/core/networkQualityClassifier.ts` | `gradeFrom(deltaMs)` (migrado de `bufferbloat.ts`), `classifyBufferbloatSeverity(deltaMs)`, `computeStabilityFromSamples(samples)`, `buildDiagnostics(result)`, `severityToGrade(s)` |
| `src/core/index.ts` | Reexporta o contrato pÃºblico para uso externo (Fase 7 / Flutter embed) |

**`GAMING_PROFILES`** â€” thresholds de desempenho por perfil de gamer:

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

Usado por `GamingVerdict` na ResultScreen para avaliar se as mÃ©tricas do teste atendem ao perfil selecionado.

---

## 4. Testes E2E (Phase 3d — 2026-05-09)

Suite de testes end-to-end que validam o motor de interpretação v2 em cenários cross-device e com histórico.

**Arquivo:** `src/__tests__/e2e-scenarios.test.ts`

**Escopo (14 testes, 100% passando):**

| Cenário | Testes | Validação |
|---|---|---|
| Mobile vs. Desktop | 3 | Profile-aware interpretation (mobile_broadband vs fixed_broadband); uso de grades A-F por use case |
| Dark Mode | 2 | Estabilidade e flags independentes de tema CSS |
| Histórico | 2 | Recomendações com histórico vazio e populado |
| Boundaries | 3 | Zero bandwidth (unavailable), latência extrema, métricas perfeitas |
| Copy Keys | 1 | Geração de chaves de texto para todos os níveis de qualidade |
| Use Cases | 2 | Todos 4 use cases recebem verdicts; grades refletem limites de métrica |
| Estabilidade | 1 | Progressão correta: very_stable → stable → oscillating → unstable |

**Framework:** Vitest (Node environment)

**Modelo de teste típico:**

```ts
it('mobile profile reflects stricter thresholds', () => {
  const result = interpretSpeedTestResult(metrics, 'mobile_broadband');
  const fixedResult = interpretSpeedTestResult(metrics, 'fixed_broadband');
  expect(result.ruleSetVersion).toBe('v2');
  expect(fixedResult.ruleSetVersion).toBe('v2');
});
```

**Execução:**

```bash
npm test -- e2e-scenarios.test.ts
# Resultado: 14 passed in ~400ms
```

**Integração com CI/CD:** `npm test` inclui esta suite. Build falha se testes pendentes retornarem.

**Testes legados (desabilitados):**

- `src/__tests__/interpret.test.ts.bak` — espera interface de objeto; function usa args posicionais
- `src/__tests__/useCaseGrade.test.ts.bak` — espera tipos antigos

Mantidos para referência histórica. Nova suite E2E cobre os mesmos cenários com interface atualizada.

---

## 5. Hooks (`src/hooks/`)

### 6.1 `useDeviceInfo(serverId = 'cloudflare')`

**Retorno:** `{ device, server, loading, error, reload }`

**Fluxo:**
1. `detectDevice()` (sÃ­ncrono) â†’ analisa UA + viewport â†’ `DeviceInfo` inicial.
2. Em paralelo, se `Capacitor.isNativePlatform()` for true â†’ `getLocalWifiRawInfoFromBridge()` refina `connectionType` (Bug-fix 2026-05, ver "Cascata de detecÃ§Ã£o" abaixo).
3. `navigator.connection?.type` e `?.effectiveType` â†’ `connectionType` (na versÃ£o sÃ­ncrona).
4. `provider.getInfo()` â†’ busca `ServerInfo` (trace + meta Cloudflare).
5. `provider.checkAvailability()` â†’ HEAD request de verificaÃ§Ã£o.
6. AbortController no cleanup do useEffect (`cancelled = true`).
7. `reload()` â†’ incrementa `reloadKey` para re-executar o efeito (e o effect Capacitor escuta `reloadKey`, entÃ£o re-checa o plugin a cada teste).

**EstratÃ©gia de refresh do ISP (Bug-fix 2026-05):** o `ServerInfo` (IP, colo, ISP) era resolvido **uma Ãºnica vez** no mount do App e ficava congelado mesmo apÃ³s troca de rede (Wi-Fi â†’ 4G ou troca de operadora). TrÃªs gatilhos de refresh foram adicionados:

1. **`navigator.connection.change`** â€” Chrome Android dispara confiavelmente; o handler atualiza `device` (re-detecta `connectionType`) **e** bumpa `reloadKey` para refetch de `getInfo()`.
2. **`window.online`** â€” caso clÃ¡ssico iOS Safari (modo aviÃ£o â†’ 5G) que nÃ£o expÃµe `navigator.connection`. Bumpa `reloadKey` igualmente.
3. **InÃ­cio de cada teste** â€” `App.tsx` ouve `test.phase === 'latency'` e chama `deviceInfoReloadRef.current()` (ref para evitar re-disparo quando o objeto `deviceInfo` muda). O fetch corre em paralelo com o teste; quando `phase === 'done'` (10â€“20 s depois), `appendRecord` captura o ISP atualizado.

A combinaÃ§Ã£o garante: (a) StartScreen mostra ISP correto apÃ³s troca de rede mesmo sem iniciar teste; (b) o registro persistido em histÃ³rico (`TestRecord.isp`) reflete a rede ativa no momento da mediÃ§Ã£o.

**Cascata de detecÃ§Ã£o de `connectionType`** (Bug-fix 2026-05 â€” rede mÃ³vel/Wi-Fi):

Antes da correÃ§Ã£o, a heurÃ­stica tentava `navigator.connection.type` e, se ausente (Safari iOS / Firefox / Capacitor com `type='unknown'`), caÃ­a em "se for mobile device â†’ assume mobile" â€” o que classificava erroneamente PWA iOS em casa (Wi-Fi) como `mobile`. APK Capacitor, idem. A nova ordem Ã©:

1. **Capacitor APK** (`Capacitor.isNativePlatform() === true`): `getLocalWifiRawInfoFromBridge()` â†’ se `available && ssid` â†’ `wifi`; caso contrÃ¡rio (sem Wi-Fi visÃ­vel, permissÃ£o negada, etc.) â†’ `mobile` (no APK nÃ£o hÃ¡ cabo). Este Ã© um effect async paralelo: o state inicial vem da heurÃ­stica web (passo 2-4) e Ã© refinado pelo plugin nativo logo depois. O effect re-executa quando `reloadKey` Ã© bumpado (App.tsx faz isso no inÃ­cio de cada teste â€” ver Â§`useDeviceInfo` passo 7).
2. `connection.type === 'wifi'` â†’ `wifi`
3. `connection.type === 'cellular'` â†’ `mobile`
4. `connection.type === 'ethernet' | 'wimax'` â†’ `cable`
5. `connection.type === 'bluetooth'` â†’ `mobile` (tethering)
6. Sem `type` mas `effectiveType` em `'2g' | '3g' | 'slow-2g'` â†’ `mobile`
7. **Fallback final**: `deviceType === 'desktop'` â†’ `cable`; mobile/tablet â†’ `wifi` (PWA standalone em casa Ã© o caso mais comum). Log `console.warn` para diagnÃ³stico.

> O override manual em **ConfiguraÃ§Ãµes â†’ ConexÃ£o** sempre vence (ver `App.tsx::effectiveConnection`) â€” nÃ£o passa pela cascata.

**Listeners de mudanÃ§a de rede:**
- `navigator.connection.change` (Chrome Android, confiÃ¡vel) â†’ re-detecta + bumpa `reloadKey`.
- `window.online` / `window.offline` (caso clÃ¡ssico iOS Safari: aviÃ£o â†’ 5G) â†’ idem.
- InÃ­cio de cada teste (`App.tsx` ouve `test.phase === 'latency'` e chama `deviceInfoReloadRef.current()`) â†’ bumpa `reloadKey`, dispara re-fetch do ISP **e** re-execuÃ§Ã£o do effect Capacitor.

**`serverId`** Ã© passado como prop de `App.tsx`. Atualmente fixo em `'cloudflare'`.

### 6.2 `useSpeedTest()`

**Retorno:** `{ phase, instantMbps, overallProgress, result, error, live, start, cancel, reset }`

**Assinatura de `start`**: `start(connectionType?: ConnectionType, mode?: SpeedTestMode)`. O hook mapeia `mode` para `'fast' | 'complete'` e chama `runSpeedTestV2(v2Mode, onProgress, signal, connectionType)`. Modos `'normal'` e `'quick'` mapeiam para `'fast'`; `'complete'` e `'advanced'` mapeiam para `'complete'`.

**Erros classificados:** no `catch`, instÃ¢ncias de `SpeedTestError` tÃªm seu `code` mapeado para mensagens pt-BR amigÃ¡veis via `errorMessageFor(code)`:
- `network_offline` â†’ "Sem conexÃ£o com a internet."
- `server_unavailable` â†’ "Servidor nÃ£o disponÃ­vel no momento."
- `download_failed` â†’ "Falha ao medir o download."
- `upload_failed` â†’ "Falha ao medir o upload."
- `latency_failed` â†’ "Falha ao medir a latÃªncia."

**`live: LivePoint[]`** â€” buffer dos Ãºltimos 60 pontos `{ t: number, speed: number, phase: 'download'|'upload' }`. Mantido por compatibilidade interna; **nÃ£o Ã© mais consumido** pela RunningScreen.

**SuavizaÃ§Ã£o do `instantMbps`:**
- `targetMbpsRef` recebe o valor bruto do callback `onProgress`
- `requestAnimationFrame` roda loop de EMA: `next = 0.25 * target + 0.75 * rendered`
- `renderedMbpsRef` â†’ `setState({ instantMbps: next })`

**Parciais progressivos (`SpeedTestProgress.partial`):**  
O orchestrator emite `partial: { latency, jitter, packetLoss }` apÃ³s a fase de latÃªncia e `partial: { dl }` apÃ³s o download. A RunningScreen pode consumir esses valores para exibiÃ§Ã£o progressiva enquanto a fase seguinte corre.

### 4.3 `useSettings()`

**Retorno:** `{ settings: Settings, update: (patch: Partial<Settings>) => void }`

```ts
interface Settings {
  unit: 'mbps' | 'gbps'            // padrÃ£o: 'mbps'
  connectionOverride: 'auto' | 'wifi' | 'cable' | 'mobile'  // padrÃ£o: 'auto'
  hideIpOnShare: boolean            // padrÃ£o: true â€” oculta IP ao compartilhar resultado
  gamingProfile: GamingProfile      // padrÃ£o: 'off' â€” perfil de gamer para veredicto na ResultScreen
  defaultMode: 'fast' | 'complete' // padrÃ£o: 'complete' â€” modo selecionado na StartScreen, persiste entre sessÃµes
  useHaptics: boolean              // padrÃ£o: true â€” vibraÃ§Ã£o tÃ¡til em transiÃ§Ãµes de fase / conclusÃ£o / erro (Bloco 3 Polimento, 2026-05)
}
```

`gamingProfile` controla o bloco `GamingVerdict` da ResultScreen e o hint da StartScreen. Quando `'off'`, nenhum desses elementos Ã© exibido. Configurado no BottomSheet â†’ seÃ§Ã£o ConfiguraÃ§Ãµes via seletor segmentado `[Off] Casual MOBA FPS Cloud`.

`defaultMode` Ã© atualizado toda vez que o usuÃ¡rio altera o seletor de modo na StartScreen, garantindo que o modo persista apÃ³s fechar e reabrir o app.

Chave localStorage: `linka.speedtest.settings.v1`  
`update` faz merge com settings atual e persiste imediatamente.

> **Bloco 6 â€” UX uniforme (2026-05):** o campo Ã³rfÃ£o `scale` foi removido do tipo `Settings` e dos `DEFAULTS`. `load()` continua usando `{ ...DEFAULTS, ...stored }`, que tolera silenciosamente o campo extra em localStorage de usuÃ¡rios antigos â€” o spread copia a chave para o objeto runtime sem efeito (nÃ£o hÃ¡ leitor) e ela Ã© descartada na prÃ³xima escrita parcial via `update()` se este reescrever sÃ³ campos vÃ¡lidos. Sem migraÃ§Ã£o explÃ­cita, sem risco de quebra.

### 4.4 `usePullToRefresh(scrollContainerRef, onRefresh, options?)` â€” Pull-to-refresh universal (2026-05)

Hook que habilita o gesto "puxar pra atualizar" sobre qualquer scroll container. Funciona idÃªntico em PWA web (mobile/desktop) e APK Capacitor â€” o caminho touch trata mobile com `preventDefault` confiÃ¡vel; o caminho pointer (apenas `pointerType !== 'touch'`) cobre mouse no desktop sem mexer com scroll do navegador.

**Assinatura:**

```ts
usePullToRefresh(
  scrollContainerRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<void>,
  options?: { threshold?: number; resistanceFactor?: number; enabled?: boolean },
): { pullDistance: number; isRefreshing: boolean; isReady: boolean }
```

**Defaults:** `threshold = 80px` (pull em px apÃ³s resistÃªncia para entrar em "ready"), `resistanceFactor = 0.5` (puxar 100px no dedo move 50px no spinner).

**LÃ³gica do gesto:**

1. `touchstart`/`pointerdown` arma SOMENTE quando: (a) `scrollContainer.scrollTop === 0`; (b) o alvo NÃƒO estÃ¡ dentro de `.lk-dsheet` (sheet aberto rouba o gesto). Se jÃ¡ scrollou pra baixo ou estÃ¡ sob um sheet, o hook deixa o gesto passar inteiro.
2. `touchmove`/`pointermove`: se `dy > 0` (puxando pra baixo), aplica resistÃªncia e chama `preventDefault()` (`touchmove` apenas, e sÃ³ quando armado) â€” anula rubber-band do iOS Safari sem comprometer scroll normal.
3. `touchend`/`pointerup`: `pullDistance < threshold` â†’ snap back animado, no-op. `pullDistance â‰¥ threshold` â†’ entra em `isRefreshing`, aguarda `onRefresh()`, snap back.

**Co-existÃªncia com `useScrollHeader`:** ambos os hooks operam sobre o mesmo `scrollContainerRef` (StartScreen / HistoryScreen) sem conflito â€” um lÃª `scroll`, o outro intercepta `touchmove`/`pointermove`. As listeners sÃ£o adicionadas via `addEventListener` direto (sem React synthetic events), com `touchmove` em `{ passive: false }` para permitir `preventDefault`.

**Co-existÃªncia com `DraggableSheet`:** o predicado `target.closest('.lk-dsheet')` Ã© avaliado no `touchstart`/`pointerdown` â€” se o gesto comeÃ§ou dentro de um sheet aberto, o hook nÃ£o arma e o sheet processa o drag-to-resize normalmente. Importante: o `.lk-dsheet__backdrop` cobre 100% da tela quando aberto, entÃ£o mesmo que o usuÃ¡rio toque "fora" do pill do sheet, o evento alvo Ã© o backdrop, que NÃƒO tem `.lk-dsheet` como ancestor â€” neste caso o pull-to-refresh do scroll container abaixo armaria. Para evitar isso, telas que possam abrir sheets passam `enabled: !!onRefresh && !sheetIsOpen` quando aplicÃ¡vel (ex.: HistoryScreen desliga o gesto quando `selected` â€” detalhe de registro â€” estÃ¡ aberto).

**Co-existÃªncia com swipe lateral do `App.tsx`:** o swipe para `goBack`/`goForward` exige `dx > dy * 1.5` (mais horizontal que vertical) â€” gesto vertical do pull-to-refresh nunca dispara navegaÃ§Ã£o por engano.

### 4.5 `useCountUp(target, durationMs?, decimals?)` â€” Bloco Motion

Hook RAF puro que anima um nÃºmero de 0 (ou do Ãºltimo valor renderizado) atÃ© `target`, com easing `easeOutCubic`. Retorna sempre um `number` â€” o caller continua chamando `formatMbps` / `formatMs` com o valor animado.

**Assinatura:** `useCountUp(target: number | null | undefined, durationMs = 700, decimals = 1): number`

- `null` / `undefined` / `NaN` / `Infinity` sÃ£o normalizados para `0` via `normalizeTarget`.
- MudanÃ§as menores que `epsilon = 10^(-decimals) / 2` no target nÃ£o disparam re-animaÃ§Ã£o â€” protege contra renders intermediÃ¡rios da React que reentregam o mesmo valor com ruÃ­do de ponto flutuante.
- Helpers puros (`easeOutCubic`, `lerpEased`, `normalizeTarget`, `epsilonFor`, `shouldStartAnimation`) sÃ£o exportados para teste em `__tests__/useCountUp.test.ts`.

**Fix StrictMode dev (2026-05):** o predicado de re-animaÃ§Ã£o foi trocado de "comparar `safeTarget` com `targetRef.current`" para `shouldStartAnimation(safeTarget, valueRef.current, epsilon)`. O bug original deixava os 4 cards do `ResultScreen` em `0/â€”` mesmo com o teste salvando os valores reais no histÃ³rico: em StrictMode dev o efeito roda duas vezes no mount; a 1Âª invocaÃ§Ã£o mutava `targetRef = 604` e a 2Âª caÃ­a no early-return porque `|604 âˆ’ 604| < Îµ`, sem reiniciar o RAF que o cleanup havia cancelado. Comparar com `valueRef.current` (que continua em 0) resolve o caso e cobre tambÃ©m o cenÃ¡rio "target chega depois do mount" (renderizaÃ§Ã£o inicial com `result.dl == null`). RegressÃ£o coberta em `useCountUp.test.ts` no bloco `describe('shouldStartAnimation (regressÃ£o ResultScreen)')`.

**Uso atual:** `ResultScreen` aplica em `result.dl`, `result.ul`, `result.latency`, `result.jitter`. Para `formatMs` (que retorna `'â€”'` quando `v â‰¤ 0`), o caller passa `Math.max(0.1, animValue)` quando o `target > 0` â€” evita o glifo `â€”` aparecer no inÃ­cio da animaÃ§Ã£o enquanto o RAF rampa de 0 ao alvo.

> `hideIpOnShare: true` Ã© o padrÃ£o â€” ao compartilhar via texto ou PDF, o IP pÃºblico Ã© substituÃ­do por "Oculto" na seÃ§Ã£o Detalhes da ResultScreen.

---

## 6. Componentes (`src/components/`)

### 6.1 `PathRow`

Props: `device, server, loading`

TrÃªs nÃ³s SVG conectados por linhas:  
`[DeviceIcon]â”€â”€â”€[ConnectionIcon]â”€â”€â”€[IconServer]`

- Labels abaixo de cada nÃ³ (ex: "Celular", "Wi-Fi", "Cloudflare")
- Linha animada com `stroke-dashoffset` via CSS keyframes ao carregar
- Ãcones importados de `icons.tsx`

### 6.2 `BottomSheet`

Props: `open, onToggle, onClose, device, server, loading, settings, onUpdateSettings`

- `position:fixed; bottom:0; max-width:480px; margin:auto`
- Fechado: `transform: translateX(-50%) translateY(calc(100% - 110px))` (peek de 110px)
- Aberto: `transform: translateX(-50%) translateY(0)`
- Backdrop fade em/out; click fora fecha
- **Gestos verticais** ligados em `.lk-sheet__handle-area`: `onTouchStart/Move/End` aplicam `transform` em tempo real durante o arrasto e, ao soltar, decidem com base em threshold de 60 px se chamam `onToggle()` (abrir) ou `onClose()` (fechar)
- O click em `.lk-sheet__handle-area` segue funcionando como fallback para taps rÃ¡pidos
- A SettingRow "GrÃ¡fico" foi removida; o array `SCALE_OPTS` foi removido do componente
- Subcomponente interno `Seg<T>` para controles segmentados
- **SeÃ§Ã£o de privacidade:** toggle "IP ao compartilhar" (`['hide','show']`) que altera `settings.hideIpOnShare`. Nota informativa abaixo: "Seus testes ficam salvos neste aparelho. VocÃª decide quando exportar ou compartilhar."

### 6.3 `Gauge` (redesenhado)

Props: `value: number (0â€“1), phase: string, num: string, unit: string, color: string, size?: number`

SVG com dois `<circle>`: track (`--surface-3`) e fill (cor dinÃ¢mica) com `strokeDasharray={2Ï€r}`, `strokeDashoffset = 2Ï€r Ã— (1 â€“ value)`, `strokeLinecap="round"`. Overlay central absolutamente posicionado exibe:
- `.lk-gauge__phase` â€” label da fase (10px, uppercase, `--accent`)
- `.lk-gauge__num` â€” nÃºmero hero (80px, Geist 700, `tnum`) â€” Bloco 2 (Hero confiante, 2026-05) bumpou de 72px/`--font-mono` weight 600 para 80px/`--font-display` weight 700, alinhando com o Manifesto Â§5 ("nÃºmeros de mÃ©trica sempre em Geist")

**Bloco 3 â€” Polimento (2026-05):** o arco ativo do gauge ganhou `filter: drop-shadow(0 0 ${4 + value*3}px ${color})` aplicado inline no `<circle>` do fill. Glow Ã© sutil (4-7px de blur) e escala levemente com o `value` (progresso da fase), produzindo a sensaÃ§Ã£o de "ganhar energia" enquanto a barra completa. A cor herda do `stroke`, entÃ£o acompanha a fase: `--dl` no download, `--ul` no upload, `--accent` em latency. Geometria, dasharray e linecap nÃ£o mudaram. `transition` foi estendido para incluir `filter` (mesma duraÃ§Ã£o e curva).
- `.lk-gauge__unit` â€” unidade (12px, `--text-3`)

Usado em `RunningScreen` com helpers que calculam `gaugePhaseLabel(phase)` e `gaugeColor(phase)`. O `value` (preenchimento do arco) vem do `overallProgress` contÃ­nuo emitido pelo orchestrator (Bloco Motion) â€” passado como prop nova `overallProgress` desde `App.tsx`. HÃ¡ fallback `gaugeProgressFallback(phase)` (degrau 0 â†’ 0.15 â†’ 0.5 â†’ 0.85 â†’ 1) usado apenas quando o consumidor nÃ£o fornece o progresso, mantendo o componente utilizÃ¡vel fora do fluxo padrÃ£o. **Fix saltos do arco (2026-05):** antes o `value` vinha sempre de `gaugeProgressFallback(phase)`, entÃ£o a transiÃ§Ã£o latÃªncia â†’ download â†’ upload pulava em saltos visÃ­veis. Trocar para `overallProgress` deixou o arco fluindo monotonicamente â€” a transiÃ§Ã£o CSS de 0.5s jÃ¡ existente ficou imperceptÃ­vel porque os updates chegam a cada ~300 ms e a magnitude entre eles Ã© pequena.

### 6.3.1 `LiveChart` â€” mini-grÃ¡fico ao vivo (Bloco Motion, 2026-05)

Props: `points: LivePoint[], phase: TestPhase, width?, height?`

Mini sparkline SVG inline (sem libs) que renderiza a velocidade instantÃ¢nea durante o teste. Usa `viewBox="0 0 320 64"` com `preserveAspectRatio="none"` â€” ajusta-se ao container responsivo (`.lk-running__chart` na RunningScreen, `max-width: 320px`). Cor da linha por fase: `var(--dl)` para download, `var(--ul)` para upload. Auto-escala vertical pelo mÃ¡ximo de `speed` na sÃ©rie filtrada da fase atual (descarta pontos de fases anteriores â†’ reset visual implÃ­cito ao trocar download â†’ upload). `vector-effect="non-scaling-stroke"` mantÃ©m a espessura constante apesar do `preserveAspectRatio="none"`.

Importa `LivePoint` de `useSpeedTest` (`{ t, speed, phase: 'download'|'upload' }`). O hook jÃ¡ throttle os pontos a 200 ms e mantÃ©m no mÃ¡ximo 60 (`MAX_POINTS`), entÃ£o o componente apenas renderiza o que recebe.

### 6.3.2 `Accordion` â€” bloco expansÃ­vel (refator 2026-05)

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

Componente em `src/components/Accordion.tsx` + `.css`. Foi criado no refator de arquitetura 2026-05 para os 3 expansives da section "Mais detalhes" da ResultScreen (AvanÃ§ado / Modo Gamer / DNS). **No refator drag-to-resize 2026-05 perdeu seus callers** â€” a section "Mais detalhes" virou 3 rows clicÃ¡veis que abrem bottom sheets dedicados (`AdvancedSheet`, `GamerSheet`, `DNSGuideSheet`). O componente permanece disponÃ­vel para uso futuro (nÃ£o foi deletado).

**Visual.** Container `var(--surface-deep)` + border + `border-radius: var(--radius-lg)`, `overflow: hidden`. Header Ã© um `<button>` com `aria-expanded` (preferimos botÃ£o a `<details>/<summary>` para controle total do estilo do header sem polyfill de `::marker`). Layout do header: `[icon] title [chevron]`. Chevron rotaciona 180Â° quando aberto (`transform: rotate(-180deg)`, transiÃ§Ã£o 240ms cubic-bezier).

**AnimaÃ§Ã£o.** ConteÃºdo anima via `max-height` lendo `scrollHeight` do `contentRef` (sem `auto`, que nÃ£o anima). TransiÃ§Ã£o 320ms cubic-bezier. `prefers-reduced-motion: reduce` zera ambas as animaÃ§Ãµes.

**Acessibilidade.** Header Ã© botÃ£o semÃ¢ntico com `aria-controls` apontando para o `id` gerado pelo `useId()`. ConteÃºdo carrega `role="region"` + `aria-hidden` espelhando o estado.

### 6.3.3 `DraggableSheet` â€” base universal de bottom sheet (refator drag-to-resize 2026-05)

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

Componente em `src/components/DraggableSheet.tsx` + `.css`. **Base obrigatÃ³ria de todo bottom sheet do app.** Substituiu as animaÃ§Ãµes prÃ³prias do `DNSGuideSheet`, `WifiDetailsSheet` e `WifiOptimizeSheet`, e Ã© a base dos novos `AdvancedSheet` e `GamerSheet`.

**Snap points.** Dois pontos de parada definidos como % do viewport:

- `compact` = 60vh (default ao abrir).
- `expanded` = 88vh.

**Drag math.** Pointer events ficam SÃ“ na `__handle-area` (28px de altura, full width, com a barra 40Ã—4 centralizada). NÃ£o vÃ£o no `__content` para nÃ£o conflitar com scroll interno. ConvenÃ§Ã£o: `dy > 0` (pointer descendo) reduz a altura; `dy < 0` aumenta. A altura efetiva Ã© convertida de pixels para vh dividindo por `window.innerHeight` e multiplicando por 100. ResistÃªncia (`OVERDRAG_RESISTANCE = 0.3`) Ã© aplicada quando o usuÃ¡rio tenta exceder `expanded` â€” sem isso o sheet "estica" infinito.

**Snap logic em `pointerup`.** Avaliada nesta ordem:

1. Velocidade descendente > 0.8 px/ms (â‰ˆ 800 px/s) â†’ fecha.
2. Velocidade ascendente > 0.8 px/ms â†’ snap para `expanded`.
3. DistÃ¢ncia: arrastou pra baixo > 30% da altura inicial â†’ fecha.
4. SenÃ£o, snap para o ponto mais prÃ³ximo (compact ou expanded).

A velocidade Ã© medida entre o Ãºltimo e o penÃºltimo `pointermove` (janela curta = medida instantÃ¢nea). NÃ£o usa rolling average â€” basta para fast-swipe-detection.

**AnimaÃ§Ãµes.** Sem transition durante drag (responsivo); 300ms `cubic-bezier(0.32, 0.72, 0, 1)` ao soltar (snap). AnimaÃ§Ã£o de entrada: `lk-dsheet-slide-up` 280ms `transform: translateY(100%) â†’ 0`. Backdrop fade 220ms. Backdrop opacity escala com a altura â€” quando o usuÃ¡rio puxa pra baixo, o backdrop comeÃ§a a desaparecer junto, dando feedback visual de "estÃ¡ fechando".

**Stacking (`nested`).** Ativa modifiers `--nested` que sobem o z-index pro stacking acima de outro sheet (backdrop 10000, sheet 10001). Usado pelo `WifiOptimizeSheet`, que abre por cima do `WifiDetailsSheet`. Sem `nested`, defaults sÃ£o 9998/9999.

**Body scroll lock + Esc.** Ambos sÃ£o tratados aqui (centralizados) â€” os consumidores nÃ£o duplicam a lÃ³gica.

**Acessibilidade.** `role="dialog"` + `aria-modal="true"` no container; o consumidor passa `ariaLabel` ou `ariaLabelledBy` apontando para o tÃ­tulo do header.

### 6.3.4 `PullToRefreshIndicator` â€” pill flutuante do pull-to-refresh (2026-05)

Props:

```ts
interface Props {
  pullDistance: number;
  isRefreshing: boolean;
  isReady: boolean;
  threshold?: number; // default 80
}
```

Componente em `src/components/PullToRefreshIndicator.tsx` + `.css`. Renderiza um pill 36Ã—36 com spinner SVG inline, posicionado `position: fixed; top: calc(var(--safe-top) + 56px)` (logo abaixo do TopBar), centralizado horizontalmente. A `transform: translate(-50%, â€¦px)` Ã© controlada via inline style â€” segue o dedo durante o pull e segura na posiÃ§Ã£o "ready" durante `isRefreshing`.

**Spinner pre-refresh.** Arco SVG (`<circle r="9" stroke="â€¦" />`) cuja `stroke-dashoffset` cresce conforme `pullDistance / threshold` (0 â†’ 270Â° de arco). Cor: `var(--accent)` (decisÃ£o consciente â€” accent Ã© a cor de "aÃ§Ã£o ativa" do produto; mais alinhado com o feedback de "algo estÃ¡ acontecendo" do que `var(--text)`). Quando `isReady`, a borda do pill ganha `var(--accent-border)` para sinalizar "solte agora".

**Spinner refreshing.** SVG inteiro recebe `animation: lk-ptr-spin 1s linear infinite` (rotaÃ§Ã£o contÃ­nua). O arco usa `dashoffset = perimeter * 0.25` (Â¾ visÃ­veis), produzindo o efeito clÃ¡ssico de spinner indeterminado.

**Sem box-shadow.** Regra do projeto. A separaÃ§Ã£o visual do conteÃºdo abaixo vem de `background: var(--surface-deep)` + `border 1px var(--border)`.

**`prefers-reduced-motion`.** Para a rotaÃ§Ã£o contÃ­nua via `@media (prefers-reduced-motion: reduce)`. O arco do pre-refresh continua reagindo ao input do usuÃ¡rio (nÃ£o Ã© animaÃ§Ã£o automÃ¡tica) â€” nÃ£o foi suprimido.

**Acessibilidade.** `role="status"` + `aria-live="polite"` no container; texto sr-only alterna entre "Puxe para atualizar" / "Solte para atualizar" / "Atualizando" conforme estado.

### 6.3.5 `Skeleton` â€” placeholder com shimmer (loading states, 2026-05)

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

Placeholder visual com animaÃ§Ã£o shimmer linear. Substitui textos "Carregandoâ€¦" por retÃ¢ngulos animados que dÃ£o pista do shape do conteÃºdo a vir. Sem box-shadow (regra do projeto). Cores via `--surface` e `--surface-2`.

**Visual.** Background gradient `linear-gradient(90deg, var(--surface) 25%, var(--surface-2) 50%, var(--surface) 75%)` com `background-size: 200% 100%`. AnimaÃ§Ã£o `lk-skeleton-shimmer` 1.5s linear infinite translada o gradient (200% â†’ -200% no eixo X).

**Variants.**
- `rect` (default) â€” `border-radius: var(--radius-sm)`. Card placeholders.
- `pill` â€” `border-radius: 999px`. Texto inline e badges.
- `circle` â€” `border-radius: 50%`. Avatares e Ã­cones.

**`prefers-reduced-motion`.** Override em `@media`: animaÃ§Ã£o removida, fica estÃ¡tico em `--surface-2`.

**Acessibilidade.** Por default `aria-hidden="true"` â€” o componente Ã© ornamental e o parent dita o estado de loading. Quando o caller passa `ariaBusy`, o Skeleton ganha `role="status"` + `aria-busy="true"` (raro â€” em geral o parent gerencia via `aria-busy` no container).

**Locais de uso (2026-05).**

| Local | Estado de loading | Skeleton render |
|---|---|---|
| `App.tsx` â†’ `ScreenLoadingFallback` | Chunk lazy de tela secundÃ¡ria baixando | TopBar pill 36Ã—36 + tÃ­tulo central 140Ã—16 + 2 cards (80px e 60px) |
| `WifiSignalSection` | `useWifiDiagnostics` em `loading` | 3 linhas: kicker pill 40Ã—12 + label pill 120Ã—16 + barra rect 8Ã—100% |
| `DNSGuideSheet` | `running && !effectiveBench` (benchmark sem seed) | 5 rows com nome do server + skeleton pill 32Ã—16 â€” cada row se "completa" individualmente conforme o callback `onServerComplete` do `runDNSBenchmark` reporta o servidor |
| `HistoryScreen` | `records === undefined` (edge case) | NÃ£o implementado â€” `useState(() => loadHistory())` Ã© sÃ­ncrono; o estado nunca Ã© `undefined` na prÃ¡tica |

**`runDNSBenchmark` â€” callback `onServerComplete` (2026-05).** Adicionado para alimentar o skeleton incremental do DNSGuideSheet. Assinatura:

```ts
runDNSBenchmark(
  signal: AbortSignal,
  onProgress?: (done: number, total: number, current: string) => void,
  onServerComplete?: (server: DnsServerResult) => void,
): Promise<DnsBenchmarkResult>
```

Disparado dentro do loop de servers logo apÃ³s `benchmarkServer` resolver â€” antes do `MIN_SERVER_PACING`. Permite Ã  UI remover o placeholder de cada server progressivamente sem esperar o benchmark completo.

### 6.3.6 `InfoTooltip` â€” botÃ£o `?` educacional (a11y, 2026-05)

```tsx
interface InfoTooltipProps {
  label: string;          // texto explicativo, 1-2 frases pt-BR
  ariaLabel?: string;     // texto alternativo p/ screen readers
}
```

BotÃ£o `?` 16Ã—16 inline com balÃ£o flutuante explicativo. Click ou Enter/Space alterna; click fora ou ESC fecha. Posicionamento: padrÃ£o abaixo do `?`; se overflow no viewport bottom, aparece acima (calculado via `getBoundingClientRect` no momento da abertura). A11y: `<button aria-expanded>` real (nÃ£o div fake) com `aria-describedby` apontando para o balÃ£o `role="tooltip"`. Sem dependÃªncia de hover (mobile-friendly).

**Consumo (2026-05).**

| Tela / Sheet | MÃ©tricas com tooltip |
|---|---|
| `ResultScreen` SECONDARY | Resposta, OscilaÃ§Ã£o, Falhas |
| `AdvancedSheet` | LatÃªncia sob carga (Bufferbloat A-F), LatÃªncia sob carga (valor), OscilaÃ§Ã£o carregada, Estabilidade do download |
| `WifiDetailsSheet` | Sinal (RSSI), Velocidade do link, Banda |

`IOSList` foi estendido com a prop opcional `titleAfter?: ReactNode` para encaixar o tooltip ao lado do label sem mudar o tipo de `title` (que continua `string`). Consumidores legados ignoram a prop.

### 6.4 `IOSList`

```tsx
interface IOSListItem {
  icon?: ReactNode;       // conteÃºdo do quadrado 28Ã—28
  iconBg?: string;        // cor de fundo do Ã­cone (CSS var ou hex)
  title: string;
  titleAfter?: ReactNode; // conteÃºdo opcional apÃ³s o tÃ­tulo (ex.: <InfoTooltip>)
  subtitle?: string;
  trailing?: ReactNode;   // valor ou chip Ã  direita
  showChevron?: boolean;
  onClick?: () => void;
}
```

Lista estilo iOS Settings. Fundo `--surface`, borda `--border`, `border-radius: --radius`, `overflow: hidden`. Cada row: flex, `padding: 13px 14px`, separada por `border-bottom: 1px solid var(--hairline)`. Ãcone: `28Ã—28px`, `border-radius: 7px`. Ãšltima row sem border-bottom.

Usada em: ResultScreen (mÃ©tricas DL/UL/lat), GamerScreen (avaliaÃ§Ã£o por jogo), StartScreen (informaÃ§Ãµes do servidor).

### 6.5 `Chip`

```tsx
type ChipVariant = 'good' | 'maybe' | 'bad' | 'accent' | 'neutral';
interface ChipProps { variant: ChipVariant; children: ReactNode; }
```

Badge/pÃ­lula com 5 variantes semÃ¢nticas. Estilos:

| Variante | Fundo | Texto |
|---|---|---|
| `good` | `--ul-tint` | `--ul` |
| `maybe` | `rgba(245,166,35,0.16)` | `--warn` |
| `bad` | `rgba(255,69,58,0.16)` | `--error` |
| `accent` | `--accent-tint` | `--accent` |
| `neutral` | `--surface-2` + borda `--border` | `--text-2` |

Usada em: ResultScreen (badge de qualidade, chips de casos de uso), GamerScreen (badge "Otimizado p/ jogos").

### 6.6 `icons.tsx` â€” Biblioteca de Ã­cones

Todos os Ã­cones sÃ£o SVGs inline. Componente primitivo `<Icon name={...} size={...} color={...} />` que consulta o mapa `ICON_PATHS`. Os exports nomeados legados (`DeviceIcon`, `ConnectionIcon`, etc.) sÃ£o preservados.

Ãcones disponÃ­veis no mapa `ICON_PATHS`:

| Nome | Uso |
|---|---|
| `download` / `upload` | Indicadores de velocidade |
| `ping` / `jitter` / `loss` | MÃ©tricas de latÃªncia |
| `wifi` / `router` / `home` | Wi-Fi e roteador |
| `history` | HistÃ³rico |
| `game` | Modo Gamer |
| `bolt` | Internet / velocidade |
| `shield` | Qualidade de uso |
| `bulb` | RecomendaÃ§Ãµes |
| `cog` | ConfiguraÃ§Ãµes |
| `refresh` | Refazer teste |
| `share` | Compartilhar |
| `check` | Aprovado |
| `close` | Fechar |
| `chevron` | Seta de navegaÃ§Ã£o |
| `arrowDown` | Download |
| `pin` | LocalizaÃ§Ã£o |
| `signal` | Sinal |

Componentes nomeados mantidos para compatibilidade com PathRow e BottomSheet: `DeviceIcon`, `ConnectionIcon`, `IconServer`, `IconBuilding`, `IconGames`, `IconStream`, `IconWork`, `IconVideoCall`, `IconPdf`, `IconShare`, `IconWhatsApp`.

**`ConnectionIcon` (consumo expandido em 2026-05 â€” Bug-fix rede mÃ³vel):** o componente jÃ¡ existia e era usado em `PathRow` e `HistoryScreen` (lista). ApÃ³s o Bug-fix de detecÃ§Ã£o/UX de rede mÃ³vel, passou a ser consumido tambÃ©m em:

- `ResultScreen` â€” banner de contexto, canto direito (size 16, cor `var(--text-2)`). Renderizado quando `connectionType âˆˆ {wifi, mobile, cable}`. `aria-label` `"ConexÃ£o: <Wi-Fi|Rede mÃ³vel|Cabo>"`.
- `HistoryScreen` (HistoryDetail) â€” hero do detalhe, abaixo do subtÃ­tulo (size 20, cor `var(--text-2)`), com label textual ao lado.

Assinatura do componente (`{ kind: ConnectionType; size?: number }`) nÃ£o mudou â€” `'unknown'` Ã© tratado pelo consumer (Result/HistoryDetail sÃ³ renderiza para os 3 tipos canÃ´nicos).

### 6.7 Bloco 5 â€” TopBar System (2026-05)

Sistema de cabeÃ§alho universal aplicado em todas as 14+ telas. Substitui os headers inline prÃ©-Bloco 5 (`â€¹ Voltar`, `â€¹ InÃ­cio`, `lk-*__head` especÃ­fico de cada tela) por uma famÃ­lia consistente de componentes.

**Estrutura visual:**
- `<TopBar>` posicionado em `position: absolute; top: 0; z-index: 50`. Altura 56px + safe-top.
- Estado `scrolled = false`: fundo transparente, sem borda.
- Estado `scrolled = true`: fundo `var(--surface-translucent)` com `backdrop-filter: blur(20px) saturate(160%)` e borda inferior `var(--border-subtle)`.
- TransiÃ§Ãµes: 200ms ease (background, blur e border simultaneamente).

**Componentes:**

| Arquivo | FunÃ§Ã£o |
|---|---|
| `TopBar.tsx` / `.css` | Container do header. Slots: `leftSlot` (ou `onBack`), `title` + `showTitle`, `rightActions[]`. Aceita `scrolled: boolean` e `useHaptics?: boolean`. |
| `BackButton.tsx` / `.css` | Pill 36Ã—36 com chevron Ãºnico. Ãrea tocÃ¡vel 44Ã—44. Active scale(0.94). Dispara `triggerHaptic('phaseChange', useHaptics)` no clique. |
| `IconButton.tsx` / `.css` | Mesmo padrÃ£o visual do `BackButton`, slot livre para qualquer SVG. Usado para hamburger, share, PDF, history. |
| `PageHeader.tsx` / `.css` | TÃ­tulo grande no inÃ­cio do scroll. `size: 'lg'` (32â†’40px @480px) ou `size: 'md'` (24â†’28px). Aceita `subtitle` e `trailing` (slot direito para chips). Padding-top compensa altura do TopBar. |
| `useScrollHeader.ts` | Hook com `IntersectionObserver`. Retorna `{ scrolled, scrollContainerRef, sentinelRef }`. O sentinel Ã© o prÃ³prio `<PageHeader ref={sentinelRef}>`. Quando o sentinel sai da viewport, `scrolled` vira `true` e o TopBar ganha glass + tÃ­tulo pequeno. |

**PadrÃ£o de uso:**

```tsx
const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

return (
  <div className="lk-tela">
    <TopBar
      onBack={onBack}
      scrolled={scrolled}
      title="HistÃ³rico"
      showTitle={scrolled}
      useHaptics={useHaptics}
      rightActions={[{ icon: <IconPdf size={18} />, onClick: handlePdf, ariaLabel: 'Exportar PDF' }]}
    />
    <div className="lk-tela__scroll" ref={scrollContainerRef}>
      <PageHeader ref={sentinelRef} title="HistÃ³rico" subtitle="Seus testes recentes" />
      ...
    </div>
  </div>
);
```

**MigraÃ§Ã£o:** o tÃ­tulo da pÃ¡gina agora vive no scroll content como `<PageHeader>` Geist 700 32px. Quando o usuÃ¡rio rola e o tÃ­tulo grande sai da viewport, ele migra para o slot pequeno do TopBar (Geist 600 14px) com fade-in. Telas sem rolagem (StartScreen) usam apenas o TopBar e podem omitir `showTitle`.

**Telas exceÃ§Ãµes:**
- `StartScreen`: `leftSlot={<Logo />}` em vez de back; sem PageHeader (orb central jÃ¡ Ã© o hero). **Bloco 6 â€” UX uniforme (2026-05):** ganhou `<div className="lk-start__sentinel" ref={sentinelRef} />` posicionado em `position: absolute; top: calc(var(--safe-top) + 56px)`, e `scrollContainerRef` ligado ao prÃ³prio `.lk-start` (que Ã© o container com `overflow-y: auto`). Comportamento atual idÃªntico (sem rolagem, sem glass), mas se a tela ganhar conteÃºdo, o glass passa a aparecer automaticamente.
- `RunningScreen`: sem `onBack` (nÃ£o dÃ¡ para voltar mid-test); tÃ­tulo "Medindoâ€¦" sempre visÃ­vel (`showTitle={true}` permanente).

**Helper testÃ¡vel:** `deriveScrolled(isIntersecting: boolean): boolean` â€” espelha a regra de decisÃ£o do hook. Coberto por `src/__tests__/useScrollHeader.test.ts`.

---

## 7. `App.tsx` â€” Estado global e roteamento

Estado gerenciado em `App.tsx`:

| State | Tipo | DescriÃ§Ã£o |
|---|---|---|
| `theme` | `'dark'\|'light'` | Tema atual, persiste em localStorage |
| `screen` | `Screen` | Tela ativa: `'start'\|'running'\|'result'\|'history'\|'comparison'\|'beforeafter'\|'roomtest'\|'explore'\|'localwifi'`. **Refator 2026-05:** removidos `'diagnostic'`, `'gamer'`, `'recommend'`, `'dnsbenchmark'`, `'dnsguide'`, `'details'` (consolidados na ResultScreen). |
| `isOnline` | `boolean` | Conectividade detectada via eventos `online`/`offline` do browser |
| `previous` | `TestRecord\|null` | Registro do teste anterior Ã  sessÃ£o atual (para comparaÃ§Ã£o na ResultScreen) |
| `lastRecord` | `TestRecord\|null` | Ãšltimo registro do histÃ³rico, exibido como card na StartScreen |
| `historyInitialId` | `string\|undefined` | Id prÃ©-selecionado quando se abre o HistoryScreen direto no detalhe |
| `testMode` | `'fast'\|'complete'` | Modo selecionado na StartScreen; inicializado a partir de `settings.defaultMode` (lido do localStorage); atualizado via `handleStart` e via `StartScreen.handleModeChange` |
| `comparisonStep` | `ComparisonStep` | Passo da ComparisonScreen: `'near'\|'far'\|'done'` |
| `comparisonNear` | `SpeedTestResult\|null` | Resultado do teste perto do roteador |
| `comparisonFar` | `SpeedTestResult\|null` | Resultado do teste longe do roteador |
| `baStep` | `BeforeAfterStep` | Passo da BeforeAfterScreen: `'before'\|'after'\|'done'` |
| `baBefore` | `SpeedTestResult\|null` | Resultado do teste "antes" |
| `baAfter` | `SpeedTestResult\|null` | Resultado do teste "depois" |
| `provaRealSession` | `number\|null` | NÃºmero do teste atual (1, 2 ou 3) durante Prova Real; `null` fora do modo |
| `provaRealOverride` | `SpeedTestResult\|null` | Resultado mÃ©dio calculado ao fim da Prova Real; passado para ResultScreen |

Refs (nÃ£o disparam re-render):

| Ref | Tipo | DescriÃ§Ã£o |
|---|---|---|
| `comparisonModeRef` | `'near'\|'far'\|null` | Intercepta o done-effect para rotear para ComparisonScreen |
| `baModeRef` | `'before'\|'after'\|null` | Intercepta o done-effect para rotear para BeforeAfterScreen |
| `provaRealResultsRef` | `SpeedTestResult[]` | Acumula os 3 resultados intermediÃ¡rios da Prova Real |
| `provaRealPendingRef` | `boolean` | Sinaliza que o prÃ³ximo teste da Prova Real deve ser iniciado assim que `test.phase === 'idle'` |
| `locationTagRef` | `string\|null` | Etiqueta de cÃ´modo definida em RoomTestScreen; limpa apÃ³s `appendRecord` |
| `recordedRef` | `boolean` | Evita gravaÃ§Ã£o duplicada no histÃ³rico |
| `backStackRef` | `Screen[]` | Pilha de telas anteriores para swipe â†’ |
| `forwardStackRef` | `Screen[]` | Pilha de telas avanÃ§Ã¡veis para swipe â† |
| `returnToRef` | `Screen` | Guarda a origem de fluxos modais/avanÃ§ados |
| `screenRef` | `Screen` | Espelha a tela atual para handlers estÃ¡veis |

Hooks usados:
- `useDeviceInfo('cloudflare')` â†’ `deviceInfo`
- `useSpeedTest()` â†’ `test`
- `useSettings()` â†’ `settings, updateSettings`

**Pilha de navegaÃ§Ã£o:**

```
goTo(next):    push(currentScreen) em backStack; clear forwardStack; setScreen(next)
goBack():      pop() de backStack â†’ push(currentScreen) em forwardStack; setScreen(prev)
goForward():   pop() de forwardStack â†’ push(currentScreen) em backStack; setScreen(next)
goToReturnTarget(): clear forwardStack; setScreen(returnToRef.current) sem empilhar a tela atual
```

TransiÃ§Ãµes normais usam `goTo`, alimentando a pilha de back automaticamente. Retornos de fluxos avanÃ§ados (`Comparison`, `BeforeAfter`, `RoomTest`, `History`) usam `goToReturnTarget()` para voltar Ã  origem sem criar loop na pilha.

**Swipe lateral:** wrapper `<div onTouchStart onTouchEnd>` em torno da view ativa. Em `onTouchStart` registra `{x, y, valid}` (vÃ¡lido se o alvo nÃ£o estÃ¡ em `.lk-sheet`, `.lk-history__list`, `button`, `input`, `textarea` ou `a`). Em `onTouchEnd` calcula `dx`/`dy`; aceita gesto se `|dx| â‰¥ 80 px` e `|dx| > |dy| Ã— 1.5`. `dx > 0` â†’ `goBack`; `dx < 0` â†’ `goForward`.

**`effectiveConnection`:** computado em todo render como `settings.connectionOverride !== 'auto' ? override : deviceInfo.device?.connectionType`. Usado em `handleStart`/`handleRetry` ao chamar `test.start(effectiveConnection)`.

**Fluxo de gravaÃ§Ã£o automÃ¡tica:**

```
test.phase === 'done' && test.result && !recordedRef.current
  â”€â”€â”€ Prova Real ativa (provaRealSession !== null): â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  â†’ provaRealResultsRef.push(result)
  â†’ se provaRealSession < 3:
      setProvaRealSession(session + 1); recordedRef = false
      provaRealPendingRef = true; test.reset()
      [efeito idle]: provaRealPendingRef â†’ test.start(effectiveConnection, 'complete')
  â†’ se provaRealSession === 3:
      averaged = averageSpeedResults(provaRealResultsRef)
      appendRecord(averaged, { ..., locationTag? })
      locationTagRef = null; setProvaRealOverride(averaged) â†’ goTo('result')

  â”€â”€â”€ Fluxo normal: â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  â†’ previousRecord() â†’ setPrevious(prev)
  â†’ appendRecord(test.result, { serverName, isp, deviceType, connectionType, testMode, locationTag? })
  â†’ locationTagRef = null; setLastRecord(novoRegistro)
  â†’ comparisonModeRef === 'near' â†’ setComparisonNear(result)    â†’ goTo('comparison')
  â†’ comparisonModeRef === 'far'  â†’ setComparisonFar(result)     â†’ goTo('comparison')
  â†’ baModeRef === 'before'       â†’ setBaBefore(result)          â†’ goTo('beforeafter')
  â†’ baModeRef === 'after'        â†’ setBaAfter(result)           â†’ goTo('beforeafter')
  â†’ else                         â†’ goTo('result')
```

**Fluxo de comparaÃ§Ã£o (ComparisonScreen):**

```
handleStartComparison() â†’ setStep('near') â†’ goTo('comparison')
  [Passo 1] â†’ handleComparisonStartNear()
    â†’ comparisonModeRef = 'near'; goTo('running'); test.start(effectiveConnection, 'complete')
    â†’ [done] â†’ setComparisonNear(result); setStep('far'); goTo('comparison')
  [Passo 2] â†’ handleComparisonStartFar()
    â†’ comparisonModeRef = 'far'; goTo('running'); test.start(effectiveConnection, 'complete')
    â†’ [done] â†’ setComparisonFar(result); setStep('done'); goTo('comparison')
  [Resultado] â†’ calculateComparison(nearResult, farResult)
```

**Fluxo Antes e Depois (BeforeAfterScreen):**

```
handleStartBeforeAfter() â†’ setBaStep('before'); goTo('beforeafter')
  [Passo 1] â†’ handleBAStartBefore()
    â†’ baModeRef = 'before'; goTo('running'); test.start(effectiveConnection, 'complete')
    â†’ [done] â†’ setBaBefore(result); setBaStep('after'); goTo('beforeafter')
  [Passo 2] â†’ handleBAStartAfter()
    â†’ baModeRef = 'after'; goTo('running'); test.start(effectiveConnection, 'complete')
    â†’ [done] â†’ setBaAfter(result); setBaStep('done'); goTo('beforeafter')
  [Resultado] â†’ calculateBeforeAfter(beforeResult, afterResult)
```

**Fluxo Prova Real:**

```
handleStartProvaReal()
  â†’ provaRealResultsRef = []; setProvaRealSession(1); setProvaRealOverride(null)
  â†’ goTo('running'); test.start(effectiveConnection, 'complete')
  â†’ [done Ã— 3, automÃ¡tico] â†’ averageSpeedResults â†’ appendRecord â†’ goTo('result')
  RunningScreen recebe sessionLabel = "Teste X de 3 â€” Prova Real"
```

**Fluxo Teste por local (RoomTestScreen):**

```
handleOpenRoomTest() â†’ goTo('roomtest')
  [RoomTestScreen] â†’ handleRoomStart(locationTag)
    â†’ locationTagRef = locationTag; goTo('running'); test.start(effectiveConnection, 'complete')
    â†’ [done] â†’ appendRecord(result, { ..., locationTag }); locationTagRef = null; goTo('result')
```

**Carregamento inicial do Ãºltimo resultado:**

Um `useEffect` sem deps (executa sÃ³ na montagem) chama `previousRecord()` e popula `lastRecord`, garantindo que o card da StartScreen apareÃ§a mesmo na primeira abertura do PWA na sessÃ£o.

---

## 7.bis Acessibilidade (a11y, 2026-05)

Auditoria conduzida em maio/2026. Pontos cobertos:

1. **Skip-to-main-content** â€” `<a class="lk-skip-link" href="#main-content">` no topo do `App.tsx`. InvisÃ­vel visualmente (translate -200%), materializa-se ao receber foco por teclado. Pula TopBar/back/menu e leva direto pro container principal (`<div id="main-content">`).
2. **Focus visÃ­vel** â€” regra global em `tokens.css` (`:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`). Ativada apenas quando o foco vem do teclado (nÃ£o polui clique). Cobre todos os elementos focÃ¡veis sem precisar de override por componente.
3. **`<button>` real onde havia `<div role="button">`** â€” DNS cell na ResultScreen (cell SECONDARY 4Âª coluna) e itens do HistÃ³rico. Substituem o par `role="button" + tabIndex + onKeyDown` manual por `<button>` nativo com keyboard activation gratuita.
4. **`aria-live="polite"` em status dinÃ¢mico** â€” frase narrativa da `RunningScreen` ("Medindo downloadâ€¦"/"Medindo uploadâ€¦"), banner de upload parcial da `ResultScreen` (`ulFailed=true`), banner "Nova versÃ£o disponÃ­vel" do `PwaUpdatePrompt`.
5. **`aria-busy`** â€” `Skeleton` aceita prop `ariaBusy`; `WifiSignalSection` no estado `loading` aplica `aria-busy="true"` no container.
6. **`aria-modal="true"`** â€” `DraggableSheet` (base universal de sheets) jÃ¡ renderiza `role="dialog" aria-modal="true"` com `aria-labelledby` apontando para o tÃ­tulo da sheet. Body scroll lock + ESC fecha vivem no DraggableSheet, herdados pelos consumidores (AdvancedSheet, GamerSheet, DNSGuideSheet, WifiDetailsSheet, WifiOptimizeSheet).
7. **Inputs sem label visÃ­vel** â€” campos de plano contratado em `HamburgerMenu` ganharam `aria-label` ("Velocidade contratada de download em Mbps", idem upload) e `inputMode="numeric"` para teclado correto em mobile.
8. **`aria-label` em botÃµes sÃ³ com Ã­cone** â€” `BackButton`, `IconButton`, `IconPdf`/`IconShare` no TopBar. JÃ¡ existiam; auditoria confirmou.
9. **SVGs decorativos com `aria-hidden`** â€” primitivos `SVG` e `Icon` em `icons.tsx` agora setam `aria-hidden="true" focusable="false"` por default. Os labels textuais ao lado jÃ¡ comunicam significado; sem isso, o screen reader leria "imagem Â· texto" em duplicidade.
10. **`IOSList` rows clicÃ¡veis** â€” `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space) padronizado dentro do componente, eliminando a necessidade de cada caller adicionar handlers manuais.

`prefers-reduced-motion: reduce` Ã© respeitado pelo `screen-enter`, `Skeleton`, `LiveChart`, `useCountUp` e `InfoTooltip`.

---

## 8. CSS e tokens (`src/tokens.css`)

### Temas

```css
[data-theme="dark"]  { --bg: #09090F; --bg-elev: #0A0A0C; --surface: #131318; --surface-2: #1C1C24; --surface-3: #25252F; --border: rgba(255,255,255,0.08); --hairline: rgba(255,255,255,0.06); --text: #F5F5FA; ... }
[data-theme="light"] { --bg: #F2F2F7; --bg-elev: #FFFFFF; --surface: #FFFFFF; --surface-2: #F2F2F7; --surface-3: #ECECF1; --border: rgba(0,0,0,0.08); --hairline: rgba(0,0,0,0.06); --text: #0D0D1A; ... }
```

`--bg: #F2F2F7` no light segue o System Gray 6 do iOS (linguagem iOS-Calma do design system).

### Tokens globais (ambos os temas)

| Token | Valor | Uso |
|---|---|---|
| `--accent` | `#6C2BFF` | Cor primÃ¡ria da marca |
| `--accent-tint` | `rgba(108,43,255,0.14)` | Fundo tintado de elementos accent |
| `--dl` | `#3AB6FF` | Download (azul) |
| `--dl-tint` | `rgba(58,182,255,0.14)` | Fundo tintado DL |
| `--dl-glow` | `rgba(96,165,250,0.40)` dark / `rgba(37,99,235,0.30)` light | **Glow tokens (pacote premium 2026-05)** â€” exclusivo do hero number Download da `ResultScreen`. Aplicado via `text-shadow: 0 0 16px var(--dl-glow) !important` no `.lk-result__primary-cell-value` da primeira coluna. Override do reset universal (ver Â§7 Regras globais). Alpha menor em light pra mesma percepÃ§Ã£o. |
| `--ul` | `#22C55E` | Upload (verde) |
| `--ul-tint` | `rgba(34,197,94,0.14)` | Fundo tintado UL / Chip good |
| `--ul-glow` | `rgba(52,211,153,0.40)` dark / `rgba(22,163,74,0.30)` light | Pareado com `--dl-glow`, mesma mecÃ¢nica para Upload (segunda coluna do bloco PRIMARY). |
| `--success-glow` | `rgba(52,211,153,0.30)` dark / `rgba(22,163,74,0.22)` light | **Glow do card de DiagnÃ³stico â€” estado healthy.** Aplicado via `box-shadow` no `.lk-result__combined` quando `aggregateDiagnosisSeverity` retorna `healthy`. Selecionado no TSX como `var(--success-glow)` e injetado como `--diag-glow-color`. |
| `--warn-glow` | `rgba(251,191,36,0.30)` dark / `rgba(217,119,6,0.22)` light | **Glow do card de DiagnÃ³stico â€” estado warn.** Mesma mecÃ¢nica do `--success-glow` para a severidade `warn` (algum item warn, nenhum fail). |
| `--error-glow` | `rgba(248,113,113,0.30)` dark / `rgba(220,38,38,0.22)` light | **Glow do card de DiagnÃ³stico â€” estado fail.** Severidade `fail` (algum item fail). AnimaÃ§Ã£o `lk-result-diag-glow` faz pulse 24px â†” 32px de blur em loop infinito de 4s; mesmo tempo nos 3 estados, sÃ³ a cor muda. |
| `--warn` | `#F5A623` | AtenÃ§Ã£o / amarelo |
| `--error` | `#FF453A` | Erros e falhas |
| `--info` | `#3AB6FF` | InformaÃ§Ã£o |
| `--font-display` | `'Geist', system-ui, -apple-system, sans-serif` | NÃºmeros hero e tÃ­tulos |
| `--font-body` | `'Geist', system-ui, -apple-system, sans-serif` | Texto corrido |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` | Valores numÃ©ricos monospace |
| `--bg-radial` | `radial-gradient(120vmax 120vmax at 50% 30%, ...)` | Fundo do `body` com radial sutil para dar profundidade â€” Bloco 3 (Polimento, 2026-05). Centro 1-2 stops mais claro que a borda em ambos os temas. Containers raiz das telas (`.lk-start`, `.lk-running`, `.lk-result`, etc.) usam `background: transparent` para que o radial apareÃ§a por trÃ¡s. **RecalibraÃ§Ã£o 2026-05 (terceira passada â€” depth fade removido):** edges achatadas para reduzir contraste com `--surface-deep` dos cards. Dark: edge `#06060A` â†’ `#0E0F18` (de ~10 para ~3 pontos por canal abaixo do centro `#11121A`); stop intermediÃ¡rio (60%) eliminado â€” radial Ã© agora 0% â†’ 100% direto. Light: edge `#F2F1EC` â†’ `#FAFAF7` (= `--bg`); ~3 pontos por canal abaixo do centro `#FDFDFB`. Profundidade ainda existe, mas o "step" visÃ­vel onde o card termina e o body aparece (zona escura do radial vs `--surface-deep` claro) deixa de ser perceptÃ­vel como faixa. |
| `--surface-deep` | `#11121A` (dark) / `#FBFBFD` (light) | **Tom canÃ´nico de card.** Em dark, replica o centro do `--bg-radial` para que o card pareÃ§a "vazar" no body â€” alinha visualmente com o bloco Resposta/OscilaÃ§Ã£o/Falhas (`.lk-result__secondary-block`, transparent). Aplicado em todos os cards principais: `.lk-result__primary-block`, `.lk-result__use-row`, `.lk-result__combined`, `.lk-history__diagnosis`, `.lk-history__list`, `.lk-history__insight`, `.lk-hist-detail__hero`, `.lk-cmp__preview`, `.lk-cmp__verdict`, `.lk-cmp__table`, `.lk-wifi-card`, `.lk-ba__preview`, `.lk-ba__verdict`, `.lk-ba__table`, `.lk-diag__card`, `.lk-rec-screen__card`, `.lk-section-card`, `.lk-history-card`, `.lk-dns__current`, `.lk-start__last-card`, `.lk-local-wifi__card`, `.lk-ios-list` (container do IOSList â€” fechamento da unificaÃ§Ã£o 2026-05) e `.card` (utility global em `tokens.css`). `--surface` ficou reservado a sheets sobrepostas (HamburgerMenu, BottomSheet) que precisam contrastar com o body. |
| `--radius` | `16px` | Border-radius de cards |
| `--radius-sm` | `8px` | Border-radius pequeno |
| `--radius-lg` | `20px` | Border-radius grande |
| `--radius-xl` | `28px` | Border-radius extra-largo |
| `--radius-button` | `12px` | Border-radius de botÃµes |
| `--radius-pill` | `100px` | Border-radius de pÃ­lulas/chips |
| `--t-fast` | `180ms cubic-bezier(0.32,0.72,0,1)` | TransiÃ§Ãµes rÃ¡pidas |
| `--t-med` | `280ms cubic-bezier(0.32,0.72,0,1)` | TransiÃ§Ãµes padrÃ£o |
| `--t-slow` | `480ms cubic-bezier(0.32,0.72,0,1)` | TransiÃ§Ãµes lentas |
| `--space-xs` | `4px` | EspaÃ§amento base |
| `--space-sm` | `8px` | |
| `--space-md` | `12px` | |
| `--space-lg` | `16px` | |
| `--space-xl` | `24px` | |
| `--space-2xl` | `32px` | |
| `--space-3xl` | `48px` | |

### Bloco 4 â€” PropagaÃ§Ã£o tipogrÃ¡fica e hero card pattern (2026-05)

SequÃªncia de polimentos em CSS-only que estende o trabalho do Bloco 2 (Hero confiante) para fora da ResultScreen, sem novos tokens, sem novas libs e sem alterar JSX.

**PropagaÃ§Ã£o tipogrÃ¡fica `--font-mono` â†’ `--font-display`:** valores numÃ©ricos em destaque migrados de JetBrains Mono para Geist em telas onde a densidade do mono nÃ£o compensa a inconsistÃªncia com a marca. Arquivos tocados:

- `StartScreen.css` â€” `.lk-start__last-values` (peso 700, 13px) e label do `.lk-start__orb` (peso 700, 22px, era 600/20).
- `HistoryScreen.css` â€” `.lk-history__summary-metrics` (display 700, 22px com `tabular-nums`).
- `ComparisonScreen.css` â€” `.lk-cmp__val` (display 600) e `.lk-cmp__drop` (display 700), ambos preservando `tabular-nums` para alinhamento tabular.
- `GamerScreen.css` â€” `.lk-gamer__stat-value` (display 700, 22px, era mono 600).
- `DetailsScreen.css` â€” `.lk-details__metric-sub` ganhou `font-family: var(--font-display)` peso 600 (antes herdava body sem family explÃ­cita).

A lista do histÃ³rico (`.lk-history__row2`, `.lk-history__date`) **nÃ£o foi migrada** â€” mantÃ©m mono para preservar densidade em rolagem longa de registros. DiagnosticScreen nÃ£o foi tocada (badges jÃ¡ 600, hero-title jÃ¡ display 700/24px desde Bloco 2).

**Hero card pattern (canÃ´nico em `.lk-result__hero`):** flex column, gap 8, padding `18px 18px 16px`, margin-bottom 14, `background: var(--surface-deep)` (era `--surface` antes da unificaÃ§Ã£o visual de 2026-05), `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)`. TÃ­tulo Geist 700 26px line 1.15 letter `-0.01em`; subtÃ­tulo Geist 14px line 1.4 color `--text-2`. Adotado em:

- `HistoryScreen.css` `.lk-hist-detail__hero` â€” anteriormente apenas padding solto; agora card visÃ­vel com chip + tÃ­tulo + subtÃ­tulo (tÃ­tulo bumpou de 20â†’26px, sub de 12â†’14px).
- `ComparisonScreen.css` `.lk-cmp__verdict` â€” variante "verdict" do hero card. MantÃ©m o `border-left: 4px solid` caracterÃ­stico (declarado depois de `border: 1px solid`, sobrepondo apenas a esquerda) e os modificadores de cor por diagnÃ³stico (`--coverage_issue`, `--both_bad`, `--both_good`). Tipografia da mensagem promovida a Geist 700 24px line 1.2 letter `-0.01em` â€” a mensagem do verdict virou o headline do card.

**Glow do orb (StartScreen):** `.lk-start__orb` usa `filter: drop-shadow(0 0 14px var(--accent-glow))` para o glow circular. **Bloco 6 â€” UX uniforme (2026-05):** o `box-shadow: 0 20px 40px -15px var(--accent-glow)` foi removido para cumprir a regra global "zero box-shadow"; o blur do drop-shadow subiu de 10px â†’ 14px para compensar. `transition` reduzida (sem `box-shadow`).

### Regras globais

- Zero `box-shadow` â€” proibido pelo branding linka
- Zero `text-shadow` â€” reforÃ§ado por reset universal `*, *::before, *::after { text-shadow: none !important }` em `tokens.css`. **ExceÃ§Ã£o Ãºnica (pacote premium 2026-05):** o hero number do bloco PRIMARY da `ResultScreen` (`.lk-result__primary-cell-value`) recebe glow controlado via `text-shadow: 0 0 16px var(--dl-glow|--ul-glow) !important`. Confinado Ã s duas cÃ©lulas. Qualquer novo `text-shadow` deve ser justificado e documentado aqui.
- `body { background-color: var(--bg); background-image: var(--bg-radial); background-attachment: fixed; ... }` â€” radial sutil aplicado no `body`; containers raiz das telas usam `background: transparent`. **O `background-color: var(--bg)` Ã© o backstop sÃ³lido do body** (caso o radial nÃ£o pinte alguma regiÃ£o).
- **Depth fade do rodapÃ© (Bloco 7 â€” Polimento, 2026-05) â€” REMOVIDO em 2026-05 (terceira passada).** Original: `#root` ganhava `position: relative; isolation: isolate;` + `#root::after` com `linear-gradient(to top, var(--bg-fade-bottom), transparent)` nos Ãºltimos 140-200px do viewport. **Por que foi removido:** mesmo com alpha reduzido para 0.18 (segunda passada), o usuÃ¡rio continuava lendo o efeito como "barra escura" no rodapÃ©, nÃ£o como fade contÃ­nuo. InvestigaÃ§Ã£o revelou que a faixa visÃ­vel **nÃ£o vinha do `#root::after`** â€” vinha do contraste do prÃ³prio `--bg-radial`: o edge `#06060A` (~10 pts por canal abaixo do `--surface-deep` `#11121A`) criava um step perceptÃ­vel na zona onde o card termina e o body aparece. Reduzir o alpha do fade nÃ£o resolveu porque o fade nÃ£o era a causa. SoluÃ§Ã£o final: remover `#root::after` + token `--bg-fade-bottom` (dark e light) + `position: relative` e `isolation: isolate` do `#root` (existiam **sÃ³** para conter o pseudo-element â€” verificaÃ§Ã£o via grep confirmou que nenhum descendente depende deles), e achatar o radial (ver `--bg-radial`). Os z-index dos descendentes de #root (TopBar 50, BottomSheet 99/100, HamburgerMenu 100, DNSGuide 199/200, PwaUpdatePrompt 9999) ficam no stacking context da raiz da pÃ¡gina â€” sem regressÃ£o porque nÃ£o hÃ¡ nenhum elemento fora de #root competindo com eles. **Aprendizagem registrada para evitar recorrÃªncia:** (1) alpha agressivo em curva curta vira banding, nÃ£o fade; (2) faixas visÃ­veis no rodapÃ© costumam ser contraste de fundo (radial edge vs surface-deep dos cards), nÃ£o overlay â€” investigar a causa raiz antes de ajustar o overlay; (3) tons de borda em radials full-viewport devem ficar a poucos pontos do tom dos cards opacos para nÃ£o criar "step" visÃ­vel na transiÃ§Ã£o. **PrÃ³ximo passo se mesmo assim o usuÃ¡rio reportar barra:** eliminar o radial inteiramente (`--bg-radial: var(--bg)`) â€” cor sÃ³lida no body, sem efeito de profundidade, mas zero contraste indesejado.
- **PWA iOS standalone â€” fix da faixa branca no home indicator (2026-05):** `html`, `body` e `#root` recebem `background-color: var(--bg)` (cor sÃ³lida) alÃ©m do radial no body. O `html` **nÃ£o** recebe o gradiente â€” sÃ³ cor sÃ³lida. Motivo: com `viewport-fit=cover` no `index.html`, o canvas se estende por baixo da home indicator do iPhone; se o `html` ficar com `background-color: transparent` (default ou efeito do shorthand `background:` sem cor), o iOS pinta essa Ã¡rea de branco em PWA standalone. Manter cor sÃ³lida no `html` garante que a faixa do home indicator combine com o tema. `#root` tambÃ©m recebe a cor como backstop para regiÃµes de rubber band. Telas (`.lk-result`, `.lk-history`, `.lk-start`, etc.) continuam com `background: transparent` para o radial do body aparecer entre cards. Acompanhante obrigatÃ³rio: `index.html` precisa ter `<meta name="viewport" content="..., viewport-fit=cover">` + `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` + `<meta name="theme-color" content="#0A0A0F" media="(prefers-color-scheme: dark)">` / `#FAFAF7` light.

---

## 9. PWA (`vite.config.ts`)

Plugin VitePWA configurado com:

```ts
manifest: {
  name: 'linka SpeedTest',       // "linka" minÃºsculo â€” obrigatÃ³rio por branding
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

#### 9.0 Audit de Ã­cones e manifest (2026-05)

**InventÃ¡rio de assets** (`public/` e `android/app/src/main/res/mipmap-*`):

| Categoria | Tamanho | Arquivo | Status |
|---|---|---|---|
| PWA web (any) | 192Ã—192 | `public/icon-192.png` | âœ… presente, declarado |
| PWA web (any) | 512Ã—512 | `public/icon-512.png` | âœ… presente, declarado |
| PWA web (maskable) | 192Ã—192 | `public/icon-maskable-192.png` | âœ… presente, declarado |
| PWA web (maskable) | 512Ã—512 | `public/icon-maskable-512.png` | âœ… presente, declarado |
| PWA web (vetor) | any | `public/icon.svg` | âœ… presente, declarado (2026-05) |
| Favicon | 16/32 | `public/favicon.ico` | âœ… presente, declarado em `index.html` (2026-05) |
| Apple touch icon | 180Ã—180 | `public/apple-touch-icon.png` | âœ… presente, declarado (2026-05 â€” antes apontava para `icon-maskable-192.png`, tamanho errado) |
| Apple touch icon | 152Ã—152 | `public/touch-icon/ios/AppIcon@2x~ipad.png` | âœ… presente, declarado (2026-05) |
| Apple touch icon | 167Ã—167 | `public/touch-icon/ios/AppIcon-83.5@2x~ipad.png` | âœ… presente, declarado (2026-05) |
| Apple touch icon | 120Ã—120 | `public/touch-icon/ios/AppIcon@2x.png` | âœ… presente, declarado (2026-05) |
| iOS legacy | 76, 60, 40, 29, 20 | `public/touch-icon/ios/*.png` | âœ… presentes, **nÃ£o declarados em index.html** (cobertos por size mais prÃ³ximo) |
| Splash iOS standalone | mÃºltiplos | â€” | âŒ **GAP** â€” `apple-touch-startup-image` nÃ£o declarado; iOS standalone mostra splash branco |
| Android Adaptive (mdpiâ†’xxxhdpi) | 48â†’192 | `android/.../res/mipmap-*/ic_launcher.png` | âœ… presentes |
| Android foreground | 108â†’432 | `android/.../res/mipmap-*/ic_launcher_foreground.png` | âœ… presentes |
| Android background | cor sÃ³lida | `android/.../res/values/ic_launcher_background.xml` | âœ… presente (drawable em XML) |
| Android adaptive (anydpi-v26) | â€” | `android/.../res/mipmap-anydpi-v26/ic_launcher.xml` | âœ… presente |
| Android Play Store | 512Ã—512 | `public/android/play_store_512.png` | âœ… presente (uso para upload de Play Store) |

**Bugs corrigidos no audit (2026-05).**

1. `<link rel="apple-touch-icon" sizes="192x192" href="/icon-maskable-192.png">` â€” tamanho declarado errado (192) e arquivo errado (maskable, que iOS renderiza com cantos quadrados, nÃ£o circulares). Corrigido para `sizes="180x180" href="/apple-touch-icon.png"`.
2. `index.html` nÃ£o declarava `<link rel="icon" href="/favicon.ico" sizes="any">` mesmo com o arquivo presente â€” alguns user agents (Edge legacy, Safari macOS) usam o ICO como fallback de bookmark.
3. `<meta name="apple-mobile-web-app-title">` ausente â€” quando o usuÃ¡rio adiciona Ã  home screen no iOS, o nome curto sai como "linka SpeedTest" inteiro. Adicionado com valor `"linka Speed"`.

**PendÃªncias conhecidas.**

- **Splash screens iOS standalone** â€” sem `apple-touch-startup-image`, o PWA iOS adicionado Ã  home screen mostra splash branco antes do `--bg`. SoluÃ§Ã£o simples: gerar 1 splash 2048Ã—2732 com logo centralizado e declarar como genÃ©rico. SoluÃ§Ã£o completa: gerar 8+ splashes especÃ­ficos por device (1290Ã—2796 iPhone 15 Pro Max, 1284Ã—2778 iPhone 14 Plus, 1170Ã—2532 iPhone 13/14, 750Ã—1334 iPhone SE, etc.) com `media` queries.
- **Android monochrome icon** (Android 13+ themed icons) â€” existe `public/android/res/mipmap-*/ic_launcher_monochrome.png` mas nÃ£o estÃ¡ copiado para `android/app/src/main/res/mipmap-*`. PendÃªncia: copiar os 5 PNGs e declarar `<monochrome>` no `mipmap-anydpi-v26/ic_launcher.xml`.

#### Comando ImageMagick para regenerar Ã­cones a partir do SVG mestre

`public/icon.svg` Ã© o mestre (logo branco arco + ponto sobre fundo `#5B3FE8`, 100Ã—100 viewBox). Quando precisar regenerar PNGs em qualquer tamanho ou trocar o branding, rodar a partir da raiz do repo:

```bash
# Requer ImageMagick 7+ (`magick` em vez de `convert` desde IM 7) e librsvg
# (mais fiel a SVG complexo que o renderer interno do IM).

# PWA web base (any)
magick -background none -resize 192x192 public/icon.svg public/icon-192.png
magick -background none -resize 512x512 public/icon.svg public/icon-512.png

# Maskable (Android adaptive). Padding interno de 20% (Ã¡rea "safe zone"
# que mascara nÃ£o corta). Renderiza o SVG num canvas 80% do tamanho final
# centralizado, com fundo da cor da marca.
magick -background "#5B3FE8" -resize 154x154 public/icon.svg \
       -gravity center -extent 192x192 public/icon-maskable-192.png
magick -background "#5B3FE8" -resize 410x410 public/icon.svg \
       -gravity center -extent 512x512 public/icon-maskable-512.png

# Apple touch icon (iPhone moderno)
magick -background "#5B3FE8" -resize 180x180 public/icon.svg public/apple-touch-icon.png

# Favicon multi-resoluÃ§Ã£o
magick -background none public/icon.svg \
       -define icon:auto-resize=16,32,48,64 public/favicon.ico

# Android Play Store
magick -background "#5B3FE8" -resize 512x512 public/icon.svg public/android/play_store_512.png
```

Para os Android Adaptive Icons (`mipmap-*/ic_launcher_foreground.png`), o foreground precisa ser 432Ã—432 com a Ã¡rea visÃ­vel centralizada num cÃ­rculo de raio ~132 (264Ã—264). Comando:

```bash
# Foreground com safe-zone 264Ã—264 centralizada em canvas 432Ã—432 transparente
for density in mdpi:108 hdpi:162 xhdpi:216 xxhdpi:324 xxxhdpi:432; do
  IFS=: read -r d size <<< "$density"
  inner=$((size * 264 / 432))
  magick -background none -resize ${inner}x${inner} public/icon.svg \
         -gravity center -extent ${size}x${size} \
         android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png
done
```

Importante: rodar `npx cap sync android` apÃ³s substituir Ã­cones em `public/` ou `android/.../res/` se o build for via Capacitor â€” para sincronizar `dist/` e `capacitor.config.ts`.

Service worker gerado automaticamente. Sem runtime caching configurado (app nÃ£o tem assets dinÃ¢micos para cachear alÃ©m do shell).

Testes com Vitest: `test: { environment: 'node' }` na mesma config.

#### Service Worker e atualizaÃ§Ã£o Ã¡gil (2026-05)

Problema motivador: no Safari/iOS, o ciclo de vida padrÃ£o do SW Ã© conservador â€” um SW novo sÃ³ assume controle quando todas as abas/instÃ¢ncias da PWA sÃ£o fechadas. Em prÃ¡tica, atualizaÃ§Ãµes ficavam "presas" por dias.

CombinaÃ§Ã£o aplicada no projeto:

1. **`registerType: 'autoUpdate'`** (no plugin VitePWA): registra o SW automaticamente e dispara o ciclo de update quando o `sw.js` muda.
2. **`workbox.skipWaiting: true`** + **`workbox.clientsClaim: true`**: o SW novo entra em `activate` imediatamente apÃ³s `install` e assume controle de todas as pÃ¡ginas abertas â€” sem precisar fechar a aba.
3. **`workbox.cleanupOutdatedCaches: true`**: remove caches Workbox antigos no activate, evitando que conteÃºdo stale sobreviva.
4. **VerificaÃ§Ã£o periÃ³dica a cada 60s** via `registration.update()`: forÃ§a o navegador a re-baixar `/sw.js` e comparar; se mudou, dispara `onNeedRefresh`. Configurada em `src/components/PwaUpdatePrompt.tsx`.
5. **Banner UX** (`PwaUpdatePrompt`): quando `needRefresh === true`, mostra um pill fixo no rodapÃ© com "Nova versÃ£o disponÃ­vel" + botÃ£o **Atualizar** (chama `updateServiceWorker(true)` que ativa o SW novo e recarrega) + botÃ£o fechar (snooze atÃ© a prÃ³xima visita). Renderizado no nÃ­vel raiz de `App.tsx`.

Tipos para o mÃ³dulo virtual `virtual:pwa-register/react` ficam em `src/types/pwa.d.ts` (o `tsconfig.app.json` declara apenas `vite/client` em `types`, entÃ£o o ambient module do `vite-plugin-pwa/client` nÃ£o Ã© carregado automaticamente).

**RecomendaÃ§Ã£o para o servidor de PWA hospedada (Cloudflare Pages / Nginx):**

CabeÃ§alhos de cache obrigatÃ³rios para que o ciclo acima funcione de fato â€” caso contrÃ¡rio, a CDN entrega `sw.js` antigo do edge cache e o cliente nunca vÃª a nova versÃ£o.

```
/sw.js              â†’ Cache-Control: no-cache, no-store, must-revalidate
/workbox-*.js       â†’ Cache-Control: no-cache, no-store, must-revalidate
/manifest.webmanifest â†’ Cache-Control: no-cache
Demais assets       â†’ cache normal (hash no nome do arquivo jÃ¡ Ã© cache-buster)
```

Em Cloudflare Pages, configurar via arquivo `_headers`:

```
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
/workbox-*.js
  Cache-Control: no-cache, no-store, must-revalidate
```

> PendÃªncia: o arquivo `_headers` ainda nÃ£o foi criado. Quem fizer o prÃ³ximo deploy hospedado deve adicionÃ¡-lo na raiz de `public/` antes de publicar. Sem isso, a CDN cacheia `sw.js` por TTL padrÃ£o e a estratÃ©gia perde efeito.

**APK Capacitor:** o ciclo de update do Service Worker Ã© independente do ciclo de update do APK. O APK serve `dist/` empacotado via `capacitor://localhost`; quando uma nova versÃ£o do APK Ã© instalada (Play Store / sideload), todos os assets sÃ£o substituÃ­dos, o SW detecta `sw.js` novo no prÃ³ximo open e o `skipWaiting`/`clientsClaim` aplica a atualizaÃ§Ã£o. Nenhum ajuste especÃ­fico no Capacitor Ã© necessÃ¡rio.

#### Globais injetadas via `define` (2026-05)

| Global | Tipo | Origem | Consumidor |
|---|---|---|---|
| `__APP_VERSION__` | `string` | `package.json` lido via `readFileSync` no `vite.config.ts` | Accordion "AvanÃ§ado" da `ResultScreen` (item "VersÃ£o do app") |

DeclaraÃ§Ãµes TypeScript em `src/global.d.ts`. Em ambientes onde a global nÃ£o Ã© injetada (alguns runners de teste, fixtures), o ResultScreen guarda com `typeof __APP_VERSION__ !== 'undefined'` e o item simplesmente some.

### 9.1 Android nativo via Capacitor

O APK Android Ã© gerado a partir do mesmo `dist/` do PWA usando Capacitor.

**ConfiguraÃ§Ã£o:** `capacitor.config.ts`

```ts
appId: 'br.com.linka.speedtest'
appName: 'linka SpeedTest'
webDir: 'dist'
```

**Projeto nativo:** `android/`

- `android/app/src/main/AndroidManifest.xml` declara apenas `android.permission.INTERNET`.
- `android/app/src/main/java/br/com/linka/speedtest/MainActivity.java` Ã© a Activity Capacitor.
- `android/app/src/main/res/values/strings.xml` mantÃ©m branding `linka SpeedTest`.

**Toolchain local:** `_android-toolchain/` (ignorado pelo Git)

- Android Command-line Tools: `cmdline-tools/latest`.
- SDK instalado: `platform-tools`, `platforms;android-36`, `build-tools;36.1.0`.
- JDK local: Microsoft OpenJDK 21 LTS.
- Gradle cache: `_android-toolchain/gradle-home`.

**Build de APK debug:**

```powershell
npm run android:apk
```

SaÃ­da obrigatÃ³ria: `builds/apk/linkaSpeedtestPwa-v{versionName}-code{versionCode}-{buildType}-{yyyyMMdd-HHmmss}-{gitSha}.apk`.

**Regra obrigatÃ³ria de versionamento e entrega:**

- Nenhuma IA deve entregar APK diretamente de `android/app/build/outputs/...`.
- Nenhuma IA deve sobrescrever APK anterior.
- O script `scripts/build-android-apk.ps1` copia o APK para `builds/apk/` e falha se o arquivo de destino jÃ¡ existir.
- `versionName` vem de `package.json` e deve seguir SemVer (`MAJOR.MINOR.PATCH`).
- `versionCode` segue padrÃ£o compatÃ­vel com distribuiÃ§Ã£o Android: `MAJOR*1000000 + MINOR*10000 + PATCH*100 + BuildNumber`.
- Build debug usa `BuildNumber=0` por padrÃ£o.
- Build release/mercado exige `-BuildType release -BuildNumber N`, com `N > 0`, para manter versionCode monotÃ´nico.
- Para Play Store, o formato de mercado Ã© AAB. APK neste projeto Ã© artefato para instalaÃ§Ã£o manual, homologaÃ§Ã£o ou distribuiÃ§Ã£o interna.

Exemplos:

```powershell
npm run android:apk
.\scripts\build-android-apk.ps1 -BuildType release -BuildNumber 1
```

---

## 10. Deploy â€” Cloudflare Pages

**Projeto:** `linkaSpeedtestPwa`  
**Branch de produÃ§Ã£o:** `main`

**Comando de build:**
```bash
npm run build    # â†’ dist/
```

**Comando de deploy:**
```bash
npx wrangler pages deploy dist --project-name linkaSpeedtestPwa --branch main
```

**Endpoints Cloudflare usados:**

| Endpoint | Uso |
|---|---|
| `speed.cloudflare.com/__down?bytes=N` | Download (GET, retorna N bytes aleatÃ³rios) |
| `speed.cloudflare.com/__up` | Upload (POST com Blob) |
| `speed.cloudflare.com/cdn-cgi/trace` | IP, colo, localizaÃ§Ã£o |
| `speed.cloudflare.com/meta` | ISP (campo `asOrganization`) |

---

## 10. Testes (`src/__tests__/`)

**Framework:** Vitest com `environment: 'node'`

| Arquivo | Testes | Cobertura |
|---|---|---|
| `classifier.test.ts` | 12 | `RULE_SET_VERSION`, `classify()` â€” 5 quality + 7 tags |
| `connectionProfile.test.ts` | 4 | `toConnectionProfile()` â€” mapeamento ConnectionType â†’ ConnectionProfile |
| `interpret.test.ts` | 95 | `interpretSpeedTestResult()` â€” motor unificado |
| `combinedDiagnosis.test.ts` | 14 | `combineDiagnostics()` â€” causas combinadas e confianÃ§a |
| `LocalWifiService.test.ts` | 19 | helpers de frequÃªncia/canal/qualidade + fallback PWA |
| `share.test.ts` | 4 | `buildShareText()`, `shareResultText()` |
| `compare.test.ts` | 12 | `calculateComparison()` â€” coverage_issue, both_bad, both_good, percentuais, edge cases |

**Total:** 175 testes passando.

**Comando:** `npm test`

**Regra:** os testes **nunca podem ser quebrados** sem justificativa documentada e plano de substituiÃ§Ã£o. MudanÃ§as em `classifier.ts` ou `src/core/` exigem atualizaÃ§Ã£o dos testes correspondentes.

---

## 11. DiagnÃ³stico Wi-Fi nativo (`src/features/local-wifi/`)

Feature isolada para estimar qualidade do link Wi-Fi local no app nativo. No PWA, o item de navegaÃ§Ã£o fica oculto; se a rota for acessada diretamente, o fallback seguro informa indisponibilidade sem tentar bridge nativa.

### Capability (`src/platform/capabilities.ts`)

```ts
interface AppCapabilities { localWifiDiagnostics: boolean }
getCapabilities(): AppCapabilities
isNativeApp(): boolean
```

DetecÃ§Ã£o atual: `window.Capacitor`, `window.ReactNativeWebView` ou userAgent contendo `LinkaNative`.

### ServiÃ§o (`LocalWifiService.ts`)

Exports pÃºblicos:
- `bandFromFrequency`
- `channelFromFrequency`
- `classifyWifiQuality`
- `classifyWifiChannel`
- `buildWifiCopy`
- `wifiQualityLabel` (2026-05) â€” Ãºnico conversor `WifiQuality` â†’ label pt-BR ("Excelente / Bom / RazoÃ¡vel / Fraco / CrÃ­tico / IndisponÃ­vel"). Substitui maps inline antes existentes em `LocalWifiScreen` e `WifiSignalCard` â€” proÃ­be strings em inglÃªs na UI.
- `toCombinedWifiInput`
- `runLocalWifiDiagnostics`

Comportamento:
- PWA/web (`localWifiDiagnostics === false`) â†’ indisponÃ­vel
- nativo (`true`) â†’ tenta bridge via `Capacitor.Plugins.LinkaWifiDiagnostics.getWifiInfo()` (padrÃ£o Capacitor 8) ou fallback `window.LinkaWifiDiagnostics.getWifiInfo()` (compat builds antigas)
- falha/ausÃªncia de bridge â†’ indisponÃ­vel (fallback seguro)
- permissÃ£o de localizaÃ§Ã£o negada (Android) â†’ `WifiDiagnosticResult.permissionStatus === 'denied'` propagado via `getUnavailableWifiDiagnosticResult({ permissionStatus, platform })`
- avaliaÃ§Ã£o de canal (MVP heurÃ­stico) por banda:
  - `2.4GHz`: bom `1/6/11`; mÃ©dio adjacentes; ruim demais canais; sugestÃ£o do mais prÃ³ximo em `1/6/11` quando ruim
  - `5GHz`: bom nÃ£o-DFS comuns `36/40/44/48/149/153/157/161`; mÃ©dio outros vÃ¡lidos; ruim invÃ¡lido/desconhecido com sugestÃ£o nÃ£o-DFS mais prÃ³xima
  - `6GHz`: mÃ©dio por padrÃ£o; bom quando canal vÃ¡lido conhecido; sem sugestÃ£o agressiva

### Bridge (`LocalWifiBridge.ts`)

Normaliza payload do bridge para `LocalWifiRawInfo` e valida tipos de nÃºmero/texto.

`resolveBridge()` (2026-05) escolhe o caminho:
1. `Capacitor.Plugins.LinkaWifiDiagnostics?.getWifiInfo` â€” padrÃ£o Capacitor 8 quando o plugin Ã© registrado em `MainActivity.onCreate` via `registerPlugin(LinkaWifiDiagnosticsPlugin.class)`.
2. `window.LinkaWifiDiagnostics?.getWifiInfo` â€” fallback de compat para builds antigas que injetavam a bridge via `addJavascriptInterface`.

### Plugin nativo Android (`LinkaWifiDiagnosticsPlugin.java`) â€” 2026-05

Localizado em `android/app/src/main/java/br/com/linka/speedtest/wifi/LinkaWifiDiagnosticsPlugin.java`. Anotado com `@CapacitorPlugin(name = "LinkaWifiDiagnostics", permissions = { @Permission(strings = ACCESS_FINE_LOCATION, alias = "location") })`.

Fluxo de `getWifiInfo`:
1. Verifica `getPermissionState("location")`. Se nÃ£o for `GRANTED`, dispara `requestPermissionForAlias("location", call, "permissionCallback")`.
2. Se permissÃ£o concedida, lÃª `WifiInfo` preferindo `ConnectivityManager#getNetworkCapabilities().getTransportInfo()` (API 29+) com fallback para `WifiManager#getConnectionInfo()` (deprecated em 31 mas ainda funcional).
3. Calcula canal a partir da `frequencyMhz` (espelho exato de `channelFromFrequency` em TS).
4. LÃª gateway IPv4 e IP local via `LinkProperties` da `Network` ativa.
5. Sanitiza SSID (remove aspas, descarta `<unknown ssid>` e BSSID padrÃ£o `02:00:00:00:00:00`).
6. Resolve com `JSObject` com o shape do `LocalWifiRawInfo`.

`@PermissionCallback permissionCallback` reentra no fluxo apÃ³s a resposta do diÃ¡logo. Se o usuÃ¡rio negou, resolve com `{ available: false, permissionStatus: "denied", platform: "android" }`.

PermissÃµes adicionadas em `AndroidManifest.xml`: `ACCESS_WIFI_STATE`, `ACCESS_NETWORK_STATE`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`. `INTERNET` jÃ¡ existia.

Registro: feito em `MainActivity.onCreate` via `registerPlugin(LinkaWifiDiagnosticsPlugin.class)` ANTES de `super.onCreate()`. Plugin interno (nÃ£o vem de pacote npm) â€” `capacitor.plugins.json` permanece `[]` porque ele Ã© regenerado por `npx cap sync` apenas com plugins NPM; `registerPlugin` programÃ¡tico cobre o nosso caso.

### Adaptador para diagnÃ³stico combinado

`toCombinedWifiInput(result)` retorna shape mÃ­nimo compatÃ­vel com `WifiDiagnosticResult` global (`src/types/index.ts`) sem alterar o contrato existente.

Regras de normalizaÃ§Ã£o:
- `band: 'unknown'` => `undefined`
- `quality: 'unknown'` => `undefined`

### Hook (`useLocalWifi.ts`)

Estado padrÃ£o:

```ts
{ loading: boolean; result: WifiDiagnosticResult | null; error: string | null }
```

API: `run()` executa diagnÃ³stico e devolve resultado/null.

Usado pela `LocalWifiScreen` (modo on-demand). Para auto-fetch embutido em outras superfÃ­cies, ver `useWifiDiagnostics` abaixo.

### Hook auto-fetch (`useWifiDiagnostics.ts`) â€” 2026-05

Variante de `useLocalWifi` pensada para ser embutida em superfÃ­cies onde o diagnÃ³stico deve aparecer sem clique do usuÃ¡rio (ex.: card Wi-Fi na `ResultScreen`).

Estado pÃºblico:

```ts
type WifiDiagnosticsStatus = 'loading' | 'unavailable' | 'permission-denied' | 'available';
interface WifiDiagnosticsState {
  status: WifiDiagnosticsStatus;
  data?: WifiDiagnosticResult;
}
```

Comportamento: dispara `runLocalWifiDiagnostics()` em `useEffect(..., [])`. DistinÃ§Ã£o de "indisponÃ­vel" (2026-05):
- `result.available === true` â†’ `status: 'available'`.
- `result.available === false && result.permissionStatus === 'denied'` â†’ `status: 'permission-denied'` (Android: usuÃ¡rio negou ACCESS_FINE_LOCATION). UI mostra mensagem com call-to-action especÃ­fico.
- demais casos (PWA puro, bridge ausente, exceÃ§Ã£o) â†’ `status: 'unavailable'`.

Cancela atualizaÃ§Ã£o de estado se o componente desmontar antes da resposta. NÃ£o tem `error` nem `run()` â€” quem precisa de retry usa `useLocalWifi` direto.

NÃ£o duplica lÃ³gica: `runLocalWifiDiagnostics` segue como ponto Ãºnico de classificaÃ§Ã£o (banda, qualidade, canal).

### SeÃ§Ã£o embutida (`WifiSignalSection.tsx` + `WifiSignalBar.tsx`, `WifiDetailsSheet.tsx`) â€” refator 2026-05

Componente puro renderizado pela `ResultScreen` quando `connectionType === 'wifi'`. A prÃ³pria `ResultScreen` controla o gating; o componente sÃ³ monta se for visÃ­vel, evitando fetch desnecessÃ¡rio quando o usuÃ¡rio estÃ¡ em cabo ou rede mÃ³vel.

**Refator 2026-05 (barra horizontal):** a representaÃ§Ã£o INLINE no card unificado deixou de ser um card de 4 cells (SSID + chip canal color-coded + WiFi std) e virou uma barra horizontal de qualidade do sinal â€” `<WifiSignalBar>`. O orquestrador `<WifiSignalSection>` substitui o antigo `<WifiSignalCard>` (que estÃ¡ marcado `@deprecated` mas preservado no repo).

**Estados da seÃ§Ã£o (`WifiSignalSection`):**
- `status === 'loading'` â€” placeholder discreto ("Lendo informaÃ§Ãµes do Wi-Fiâ€¦").
- `status === 'permission-denied'` â€” mensagem especÃ­fica em pt-BR: **"PermissÃ£o de localizaÃ§Ã£o necessÃ¡ria para diagnÃ³stico Wi-Fi. Habilite nas configuraÃ§Ãµes do app."** Cor `var(--warn)`.
- `status === 'unavailable'` ou `data.rssiDbm == null` â€” mensagem Ãºnica hardcoded em pt-BR: **"Wi-Fi: detalhes disponÃ­veis somente no app instalado."**.
- `status === 'available'` com `rssiDbm` numÃ©rico â€” `<WifiSignalBar>` clicÃ¡vel (abre `<WifiDetailsSheet>`).

**Componente `<WifiSignalBar>` (substitui o card 4-cells inline):**

Layout em 3 linhas dentro do bloco do card unificado (padding `14px 16px`, `border-top: 1px solid var(--border-subtle)` â€” paridade com `.lk-result__use-row`):

1. **Header** â€” `[WI-FI label]` Ã  esquerda (uppercase 11px tracking 0.08em, `var(--text-3)`) + Ã­cone Wi-Fi sutil 14px Ã  direita (`color: var(--text-3); opacity: 0.65`).
2. **Linha info** â€” `SSID Â· Canal X` em Geist body 14â€“15px. SSID em weight 600; separador `Â·` em `var(--text-3)`; "Canal X" em `var(--text-2)` com `tabular-nums`. Quando `ssid` Ã© null/vazio, fallback "Sua rede"; quando `channel` Ã© null, suprime " Â· Canal X" inteiro.
3. **Barra + %** â€” flex row com gap 12px:
   - Container 8px de altura, `background: var(--surface-2)`, `border-radius: 999px`, `overflow: hidden`.
   - Fill com `width: ${pct}%` inline, `transition: width 600ms cubic-bezier(0.2, 0.7, 0.2, 1)`. Cor por threshold: `var(--success)` â‰¥80%, `var(--warn)` 50â€“79%, `var(--error)` <50%.
   - `% numÃ©rico` Ã  direita, peso 600, `tabular-nums`, cor matching o fill.

**Helpers (`wifiSignal.ts`) â€” 2026-05:**

- `rssiToPercent(rssiDbm: number | null | undefined): number | null` â€” fÃ³rmula linear `2 * (rssi + 100)` clamped 0â€“100. Retorna `null` quando o input Ã© null/undefined (consumidor decide o fallback).
- `signalQualityColor(pct: number): 'good' | 'warn' | 'bad'` â€” threshold visual da barra (â‰¥80 / 50â€“79 / <50).

A separaÃ§Ã£o para um mÃ³dulo dedicado (em vez de `LocalWifiService`) Ã© proposital: a conversÃ£o dBmâ†’% e o mapeamento de cor da barra sÃ£o preocupaÃ§Ãµes puramente de UI. O `classifyWifiQuality` (tÃ©cnico, mistura RSSI + linkSpeed + banda em 5 nÃ­veis) continua sendo a fonte de verdade do copy do diagnÃ³stico â€” nÃ£o Ã© substituÃ­do pelo `signalQualityColor`.

**AnimaÃ§Ã£o de mount:** `WifiSignalBar` usa `useState(0)` + `useEffect` com `requestAnimationFrame` para setar `width` ao percentual final no prÃ³ximo frame â€” a CSS transition cuida do desliza. O `% numÃ©rico` cristaliza no valor final desde o 1Âº render (nÃ£o anima count-up) para acessibilidade: leitor de tela / pausa de motion-reduce mostra o valor correto. `prefers-reduced-motion: reduce` desliga a transiÃ§Ã£o.

**DecisÃ£o: representaÃ§Ã£o inline vs sheet:** o card unificado mostra apenas qualidade visual (SSID curto + canal + barra colorida + %) â€” leitura imediata sem fricÃ§Ã£o. Ao clicar, a `<WifiDetailsSheet>` abre com os 4 dados completos (banda, link speed, padrÃ£o WiFi, grÃ¡fico de canais vizinhos, recomendaÃ§Ãµes). O usuÃ¡rio que sÃ³ quer saber "tÃ¡ bom?" lÃª a barra; o usuÃ¡rio que precisa otimizar abre a sheet.

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

1. **Hero verdict** â€” card com `border-top: 3px solid var(--ribbon-color)`,
   Ã­cone Wi-Fi 44Ã—44 com tint matching a severidade, kicker "Estado do
   Wi-Fi", tÃ­tulo grande do verdict (`Excelente`/`Bom`/`RazoÃ¡vel`/`Fraco`/
   `CrÃ­tico` via `wifiQualityLabel()`) e sub-frase contextual
   ("Sinal forte, canal limpo" / "Sinal mÃ©dio, canal congestionado").
   Cor da ribbon = `var(--success)` para excellent/good, `var(--warn)`
   para fair/weak, `var(--error)` para critical, `var(--text-3)` para
   unknown.
2. **MÃ©tricas 2x2** â€” cards compactos lado a lado: Sinal (cor por dBm:
   â‰¥âˆ’60 verde, â‰¥âˆ’75 amarelo, <âˆ’75 vermelho), Velocidade do link (cor
   apenas em casos ruins: <30 Mbps amarelo, <10 vermelho), Banda, Canal.
   Valores em `var(--font-mono)` com `tabular-nums`.
3. **VisualizaÃ§Ã£o de canais** â€” quando `nearbyNetworks.length > 0`,
   header com "Canais &lt;banda&gt; na Ã¡rea" + count, seguido do
   `<ChannelQualityChart>` (componente preservado). Quando o scan nÃ£o
   retornou nada (PWA puro ou Android <13 sem permissÃ£o), fallback
   simples "Canal X (banda)" + hint "Lista de redes vizinhas
   indisponÃ­vel neste aparelho".
4. **RecomendaÃ§Ã£o inline** â€” `aside` com `var(--accent-tint)` + Ã­cone
   `bulb`. Aparece apenas quando hÃ¡ aÃ§Ã£o Ãºtil. Prioridade:
   (a) `channelQuality === 'bad'` + `suggestedChannel != null` â†’
   "Canal X estÃ¡ mais limpo Â· Pode reduzir interferÃªncia se trocar";
   (b) `quality === 'weak' | 'critical'` â†’ "Sinal fraco Â· aproxime-se
   ou troque para 2.4 GHz" (texto adapta ao band atual);
   (c) `linkSpeedMbps` muito abaixo da capacidade da banda â†’
   "Velocidade abaixo do esperado Â· Verifique padrÃ£o Wi-Fi (ax/ac)".
   Quando nenhuma condiÃ§Ã£o bate, recomendaÃ§Ã£o nÃ£o aparece â€” Wi-Fi
   saudÃ¡vel nÃ£o merece UI extra.
5. **Footer fixo (CTA pareado)** â€” botÃ£o primary `var(--accent)`
   "Como otimizar Wi-Fi" abre `<WifiOptimizeSheet>` por cima; secondary
   outline "Fechar".

AnimaÃ§Ã£o: slide-up de baixo com backdrop fade (200-300ms via `cubic-bezier(0.34, 1.56, 0.64, 1)`). ESC key ou click no backdrop fecha. Body scroll locked enquanto aberto. Sem box-shadow (regra de branding).

**Novo componente: `WifiOptimizeSheet.tsx`**

Bottom-sheet montado por cima do `WifiDetailsSheet` (z-index 10000/10001).
Tutorial em pt-BR com 3 categorias hardcoded:

- **Trocar o canal Wi-Fi** â€” instruÃ§Ãµes para acessar painel do roteador
  e escolher canais 1/6/11 (2.4 GHz) ou 36-48 (5 GHz).
- **Escolher a banda certa** â€” quando 5 GHz vs 2.4 GHz; recomendaÃ§Ã£o
  para roteadores dual-band manterem ambas com nomes diferentes.
- **Posicionar o roteador** â€” local central, em altura, longe de
  microondas/bluetooth.

Cada categoria tem 4 passos numerados em chip purple (`var(--accent-tint)`/
`var(--accent)`). Ãcone por categoria: `swap` (canal), `wifi` (banda),
`router` (posiÃ§Ã£o). CTA Ãºnico "Fechar". O conteÃºdo Ã© fixo (nÃ£o depende
do diagnÃ³stico atual) â€” nÃ£o passa por `copyDictionary`.

**Novo componente: `ChannelQualityChart.tsx`**

AnÃ¡lise visual de canais Wi-Fi. Props:
```ts
interface ChannelQualityChartProps {
  nearbyNetworks?: LocalWifiNetworkInfo[];
  currentChannel?: number;
  suggestedChannel?: number;
  isLoading?: boolean;
}
```

LÃ³gica:
- `analyzeChannels()` agrupa `nearbyNetworks` por canal derivado de `frequencyMhz`
- Calcula RSSI mÃ©dio por canal e classifica qualidade via `classifyRssi()`
- Renderiza flex bar chart com altura proporcional Ã  contagem de APs
- Cores baseadas em dBm: excellent â‰¥ -50, good â‰¥ -60, fair â‰¥ -70, weak â‰¥ -80, critical < -80

Estados:
- `isLoading === true` â€” placeholder "Analisando canaisâ€¦"
- sem `nearbyNetworks` â€” "Nenhum canal detectado"
- com dados â€” grÃ¡fico com legenda 2-col e recomendaÃ§Ã£o opcional

**ExtensÃ£o do plugin Android â€” `LinkaWifiDiagnosticsPlugin.java`**

Novos campos adicionados a `resolveWithWifiInfo()`:
1. `wifiStandard` â€” via `readWifiStandard(WifiInfo)` (API 30+). Retorna "802.11ax", "802.11ac", etc., ou null se < API 30.
2. `nearbyNetworks` â€” via `wifiManager.getScanResults()`. Array de `{ ssid, bssid, frequencyMhz, rssiDbm, capabilities }`. Nullable se scan nÃ£o retornar resultados ou permissÃ£o negada.

Ambos os campos sÃ£o opcionais (`?:`) na interface `LocalWifiRawInfo`; bridge pode retornar apenas dados legÃ­veis conforme disponibilidade de API/permissÃ£o.

**Bridge normalizaÃ§Ã£o â€” `LocalWifiBridge.ts`**

Novo helper `toLocalWifiNetworkArray()` valida e filtra `nearbyNetworks`:
- Requer `ssid`, `bssid`, `frequencyMhz`, `rssiDbm`, `capabilities` vÃ¡lidos (textos/nÃºmeros finitos)
- Omite entries malformadas
- Retorna `undefined` se array vazio ou input invÃ¡lido

Ambos os campos (`wifiStandard`, `nearbyNetworks`) adicionados ao return de `getLocalWifiRawInfoFromBridge()` e propagados via `runLocalWifiDiagnostics()` atÃ© `WifiDiagnosticResult`.

### Tela (`LocalWifiScreen.tsx`)

Conectada em `App.tsx` via rota interna `screen: 'localwifi'`. O item aparece na `ExploreScreen` somente quando `getCapabilities().localWifiDiagnostics === true`.
No PWA comum, a rota mantÃ©m fallback de indisponibilidade sem tocar bridge nativa caso seja acessada diretamente.
Quando o diagnÃ³stico retorna canal, a tela exibe:
- `Canal atual: X`
- `Qualidade do canal: bom/mÃ©dio/ruim` com cor semÃ¢ntica (`--ul`/`--warn`/`--error`)
- `Canal sugerido: Y` somente quando a qualidade do canal Ã© ruim

---

## 11.bis Plugin nativo `PacketLoss` (Android, 2026-05)

Plugin Capacitor interno que mede packet loss real via UDP em vez da heurÃ­stica HTTP/CORS do PWA web.

### Arquivos

- `android/app/src/main/java/br/com/linka/speedtest/packetloss/PacketLossPlugin.java` â€” plugin Java registrado em `MainActivity.onCreate` via `registerPlugin(PacketLossPlugin.class)`.
- `src/utils/packetLoss.ts` â€” bridge web `measurePacketLossNative()`.

### Contrato

Plugin Capacitor expÃµe `Capacitor.Plugins.PacketLoss.measurePacketLoss(opts)`:

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

Para cada pacote (default 50): cria um `DatagramSocket`, envia uma query DNS minimal (12 bytes) para `host:port`, espera resposta com timeout (default 1000ms). Pacote sem resposta no timeout Ã© contado como perdido. Roda em thread separada (`new Thread(...)`) â€” UDP I/O bloqueante nÃ£o pode ficar na main thread Android.

PermissÃ£o necessÃ¡ria: `android.permission.INTERNET` (jÃ¡ declarada no `AndroidManifest.xml`).

### IntegraÃ§Ã£o no orchestrator

`src/utils/speedTestOrchestrator.ts` dispara `measurePacketLossNative()` em paralelo com a fase de upload (mesmo padrÃ£o do `probeDnsResolver`). Quando o resultado nativo estÃ¡ disponÃ­vel, sobrescreve o `packetLoss` heurÃ­stico no `SpeedTestResult` final. O campo `packetLossSource` registra a origem:

| Valor | Significado |
|---|---|
| `'native'` | Plugin Capacitor PacketLoss (UDP real, Android APK) |
| `'estimated'` | HeurÃ­stica do PWA web (timeouts de ping HTTP/CORS) |
| `undefined` | Registro legado ou origem desconhecida |

A UI (`ResultScreen` cell "Falhas" + `AdvancedSheet` row "Falhas na conexÃ£o") mostra label sutil "estimado" â€” `font-size: 10px`, cor `--text-3`, italic â€” quando `packetLossSource !== 'native'`. TransparÃªncia ao usuÃ¡rio: o nÃºmero estÃ¡ lÃ¡, mas Ã© estimativa.

`packetLossSource` Ã© propagado pelo `appendRecord` para `TestRecord` e devolvido pelo `recordToResult`, mantendo o label "estimado" coerente em revisitas pelo histÃ³rico.

### LimitaÃ§Ãµes

- **iOS:** plugin Ã© apenas Android. Para iOS Ã© preciso plugin Capacitor separado em Swift (Network framework / NWConnection) com provisioning Apple. **Pendente** â€” o bridge `measurePacketLossNative()` retorna `{ available: false }` no PWA iOS e o orchestrator preserva a estimativa.
- **NAT/CGNAT pesado em rede mÃ³vel:** RTT mÃ©dio pode incluir buffer da operadora; contagem de perda permanece confiÃ¡vel.
- **Roteadores que bloqueiam respostas DNS UDP:** o teste retornarÃ¡ 100% de perda. Reduzir o `packetCount` ou apontar para outro `host:port` (ex.: 8.8.8.8:53) Ã© o workaround.

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

`measurePacketLossNative` Ã© tolerante a falhas â€” sempre resolve, nunca lanÃ§a; em caso de erro do plugin retorna `{ available: false }` e o caller (orchestrator) cai pra estimativa.

---

## 12. Feature DNS â€” `src/features/dns/` (refator 2026-05)

Pasta nova para abrigar o bottom sheet do guia de DNS, criado quando a `DNSGuideScreen` foi descontinuada.

### `DNSGuideSheet.tsx` + `.css` (refator "premium" 2026-05 â†’ drag-to-resize 2026-05)

Substitui a antiga `DNSGuideScreen` (rota dedicada). Acionado pela row "DNS" da section "Mais detalhes" da ResultScreen. **No refator drag-to-resize 2026-05, passou a usar o `DraggableSheet` como base** â€” backdrop, container fixed, slide-up animation e drag handle vivem agora no `DraggableSheet`; o `DNSGuideSheet` mantÃ©m sÃ³ os estilos de conteÃºdo (header, hero, pills, tabs, steps, footer) sob a classe `.lk-dns-sheet__inner`.

**Props:**

```ts
interface Props {
  open: boolean;
  onClose: () => void;
  /** Resultado do speedtest atual â€” usado no hero "RecomendaÃ§Ã£o". */
  result?: SpeedTestResult;
  /** Benchmark jÃ¡ executado pela ResultScreen (opcional â€” sheet roda o seu se ausente). */
  benchmark?: DnsBenchmarkResult | null;
  /** Compatibilidade com chamadas legadas; ignorado. */
  serverId?: string;
}
```

**Estrutura visual (refator "premium" 2026-05):** sai do dump de passos
por plataforma para uma hierarquia "recomendaÃ§Ã£o-first":

1. **Hero "RecomendaÃ§Ã£o" â€” 3 estados (Bug-1 fix 2026-05)** â€” o estado
   Ã© decidido por `chooseDnsRecommendation(currentLatencyMs, sortedServers)`
   importada de `utils/dnsBenchmark.ts`:
   - **`switch`** â€” grid 1fr Â· auto Â· 1fr. Lado esquerdo: kicker
     "Seu DNS", nome (`currentDnsLabel`, ver Bug-2 abaixo), latÃªncia
     atual em destaque (cor por threshold: â‰¥100ms vermelho, â‰¥50ms
     amarelo, <50ms verde). Lado direito: kicker "Recomendado",
     `recommendation.target.name`, latÃªncia verde + chip
     `âˆ’X ms Â· âˆ’Y%` mostrando ganho. Setinha entre os lados.
   - **`already_good`** â€” classe modificadora `--already-good`
     desativa o grid 3-col e empilha verticalmente: Ã­cone
     `check-circle` verde + tÃ­tulo "Seu DNS estÃ¡ excelente" + sub
     `<provedor> Â· <X> ms â€” sem necessidade de trocar`.
   - **`no_data`** â€” fallback do `switch` com `â€”` no lado direito e
     "Medindoâ€¦" enquanto `running === true`.
2. **Pills compactas (interativos, 2026-05)** â€” em `switch`, exclui o `fastest`. Em
   `already_good`, mostra os 3 mais rÃ¡pidos. Pills `border-radius:
   999px` com nome em `var(--font-display)` + latÃªncia em
   `var(--font-mono)`. **Pills sÃ£o botÃµes clicÃ¡veis** (`<button>` semÃ¢ntico)
   que disparam `setSelectedServerId(p.id)` (state local `useState<string | null>`).
   Pill ativo recebe classe `.lk-dns-sheet__pill--active` (fundo
   `var(--accent-tint)` + borda `var(--accent)` + nome em `var(--accent)`).
   Ao selecionar um pill, `selectedServerStatic` (useMemo) atualiza e
   consequentemente `steps` e `copyIPs` refletem o servidor escolhido.
   Permite explorar recomendaÃ§Ãµes de providers alternativos sem forÃ§ar
   adoÃ§Ã£o imediata.
3. **Tabs por plataforma** â€” `ios | android | router`. Auto-detecÃ§Ã£o
   inicial via `navigator.userAgent` (procura `iPhone|iPad|iPod` â†’
   `ios`, `Android` â†’ `android`, fallback `android`). Tabs em pill,
   ativa em `var(--accent)`.
4. **Steps** â€” 4 passos numerados por plataforma. Cada step em card
   compacto com chip purple (`var(--accent-tint)`) Ã  esquerda. ConteÃºdo
   por plataforma:
   - **iOS** (4): Ajustes â†’ Wi-Fi â†’ â“˜ â†’ Configurar DNS â†’ Manual â†’ IPs.
   - **Android** (4): ConfiguraÃ§Ãµes â†’ Rede e internet â†’ DNS privado â†’
     hostname DoT, com fallback de IP estÃ¡tico na rede Wi-Fi.
   - **Roteador** (4): painel `192.168.0.1`, login admin/admin, seÃ§Ã£o
     WAN/DNS, salvar.
5. **Linha de IPs** â€” texto centralizado discreto mostrando os IPs do
   servidor selecionado em `var(--font-mono)` para conferÃªncia rÃ¡pida.
6. **Footer fixo (CTA estado-dependente)** â€” em `switch`/`no_data`:
   primary `var(--accent)` "Copiar IPs" â†’
   `navigator.clipboard.writeText('1.1.1.1, 1.0.0.1')` (fallback
   `document.execCommand` em iOS standalone antigo) + toast pill "IPs
   copiados" + secondary outline "Fechar". Em `already_good`: apenas
   primary "Fechar" (sem incentivar troca desnecessÃ¡ria).

**Bug-2 fix 2026-05 â€” fallback do nome do "Seu DNS":** o hero antes
exibia `result?.dnsProvider ?? 'Detectandoâ€¦'`, mostrando "Detectandoâ€¦"
mesmo apÃ³s o speedtest ter terminado quando o probe falhou em mapear
o IP do resolver. Agora hÃ¡ um fallback em cascata em `currentDnsLabel`:

```ts
const currentDnsLabel =
  result?.dnsProvider          // nome conhecido (Cloudflare, Google, â€¦)
  ?? result?.dnsResolverIp     // IP cru detectado mas nÃ£o mapeado
  ?? 'NÃ£o identificado';       // probe DoH falhou completamente
```

NÃ£o hÃ¡ mais o estado "Detectandoâ€¦" â€” o sheet sÃ³ abre depois do teste
terminar; o estado de detecÃ§Ã£o do **provider** (vem do `probeDnsResolver`
do orchestrator) Ã© independente do estado de **benchmark dos DoH
alternativos** (`runDNSBenchmark` rodando dentro do sheet).

**Comportamento dos dados:**

- Quando o pai passa `benchmark`, o sheet usa direto. Quando ausente,
  `useEffect` no abrir dispara `runDNSBenchmark()`. Para feedback
  imediato, faz seed do `loadLastDnsResult()` antes do benchmark
  terminar â€” UI jÃ¡ mostra o Ãºltimo resultado conhecido enquanto o
  refresh roda em background.
- Servidor selecionado para os steps = `fastest` do benchmark
  (`sortedServers[0]`) **mesmo no estado `already_good`** â€” quem
  decide trocar mesmo assim ainda precisa dos IPs. Sem benchmark
  ainda, fallback Cloudflare.
- Pills filtram para `samples > 0` (servidor que falhou no benchmark
  some da lista â€” Safari iOS bloqueia DoH com CORS estrito em alguns
  resolvers).

**Atalho de abertura (refator drag-to-resize 2026-05).** O sheet abre
pela row "DNS" da section "Mais detalhes" (`onClick={() => setActiveSheet('dns')}`)
e pela 4Âª cell do bloco `.lk-result__secondary-block` (cell "DNS"),
que mantÃ©m `lk-result__secondary-cell--clickable` (cursor pointer +
hover/focus realÃ§a `cell-label` em `var(--accent)`), `role="button"`,
`tabIndex={0}` e handler de Enter/EspaÃ§o para acessibilidade. Os dois
caminhos coexistem e disparam o mesmo `setActiveSheet('dns')`.

**Comportamento do sheet:**

- Renderiza `null` quando `!open` (delegado ao `DraggableSheet`).
- Base visual e drag-to-resize fornecidos pelo `DraggableSheet` â€”
  snap entre 60vh (compact) e 88vh (expanded), pull-down threshold de
  30% fecha, fast-swipe-down (vel > 800 px/s) tambÃ©m fecha.
- Tecla `Esc` fecha; body scroll lock â€” ambos centralizados no
  `DraggableSheet`.
- `prefers-reduced-motion: reduce` bloqueia animaÃ§Ã£o de entrada/saÃ­da.

**Por que sheet em vez de rota.** Encurta o caminho de volta; o usuÃ¡rio jÃ¡ estÃ¡ na ResultScreen, o sheet Ã© um overlay leve. TambÃ©m evita poluir o `screen` enum em `App.tsx`.

---

## 13. Feature Result Detail â€” `src/features/result-detail/` (refator drag-to-resize 2026-05)

Pasta nova para abrigar as 2 sheets que substituÃ­ram os accordions inline "AvanÃ§ado" e "Modo Gamer" da section "Mais detalhes" da ResultScreen. O DNS jÃ¡ vivia em `features/dns/DNSGuideSheet`; agora os 3 caminhos seguem o mesmo padrÃ£o (row clicÃ¡vel â†’ bottom sheet montado sobre `DraggableSheet`).

### Section "Mais detalhes" da ResultScreen (refator drag-to-resize 2026-05)

```
[Ã­cone] AvanÃ§ado            [chevronâ†’]
[Ã­cone] Modo Gamer          [chevronâ†’]
[Ã­cone] DNS                 [chevronâ†’]
```

Renderizada como uma Ãºnica `IOSList` com 3 items, cada um com `onClick: () => setActiveSheet(...)`. O estado `activeSheet: 'advanced' | 'gamer' | 'dns' | null` Ã© mantido na ResultScreen e unifica a lÃ³gica de "qual sheet estÃ¡ aberta" (antes eram estados separados `dnsSheetOpen` e `dnsBenchStarted`). Os 3 sheets ficam sempre montados no DOM (`<AdvancedSheet open={activeSheet === 'advanced'} ... />` etc.) â€” o `open` controla a visibilidade.

### `AdvancedSheet.tsx` + `.css`

Porto do antigo `AdvancedAccordionBody`. Estrutura visual:

1. **Header sticky** â€” title "AvanÃ§ado" + close button (mesmo padrÃ£o das demais sheets).
2. **Hero** â€” kicker "Detalhes tÃ©cnicos" + tÃ­tulo "MÃ©tricas, telemetria e histÃ³rico" + Ã­cone settings 26px Ã  esquerda, com border-top neutro.
3. **3 grupos hairlined**, cada um com `<IOSList>`:
   - MÃ©tricas avanÃ§adas: bufferbloat (latÃªncia sob carga), latÃªncia carregada, oscilaÃ§Ã£o carregada, estabilidade DL (P25â€“P75), falhas, velocidade mÃ©dia (DL/UL via samples), IP pÃºblico, provedor.
   - Sobre o teste: tempo total, distÃ¢ncia estimada, timestamp absoluto, versÃ£o do app.
   - HistÃ³rico: comparaÃ§Ã£o com mÃ©dia dos Ãºltimos 10 testes (delta % colorido por sinal).
4. **Footer fixo** â€” CTA "Fechar".

Todas as helpers (`bufferbloatColor`, `bufferbloatLabel`, `packetLossColor`, `packetLossLabel`, `formatFullDateTime`, `formatElapsedMs`, `averageFromSamples`, `historicalAverageDl`, `estimateDistanceKm`) foram migradas do `ResultScreen.tsx` para este arquivo â€” nÃ£o hÃ¡ duplicaÃ§Ã£o.

Empty-state preserva o legado: quando `metricItems`, `aboutItems` e `historyItems` estÃ£o todos vazios (extremamente raro â€” falhas na conexÃ£o sempre adiciona algo), exibe `<p className="lk-adv-sheet__empty">Sem dados avanÃ§ados disponÃ­veis para este teste.</p>`.

### `GamerSheet.tsx` + `.css`

Porto do antigo `GamerAccordionBody`. Estrutura visual:

1. **Header sticky** â€” title "Modo Gamer" + close.
2. **Hero** â€” kicker "AvaliaÃ§Ã£o" + tÃ­tulo com `overallLabel` ("Boa para jogos online." / "AtenÃ§Ã£oâ€¦" / "ConexÃ£o fracaâ€¦") + Ã­cone gamepad colorido pelo `overallTone`. Border-top do hero pega a mesma cor (`--ribbon-color` inline).
3. **Stat cards 3 cols** â€” Resposta (latÃªncia), OscilaÃ§Ã£o (jitter), Falhas (perda) com cor por tone.
4. **Lista de jogos** â€” `<IOSList>` com 4 categorias (FPS competitivo, MOBA/BR, MMO/RPG, Cloud Gaming), cada uma com verdict colorido por tone (`good` / `maybe` / `bad`).
5. **Footer fixo** â€” CTA "Fechar".

A lÃ³gica `evaluateGames(result)` foi migrada do `ResultScreen.tsx` integralmente â€” mesma classificaÃ§Ã£o por jogo, mesmos thresholds.

### Por que separar das tabs Wi-Fi (`features/local-wifi/`)

A pasta `local-wifi` Ã© especÃ­fica do diagnÃ³stico Wi-Fi nativo (com plugin Capacitor associado). As sheets `AdvancedSheet` e `GamerSheet` consomem sÃ³ o `SpeedTestResult` puro (sem capabilities nativas) â€” separaÃ§Ã£o por domÃ­nio justifica a pasta nova.

---

## 14. Onboarding (primeira execuÃ§Ã£o, 2026-05)

### Objetivo
Apresentar o app a quem abre pela primeira vez sem prejudicar quem jÃ¡ o conhece. Carousel de 3 cards exibido como overlay full-screen apenas na primeira execuÃ§Ã£o; nÃ£o Ã© uma rota e nÃ£o bloqueia o histÃ³rico de back/forward.

### Componentes
- **`src/screens/OnboardingScreen.tsx` + `OnboardingScreen.css`** â€” overlay puramente apresentacional. Recebe `onComplete: () => void` e dispara quando o usuÃ¡rio avanÃ§a apÃ³s o Ãºltimo card OU clica "Pular". Estado interno (`index`) controla qual card aparece. AnimaÃ§Ã£o: `translateX(-${index * 100}%)` com `transition: 320ms cubic-bezier(0.32, 0.72, 0, 1)`. Respeita `prefers-reduced-motion: reduce`.
- **3 cards (conteÃºdo hardcoded em pt-BR):**
  1. Gauge SVG inline + "Mede sua internet com precisÃ£o"
  2. Trio gamepad/tv/briefcase + "Descubra se serve pra Jogos, 4K, Trabalho"
  3. Cadeado + "PermissÃµes necessÃ¡rias" com 2 bullets (LocalizaÃ§Ã£o, NotificaÃ§Ãµes)
- **Footer:** dots indicators (3 pÃ­lulas pequenas, ativa em `--accent`) + botÃ£o CTA `AvanÃ§ar` que vira `ComeÃ§ar` no Ãºltimo card. Topo direito: "Pular" text-link.
- **Swipe horizontal interno** entre cards (threshold 60px, ratio 1.4 â€” nÃ£o conflita com o swipe lateral global do `App.tsx` porque o overlay tem z-index alto e captura o touch primeiro).
- **SVGs inline** seguem o padrÃ£o dos icons em `src/components/icons.tsx` â€” `stroke="currentColor"`, `strokeWidth=1.6/2.2`, sem dependÃªncias externas.

### Gate em `App.tsx`
- Constante `ONBOARDING_KEY = 'linka.onboarding.done'` em localStorage.
- `readOnboardingDone()` lÃª `'1'` de forma sÃ­ncrona no init do state `onboardingDone`.
- Render condicional FORA do `view` principal (acima da Ã¡rvore de telas, abaixo do `<PwaUpdatePrompt />`):
  ```tsx
  {!onboardingDone && (
    <Suspense fallback={null}>
      <OnboardingScreen onComplete={handleOnboardingComplete} />
    </Suspense>
  )}
  ```
- `handleOnboardingComplete`: `localStorage.setItem(ONBOARDING_KEY, '1')` + `setOnboardingDone(true)`.
- `handleResetOnboarding`: `localStorage.removeItem(ONBOARDING_KEY)` + `setOnboardingDone(false)`. Repassado para a `ExploreScreen` â†’ `HamburgerMenu` como prop opcional `onResetOnboarding`.

### "Ver tutorial novamente"
- `HamburgerMenu` ganhou prop opcional `onResetOnboarding?: () => void`. Quando presente, renderiza um item `Ver tutorial novamente` (Ã­cone `bulb`) acima da seÃ§Ã£o "Velocidade contratada". O item aparece atualmente sÃ³ na `ExploreScreen` (Settings hub). Pode ser propagado para outros consumers do menu sem mudar a API.

### Acessibilidade e travas
- `role="dialog"`, `aria-modal="true"`, `aria-label="Bem-vindo Ã  linka"`.
- Trava `document.body.style.overflow = 'hidden'` enquanto o overlay estÃ¡ montado (cleanup no unmount).
- Dots sÃ£o `role="tab"` com `aria-selected` para refletir o card ativo.

### Risco
Em iOS standalone, o body do app jÃ¡ estÃ¡ com `overflow: hidden` (regra global em `tokens.css`). A trava local do overlay Ã© redundante mas inofensiva â€” protege em browsers desktop usados para QA/dev.

---

## 15. Code splitting (2026-05)

### DecisÃ£o
Bundle principal prÃ©-refator era ~1.2 MB. Telas e sheets que nÃ£o fazem parte do caminho principal sÃ£o lazy-imported via `React.lazy` + `Suspense`, com chunks separados pelo Vite/Rollup default.

### Componentes lazy
**App.tsx (screens secundÃ¡rias):**
- `ComparisonScreen`
- `BeforeAfterScreen`
- `RoomTestScreen`
- `ExploreScreen`
- `LocalWifiScreen` (em `features/local-wifi/`)
- `LocalNetworkScreen` (em `features/local-network/`)
- `OnboardingScreen` (overlay, exibido apenas na 1Âª execuÃ§Ã£o)

**ResultScreen.tsx (sheets de "Mais detalhes"):**
- `AdvancedSheet`
- `GamerSheet`
- `DNSGuideSheet`

**WifiSignalSection.tsx:**
- `WifiDetailsSheet`

**WifiDetailsSheet.tsx:**
- `WifiOptimizeSheet`

### Eager (nÃ£o lazy, intencional)
- `StartScreen` â€” entrypoint frio
- `RunningScreen` â€” precisa estar pronta no instante em que o teste inicia (delay seria visÃ­vel)
- `HistoryScreen` â€” uso muito frequente
- `ResultScreen` â€” caminho principal pÃ³s-teste; manter eager evita um Suspense fallback no fluxo "abriu app â†’ resultado anterior"

### PadrÃ£o de wrapper
Todos os componentes lazy tÃªm `export function NomeComponente` (named export). React.lazy exige um mÃ³dulo com `default`. O wrapper:
```tsx
const X = lazy(() => import('./X').then((m) => ({ default: m.X })));
```

### Mount condicional Ã— always-mounted
Antes do refator, sheets como `AdvancedSheet` ficavam sempre montadas, com prop `open` controlando a visibilidade (e o `DraggableSheet` interno retornando `null` quando fechado). Para que o lazy realmente difira o download do chunk, o pattern foi convertido para:
```tsx
{activeSheet === 'advanced' && (
  <Suspense fallback={null}>
    <AdvancedSheet open onClose={...} ... />
  </Suspense>
)}
```
Sem isso, o `import()` dispararia jÃ¡ no mount da `ResultScreen` e o ganho seria zero.

### Fallback `<ScreenLoadingFallback>`
Componente local em `App.tsx`, full-screen com `var(--bg)` + texto "Carregandoâ€¦" centralizado. Sem TopBar/PageHeader â€” qualquer esqueleto mais elaborado tende a piscar em conexÃµes rÃ¡pidas. Sheets usam `fallback={null}` (aparecem rÃ¡pido o suficiente; um placeholder atrapalharia o gesto).

### VerificaÃ§Ã£o esperada apÃ³s `npm run build`
- Chunk principal cai para ~600â€“800 KB (alvo: â‰¥ 20% de reduÃ§Ã£o).
- Chunks novos com nomes derivados do componente: `ComparisonScreen-XXXX.js`, `AdvancedSheet-XXXX.js`, etc.
- Primeiro click em uma sheet/tela secundÃ¡ria pode ter 100â€“200 ms de delay aceitÃ¡vel (chunk + parse).

### Risco e mitigaÃ§Ã£o
- **Imports circulares:** os componentes lazy nÃ£o importam `App.tsx` nem componentes eager que voltariam para si. Cada um depende sÃ³ de `components/`, `hooks/`, `utils/`, `core/`, `types/`.
- **Tipos compartilhados:** `ComparisonStep` e `BeforeAfterStep` continuam importados de forma estÃ¡tica como `import type {...}` â€” nÃ£o puxam runtime.
- **Service Worker:** o Workbox precachea `**/*.{js,css,...}` por glob, entÃ£o os novos chunks entram no precache normalmente.

---

## 16. Descoberta de dispositivos na rede local (Android nativo)

### DecisÃ£o

Descoberta LAN nÃ£o Ã© implementÃ¡vel em PWA puro. Browser nÃ£o expÃµe ARP/MAC, UDP 137, multicast SSDP/mDNS nem TCP scan arbitrÃ¡rio. A feature roda via Capacitor Android e cai para indisponibilidade transparente no PWA.

### Contratos

- `DeviceObservation`: evidÃªncia por fonte (`arp`, `tcp`, `ssdp`, `mdns`, `netbios`, `router`, `cache`).
- `DeviceRegistry`: ponto Ãºnico de merge. Agrupa por IP/MAC, preserva fontes, escolhe nome por prioridade e calcula confianÃ§a.
- `ClientIdentityProvider`: contrato para identidade vinda de modem/roteador por MAC normalizado ou IP. NÃ£o Ã© DHCP provider; a origem pode ser DHCP leases, clientes Wi-Fi, LAN, mesh/repeater ou nomes salvos no equipamento.

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

ConfianÃ§a:

- `confirmed`: 3+ fontes
- `medium`: 2 fontes
- `probable`: 1 fonte
- `inferred`: cache apenas

### Fontes nativas

`LocalNetworkDiscoveryPlugin.java` emite observaÃ§Ãµes, nunca devices finais:

- ARP: lÃª `/proc/net/arp` quando disponÃ­vel.
- TCP probe: tenta portas comuns com timeout curto.
- SSDP/UPnP: `M-SEARCH` + fetch do XML de descriÃ§Ã£o para `friendlyName`, `manufacturer`, `modelName`.
- mDNS/DNS-SD: consulta multicast `_services._dns-sd._udp.local` e extrai nome legÃ­vel quando possÃ­vel.
- NetBIOS NBNS: Node Status Query UDP 137, ignorando `WORKGROUP`, `MSHOME`, `__MSBROWSE__` e nomes tÃ©cnicos/hex.

Limites: 64 alvos por varredura, TCP 350 ms, UDP ~2,3 s. Redes/OEMs podem bloquear ARP ou multicast; isso reduz confianÃ§a, nÃ£o cria lista paralela.

### UI e testes

`LocalNetworkScreen` fica em `features/local-network/`, lazy-loaded no `App.tsx` e acessÃ­vel pela `ExploreScreen` apenas no nativo. Reutiliza `TopBar`, `PageHeader` e `IOSList`.

`src/__tests__/localNetworkRegistry.test.ts` cobre normalizaÃ§Ã£o de MAC, merge Ãºnico, prioridade de nomes, filtro de NetBIOS tÃ©cnico, ClientIdentityProvider e labels pt-BR.

### DNS Probe â€” compatibilidade de parser

`probeDnsResolver()` aceita respostas TXT em dois formatos: `remote_ip: <ip>` e IP direto (`"1.1.1.1"`). Isso mantÃ©m compatibilidade com fixtures antigas sem mudar o contrato pÃºblico `{ latencyMs, resolverIp, provider }`.

---

## 8. MudanÃ§as 2026-05-04 (commit `3367a07`)

### Refresh ISP ao Iniciar Teste

**OtimizaÃ§Ã£o:** `App.tsx` agora dispara `deviceInfo.reload()` quando `test.phase === 'latency'` (inÃ­cio da mediÃ§Ã£o). ImplementaÃ§Ã£o via `useRef` (`deviceInfoReloadRef`) para evitar mÃºltiplos disparos causados por mudanÃ§as no objeto `deviceInfo` durante rerenders.

**Impacto:** O ISP capturado em `appendRecord()` (fase `done`) reflete a rede ativa no momento da mediÃ§Ã£o, nÃ£o a rede no mount do app. Combinado com os gatilhos existentes (`navigator.connection.change`, `window.online`), garante que:
1. StartScreen mostra ISP correto apÃ³s troca de rede
2. Registro persistido em histÃ³rico (`TestRecord.isp`) Ã© precisamente o do momento do teste

### Melhorias em Upload e Retry

**`uploadProbe.ts` e `speedTestOrchestrator.ts`:**
- LÃ³gica de retry aprimorada para falhas de upload em conexÃµes mobile
- Fallback progressivo entre presets (mobile_broadband vs fixed_broadband)
- Resultado parcial (`result.ulFailed`) Ã© persistido corretamente no histÃ³rico

### ExpansÃ£o Visual ResultScreen

**`ResultScreen.tsx`:**
- Incremento na hierarquia visual dos blocos principais (PRIMARY, SECONDARY, USE-CASES)
- Melhor espaÃ§amento e proporÃ§Ã£o entre seÃ§Ãµes
- Ribbon de cor de verdict agora reflete quality com mais precisÃ£o em todos os breakpoints

### Logo Android Integrado

**`android/app/src/main/res/drawable/ic_launcher.png`:**
- SubstituÃ­do com `public/icon-512.png` (logo PWA)
- APK agora exibe o logo da marca linka em todos os estados (launcher, notificaÃ§Ãµes, etc.)
- ManutenÃ§Ã£o unificada: mudanÃ§as no logo PWA propagam automaticamente ao APK no prÃ³ximo build

