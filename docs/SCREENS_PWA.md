# Telas PWA — Linka SpeedTest

**Versão:** v1.0.0 | **Arquivo de rotas:** `src/App.tsx` | **Componente shell:** `src/components/BottomNavBar.tsx`

---

## Telas (17)

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

---

## Navegação & Routing

**Arquivo principal:** `src/App.tsx`

Define rotas usando `<Routes>` (React Router 6+).

**Shell:** `src/components/BottomNavBar.tsx`

Gerencia navegação tabs principais: Home, History, Explore, Pulse.

**Deep linking:** Suportado via `useNavigate()`.

---

## Notas

- Telas são componentes React com hooks (useState, useEffect, etc).
- Roteamento usa React Router v6 (path-based, não hash-based).
- Cada tela é responsável por seu estado local.
- PWA standalone — não usa backend, dados salvos em localStorage.

---

## Relação com Android

Nota-se paridade de funcionalidade com Android:
- Start ≈ Home Android
- Running ≈ SpeedTest Screen
- Result ≈ Resultado Velocidade
- DNS Benchmark ≈ DNS Screen
- Pulse ≈ LinkaPulse
- Diagnostic ≈ Orbit (IA)

Divergências são por limitações navegador (Explore usa geolocation API, Pulse requer background support).
