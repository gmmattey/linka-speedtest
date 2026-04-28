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
| Recharts | latest | Gráficos (LiveChart, HistoryScreen) |
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
type TestPhase = 'idle' | 'latency' | 'download' | 'upload' | 'done' | 'error'
```

### Interfaces principais

```ts
interface SpeedTestResult {
  dl: number          // Mbps download (P90 das rodadas)
  ul: number          // Mbps upload (P90 das rodadas)
  latency: number     // ms mediana das amostras
  jitter: number      // ms desvio da latência
  packetLoss: number  // % perda de pacotes (0–100)
  timestamp: number   // Unix ms
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
  isp?: string            // opcional para compatibilidade com registros antigos
  deviceType: DeviceType
  connectionType: ConnectionType
}

interface Classification {
  primary: Quality
  tags: Set<Tag>
}
```

---

## 3. Utils (`src/utils/`)

### 3.1 `speedtest.ts` — Algoritmo de medição

Função principal: `runSpeedTest(onProgress, signal, connectionType?): Promise<SpeedTestResult>`

O parâmetro `connectionType?: ConnectionType` seleciona um preset de payload via `presetFor()`. Atualmente:

| Preset | Trigger | DL warmup | DL round × n | UL warmup | UL round × n | Total |
|---|---|---|---|---|---|---|
| `PRESET_DEFAULT` | `'wifi'` ou `'cable'` ou `undefined` | 25 MB | 100 MB × 3 | 10 MB | 50 MB × 3 | ~400 MB |
| `PRESET_MOBILE`  | `'mobile'` | 5 MB  | 25 MB × 2  | 2 MB  | 10 MB × 2 | ~70 MB |

Em rede móvel reduzimos volume e número de rounds para preservar franquia/tempo, mantendo precisão até ~200 Mbps.

**Latência:**
- 20 pings (HEAD requests para `/__down?_cb=<ts>`)
- Descarta a primeira amostra (warm-up)
- Mediana das amostras restantes = `latency`
- `jitter = mean(|amostra_i - mediana|)`

**Download:**
- Warmup: 1 round com `preset.dlWarmup`
- `preset.dlRounds` rounds com `preset.dlRound` cada
- EMA α=0.3 aplicado ao throughput de cada chunk lido
- P90 dos rounds = `dl`
- AbortController por round; timeout `preset.dlTimeoutMs`

**Upload:**
- Buffer pré-gerado com `crypto.getRandomValues` em chunks de 65536 bytes
- Warmup: 1 round com `preset.ulWarmup`
- `preset.ulRounds` rounds com `preset.ulRound` cada (POST com Blob)
- EMA α=0.3 + P90 = `ul`
- AbortController por round; timeout `preset.ulTimeoutMs`

**Packet loss:**
- Estimado por `packetLoss = (timeouts / totalPings) * 100`
- Inclui pings extras durante DL/UL para detectar loss

**Progresso:**
- `overallProgress = 0.15 × latProgress + 0.45 × dlProgress + 0.40 × ulProgress`

**CORS:** POSTs para `/__up` usam `Content-Type` simples (sem header customizado) para evitar preflight.

### 3.2 `classifier.ts` — Classificador de qualidade

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

**`stability(r): number`** (0–100)
```
jitterScore = 100 - clamp((jitter/50)*100, 0, 100)
lossScore   = 100 - clamp((loss/2)*100,  0, 100)
result      = round(0.6 * jitterScore + 0.4 * lossScore)
```

**`stabilityLabel(score): string`**
- ≥85 → "Muito estável"
- ≥60 → "Estável"
- ≥35 → "Oscilando"
- <35 → "Instável"

**`buildDiagnosis(r, c, recentHistory?): string[]`**

Retorna array de parágrafos em pt-BR:
1. Parágrafo base por quality
2. Parágrafos por tags (veryUnstable > packetLoss > unstable > highLatency > lowUpload)
3. Avisos pontuais (latência>80ms, loss>2%, jitter>50ms)
4. Análise histórica (se ≥3 registros recentes): padrão de latência/loss/lentidão

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

`appendRecord` constrói `TestRecord` a partir de `SpeedTestResult + { serverName, isp, deviceType, connectionType }`.

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

### 3.6 `format.ts` — Formatação

```ts
formatMbps(v: number, unit?: 'mbps'|'gbps'): string  // divide por 1000 se gbps
formatMs(v: number): string    // arredonda para inteiro
formatDate(ts: number): string // dd/MM/yyyy HH:mm
formatDateIsoLike(ts: number): string // YYYY-MM-DD para nome de arquivo
```

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

**Assinatura de `start`**: `start(connectionType?: ConnectionType)`. O hook repassa para `runSpeedTest`, que escolhe o preset (default ou mobile). Ver §3.1.

**`live: LivePoint[]`** — buffer dos últimos 60 pontos `{ t: number, speed: number, phase: 'download'|'upload' }`. Mantido por compatibilidade interna; **não é mais consumido** pela RunningScreen (gauge passou a ser apenas número + unidade). O `LiveChart` permanece no codebase mas não está renderizado em nenhuma tela.

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
}
```

Chave localStorage: `linka.speedtest.settings.v1`  
`update` faz merge com settings atual e persiste imediatamente.

> O campo `scale` foi removido da UI do BottomSheet. Mantemos no tipo para evitar migração e potencial perda de chave localStorage existente em usuários atuais.

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

### 5.4 `Gauge`

Props: `instantMbps, unit?`

Sem SVG. Apenas `<div>` com:
- `.lk-gauge__value` — número (96px, font-display, peso 700)
- `.lk-gauge__unit` — unidade (18px)

Recebe `instantMbps` já suavizado por EMA via `useSpeedTest`. Não tem mais a label de fase (movida para `phraseFor()` na RunningScreen) nem o aro de progresso.

### 5.5 `LiveChart`

Não consumido por nenhuma tela atualmente. Mantido para uso futuro.

### 5.6 `icons.tsx` — Biblioteca de ícones

Todos os ícones são SVGs inline stroke-based. Aceitam prop `size?: number` (default 24).

| Componente | Uso |
|---|---|
| `IconDeviceMobile` | Celular |
| `IconDeviceTablet` | Tablet |
| `IconDeviceDesktop` | PC/Desktop |
| `DeviceIcon(kind)` | Wrapper que escolhe pelo DeviceType |
| `IconWifi` | Conexão Wi-Fi |
| `IconCellular` | Conexão móvel |
| `IconCable` | Conexão cabo/ethernet |
| `ConnectionIcon(kind)` | Wrapper pelo ConnectionType |
| `IconServer` | Servidor (PathRow) |
| `IconBuilding` | Empresa/ISP |
| `IconGames` | Games online (ResultScreen use cases) |
| `IconStream` | Streaming (ResultScreen use cases) |
| `IconWork` | Home Office (ResultScreen use cases) |
| `IconVideoCall` | Videochamada (ResultScreen use cases) |
| `IconPdf` | FAB PDF |
| `IconShare` | Compartilhar |

### 5.7 `InfoCards` (mantido, desativado)

Componente da versão anterior da StartScreen. Mantido no projeto mas não mais utilizado. Pode ser removido quando o código for sanitizado.

---

## 6. `App.tsx` — Estado global e roteamento

Estado gerenciado em `App.tsx`:

| State | Tipo | Descrição |
|---|---|---|
| `theme` | `'dark'\|'light'` | Tema atual, persiste em localStorage |
| `screen` | `Screen` | Tela ativa: `'start'\|'running'\|'result'\|'history'` |
| `previous` | `TestRecord\|null` | Registro do teste anterior à sessão atual (para comparação na ResultScreen) |
| `lastRecord` | `TestRecord\|null` | Último registro do histórico, exibido como card na StartScreen |
| `historyInitialId` | `string\|undefined` | Id pré-selecionado quando se abre o HistoryScreen direto no detalhe |
| `recordedRef` | `RefObject<boolean>` | Evita gravação duplicada no histórico |
| `backStackRef` | `RefObject<Screen[]>` | Pilha de telas anteriores para swipe → |
| `forwardStackRef` | `RefObject<Screen[]>` | Pilha de telas avançáveis para swipe ← |

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
  → previousRecord() → setPrevious(prev)
  → appendRecord(test.result, { serverName: server.name, isp: server.isp, ... })
  → setLastRecord(novoRegistro)
  → goTo('result')
```

**Carregamento inicial do último resultado:**

Um `useEffect` sem deps (executa só na montagem) chama `previousRecord()` e popula `lastRecord`, garantindo que o card da StartScreen apareça mesmo na primeira abertura do PWA na sessão.

---

## 7. CSS e tokens (`src/tokens.css`)

### Temas

```css
[data-theme="dark"]  { --bg: #000000; --surface: #0D0D0D; --border: #1C1C1E; --text: #FFFFFF; ... }
[data-theme="light"] { --bg: #FFFFFF; --surface: #F6F7F9; --border: #E5E7EB; --text: #0D0D1A; ... }
```

### Tokens globais (ambos os temas)

| Token | Valor | Uso |
|---|---|---|
| `--accent` | `#6C2BFF` | Cor primária da marca |
| `--dl` | `#3AB6FF` | Download (azul) |
| `--ul` | `#22C55E` | Upload (verde) |
| `--error` | `#EF4444` | Erros e alertas |
| `--font-display` | `'Space Grotesk', sans-serif` | Números e títulos |
| `--font-body` | `'Inter', sans-serif` | Texto corrido |
| `--radius` | `16px` | Border-radius de cards |
| `--radius-button` | `12px` | Border-radius de botões |
| `--space-xs` | `4px` | Espaçamento base |
| `--space-sm` | `8px` | |
| `--space-md` | `12px` | |
| `--space-lg` | `16px` | |
| `--space-xl` | `24px` | |
| `--space-xxl` | `32px` | |

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
**Arquivo:** `classifier.test.ts` — 24 testes cobrindo:

- `classify()`: todos os 5 níveis de quality + todas as 5 tags
- `stability()`: casos extremos (score=100, score=0) e valores intermediários
- `stabilityLabel()`: todas as 4 faixas
- `buildDiagnosis()`: parágrafo base por quality, parágrafos por tag, análise histórica

**Comando:** `npm test`

**Regra:** os 24 testes existentes **nunca podem ser quebrados** sem justificativa documentada e plano de substituição. Qualquer mudança em `classifier.ts` exige atualização dos testes correspondentes.
