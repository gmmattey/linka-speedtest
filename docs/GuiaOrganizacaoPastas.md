# Guia de Organização de Pastas — linka SpeedTest PWA

> Referência autoritativa para a estrutura de arquivos do projeto. Consulte antes de criar qualquer arquivo novo.

---

## Estrutura oficial

```
Linka SpeedTest/
├── docs/                         ← Documentação do projeto (este guia)
│   ├── IndiceDocumentacao.md
│   ├── GuiaOrganizacaoPastas.md
│   ├── ManifestoDesenvolvimentoIA.md
│   ├── GuiaFluxoGit.md           ← Protocolo de sincronização Git para IAs e humanos
│   ├── GuiaBranding.md           ← Identidade visual: cores, tipografia, componentes, copy, iOS-Calma
│   ├── GuiaSelecaoModeloIA.md
│   ├── DocumentacaoFuncionalSistema.md
│   ├── DocumentacaoTecnicaSistema.md
│   ├── CI-CD.md                  ← CI/CD GitHub Actions (PWA + Capacitor APK) — setup secrets, keystore, Cloudflare Pages (2026-05)
│   ├── EvolucaoSpeedTest.md      ← Roadmap e features futuras do produto
│   ├── EvolucaoTelaDesktop.md    ← Design de telas desktop (prototipagem aprovada)
│   ├── PendenciasLayout.md       ← Backlog de melhorias de layout e UX
│   ├── PendenciasTecnicas.md     ← Backlog técnico: diagnóstico, classificador, coerência
│   ├── RecomendacaoEquipamentos.md ← Plano de monetização: recomendação de equipamentos
│   └── mockups/                  ← Protótipos HTML estáticos aprovados (não versionados em prod)
│       └── recomendacoes_empty_state.html  ← Empty-state positivo da RecommendScreen (aprovado 2026-05-02)
│
├── .github/                      ← Pipelines GitHub Actions (2026-05)
│   └── workflows/
│       ├── ci.yml                ← Lint + test + build em todo push/PR contra main
│       └── release.yml           ← Tag v* dispara deploy Cloudflare Pages + build APK assinado
│
├── public/                       ← Assets estáticos (copiados verbatim para dist/)
│   ├── logo.png                  ← Logo oficial linka (fonte: D:\Projetos\LINKA\...)
│   ├── icon-192.png              ← PWA icon any
│   ├── icon-512.png              ← PWA icon any
│   ├── icon-maskable-192.png     ← PWA icon maskable
│   └── icon-maskable-512.png     ← PWA icon maskable
│
├── android/                      ← Projeto Android nativo gerado pelo Capacitor
│   ├── app/                      ← Módulo Android do APK
│   │   └── src/main/java/br/com/linka/speedtest/
│   │       ├── MainActivity.java                 ← BridgeActivity; registra plugins inline
│   │       ├── wifi/                              ← Plugins Capacitor internos do projeto
│   │       │   └── LinkaWifiDiagnosticsPlugin.java ← Diagnóstico Wi-Fi nativo (2026-05)
│   │       └── packetloss/                        ← Plugin Capacitor packet loss (2026-05)
│   │           └── PacketLossPlugin.java          ← Mede perda de pacotes via UDP (Android-only)
│   ├── gradle/                   ← Gradle Wrapper versionado
│   ├── build.gradle
│   ├── settings.gradle
│   ├── variables.gradle
│   └── gradlew / gradlew.bat
│
├── _android-toolchain/           ← Toolchain local ignorado pelo Git (SDK, JDK, caches)
│
├── builds/                       ← Artefatos gerados para entrega manual (ignorado pelo Git)
│   └── apk/                      ← Pasta comum obrigatória para APKs versionados
│
├── scripts/                      ← Scripts operacionais do projeto
│   └── build-android-apk.ps1     ← Gera APK versionado sem sobrescrever artefatos
│
├── src/
│   ├── main.tsx                  ← Entry point; imports tokens.css
│   ├── App.tsx                   ← Root component; estado global; roteamento por switch
│   ├── tokens.css                ← CSS Custom Properties: temas, espaçamento, tipografia
│   │
│   ├── types/
│   │   ├── index.ts              ← Todos os tipos TypeScript compartilhados
│   │   └── pwa.d.ts              ← Ambient module para `virtual:pwa-register/react` (vite-plugin-pwa)
│   │
│   ├── components/               ← Componentes reutilizáveis (sem estado de negócio)
│   │   ├── Accordion.tsx / .css  ← Bloco expansível header+conteúdo (criado no refator arquitetura 2026-05; sem caller após o refator drag-to-resize 2026-05, preservado para uso futuro)
│   │   ├── BackButton.tsx / .css ← Botão voltar (chevron em pill 36×36) — Bloco 5 TopBar
│   │   ├── BottomSheet.tsx / .css
│   │   ├── Chip.tsx / .css       ← Badge/chip com variantes semânticas (good/maybe/bad/accent/neutral)
│   │   ├── Skeleton.tsx / .css   ← Placeholder com shimmer para loading states (App fallback, WifiSignalSection, DNSGuideSheet) — 2026-05
│   │   ├── DraggableSheet.tsx / .css ← Base universal de bottom sheet com drag-to-resize (snap 60vh/88vh) — refator 2026-05
│   │   ├── Gauge.tsx / .css      ← Anel SVG com fase + número hero + unidade
│   │   ├── HamburgerMenu.tsx / .css
│   │   ├── IconButton.tsx / .css ← Ação circular do TopBar (mesmo padrão visual do BackButton)
│   │   ├── InfoTooltip.tsx / .css ← Botão "?" inline com balão flutuante explicativo (a11y/educacional, 2026-05)
│   │   ├── IOSList.tsx / .css    ← Lista estilo iOS Settings (ícone + título + trailing) — `titleAfter` aceita `<InfoTooltip>` (2026-05)
│   │   ├── LiveChart.tsx / .css  ← Sparkline ao vivo (RunningScreen, Bloco Motion 2026-05)
│   │   ├── PageHeader.tsx / .css ← Título grande no início do scroll — Bloco 5 TopBar
│   │   ├── PathRow.tsx / .css
│   │   ├── PullToRefreshIndicator.tsx / .css ← Pill flutuante do pull-to-refresh universal (2026-05)
│   │   ├── PwaUpdatePrompt.tsx / .css ← Banner "Nova versão disponível" do Service Worker (atualização ágil, 2026-05)
│   │   ├── TopBar.tsx / .css     ← Header glass-on-scroll universal — Bloco 5 TopBar (2026-05)
│   │   └── icons.tsx             ← Biblioteca centralizada de SVGs inline (inclui `ConnectionIcon` consumido em PathRow, HistoryScreen lista/detalhe e ResultScreen banner — Bug-fix 2026-05 rede móvel)
│   │
│   ├── hooks/                    ← React hooks (estado derivado, efeitos externos)
│   │   ├── useCountUp.ts         ← Animação count-up com easeOutCubic (Bloco Motion 2026-05)
│   │   ├── useDeviceInfo.ts      ← Device UA + cascata Capacitor APK → navigator.connection → fallback (Bug-fix 2026-05 — rede móvel/Wi-Fi) + ServerInfo
│   │   ├── usePullToRefresh.ts   ← Gesto pull-to-refresh universal (touch + pointer) com threshold/resistência (2026-05)
│   │   ├── useScrollHeader.ts    ← IntersectionObserver para glass effect + título do TopBar (Bloco 5)
│   │   ├── useSettings.ts        ← Settings persistidas em localStorage
│   │   └── useSpeedTest.ts       ← Orquestra runSpeedTest, expõe fase/progresso/resultado
│   │
│   ├── screens/                  ← Telas completas (1 arquivo .tsx + 1 .css por tela)
│   │   ├── StartScreen.tsx / .css
│   │   ├── RunningScreen.tsx / .css
│   │   ├── ResultScreen.tsx / .css       ← Inclui card unificado de Diagnóstico (2 estados) + section "Mais detalhes" com 3 rows clicáveis (Avançado / Modo Gamer / DNS) que abrem bottom sheets dedicados — refator drag-to-resize 2026-05
│   │   ├── HistoryScreen.tsx / .css
│   │   ├── ComparisonScreen.tsx / .css   ← lazy chunk (code split 2026-05)
│   │   ├── BeforeAfterScreen.tsx / .css  ← lazy chunk (code split 2026-05)
│   │   ├── RoomTestScreen.tsx / .css     ← lazy chunk (code split 2026-05)
│   │   ├── ExploreScreen.tsx / .css      ← Hub reduzido a 2 sections: Histórico + Ferramentas (refator 2026-05); lazy chunk (code split 2026-05)
│   │   └── OnboardingScreen.tsx / .css   ← Carousel de 3 cards exibido na primeira execução (gate via `linka.onboarding.done` em localStorage); lazy chunk (code split 2026-05)
│   │   # Telas removidas no refator de arquitetura 2026-05 (stubbed,
│   │   # pendentes de `git rm`):
│   │   # - DiagnosticScreen → card de Diagnóstico na ResultScreen
│   │   # - RecommendScreen  → fundido na lista [problema] → [ação]
│   │   # - GamerScreen      → accordion "Modo Gamer" na ResultScreen
│   │   # - DetailsScreen    → accordion "Avançado" na ResultScreen
│   │   # - DNSGuideScreen   → DNSGuideSheet (overlay)
│   │   # - DNSBenchmarkScreen → descontinuada
│   │
│   ├── utils/                    ← Funções puras / lógica de domínio (sem React) — específicas do PWA
│   │   ├── anatelColor.ts        ← anatelGrade() + anatelGradeColorVar/GlowVar; cores semânticas Anatel (Resolução 717/2019) p/ DL/UL na ResultScreen quando plano cadastrado (2026-05)
│   │   ├── anatelReport.ts       ← isAnatelComplaintEligible() + generateAnatelReport() — detecção de elegibilidade + PDF formal de denúncia Anatel (2026-05)
│   │   ├── historyTrends.ts      ← computeWeeklyTrend() / computeMonthlyTrend() / describeTrend() — comparação inteligente entre janelas do histórico (2026-05)
│   │   ├── appRefresh.ts         ← performAppRefresh() — orquestra pull-to-refresh: SW update OU reloadDeviceInfo + min duration 600ms (2026-05)
│   │   ├── classifier.ts         ← Classificação de qualidade + diagnóstico (legado, em coexistência com src/core)
│   │   ├── cloudflareSpeedTest.ts ← Primitivas HTTP: cfDownloadStream, cfPing, cfUploadChunk (Motor v2)
│   │   ├── connectionProfile.ts  ← Mapeamento ConnectionType → ConnectionProfile (Anatel)
│   │   ├── diagnosisItems.ts     ← buildDiagnosisItems(); lista compacta [problema] → [ação] no card de Diagnóstico (refator arquitetura 2026-05)
│   │   ├── dnsBenchmark.ts       ← runDNSBenchmark via DoH; loadLastDnsResult (sem caller após refator 2026-05; preservado para futuro reuso)
│   │   ├── dnsTiming.ts          ← getDnsLatencyMs (Resource Timing API) + classifyDnsLatency (Fase A DNS, 2026-05)
│   │   ├── dnsProbe.ts           ← probeDnsResolver via DoH whoami + identifyDnsProvider (Fase B DNS, 2026-05)
│   │   ├── downloadProbe.ts      ← Motor de download time-based com paralelismo progressivo (Motor v2)
│   │   ├── format.ts             ← formatMbps, formatMs, formatDate, formatDateIsoLike
│   │   ├── haptics.ts            ← triggerHaptic(); wrap sobre navigator.vibrate (Bloco 3 Polimento, 2026-05)
│   │   ├── history.ts            ← CRUD do histórico em localStorage
│   │   ├── latencyProbe.ts       ← runLatencyPhase (pings com remoção de outliers) + runPingLoop (Motor v2)
│   │   ├── pdfExport.ts          ← Geração de PDF (resultado + histórico)
│   │   ├── relativeTime.ts       ← formatRelativeTime() — "agora"/"há N min/h/d/sem" pt-BR (banner de contexto da ResultScreen, pacote premium 2026-05)
│   │   ├── serverRegistry.ts     ← ServerProvider interface + CloudflareProvider
│   │   ├── share.ts              ← buildShareText + shareResultText (texto de compartilhamento)
│   │   ├── shareCard.ts          ← generateShareCard(); PNG 1080×1080 via Canvas API (Bloco 3 Polimento, 2026-05 — refatorado para quadrado com headline + ISP)
│   │   ├── speedTestOrchestrator.ts ← runSpeedTestV2(); coordena latência+DL+UL com bufferbloat integrado
│   │   ├── combinedDiagnosis.ts  ← combineDiagnostics(); cruza SpeedTestResult + dados opcionais Wi-Fi/móvel → diagnóstico unificado
│   │   ├── uploadProbe.ts        ← Motor de upload time-based com XHR onprogress (Motor v2) + `runAdaptiveUploadProbe()` em rodadas progressivas para `mobile_broadband` (Bug-fix 2026-05 — uplink <2 Mbps)
│   │   └── packetLoss.ts         ← Bridge web → plugin Capacitor PacketLoss (Android UDP) com fallback `{ available: false }` no PWA web — 2026-05
│   │
│   └── core/                     ← Motor de decisão único (puro, sem React/DOM/localStorage)
│       ├── types.ts              ← Tipos do contrato do motor (UseCaseId, InterpretedResult, etc.)
│       ├── profiles.ts           ← Thresholds Anatel-aware por ConnectionProfile (fixa/móvel)
│       ├── copyDictionary.ts     ← Mapeamento copyKeys → string pt-BR + resolveCopy()
│       ├── interpret.ts          ← interpretSpeedTestResult() — entrada única do motor
│       ├── networkQualityClassifier.ts ← gradeFrom, classifyBufferbloatSeverity, buildDiagnostics (Motor v2)
│       ├── useCaseGrade.ts         ← Deriva grade A-F por use case (refactor visual ResultScreen, 2026-05)
│       └── index.ts              ← Reexporta o contrato público (usado pela Fase 7 / embed Flutter)
│
├── __tests__/                    ← Testes Vitest (ficam dentro de src/)
│   ├── anatelColor.test.ts       ← anatelGrade thresholds fixa/móvel + edge cases (2026-05)
│   ├── classifier.test.ts
│   ├── combinedDiagnosis.test.ts
│   ├── compare.test.ts
│   ├── connectionProfile.test.ts
│   ├── copyDictionary.test.ts
│   ├── dnsProbe.test.ts          ← identifyDnsProvider (Fase B DNS, 2026-05)
│   ├── dnsTiming.test.ts         ← classifyDnsLatency + dnsLatencyLabel (Fase A DNS, 2026-05)
│   ├── historyTrends.test.ts     ← computeWeeklyTrend / computeMonthlyTrend / describeTrend (2026-05)
│   ├── interpret.test.ts
│   ├── LocalWifiService.test.ts
│   ├── share.test.ts
│   ├── speedtest.test.ts         ← Helpers do orchestrator: computeRanges + mapProgress (Bloco Motion 2026-05)
│   ├── useCaseGrade.test.ts      ← gradeMetric + useCaseGrade por profile (refactor visual ResultScreen 2026-05)
│   ├── useCountUp.test.ts        ← Helpers puros do useCountUp (Bloco Motion 2026-05)
│   └── useScrollHeader.test.ts   ← Helpers puros do useScrollHeader (Bloco 5 TopBar 2026-05)
│
├── CLAUDE.md                     ← Instruções para Claude Code
├── capacitor.config.ts           ← Configuração Capacitor (appId, appName, webDir)
├── index.html                    ← HTML raiz; links Google Fonts; favicons
├── vite.config.ts                ← Vite + VitePWA + Vitest config
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js
└── package.json
```

---

## Regras de criação de arquivos

### Onde colocar o quê

| Tipo de arquivo | Pasta correta |
|---|---|
| Tipo TypeScript compartilhado | `src/types/index.ts` (adicionar ao arquivo existente) |
| Componente React reutilizável | `src/components/NomeComponente.tsx` + `.css` |
| Hook React | `src/hooks/useNomeHook.ts` |
| Tela completa | `src/screens/NomeTela.tsx` + `NomeTela.css` |
| Função pura / lógica do PWA (consumo de hooks/screens, depende de DOM/localStorage) | `src/utils/nomeUtil.ts` |
| Motor de decisão portável (sem React/DOM/localStorage, candidato a reuso no Flutter) | `src/core/nomeArquivo.ts` |
| Plugin Capacitor interno (Java) | `android/app/src/main/java/br/com/linka/speedtest/<dominio>/<NomePlugin>.java` (registrar em `MainActivity.onCreate`) |
| Asset público (imagens, ícones) | `public/` |
| Documentação | `docs/NomeDocumento.md` |
| Teste unitário | `src/__tests__/nomeUtil.test.ts` |
| Script operacional | `scripts/nome-script.ps1` |
| APK gerado para entrega manual | `builds/apk/` |

### `src/core/` vs `src/utils/`

- **`src/utils/`** continua sendo a casa de funções puras específicas do PWA — podem importar de `../types`, `../utils/*`, ou consumir APIs do navegador (localStorage em `history.ts`, Blob em `pdfExport.ts`, fetch em `serverRegistry.ts`).
- **`src/core/`** é a camada de decisão única. **Não importa de `react`, `react-dom`, `../components`, `../screens`, `../hooks`, e não usa `localStorage`, `document`, `window`.** Só importa de `../types` e de si mesmo. Isso garante que possa ser reusado sem mudanças no app linka Flutter (Fase 7 do plano de unificação).
- O motor (`interpret.ts`) coexiste com `classifier.ts` legado durante a migração. A Fase 1 introduz o motor; fases seguintes migram chamadores e, eventualmente, removem código duplicado.

### Proibições

- **Não criar** arquivos `.tsx` soltos na raiz de `src/` além de `main.tsx` e `App.tsx`.
- **Não criar** subpastas dentro de `components/`, `hooks/`, `utils/` — manter flat.
- **Não criar** estilos globais além de `tokens.css` (cada componente tem seu `.css`).
- **Não criar** arquivos de configuração de teste separados — tudo em `vite.config.ts`.
- **Não commitar** arquivos `.env` ou credenciais. Variáveis de ambiente vão em Cloudflare Pages dashboard.

### Naming conventions

- Componentes e telas: `PascalCase.tsx` (ex.: `PathRow.tsx`, `StartScreen.tsx`)
- Hooks: `camelCase` com prefixo `use` (ex.: `useDeviceInfo.ts`)
- Utils: `camelCase` descritivo (ex.: `classifier.ts`, `serverRegistry.ts`)
- CSS: mesmo nome do componente (ex.: `PathRow.css`)
- Testes: mesmo nome do utils + `.test.ts` (ex.: `classifier.test.ts`)
- IDs em interfaces/tipos: `camelCase` em pt-BR quando possível; contratos externos preservam nome original

### CSS e tokens

- Sempre usar `var(--token)` em vez de valores hardcoded.
- Tokens definidos em `tokens.css` — não duplicar em arquivos de componente.
- Exceção: constantes de cor em `pdfExport.ts` (contexto de geração de imagem, sem acesso a CSS vars).

---

## Dependências aprovadas

| Pacote | Versão | Uso |
|---|---|---|
| `react` / `react-dom` | ^19 | Framework UI |
| `recharts` | última | Gráficos do histórico |
| `jspdf` | última | Geração de PDF |
| `html2canvas` | última | Captura de DOM para PDF |
| `vite-plugin-pwa` | ^1.2 | Manifest + service worker |
| `@capacitor/core` / `@capacitor/android` | ^8 | Empacotamento Android nativo |
| `@capacitor/cli` | ^8 | CLI para sincronizar assets e projeto Android |

## Toolchain Android local

Para gerar APK sem instalar Android Studio/SDK em `C:`, o projeto usa `_android-toolchain/` local e ignorado pelo Git:

- `_android-toolchain/android-sdk/` — Android SDK Command-line Tools, Platform Tools, Platform 36 e Build Tools.
- `_android-toolchain/java/` — JDK 21 portátil usado pelo Gradle/Capacitor.
- `_android-toolchain/gradle-home/` — cache local do Gradle.
- `_android-toolchain/npm-cache/` — cache npm opcional para instalações relacionadas.

O APK debug sai em `android/app/build/outputs/apk/debug/app-debug.apk`.

## Regra obrigatória para APK

Toda IA ou humano que gerar APK neste projeto deve usar **somente**:

```powershell
npm run android:apk
```

É proibido entregar APK diretamente de `android/app/build/outputs/...`.

Regras inegociáveis:

- Todo APK final de entrega deve ficar em `builds/apk/`.
- Nunca sobrescrever APK existente.
- Todo APK deve conter no nome: `versionName`, `versionCode`, tipo de build, data/hora e hash Git.
- `versionName` vem de `package.json` e deve seguir SemVer (`MAJOR.MINOR.PATCH`).
- `versionCode` Android é calculado como `MAJOR*1000000 + MINOR*10000 + PATCH*100 + BuildNumber`.
- Para build de mercado/release, usar `-BuildType release -BuildNumber N`, com `N > 0`.
- Google Play publica AAB; APK é aceito aqui como artefato manual/interno. Se o destino for Play Store, gerar AAB em fluxo próprio.

**Antes de adicionar qualquer nova dependência:** perguntar ao usuário e documentar o motivo aqui.

---

## Assets em `public/`

Os ícones PNG (`icon-*.png`) são cópias dos ícones oficiais do app LINKA Flutter:
- Fonte: `D:\Projetos\LINKA\source\app\web\icons\`
- **Não editar** — sincronizar a partir da fonte sempre que o branding mudar.

O logo (`logo.png`) vem de `D:\Users\luizg\Downloads\linka_logo.png` — logo oficial da marca.

## Extensões autorizadas de estrutura

Para recursos isolados por domínio (sem acoplar em `screens`/`utils` existentes), está autorizado o uso de:

- `src/platform/` para capability e detecção de ambiente
- `src/features/<feature>/` para módulo completo da feature (tipos, serviço, hook, UI isolada)

### Estrutura adicionada — Diagnóstico Wi-Fi nativo

```txt
src/
├── platform/
│   └── capabilities.ts
├── features/
│   └── local-wifi/
│       ├── types.ts
│       ├── LocalWifiBridge.ts
│       ├── LocalWifiUnavailable.ts
│       ├── LocalWifiService.ts
│       ├── useLocalWifi.ts            ← hook on-demand (LocalWifiScreen)
│       ├── useWifiDiagnostics.ts      ← hook auto-fetch (card embutido) — 2026-05
│       ├── wifiSignal.ts              ← helpers rssiToPercent/signalQualityColor — 2026-05
│       ├── WifiSignalCard.tsx         ← @deprecated 2026-05 — substituído por WifiSignalSection/Bar; mantido sem usuários
│       ├── WifiSignalCard.css         ← estilo do card legado — 2026-05
│       ├── WifiSignalBar.tsx          ← barra horizontal de qualidade (substituiu o card 4 cells) — 2026-05
│       ├── WifiSignalBar.css          ← estilo da barra — 2026-05
│       ├── WifiSignalSection.tsx      ← orquestrador na ResultScreen (loading/permission/unavailable/bar) — 2026-05
│       ├── WifiSignalSection.css      ← estados não-disponíveis da seção — 2026-05
│       ├── WifiDetailsSheet.tsx      ← bottom sheet "premium" — refator 2026-05
│       ├── WifiDetailsSheet.css      ← estilo do sheet de detalhes — refator 2026-05
│       ├── WifiOptimizeSheet.tsx     ← tutorial de otimização (3 categorias) — 2026-05
│       ├── WifiOptimizeSheet.css     ← estilo do tutorial — 2026-05
│       ├── ChannelQualityChart.tsx   ← chart de canais reaproveitado pelo sheet — 2026-05
│       ├── ChannelQualityChart.css   ← estilo do chart de canais — 2026-05
│       ├── LocalWifiScreen.tsx
│       └── LocalWifiScreen.css
└── __tests__/
    ├── LocalWifiService.test.ts
    └── wifiSignal.test.ts             ← cobre rssiToPercent + signalQualityColor — 2026-05
```

### Estrutura adicionada — Feature DNS (refator arquitetura 2026-05)

```txt
src/
└── features/
    └── dns/
        ├── DNSGuideSheet.tsx       ← Bottom sheet com guia DNS por plataforma
        └── DNSGuideSheet.css       ← Estilo do sheet (substitui DNSGuideScreen.css)
```

A pasta nasceu para abrigar o `DNSGuideSheet`, criado quando a `DNSGuideScreen` (rota dedicada) foi descontinuada — agora o guia é overlay acionado pela row "DNS" da section "Mais detalhes" da ResultScreen.

No refator drag-to-resize 2026-05, o `DNSGuideSheet` passou a usar o `DraggableSheet` como base (mesmo padrão do `WifiDetailsSheet` e `WifiOptimizeSheet`).

### Estrutura adicionada — Feature Result Detail (refator drag-to-resize 2026-05)

```txt
src/
└── features/
    └── result-detail/
        ├── AdvancedSheet.tsx       ← Bottom sheet "Avançado" — métricas + sobre o teste + histórico
        ├── AdvancedSheet.css       ← Estilo do sheet
        ├── GamerSheet.tsx          ← Bottom sheet "Modo Gamer" — stats + lista de jogos por categoria
        └── GamerSheet.css          ← Estilo do sheet
```

A pasta nasceu para abrigar as sheets que substituíram os 3 accordions inline da section "Mais detalhes" da ResultScreen. Cada row da section abre uma sheet dedicada montada sobre `DraggableSheet`. O `DNSGuideSheet` permanece em `features/dns/` (já existia).
