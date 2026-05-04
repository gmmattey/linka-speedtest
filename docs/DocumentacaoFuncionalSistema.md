# Documentação Funcional do Sistema — linka SpeedTest PWA

> Descreve as telas do aplicativo, fluxos de navegação, estados de UI e comportamento esperado do ponto de vista do usuário.

---

## Hierarquia de navegação

```
App (estado global)
├── StartScreen         ← tela inicial (padrão)
│   └── ExploreScreen   ← hub de ferramentas avançadas
├── RunningScreen       ← durante o teste (todos os modos)
├── ResultScreen        ← resultado focado (entender + agir)
│   ├── card "Diagnóstico da conexão"  ← 2 estados: "Tudo certo" (healthy) ou lista [problema] → [ação]
│   ├── section "Mais detalhes"        ← 3 accordions: Avançado, Modo Gamer, DNS
│   │   └── DNSGuideSheet (overlay)    ← bottom sheet acionado pelo botão "Como alterar" do accordion DNS
│   └── ExploreScreen                  ← hub de ferramentas via item "Ferramentas"
│       ├── ComparisonScreen    ← comparativo perto vs longe do roteador
│       ├── BeforeAfterScreen   ← comparação antes/depois de uma ação
│       ├── RoomTestScreen      ← seleção de cômodo para Teste por local
│       └── LocalWifiScreen     ← diagnóstico Wi-Fi local (somente app nativo)
├── HistoryScreen       ← histórico de testes (acessível de Start, Explore e Result)
```

> **Refator de arquitetura 2026-05.** Seis telas foram consolidadas dentro
> da `ResultScreen`:
>
> - `DiagnosticScreen` e `RecommendScreen` viraram o card unificado
>   "Diagnóstico da conexão" com **2 estados** (healthy: ícone check
>   verde + "Tudo certo com sua rede"; com ação: lista compacta
>   `[problema] → [ação]`, no máximo 3 visíveis + "Ver mais N",
>   priorizada por severidade fail > warn). O **glow do card** segue a
>   severidade agregada — verde (healthy) / amarelo (warn) / vermelho
>   (fail) — via custom property `--diag-glow-color`.
> - `DetailsScreen`, `GamerScreen` viraram **accordions** dentro da
>   section "Mais detalhes" (junto com um terceiro accordion **DNS**).
> - `DNSBenchmarkScreen` morreu (a feature on-demand foi descontinuada);
>   o accordion "DNS" expõe provider + latência detectados pelo próprio
>   teste e um botão "Como alterar".
> - `DNSGuideScreen` virou `DNSGuideSheet` — bottom sheet local da
>   ResultScreen acionado pelo botão acima.

O roteamento é feito por `switch/case` em `App.tsx` via `useState<Screen>`. Não há react-router. Cada tela é um componente que ocupa 100% do viewport. A navegação de volta respeita a origem via `returnToRef`.

### Fluxo principal

```
StartScreen → [Teste rápido / completo] → RunningScreen → [Conclusão] → ResultScreen
   ↑                                        [Cancelar] ↓                ↓ [Testar novamente]
   │                                       StartScreen                  │
   ├─[Ver histórico]──────────────────────────────────────► HistoryScreen → [Voltar] → StartScreen
   └─[Link último teste]─────────────────────────────────► HistoryScreen (detalhe pré-aberto)
   └─[Explorar ferramentas]──────────────────────────────► ExploreScreen → [Voltar] → StartScreen

ResultScreen → [‹]                       → StartScreen
ResultScreen → [accordion "Avançado"]    → expansive inline (sem navegação)
ResultScreen → [accordion "Modo Gamer"]  → expansive inline (sem navegação)
ResultScreen → [accordion "DNS"]         → expansive inline (sem navegação)
                                          → [Como alterar] → DNSGuideSheet (overlay)
ResultScreen → [Ferramentas]             → ExploreScreen → [‹] → ResultScreen

ExploreScreen → [Histórico de testes]   → HistoryScreen      → [‹] → ExploreScreen
ExploreScreen → [Comparar locais]       → ComparisonScreen   → [‹] → ExploreScreen
ExploreScreen → [Teste por local]       → RoomTestScreen     → [‹] → ExploreScreen
ExploreScreen → [Antes e Depois]        → BeforeAfterScreen  → [‹] → ExploreScreen
ExploreScreen → [Diagnóstico Wi-Fi]     → LocalWifiScreen (somente app nativo)
```

### Navegação por gestos

- **Swipe horizontal** (→ volta · ← avança): App mantém pilha de telas em `App.tsx` (`backStackRef` / `forwardStackRef`). Threshold: 80 px com razão `|Δx| > |Δy| × 1,5` para evitar conflito com scroll vertical. Início de gesto sobre `.lk-sheet`, `.lk-history__list`, botões ou inputs é ignorado.
- **Swipe vertical no BottomSheet**: arrastar a alça para cima abre; para baixo, fecha.
- O Header não traz mais o botão "X / Voltar" — a volta é feita por swipe ou pelo botão de cancelar das próprias telas (RunningScreen tem "Cancelar"; HistoryScreen tem botão de voltar no detalhe interno).

---

## Bloco 5 — TopBar System (2026-05)

Sistema de cabeçalho universal aplicado em todas as telas. Substitui os headers inline das telas (cada um tinha seu próprio HTML/CSS) por um componente `<TopBar>` consistente, somado a um `<PageHeader>` no início do conteúdo rolável.

**Padrão visual:**
- TopBar fica em `position: absolute` no topo da tela, altura 56px + safe-top.
- No estado inicial (sem rolagem) o TopBar é **transparente** — o conteúdo do scroll passa por baixo dele.
- Quando o usuário rola, o `<PageHeader>` (título grande no topo do scroll content) sai da viewport. Isso ativa o **glass effect**: fundo translucent + `backdrop-filter: blur(20px)`, borda inferior sutil, e o título pequeno aparece centralizado com fade-in.
- Botão voltar é um chevron único dentro de uma pill 36×36 (sem texto). Área de toque 44×44. Active state: scale(0.94). Dispara haptic `phaseChange` (30ms) ao tocar quando o setting está ligado.
- Ações à direita (PDF, share, hamburger, history) usam o mesmo padrão de pill 36×36.

**Onde mora o título da página:** o título grande (Geist 700, 32px na lg / 24-28px na md) vive no `<PageHeader>` no início do scroll content. Quando o usuário rola e ele sai da viewport, ele migra para o slot pequeno do TopBar (Geist 600, 14px). Fade transitions 180-200ms ease.

**Exceções intencionais:**
- **StartScreen**: TopBar com logo "linka" no leftSlot (em vez de back); ação direita é o ícone histórico. Sem PageHeader — o orb pulsante central já é o hero da tela. **Bloco 6 — UX uniforme (2026-05):** ganhou um sentinel sintético (`.lk-start__sentinel`, 1×1, posicionado em absolute logo abaixo do TopBar) e `scrollContainerRef` ligado ao próprio `.lk-start`. Hoje a tela não rola, então é no-op visual; se ganhar conteúdo no futuro, o glass do TopBar passa a aparecer automaticamente.
- **RunningScreen**: TopBar sem back (não dá para voltar mid-test). Título "Medindo…" sempre visível (`showTitle={true}` permanente). Linha sutil "Servidor · Local · ISP" aparece logo abaixo do TopBar quando há dados.
- **ResultScreen** e **ExploreScreen**: o `HamburgerMenu` ficou **controlled** (Bloco 6 — UX uniforme, 2026-05). O trigger é um `<IconButton>` padrão no `rightActions` (pill 36×36, ícone "menu"), e o painel flutua via `position: fixed` quando `open=true`. Visualmente uniforme com os demais ícones do TopBar (PDF, share, history).

**Componentes:** `<TopBar>`, `<BackButton>`, `<IconButton>`, `<PageHeader>` (em `src/components/`) + hook `useScrollHeader` (em `src/hooks/`). Detalhes técnicos em `DocumentacaoTecnicaSistema.md` seção 5.7.

---

## 1. StartScreen

### Finalidade

Ponto de entrada do app. Permite iniciar o teste no modo escolhido, acessar modos avançados (Comparar locais, Antes e Depois, Prova Real, Teste por local) e consultar o histórico.

### Layout

```
┌──────────────────────────────────┐
│  TopBar: logo "linka" • [hist]   │  ← Bloco 5 — TopBar System (2026-05)
│                                  │     leftSlot logo + IconButton history
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

A StartScreen usa `<TopBar leftSlot={<Logo />} rightActions={[history]} />`. Não tem PageHeader — o orb central faz o papel de hero. O TopBar fica transparente o tempo todo (a tela praticamente não rola, ou rola pouco), sem glass effect.

### CTA circular

Botão circular `200px × 200px`, `border-radius: 50%`, fundo accent sólido. Texto "Iniciar" em Geist **700 22px** na cor `--text-on-accent`. Dois pseudo-elementos pulsantes (`::before`, `::after`) animam `lkOrbPulse` com offset de 1,2 s entre eles.

**Bloco 4 — Propagação tipográfica e hero card pattern (2026-05):** o orb ganhou `filter: drop-shadow(0 0 10px var(--accent-glow))` somado ao `box-shadow` existente, reforçando a presença do CTA primário. O label foi promovido de 600/20px para **700/22px**, alinhando com o Manifesto §5 (peso máximo em CTAs hero).

Durante loading: texto "Aguardando", botão `disabled` (`opacity: 0.35`, animação suspensa).

Ao clicar: chama `onStart(selectedMode)` onde `selectedMode` é o estado interno do toggle de modo.

### Seletor de modo (pill segmentado)

```
[ Rápido ] [ Completo ]   ← pill com dois botões, estilo .lk-start__mode-toggle
```

- Componente: `.lk-start__mode-toggle` (segmented pill, mesmo padrão do toggle de tema)
- Estado gerenciado localmente em `StartScreen` via `useState<'fast' | 'complete'>(settings.defaultMode ?? 'complete')`
- Botão ativo recebe `.lk-start__mode-btn--active` (fundo `var(--surface)`, texto `var(--text)`, peso 600)
- Botão inativo: texto `var(--text-2)`, peso 500
- Ao alterar o modo, chama `onUpdateSettings({ defaultMode: mode })` → persiste em localStorage

### Seleção de modo

| Modo | `SpeedTestMode` | Duração aprox. | Descrição exibida |
|---|---|---|---|
| Rápido (padrão) | `'fast'` | ~30 s | "Download, upload e ping · ~30s · bufferbloat integrado" |
| Completo | `'complete'` | ~60 s | "Diagnóstico detalhado com paralelismo progressivo · ~60s · recomendamos Wi-Fi" |

O aviso "recomendamos Wi-Fi" aparece no modo Completo quando `device.connectionType === 'mobile'`.

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
- **Último teste** — exibido como linha de texto clicável (`↓ X ↑ Y Mbps · Ver último teste`) somente se `lastRecord != null`. Sem card, sem borda, sem fundo. Os números migraram de `--font-mono` 600 para `--font-display` 700 no Bloco 4 (2026-05). Tap → `onShowLastResult()`.
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
│         Medindo…                 │  ← TopBar título sempre visível (Bloco 5)
│  Cloudflare · São Paulo · ISP    │  ← linha sutil "Servidor · Local · ISP"
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

A RunningScreen usa `<TopBar title="Medindo…" showTitle scrolled={false} />` — sem back (não dá para cancelar pelo header), título sempre visível. O TopBar fica transparente o tempo todo.

### Layout — falha

```
┌──────────────────────────────────┐
│           Erro                   │  ← TopBar título "Erro" (Bloco 5)
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

O Motor v2 executa 3 fases (PING → DOWN → UP), com bufferbloat integrado durante DL e UL. Não há fase separada de `load` ou `dns`.

| Phase | Frase exibida |
|---|---|
| `latency` | "Verificando a resposta do servidor…" |
| `download` | "Medindo a velocidade de download…" |
| `upload` | "Medindo a velocidade de upload…" |
| `done` | "Quase pronto…" (transição automática para ResultScreen) |
| `error` | Tela substituída pelo bloco de falha com retry |
| `idle`/outros | "Preparando o teste…" |

Steps exibidos no indicador de progresso: `[PING] [DOWN] [UP]` — sempre iguais nos modos Rápido e Completo.

**Parciais progressivos:** após a fase de latência, o número de latência pode ser exibido no rodapé enquanto o download corre. Após o download, o valor de Mbps pode ser exibido enquanto o upload corre (`SpeedTestProgress.partial`).

**Mini-gráfico ao vivo (Bloco Motion, 2026-05):** entre o `Gauge` e o indicador de fases há um sparkline SVG (~64 px de altura, sem libs) que plota a velocidade instantânea durante DL e UL. Linha em `var(--dl)` no download e `var(--ul)` no upload; auto-escala vertical pelo pico amostrado da fase atual. A série é resetada na transição download → upload (descarta pontos da fase anterior). Não há gráfico durante a fase de latência. Implementado em `src/components/LiveChart.tsx`, alimentado por `useSpeedTest().live`.

**Progresso suave (Bloco Motion, 2026-05):** o `overallProgress` agora cresce monotonicamente dentro de cada fase, sem oscilação para trás. O orchestrator captura `phaseStart = performance.now()` antes de cada probe e calcula `local = (now - phaseStart) / durationMs`, clampado em `[0, 0.98]` durante a fase e snappa para o início da próxima fase ao terminar. Pesos são derivados do número real de amostras esperadas (latência ≈ 17–25 % do tempo total).

### Gauge

Componente `<Gauge>` simplificado: `display: flex column`, número e unidade centralizados, sem SVG. O número é `instantMbps` suavizado por EMA α=0.25 via `requestAnimationFrame` no `useSpeedTest`.

### Cancelar

- Em estado normal: botão "Cancelar" `btn-text` no rodapé.
- Em estado de erro: botão "Cancelar" abaixo do "Testar novamente".

Ambos chamam `test.cancel()` + `test.reset()` e voltam para a StartScreen via pilha de navegação.

### Rótulo de sessão (Prova Real)

Quando a Prova Real está ativa, a prop opcional `sessionLabel` é passada com o texto `"Teste X de 3 — Prova Real"`. Exibido abaixo da frase narrativa em `var(--accent)` (12px, weight 600). Ausente em testes normais.

### Identificação do servidor (Bloco 2 — Hero confiante, 2026-05)

Logo ao lado de `"Medindo…"`, no header da `RunningScreen`, é exibida uma linha pequena (`.lk-running__head-server`, 11px, `var(--text-3)`) com `Servidor · Local · ISP` (ex.: `"Cloudflare · São Paulo · Vivo Fibra"`). Os campos vêm de `deviceInfo.server` (`name`, `loc`, `isp`) carregado pela `StartScreen` antes do início do teste e propagado por `App.tsx` via prop `server`. Campos com placeholder (`'—'`) ou ausentes são filtrados — quando nenhum valor está disponível, a linha é omitida sem reservar espaço. Texto com `text-overflow: ellipsis` para não quebrar layout em tela estreita.

### Vibração tátil (Bloco 3 — Polimento, 2026-05)

A `RunningScreen` dispara haptics em momentos-chave do teste, controlado pela setting `useHaptics` (default `true`, toggleable no `HamburgerMenu` da `ResultScreen`):

| Evento | Padrão | Pattern |
|---|---|---|
| Entrada na fase `download` | curto | `30 ms` |
| Entrada na fase `upload` | curto | `30 ms` |
| Conclusão do teste (`done`) | médio | `50 ms` |
| Erro (`error`) | composto | `[100, 50, 100]` |

A primeira fase (`latency`) **não vibra** — ficaria misturada com o tap do botão "Iniciar". Implementação via `navigator.vibrate(...)` (Capacitor traduz para nativo no Android). iOS PWA ignora silenciosamente.

### Props recebidas de App.tsx

```ts
theme, onToggleTheme,
phase, instantMbps,
onCancel, onRetry,
unit,
sessionLabel?, // ex: "Teste 2 de 3 — Prova Real" — omitido em testes normais
server?        // ServerInfo | null — alimenta a linha "Servidor · Local · ISP" no header
```

---

## 3. ResultScreen

### Finalidade

Exibe os resultados do teste em grade compacta com notas por métrica, diagnóstico unificado em linguagem leiga e atalhos para explorar análises complementares.

### Layout

```
┌──────────────────────────────────┐
│  ‹                          [☰]  │  ← TopBar (frente B 2026-05): título
│                                  │     "Último teste" aparece SÓ quando
│                                  │     scrolled (sentinel = PageHeader)
│                                  │
│  Último teste                    │  ← <PageHeader size="md"> — título
│                                  │     grande no início do scroll, idêntico
│                                  │     a Explore/History/Diagnostic
│                                  │
│  Cloudflare · SP · Vivo · DNS Cloudflare · há 2m │ ← banner de contexto
│                                                    (sem verdict chip — saiu
│                                                    no refactor 2026-05)
│                                  │
│ ════════════════════════════════ │  ← RIBBON 3px (border-top do test-card)
│ ┌── lk-result__test-card ──────┐ │     verde / amarelo / vermelho conforme
│ │ DOWNLOAD       │ UPLOAD       │ │     interpreted.quality
│ │ 580            │ 320          │ │  ← BLOCO PRIMARY (52/64px Geist 700,
│ │ / 600 · 97%    │ / 350 · 91%  │ │     glow text-shadow, plano vs entregue)
│ │ ───────────────────────────── │ │  ← hairline (border-top --border-subtle)
│ │ resposta│oscil.│falhas│ dns   │ │  ← BLOCO SECONDARY (13/15px Geist 500)
│ │ 18 ms   │ 3 ms │ 0 %  │ 12 ms │ │
│ │ ───────────────────────────── │ │  ← hairline
│ │ [🎮 Jogos B·Bom] [📺 4K A·Exc]│ │  ← USE CASES (chips A-F por cenário)
│ │ [💼 Office B·Bom][📹 Vídeo A] │ │
│ │ ───────────────────────────── │ │  ← hairline (só quando WI-FI presente)
│ │ BANDA │ CANAL │ SINAL │ LINK   │ │  ← WI-FI (apenas connectionType==='wifi')
│ │ 5 GHz │  44   │-58 dBm│ 600   │ │     bridge nativo Capacitor ou fallback
│ └───────────────────────────────┘ │
│                                  │
│  DIAGNÓSTICO DA CONEXÃO          │  ← kicker uppercase
│                                  │  ← 2 estados (refator 2026-05):
│  ✓ Tudo certo com sua rede       │     (a) HEALTHY: ícone check + título
│                                  │     (b) COM AÇÃO: lista compacta abaixo
│   ─ ou ─                         │     Glow do contêiner por severidade
│                                  │     (verde / amarelo / vermelho)
│                                  │
│  ⚠ Wi-Fi instável  →  Reinicie o roteador      │
│  ⚠ Resposta lenta  →  Conecte via cabo         │
│  ⚠ Falhas pontuais →  Refaça o teste           │
│  Ver mais 2                                    │  ← link só se >3 itens
│                                  │
│  ─── Mais detalhes ───            │  ← section com 3 accordions
│  [⚙ Avançado            ▾]        │  ← expansive: bufferbloat, IP,
│                                  │     latência carregada, estabilidade
│  [🎮 Modo Gamer          ▾]       │  ← expansive: stat cards + jogos
│  [⚡ DNS                ▾]        │  ← expansive: provider + latência +
│                                  │     [Como alterar] → DNSGuideSheet
│                                  │
│  ⬜ Ferramentas              ›   │  ← atalho residual para Explorar
│                                  │
│  [Testar novamente]              │
│  [WhatsApp]  [Compartilhar texto]│
└──────────────────────────────────┘
```

### TopBar e Large Title (frente B 2026-05)

A tela não tem mais um hero card qualitativo. Na **abertura** o TopBar fica transparente e sem título; o título `"Último teste"` aparece como **Large Title** no início do scroll (`<PageHeader size="md" title="Último teste">`), idêntico ao padrão das outras telas (Explore, History, Diagnostic, Recomendações). Ao rolar ~64px, o `PageHeader` sai da viewport e o `useScrollHeader` (que observa o próprio `<PageHeader ref={sentinelRef}>`) ativa `scrolled=true` — o TopBar ganha glass + título pequeno centralizado.

A versão anterior (refactor visual 2026-05, frente A) usava um `<div className="lk-result__sentinel" aria-hidden />` 1×1 invisível como âncora e mantinha o título sempre visível no TopBar. A frente B harmoniza com as demais telas e devolve o respiro visual no topo do scroll.

O motor (`interpret.ts`) continua produzindo `copyKeys.headlineKey` e `shortPhraseKey`, mas eles deixaram de ser renderizados na tela; a headline qualitativa segue sendo usada na composição do `shareCard` (PNG 1080×1080).

### Banner de contexto (`.lk-result__context-bar`) — pacote premium 2026-05

Linha discreta entre o Large Title `Último teste` e o card unificado de teste. Conteúdo: `server.name · server.loc · server.isp · DNS <provider> · formatRelativeTime(result.timestamp)`, separados por `·` (`--text-3`), em Geist peso 500 11px mobile / 12px desktop cor `--text-2`. Cada pedaço some individualmente quando o campo é nulo ou `'—'` (CloudflareProvider devolve `'—'` para campos não detectados pelo `serverRegistry`; o pedaço DNS some quando `result.dnsProvider` é null — probe falhou). Ex.: `Cloudflare · São Paulo · Vivo Fibra · DNS Cloudflare · há 2 min`.

Quando todos os campos sumirem (cenário raro de fallback total), o banner inteiro retorna `null` — não há mais variante `--verdict-only`, porque o verdict deixou de ser chip aqui (virou ribbon do card abaixo, ver seção a seguir).

### Card unificado de teste + ribbon de verdict (`.lk-result__test-card`) — refactor 2026-05

Os 4 blocos abaixo (PRIMARY, SECONDARY, USE CASES, WI-FI) viviam como cards separados empilhados, e o "verdict" da medição era um chip flutuante (`.lk-result__verdict-chip`) na ponta direita do banner de contexto, pairando ACIMA dos cards sem container. **Refactor 2026-05:** os 4 blocos foram unificados num único `<section className="lk-result__test-card">`, separados por hairlines internas, com um **ribbon colorido de 3px no topo** (border-top do card) substituindo o chip flutuante.

**Cor do ribbon** vem de `qualityRibbonColor(interpreted.quality)`:
- `excellent` ou `good` → `var(--success)` (verde)
- `fair` → `var(--warn)` (amarelo)
- `slow` ou `unavailable` → `var(--error)` (vermelho)

A cor é injetada via custom property inline `style={{ '--ribbon-color': ... }}` (cast `as CSSProperties` em TS), e o CSS aplica `border-top: 3px solid var(--ribbon-color, var(--border))` — o fallback `var(--border)` mantém o card coerente caso a propriedade não esteja setada. Decisão consciente: usamos `--success`/`--warn`/`--error` (cores cheias) e não `--color-good-bg`/`--color-warn-bg`/`--color-bad-bg` (alpha 0.08-0.10 ficaria invisível em 3px).

**Acessibilidade.** O `<section>` carrega `aria-label="Resultado: {Excelente|Boa|Aceitável|Lenta|Sem conexão}"`, e como primeiro filho há um `<span className="sr-only">Verdict: …</span>`. Tecnologias assistivas leem o veredicto integralmente — a cor do ribbon não é a única forma de comunicar a qualidade.

**Visual interno.** Background `var(--surface-deep)`, borda `1px solid var(--border)` nos 3 lados, raio `var(--radius-lg)`, `overflow: hidden` para o ribbon respeitar o raio. Os 4 blocos internos perderam seus próprios `background`/`border`/`border-radius`/`margin-bottom`; mantiveram apenas o padding interno (16px lateral nos 3 não-primary, 20px no primary). Hairlines `border-top: 1px solid var(--border-subtle)` separam SECONDARY, USE CASES e WI-FI da seção acima — o PRIMARY (primeiro filho) NÃO tem hairline, porque o ribbon do card já é o "topo".

### Bloco PRIMARY — Download e Upload em destaque (2026-05)

`lk-result__primary-block`: grid 2 colunas com Download e Upload. Cada cell traz rótulo curto uppercase (`DOWNLOAD` / `UPLOAD`, Geist 600 11px, letter-spacing 0.08em, `--text-3`), valor enorme em `var(--font-display)` weight 700 — 52px em mobile, 64px em ≥600px — com `font-variant-numeric: tabular-nums` (sem tremor durante o `useCountUp`) e cor por métrica (`--dl` azul para Download, `--ul` verde para Upload). Embaixo, unidade (`Mbps` ou `Gbps`) em 13px `--text-2`. Não há mais badge de grade A-F por métrica — as grades migraram para os use cases.

**Glow nos hero numbers (pacote premium 2026-05).** Os dois valores hero recebem `text-shadow: 0 0 16px var(--dl-glow|--ul-glow) !important` — exceção única ao reset universal de text-shadow de `tokens.css`. Tokens de glow têm alpha baixo (~0.30-0.40) e dão a percepção de "respiração luminosa" sem virar sombra. Confinado às duas células do PRIMARY; nenhum outro número da tela recebe glow.

**Plano vs entregue (pacote premium 2026-05).** Quando o usuário cadastrou `velocidade contratada` no HamburgerMenu (`contractedDown`/`contractedUp` em `useSettings`), cada cell ganha uma sub-linha `.lk-result__primary-cell-plan` no formato `/ Y Mbps · Z%`. O hero number animado continua sendo o entregue absoluto (ex.: `580`); a sub-linha mostra `/ 600 Mbps · 97%`. Z% é `Math.round((dl/contractedDl)*100)`, sem cap — overdelivery aparece como `102%`. O percentual não é animado (por design — usuário lê o número absoluto primeiro, percentual é contexto). Quando o campo contratado é `null`/`0`, o cell preserva a unit-line tradicional `Mbps`/`Gbps`.

**Cores semânticas Anatel quando o plano está cadastrado (2026-05).** Na presença de `contractedDown` / `contractedUp` válidos, os números grandes de Download e Upload deixam o azul/verde de marca e passam a refletir a **% de entrega vs contratado**, seguindo as faixas da Resolução Anatel nº 717/2019. As regras mudam por perfil de conexão:

- **Banda larga fixa** (Wi-Fi/cabo): ≥ 80% verde, 40-79% amarelo, < 40% vermelho.
- **Banda larga móvel** (4G/5G): ≥ 60% verde, 20-59% amarelo, < 20% vermelho.

A cor é aplicada em três pontos de cada cell: (a) o número grande (52/64px), (b) o glow ao redor do número (text-shadow muda para a mesma família — verde/amarelo/vermelho-glow — pra evitar "número verde com aura azul"), e (c) o percentual `97%` na sub-linha do plano (apenas o número; a fração `/ 600 Mbps` permanece neutra). Sem plano cadastrado, todo o comportamento original é preservado (cor `--dl` / `--ul`, glow `--dl-glow` / `--ul-glow`, `97%` em `--text-2`). O perfil é derivado do `connectionType` corrente via `toConnectionProfile()` (default conservador `fixed_broadband` quando o tipo é desconhecido — caso "Não identificada" do iOS Safari sem `navigator.connection`). Implementação em `src/utils/anatelColor.ts` — ver §3.14.1 da DocumentacaoTecnicaSistema.

### Bloco SECONDARY — Resposta, Oscilação, Falhas, DNS (2026-05)

`lk-result__secondary-block`: grid **3 ou 4 colunas** com Resposta (latency), Oscilação (jitter), Falhas (packet loss) e — opcionalmente — **DNS** (latência de resolução DNS). Padronização Polimento UX: o terceiro card é **"Falhas"** (versão curta de `metric.packetLoss`).

A 4ª cell DNS é renderizada apenas quando há informação útil — `result.dnsLatencyMs != null` **ou** `result.dnsProvider != null`. Quando ambos os campos forem `null` (probe DoH falhou e o fallback de Resource Timing também não retornou amostra), a cell some e o grid colapsa para `repeat(3, 1fr)` via override de `gridTemplateColumns` inline (CSS-base segue `repeat(4, 1fr)` para o caso comum). Quando a cell aparece mas só uma das informações está disponível (ex.: tem latência mas não tem provider, ou vice-versa), exibe o que tem — o restante vira `—`. O value foi compactado de 14→13px para caber em mobile 375px sem cortar valor + unidade — em ≥600px volta a 15px.

**Por que esconder em vez de mostrar `—`** (refator Safari, 2026-05): no iOS Safari os endpoints Cloudflare Speed Test não enviam `Timing-Allow-Origin: *`, o que zera os timings DNS da Resource Timing API e fazia a 4ª cell viver em `—` permanente. A medição direta via `probeDnsResolver` (DoH whoami + `performance.now()`) cobriu esse buraco na maioria dos casos; quando ainda assim falha (offline, CORS extremo), o bloco volta a 3 cells em vez de exibir um placeholder vazio.

A latência exibida vem da **única** request DoH ao `whoami.cloudflare-dns.com` que o orchestrator dispara em paralelo ao upload — inclui DNS-do-sistema + TLS + RTT HTTP, não é DNS puro, mas é uma proxy honesta. O provider mostrado no [banner de contexto](#banner-de-contexto-lk-result__context-bar--pacote-premium-2026-05) (`DNS Cloudflare`, `DNS Google`, ou `DNS do provedor`) vem da mesma chamada.

**Reduzido em 2026-05** para parecer "info de rodapé" do bloco PRIMARY, não competir com Download/Upload por atenção. Detalhes:

- Valor: 18px mobile / 22px desktop, peso **500** (era 30/36px peso 600).
- Cor do valor: `var(--text-2)` (era `var(--text)`).
- Label uppercase: 10px peso 600 letter-spacing 0.08em em `var(--text-3)` (era 11px).
- Unit: 11px em `var(--text-3)` (era 12px em `--text-2`).
- Container sem fundo (`background: transparent`, era `var(--bg-elev)`), padding 10/12 (era 14/16), gap 6px (era 8px).

Latência e jitter recebem `Math.max(0.1, valorAnimado)` quando o target é positivo para evitar que `formatMs` exiba `—` durante a rampa inicial do count-up.

**Animação count-up (Bloco Motion, 2026-05):** ao montar a tela, os 5 números (DL, UL, latência, jitter, packetLoss) animam de 0 até o valor final em ~700 ms com easing `easeOutCubic`. Usa o hook `useCountUp` (RAF puro, sem libs). A formatação é aplicada sobre o valor animado a cada frame.

### Linha de cenários (`lk-result__use-row`) — grades A-F por use case (2026-05)

4 ícones SVG em flex horizontal. Cada item: ícone circular (cor por `verdict.status` — good/maybe/limited) + label curto do use case + chip `<grade> · <label>` (ex.: `B · Bom`). Visível apenas quando `interpreted.useCases.length > 0`. Casos de uso: Jogos (`game`), 4K (`stream`), Home Office (`work`), Vídeo (`videoCall`).

A grade A-F vem de `useCaseGrade(verdict, metrics, profile)` em `src/core/useCaseGrade.ts`: pega o pior grade entre as métricas que o use case considera. Os cortes A-F vêm dos thresholds de qualidade do profile ativo (`PROFILES[profile].quality.excellent/good/fair`), o que faz o mesmo número de download virar grade diferente em fixed vs mobile broadband.

| Nota | Background      | Cor texto       | Significado |
|------|-----------------|-----------------|-------------|
| A    | `--color-good-bg` | `--grade-a`   | Excelente   |
| B    | `--color-good-bg` | `--grade-b`   | Bom         |
| C    | `--color-warn-bg` | `--grade-c`   | Regular     |
| D    | `--color-bad-bg`  | `--grade-d`   | Ruim        |
| F    | `--color-bad-bg`  | `--grade-f`   | Crítico     |

Métricas relevantes por use case (espelha `buildUseCaseEvaluators()` em `interpret.ts`):
- `gaming` → dl, latency, jitter, packetLoss
- `streaming_4k` → dl, jitter, packetLoss
- `home_office` / `video_call` → dl, ul, latency, jitter, packetLoss

### Card Wi-Fi (`lk-wifi-card`) — somente em conexão Wi-Fi (2026-05+)

Card compacto e clicável embutido entre a linha de cenários (`lk-result__use-row`) e o "Diagnóstico da conexão", renderizado apenas quando `connectionType === 'wifi'`. Componente `<WifiSignalCard />` em `src/features/local-wifi/`. Lê dados nativos via bridge `LinkaWifiDiagnostics` (Capacitor) com auto-fetch no mount (`useWifiDiagnostics`).

**Design compacto (refator 2026-05+):**

Exibe apenas: **SSID** + **Canal (color-coded)** + **WiFi Standard** (ex., "WiFi 6").
```
┌────────────────────┐
│ Wi-Fi              │
│ Casa do Luiz       │  ← SSID
│ Canal 6 • WiFi 6   │  ← canal com cor + tecnologia
└────────────────────┘
```

Cores do canal refletem qualidade da conexão (via `classifyWifiQuality({ rssiDbm, linkSpeedMbps, band })`):
- **Verde** (good/excellent): `var(--color-good)`
- **Amarelo** (fair): `var(--color-warn)`
- **Vermelho** (weak/critical): `var(--color-bad)`

**Clicável:** ao clicar, abre popup bottom-sheet (`.lk-wifi-sheet`) com 5 seções de detalhes:
1. **Rede** — SSID, Frequência (banda), Canal, Qualidade do canal.
2. **Desempenho** — Sinal (dBm), Velocidade do link (Mbps), Qualidade da conexão.
3. **Análise de Canais** — gráfico de barras mostrando ocupação/qualidade de cada canal da frequência atual, com destaque para canal atual e sugestão de melhoria.
4. **Rede Local** — Gateway, IP local.
5. **Técnico** — WiFi Standard (ex., 802.11ax), Contagem de redes próximas.

**Quatro estados de renderização:**

- **`loading`** — placeholder discreto: "Lendo informações do Wi-Fi…".
- **`available` (bridge respondendo, APK com plugin)** — card compacto clicável conforme descrito acima.
- **`permission-denied`** (Android, usuário negou ACCESS_FINE_LOCATION) — mensagem: **"Permissão de localização necessária para diagnóstico Wi-Fi. Habilite nas configurações do app."** Cor `var(--warn)`.
- **`unavailable` (bridge indisponível: PWA puro ou APK sem plugin)** — mensagem: **"Wi-Fi: detalhes disponíveis somente no app instalado."** Cor `var(--text-2)`.

A classificação de qualidade reusa integralmente `classifyWifiQuality` em `LocalWifiService.ts` — zero duplicação entre `LocalWifiScreen` e o card.

### Bloco Diagnóstico (`lk-result__combined`) — refator 2026-05

Exibido logo após o card unificado de teste (e do Wi-Fi card quando aplicável). Sempre visível. **Tem 2 estados visuais distintos**, decididos pela combinação de `combineDiagnostics()` (causa) com `buildDiagnosisItems()` (lista por métrica).

#### Estado (a) HEALTHY — "Tudo certo com sua rede"

Renderizado quando `combined.cause === 'healthy'` E `buildDiagnosisItems()` retornou lista vazia (nenhuma métrica em warn/fail) E não há recomendação extra de DNS lento. Layout único centralizado:

- Ícone check verde grande (`<Icon name="check-circle" size={48} color="var(--success)">`) com `filter: drop-shadow(0 0 12px var(--success-glow))` para reforçar o brilho.
- Título grande Geist 700 22px: **"Tudo certo com sua rede"**.
- Borda do contêiner: `var(--color-good-border)` em vez do `var(--border)` neutro.

Sem subcards, sem ação imperativa — a ausência de próxima ação é a mensagem.

#### Glow tricolor por severidade (refator 2026-05)

Todo o `.lk-result__combined` (healthy E com ação) ganha um **box-shadow colorido** de 24px de blur cuja cor reflete a severidade agregada do diagnóstico. A cor entra como custom property `--diag-glow-color` setada inline no TSX a partir do mapping:

| Severidade agregada | Token de glow | Visual |
|---|---|---|
| `healthy` (lista vazia) | `var(--success-glow)` | Verde sutil |
| `warn` (algum item warn, nenhum fail) | `var(--warn-glow)` | Amarelo amber |
| `fail` (algum item fail) | `var(--error-glow)` | Vermelho |

A função `aggregateDiagnosisSeverity(items)` em `src/utils/diagnosisItems.ts` aplica a regra: lista vazia → `healthy`; algum `fail` → `fail`; senão → `warn`.

A animação `lk-result-diag-glow` (CSS) pulsa o blur entre 24px e 32px em loop infinito de 4s — mesmo tempo e mesmo range nos 3 estados; só a cor muda. Em healthy o pulse é "celebração", em warn/fail é "atenção pulsante" (sem agitação extra). Bloqueada por `prefers-reduced-motion: reduce` — quando a animação é desligada, o glow estático em 24px permanece (degradação graciosa).

**Edge case (fallback):** quando a lista vier vazia mas `combined.cause !== 'healthy'` (cenário raro), `aggregateDiagnosisSeverity` retorna `healthy` por construção (a função só olha para `items`). Resultado: o card renderiza o estado fallback (kicker + título genérico de `combined.title`) com glow verde. Aceitável porque é raro e o ribbon do card unificado já comunica a severidade da medição.

#### Estado (b) COM AÇÃO — lista compacta `[problema] → [ação]`

Renderizado em qualquer outro caso. Lista compacta de até **3 itens visíveis**, com link **"Ver mais N"** que expande inline os restantes. Cada item:

- Ícone do problema à esquerda (mesma família da antiga `DiagnosticScreen`: `bolt`, `wifi`, `ping`, `jitter`, `loss`, `upload`), com `background = var(--color-bad-bg|--color-warn-bg)` e `color = var(--error|--warn)`.
- Texto do problema (ex.: "Wi-Fi instável") em peso 600 cor `--text`.
- Seta `→` em `--text-3`.
- Texto da ação imediata (ex.: "Reinicie o roteador") em peso 400 cor `--text-2`.

**Priorização** por severidade (fail > warn). Sort estável preserva a ordem declarativa entre itens da mesma severidade (Internet → Upload → Wi-Fi → Resposta → Oscilação → Falhas).

**Fonte da lista.** `buildDiagnosisItems(result, connectionType)` em `src/utils/diagnosisItems.ts` — porto da lógica que vivia espalhada na `DiagnosticScreen` (cards Internet/Wi-Fi/Resposta/Oscilação/Falhas/Qualidade por uso). Cada métrica tem seus próprios thresholds para `null`/`warn`/`fail`. Itens em `good` (null) somem.

**Fallback.** Quando a lista vier vazia mas `combined.cause` ainda assim não é `healthy` (cenário raro: `mobile_signal_risk` com métricas todas verdes, etc.), o card volta ao layout anterior — kicker + título de `combined.title` + ação imediata de `combined.primaryAction`.

**Recomendação inteligente DNS (Fase B 2026-05).** Quando (a) `classifyDnsLatency(result.dnsLatencyMs)` retorna `slow` ou `poor` (≥100ms) **E** (b) `result.dnsProvider === 'DNS do provedor'` (resolver não-mapeado, provavelmente o default da operadora), o card ganha um bloco extra `.lk-result__combined-action--secondary` empilhado abaixo da lista:

> **Otimização adicional:** Trocar para Cloudflare ou Google DNS pode reduzir a latência das suas conexões. Veja como em Mais detalhes > DNS > Como alterar.

Esse bloco força o estado "com ação" mesmo quando `combined.cause === 'healthy'` (a UX precisa expor o atalho para o accordion DNS). Visual mais discreto: fundo `--surface-2`, label `--text-3`. Não aparece quando o probe falha, quando a latência é boa, ou quando o resolver já é Cloudflare/Google/Quad9/etc.

#### Combined diagnosis cause (mantido)

Causas possíveis vindas de `combineDiagnostics()` em `src/utils/combinedDiagnosis.ts`:

| `connectionType` | Causa possível |
|---|---|
| `wifi` + speed ruim | `inconclusive` |
| `wifi` + speed bom | `healthy` |
| `mobile` + speed ruim | `mobile_network_issue` |
| `mobile` + speed bom | `healthy` |
| `cable` / `unknown` + speed ruim | `internet_issue` |
| `cable` / `unknown` + speed bom | `healthy` |

Quando portado para app nativo: `WifiDiagnosticResult` e `MobileDiagnosticResult` fornecem dados reais de sinal, melhorando a acurácia do diagnóstico.

### Section "Mais detalhes" — 3 accordions (refator 2026-05)

Substitui as antigas telas dedicadas `DetailsScreen`, `GamerScreen` e `DNSBenchmarkScreen` (todas mortas no refator). Layout: kicker `Mais detalhes` + 3 `<Accordion>` empilhados, com 10px de gap entre eles.

#### Accordion "Avançado" (porto enriquecido de DetailsScreen)

Conteúdo via `<AdvancedAccordionBody>`. **Refator 2026-05:** dividido em 3 sub-blocos com label uppercase próprio (`<h4>` em Geist 600 10px), cada um sendo uma `<IOSList>` independente. O empty-state global mantém-se quando os 3 sub-blocos terminam vazios.

**Bloco "Métricas avançadas"** — métricas técnicas do teste:

- **Latência sob carga (bufferbloat grade)** — letra A-F com cor por gravidade (`--ul`/`--warn`/`--error`).
- **Latência carregada** (`metric.latency.loadedValue`) — `formatMs(latencyLoaded)` ms + delta `+X ms` em `--warn` quando há piora vs latência idle.
- **Oscilação carregada** — `formatMs(jitterLoaded)` ms.
- **Estabilidade download** — range `dlP25–dlP75` Mbps/Gbps.
- **Falhas na conexão** — `pct.toFixed(1)% Baixo|Médio|Alto`.
- **Velocidade média (DL)** — média aritmética dos `dlSamples` (Motor v2). Filtra zeros das pontas (ramp-up/ramp-down), preserva zeros internos (stalls reais).
- **Velocidade média (UL)** — idem para `ulSamples`.
- **IP público** — `server.ip` com truncate.
- **Provedor** — `server.isp` com truncate.

**Bloco "Sobre o teste"** — metadados do teste:

- **Tempo total do teste** — `formatElapsedMs(result.elapsedMs)` no formato `Xs` ou `Xm Yys`. Capturado pelo orchestrator (`Date.now() - testStartTime`).
- **Distância estimada ao servidor** — `~Math.round(latency * 100) km` com sub-label "estimado pela latência". Heurística ~200 km/ms (luz em fibra ≈ 2/3 c). Não é distância geográfica — é proxy da ordem de grandeza ("perto / longe").
- **Realizado em** — `formatFullDateTime(timestamp)` no formato `dd/mm/yyyy às HH:MM:SS`. Complementa o "há 2 min" do banner de contexto.
- **Versão do app** — `v${__APP_VERSION__}` (injetada via Vite `define` a partir do `package.json`). Se a global não estiver disponível, o item some.

**Bloco "Histórico"** — comparação contra a média dos últimos 10 testes:

- **Sua média (últimos N)** — média aritmética de `dl` dos últimos N registros do localStorage (mínimo 2; máximo 10), excluindo o teste atual. Quando a diferença vs `result.dl` for **maior que ±5%**, mostra trailing com a média + delta percentual colorido (`+7%` em verde, `−7%` em vermelho). Dentro da faixa de ±5%, mostra apenas a média com sub-label "este teste está dentro da média".

Sub-blocos vazios são ocultos. Empty-state global: quando os 3 sub-blocos resultam em listas vazias, a mensagem `"Sem dados avançados disponíveis para este teste."` é exibida.

#### Accordion "Modo Gamer" (porto de GamerScreen)

Conteúdo via `<GamerAccordionBody>`. Estrutura:

1. **Headline** — frase única qualitativa (`overallTone === 'good' | 'maybe' | 'bad'`): "Boa para jogos online." / "Atenção para jogos competitivos." / "Conexão fraca para jogar online."
2. **3 stat cards** lado a lado — Resposta (`latency`), Oscilação (`jitter`), Falhas (`packetLoss`), cor por tone.
3. **IOSList de jogos** — FPS competitivo / MOBA / MMO / Cloud Gaming, cada um com verdict colorido na trailing.

Os thresholds por tone replicam exatamente a lógica que vivia em `GamerScreen.tsx` (mantida sem portagem para o motor para preservar a UX).

#### Accordion "DNS"

Conteúdo via `<DnsAccordionBody>`. Estrutura (refator 2026-05): IOSList com info do provedor atual + tabela comparativa com benchmark dos 5 servidores DoH.

**IOSList do provedor atual:**

- **Provedor DNS** — `result.dnsProvider` ou `"Não detectado"` se o probe falhou.
- **Latência DNS** — `Math.round(dnsLatencyMs) ms · <label qualitativo>` (label vem de `dnsLatencyLabel(grade)`).
- **Como alterar** — item com chevron e ação `onOpenGuide()` que dispara o `<DNSGuideSheet>`.

**Tabela comparativa (`<DnsBenchmarkTable>`):**

Disparada na **primeira vez** que o usuário expande o accordion DNS — `runDNSBenchmark()` roda em background (5 servidores DoH; ~5-15 s no total). O `<Accordion>` ganhou prop `onToggle` para o pai (`ResultScreen`) flipar `dnsBenchStarted` e iniciar o benchmark.

Estados visuais:
- **Idle/Running** — header "Comparando 5 provedores · Testando N de 5 · <nome>" (progresso vem do callback `onProgress`); body "Pode levar alguns segundos."
- **Done** — lista ordenada por `samples > 0` desc, depois por `p50` ascendente. Cada linha tem:
  - Nome do servidor (Cloudflare, Google, AdGuard, Quad9, OpenDNS).
  - Chips: **"Em uso"** (accent) quando `name.toLowerCase() === result.dnsProvider`. **"Mais rápido"** (`--ul`) na linha vencedora. Os dois podem coexistir.
  - Latência p50 em ms. Quando `samples === 0` (CORS estrito Safari, timeout, offline), mostra `—` e a linha fica com opacidade reduzida.
  - Delta vs "em uso" — `±X ms` em verde (negativo = mais rápido) ou vermelho (positivo = mais lento). Some na linha "em uso" e quando o delta é menor que 1 ms.
- **Error** — quando o benchmark falha completo (rede offline, exceção no orchestrator), mensagem "Não foi possível comparar (rede offline ou bloqueio CORS)."

O resultado fica em memória local do `<DnsAccordionBody>` — opens subsequentes do accordion **não** refazem o teste. Cleanup do effect aborta o benchmark se o usuário sair da `ResultScreen` enquanto roda.

> **Cuidado de implementação:** o `<Accordion>` calcula `max-height` a partir do `scrollHeight` do conteúdo. Como o body do DNS cresce assincronamente (linhas chegando), o componente passou a usar `ResizeObserver` para recalcular a altura conforme o conteúdo muda — sem isso, o accordion cortaria a tabela.

### Stagger fade-in (pacote premium 2026-05, refeito 2026-05)

Ao montar a tela, cada bloco principal do scroll content entra com `opacity 0 → 1` + `translateY(8px → 0)` em ~320ms (`cubic-bezier(0.2, 0.7, 0.2, 1)`), com delays escalonados por seção. **Refeito em 2026-05 com a unificação dos 4 cards:** o `.lk-result__test-card` é uma peça só, então anima como bloco único — os blocos internos (primary/secondary/use-row/wifi) NÃO animam individualmente:

| Bloco                        | Delay  |
|------------------------------|--------|
| `<PageHeader>`               |   0 ms |
| `.lk-result__context-bar`    |  60 ms |
| `.lk-result__test-card`      | 120 ms |
| `.lk-result__combined`       | 240 ms |
| `.lk-result__more`           | 300 ms |
| `.lk-result__tools` / footer | 360 ms |

Implementação CSS-only (`@keyframes lk-fade-up` + `animation-fill-mode: backwards`). Bloqueado por `@media (prefers-reduced-motion: reduce) { animation: none !important }` — usuários com motion reduzido veem a tela montada de uma vez. Coexiste sem conflito com o `.fade-in` global do container `.lk-result` (parent fade roda em paralelo).

### Compartilhar no WhatsApp

Botão "WhatsApp" no rodapé. Fluxo:

1. Gera card visual 1080×1080 (quadrado) via `generateShareCard()` — Bloco 3 (Polimento, 2026-05) trocou de 1080×540 para quadrado, agora com headline qualitativa grande, grid 2×2 dos 4 números e ISP no rodapé.
2. Se `navigator.canShare({ files })` → `navigator.share({ files: [Blob PNG] })` (Web Share API Level 2).
3. Fallback: abre `https://wa.me/?text=` com texto formatado.

Durante a geração o botão exibe "Gerando…" e fica `disabled`.

### Compartilhar imagem (Bloco 3 — Polimento, 2026-05)

Botão "Compartilhar imagem" no rodapé, ao lado de "WhatsApp" e "Compartilhar texto". Gera o mesmo PNG 1080×1080 e:

1. Se `navigator.canShare({ files })` → abre o sheet nativo de share com o arquivo.
2. Fallback (browser sem suporte) → dispara download direto do PNG via `URL.createObjectURL` + `<a download>` programático.

Estado de carregamento próprio (`imgGenerating`) — exibe "Gerando…" e fica `disabled` durante a geração. O `HamburgerMenu → onShare` reusa esse mesmo handler.

### Compartilhar texto

Botão "Compartilhar texto" no rodapé. Usa `shareResultText()` — `navigator.share` com fallback para `navigator.clipboard`. Quando copiado, o botão exibe "Copiado!" por 2 s.

Texto compartilhado:
```
linka SpeedTest — Conexão boa
↓ 87,3 Mbps · ↑ 32,1 Mbps
Resposta 18 ms · Oscilação 3 ms
28/04/2026 14:32
```

> O `lk-result__footer-row` ganhou `flex-wrap: wrap` (Bloco 3) para os 3 botões caberem em viewport estreito sem estourar.

### Atalho residual para Explorar (refator 2026-05)

A seção **Explorar** que antes tinha 4 itens (Diagnóstico, Recomendações, Detalhes, Ferramentas) foi reduzida a UM único item:

| Item | Ícone | Cor ícone | Background | Prop |
|---|---|---|---|---|
| Ferramentas | `cog` | `var(--text-2)` | `var(--surface-3)` (cinza) | `onExplore` |

Os 3 primeiros viraram conteúdo da própria ResultScreen (Diagnóstico = card unificado; Modo Gamer e Detalhes = accordions na section "Mais detalhes"). O item residual leva à `ExploreScreen` reorganizada (Histórico + Ferramentas).

### Serviços consumidos

- Props: `result`, `server`, `unit`, `theme`, `onToggleTheme`, `onRetry`, `onBack`, `onExplore?`, `onStartRoomTest?`, `connectionType?`, `contractedDown?`, `contractedUp?`, `onUpdateContracted?`, `useHaptics?`, `onToggleHaptics?`
  - **2026-05 (refator de arquitetura):** props `onDiagnostic`, `onRecommend`, `onDetails` foram removidas — Diagnóstico/Recomendações viraram o card unificado e Modo Gamer/Avançado viraram accordions internos.
- Estado interno `dnsSheetOpen` controla o overlay `<DNSGuideSheet>` (acionado pelo botão "Como alterar" do accordion DNS).
- `interpretSpeedTestResult({ metrics, profile, history })` → `interpreted` (useCases, quality)
- `combineDiagnostics({ speed, connectionType })` → `combined` (title, primaryAction)
- `buildDiagnosisItems(result, connectionType)` → lista compacta `[problema] → [ação]`
- `loadHistory()` → passado para interpretSpeedTestResult
- `buildShareText()` + `shareResultText()` → compartilhamento texto
- `generateShareCard()` → card visual PNG para WhatsApp

---

## 3.bis DNSGuideScreen — REMOVIDA no refator 2026-05

> ⚠️ **Tela morta.** Substituída pelo bottom sheet `DNSGuideSheet`
> (`src/features/dns/DNSGuideSheet.tsx`) acionado pelo botão "Como
> alterar" do accordion DNS na ResultScreen (section "Mais detalhes").
> O conteúdo (5 servidores DNS × 4 plataformas) foi preservado integralmente.
> Os arquivos `src/screens/DNSGuideScreen.{tsx,css}` estão stubbed —
> pendentes de `git rm`.

### Finalidade (legado, para referência)

Tela modal (acessível via botão "Como trocar o DNS" na ResultScreen) que exibe instruções passo a passo para configurar o servidor DNS vencedor no dispositivo do usuário. Quatro plataformas cobertas via abas.

### Layout

```
┌──────────────────────────────────┐
│  ‹           Guia DNS            │  ← TopBar (Bloco 5): back + título scrolled
│                                  │
│  Guia DNS                        │  ← PageHeader size="md" 24-28px
│  Como trocar o DNS para Cloudflare│  ← subtitle
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

## 3.ter DNSBenchmarkScreen — REMOVIDA no refator 2026-05

> ⚠️ **Tela morta.** O benchmark on-demand (5 servidores DoH em paralelo)
> foi descontinuado por baixo uso. O accordion "DNS" da ResultScreen
> mostra agora apenas o provider + latência detectados pelo próprio
> teste (probe DoH ao `whoami.cloudflare-dns.com` no orchestrator).
> Os arquivos `src/screens/DNSBenchmarkScreen.{tsx,css}` estão stubbed —
> pendentes de `git rm`. O utilitário `src/utils/dnsBenchmark.ts`
> continua disponível para futuro reuso, mas não tem caller hoje.

### Finalidade (legado, para referência)

Feature standalone de Explorar (acessível via ResultScreen → Explorar → "Verificar DNS"). Executa o benchmark de DNS on-demand e exibe o ranking de servidores. Não faz parte do fluxo de speed test.

### Layout

```
┌──────────────────────────────────┐
│  ‹       Verificar DNS           │  ← TopBar (Bloco 5)
│                                  │
│  Verificar DNS                   │  ← PageHeader size="md"
│  Veja qual servidor DNS responde │  ← subtitle
│  mais rápido na sua rede atual.  │
│                                  │
│  ── idle ────────────────────── │
│  [Iniciar verificação]           │  ← btn-primary
│                                  │
│  ── running ─────────────────── │
│  ████░░░░░░░░░  35%              │  ← barra de progresso
│  "Verificando Cloudflare…"       │
│                                  │
│  ── done ────────────────────── │
│  🏆 Cloudflare · 1.1.1.1         │  ← vencedor destacado
│     12 ms                        │
│  ┌────────────────────────────┐  │  ← ranking dos demais
│  │ Google    8.8.8.8  · 18 ms │  │
│  │ AdGuard   …        · 25 ms │  │
│  │ Quad9     …        · 30 ms │  │
│  └────────────────────────────┘  │
│  [Como trocar o DNS]             │  ← leva para DNSGuideScreen
└──────────────────────────────────┘
```

### Estados

| Estado | Descrição |
|---|---|
| `idle` | Exibe resultado do último benchmark (se houver via `loadLastDnsResult()`) ou botão de iniciar |
| `running` | Barra de progresso com servidor atual sendo testado |
| `done` | Ranking completo com vencedor destacado e link para DNSGuideScreen |
| `error` | Mensagem de erro com botão de retry |

### Props

```ts
{ onBack: () => void; onShowDNSGuide?: (serverId: string) => void }
```

---

## 3.quater DetailsScreen — REMOVIDA no refator 2026-05

> ⚠️ **Tela morta.** Conteúdo migrado para o accordion **Avançado** na
> section "Mais detalhes" da ResultScreen (componente interno
> `<AdvancedAccordionBody>`). Métricas mantidas: bufferbloat grade,
> latência carregada (+delta), oscilação carregada, estabilidade do
> download (P25–P75), falhas, IP público, provedor. Os arquivos
> `src/screens/DetailsScreen.{tsx,css}` estão stubbed — pendentes de
> `git rm`.

### Finalidade (legado, para referência)

Exibe métricas técnicas detalhadas do último teste — qualidade sob carga (bufferbloat, latência e jitter carregados, estabilidade de download) e dados de conexão (perda de pacotes, operadora). Acessível via ResultScreen → Explorar → **Detalhes**.

### Layout

```
┌──────────────────────────────────┐
│  ‹           Detalhes            │  ← TopBar (Bloco 5): back + título scrolled
│                                  │
│  Detalhes                        │  ← PageHeader size="md"
│                                  │
│  CONEXÃO                         │
│  ┌────────────────────────────┐  │
│  │ [loss] Falhas na conexão   │  │  ← cor e label por nível
│  │        0,0%  Baixo         │  │
│  │ [router] Provedor          │  │  ← só se server.isp presente
│  │        Vivo Fibra          │  │
│  └────────────────────────────┘  │
│                                  │
│  QUALIDADE SOB CARGA             │  ← só se há dados de bufferbloat/carga
│  ┌────────────────────────────┐  │
│  │ [bolt] Latência sob carga  │  │
│  │        A  Excelente        │  │  ← bufferbloatGrade colorido
│  │ [ping] Latência carregada  │  │
│  │        28 ms  +10 ms       │  │  ← delta em laranja se > 0
│  │ [jitter] Oscilação carregada│  │
│  │        8 ms                │  │
│  │ [dl] Estabilidade download  │  │
│  │        72–94 Mbps          │  │  ← dlP25–dlP75
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Seções

> **Bloco 4 (2026-05):** os subtítulos de métrica (`.lk-details__metric-sub` — valores numéricos exibidos em `IOSList.subtitle`) ganharam `font-family: var(--font-display)` peso 600. Antes herdavam o body sem family explícita. Tamanho 13px preservado.

**Conexão** (sempre exibida):
- **Falhas na conexão** — `packetLoss` em %; cor verde < 1%, amarelo < 2,5%, vermelho ≥ 2,5%
- **Provedor** — `server.isp`; item omitido quando isp é `null`, `undefined` ou `'—'`

**Qualidade sob carga** (exibida quando ao menos um dos campos existe: `bufferbloatGrade`, `latencyLoaded`, `jitterLoaded`, `dlP25`/`dlP75`):

| Item | Campo | Detalhe |
|---|---|---|
| Latência sob carga | `bufferbloatGrade` | Nota A–F + label (Excelente/Bom/Moderado/Ruim/Crítico) colorido |
| Latência carregada | `latencyLoaded` | ms + delta `+X ms` em `--warn` quando `bufferbloatDeltaMs > 0` |
| Oscilação carregada | `jitterLoaded` | ms |
| Estabilidade download | `dlP25`–`dlP75` | Intervalo `P25–P75 Mbps` |

### Props

```ts
{
  result: SpeedTestResult;
  server: ServerInfo | null;
  unit?: 'mbps' | 'gbps';
  onBack: () => void;
}
```

---

## 4. DiagnosticScreen — REMOVIDA no refator 2026-05

> ⚠️ **Tela morta.** A avaliação por métrica (Internet/Wi-Fi/Resposta/
> Oscilação/Falhas) foi consolidada no card de Diagnóstico da
> ResultScreen — ver [Bloco Diagnóstico](#bloco-diagnóstico-lk-result__combined--refator-2026-05),
> com 2 estados (healthy: ícone check verde; com ação: lista compacta
> `[problema] → [ação]`). A lógica por métrica vive em
> `src/utils/diagnosisItems.ts` (`buildDiagnosisItems()`).
> Os arquivos `src/screens/DiagnosticScreen.{tsx,css}` estão stubbed —
> pendentes de `git rm`.

### Finalidade (legado, para referência)

Analisa o resultado do último teste em 6 áreas (Internet, Wi-Fi, Resposta, Oscilação, Falhas, Qualidade por uso) e apresenta um diagnóstico em cards visuais. Acessível a partir do botão "Diagnóstico" na ResultScreen.

### Layout

```
┌──────────────────────────────────┐
│  ‹          Diagnóstico          │  ← TopBar (Bloco 5)
│                                  │
│  Diagnóstico                     │  ← PageHeader size="md"
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
| Wi-Fi | cabo ou lat ≤ 60 ms | lat > 60 ms em Wi-Fi | — |
| Resposta | lat ≤ 60 ms | lat ≤ 100 ms | lat > 100 ms |
| Oscilação | jitter ≤ 15 ms | jitter ≤ 30 ms | jitter > 30 ms |
| Falhas | packetLoss = 0 | packetLoss ≤ 1% | packetLoss > 1% |
| Qualidade por uso | 4–5 critérios OK | 2–3 critérios OK | 0–1 critério OK |

### Props

```ts
result: SpeedTestResult
connectionType: ConnectionType | null
onBack: () => void
```

---

## 5. GamerScreen — REMOVIDA no refator 2026-05

> ⚠️ **Tela morta.** Conteúdo migrado para o accordion **Modo Gamer**
> na section "Mais detalhes" da ResultScreen (componente interno
> `<GamerAccordionBody>`). Mantém: headline qualitativa, 3 stat cards
> (Resposta/Oscilação/Falhas) e IOSList de jogos por categoria (FPS/
> MOBA/MMO/Cloud Gaming) com mesmos thresholds. Os arquivos
> `src/screens/GamerScreen.{tsx,css}` estão stubbed — pendentes de
> `git rm`.

### Finalidade (legado, para referência)

Exibe as métricas relevantes para jogos online (ping, jitter, perda de pacotes) e avalia cada categoria de jogo. Acessível pelo botão "Modo Gamer" na ResultScreen.

### Layout

```
┌──────────────────────────────────┐
│  ‹          Modo Gamer           │  ← TopBar (Bloco 5)
│                                  │
│  Modo Gamer       [Otimizado…]   │  ← PageHeader size="md" + chip no trailing
│                                  │
│  "Boa para jogos online."        │  ← título com avaliação geral
│                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐   │  ← stat grid 3-col
│  │Resp. │  │Oscil.│  │Falhas│   │
│  │ 18ms │  │ 3ms  │  │ 0,0% │   │
│  └──────┘  └──────┘  └──────┘   │
│                                  │
│  ┌────────────────────────────┐  │  ← IOSList
│  │ 🎮 FPS competitivo   Excelente│  │
│  │ 🎮 MOBA / Battle Royale  Bom │  │
│  │ 🎮 MMO / RPG Online     Bom  │  │
│  │ 🎮 Cloud Gaming      Atenção │  │
│  └────────────────────────────┘  │
│                                  │
│  "Para melhorar: use cabo..."    │  ← orientação curta, só quando necessário
│                                  │
│  [Refazer teste]                 │  ← btn-primary, volta para RunningScreen
└──────────────────────────────────┘
```

### Simplificação visual

- O hero traz apenas `Chip` + título curto. Não há subtítulo explicativo.
- O grid de métricas é a leitura principal da tela, com labels em linguagem humana: `Resposta`, `Oscilação` e `Falhas`.
- A lista de categorias mostra apenas nome da categoria + veredito. Exemplos de jogos não aparecem na UI.
- O bloco de `Requisitos mínimos` foi removido por redundância.
- Quando há alerta, a orientação aparece em uma única linha curta acima do CTA.
- **Bloco 4 (2026-05):** os números do stat grid (`.lk-gamer__stat-value`) migraram de `--font-mono` 600 para `--font-display` 700, mantendo `tabular-nums` e 22px. Os verdicts da lista de jogos (`gamer-verdict-*`) já estavam em peso 600 desde Bloco 2 — não foram alterados.

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

## 6. RecommendScreen — REMOVIDA no refator 2026-05

> ⚠️ **Tela morta.** A "Recomendações" deixou de ser tela dedicada; as
> ações por problema foram fundidas com a lista do card de Diagnóstico
> da ResultScreen no formato `[problema] → [ação]` (uma linha por
> métrica em warn/fail, gerada por `buildDiagnosisItems()`). O empty-
> state positivo (estado A) virou o estado HEALTHY do mesmo card.
>
> Os utilitários `src/utils/recommendations.ts` (`buildRecommendations`,
> `derivePositiveUsecases`, `summarizeHistory`, `PREVENTIVE_TIPS`)
> permanecem disponíveis mas perderam seus únicos callers — manter ou
> remover é decisão da próxima limpeza.
>
> O protótipo `docs/mockups/recomendacoes_empty_state.html` segue
> registrado no histórico, mas a UX que ele propunha foi absorvida
> pelo novo card. Os arquivos `src/screens/RecommendScreen.{tsx,css}`
> estão stubbed — pendentes de `git rm`.

### Finalidade (legado, para referência)

Exibe ações e contexto após o diagnóstico. O conteúdo varia conforme o estado da conexão — três caminhos distintos.

### Estados

#### Estado A — Conexão boa, sem problemas detectados (`quality === 'excellent' | 'good'` e `buildRecommendations()` vazio)

Empty-state positivo com 5 blocos:

1. **Hero de validação** — card verde (`--color-good-bg`) com ícone `check-circle`, título "Tudo dentro do esperado", subtítulo e as 3 métricas principais (download / latência / perda) derivadas de `result`.
2. **"Pronto para"** — card padrão com 4 casos de uso (`derivePositiveUsecases(result)`) e pílulas `Bom` / `Limitado` baseadas nos limiares de `dl`, `ul`, `latency`, `jitter`.
3. **"Mantenha esse padrão"** — card com 3 dicas preventivas fixas (`PREVENTIVE_TIPS`): reiniciar roteador; firmware; repetir teste ao notar lentidão.
4. **Comparativo histórico** (condicional, só se `loadHistory() ≥ 3 registros em 30 dias`) — card com variação percentual vs. média de download dos 30 dias anteriores. Derivado de `summarizeHistory(result.dl, history)`.
5. **CTAs** — botão primário "Refazer teste" (`onBack`) + botão outline "Gerar laudo (PDF)" (`onExportPdf`, visível apenas se disponível).

```
┌──────────────────────────────────┐
│  ‹         Recomendações         │  ← TopBar (Bloco 5)
│                                  │
│  Recomendações                   │  ← PageHeader size="md"
│                                  │
│  ┌── VERDE ──────────────────┐   │
│  │ ✓  Tudo dentro do esperado│   │
│  │ Velocidade, latência…     │   │
│  │ ── 248 Mbps · 14ms · 0%  │   │
│  └───────────────────────────┘   │
│  ┌── Pronto para ────────────┐   │
│  │ Streaming 4K      [Bom]   │   │
│  │ Jogos online      [Bom]   │   │
│  │ Videochamada      [Bom]   │   │
│  │ Trabalho remoto   [Bom]   │   │
│  └───────────────────────────┘   │
│  ┌── Mantenha esse padrão ───┐   │
│  │ • Reinicie o roteador…    │   │
│  │ • Mantenha o firmware…    │   │
│  │ • Refaça o teste…         │   │
│  └───────────────────────────┘   │
│  ┌── 12% acima da média ─────┐   │  ← condicional
│  └───────────────────────────┘   │
│  [  Refazer teste           ]    │
│  [  Gerar laudo (PDF)       ]    │  ← se onExportPdf disponível
└──────────────────────────────────┘
```

#### Estado B — Problemas detectados (`buildRecommendations()` retorna itens)

Exibe até 3 recomendações dinâmicas em ordem de prioridade (alta → média → baixa), seguidas das 4 dicas estáticas gerais como seção secundária.

#### Estado C — Conexão ruim sem recomendações dinâmicas (`quality !== 'excellent' | 'good'` e sem dinâmicas)

Exibe diretamente as 4 dicas estáticas com título "Dicas gerais de otimização".

### Dicas estáticas (estado B e C)

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
onExportPdf?: () => void      // callback para gerar laudo PDF; ausente = botão oculto
```

### Utilitários associados (`src/utils/recommendations.ts`)

- `derivePositiveUsecases(result)` — 4 usecases com `status: 'good' | 'limited'` baseado em limiares de dl/ul/latency/jitter
- `summarizeHistory(currentDl, history)` — `HistorySummary | null`; null se < 3 registros em 30 dias
- `PREVENTIVE_TIPS` — 3 dicas preventivas estáticas (constante)

### Protótipo aprovado

`docs/mockups/recomendacoes_empty_state.html` — comparativo visual atual × proposta, aprovado em 2026-05-02.

---

## 7. HistoryScreen

### Finalidade

Lista os últimos 50 testes com gráfico de evolução, resumo de médias e detalhe individual ao clicar. Permite exportar o histórico completo em PDF e limpar o histórico.

### Layout

```
┌──────────────────────────────────┐
│  ‹           Histórico    [PDF]  │  ← TopBar (Bloco 5): back ‹ + IconButton PDF
│                                  │     título "Histórico" aparece no scrolled
│  Histórico                       │  ← PageHeader size="lg" 32-40px
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
- **TopBar (Bloco 5)**: back chevron `‹` + título com a data do teste (aparece pequeno quando rola). Ação direita = `IconButton` de share que tenta `navigator.share`/clipboard.
- **PageHeader size="md"**: data formatada como título + subtitle "Detalhes do teste".
- **Hero card** (Bloco 4 — Propagação tipográfica e hero card pattern, 2026-05): chip de qualidade + título qualitativo (Geist 700 26px, line 1.15, letter -0.01em) + subtítulo (14px, line 1.4, `--text-2`). Container com `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)`, padding 18/18/16, margin-bottom 14 — segue o padrão canônico do `lk-result__hero` da ResultScreen.
- Métricas primárias DL/UL
- Métricas secundárias Resposta/Oscilação/Estabilidade
- Seção Detalhes: Servidor, Operadora, Dispositivo+Conexão, Perda de pacotes

Não inclui diagnóstico nem use cases (para manter tela leve e focada).

A seção "Média dos seus testes" da tela principal teve as métricas migradas de `--font-mono` 600 para `--font-display` 700 no mesmo bloco (mantém `tabular-nums` para alinhamento DL/UL). A lista de itens **mantém** mono na densidade — preserva legibilidade tabular em rolagem longa.

### Exportação de PDF (histórico completo)

Bloco 5 — TopBar System (2026-05): o FAB de PDF foi removido. A ação migrou para um `IconButton` no `rightActions` do TopBar (mesmo padrão visual de pill 36×36). Tap → `exportHistoryPdf(items)` — gera PDF A4 landscape com:
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

### Bloco 4 — Verdict como hero card e tabela em display (2026-05)

O card de veredicto (`.lk-cmp__verdict`) adotou o **hero card pattern** da ResultScreen: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)`, padding 18/18/16, margin-bottom 14. O `border-left: 4px` característico foi preservado (declarado depois do border de 1px, sobrepondo apenas a esquerda) — os modificadores de cor por diagnóstico (`coverage_issue`, `both_bad`, `both_good`) continuam funcionando sem alteração.

A própria mensagem do verdict virou o headline do card: tipografia promovida de 14px body para **Geist 700 24px**, line 1.2, letter -0.01em. A intenção é tratar a frase do diagnóstico como conclusão da jornada de duas medições, não como aviso lateral.

A tabela de comparação (Perto / Longe / Queda) teve `.lk-cmp__val` (display 600) e `.lk-cmp__drop` (display 700) migrados de `--font-mono` para `--font-display`, preservando `tabular-nums` para alinhamento numérico. O preview do passo 2 (`.lk-cmp__preview-metrics`) mantém mono — está em outra seção do fluxo e fora do escopo deste bloco.

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

### Presets de teste por modo (Motor v2)

`runSpeedTestV2` é chamado com `mode: 'fast' | 'complete'` (via `useSpeedTest.start(connectionType, mode)`):

**Modo Rápido (`'fast'`, ~30 s total):**
- Latência: 15 pings; DL: 7 s, streams 2→4, arquivos de 10 MB; UL: 7 s, streams 2→3, arquivos de 1 MB
- Bufferbloat medido em paralelo durante DL e UL (pings a cada 300 ms)

**Modo Completo (`'complete'`, ~60 s total):**
- Latência: 25 pings; DL: 18 s, streams 2→8, arquivos de 25 MB (progressivo até 100 MB); UL: 18 s, streams 2→6, arquivos de 5 MB (progressivo até 10 MB)
- Paralelismo progressivo: a cada 4 s, se ganho ≥ 10%, abre +2 streams

O Motor v2 não tem presets por `connectionType` — o throughput medido adapta automaticamente os tamanhos de arquivo (fluxo contínuo via `_cb` anti-cache) sem depender de rounds fixos.

Em `App.tsx`, `effectiveConnection` respeita o override manual em `settings.connectionOverride`. O `testMode` é inicializado a partir de `settings.defaultMode` e persiste entre sessões.

### PWA / Instalação

- Manifest configurado em `vite.config.ts` (VitePWA)
- Ícones: 192px e 512px (any + maskable)
- Service worker gerado automaticamente
- `display: standalone` — sem barra de URL quando instalado

### Banner "Nova versão disponível" (atualização ágil 2026-05)

Quando o `vite-plugin-pwa` detecta que existe um Service Worker novo (verifica `/sw.js` automaticamente a cada 60s), aparece um pill fixo no rodapé centralizado:

- Texto: "Nova versão disponível"
- Botão **Atualizar** (cor de acento) → ativa o SW novo e recarrega a página
- Botão **×** → fecha o banner; reaparece na próxima visita ou no próximo check periódico

Sem reload-surpresa: o usuário escolhe quando aplicar a atualização. Em iOS, a combinação `skipWaiting`/`clientsClaim` (configurada no `vite.config.ts`) faz o SW novo assumir controle imediatamente após o clique em "Atualizar", sem precisar fechar todas as abas — quebra do ciclo conservador padrão do Safari/WebKit.

Implementação: `src/components/PwaUpdatePrompt.tsx` (renderizado no nível raiz de `App.tsx`). Detalhes técnicos em `DocumentacaoTecnicaSistema.md` seção 8 ("Service Worker e atualização ágil").

### Responsividade

- Layout mobile-first (base: 375px)
- Conteúdo principal: `max-width: 480px; margin: 0 auto`
- Sem breakpoints adicionais necessários — o design funciona de 320px a 1440px

### Acessibilidade

- Botão Iniciar: `aria-label="Iniciar teste de velocidade"`
- Erro: `role="alert"`
- FAB PDF: `aria-label="Exportar PDF"` / `aria-label="Exportar histórico em PDF"`
- Ícones SVG decorativos: `aria-hidden="true"`

---

## 11. LocalWifiScreen (conectada via ExploreScreen)

### Finalidade

Tela dedicada ao **Diagnóstico Wi-Fi** com acesso em `ExploreScreen` na seção **Ferramentas de rede** somente quando o app roda em ambiente nativo.

### Conteúdo da tela

- Título: `Diagnóstico Wi-Fi`
- Aviso obrigatório:
  - `Este diagnóstico não mede a velocidade real entre o aparelho e o roteador.`
  - `Ele avalia o sinal e os dados da conexão Wi-Fi para identificar possíveis problemas locais.`
- Botão: `Executar diagnóstico`
- Resultado:
  - qualidade
  - SSID (se disponível)
  - sinal (dBm)
  - velocidade negociada
  - banda
  - canal
  - bloco de canal:
    - `Canal atual: X`
    - `Qualidade do canal: bom/médio/ruim` (verde/amarelo/vermelho)
    - `Canal sugerido: Y` somente quando o canal estiver ruim
  - gateway
  - IP local
- Blocos textuais:
  - explicação
  - o que fazer agora
  - limitações

### Comportamento no PWA

No PWA comum, o item **Diagnóstico Wi-Fi** não é exibido no `ExploreScreen`. Se a rota for aberta diretamente fora do nativo, a tela mostra:
- `Diagnóstico Wi-Fi indisponível no PWA.`
- `Este recurso usa dados do sistema disponíveis apenas no app nativo.`

### Integração atual

- `ExploreScreen` exibe o item **Diagnóstico Wi-Fi** apenas quando `getCapabilities().localWifiDiagnostics === true`
- `App.tsx` roteia para `screen === 'localwifi'`
- No PWA comum, a própria tela mostra indisponibilidade segura (sem bridge nativa)
