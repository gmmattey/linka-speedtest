# Guia de Branding — linka SpeedTest

> Fonte de verdade para identidade visual, vocabulário e padrões de design. Consulte este guia antes de criar ou alterar qualquer tela, componente ou copy.

---

## 1. Identidade da marca

**Produto:** linka SpeedTest  
**Produto pai:** LINKA (app principal)  
**Categoria:** ferramenta utilitária de diagnóstico de internet  
**Público:** usuários brasileiros com internet doméstica ou móvel

### Nome

| Contexto | Forma correta |
|---|---|
| Interface do produto | `linka` (minúsculo, sem negrito especial) |
| Título de página / manifest | `linka SpeedTest` |
| Nome completo de produto | `linka SpeedTest` |
| Menção no código / identificadores | `linka`, `linkaSpeedTest` |

**Nunca:** `Linka`, `LINKA SpeedTest`, `LinkA`, `Linka Speed Test`

---

## 2. Cores

### Paleta de tokens

| Token | Valor dark | Valor light | Uso |
|---|---|---|---|
| `--accent` | `#6C2BFF` | `#6C2BFF` | CTAs, links, foco, anel do gauge, orb |
| `--accent-tint` | `rgba(108,43,255,0.12)` | `rgba(108,43,255,0.10)` | Fundo de ícones accent, badges |
| `--dl` | `#3AB6FF` | `#0A84FF` | Download — todos os valores e ícones |
| `--dl-tint` | `rgba(58,182,255,0.12)` | `rgba(10,132,255,0.10)` | Fundo de ícone download |
| `--ul` | `#22C55E` | `#30D158` | Upload — todos os valores e ícones |
| `--ul-tint` | `rgba(34,197,94,0.12)` | `rgba(48,209,88,0.10)` | Fundo de ícone upload |
| `--error` | `#FF453A` | `#FF3B30` | Falha, packetLoss alto, latência crítica |
| `--warn` | `#F5A623` | `#FF9F0A` | Aviso, jitter alto |
| `--text` | `#F2F2F7` | `#1C1C1E` | Texto primário |
| `--text-2` | `rgba(242,242,247,0.55)` | `rgba(28,28,30,0.55)` | Texto secundário |
| `--text-3` | `rgba(242,242,247,0.30)` | `rgba(28,28,30,0.30)` | Labels, metadados |
| `--bg` | `#0D0D12` | `#F2F2F7` | Fundo principal |
| `--surface` | `#16161E` | `#FFFFFF` | Sheets sobrepostas (HamburgerMenu, BottomSheet) — superfícies que precisam contrastar com o body |
| `--surface-deep` | `#11121A` | `#FBFBFD` | **Tom canônico de card** — todos os cards principais: Result, History, Comparison, Wifi, IOSList, Recommend, BeforeAfter, Diagnostic, etc. Replica visualmente o centro do `--bg-radial`, "vazando" no body |
| `--surface-2` | `#1E1E28` | `#F2F2F7` | Estado hover/active, alternância |
| `--surface-3` | `#25252F` | `#ECECF1` | Separadores visuais, track do gauge |
| `--hairline` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.06)` | Separadores de linha (hairline) |
| `--border` | `rgba(255,255,255,0.10)` | `rgba(0,0,0,0.10)` | Bordas de cards |

### Regras de uso de cor

- **Zero box-shadow e text-shadow.** Profundidade é indicada somente por cor de superfície, bordas e por um único mecanismo global de "depth via tinta" definido exclusivamente em `tokens.css`: `--bg-radial` no `body` — centro um toque mais claro que as bordas (Bloco 3). Recalibrado em 2026-05 para edges quase coincidentes com `--surface-deep` dos cards, evitando step visível na transição body↔card. O `--bg-fade-bottom` aplicado via `#root::after` (Bloco 7) foi removido na mesma passada — ver `DocumentacaoTecnicaSistema.md` para histórico. O `--bg-radial` não deve ser duplicado em telas/componentes.
- **Accent `#6C2BFF` apenas em elementos interativos** (botões primários, links, orb) ou como ênfase de label (badge, ícone pinned). Não usar como cor de fundo de tela inteira.
- **DL (`--dl`) e UL (`--ul`)** são reservadas para métricas de velocidade. Não usar em contextos não relacionados a velocidade.
- **Gradientes:** proibidos exceto na definição de `tokens.css` (atualmente: somente `--bg-radial` no body — o `linear-gradient` do depth fade em `#root::after` foi removido em 2026-05).

---

## 3. Tipografia

### Fontes

| Família | Token | Uso | Variantes carregadas |
|---|---|---|---|
| **Geist** | `var(--font-display)` e `var(--font-body)` | Toda a UI — uma família única, como o iOS faz com SF Pro | 300, 400, 500, 600, 700 |
| **JetBrains Mono** | `var(--font-mono)` | **Somente** valores tabular-nums em listas/cells técnicas (ms, Mbps, %, IP, timestamps); não para labels nem para texto corrido | 400, 500, 600, 700 |
| **Instrument Serif** | `var(--font-editorial)` | Reservada — exclusiva para mockups editoriais. Não usada em produção atualmente | 400, italic |

Geist é a fonte open-source da Vercel, projetada como alternativa web mais próxima do SF Pro. Uma família só elimina a dissonância entre display e body, reforçando a direção iOS-Calma.

#### Regra de auditoria (2026-05) — quando usar mono

A confusão mais comum é mono virar fonte de "informação técnica" em geral. Não é. JetBrains Mono é **exclusiva para VALORES NUMÉRICOS com tabular-nums** — nunca para LABELS, mesmo em telas técnicas.

| Caso | Família correta | Por quê |
|---|---|---|
| `87,3` Mbps na hero number | `--font-display` | Hero — peso visual máximo, Geist 700 |
| ` ms` / `Mbps` (unidade ao lado do valor hero) | `--font-mono` | Letra inicial alinha com o tabular-num do valor |
| Valores em IOSList trailing (`87 ms`, `1.1.1.1`) | `--font-mono` | Tabular alinhamento entre linhas |
| Timestamps em listas (Histórico) | `--font-mono` | Cifras alinham coluna |
| Label uppercase de seção ("Métricas avançadas") | `--font-display` 600 | Não é valor — é título de bloco |
| Label de ícone ("Streaming 4K", "Trabalho") | `--font-body` 500 | Texto corrido curto |
| Label de fase no Gauge ("DOWNLOAD") | `--font-display` 600 | Label uppercase, não valor |
| Botão primário | `--font-display` 700 | CTA — display |
| Botão texto / link | `--font-body` 500 | Texto |
| Body de explicação (Diagnóstico, Guia DNS) | `--font-body` 400-500 | Texto corrido |

#### Proibições

- **Sem `'Inter'`, `'Space Grotesk'`, `'Roboto'`, `'system-ui'` ou outras famílias hardcoded em CSS/TSX.** Toda família vem dos 3 tokens (`--font-display`, `--font-body`, `--font-mono`).
- **Exceção controlada:** geração de PDF (`pdfExport.ts`) e canvas (`shareCard.ts`) usam `'Geist'` literal porque os contextos vivem fora do DOM e não têm acesso a CSS vars. Nesses casos, a string DEVE ser exatamente `'Geist'` (com fallback `system-ui, sans-serif`) — qualquer outra fonte hardcoded é bug.

### Escala tipográfica de referência

| Papel | Tamanho | Peso | Família |
|---|---|---|---|
| Número hero (gauge) | 72px | 700 | Geist |
| Título de tela grande | 22–24px | 700 | Geist |
| Título de tela médio | 20px | 700 | Geist |
| Valor de métrica na lista | 14px | 600 | Geist |
| Valor de métrica row2 | 15px | 600 | Geist |
| Botão primário | 15px | 500–600 | Geist |
| Body / descrição | 13–14px | 400 | Geist |
| Label secundário | 12px | 400–500 | Geist |
| Label uppercase (seção) | 11px | 600 | Geist, `letter-spacing: 0.06em` |
| Metadado / hint | 11–12px | 400 | Geist |

### Regras tipográficas

- **Números de métrica sempre em `var(--font-display)` (Geist)**.
- **Labels uppercase de seção:** `font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3)`.
- **Títulos hero:** `font-family: var(--font-display); font-weight: 700; letter-spacing: -0.03em`.
- **Tracking negativo** apenas em títulos (20px+). Body sempre tracking neutro.
- **Line-height:** 1.2 em títulos, 1.5 em body/descrições.

---

## 4. Espaçamento e layout

### Tokens de espaçamento

| Token | Valor | Uso típico |
|---|---|---|
| `--space-xs` | 4px | Gap mínimo entre ícone e texto |
| `--space-sm` | 8px | Gap interno de chips, rows compactas |
| `--space-md` | 12px | Gap padrão entre elementos |
| `--space-lg` | 16px | Gap entre seções, padding horizontal padrão |
| `--space-xl` | 24px | Separação maior entre blocos |
| `--space-2xl` | 32px | Margem de tela |
| `--space-3xl` | 48px | Espaço vertical generoso |

### Tokens de raio

| Token | Valor | Uso típico |
|---|---|---|
| `--radius-sm` | 8px | Ícones pequenos (28px), chips |
| `--radius` | 12px | Cards, listas, botões |
| `--radius-lg` | 20px | Modais, sheets |
| `--radius-xl` | 28px | Elementos grandes arredondados |
| `--radius-pill` | 9999px | Badges, step-badges |

### Padding de cabeçalho de tela

**Bloco 5 — TopBar System (2026-05).** Todas as telas usam o componente `<TopBar>` em `position: absolute; top: 0; height: 56px + safe-top; z-index: 50`. Estado inicial transparente; quando o `<PageHeader>` sai da viewport (via `useScrollHeader`), o TopBar ganha `background: var(--surface-translucent)` + `backdrop-filter: blur(20px) saturate(160%)` + borda inferior `var(--border-subtle)`. Back button = chevron `‹` único em pill 36×36 (área tocável 44×44, sem texto, `aria-label="Voltar"`). Título da tela vive no `<PageHeader>` no topo do scroll content (Geist 700 32px lg / 24-28px md) e migra para o slot pequeno do TopBar (Geist 600 14px) com fade ao rolar. Detalhes técnicos em `DocumentacaoTecnicaSistema.md` §5.7. *(Padrão pré-Bloco 5 obsoleto: `‹ Início` accent 14px + label text-3 13px com `padding: 14px 16px 4px`.)*

### Scroll principal

Todas as telas com conteúdo rolável usam:
```css
flex: 1;
overflow-y: auto;
padding: 8px 16px 32px;
```
Seção hero dentro do scroll: `padding: 4px 0 18px`.

---

## 5. Componentes de design

### Chip (badge semântico)

| Variante | Fundo | Texto | Uso |
|---|---|---|---|
| `good` | `var(--ul-tint)` | `var(--ul)` | Excelente, Bom, Aprovado |
| `maybe` | `rgba(245,166,35,0.16)` | `var(--warn)` | Regular, Atenção |
| `bad` | `rgba(255,69,58,0.16)` | `var(--error)` | Ruim, Falha |
| `accent` | `var(--accent-tint)` | `var(--accent)` | Passo, badge de fluxo |
| `neutral` | `var(--surface-2)` + borda `--border` | `var(--text-2)` | Estado neutro, inativo |

Tamanho: `height: 20px; padding: 0 8px; border-radius: var(--radius-pill); font-size: 11px; font-weight: 600`.

### IOSList (lista estilo iOS Settings)

- Fundo: `var(--surface)`, borda `var(--border)`, `border-radius: var(--radius)`, `overflow: hidden`
- Row: `padding: 13px 14px`, `border-bottom: 1px solid var(--hairline)`
- Ícone: quadrado `28×28px`, `border-radius: 7px`, fundo semântico (tint da cor da métrica)
- Trailing: valor à direita em Geist 600 14px, cor semântica

### Gauge (anel de medição)

- SVG com dois `<circle>`: track (`--surface-3`) + fill (cor da fase)
- `strokeDasharray={2πr}`, `strokeDashoffset = 2πr * (1 - progress)`, `strokeLinecap="round"`
- Fase: label uppercase acima do número
- Número: 72px Geist 700, `font-feature-settings: 'tnum'`
- Unidade: abaixo, 14px `--text-2`
- Cores: DOWNLOAD → `--dl`, UPLOAD → `--ul`, LATÊNCIA → `--accent`

### Botões

| Classe | Aparência | Uso |
|---|---|---|
| `btn-primary` | Fundo `--accent`, texto branco | CTA principal da tela |
| `btn-secondary` | Borda `--accent`, texto `--accent`, fundo transparente | Ação secundária |
| `btn-text` | Texto puro `--accent` ou `--text-2`, sem fundo | Ação terciária, links de navegação |

Altura padrão de botão de ação: `50px`.  
Raio: `var(--radius)`.

---

## 6. Ícones

- **Apenas SVGs stroke-based** definidos em `src/components/icons.tsx`.
- **Zero emoji em UI de produto.** Emoji só em tooltips internos de debug, nunca visível ao usuário.
- Espessura de traço (stroke-width): `1.5px` padrão, `2px` em ícones de ação.
- Tamanhos recorrentes: 13px (inline em metadados), 14px (ícone em IOSList), 16px (ícone padrão), 22px (FAB), 24px (ícone de ação em header).
- Cor: sempre via prop `color` — nunca hardcoded no SVG.

---

## 7. Copy e tom de voz

### Princípios

- **Objetivo e direto.** Frases curtas. Sem rodeios.
- **Leigo.** "Sua internet está boa para vídeo" — não "latência dentro do percentil 80".
- **Positivo quando possível.** Preferir "Melhorou 23%" a "Era ruim, agora é menos ruim".
- **Sem jargão técnico exposto.** Mbps, ms e % são aceitáveis; TCP, TTL, DNS não.

### Idioma

- Todo o copy de interface: **pt-BR**.
- Código, comentários técnicos, nomes de variáveis: **inglês** (convenção do codebase).

### Nomenclatura das métricas

| Métrica técnica | Label na UI |
|---|---|
| Download (Mbps) | ↓ Download |
| Upload (Mbps) | ↑ Upload |
| Latency (ms) | Resposta |
| Jitter (ms) | Oscilação |
| Packet Loss (%) | Perda |

### Vocabulário: "Ping" vs. "Latência"

Decisão de auditoria de marca (2026):

| Contexto | Termo a usar |
|---|---|
| Label do gauge na tela de medição (RunningScreen) | **Ping** |
| Copy voltado ao público gamer | **Ping** |
| Corpo de diagnósticos técnicos (DiagnosticScreen) | Latência (aceitável) |
| Footer / exportação PDF | Latência (contexto técnico aceita) |

Razão: persona gamer usa "ping" como vocabulário nativo. "Latência" é reservada para contexto técnico onde o usuário espera precisão terminológica.

### Qualidades

| Código | Label |
|---|---|
| `excellent` | Excelente |
| `good` | Boa |
| `fair` | Regular |
| `slow` | Lenta |
| `unavailable` | Indisponível |

---

## 8. Animações e transições

| Token | Valor | Uso |
|---|---|---|
| `--t-fast` | `180ms cubic-bezier(0.32, 0.72, 0, 1)` | Hover, active, fade rápido |
| `--t-med` | `280ms cubic-bezier(0.32, 0.72, 0, 1)` | Transições de tela, entrada de modal |
| `--t-slow` | `480ms cubic-bezier(0.32, 0.72, 0, 1)` | Animações expressivas (orb, gauge fill) |

- **Máximo 300ms** para transições utilitárias (hover, active).
- Orb pulsante: `orb-pulse` com `2.4s`, dois rings defasados em `1.2s`.
- Gauge fill: `isAnimationActive={false}` — animação manual via `strokeDashoffset`.
- Classe de entrada de tela: `.fade-in` (definida em `src/index.css`).

---

## 9. Design direction: iOS-Calma

O design system segue a direção **iOS-Calma**:

- **Superfícies neutras** — sem fundo colorido de tela; toda cor está nos dados.
- **Hierarquia pelo tamanho** — o número hero comunica a métrica; labels e contexto ficam secundários.
- **Listas estilo iOS Settings** (`IOSList`) no lugar de cards aninhados com sombra.
- **Zero sombras** — profundidade via cor de superfície (`--surface-deep` para todos os cards, `--surface` apenas para sheets sobrepostas, `--surface-2` para estados hover/active de pills e linhas), `--hairline` e o mecanismo global de tinta de fundo `--bg-radial` no body (edges calibradas para casar com `--surface-deep` e não criar step visível).
- **Accent restrito** — `#6C2BFF` apenas em: botão primário, orb, anel do gauge (fase), ícone pinned, links.
- **Dados com cor semântica** — DL é sempre azul, UL é sempre verde, latência é roxo/accent.
- **Toque mínimo** — bordas sutis (`--border`), hairlines (`--hairline`), raios arredondados mas não exagerados.

---

## 10. Checklist de conformidade

Antes de entregar qualquer tela ou componente novo:

- [ ] "linka" minúsculo em todo copy visível
- [ ] Zero `box-shadow` ou `text-shadow`
- [ ] Zero emoji em UI de produto
- [ ] Cores via tokens (`var(--*)`) — sem valores hex hardcoded em `.tsx`/`.css`
- [ ] Números de métrica em Geist
- [ ] Botão primário usa `btn-primary` com `--accent`
- [ ] Labels uppercase de seção: 11px, 600, `letter-spacing: 0.06em`, `--text-3`
- [ ] Cabeçalho de tela: usar `<TopBar>` + `<PageHeader>` + `useScrollHeader` (Bloco 5 — TopBar System); back é chevron `‹` em pill 36×36, sem texto
- [ ] Sem gradientes fora de `tokens.css`
- [ ] Copy em pt-BR, tom objetivo
