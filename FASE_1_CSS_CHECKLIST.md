# Fase 1: CSS Parity Checklist — StartScreen, ResultScreen, ExploreScreen, HistoryScreen

**Objetivo:** Atingir 95% de paridade visual com Kotlin. CSS-only (sem changes em .tsx).

**Data de Criação:** 2026-05-09
**Status:** Planejamento → Execução paralela

---

## 0. Pré-requisitos

✓ tokens.css: Design tokens validados (cores, spacing, typography, glow, transitions)
✓ StartScreen.css: Estrutura base pronta
✓ ResultScreen.css: Card unificado + glow implementado
✓ ExploreScreen.css: IOSList + toggles presentes
✓ HistoryScreen.css: Trend cards + list items presentes
✓ TopBar.css: Glass effect implementado
✓ PageHeader.css: Responsive title sizes implementados
✓ IOSList.css: Base styling presente

---

## 1. StartScreen — UI/UX Parity

**Status:** Pendente  
**Prioridade:** Alta  
**Duração estimada:** 1-2 dias  

### 1.1 Verificação de estrutura atual
- [ ] Orb pulsante (200×200px) — validar tamanho vs Kotlin
- [ ] Mode selector: atualmente `<select>` — será mudado em TSX (fora do escopo CSS)
- [ ] Bottom actions: pill buttons 36×36 — validar espaçamento

### 1.2 CSS updates necessárias

**Orb styling:**
- [ ] Validar `animation: lk-orb-pulse` duração (atualmente não especificada em reads)
- [ ] Validar cor base: `var(--accent)` vs Kotlin
- [ ] Adicionar glow se não existir: `box-shadow: 0 0 32px var(--accent)` com alpha

**Typography:**
- [ ] Logo/header: validar font-size (não consta em StartScreen.css lido antes)
- [ ] Mode label: aumentar de padrão para 14px bold se <14px
- [ ] "Clique para começar": aumentar de padrão para 15px se <15px

**Spacing:**
- [ ] Gap entre orb e mode selector: validar se 32px (padrão MD3)
- [ ] Bottom actions container: validar padding (deve ser 16px horizontal, 20px bottom)
- [ ] Gap entre pill buttons: validar se 12px

**Botões inferiores (pill 36×36):**
- [ ] Altura: 36px (bordado/filled)
- [ ] Width: 36px (quadrado)
- [ ] Border-radius: 12px (não totalmente round)
- [ ] Gap entre elementos: 12px
- [ ] Icons dentro: 20px

### 1.3 Responsividade
- [ ] Mobile 375px: orb mantém 200px, botões 36px
- [ ] Tablet ≥480px: validar se orb ou botões crescem (provavelmente não)

---

## 2. ResultScreen — UI/UX Parity

**Status:** Pendente  
**Prioridade:** Alta  
**Duração estimada:** 2-3 dias  

### 2.1 Primary Block (Download/Upload values)

**Font sizes:**
- [ ] Mobile 375px: aumentar 52px → 56px se Kotlin usa 56px
- [ ] Desktop ≥600px: aumentar 64px → 72px se Kotlin usa 72px
- [ ] Validar line-height: 1 (atual) vs 0.9-1 em Kotlin

**Glow effect:**
- [ ] Validar `text-shadow` blur: 16px (atual) — aumentar para 20px se Kotlin usa
- [ ] Validar alpha: ~0.3-0.4 (atual) — confirmar com cores
- [ ] Cores de glow: `--dl-glow`, `--ul-glow` já em tokens.css

**Spacing:**
- [ ] Gap entre DL/UL cells: 12px (atual) — validar vs Kotlin
- [ ] Padding interna: 20px (atual) — validar vs Kotlin

### 2.2 Secondary Block (Ping, Jitter, etc.)

**Font sizes:**
- [ ] Mobile 375px: 13px (atual) → aumentar se Kotlin > 13px
- [ ] Desktop ≥600px: 15px (atual) → aumentar se Kotlin > 15px
- [ ] Label: 9px (atual) — validar vs Kotlin

**Spacing:**
- [ ] Gap entre cells: 6px (atual) — validar vs Kotlin (pode ser 8px)
- [ ] Padding: 12px 16px (atual) — validar vs Kotlin

### 2.3 Use Cases Row (Streaming, Gaming, etc.)

**Icon styling:**
- [ ] Icon size: 36px (atual) — validar vs Kotlin
- [ ] Border-radius: 10px (atual) — validar vs Kotlin (pode ser 8px)
- [ ] Background colors: `gradeStyle()` em TSX, CSS só aplica cores

**Label font:**
- [ ] Font: `var(--font-body)` (atual, correto)
- [ ] Font-size: 9px (atual) — validar vs Kotlin (pode ser 10px)
- [ ] Weight: 500 (atual) — validar vs Kotlin

**Chip (Grade badge):**
- [ ] Font-size: 8.5px (atual) — aumentar para 9px se Kotlin usa
- [ ] Padding: 2px 5px (atual) — validar vs Kotlin (pode ser 3px 6px)
- [ ] Border-radius: 10px (atual) — validar vs Kotlin

### 2.4 Diagnosis Card (`.lk-result__combined`)

**Glow effect:**
- [ ] Box-shadow: `0 0 24px var(--diag-glow-color)` (atual)
- [ ] Validar se aumentar para `0 0 32px` para match Kotlin
- [ ] Pulse animation: 24px → 32px (atual) — considerar 28px → 36px

**Card border:**
- [ ] Border: 1px solid `var(--border)` (atual) — validar vs Kotlin
- [ ] Adicionar border-color dinâmico em TSX (já planejado)

**Title sizing:**
- [ ] Font-size: 15px (atual) — aumentar para 16px se Kotlin > 15px
- [ ] Weight: 600 (atual) — validar vs Kotlin

**Action blocks:**
- [ ] Padding: 10px 12px (atual) — validar vs Kotlin
- [ ] Gap: 2px (atual) — validar vs Kotlin
- [ ] Border-radius: `var(--radius-sm)` → validar valor em tokens.css

### 2.5 Animations
- [ ] Stagger delays: 0/60/120/240/300ms (atuais) — validar continuidade
- [ ] Fade-up: 320ms cubic-bezier(0.2, 0.7, 0.2, 1) — validar vs Kotlin
- [ ] Respeitam `prefers-reduced-motion` — confirmar

---

## 3. ExploreScreen (AjustesScreen) — UI/UX Parity

**Status:** Pendente  
**Prioridade:** Alta  
**Duração estimada:** 2-3 dias  

### 3.1 Overall layout
- [ ] Scroll container: gap 24px (atual) — validar vs Kotlin
- [ ] Max-width: não limitado (atual) — validar se Kotlin limita

### 3.2 Section styling

**Labels:**
- [ ] Font-size: 11px (atual) — aumentar para 12px se Kotlin > 11px
- [ ] Weight: 600 (atual) — validar
- [ ] Color: `var(--text-3)` (atual) — validar

**Spacing:**
- [ ] Gap entre label e list: 8px (atual) — aumentar para 12px se Kotlin
- [ ] Padding horizontal: 2px em label (atual) — validar

### 3.3 IOSList rows (settings)

**Row height:**
- [ ] Current: 13px padding (implícito height ~50px) — validar vs Kotlin
- [ ] Considerar aumentar padding para 15px if Kotlin maior

**Icon styling:**
- [ ] Size: 28px (atual) — validar vs Kotlin (pode ser 32px)
- [ ] Border-radius: 7px (atual) — validar vs Kotlin (pode ser 8px)
- [ ] Gap: 12px (atual) — validar vs Kotlin

**Title/Sub typography:**
- [ ] Title: 14px (atual) — aumentar para 15px se Kotlin > 14px
- [ ] Sub: 12px (atual) — aumentar para 13px se Kotlin > 12px

**Trailing value styling:**
- [ ] Font: `var(--font-mono)` (atual) — validar vs Kotlin
- [ ] Size: 14px (atual) — aumentar para 15px se Kotlin > 14px
- [ ] Weight: 600 (atual) — validar vs Kotlin

### 3.4 Toggles (settings state)

**Toggle switch:**
- [ ] Width: 44px (atual) — validar vs Kotlin (pode ser 48px)
- [ ] Height: 24px (atual) — validar vs Kotlin
- [ ] Thumb size: 20px (atual) — validar vs Kotlin (pode ser 22px)
- [ ] Transition: 0.2s (atual) — validar vs Kotlin

### 3.5 Section visibility (não CSS, mas context)
- [ ] "Perfil" section: expandir mostrando campos
- [ ] "Experiência" section: expandir com sliders/options
- [ ] "Medição" section: expandir com test settings
- [ ] "Histórico" section: expandir com list options
- [ ] **"Roteador" section: REMOVE integralmente** (não suportado em PWA)

---

## 4. HistoryScreen — UI/UX Parity

**Status:** Pendente  
**Prioridade:** Média  
**Duração estimada:** 1 dia  

### 4.1 Main container
- [ ] Max-width: 480px (atual) — validar vs Kotlin
- [ ] Gap: `var(--space-lg)` (atual, 16px) — validar vs Kotlin

### 4.2 Trend cards

**Styling:**
- [ ] Padding: `var(--space-md)` (atual, 12px) 14px — aumentar para 16px 14px?
- [ ] Border-left width: 3px (atual) — validar vs Kotlin
- [ ] Border-radius: `var(--radius)` (atual, ~8px) — validar vs Kotlin

**Typography:**
- [ ] Headline: 14px weight 600 (atual) — aumentar para 15px se Kotlin
- [ ] Comparison: 13px (atual) — aumentar para 14px se Kotlin

### 4.3 Summary metrics

**Styling:**
- [ ] Font-size: 22px (atual) — aumentar para 28px se Kotlin > 22px
- [ ] Weight: 700 (atual) — validar
- [ ] Gap: `var(--space-lg)` (atual, 16px) — validar

**Quality sub-text:**
- [ ] Font-size: 12px (atual) — aumentar para 13px se Kotlin

### 4.4 List items

**Row styling:**
- [ ] Padding: 13px 14px (atual) — aumentar para 14px 16px se Kotlin
- [ ] Gap: `var(--space-md)` (atual, 12px) — validar

**Date/Time typography:**
- [ ] Font-size: 11px (atual) — validar vs Kotlin

**Values (DL/UL/Latency):**
- [ ] Font-size: 15px (atual) — aumentar para 16px se Kotlin > 15px
- [ ] Weight: 600 (atual) — validar
- [ ] Latency sub-size: 13px (atual) — validar

**Location tag:**
- [ ] Font-size: 11px (atual) — validar vs Kotlin
- [ ] Weight: 500 (atual) — validar

### 4.5 Chart section

**Chart container:**
- [ ] Height: 140px (atual) — validar vs Kotlin (pode ser 160px)

**Legend:**
- [ ] Font-size: 11px (atual) — validar vs Kotlin

### 4.6 Detail overlay (`.lk-history--detail`)

**Hero section values:**
- [ ] Font-size: 26px (atual) — aumentar para 32px se Kotlin > 26px
- [ ] Weight: 700 (atual) — validar

**Detail rows:**
- [ ] Padding: 12px 0 (implícito) — validar vs Kotlin

---

## 5. Componentes Globais — TopBar, PageHeader, IOSList

**Status:** Pendente  
**Prioridade:** Alta (base para todas as telas)  
**Duração estimada:** 1 dia  

### 5.1 TopBar (`.lk-topbar`)

**Height:**
- [ ] Current: `56px + var(--safe-top)` — validar vs Kotlin
- [ ] Considerar aumentar para 64px se Kotlin > 56px

**Glass effect:**
- [ ] Blur: 20px (atual) — validar vs Kotlin (considerar 24px)
- [ ] Saturate: 160% (atual) — validar vs Kotlin

**Title styling:**
- [ ] Font-size: 14px (atual) — aumentar para 15px se Kotlin > 14px
- [ ] Weight: 600 (atual) — validar vs Kotlin (pode ser 700)

**Spacer icon slot:**
- [ ] Size: 36px (atual) — validar vs Kotlin (pode ser 40px)

### 5.2 PageHeader (`.lk-page-header`)

**Padding:**
- [ ] Current: `calc(var(--safe-top) + 56px + var(--space-md))` top
- [ ] Validar se aumentar se TopBar cresce

**Title sizing:**
- [ ] Large variant: 32px (mobile) → 40px (≥480px) — validar vs Kotlin
- [ ] Medium variant: 24px (mobile) → 28px (≥480px) — validar vs Kotlin

**Letter spacing:**
- [ ] Large: -0.02em (atual) — validar vs Kotlin
- [ ] Medium: -0.015em (atual) — validar vs Kotlin

### 5.3 IOSList (`.lk-ios-list`)

**Row heights:**
- [ ] Padding: 13px 14px (atual) — aumentar para 14px 16px se Kotlin > 13px

**Icon sizing:**
- [ ] Current: 28px — validar vs Kotlin (pode ser 32px)
- [ ] Border-radius: 7px (atual) — validar vs Kotlin (pode ser 8px)

**Typography:**
- [ ] Title: 14px (atual) — aumentar para 15px se Kotlin > 14px
- [ ] Sub: 12px (atual) — aumentar para 13px se Kotlin > 12px
- [ ] Trailing: 14px (atual) — aumentar para 15px se Kotlin > 14px

**Hover/Active states:**
- [ ] Background: `var(--surface-2)` (atual) — validar vs Kotlin
- [ ] Transition: `var(--t-fast)` (atual, ~150ms) — validar vs Kotlin

---

## 6. Validação Cross-screen

### 6.1 Cores & Tokens
- [ ] `--accent`: consistente em todas as telas (Primary action color)
- [ ] `--surface-deep`: card backgrounds consistentes
- [ ] `--border`: hairlines consistentes (1px)
- [ ] Glow colors: `--dl-glow`, `--ul-glow`, `--success-glow` aplicados

### 6.2 Spacing
- [ ] `--space-xs` (4px), `--space-sm` (8px), `--space-md` (12px), `--space-lg` (16px), `--space-xl` (24px)
- [ ] Consistência: sections gap 24px, rows gap 12px, inline gap 8px

### 6.3 Typography
- [ ] Display font: `--font-display` em títulos, labels
- [ ] Body font: `--font-body` em copy
- [ ] Mono font: `--font-mono` apenas em valores técnicos
- [ ] Weights: 400 (body), 500, 600, 700 (headlines)

### 6.4 Animations
- [ ] Fade-up entrance: todas as screens (320ms, 0.2, 0.7, 0.2, 1)
- [ ] Stagger delays: escalonados 60-360ms
- [ ] Reduced motion: todas as animações desabilitadas

### 6.5 Responsividade
- [ ] Mobile 375px: layouts single-column, font reduzidas
- [ ] Desktop ≥600px: layouts grid, font aumentadas
- [ ] Safe areas: `var(--safe-top)`, `var(--safe-left)`, etc.

---

## 7. Execução Paralela

**Ordem sugerida:**
1. ✓ Tokens.css → validado
2. → StartScreen.css (simples, isolado)
3. → ResultScreen.css (complexo, muitos detalhes)
4. → ExploreScreen.css (muitos sub-componentes)
5. → HistoryScreen.css (similar a Result)
6. → TopBar.css, PageHeader.css, IOSList.css (dependências globais)

**Batches de paralelismo:**
- Batch 1: StartScreen + TopBar/PageHeader (independentes)
- Batch 2: ResultScreen + IOSList (depends on global)
- Batch 3: ExploreScreen (depends on IOSList)
- Batch 4: HistoryScreen (depends on global)

---

## 8. Notas de Implementação

### Não mudar neste round:
- TypeScript (.tsx) — mantém lógica intacta
- HTML structure — mantém classes/IDs
- Componentes placeholder — removido em Fase 3
- Lógica de speed test — PROIBIDO

### Mudar APENAS CSS:
- Font sizes
- Spacing (padding, margin, gap)
- Colors (via tokens)
- Animation durations/delays
- Border widths/radius
- Component dimensions (width, height)

### Fallback validation:
- Se não conseguir confirmar tamanho Kotlin: manter +10% dos atuais (ex: 14px → 15px)
- Se cores não forem definidas em tokens: usar atuais
- Se animations não forem definidas: manter atuais

---

## 9. Status e Updates

| Screen | CSS File | Status | ETA |
|--------|----------|--------|-----|
| StartScreen | StartScreen.css | Pendente | 1-2 dias |
| ResultScreen | ResultScreen.css | Pendente | 2-3 dias |
| ExploreScreen | ExploreScreen.css | Pendente | 2-3 dias |
| HistoryScreen | HistoryScreen.css | Pendente | 1 dia |
| TopBar | TopBar.css | Pendente | 1 dia |
| PageHeader | PageHeader.css | Pendente | 1 dia |
| IOSList | IOSList.css | Pendente | 1 dia |

**Total Fase 1:** ~2 semanas de trabalho de design

---

## 10. Próximas etapas

1. Confirmar valores específicos do Kotlin com designer/PM
2. Criar visual diff mockup (antes/depois)
3. Executar implementação em paralelo
4. Testar responsividade em mobile 375px, 414px, tablet ≥768px
5. Validar dark mode + light mode
6. Passar por QA visual antes de Phase 2 (IA)
