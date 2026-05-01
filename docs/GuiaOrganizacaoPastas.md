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
│   ├── EvolucaoSpeedTest.md      ← Roadmap e features futuras do produto
│   ├── EvolucaoTelaDesktop.md    ← Design de telas desktop (prototipagem aprovada)
│   ├── PendenciasLayout.md       ← Backlog de melhorias de layout e UX
│   ├── PendenciasTecnicas.md     ← Backlog técnico: diagnóstico, classificador, coerência
│   └── RecomendacaoEquipamentos.md ← Plano de monetização: recomendação de equipamentos
│
├── public/                       ← Assets estáticos (copiados verbatim para dist/)
│   ├── logo.png                  ← Logo oficial linka (fonte: D:\Projetos\LINKA\...)
│   ├── icon-192.png              ← PWA icon any
│   ├── icon-512.png              ← PWA icon any
│   ├── icon-maskable-192.png     ← PWA icon maskable
│   └── icon-maskable-512.png     ← PWA icon maskable
│
├── src/
│   ├── main.tsx                  ← Entry point; imports tokens.css
│   ├── App.tsx                   ← Root component; estado global; roteamento por switch
│   ├── tokens.css                ← CSS Custom Properties: temas, espaçamento, tipografia
│   │
│   ├── types/
│   │   └── index.ts              ← Todos os tipos TypeScript compartilhados
│   │
│   ├── components/               ← Componentes reutilizáveis (sem estado de negócio)
│   │   ├── BottomSheet.tsx / .css
│   │   ├── Chip.tsx / .css       ← Badge/chip com variantes semânticas (good/maybe/bad/accent/neutral)
│   │   ├── Gauge.tsx / .css      ← Anel SVG com fase + número hero + unidade
│   │   ├── Header.tsx / .css
│   │   ├── InfoCards.tsx / .css  ← Mantido mas desativado (substituído pelo BottomSheet)
│   │   ├── IOSList.tsx / .css    ← Lista estilo iOS Settings (ícone + título + trailing)
│   │   ├── LiveChart.tsx
│   │   ├── PathRow.tsx / .css
│   │   └── icons.tsx             ← Biblioteca centralizada de SVGs inline
│   │
│   ├── hooks/                    ← React hooks (estado derivado, efeitos externos)
│   │   ├── useDeviceInfo.ts      ← Device UA + navigator.connection + ServerInfo
│   │   ├── useSettings.ts        ← Settings persistidas em localStorage
│   │   └── useSpeedTest.ts       ← Orquestra runSpeedTest, expõe fase/progresso/resultado
│   │
│   ├── screens/                  ← Telas completas (1 arquivo .tsx + 1 .css por tela)
│   │   ├── StartScreen.tsx / .css
│   │   ├── RunningScreen.tsx / .css
│   │   ├── ResultScreen.tsx / .css
│   │   ├── HistoryScreen.tsx / .css
│   │   ├── ComparisonScreen.tsx / .css
│   │   ├── BeforeAfterScreen.tsx / .css
│   │   ├── RoomTestScreen.tsx / .css
│   │   ├── DiagnosticScreen.tsx / .css  ← Diagnóstico de 6 áreas em grid 2-col
│   │   ├── GamerScreen.tsx / .css       ← Avaliação de jogos: ping/jitter/loss + rows por game
│   │   ├── RecommendScreen.tsx / .css   ← 4 ações para melhorar o Wi-Fi
│   │   ├── DNSGuideScreen.tsx / .css    ← Guia de configuração de DNS no dispositivo
│   │   └── DNSBenchmarkScreen.tsx / .css ← Verificação on-demand de servidores DNS (feature Explorar)
│   │
│   ├── utils/                    ← Funções puras / lógica de domínio (sem React) — específicas do PWA
│   │   ├── classifier.ts         ← Classificação de qualidade + diagnóstico (legado, em coexistência com src/core)
│   │   ├── cloudflareSpeedTest.ts ← Primitivas HTTP: cfDownloadStream, cfPing, cfUploadChunk (Motor v2)
│   │   ├── connectionProfile.ts  ← Mapeamento ConnectionType → ConnectionProfile (Anatel)
│   │   ├── dnsBenchmark.ts       ← runDNSBenchmark via DoH; loadLastDnsResult
│   │   ├── downloadProbe.ts      ← Motor de download time-based com paralelismo progressivo (Motor v2)
│   │   ├── format.ts             ← formatMbps, formatMs, formatDate, formatDateIsoLike
│   │   ├── history.ts            ← CRUD do histórico em localStorage
│   │   ├── latencyProbe.ts       ← runLatencyPhase (pings com remoção de outliers) + runPingLoop (Motor v2)
│   │   ├── pdfExport.ts          ← Geração de PDF (resultado + histórico)
│   │   ├── serverRegistry.ts     ← ServerProvider interface + CloudflareProvider
│   │   ├── share.ts              ← buildShareText + shareResultText (texto de compartilhamento)
│   │   ├── speedTestOrchestrator.ts ← runSpeedTestV2(); coordena latência+DL+UL com bufferbloat integrado
│   │   └── uploadProbe.ts        ← Motor de upload time-based com XHR onprogress (Motor v2)
│   │
│   └── core/                     ← Motor de decisão único (puro, sem React/DOM/localStorage)
│       ├── types.ts              ← Tipos do contrato do motor (UseCaseId, InterpretedResult, etc.)
│       ├── profiles.ts           ← Thresholds Anatel-aware por ConnectionProfile (fixa/móvel)
│       ├── copyDictionary.ts     ← Mapeamento copyKeys → string pt-BR + resolveCopy()
│       ├── interpret.ts          ← interpretSpeedTestResult() — entrada única do motor
│       ├── networkQualityClassifier.ts ← gradeFrom, classifyBufferbloatSeverity, buildDiagnostics (Motor v2)
│       └── index.ts              ← Reexporta o contrato público (usado pela Fase 7 / embed Flutter)
│
├── __tests__/                    ← Testes Vitest (ficam dentro de src/)
│   ├── classifier.test.ts
│   ├── connectionProfile.test.ts
│   ├── interpret.test.ts
│   └── share.test.ts
│
├── CLAUDE.md                     ← Instruções para Claude Code
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
| Asset público (imagens, ícones) | `public/` |
| Documentação | `docs/NomeDocumento.md` |
| Teste unitário | `src/__tests__/nomeUtil.test.ts` |

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
| `recharts` | última | Gráficos (LiveChart, HistoryScreen) |
| `jspdf` | última | Geração de PDF |
| `html2canvas` | última | Captura de DOM para PDF |
| `vite-plugin-pwa` | ^1.2 | Manifest + service worker |

**Antes de adicionar qualquer nova dependência:** perguntar ao usuário e documentar o motivo aqui.

---

## Assets em `public/`

Os ícones PNG (`icon-*.png`) são cópias dos ícones oficiais do app LINKA Flutter:
- Fonte: `D:\Projetos\LINKA\source\app\web\icons\`
- **Não editar** — sincronizar a partir da fonte sempre que o branding mudar.

O logo (`logo.png`) vem de `D:\Users\luizg\Downloads\linka_logo.png` — logo oficial da marca.
