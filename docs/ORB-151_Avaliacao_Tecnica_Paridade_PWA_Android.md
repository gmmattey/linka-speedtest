# ORB-151 — Avaliação Técnica do Refactor PWA para Paridade com Android

Data: 2026-05-14  
Escopo: `linkaSpeedtestPwa` versus app Android Kotlin (`linkaAndroidKotlin`)

## 1) Inventário Técnico do PWA Atual

### Stack e runtime
- Build/runtime: Vite + React 19 + TypeScript 6 (`package.json`)
- Entrega: PWA com `vite-plugin-pwa`
- Shell nativo: Capacitor Android (`@capacitor/android`, `@capacitor/core`)
- Testes: Vitest (`npm test`)
- Deploy alvo: Cloudflare Pages (documentado no projeto)

### Estrutura funcional principal
- Navegação principal centralizada em `src/App.tsx` com stack manual de telas e abas
- Telas core eager-loaded:
  - `HomeScreen`, `RunningScreen`, `ResultScreen`, `HistoryScreen`, `PulseScreen`
- Telas secundárias lazy-loaded:
  - `ExploreScreen`, `LocalWifiScreen`, `LocalNetworkScreen`, `OnboardingScreen`
- Estado/fluxo de medição:
  - `src/hooks/useSpeedTest.ts`
  - `src/utils/speedTestOrchestrator.ts`
- Diagnóstico:
  - `src/features/diagnosis/*` (Claude + fallback rules engine)
  - `src/utils/combinedDiagnosis.ts` (camada complementar legada)

### Reuso vs reescrita
- Reaproveitamento alto:
  - Motor de medição (`useSpeedTest`, `speedTestOrchestrator`)
  - Persistência/histórico (`utils/history.ts`)
  - Plataforma/capabilities (`platform/capabilities.ts`)
  - Feature modules (local wifi/network, diagnosis)
- Reescrita/refactor recomendado:
  - Composição de layout/telas para paridade visual fina com Android
  - Estrutura de estado em `App.tsx` (reduzir acoplamento e condicionais)
  - Padronização de tokens e camadas de tema por componente

## 2) Mapa PWA → Android (Tela/Componente)

Referência Android: `linkaAndroidKotlin/docs_ai/technical/SCREEN_MAP.md`.

| PWA | Android equivalente | Paridade atual | Observação |
|---|---|---|---|
| `HomeScreen` | `HomeScreen.kt` / `SpeedTestScreen.kt` | Alta | Fluxo principal já alinhado |
| `RunningScreen` | `VelocidadeScreen.kt` | Alta | Estado de execução compatível |
| `ResultScreen` | `ResultadoVelocidadeScreen.kt` | Média/Alta | Necessita ajuste fino visual e de blocos |
| `HistoryScreen` | `HistoricoScreen.kt` | Alta | Estrutura funcional estável |
| `ExploreScreen` (`ajustes`) | `AjustesScreen.kt` | Média | Organização e densidade visual variam |
| `PulseScreen` | `LinkaPulseScreen.kt` | Média | Feature nova, requer alinhamento de linguagem visual |
| `LocalWifiScreen` | `SinalScreen.kt` | Média | PWA puro degrada; Android nativo é completo |
| `LocalNetworkScreen` | `DispositivosScreen.kt` | Média/Baixa | Limitação de APIs web para scan LAN |
| `Orbit` (fluxo em App/Pulse) | `OrbitScreen.kt` | Média | Alinhar navegação e affordances |
| `OnboardingScreen` | (sem 1:1 explícito) | Média | Ajustar microcopy e progressão por etapa |

## 3) Arquitetura de Design Tokens (Proposta)

Objetivo: consumir tokens da Lia sem acoplar regras visuais ao código de domínio.

### Estrutura sugerida
- Fonte de verdade: `tokens/tokens.json` (ou `tokens/*.json` por domínio)
- Build para web: gerar `src/tokens.css` com CSS variables
- Contratos TS: `src/theme/tokens.ts` para tipagem de consumo (evitar string solta)
- Camadas:
  - `primitive`: cor base, spacing, radius, typography scale
  - `semantic`: surface, text, border, success/warn/error
  - `component`: tokens locais (ex.: card de resultado, botão iniciar)

### Regras
- Tema claro/escuro por atributo no `html[data-theme]`
- Nenhuma cor hardcoded em componente de tela
- Componentes consumindo somente semantic/component tokens
- Motion tokens para duração/easing consistentes entre PWA e Android

## 4) Isolamento do Motor de Speedtest (proteção contra regressão)

### Onde mora hoje
- Entrada: `src/hooks/useSpeedTest.ts`
- Orquestração: `src/utils/speedTestOrchestrator.ts`
- Apoios: `downloadProbe.ts`, `uploadProbe.ts`, `latencyProbe.ts`, `packetLoss.ts`, `dns*`

### Estratégia de blindagem
- Manter assinatura pública do hook inalterada durante Onda 2
- Proibir alterações de regra de cálculo no refactor visual
- Criar camada de adapter UI (`view-model`) para telas consumirem dados já normalizados
- Validar paridade com suíte focada em contratos de saída do orchestrator

Resultado esperado: refactor de UI com risco baixo de quebrar medição/diagnóstico.

## 5) Estimativa (Story Points)

Escala: Fibonacci (1, 2, 3, 5, 8, 13). Inclui implementação + teste + ajuste visual.

| Item | SP | Notas |
|---|---:|---|
| Foundation de tokens + tema + utilitários de estilo | 8 | Base para todas as telas |
| Refactor de navegação/estado em `App.tsx` (sem alterar motor) | 8 | Reduz risco de regressão futura |
| `HomeScreen` paridade visual fina | 5 | Hero, CTAs, densidade |
| `RunningScreen` paridade visual fina | 3 | Estados de progresso |
| `ResultScreen` paridade visual fina | 8 | Tela mais densa do app |
| `HistoryScreen` paridade visual fina | 5 | Cards/lista/tipografia |
| `Explore/Ajustes` paridade visual fina | 5 | Hierarquia e spacing |
| `PulseScreen` alinhamento visual/UX com Android | 5 | Evolução incremental |
| `LocalWifiScreen` UX de capacidade + estado indisponível | 3 | Mantendo limitação de browser |
| `LocalNetworkScreen` UX de capacidade + estado indisponível | 3 | Mantendo limitação de browser |
| Ajustes Orbit/onboarding de consistência | 3 | Microinterações/copy |
| Testes de regressão de paridade (contrato + snapshots críticos) | 8 | Cobertura de risco |

Total estimado: **64 SP**

## 6) Plano de Execução (Onda 2)

### Ordem recomendada
1. Foundation
- Tokens, tema e contratos de estilo
- Refactor de `App.tsx` para reduzir acoplamento

2. Trilho core (alto impacto)
- `HomeScreen` → `RunningScreen` → `ResultScreen`
- Garantir equivalência visual e semântica

3. Trilho suporte
- `HistoryScreen` + `Explore/Ajustes` + `Pulse`

4. Trilho capacidades nativas
- `LocalWifi` e `LocalNetwork` com UX de degradação consistente

5. Fechamento
- Testes de regressão + checklist de paridade por domínio

### Dependências
- Tokens finais da Lia (paleta, tipografia, spacing, motion)
- Confirmação de comportamento esperado para recursos inviáveis no browser

### Riscos e mitigação
- Risco: quebrar fluxo de medição ao refatorar UI
  - Mitigação: congelar API do `useSpeedTest` + testes de contrato
- Risco: divergência visual tardia por falta de tokens finais
  - Mitigação: foundation primeiro, com fallback tokenizado
- Risco: expectativas de “paridade total” em recursos nativos
  - Mitigação: critérios explícitos de paridade experiencial

## Conclusão

A base atual já permite uma Onda 2 focada em refactor de interface, não em reescrita do núcleo. O caminho recomendado é: padronizar tokens, desacoplar a composição de telas em `App.tsx`, executar paridade visual por trilho e preservar o motor de speedtest como domínio protegido.

Com isso, a equipe ganha paridade Android consistente no PWA com risco controlado e previsibilidade de entrega.

## Addendum — Reestimativa com Base na Auditoria UX v2 (2026-05-14)

Fonte: `AUDITORIA_UX_PARIDADE_ANDROID_PWA_v2.md` (v2 aprovada).

### Mudanças de premissa vs estimativa anterior
- Escopo confirmado de **13 telas com paridade direta**.
- **5 telas consolidadas/removidas** a documentar e garantir roteamento/UX sem regressão.
- Diffs já tokenizados por tela reduzem incerteza de design, porém aumentam volume de execução detalhada.
- Motion e iconografia separados permitem execução paralela.
- Exceções funcionais exigem UI nova em pontos específicos (ex.: CTA Android em LocalWifi/LocalNetwork).

### Story Points (refresh v2)

#### A) Foundation transversal
| Item | SP |
|---|---:|
| Token plumbing definitivo (cores/tipo/spacing/radius + semantic/component mapping) | 8 |
| Refactor de composição/navegação em `App.tsx` para suportar rollout por tela com menos acoplamento | 8 |
| Trilho de motion (transições, gauge timing, ripple, toggles) | 5 |
| Trilho de iconografia (padronização ping/cellular/settings/loss e revisão de consistência) | 3 |

Subtotal A: **24 SP**

#### B) 13 telas com paridade direta
| Grupo | Telas | SP |
|---|---|---:|
| Core crítica | StartScreen, HomeScreen, RunningScreen, ResultScreen | 26 |
| Core suporte | HistoryScreen, PulseScreen, ExploreScreen | 13 |
| Modos de teste | ComparisonScreen, BeforeAfterScreen, RoomTestScreen | 8 |
| Exceções com UX proposta | LocalWifiScreen, LocalNetworkScreen, OnboardingScreen | 8 |

Subtotal B: **55 SP**

#### C) 5 telas removidas/consolidadas (governança técnica)
| Item | SP |
|---|---:|
| Documentar consolidação, validar navegação substituta e atualizar referências (Diagnostic/Details/Gamer/Recommend/DNSBenchmark) | 5 |

Subtotal C: **5 SP**

#### D) Hardening e prova de paridade
| Item | SP |
|---|---:|
| Regressão visual/funcional guiada por checklist v2 + cenários críticos por tela | 8 |
| Ajustes finais de responsividade/acessibilidade/temas | 5 |

Subtotal D: **13 SP**

### Total revisado v2

**97 SP**

Faixa operacional sugerida: **92–102 SP** (variação por refinamento fino de animações e ajustes cross-device).

### Paralelização sugerida
- Trilho 1: Core visual (Start/Home/Running/Result)
- Trilho 2: Motion + iconografia
- Trilho 3: Exceções funcionais (LocalWifi/LocalNetwork + CTA Android)
- Trilho 4: Conformidade/checklist e regressão

### Confirmação: Isolamento do speedtest engine para Running/Result

O plano de isolamento continua válido para as mudanças v2 em `RunningScreen` e `ResultScreen`, desde que sejam mantidas estas guardrails:
- Não alterar assinatura/contrato de `useSpeedTest.ts`.
- Não alterar regras de cálculo em `speedTestOrchestrator.ts` durante paridade visual.
- Introduzir adapter de view-model para `Running`/`Result` (formatação e composição visual separadas do domínio).
- Cobrir regressão com testes de contrato de saída para fases, métricas e flags usadas em tela.

Com essas restrições, as mudanças v2 nessas telas permanecem no domínio de UI/composição, sem destravar risco no engine.
