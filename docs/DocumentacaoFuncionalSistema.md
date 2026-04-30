# Documentação Funcional do Sistema — linka SpeedTest PWA

> Descreve as 4 telas do aplicativo, fluxos de navegação, estados de UI e comportamento esperado do ponto de vista do usuário.

---

## Hierarquia de navegação

```
App (estado global)
├── StartScreen         ← tela inicial (padrão)
├── RunningScreen       ← durante o teste (todos os modos)
├── ResultScreen        ← resultado do teste
│   ├── DiagnosticScreen  ← diagnóstico de 6 áreas (acesso via ResultScreen)
│   ├── GamerScreen       ← avaliação gamer: ping/jitter/loss + rows por jogo
│   └── RecommendScreen   ← 4 ações para melhorar o Wi-Fi
├── HistoryScreen       ← histórico de testes
├── ComparisonScreen    ← comparativo perto vs longe do roteador
├── BeforeAfterScreen   ← comparação antes/depois de uma ação
└── RoomTestScreen      ← seleção de cômodo para Teste por local
```

O roteamento é feito por `switch/case` em `App.tsx` via `useState<Screen>`. Não há react-router. Cada tela é um componente que ocupa 100% do viewport.

### Fluxo principal

```
StartScreen → [Teste rápido / completo] → RunningScreen → [Conclusão] → ResultScreen
   ↑                                        [Cancelar] ↓                ↓ [Testar novamente]
   │                                       StartScreen                  │
   ├─[Ver histórico]──────────────────────────────────────► HistoryScreen
   └─[Link último teste]─────────────────────────────────► HistoryScreen (detalhe pré-aberto)

StartScreen → [Comparar locais] → ComparisonScreen (passo 1/2)
   ComparisonScreen → [Testar perto] → RunningScreen → ComparisonScreen (passo 2/2)
   ComparisonScreen → [Testar longe] → RunningScreen → ComparisonScreen (resultado)

StartScreen → [Antes e Depois] → BeforeAfterScreen (passo 1 — Antes)
   BeforeAfterScreen → [Iniciar teste (antes)] → RunningScreen → BeforeAfterScreen (passo 2 — Depois)
   BeforeAfterScreen → [Iniciar teste (depois)] → RunningScreen → BeforeAfterScreen (resultado)

StartScreen → [Prova Real (3×)] → RunningScreen (Teste 1 de 3)
   → [automático] → RunningScreen (Teste 2 de 3)
   → [automático] → RunningScreen (Teste 3 de 3) → ResultScreen (média dos 3)

StartScreen → [Teste por local] → RoomTestScreen → [seleciona cômodo]
   → RunningScreen → ResultScreen (com locationTag)

ResultScreen → [Diagnóstico] → DiagnosticScreen → [‹ Início] → ResultScreen
ResultScreen → [Modo Gamer]  → GamerScreen      → [‹ Início] → ResultScreen
                                                  → [Refazer teste] → RunningScreen
ResultScreen → [Recomendações] → RecommendScreen → [‹ Início] → ResultScreen
```

### Navegação por gestos

- **Swipe horizontal** (→ volta · ← avança): App mantém pilha de telas em `App.tsx` (`backStackRef` / `forwardStackRef`). Threshold: 80 px com razão `|Δx| > |Δy| × 1,5` para evitar conflito com scroll vertical. Início de gesto sobre `.lk-sheet`, `.lk-history__list`, botões ou inputs é ignorado.
- **Swipe vertical no BottomSheet**: arrastar a alça para cima abre; para baixo, fecha.
- O Header não traz mais o botão "X / Voltar" — a volta é feita por swipe ou pelo botão de cancelar das próprias telas (RunningScreen tem "Cancelar"; HistoryScreen tem "← Voltar" no detalhe interno).

---

## 1. StartScreen

### Finalidade

Ponto de entrada do app. Permite iniciar o teste no modo escolhido, acessar modos avançados (Comparar locais, Antes e Depois, Prova Real, Teste por local) e consultar o histórico.

### Layout

```
┌──────────────────────────────────┐
│  HEADER (logo + botão histórico) │
│                                  │
│  [Sem conexão]                   │  ← erro offline (sem botão de retry)
│  [⚠ erro + Tentar novamente]     │  ← só aparece se error != null
│                                  │
│         ╭─────────────╮          │  ← hero: flex:1, centralizado
│         │             │          │
│         │   Iniciar   │          │  ← círculo 200px, outlined accent
│         │             │          │     animação anel pulsante
│         ╰─────────────╯          │
│                                  │
│     [ Normal ] [ Avançado ]      │  ← pill segmentado (`.lk-start__mode-toggle`)
│                                  │
│  Download, upload e latência     │  ← muda conforme modo selecionado
│  Consumo estimado ~ 75 MB        │
│  Servidor: Cloudflare SP         │
│                                  │
│  ↓ 87,3 ↑ 32,1 Mbps             │  ← card último resultado (só se há histórico)
│                                  │
│  [Conexão] [Servidor]            │  ← IOSList de contexto
│                                  │
│  [ Light ] [ Dark ]              │  ← toggle de tema
│  Toque no círculo                │  ← hint de rodapé
└──────────────────────────────────┘
```

### CTA circular

Botão circular `200px × 200px`, `border-radius: 50%`, outlined (`border: 1.5px solid var(--accent)`), fundo transparente. Texto "Iniciar" em Space Grotesk 600 20px na cor accent. Dois pseudo-elementos pulsantes (`::before`, `::after`) animam `lkOrbPulse` com offset de 1,2 s entre eles.

Durante loading: texto "Aguardando", botão `disabled` (`opacity: 0.35`, animação suspensa).

Ao clicar: chama `onStart(selectedMode)` onde `selectedMode` é o estado interno do toggle de modo.

### Seletor de modo (pill segmentado)

```
[ Normal ] [ Avançado ]   ← pill com dois botões, estilo .lk-start__mode-toggle
```

- Componente: `.lk-start__mode-toggle` (segmented pill, mesmo padrão do toggle de tema)
- Estado gerenciado localmente em `StartScreen` via `useState<'normal' | 'advanced'>('normal')`
- Botão ativo recebe `.lk-start__mode-btn--active` (fundo `var(--surface)`, texto `var(--text)`, peso 600)
- Botão inativo: texto `var(--text-2)`, peso 500

### Seleção de modo

| Modo | `SpeedTestMode` | Consumo estimado | Descrição exibida |
|---|---|---|---|
| Normal (padrão) | `'normal'` | Wi-Fi: ~75 MB · Mobile: ~70 MB | Download, upload e latência |
| Avançado | `'advanced'` | Wi-Fi: ~300 MB · Mobile: ~200 MB | Diagnóstico completo · bufferbloat, DNS e mais |

O aviso "recomendamos Wi-Fi" aparece apenas no modo Avançado quando `device.connectionType === 'mobile'` ou incondicionalmente (pois o teste é pesado).

> **Fase 2:** o modo `'advanced'` executará fases adicionais (bufferbloat, DNS). Atualmente usa o mesmo preset do modo Normal.

### Detecção de conectividade

`canStart = isOnline && !loading && !!server?.available && !!device`

Quando `isOnline === false` (evento `offline` do browser), exibe bloco de erro "Sem conexão. Conecte-se à internet para medir sua velocidade." sem botão de retry — o app aguarda o evento `online` para se auto-reabilitar. Todos os botões de ação ficam `disabled` enquanto offline.

### Hint de Modo Gamer

Quando `settings.gamingProfile !== 'off'`, exibe `🎮 Modo Gamer ativo: [nome do perfil]` em cor `var(--accent)` entre o toggle e os links de ação. Perfis: Casual / MOBA / FPS / Cloud Gaming.

### Links inferiores

- **Comparar locais** — `btn-text`. `disabled` quando `!canStart`. Tap → `onStartComparison()`.
- **Antes e Depois** — `btn-text`. `disabled` quando `!canStart`. Tap → `onStartBeforeAfter()`.
- **Prova Real (3×)** — `btn-text`. `disabled` quando `!canStart`. Tap → `onStartProvaReal()`. Roda 3 testes completos consecutivos e exibe a média.
- **Teste por local** — `btn-text`. `disabled` quando `!canStart`. Tap → `onStartRoomTest()`. Navega para `RoomTestScreen` para selecionar o cômodo.
- **Último teste** — exibido como linha de texto clicável (`↓ X ↑ Y Mbps · Ver último teste`) somente se `lastRecord != null`. Sem card, sem borda, sem fundo. Tap → `onShowLastResult()`.
- **Ver histórico** — sempre visível. Tap → `onShowHistory()`.

### BottomSheet — peek (fechado)

Sempre visível na base da tela (110px fixos). Conteúdo:
- Handle bar (indicador de arrasto)
- PathRow: ícone de dispositivo → ícone de conexão → ícone de servidor, com labels e linha animada conectando

Tap no handle **ou** arrasto vertical para cima sobre a alça → abre o sheet. Arrasto para baixo → fecha. Threshold de 60 px no eixo vertical.

### BottomSheet — aberto

Desliza de baixo para cima com `cubic-bezier(0.32,0.72,0,1)`, 300ms. Backdrop escuro fecha no tap fora.

**Seção: Informações**
| Campo | Valor |
|---|---|
| Servidor | Nome + localização (`name · colo`) |
| Localização | `loc` (país/cidade da PoP Cloudflare) |
| Seu IP | IP público detectado |
| Operadora | `isp` (asOrganization do Cloudflare) |
| Dispositivo | Tipo (Celular/Tablet/PC) e tipo de conexão |

**Seção: Configurações**

- **Unidade** — toggle segmentado: `[Mbps] Gbps` (default: Mbps)
- **Conexão** — toggle segmentado: `[Auto] Wi-Fi Cable Celular`
- **Servidor** — seletor de servidor (atualmente só Cloudflare)

**Seção: Privacidade**

- **IP ao compartilhar** — toggle segmentado: `[Ocultar] Mostrar` (default: Ocultar). Quando "Ocultar", o campo "Seu IP" na seção Detalhes da ResultScreen exibe "Oculto" em vez do IP real.
- Nota informativa: "Seus testes ficam salvos neste aparelho. Você decide quando exportar ou compartilhar."

> A opção "Gráfico" (escala linear/log) foi removida da UI; o campo `scale` permanece em `Settings` por compatibilidade de localStorage e não tem efeito visual atualmente.

Todas as configurações persistem em localStorage via `useSettings`.

### Serviços consumidos

- `useDeviceInfo('cloudflare')` → `device`, `server`, `loading`, `error`, `reload`
- `useSettings()` → `settings`, `update`

---

## 2. RunningScreen

### Finalidade

Exibe o progresso do teste em tempo real de forma minimalista: número grande de velocidade instantânea e uma frase descrevendo, em pt-BR leigo, o que está sendo medido. Sem aro de progresso, sem gráfico, sem barra.

### Layout — fases normais

```
┌──────────────────────────────────┐
│  HEADER (logo)                   │
│                                  │
│            87,3                  │  ← número instantâneo (96px)
│            Mbps                  │  ← unidade (18px)
│                                  │
│  Medindo a velocidade de         │  ← frase narrativa
│  download…                       │
│                                  │
│         Cancelar                 │  ← btn-text discreto no rodapé
└──────────────────────────────────┘
```

### Layout — falha

```
┌──────────────────────────────────┐
│  HEADER (logo)                   │
│                                  │
│            ⓘ                     │  ← ícone alerta (vermelho)
│   Não foi possível completar     │
│   o teste                        │
│   Verifique sua conexão e tente  │
│   novamente.                     │
│                                  │
│   [Testar novamente]             │  ← btn-primary
│         Cancelar                 │  ← btn-text
└──────────────────────────────────┘
```

### Fases do teste e frases exibidas

| Phase | Frase exibida |
|---|---|
| `latency` | "Verificando a resposta do servidor…" |
| `download` | "Medindo a velocidade de download…" |
| `upload` | "Medindo a velocidade de upload…" |
| `done` | "Quase pronto…" (transição automática para ResultScreen) |
| `error` | Tela substituída pelo bloco de falha com retry |
| `idle`/outros | "Preparando o teste…" |

### Gauge

Componente `<Gauge>` simplificado: `display: flex column`, número e unidade centralizados, sem SVG. O número é `instantMbps` suavizado por EMA α=0.25 via `requestAnimationFrame` no `useSpeedTest`.

### Cancelar

- Em estado normal: botão "Cancelar" `btn-text` no rodapé.
- Em estado de erro: botão "Cancelar" abaixo do "Testar novamente".

Ambos chamam `test.cancel()` + `test.reset()` e voltam para a StartScreen via pilha de navegação.

### Rótulo de sessão (Prova Real)

Quando a Prova Real está ativa, a prop opcional `sessionLabel` é passada com o texto `"Teste X de 3 — Prova Real"`. Exibido abaixo da frase narrativa em `var(--accent)` (12px, weight 600). Ausente em testes normais.

### Props recebidas de App.tsx

```ts
theme, onToggleTheme,
phase, instantMbps,
onCancel, onRetry,
unit,
sessionLabel?   // ex: "Teste 2 de 3 — Prova Real" — omitido em testes normais
```

---

## 3. ResultScreen

### Finalidade

Exibe os resultados completos do teste, diagnóstico em linguagem leiga, utilidade prática da conexão e opções de ação (refazer, exportar PDF, compartilhar, ver histórico).

### Lista de métricas (IOSList)

A lista de métricas sempre exibe (em ordem):
1. **Download** — Mbps, ícone azul `--dl`
2. **Upload** — Mbps, ícone verde `--ul`
3. **Latência** — ms, ícone cinza (ping)
4. **Oscilação** — ms, ícone cinza (jitter)
5. **Histórico** — chevron, navega para HistoryScreen
6. *(expansível via "Mais")* Perda de pacotes · Operadora · Servidor
7. **Mais / Menos** — toggle de expansão

> Latência e Oscilação são sempre visíveis (não dependem do botão "Mais").

### Layout

```
┌──────────────────────────────────┐
│  HEADER (logo)                   │  ← volta por swipe →
│                                  │
│  ↓ Download    |   ↑ Upload      │
│  87,3 Mbps     |   32,1 Mbps    │  ← métricas primárias (Space Grotesk 700 36px)
│                                  │
│  18 ms    3 ms    Muito estável  │  ← secundárias: Resposta · Oscilação · Estabilidade
│  Resposta Oscilação Estabilidade │
│                                  │
│  Boa para o dia a dia —          │  ← frase de diagnóstico única (lk-diagnosis, 17px)
│  jogos online podem ter impacto  │
│  por latência.                   │
│                                  │
│  ── O que fazer agora ──         │
│  ┌────────────────────────────┐  │  ← card de recomendação (alta prioridade)
│  │ Reiniciar o roteador        │  │     borda esquerda colorida por prioridade
│  │ Tente desligar e religar…  │  │
│  └────────────────────────────┘  │
│  [mais recomendações se houver]  │
│                                  │
│  [🎮 Atenção] [📺 Bom] [💼 Bom] [📹 Bom]  ← linha horizontal, sem título
│                                  │
│  ── Detalhes ──                  │
│  Servidor     Cloudflare · GIG   │
│  Operadora    Vivo Fibra         │
│  Seu IP       Oculto (ou IP)     │  ← "Oculto" quando hideIpOnShare=true
│  Perda        0,0%               │
│  Data         28/04/2026 14:32   │
│                                  │
│  ── Teste anterior ──            │  ← só se houver registro anterior
│  27/04 · ↓ 71,2 · ↑ 28,4 Mbps  │
│  Ver histórico →                 │
│                                  │
│  [Testar novamente]              │
│  [↑ Compartilhar]                │
│                              [PDF]│  ← FAB circular roxo no canto inferior direito
└──────────────────────────────────┘
```

### Frase de diagnóstico (`lk-diagnosis`)

Substituiu o banner de qualidade e a seção "O que isso significa?". Uma frase única, curta e direta gerada por `buildShortPhrase(result, quality, scenarioContext)`. Formato: **"[status] — [causa/ação]."**

Exemplos por cenário:
| Situação | Frase exibida |
|---|---|
| Excelente, tudo OK | "Internet excelente — todos os usos funcionam perfeitamente." |
| Boa, tudo OK | "Boa conexão — streaming, trabalho e jogos funcionam bem." |
| Boa, games com latência | "Boa para o dia a dia — jogos online podem ter impacto por latência." |
| Boa, games com jitter | "Boa para o dia a dia — jogos online podem ter impacto por oscilação." |
| Boa, games ruim | "Boa para navegação e streaming — pode não ser ideal para jogos online." |
| Rápida mas instável | "Conexão instável — verifique o roteador ou o cabo." |
| Lenta | "Internet lenta — velocidade insuficiente para a maioria dos usos." |
| Sem conexão | "Sem conexão detectada — verifique se está conectado à internet." |

### Linha de cenários (`lk-usegrid`)

4 ícones SVG em flex horizontal (`justify-content: space-between`), sem título. Cada item: ícone (24px) + label pequeno + chip de status.

Labels de status:
| Status interno | Label padrão | Games (override) |
|---|---|---|
| `good` | "Bom" | "Bom" |
| `maybe` | "Atenção" | "Atenção" |
| `limited` | "Ruim" | "Pode falhar" |

Thresholds de avaliação:

| Uso | Critério "Bom" | Critério "Atenção" |
|---|---|---|
| Games online | DL≥10, lat≤40, jitter≤20, loss≤0.5% | DL≥5, lat≤80, jitter≤40, loss≤2% |
| Streaming 4K | DL≥25 Mbps | DL≥10 Mbps |
| Home Office | DL≥10, UL≥5, lat≤100 | DL≥5, UL≥2 |
| Videochamada | DL≥5, UL≥2, lat≤100, jitter≤30 | DL≥2, UL≥1, lat≤150 |

Abaixo de "Atenção" → "Ruim" (games: "Pode falhar").

### FAB PDF

Botão circular 52px, `position:fixed; bottom:20px; right:20px`, fundo `var(--accent)`.  
Tap → `exportResultPdf(result, server.name, server.isp)` — gera PDF A4 portrait com logo linka, dados do teste, diagnóstico e estabilidade.

### Compartilhar no WhatsApp

Botão "WhatsApp" em verde `#22C55E` na seção de ações (`.lk-actions`). Fluxo:

1. Gera card visual 1080×540 px via `generateShareCard()` (canvas com DL/UL/latência, fundo dark, barra accent) aguardando `document.fonts.ready` para garantir fontes carregadas.
2. Se `navigator.canShare({ files })` → `navigator.share({ files: [Blob PNG] })` (Web Share API Level 2 — Android / iOS 15+).
3. Fallback: abre `https://wa.me/?text=` com texto formatado em ASCII.

Durante a geração o botão exibe `disabled` + `opacity: 0.5`.

### Compartilhar (geral)

`navigator.share` (Web Share API) com fallback para `navigator.clipboard`. Texto compartilhado:
```
linka SpeedTest — Conexão boa
↓ 87,3 Mbps · ↑ 32,1 Mbps
Resposta 18 ms · Oscilação 3 ms
28/04/2026 14:32
```

### Modo Gamer — GamingVerdict

Quando `gamingProfile !== 'off'`, exibe bloco `GamingVerdict` entre a linha de cenários e a seção Detalhes. O bloco:

- Avalia métricas do resultado contra os thresholds do perfil selecionado (`GAMING_PROFILES[profile].good`).
- Lista os critérios que **falham** (`dl`, `latency`, `jitter`, `packetLoss`) com label em pt-BR.
- Estilo: borda esquerda verde (`--ul`) quando todos passam; vermelha (`--error`) quando há falhas. Fundo tênue correspondente.
- Exemplo de mensagem (FPS, latência alta): "✗ Resposta muito alta para FPS (atual: 55 ms, ideal: ≤ 30 ms)"

### Card "O que fazer agora"

Seção entre diagnóstico e use cases. Exibe 1–3 `Recommendation` geradas por `buildRecommendations(result, classification, history)`:

| Prioridade | Visual |
|---|---|
| `high` | Borda esquerda vermelha (`var(--error)`) |
| `medium` | Borda esquerda amarela (`var(--warn)`) |
| `low` | Borda esquerda accent (`var(--accent)`) |

Não aparece quando `quality === 'excellent'` (nenhuma recomendação gerada).

### IP ao compartilhar

O campo "Seu IP" na seção Detalhes exibe:
- `settings.hideIpOnShare === true` → "Oculto"
- `settings.hideIpOnShare === false` → IP real de `server.ip`

Configurado no BottomSheet → seção Privacidade.

### Seção Diagnóstico Avançado (modo `advanced`)

Visível apenas quando `result.mode === 'advanced'` e há dados de bufferbloat ou p25/p75. IOSList com:

| Item | Ícone | Valor |
|---|---|---|
| Bufferbloat | bolt | Nota A–F colorida (A/B = verde, C = amarelo, D/F = vermelho) + descrição |
| Latência sob carga | ping | ms + delta em laranja se positivo |
| Oscilação sob carga | jitter | ms |
| Estabilidade download | download | intervalo p25–p75 em Mbps |
| Perda de pacotes | loss | Baixo / Médio / Alto (com cor) |

### Seção DNS (modo `advanced`)

Visível quando `result.dns` está presente. IOSList com:

- **Vencedor** — ícone bolt verde, badge ms em destaque, label "· vencedor"
- **Demais servidores** com amostras — ordenados por p50 crescente, ms em cinza
- **Como trocar o DNS** — ícone cog accent, subtitle com o nome do servidor vencedor, navega para `DNSGuideScreen`

Nota de rodapé: "Medição inclui overhead HTTP/TLS — comparação relativa entre servidores."

### Serviços consumidos

- Props: `result (SpeedTestResult)`, `server (ServerInfo | null)`, `previous (TestRecord | null)`, `unit`, `hideIpOnShare (boolean)`, `onShowDNSGuide?: (serverId: string) => void`
- `classify(result)` → classificação
- `buildShortPhrase(result, quality, scenarioContext)` → frase de diagnóstico única
- `buildRecommendations(result, classification, history)` → recomendações
- `stability(result)` → score numérico
- `loadHistory()` → passado para buildRecommendations
- `exportResultPdf()` → geração de PDF

---

## 3.bis DNSGuideScreen

### Finalidade

Tela modal (acessível via botão "Como trocar o DNS" na ResultScreen) que exibe instruções passo a passo para configurar o servidor DNS vencedor no dispositivo do usuário. Quatro plataformas cobertas via abas.

### Layout

```
┌──────────────────────────────────┐
│  ‹ Voltar   Como trocar o DNS    │
│                                  │
│  Cloudflare                      │  ← nome do servidor vencedor
│  [1.1.1.1]  [1.0.0.1]           │  ← badges com IPs (primário e secundário)
│                                  │
│  [Android] [iPhone/iPad] [Windows] [Roteador]  ← abas pills
│                                  │
│  1 ─ Abra Configurações → ...    │
│  2 ─ Toque em DNS privado.       │  ← lista numerada de passos
│  ...                             │
│                                  │
│  ┌──────────────────────────────┐ │
│  │ A troca de DNS não garante  │ │  ← nota explicativa
│  │ mais velocidade, mas pode…  │ │
│  └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### Plataformas

| Aba | Instruções |
|---|---|
| Android | DNS privado ou configuração manual por Wi-Fi |
| iPhone / iPad | Ajustes → Wi-Fi → DNS manual |
| Windows | Configurações → Rede → DNS manual IPv4 |
| Roteador | Painel admin → WAN/DNS → substituição nos campos |

### Props

- `serverId: string` — ID do servidor vencedor (cloudflare / google / adguard / quad9 / opendns)
- `onBack: () => void` — volta para ResultScreen

---

## 4. DiagnosticScreen

### Finalidade

Analisa o resultado do último teste em 6 áreas (Internet, Wi-Fi, Resposta, Oscilação, Falhas, Qualidade por uso) e apresenta um diagnóstico em cards visuais. Acessível a partir do botão "Diagnóstico" na ResultScreen.

### Layout

```
┌──────────────────────────────────┐
│  ‹ Início          Diagnóstico   │
│                                  │
│  N de 6 áreas OK                 │  ← N em verde se ≥5, amarelo senão
│  "Sua conexão está saudável."    │
│                                  │
│  ┌──────────┐  ┌──────────┐      │  ← grid 2-col
│  │ [ícone]  │  │ [ícone]  │      │
│  │ Aprovado │  │ Atenção  │      │  ← badge colorido por tone
│  │ Internet │  │ Wi-Fi    │      │
│  │ descrição│  │ descrição│      │
│  └──────────┘  └──────────┘      │
│   ... mais 4 cards ...           │
└──────────────────────────────────┘
```

### Avaliações

| Área | Critério "Aprovado" | Critério "Atenção" | Critério "Falha" |
|---|---|---|---|
| Internet | DL ≥ 25 Mbps | DL ≥ 5 Mbps | DL < 5 Mbps |
| Wi-Fi | cabo ou lat ≤ 30 ms | lat > 30 ms em Wi-Fi | — |
| Resposta | lat ≤ 40 ms | lat ≤ 100 ms | lat > 100 ms |
| Oscilação | jitter ≤ 5 ms | jitter ≤ 20 ms | jitter > 20 ms |
| Falhas | packetLoss = 0 | packetLoss ≤ 1% | packetLoss > 1% |
| Qualidade por uso | 4–5 critérios OK | 2–3 critérios OK | 0–1 critério OK |

### Props

```ts
result: SpeedTestResult
connectionType: ConnectionType | null
onBack: () => void
```

---

## 5. GamerScreen

### Finalidade

Exibe as métricas relevantes para jogos online (ping, jitter, perda de pacotes) e avalia cada categoria de jogo. Acessível pelo botão "Modo Gamer" na ResultScreen.

### Layout

```
┌──────────────────────────────────┐
│  ‹ Início          Modo Gamer    │
│                                  │
│  [Otimizado p/ jogos]            │  ← Chip accent
│  "Ótima para FPS competitivo."   │  ← título com avaliação geral
│  "Latência, jitter e perda…"     │
│                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐   │  ← stat grid 3-col
│  │ Ping │  │Jitter│  │ Loss │   │
│  │ 18ms │  │ 3ms  │  │ 0,0% │   │
│  └──────┘  └──────┘  └──────┘   │
│                                  │
│  ┌────────────────────────────┐  │  ← IOSList
│  │ 🎮 FPS competitivo   Excelente│  │
│  │ 🎮 MOBA              Excelente│  │
│  │ 🎮 MMO               Excelente│  │
│  │ 🎮 Cloud Gaming      Atenção  │  │
│  └────────────────────────────┘  │
│                                  │
│  [Refazer teste]                 │  ← btn-primary, volta para RunningScreen
└──────────────────────────────────┘
```

### Thresholds por jogo

| Jogo | Excelente | Atenção | Ruim |
|---|---|---|---|
| FPS competitivo | lat≤20, jitter≤3, loss=0 | lat≤40 | lat>40 |
| MOBA | lat≤30, jitter≤5 | lat≤60 | lat>60 |
| MMO | lat≤60 | lat≤120 | lat>120 |
| Cloud Gaming | DL≥15, lat≤40 | DL≥8, lat≤80 | abaixo disso |

### Props

```ts
result: SpeedTestResult
onBack: () => void
onRetest: () => void
```

---

## 6. RecommendScreen

### Finalidade

Lista até 4 ações concretas para melhorar a conexão. Se houver recomendações dinâmicas geradas por `buildRecommendations()` (baseadas no resultado), exibe-as em ordem de prioridade. Caso contrário, exibe 4 dicas estáticas gerais de Wi-Fi. Acessível pelo botão "Recomendações" na ResultScreen.

### Layout

```
┌──────────────────────────────────┐
│  ‹ Início       Recomendações    │
│                                  │
│  "N ações para melhorar          │  ← dinâmico ou "4 ações que podem…"
│   sua conexão"                   │
│  "Em ordem de impacto. Comece    │
│   pela primeira."                │
│                                  │
│  ┌──────────────────────────┐    │
│  │ [●] 1. Mude o canal Wi-Fi│    │  ← card: ícone tintado + título + desc + CTA
│  │     Redes próximas podem  │    │
│  │     estar usando…         │    │
│  │     Como fazer →          │    │
│  └──────────────────────────┘    │
│   ... mais 3 cards ...           │
└──────────────────────────────────┘
```

### Recomendações estáticas (fallback)

1. Mude o canal Wi-Fi — evitar interferência de redes próximas
2. Reposicione o roteador — centro da casa, longe de armários
3. Considere usar cabo — ganho de 30%+ para TV e desktop
4. Sistema mesh — para casas com sinal fraco em múltiplos cômodos

### Props

```ts
result: SpeedTestResult | null
quality: string               // Classification.primary
tags: Tag[]
onBack: () => void
```

---

## 7. HistoryScreen

### Finalidade

Lista os últimos 50 testes com gráfico de evolução, resumo de médias e detalhe individual ao clicar. Permite exportar o histórico completo em PDF e limpar o histórico.

### Layout

```
┌──────────────────────────────────┐
│  HEADER (logo)                   │  ← volta por swipe →
│                                  │
│  Histórico de testes             │
│                                  │
│  ┌────────────────────────────┐  │
│  │ COMO SUA INTERNET ANDA·24h │  │  ← bloco de diagnóstico textual
│  │ Sua internet está boa…     │  │     baseado em testes das últimas 24h
│  │ ⚠ Tempo de resposta alto…  │  │     (fallback: últimos 5 se 24h vazio)
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │  ← insights (apenas se ≥ 3 testes)
│  │ ▌ Download em queda        │  │     borda esquerda colorida por severidade
│  │   O download caiu 35%…     │  │
│  └────────────────────────────┘  │
│  [Faça mais X testes para ver    │  ← hint quando 1 ou 2 testes registrados
│   análise do seu histórico]      │
│                                  │
│  Evolução recente                │
│  ┌────────────────────────────┐  │  ← AreaChart 140px (últimos 10 testes)
│  │  ~~~ Download (azul)       │  │     sem eixos, sem tooltip
│  │  ~~ Upload (verde)         │  │
│  └────────────────────────────┘  │
│  ↓ Download  ↑ Upload            │  ← legenda completa
│                                  │
│  Média dos seus testes           │
│  ↓ 87,3 Mbps  ↑ 32,1 Mbps      │  ← médias DL/UL coloridas
│  Conexão boa — 8 testes          │  ← qualidade da média + contagem
│                                  │
│  ── lista de itens ──            │
│  28/04 14:32     [Excelente]     │
│  [PC][WiFi] Cloudflare · Vivo    │
│  ↓ 123 Mbps  ↑ 45 Mbps  lat 18ms│
│  ────────────────────────────    │
│  [mais itens...]                 │
│                                  │
│  [Limpar histórico]              │
│                              [PDF]│  ← FAB
└──────────────────────────────────┘
```

### Bloco de diagnóstico (topo da tela)

### Seção de insights

Exibida entre o diagnóstico e o gráfico quando `items.length >= 3`. Gerada por `buildHistoryInsights(items)` retornando até **4** `HistoryInsight`:

| Severidade | Borda esquerda | Exemplos de insight |
|---|---|---|
| `critical` | `var(--error)` | Download em queda forte (>40%), perda de dados repetida, semana muito pior |
| `warning` | `var(--warn)` | Download em queda moderada (>20%), resposta alta recorrente, upload fraco, horário de pico |
| `info` | `var(--accent)` | Download melhorando, semana melhor que a anterior, conexão estável |

Insights avançados (semana a semana e horário de pico):
- **Semana a semana**: compara a média de DL da semana atual (últimos 7 dias) com a anterior (7–14 dias atrás), quando há ≥ 2 registros em cada janela. Informa se houve melhora ou piora significativa (>20%).
- **Horário de pico**: agrupa testes por período do dia (madrugada 0–6h, manhã 6–12h, tarde 12–18h, noite 18–24h). Se um período tem DL ≥ 30% menor que o melhor, sinaliza congestionamento naquele horário.

Quando `items.length < 3 && items.length > 0`: exibe hint "Faça mais X testes para ver análise do seu histórico."

### Bloco de diagnóstico (acima do gráfico)

- Filtra registros das últimas 24h. Se vazio, usa os últimos 5 testes.
- Calcula médias, classifica (`classify`) e gera 1–2 parágrafos via `buildDiagnosis(avg, classification, sample)`.
- Cabeçalho exibe a janela aplicada: "Como sua internet anda · 24h" ou "· recente".
- Texto curto, em pt-BR leigo. Evita repetir conteúdo verboso da ResultScreen.

### Gráfico de evolução

- Últimos 10 testes em ordem cronológica
- `recharts` AreaChart — Download azul `#3AB6FF`, Upload verde `#22C55E`
- Fill com gradiente de 25% → 0% de opacidade
- Sem eixos, sem tooltip, sem dots
- Aparece apenas se `chartData.length >= 2`
- Legenda usa "Download"/"Upload" por extenso

### Seção de médias

Calculada sobre todos os registros:
- `avgDl`, `avgUl`, `avgLat`, `avgJit`, `avgLos` = média aritmética
- `classify({ dl:avgDl, ul:avgUl, latency:avgLat, jitter:avgJit, packetLoss:avgLos })` → quality da média

### Lista de itens

Cada item exibe:
- Linha 1: data/hora + chip de qualidade (`[Excelente]`, `[Boa]`, etc.)
- Linha 2: DL · UL · latência (com unidade)
- Linha 3: ícone de dispositivo + ícone de conexão + servidor · ISP + `📍 Cômodo` (alinhado à direita, cor accent — só quando `locationTag` está presente)

Tap em item → abre `HistoryDetail` (overlay interno).

### HistoryDetail (detalhe ao clicar)

Overlay `position:fixed; inset:0` com o mesmo visual da ResultScreen:
- Header: `← Voltar` + data do teste
- Banner de qualidade (mesmas classes `.lk-banner--*`)
- Métricas primárias DL/UL
- Métricas secundárias Resposta/Oscilação/Estabilidade
- Seção Detalhes: Servidor, Operadora, Dispositivo+Conexão, Perda de pacotes

Não inclui diagnóstico nem use cases (para manter tela leve e focada).

### FAB PDF (histórico completo)

Mesmo estilo do FAB da ResultScreen.  
Tap → `exportHistoryPdf(items)` — gera PDF A4 landscape com:
- Logo linka no cabeçalho
- Resumo de médias (DL/UL/Lat + qualidade)
- Tabela completa: Data · DL · UL · Resposta · Oscilação · Perda · Qualidade · Operadora

### Limpar histórico

Botão `btn-text` com cor `var(--error)`. Exibe `confirm()` antes de limpar. Limpa `localStorage` e reseta estado local.

### Voltar / abrir direto no detalhe

O retorno à tela anterior é feito por swipe horizontal → (gerenciado em `App.tsx`).

A StartScreen pode abrir o HistoryScreen com um registro pré-selecionado via prop `initialSelectedId` — ao clicar no card "Último teste" da StartScreen, navega-se para o HistoryDetail diretamente. Em "Ver histórico", `initialSelectedId` é `undefined` e a lista é exibida.

---

## 8. BeforeAfterScreen

### Finalidade

Guia o usuário por dois testes consecutivos — um antes e um depois de uma ação (reiniciar o roteador, trocar canal Wi-Fi, mudar de cômodo) — e exibe um veredicto comparando os resultados com deltas percentuais.

### Fluxo de passos

**Passo 1 — Antes (`step === 'before'`)**

```
┌──────────────────────────────────┐
│  HEADER                          │
│  [← Voltar]                      │
│  Antes e Depois                  │
│  [Passo 1 de 2 — Antes]          │  ← badge
│                                  │
│  Inicie o teste agora, antes     │
│  de fazer qualquer mudança.      │
│  [Iniciar teste (antes)]         │  ← btn-primary
└──────────────────────────────────┘
```

**Passo 2 — Depois (`step === 'after'`)**

```
┌──────────────────────────────────┐
│  HEADER                          │
│  [Passo 2 de 2 — Depois]         │  ← badge
│  Faça a ação e inicie o 2º teste │
│  ┌────────────────────────────┐  │
│  │ Antes · ↓ X ↑ Y Mbps · Nms│  │  ← preview do 1º resultado
│  └────────────────────────────┘  │
│  [Iniciar teste (depois)]        │  ← btn-primary
│  [Refazer primeiro teste]        │  ← btn-text
└──────────────────────────────────┘
```

**Resultado (`step === 'done'`)**

```
┌──────────────────────────────────┐
│  HEADER                          │
│  ┌────────────────────────────┐  │  ← veredicto (cor por verdict)
│  │ A conexão melhorou…        │  │
│  └────────────────────────────┘  │
│         Antes  Depois   Δ        │  ← tabela 4 colunas
│  DL     87,3   102,1   +17%      │
│  UL     32,1   35,4    +10%      │
│  Resp   18 ms  14 ms   +22%      │
│                                  │
│  [Fazer nova comparação]         │  ← btn-primary
│  [Voltar ao início]              │  ← btn-text
└──────────────────────────────────┘
```

### Veredictos

| `verdict` | Visual | Condição |
|---|---|---|
| `improved` | Borda verde `var(--success)`, fundo tênue verde | DL delta > 15% OU latência delta > 20% |
| `worse` | Borda vermelha `var(--error)`, fundo tênue vermelho | DL delta < −15% OU latência delta < −20% |
| `no_change` | Borda neutra `var(--border)` | Nenhum dos acima |

Nota: `latencyDeltaPercent = (before.latency − after.latency) / before.latency × 100` — positivo = melhora.

### Serviços consumidos

- Props: `step`, `beforeResult`, `afterResult`, `onStartBefore`, `onStartAfter`, `onBack`, `onRetry`, `unit`
- `calculateBeforeAfter(beforeResult, afterResult)` → `BeforeAfterResult`
- Resultados gravados normalmente em `TestRecord` com `testMode: 'complete'`

---

## 5a. RoomTestScreen

### Finalidade

Permite selecionar um cômodo (ou digitar um local personalizado) antes de iniciar o teste, associando a etiqueta ao `TestRecord` para facilitar a comparação de cobertura Wi-Fi entre ambientes.

### Layout

```
┌──────────────────────────────────┐
│  HEADER                          │
│  [← Voltar]                      │
│  Teste por local                 │
│  Selecione o cômodo…             │
│                                  │
│  ┌──────────┐  ┌──────────┐     │  ← grid 2 colunas
│  │   Sala   │  │  Quarto  │     │
│  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐     │
│  │Escritório│  │ Cozinha  │     │
│  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐     │
│  │ Varanda  │  │ Garagem  │     │
│  └──────────┘  └──────────┘     │
│                                  │
│  Outro local                     │
│  [___________________] [Iniciar] │  ← input livre + btn-primary
└──────────────────────────────────┘
```

Tap em qualquer preset ou "Iniciar" (com input preenchido) chama `onStart(locationTag)`, armazena a etiqueta e navega para `RunningScreen`. O botão "Iniciar" fica `disabled` enquanto o campo estiver vazio.

### Serviços consumidos

- Props: `theme`, `onToggleTheme`, `onStart(locationTag: string)`, `onBack`
- Presets: `['Sala', 'Quarto', 'Escritório', 'Cozinha', 'Varanda', 'Garagem']`

---

## 9. ComparisonScreen

### Finalidade

Guia o usuário por dois testes consecutivos — um perto do roteador e outro longe — para diagnosticar problemas de cobertura Wi-Fi. Exibe um veredicto comparando as métricas dos dois pontos.

### Fluxo de passos

**Passo 1 — Perto do roteador (`step === 'near'`)**

```
┌──────────────────────────────────┐
│  HEADER                          │
│  [← Voltar]                      │
│                                  │
│  Passo 1 de 2                    │  ← badge
│                                  │
│  Fique perto do roteador         │
│  [descrição orientando]          │
│                                  │
│  [Testar perto do roteador]      │  ← btn-primary
└──────────────────────────────────┘
```

**Passo 2 — Longe do roteador (`step === 'far'`)**

```
┌──────────────────────────────────┐
│  HEADER                          │
│  [← Voltar]                      │
│                                  │
│  Passo 2 de 2                    │  ← badge
│                                  │
│  ┌────────────────────────────┐  │
│  │ Perto · ↓ 87,3 Mbps …     │  │  ← preview do resultado do passo 1
│  └────────────────────────────┘  │
│                                  │
│  Vá para outro cômodo            │
│  [Testar longe do roteador]      │
│  [Refazer teste perto]           │  ← btn-text secundário
└──────────────────────────────────┘
```

**Resultado (`step === 'done'`)**

```
┌──────────────────────────────────┐
│  HEADER                          │
│  [← Voltar]                      │
│                                  │
│  ┌────────────────────────────┐  │  ← card de veredicto (cor por diagnosis)
│  │ ⚠ Cobertura fraca          │  │
│  │ Sua internet perde força…  │  │
│  └────────────────────────────┘  │
│                                  │
│         Perto    Longe           │
│  DL     87,3     31,2 Mbps      │  ← tabela de comparação
│  UL     32,1     12,4 Mbps      │
│  Lat    18 ms    44 ms           │
│  Queda  -64%     —               │  ← percentual de variação
│                                  │
│  [Testar novamente]              │
└──────────────────────────────────┘
```

### Diagnósticos de cobertura

| `diagnosis` | Mensagem resumida | Visual |
|---|---|---|
| `coverage_issue` (>75% queda) | "Cobertura muito fraca longe do roteador" | Borda vermelha |
| `coverage_issue` (>50% queda) | "Cobertura moderada — perda significativa" | Borda amarela |
| `both_bad` | "Problema na conexão em geral — não é cobertura" | Borda vermelha |
| `both_good` | "Cobertura excelente" | Borda accent |
| `other` | "Diferença pequena" | Borda neutra |

### Serviços consumidos

- Props: `step`, `nearResult`, `farResult`, `onStartNear`, `onStartFar`, `onBack`, `onRetryNear`, `unit`
- `calculateComparison(nearResult, farResult)` → `ComparisonResult`
- Resultados gravados normalmente em `TestRecord` (via fluxo de gravação de `App.tsx`) com `testMode: 'complete'`

---

## 10. Comportamentos globais

### Tema dark/light

- Toggle no Header (ícone sol/lua)
- Altera `document.documentElement.dataset.theme = 'dark' | 'light'`
- Persiste em `localStorage` com chave `linka.speedtest.theme`
- Padrão: dark

### Detecção de conexão online/offline

`App.tsx` mantém o estado `isOnline` (boolean) sincronizado com os eventos `online`/`offline` do browser. Quando `false`:
- StartScreen exibe bloco de erro (sem botão de retry — auto-reabilitação ao reconectar)
- `canStart = false` → todos os botões de ação ficam `disabled`

### Gravação automática de resultado

Ao concluir o teste (`phase === 'done'`), o efeito em `App.tsx` verifica em ordem:

1. **Prova Real ativa** (`provaRealSession !== null`): acumula resultado em `provaRealResultsRef`. Se ainda não completou 3 testes: incrementa sessão, reseta o hook e dispara o próximo teste automaticamente (sem navegar). Após o 3º teste: calcula média via `averageSpeedResults()`, grava **apenas** o resultado médio com `appendRecord(averaged, { ..., locationTag? })` e navega para ResultScreen.

2. **Fluxo normal**: chama `previousRecord()` → `appendRecord(result, { serverName, isp, deviceType, connectionType, testMode, locationTag? })` → atualiza `lastRecord`. Em seguida roteia:
   - `comparisonModeRef === 'near'` → ComparisonScreen (passo 2)
   - `comparisonModeRef === 'far'` → ComparisonScreen (resultado)
   - `baModeRef === 'before'` → BeforeAfterScreen (passo 2)
   - `baModeRef === 'after'` → BeforeAfterScreen (resultado)
   - Caso contrário → ResultScreen

`locationTagRef.current` é limpo (`null`) imediatamente após a gravação — garante que testes subsequentes não herdem a etiqueta.

### Carregamento do último resultado ao abrir o PWA

Na primeira renderização de `App.tsx`, um `useEffect` chama `previousRecord()` e popula `lastRecord`. A StartScreen exibe um card clicável quando `lastRecord != null`, levando ao detalhe correspondente no HistoryScreen. O usuário consegue ver o último resultado sem rodar novo teste.

### Detecção de conexão e operadora

- `useDeviceInfo` lê `navigator.connection.type` quando disponível. Quando ausente (iOS Safari), assume `'mobile'` em dispositivos móveis (em vez de `'wifi'`). O usuário pode sobrescrever em **Configurações → Conexão**.
- `serverRegistry.getInfo` normaliza o `asOrganization` da API `/meta` Cloudflare para nomes comerciais brasileiros: TELEFONICA → Vivo, AMERICA MOVIL/NET SERVICOS/CLARO → Claro, TIM → TIM, OI/TELEMAR → Oi, ALGAR → Algar.

### Presets de teste por modo e tipo de conexão

`runSpeedTest` aceita `connectionType` e `mode` (via `useSpeedTest.start(connectionType, mode)`):
- **Teste rápido** (`mode = 'quick'`): 8 pings + 5 MB warmup + 1 × 50 MB download + 2 MB warmup + 1 × 20 MB upload (~80 MB total). Válido para Wi-Fi, cabo e mobile.
- **Teste completo — Wi-Fi/cabo** (`mode = 'complete'`): 20 pings + 25 MB warmup + 3 × 100 MB DL + 10 MB warmup + 3 × 50 MB UL (~400 MB).
- **Teste completo — Móvel** (`mode = 'complete'` + `connectionType = 'mobile'`): 20 pings + 5 MB warmup + 2 × 25 MB DL + 2 MB warmup + 2 × 10 MB UL (~70 MB).

Em `App.tsx`, `effectiveConnection` respeita o override manual em `settings.connectionOverride`. O `testMode` é definido no momento em que o usuário toca um dos botões da StartScreen e é preservado ao repetir o teste (Retry).

### PWA / Instalação

- Manifest configurado em `vite.config.ts` (VitePWA)
- Ícones: 192px e 512px (any + maskable)
- Service worker gerado automaticamente
- `display: standalone` — sem barra de URL quando instalado

### Responsividade

- Layout mobile-first (base: 375px)
- Conteúdo principal: `max-width: 480px; margin: 0 auto`
- Sem breakpoints adicionais necessários — o design funciona de 320px a 1440px

### Acessibilidade

- Botão Iniciar: `aria-label="Iniciar teste de velocidade"`
- Erro: `role="alert"`
- FAB PDF: `aria-label="Exportar PDF"` / `aria-label="Exportar histórico em PDF"`
- Ícones SVG decorativos: `aria-hidden="true"`
