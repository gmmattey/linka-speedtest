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
type ConnectionType = 'wifi' | 'mobile' | 'cable'
type TestPhase = 'idle' | 'latency' | 'download' | 'upload' | 'load' | 'done' | 'error'
type SpeedTestMode = 'quick' | 'complete' | 'normal' | 'advanced'
type GamingProfile = 'off' | 'casual' | 'moba' | 'fps' | 'cloud'
type RecommendationAction =
  | 'repeat_test' | 'move_closer_router' | 'restart_router'
  | 'try_cable' | 'compare_location' | 'contact_operator'
  | 'run_proof_mode' | 'run_gamer_mode' | 'none'
```

### Interfaces principais

```ts
interface SpeedTestResult {
  dl: number          // Mbps download (P90 das rodadas)
  ul: number          // Mbps upload (P90 das rodadas)
  latency: number     // ms mediana das amostras
  jitter: number      // ms MAD da latência idle
  packetLoss: number  // % perda de pacotes (0–100)
  timestamp: number   // Unix ms
  mode?: SpeedTestMode
  // ── Advanced mode (opcionais) ────────────────────────
  dlP25?: number; dlP75?: number   // Mbps — intervalo de estabilidade DL
  ulP25?: number; ulP75?: number   // Mbps — intervalo de estabilidade UL
  latencyLoaded?: number           // ms — latência mediana sob carga
  jitterLoaded?: number            // ms — MAD da latência sob carga
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

### 3.1 `speedtest.ts` — Algoritmo de medição

Função principal: `runSpeedTest(onProgress, signal, connectionType?, mode?): Promise<SpeedTestResult>`

Os parâmetros `connectionType?: ConnectionType` e `mode?: SpeedTestMode` selecionam um preset de payload via `presetFor(connectionType?, mode?)`.

| Preset | Trigger | Pings | DL warmup | DL round × n | UL warmup | UL round × n | Total |
|---|---|---|---|---|---|---|---|
| `PRESET_DEFAULT` | `'wifi'`/`'cable'`/`undefined` (non-quick) | 20 | 25 MB | 100 MB × 3 | 10 MB | 50 MB × 3 | ~400 MB |
| `PRESET_MOBILE`  | `'mobile'` (non-quick) | 20 | 5 MB | 25 MB × 2 | 2 MB | 10 MB × 2 | ~70 MB |
| `PRESET_QUICK`   | `mode === 'quick'` | 8 | 5 MB | 50 MB × 1 | 2 MB | 20 MB × 1 | ~80 MB |

Modos `'normal'` e `'advanced'` usam `PRESET_DEFAULT`/`PRESET_MOBILE` (mesmo preset). A diferença está nas fases adicionais executadas após upload no modo avançado.

**Mapeamento de progresso por modo:**

| Fase | Normal [from, to] | Advanced [from, to] |
|---|---|---|
| `latency` | [0.00, 0.15] | [0.00, 0.10] |
| `download` | [0.15, 0.70] | [0.10, 0.52] |
| `upload` | [0.70, 1.00] | [0.52, 0.76] |
| `load` | não executada | [0.76, 1.00] |

**Latência:**
- 20 pings (HEAD requests para `/__down?_cb=<ts>`), descarta o primeiro
- Mediana das amostras restantes = `latency`; jitter = MAD dos RTTs

**Download:**
- Warmup + `dlRounds` rounds; EMA α=0.3 por chunk
- P90 dos rounds = `dl` (resultado final)
- Advanced: p25 e p75 calculados de `dlSamples` → `dlP25`, `dlP75`

**Upload:**
- Buffer pré-gerado com `crypto.getRandomValues` (chunks de 65536 bytes)
- Warmup + `ulRounds` rounds; P90 = `ul`
- Advanced: `ulP25`, `ulP75`
- **Progresso instantâneo:** a API Fetch não expõe bytes enviados progressivamente. O `setInterval` de cada round emite `instantMbps: null` (sem valor) — o gauge decai numericamente até o round concluir e retornar a velocidade real. Estimativa via `totalBytes / elapsed * 0.5` foi removida por ser empiricamente imprecisa.

**Fase `load` (somente `mode === 'advanced'`):**
- Chama `runBufferbloatTest(idleLatency, signal, onProgress)` — veja §3.x
- Resultado adicionado ao `SpeedTestResult`: `latencyLoaded`, `jitterLoaded`, `bufferbloatGrade`, `bufferbloatDeltaMs`

**Packet loss:**
- Estimado por `packetLoss = (timeouts / totalPings) * 100` durante a fase de latência

**CORS:** POSTs para `/__up` usam `Content-Type` simples (sem header customizado) para evitar preflight.

### 3.1b `bufferbloat.ts` — Medição de latência sob carga

Função: `runBufferbloatTest(idleLatency, signal, onProgress): Promise<BufferbloatResult>`

**Algoritmo:**
1. Abre `STREAM_COUNT` (4) downloads paralelos de 25 MB cada para saturar o link durante `DURATION_MS` (12 s)
2. Enquanto streams correm, dispara pings a cada `PING_INTERVAL` (300 ms) e coleta RTTs
3. Cancela streams ao final da duração
4. Calcula mediana dos RTTs = `latencyLoaded`; MAD = `jitterLoaded`
5. `deltaMs = max(0, latencyLoaded − idleLatency)`
6. Grade por `deltaMs`:

| Grade | deltaMs |
|---|---|
| A | < 30 ms |
| B | 30–60 ms |
| C | 60–200 ms |
| D | 200–400 ms |
| F | ≥ 400 ms |

**`BufferbloatResult`:** `{ latencyLoaded, jitterLoaded, grade, deltaMs }`

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

### 3.6 `recommendations.ts` — Recomendações contextuais

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
```

**Tipos:**
```ts
interface DnsServerResult { id, name, ip, p50, p95, samples, grade: 'A'|'B'|'C'|'D' }
interface DnsBenchmarkResult { servers, winner, testedAt }
```

**Grades:** A (≤15 ms), B (≤30 ms), C (≤50 ms), D (>50 ms)

**Vencedor:** servidor com menor p50 entre os que têm `samples > 0`. Resultado salvo em `localStorage` na chave `linka.dns.result.v1`.

**Integração no fluxo Advanced:** `runDNSBenchmark` é iniciado em paralelo ao `runBufferbloatTest` (fase `'load'`), aguardado na fase `'dns'` com tick de progresso a cada 300 ms. Timeout máximo: 20 s.

### 3.12 `shareCard.ts` — Geração de card para WhatsApp

**`generateShareCard(result, quality, unit?): Promise<Blob>`**

Gera imagem PNG 1080×540 px via Canvas API:
- Fundo: `#0E0E12`; barra decorativa esquerda: `#6C2BFF` (accent)
- DL em azul `#3AB6FF`; UL em verde `#22C55E`
- Aguarda `document.fonts.ready` antes de desenhar — garante que Space Grotesk e Inter estejam carregadas
- Retorna `Blob` com `type: 'image/png'`

### 3.12 `format.ts` — Formatação

```ts
formatMbps(v: number, unit?: 'mbps'|'gbps'): string  // divide por 1000 se gbps
formatMs(v: number): string    // arredonda para inteiro
formatDate(ts: number): string // dd/MM/yyyy HH:mm
formatDateIsoLike(ts: number): string // YYYY-MM-DD para nome de arquivo
```

---

## 3.10 Motor unificado (`src/core/`)

Camada introduzida na Fase 1 do plano de unificação (PWA + linka Flutter). Pura, sem dependência de React, DOM, navegador ou localStorage.

**Estado atual (Fase 6 concluída — migração completa):** `ResultScreen`, `HistoryScreen` e `pdfExport.ts` usam exclusivamente `interpretSpeedTestResult()` + `resolveCopy()`. O `classifier.ts` legado foi podado — mantém só `RULE_SET_VERSION` e `classify()` (ainda necessário para `TestRecord.quality` e bridge de recomendações). Recomendações da ResultScreen continuam com texto de `utils/recommendations.ts` (bridged via `Classification` sintética derivada das flags do motor).

**Dispersão histórica no resumo:** O card "Média dos seus testes" da HistoryScreen usa `syntheticLoss` (% de testes slow/unavailable nos últimos 5) como proxy de instabilidade temporal — evita que históricos alternando excelente/péssimo apareçam como "bons". Quando `stability.level === 'unstable' | 'oscillating'`, exibe o rótulo de estabilidade em vez do headline de quality.

**Copy (Fase 5):** `<dt>Perda de pacotes</dt>` substituído por `<dt>Perda de sinal</dt>` em ResultScreen e HistoryScreen — alinhado com o chip tag `flag.packetLoss`. Grep por "Perda de pacotes", "Jitter", "pacotes" em `src/screens/` retorna zero.

**Fase 6 (legado removido):** `pdfExport.ts` migrado para `interpretSpeedTestResult()` + `resolveCopy()` — sem mais imports de `classifier.ts`. `useUnifiedEngine` removido de `useSettings`. `LiveChart.tsx` deletado.

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
  flags: InterpretFlags                  // 5 booleanos (highLatency, lowUpload, unstable, packetLoss, veryUnstable)
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
1. `detectDevice()` → analisa UA + viewport → `DeviceInfo`
2. `navigator.connection?.type` e `?.effectiveType` → `connectionType`
3. `provider.getInfo()` → busca `ServerInfo` (trace + meta Cloudflare)
4. `provider.checkAvailability()` → HEAD request de verificação
5. AbortController no cleanup do useEffect (`cancelled = true`)
6. `reload()` → incrementa `reloadKey` para re-executar o efeito

**Heurística de `connectionType`** (em ordem):
1. `connection.type === 'wifi'` → `'wifi'`
2. `connection.type === 'cellular'` → `'mobile'`
3. `connection.type === 'ethernet' | 'wimax' | 'other'` → `'cable'`
4. Sem `type` mas `effectiveType` em `'2g' | '3g' | 'slow-2g'` → `'mobile'`
5. **Fallback iOS Safari** (sem `navigator.connection`): se `deviceType === 'mobile'` → assume `'mobile'`. Caso contrário → `'cable'`.

> O override manual em **Configurações → Conexão** sempre vence (ver `App.tsx::effectiveConnection`).

**`serverId`** é passado como prop de `App.tsx`. Atualmente fixo em `'cloudflare'`.

### 4.2 `useSpeedTest()`

**Retorno:** `{ phase, instantMbps, overallProgress, result, error, live, start, cancel, reset }`

**Assinatura de `start`**: `start(connectionType?: ConnectionType, mode?: SpeedTestMode)`. O hook repassa ambos os parâmetros para `runSpeedTest`, que escolhe o preset adequado (default, mobile ou quick). Ver §3.1.

**`live: LivePoint[]`** — buffer dos últimos 60 pontos `{ t: number, speed: number, phase: 'download'|'upload' }`. Mantido por compatibilidade interna; **não é mais consumido** pela RunningScreen (gauge passou a ser apenas número + unidade). O componente `LiveChart.tsx` foi deletado na Fase 6 — não havia callers.

**Suavização do `instantMbps`:**
- `targetMbpsRef` recebe o valor bruto do callback `onProgress`
- `requestAnimationFrame` roda loop de EMA: `next = 0.25 * target + 0.75 * rendered`
- `renderedMbpsRef` → `setState({ instantMbps: next })`

**Limpeza do buffer live:**  
Quando a fase muda de `download` para `upload`, o buffer é limpo para não misturar séries.

### 4.3 `useSettings()`

**Retorno:** `{ settings: Settings, update: (patch: Partial<Settings>) => void }`

```ts
interface Settings {
  unit: 'mbps' | 'gbps'            // padrão: 'mbps'
  scale: 'linear' | 'log'          // padrão: 'linear' — sem UI, mantido por compat de localStorage
  connectionOverride: 'auto' | 'wifi' | 'cable' | 'mobile'  // padrão: 'auto'
  hideIpOnShare: boolean            // padrão: true — oculta IP ao compartilhar resultado
  gamingProfile: GamingProfile      // padrão: 'off' — perfil de gamer para veredicto na ResultScreen
}
```

`gamingProfile` controla o bloco `GamingVerdict` da ResultScreen e o hint da StartScreen. Quando `'off'`, nenhum desses elementos é exibido. Configurado no BottomSheet → seção Configurações via seletor segmentado `[Off] Casual MOBA FPS Cloud`.

Chave localStorage: `linka.speedtest.settings.v1`  
`update` faz merge com settings atual e persiste imediatamente.

> O campo `scale` foi removido da UI do BottomSheet. Mantemos no tipo para evitar migração e potencial perda de chave localStorage existente em usuários atuais.

> `hideIpOnShare: true` é o padrão — ao compartilhar via texto ou PDF, o IP público é substituído por "Oculto" na seção Detalhes da ResultScreen.

---

## 5. Componentes (`src/components/`)

### 5.1 `Header`

Props: `theme, onToggleTheme`

- Logo linka à esquerda; toggle de tema (sol/lua) à direita
- Sticky no topo, altura ~52px
- **Sem** `border-bottom` e **sem** botão de fechar/voltar — a navegação para trás é feita por swipe horizontal (App.tsx) ou por botões dedicados das próprias telas (ex.: "Cancelar" na RunningScreen, "← Voltar" no HistoryDetail)

### 5.2 `PathRow`

Props: `device, server, loading`

Três nós SVG conectados por linhas:  
`[DeviceIcon]───[ConnectionIcon]───[IconServer]`

- Labels abaixo de cada nó (ex: "Celular", "Wi-Fi", "Cloudflare")
- Linha animada com `stroke-dashoffset` via CSS keyframes ao carregar
- Ícones importados de `icons.tsx`

### 5.3 `BottomSheet`

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

### 5.4 `Gauge` (redesenhado)

Props: `value: number (0–1), phase: string, num: string, unit: string, color: string, size?: number`

SVG com dois `<circle>`: track (`--surface-3`) e fill (cor dinâmica) com `strokeDasharray={2πr}`, `strokeDashoffset = 2πr × (1 – value)`, `strokeLinecap="round"`. Overlay central absolutamente posicionado exibe:
- `.lk-gauge__phase` — label da fase (10px, uppercase, `--accent`)
- `.lk-gauge__num` — número hero (52px, Space Grotesk 700, `tnum`)
- `.lk-gauge__unit` — unidade (12px, `--text-3`)

Usado em `RunningScreen` com helpers que calculam `gaugeProgress(phase)`, `gaugePhaseLabel(phase)` e `gaugeColor(phase)`.

### 5.5 `IOSList` (novo)

```tsx
interface IOSListItem {
  icon?: ReactNode;       // conteúdo do quadrado 28×28
  iconBg?: string;        // cor de fundo do ícone (CSS var ou hex)
  title: string;
  subtitle?: string;
  trailing?: ReactNode;   // valor ou chip à direita
  showChevron?: boolean;
  onClick?: () => void;
}
```

Lista estilo iOS Settings. Fundo `--surface`, borda `--border`, `border-radius: --radius`, `overflow: hidden`. Cada row: flex, `padding: 13px 14px`, separada por `border-bottom: 1px solid var(--hairline)`. Ícone: `28×28px`, `border-radius: 7px`. Última row sem border-bottom.

Usada em: ResultScreen (métricas DL/UL/lat), GamerScreen (avaliação por jogo), StartScreen (informações do servidor).

### 5.6 `Chip` (novo)

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

### 5.7 `LiveChart`

Não consumido por nenhuma tela atualmente. Mantido para uso futuro.

### 5.8 `icons.tsx` — Biblioteca de ícones

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

### 5.9 `InfoCards` (mantido, desativado)

Componente da versão anterior da StartScreen. Mantido no projeto mas não mais utilizado. Pode ser removido quando o código for sanitizado.

---

## 6. `App.tsx` — Estado global e roteamento

Estado gerenciado em `App.tsx`:

| State | Tipo | Descrição |
|---|---|---|
| `theme` | `'dark'\|'light'` | Tema atual, persiste em localStorage |
| `screen` | `Screen` | Tela ativa: `'start'\|'running'\|'result'\|'history'\|'comparison'\|'beforeafter'\|'roomtest'\|'diagnostic'\|'gamer'\|'recommend'` |
| `isOnline` | `boolean` | Conectividade detectada via eventos `online`/`offline` do browser |
| `previous` | `TestRecord\|null` | Registro do teste anterior à sessão atual (para comparação na ResultScreen) |
| `lastRecord` | `TestRecord\|null` | Último registro do histórico, exibido como card na StartScreen |
| `historyInitialId` | `string\|undefined` | Id pré-selecionado quando se abre o HistoryScreen direto no detalhe |
| `testMode` | `SpeedTestMode` | Modo selecionado na StartScreen: `'quick'` ou `'complete'` |
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

Hooks usados:
- `useDeviceInfo('cloudflare')` → `deviceInfo`
- `useSpeedTest()` → `test`
- `useSettings()` → `settings, updateSettings`

**Pilha de navegação:**

```
goTo(next):    push(currentScreen) em backStack; clear forwardStack; setScreen(next)
goBack():      pop() de backStack → push(currentScreen) em forwardStack; setScreen(prev)
goForward():   pop() de forwardStack → push(currentScreen) em backStack; setScreen(next)
```

Todas as transições internas (`handleStart`, `handleCancel`, `handleRetry`, `handleShowHistory`, `handleShowLastResult`, e o effect de `done`) usam `goTo`, alimentando a pilha de back automaticamente.

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
| `--ul` | `#22C55E` | Upload (verde) |
| `--ul-tint` | `rgba(34,197,94,0.14)` | Fundo tintado UL / Chip good |
| `--warn` | `#F5A623` | Atenção / amarelo |
| `--error` | `#FF453A` | Erros e falhas |
| `--info` | `#3AB6FF` | Informação |
| `--font-display` | `'Space Grotesk', sans-serif` | Números hero e títulos |
| `--font-body` | `'Inter', sans-serif` | Texto corrido |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` | Valores numéricos monospace |
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

### Regras globais

- Zero `box-shadow` — proibido pelo branding linka
- Zero `text-shadow`
- `body { background: var(--bg); color: var(--text); font-family: var(--font-body); }`

---

## 8. PWA (`vite.config.ts`)

Plugin VitePWA configurado com:

```ts
manifest: {
  name: 'linka SpeedTest',       // "linka" minúsculo — obrigatório por branding
  short_name: 'linka Speed',
  theme_color: '#6C2BFF',
  background_color: '#000000',
  display: 'standalone',
  icons: [
    { src: '/icon-192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png',          sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]
}
```

Service worker gerado automaticamente. Sem runtime caching configurado (app não tem assets dinâmicos para cachear além do shell).

Testes com Vitest: `test: { environment: 'node' }` na mesma config.

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
| `connectionProfile.test.ts` | — | `toConnectionProfile()` — mapeamento ConnectionType → ConnectionProfile |
| `interpret.test.ts` | — | `interpretSpeedTestResult()` — motor unificado |
| `share.test.ts` | — | `buildShareText()`, `shareResultText()` |
| `compare.test.ts` | 12 | `calculateComparison()` — coverage_issue, both_bad, both_good, percentuais, edge cases |

**Total:** 79 testes passando (−23 da Fase 6: funções legadas removidas do classifier).

**Comando:** `npm test`

**Regra:** os testes **nunca podem ser quebrados** sem justificativa documentada e plano de substituição. Mudanças em `classifier.ts` ou `src/core/` exigem atualização dos testes correspondentes.
