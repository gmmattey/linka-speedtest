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
| `--surface` | `#16161E` | `#FFFFFF` | Cards, listas |
| `--surface-2` | `#1E1E28` | `#F2F2F7` | Estado hover/active, alternância |
| `--surface-3` | `#25252F` | `#ECECF1` | Separadores visuais, track do gauge |
| `--hairline` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.06)` | Separadores de linha (hairline) |
| `--border` | `rgba(255,255,255,0.10)` | `rgba(0,0,0,0.10)` | Bordas de cards |

### Regras de uso de cor

- **Zero box-shadow e text-shadow.** Profundidade é indicada somente por cor de superfície e bordas.
- **Accent `#6C2BFF` apenas em elementos interativos** (botões primários, links, orb) ou como ênfase de label (badge, ícone pinned). Não usar como cor de fundo de tela inteira.
- **DL (`--dl`) e UL (`--ul`)** são reservadas para métricas de velocidade. Não usar em contextos não relacionados a velocidade.
- **Gradientes:** proibidos exceto na definição de `tokens.css`.

---

## 3. Tipografia

### Fontes

| Família | Uso | Variantes carregadas |
|---|---|---|
| **Geist** (`var(--font-display)` e `var(--font-body)`) | Toda a interface — uma família única, como o iOS faz com SF Pro | 400, 500, 600, 700 |

Geist é a fonte open-source da Vercel, projetada como alternativa web mais próxima do SF Pro. Uma família só elimina a dissonância entre display e body, reforçando a direção iOS-Calma.

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

Todas as telas usam o mesmo padrão de topo:
```css
padding: 14px 16px 4px;
```
Estrutura: `‹ Início` (esquerda, `color: var(--accent)`, `font-size: 14px`, `font-weight: 500`) + label de tela (direita, `font-size: 13px`, `color: var(--text-3)`).

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
- **Zero sombras** — profundidade via cor de superfície (`--surface` / `--surface-2`) e `--hairline`.
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
- [ ] Cabeçalho de tela: padding `14px 16px 4px`, `‹ Início` (accent) + label (text-3)
- [ ] Sem gradientes fora de `tokens.css`
- [ ] Copy em pt-BR, tom objetivo
