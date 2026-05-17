# Telas PWA — Linka SpeedTest

**Versão:** v1.4.0 | **Arquivo de rotas:** `src/App.tsx` | **Componente shell:** `src/components/BottomNavBar.tsx`

---

## Telas (19)

| # | Tela | Arquivo | Rota | Propósito |
| --- | --- | --- | --- | --- |
| 1 | Start | `src/screens/StartScreen.tsx` | `/` | Tela inicial, CTA speedtest |
| 2 | Running | `src/screens/RunningScreen.tsx` | `/running` | Execução speedtest em tempo real |
| 3 | Result | `src/screens/ResultScreen.tsx` | `/result` | Exibição resultados (DL/UL/lat/jitter) |
| 4 | Home | `src/screens/HomeScreen.tsx` | `/home` | Dashboard estatísticas, resumo |
| 5 | History | `src/screens/HistoryScreen.tsx` | `/history` | Lista testes histórico, exportar |
| 6 | Explore | `src/screens/ExploreScreen.tsx` | `/explore` | Exploração de dados geográficos |
| 7 | Pulse | `src/screens/PulseScreen.tsx` | `/pulse` | Monitoramento contínuo passivo |
| 8 | Before/After | `src/screens/BeforeAfterScreen.tsx` | `/before-after` | Comparação antes/depois ação |
| 9 | Comparison | `src/screens/ComparisonScreen.tsx` | `/comparison` | Comparação testes múltiplos |
| 10 | Onboarding | `src/screens/OnboardingScreen.tsx` | `/onboarding` | Fluxo orientação primeiro acesso |
| 11 | DNS Benchmark | `src/screens/DNSBenchmarkScreen.tsx` | `/dns-benchmark` | Teste resolvedores DNS |
| 12 | DNS Guide | `src/screens/DNSGuideScreen.tsx` | `/dns-guide` | Guia mudança DNS |
| 13 | Room Test | `src/screens/RoomTestScreen.tsx` | `/room-test` | Teste speedtest por ambiente |
| 14 | Gamer | `src/screens/GamerScreen.tsx` | `/gamer` | Teste otimizado para jogadores |
| 15 | Recommend | `src/screens/RecommendScreen.tsx` | `/recommend` | Recomendações baseadas resultado |
| 16 | Details | `src/screens/DetailsScreen.tsx` | `/details` | Detalhes técnicos teste |
| 17 | Diagnostic | `src/screens/DiagnosticScreen.tsx` | `/diagnostic` | Diagnóstico guiado IA |
| 18 | SpeedTest (dedicada) | `src/screens/SpeedTestScreen.tsx` | `/speedtest` | Tela dedicada speedtest com seletor modo |
| 19 | Fibra | `src/screens/FibraScreen.tsx` | `/fibra` | Fibra/modem: IP, link painel, métricas ONU, GPON |

---

## Navegação & Routing

**Arquivo principal:** `src/App.tsx`

Define rotas via `useState<Screen>` (sem React Router). Type `Screen` inclui sub-telas como `'fibra'`, `'historico'`, `'sinal'`.

**Shell:** `src/components/BottomNavBar.tsx`

5 tabs principais (v1.4.0+):
- Início (home)
- Velocidade (speedtest)
- Diagnóstico (diagnostic)
- Dispositivos (local-network)
- Ajustes (explore)

**Sub-telas:** Acesso via navegação interna; BottomNavBar permanece visível, aba de origem destacada.

- `historico` → aba Início
- `sinal` → aba Início
- `fibra` → aba Ajustes (via "Configurações do roteador")

**Deep linking:** Suportado via `navigate(screen)`.

---

## TopBar Fade-on-Scroll (v1.4.0+)

`TopBar` recebe novo prop `opacity` (número 0–1), usado para fade gradual ao rolar.

Hook `useScrollHeader` (em hooks customizados) retorna:
- `scrolled: boolean`
- `topBarOpacity: number` (novo)

Threshold: 80px de scroll dispara fade.

---

## Notas

- Telas são componentes React com hooks (useState, useEffect, etc).
- Roteamento usa `useState<Screen>` em `App.tsx` (padrão PWA-specific).
- Cada tela é responsável por seu estado local.
- PWA standalone — não usa backend, dados salvos em localStorage.

---

## Relação com Android

Nota-se paridade de funcionalidade com Android:
- Start ≈ Home Android
- SpeedTest (dedicada) ≈ SpeedTest Screen Android
- Result ≈ Resultado Velocidade Android
- DNS Benchmark ≈ DNS Screen Android
- Pulse ≈ LinkaPulse Android
- Diagnostic ≈ Orbit (IA) Android
- Fibra ≈ Fibra Screen Android

Divergências são por limitações navegador (Explore usa geolocation API, Pulse requer background support).
