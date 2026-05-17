# Componentes PWA — Linka SpeedTest

**Versão:** v1.4.0 | **Localização:** `src/components/`

29 componentes agrupados por domínio.

---

## Navegação (6)

| Componente | Arquivo | Propósito |
| --- | --- | --- |
| `BottomNavBar` | `BottomNavBar.tsx` | Barra navegação inferior (5 tabs: Início, Velocidade, Diagnóstico, Dispositivos, Ajustes) — v1.4.0 |
| `TopBar` | `TopBar.tsx` | Header superior com título + ações; suporta prop `opacity` para fade-on-scroll |
| `BackButton` | `BackButton.tsx` | Botão voltar padrão |
| `PageHeader` | `PageHeader.tsx` | Header páginas com breadcrumb/título |
| `HamburgerMenu` | `HamburgerMenu.tsx` | Menu lateral mobile |

---

## Dados & Gráficos (4)

| Componente | Arquivo | Propósito |
| --- | --- | --- |
| `Gauge` | `Gauge.tsx` | Gauge circular velocidade |
| `LiveChart` | `LiveChart.tsx` | Gráfico tempo real animado |
| `MiniGrafico` | Refatorado em `Gauge.tsx` | Mini gráfico histórico (deprecated) |
| `PathRow` | `PathRow.tsx` | Visualiza caminho rede/latência |

---

## Sheets & Modais (3)

| Componente | Arquivo | Propósito |
| --- | --- | --- |
| `BottomSheet` | `BottomSheet.tsx` | Sheet inferior (iOS-like) |
| `DraggableSheet` | `DraggableSheet.tsx` | Sheet com handle drag |
| `InfoTooltip` | `InfoTooltip.tsx` | Tooltip informativo |

---

## Branding & Efeitos (3)

| Componente | Arquivo | Propósito |
| --- | --- | --- |
| `LinkaPulseSymbol` | `LinkaPulseSymbol.tsx` | Logo marca LinkaPulse |
| `AppBorderGlow` | `AppBorderGlow.tsx` | Efeito glow borda animada |
| `RotatingMessage` | `RotatingMessage.tsx` | Texto rotaciona entre mensagens |

---

## Estado & Feedback (5)

| Componente | Arquivo | Propósito |
| --- | --- | --- |
| `Skeleton` | `Skeleton.tsx` | Loading skeleton placeholder |
| `PullToRefreshIndicator` | `PullToRefreshIndicator.tsx` | Indicador pull-to-refresh |
| `PwaUpdatePrompt` | `PwaUpdatePrompt.tsx` | Notificação atualização PWA |
| `Chip` | `Chip.tsx` | Chip/tag filtro ou status |
| `Accordion` | `Accordion.tsx` | Componente expansível |

---

## IA & Diagnóstico (3)

| Componente | Arquivo | Propósito |
| --- | --- | --- |
| `ContextualQuestion` | `ContextualQuestion.tsx` | Pergunta contextual inline |
| `DiagnosisChips` | `DiagnosisChips.tsx` | Row chips diagnóstico |
| `PulseResultCard` | `PulseResultCard.tsx` | Card resultado pulse/monitoring |

---

## Integrações de Plataforma (1)

| Componente | Arquivo | Propósito |
| --- | --- | --- |
| `WifiContextCard` | `WifiContextCard.tsx` | Exibe contexto Wi-Fi capturado via Atalho iOS antes do teste; integrado em `App.tsx`, `ResultScreen.tsx` e `StartScreen.tsx` (v1.3.0) |

---

## Listas & Ícones (3)

| Componente | Arquivo | Propósito |
| --- | --- | --- |
| `IOSList` | `IOSList.tsx` | Lista estilo iOS (dividers, separators) |
| `icons.tsx` | `icons.tsx` | Biblioteca ícones SVG (25+ ícones) |
| `IconButton` | `IconButton.tsx` | Botão com ícone |

---

## Hooks Customizados (Relacionados)

| Hook | Localização | Propósito |
| --- | --- | --- |
| `useScrollHeader` | `src/hooks/` | Monitora scroll para retornar `scrolled: boolean` e `topBarOpacity: number`; usado por TopBar para fade-on-scroll |

---

## Total: 29 componentes

- **Componentizados:** Cada um é um módulo React funcional.
- **Customizável:** Props tipadas (TypeScript), slots via children.
- **Acessível:** ARIA labels, keyboard navigation.
- **PWA-first:** Sem dependências externas pesadas.

---

## Convenção de Nomeclatura

- Sem prefixo genérico (Lk-, App-) — nome direto descreve propósito.
- Componentes de IA: prefixo "Contextual", "Diagnosis", "Pulse".
- Componentes técnicos: `PathRow`, `LiveChart`, `Gauge`.

---

## Relacionamentos

```
BottomNavBar (5 tabs) usa: routing, TopBar opacity control

TopBar usa: opacity prop via useScrollHeader

ResultScreen usa: Gauge, DiagnosisChips, AppBorderGlow

PulseScreen usa: PulseResultCard, LinkaPulseSymbol, Accordion

HistoryScreen usa: IOSList, Skeleton, DraggableSheet

DiagnosticScreen usa: ContextualQuestion, PageHeader

FibraScreen usa: IOSList, Chip (para GPON status)

SpeedTestScreen usa: Gauge, modos de speedtest
```

---

## Notas

- Nenhum componente acessa localStorage ou API diretamente — delegado a hooks customizados.
- Todos suportam tema claro/escuro via CSS variables (`--bg`, `--accent`, etc).
- Testes unitários em `src/components/__tests__/` (Vitest).
- `TopBar` com fade-on-scroll via `opacity={topBarOpacity}` em todas as 12+ telas que o usam.
