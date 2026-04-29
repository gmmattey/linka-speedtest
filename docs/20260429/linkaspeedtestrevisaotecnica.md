# Revisão técnica — linka SpeedTest

Análise feita sobre o repositório local `D:\Projetos\linka SpeedTest` (não o do GitHub). Confronto ponto a ponto da análise externa do ChatGPT, achados próprios e plano em fases.

---

## 1. Inventário do código real

Os arquivos relevantes existem todos, com nomes ligeiramente diferentes do esperado. Eles vivem em `src/utils/` (não `src/lib/`).

| Função | Arquivo |
|---|---|
| `classify`, `stability`, `buildDiagnosis`, `buildShortPhrase`, `qualityHeadline`, `tagLabel` | `src/utils/classifier.ts` |
| Grid "Para o que sua internet serve?" + `USE_CASES[]` | `src/screens/ResultScreen.tsx:41-75` |
| `buildRecommendations` | `src/utils/recommendations.ts` |
| `calculateComparison` | `src/utils/comparison.ts` |
| Histórico + `appendRecord` + `loadHistory` | `src/utils/history.ts` |
| Insights do histórico (`buildHistoryInsights`) | `src/utils/historyInsights.ts` |
| `useDeviceInfo` | `src/hooks/useDeviceInfo.ts` |
| `runSpeedTest` | `src/utils/speedtest.ts` |
| `useSettings` | `src/hooks/useSettings.ts` |
| Tema default + roteador de telas | `src/App.tsx` |
| Tipos compartilhados | `src/types/index.ts` |
| Testes existentes | `src/__tests__/classifier.test.ts`, `src/__tests__/share.test.ts` |

Documentação do projeto: `docs/IndiceDocumentacao.md`, `DocumentacaoFuncional/Tecnica`, etc. **Não há nenhum documento de premissas Anatel nem contrato com o app Flutter** — esse é um dos primeiros gaps.

---

## 2. Validação ponto a ponto da análise externa

### 1. fair → "Conexão estável" sem checar jitter — ✅ Confirmado
`src/utils/classifier.ts:25-29` define `fair` exigindo apenas `dl≥10`, `ul≥3`, `latency≤100`, `packetLoss≤2`. **Jitter não entra**. E em `qualityHeadline()` linha 43:

```ts
case 'fair': return 'Conexão estável';
```

Resultado: jitter de 49 ms vira "Conexão estável" sem nenhuma ressalva. Headline contraditória já no léxico (estável = oposto de jittery).

### 2. `stability()` ignora latência — ✅ Confirmado
`src/utils/classifier.ts:63-67`:

```ts
const jitterScore = 100 - clamp((r.jitter / 50) * 100, 0, 100);
const lossScore   = 100 - clamp((r.packetLoss / 2) * 100, 0, 100);
return Math.round(0.6 * jitterScore + 0.4 * lossScore);
```

Latência absoluta zero peso. `latency=300ms, jitter=2ms, loss=0%` → score 100 → "Muito estável". Tecnicamente correto na definição estrita de jitter, mas no uso ao usuário é confuso.

### 3. Grid de uso ignora jitter/perda em alguns casos — 🟡 Parcial
`src/screens/ResultScreen.tsx:41-75` — cada `evaluate` é uma regra própria:
- **Streaming 4K** olha só `dl` (linhas 53-57). Jitter/perda zerados.
- **Home Office** olha `dl`, `ul`, `latency` — não vê jitter/perda (linhas 60-65).
- **Games** vê `dl`, `latency`, `jitter`, `packetLoss` (linhas 45-49) — completo.
- **Videochamada** vê `dl`, `ul`, `latency`, `jitter` — não vê packetLoss (linhas 68-73).

Confirmado que cada caso usa subset diferente, e os thresholds **não conversam com `classify()`**. Streaming 4K com `dl=30` e `loss=8%` aparece "Bom" — incoerente. Home Office com `loss=5%` idem.

### 4. "Pode falhar" como label agressivo — ✅ Confirmado
`src/screens/ResultScreen.tsx:43-44`:

```ts
labelMap: { limited: 'Pode falhar' },
```

Apenas Games tem essa label-override; outros casos `limited` mostram "Ruim" (`STATUS_LABEL` linha 78). É inconsistente: mesma severidade, copy diferente, e "Pode falhar" soa pior que "Ruim" em cenário moderado.

### 5. `buildRecommendations()` não enxerga alertas do grid de uso — ✅ Confirmado
`src/utils/recommendations.ts:21-25` — assinatura recebe `_result, c, recentHistory`. Não recebe nem o resultado do grid, nem a função `evaluate`. As tags vêm de `classify()` em `classifier.ts:6-10`, com thresholds **diferentes** do grid:

- Games "limited" exige `jitter>40 || loss>2 || latency>80 || dl<5`
- Tag `unstable` só dispara em `jitter>50`
- Tag `highLatency` só em `latency>80`

Resultado: Games pode mostrar "Pode falhar" sem que `buildRecommendations` gere qualquer recomendação relacionada. Sintoma direto da fragmentação de motor.

### 6. `buildDiagnosis()` duplica avisos — 🟡 Parcial
Não há "frase normal + frase com ⚠" como descrito (não vi caractere ⚠ em texto do diagnóstico). `buildDiagnosis()` produz lista coerente: 1 frase de qualidade + 1 de estabilidade + 1 de latência + 1 de upload + frases históricas. **Mas duplicação real existe entre módulos**: `ResultScreen` mostra `shortPhrase` (1 linha) + `recommendations` (até 3 itens) + grid (4 chips) — todos podem mencionar o mesmo problema. Em `HistoryScreen.tsx:99-117` o diagnóstico de 24h convive com `historyInsights` (`historyInsights.ts:55-76` "Resposta alta nos testes recentes" se sobrepõe a `buildDiagnosis` linha 122-124 "Nos últimos testes a resposta continua alta"). É overlap entre arquivos, não dentro do mesmo `buildDiagnosis`. Análise externa identificou o cheiro certo, no lugar errado.

### 7. Termos técnicos vazando — ✅ Confirmado
- `src/screens/ResultScreen.tsx:243` `<dt>Perda de pacotes</dt>`
- `src/screens/HistoryScreen.tsx:276` idem
- `src/screens/ResultScreen.tsx:199` rótulo "Oscilação"
- `src/utils/classifier.ts:53` `tagLabel('unstable') = 'Oscilação alta'`
- `src/utils/classifier.ts:54` `tagLabel('packetLoss') = 'Perda de sinal'` — atenção: "Perda de pacotes" no detalhe e "Perda de sinal" no chip são o **mesmo conceito com nomes diferentes**. Pior que vazar técnico — vaza inconsistente.

### 8. iOS assume "mobile" contrariando README — 🔄 Já corrigido (alinhado)
`src/hooks/useDeviceInfo.ts:27-31` realmente assume `'mobile'` sem `navigator.connection`. **Mas isso está documentado e justificado** nos comentários (linhas 27-29) e em `docs/DocumentacaoFuncionalSistema.md:598` e `docs/IndiceDocumentacao.md:48`. O `README` referido pela análise externa não existe ou é antigo — a versão local descreve esse fallback como feature. Há override manual em Configurações. A análise estava errada **agora**. Continua válido como decisão a manter explicitamente registrada.

### 9. `calculateComparison()` ignora upload, jitter e perda — ✅ Confirmado
`src/utils/comparison.ts:13-14`:

```ts
const nearGood = near.dl >= 10 && near.latency <= 100;
const farGood  = far.dl  >= 10 && far.latency <= 150;
```

A função **calcula** `uploadDropPercent` e `latencyIncreasePercent` (linhas 8-11) mas o motor de decisão (`hasStrongDrop`, `nearGood`, `farGood`) só usa download e latência. Cliente em casa com upload caindo de 50→2 Mbps no fundo da casa: cai no branch `'other'` ("variaram entre os dois locais") em vez de `coverage_issue`.

### 10. Histórico salva mas detalhe recalcula — ✅ Confirmado
`src/utils/history.ts:30-46` salva `quality` e `tags` no momento. **Mas** `src/screens/HistoryScreen.tsx:209-215` faz:

```ts
const c = useMemo(() => classify({...record}), [record]);
const stab = useMemo(() => stability({...record}), [record]);
```

Detalhe ignora `record.quality` e `record.tags` salvos. Se você muda thresholds de `classify`, lista mostra chip antigo e detalhe mostra interpretação nova. Pior: linha 170 do `HistoryScreen.tsx` usa `r.quality` na cor do chip. Lista e detalhe **divergem por construção**.

### 11. Média do histórico esconde instabilidade — ✅ Confirmado
`src/screens/HistoryScreen.tsx:46-56` calcula média aritmética simples de `dl, ul, latency, jitter, packetLoss` e roda `classify()` no resultado. Cliente com 5 testes alternando `excellent` (jitter 2) e `slow` (jitter 80, loss 8%) → médias de jitter ~41, loss ~4 → `slow` por loss>2 — neste caso até pegou. Mas o teste E do `classifier.test.ts` mostra que medianas suaves passam por "good" mesmo com testes individuais ruins. `historyInsights` (`historyInsights.ts:21`) tenta cobrir isso parcialmente, mas o card de "Média dos seus testes" segue vendendo a falsa boa notícia.

### 12. App.tsx default tema dark — ✅ Confirmado
`src/App.tsx:25` `return 'dark'`. Análise externa correta. Decisão de produto: a direção visual atual prefere claro? Se sim, mudar default é trivial.

### 13. Progresso com marcos artificiais por fase — ✅ Confirmado
`src/utils/speedtest.ts:42-48`:

```ts
const PHASE_RANGES = {
  latency:  [0.0, 0.15],
  download: [0.15, 0.70],
  upload:   [0.70, 1.0],
};
```

Latência sempre vale 15% mesmo com 8 amostras (quick) ou 20 (default/mobile). Download fixo em 55%. Saltos visíveis na transição entre fases — usuário vê progresso "estagnar" no fim de cada fase e "pular" ao iniciar a próxima.

### 14. `useSettings` expõe `scale` sem uso — ✅ Confirmado
`src/hooks/useSettings.ts:5` declara `scale: 'linear' | 'log'`. `LiveChart.tsx:6-9` aceita prop `scale`. **Mas `LiveChart` não é importado em lugar nenhum** (busca em `src/` não retorna usos além da definição). O `RunningScreen` não consome a setting. Código morto — remover a setting ou ressuscitar o componente.

---

## 3. Achados próprios (além dos 14)

**A. Acoplamento React × decisão.** O grid de uso (`USE_CASES`) é um array de objetos com `Icon: React.ComponentType` **dentro do arquivo de tela**. As regras `evaluate(r)` são puras, mas estão grudadas em JSX e ícones. Para portar para o Flutter, você quer essas regras em `utils/` sem importar nada de `react` ou `components/icons`. Hoje, `recommendations.ts`, `classifier.ts`, `comparison.ts`, `historyInsights.ts` são puros — o grid é a única regra que vive dentro de uma tela.

**B. Anatel fixa vs. móvel não existe no motor.** `ConnectionType: 'wifi' | 'mobile' | 'cable'` já existe (`types/index.ts:4`) e é passado para `runSpeedTest` para escolher preset de payload (`speedtest.ts:37-40`). **Mas nem `classify`, `recommendations`, `comparison` nem `historyInsights` recebem esse parâmetro**. Os mesmos thresholds aplicam para fixa de 500 Mbps e 4G de 30 Mbps — o que infla `slow` em redes móveis e causa "Pode falhar" injusto. Falta um perfil que entre em todas as funções de decisão.

**C. Múltiplos pontos de tradução número→texto.** Identificados:
1. `classifier.ts/qualityHeadline` — headline curta
2. `classifier.ts/tagLabel` — chip
3. `classifier.ts/buildDiagnosis` — frase longa
4. `classifier.ts/buildShortPhrase` — 1 linha
5. `classifier.ts/stabilityLabel` — rótulo de estabilidade
6. `recommendations.ts` — strings de 3 cards
7. `ResultScreen.tsx/USE_CASES + STATUS_LABEL + labelMap` — chip do grid
8. `comparison.ts/message` — frase do diagnóstico A vs B
9. `historyInsights.ts` — strings dos cards de histórico

São **9 lugares** que interpretam os mesmos números com regras próprias e copy próprio. A diretriz "um único motor" exige unificar pelo menos 1, 2, 3, 4, 5 e 7.

**D. Persistência sem versionamento.** `history.ts` salva em `KEY = 'linka.speedtest.history.v1'` — versão na chave (bom), mas dentro de cada `TestRecord` **não há `ruleVersion`** (linha 31-46). Quando você mudar `classify`, registros antigos terão tags de regra antiga sem como diferenciar.

**E. Testes cobrem só o classifier.** `src/__tests__/classifier.test.ts` (228 linhas, decente) e `share.test.ts`. **Zero testes** para `recommendations`, `comparison`, `historyInsights`, ou para o grid de `USE_CASES`. Refatorar sem teste de regressão é apostar.

**F. Internacionalização: zero.** Strings hardcoded em pt-BR espalhadas por screens, classifier, comparison, recommendations, historyInsights. Para embed Flutter você provavelmente vai querer entregar IDs + payload de dados, não texto pronto, ou aceitar uma camada de tradução injetada. Hoje não há separação.

**G. Telemetria/analytics: ausente.** Não vi nenhum `track()`, `gtag`, `analytics` no código. Bom para PWA standalone, mas se a versão Flutter quiser instrumentar, precisa de hook explícito.

**H. Recharts pesado.** `HistoryScreen` importa `recharts` para renderizar 10 pontos. Bundle grande para tela usada raramente. Não é o foco da revisão, mas registro.

**I. `pdfExport` usa `html2canvas` em DOM oculto.** Funciona no PWA, mas no Flutter via WebView precisa de outro caminho. Considerar essa integração no contrato.

**J. `comparisonModeRef` em `App.tsx:37` é gambiarra.** Estado de fluxo "near/far" via `useRef` em vez de máquina de estado explícita. Funciona, mas é frágil — `recordedRef.current = false` em pelo menos 4 lugares (linhas 129, 142, 156, 163) é red flag de máquina de estado escondida.

---

## 4. Proposta do contrato `interpretSpeedTestResult`

Assinatura puramente de dados — zero React, zero DOM. Vive em `src/core/interpret.ts` (nova pasta `core/` para o motor compartilhável; `utils/` continua para utilidades específicas do PWA).

```ts
// src/core/types.ts (subset; pode reusar o atual e estender)
export type ConnectionProfile = 'fixed_broadband' | 'mobile_broadband';
export type UseCaseId = 'gaming' | 'streaming_4k' | 'home_office' | 'video_call';
export type UseCaseStatus = 'good' | 'maybe' | 'limited';

export interface InterpretInput {
  metrics: SpeedTestResult;
  profile: ConnectionProfile;          // Anatel: regras diferentes
  history?: TestRecord[];               // últimos 5-10, opcional
  ruleSetVersion?: string;              // default: versão atual do motor
}

export interface UseCaseVerdict {
  id: UseCaseId;
  status: UseCaseStatus;
  blockingFactors: Array<'dl' | 'ul' | 'latency' | 'jitter' | 'packetLoss'>;
}

export interface InterpretedResult {
  ruleSetVersion: string;               // gravado no histórico
  quality: Quality;                     // primary
  flags: {
    highLatency: boolean;
    lowUpload: boolean;
    unstable: boolean;
    packetLoss: boolean;
    veryUnstable: boolean;
  };
  stability: { score: number; level: 'very_stable' | 'stable' | 'oscillating' | 'unstable' };
  useCases: UseCaseVerdict[];           // verdict deriva das mesmas flags
  recommendations: Array<{
    id: string;
    priority: 'low' | 'medium' | 'high';
    actionType: RecommendationAction;
    triggeredBy: Array<keyof InterpretedResult['flags'] | 'history' | 'useCase'>;
  }>;
  copyKeys: {
    headlineKey: string;                // ex.: 'quality.fair'
    shortPhraseKey: string;             // 'shortPhrase.good_games_latency'
    diagnosisKeys: string[];            // ['diag.lowUpload', 'diag.history.recurringLatency']
  };
}
```

**Princípios do contrato:**
1. Núcleo retorna **chaves de copy** (`copyKeys`), não texto. Camada de PWA traduz via dicionário pt-BR. Camada Flutter traduz via dicionário próprio. Resolve achado F.
2. `recommendations[].triggeredBy` referencia as **mesmas flags** que o grid usa — fim do problema 5.
3. `useCases` vai junto no payload — fim da inconsistência 3 e 4.
4. `ruleSetVersion` propagado para `appendRecord` e gravado em `TestRecord` — resolve D.
5. `profile` obrigatório no input — resolve B.

**Call sites que passariam a consumir** (path, função atual):

- `src/screens/ResultScreen.tsx` (`ResultScreen` body, linhas 117-139) — substitui chamadas a `classify`, `stability`, `buildShortPhrase`, `buildRecommendations` e o map de `USE_CASES.evaluate`.
- `src/screens/HistoryScreen.tsx` linha 54 (`summary`), linha 60-77 (`diagnosis`), linha 209-216 (`HistoryDetail`) — todos viram uma única chamada por record (ou pela média).
- `src/screens/ComparisonScreen.tsx` — duas chamadas (near/far) + uma comparação que pode ficar em `core/compareInterpreted.ts`, recebendo dois `InterpretedResult`.
- `src/utils/historyInsights.ts` — pode passar a receber `InterpretedResult[]` em vez de `TestRecord[]`, ou continuar separado focando só em tendências.

---

## 5. Plano em fases

Cada fase é entregável em PR separado, mantém build/tipos verdes, não toca layout salvo onde explicitado, e tem critério de pronto verificável.

### Fase 0 — Fundação: perfil e versionamento (preparação invisível)

- **Objetivo de produto:** preparar terreno para que decisões respeitem fixa vs. móvel, sem mudar nada do que o usuário vê.
- **Arquivos:** `src/types/index.ts` (adicionar `ConnectionProfile`, `RuleSetVersion`), `src/utils/history.ts` (gravar `ruleSetVersion` em `TestRecord`), `src/utils/classifier.ts` (constante `RULE_SET_VERSION = 'v1'`).
- **Risco de quebrar layout:** zero. Só tipos e persistência aditiva. Records antigos ficam sem `ruleSetVersion` (campo opcional).
- **Critério de pronto:** `npm test` passa, build limpa, novo registro grava `ruleSetVersion`. Lista de histórico continua igual.
- **Dependência:** nenhuma.
- **Ganho percebido:** zero hoje; viabiliza tudo.

### Fase 1 — Motor unificado coexistindo com o legado (feature-flag)

- **Objetivo de produto:** introduzir `interpretSpeedTestResult` como fonte única, mas mantendo o caminho atual ativo. Um flag de dev permite alternar e validar paridade lado a lado.
- **Arquivos novos:** `src/core/interpret.ts` (motor), `src/core/copyDictionary.ts` (mapa pt-BR de `copyKeys`), `src/core/profiles.ts` (thresholds Anatel fixa vs. móvel).
- **Arquivos tocados:** `src/utils/classifier.ts` (não deletar; expor como adapter `classifyLegacy()`), nada de UI.
- **Risco:** zero (código novo paralelo). Adicionar testes em `src/__tests__/interpret.test.ts` cobrindo a matriz já testada no `classifier.test.ts` mais casos fixa vs. móvel.
- **Critério de pronto:** todos os testes do `classifier.test.ts` passam ao serem reescritos contra `interpretSpeedTestResult` (ou rodam ambos). Diff entre legado e novo < 5% na matriz A-E para perfil `fixed`.
- **Dependência:** Fase 0.
- **Ganho percebido:** zero hoje.

### Fase 2 — ResultScreen consome o motor unificado (sem mexer no JSX)

- **Objetivo de produto:** o usuário deixa de ver "Conexão estável" + "Pode falhar" + "Bom" simultaneamente para o mesmo cenário. Decisão única, copy coerente.
- **Arquivos:** `src/screens/ResultScreen.tsx` linhas 117-139 — substituir `classify`, `stability`, `buildShortPhrase`, `buildRecommendations` e a evaluation do grid por **uma única chamada** a `interpretSpeedTestResult`. JSX preservado: o map `USE_CASES.map(...)` recebe `useCaseResults` agora vindo do motor; estrutura visual idêntica.
- **Risco:** médio. O texto de cada chip e cada frase pode mudar. Mitigação: dicionário mantém os textos atuais (literalmente os mesmos) para chave correspondente; só a **fonte de decisão** muda. UI não regride.
- **Critério de pronto:** snapshot de 6 cenários (matriz A-E + um móvel) renderiza textos idênticos ou intencionalmente melhorados. Bug do "Conexão estável" + "Pode falhar" para Games eliminado em pelo menos 1 cenário documentado.
- **Dependência:** Fase 1.
- **Ganho percebido:** alto — fim das contradições visíveis na tela principal.

### Fase 3 — HistoryScreen (lista, detalhe, média) consome o motor

- **Objetivo de produto:** lista, detalhe e média não divergem mais. Histórico exibe a interpretação de quando o teste foi feito (`ruleSetVersion` salvo), não recalcula em runtime.
- **Arquivos:** `src/screens/HistoryScreen.tsx` linhas 46-77 e 209-216 — `HistoryDetail` lê `record.quality`/`record.tags` salvos via interpret, não recalcula. Média do card de "Média dos seus testes" passa a usar uma função `interpretAverage` que olha **dispersão**, não só a média (achado 11). Pode reusar percentis em vez de média.
- **Risco:** baixo no layout, médio na semântica do card de média. Mitigação: card mostra percentis 25/75 ou flag "instável" quando variância alta — ainda na mesma posição visual, mesmo tamanho.
- **Critério de pronto:** registro com 5 testes alternando excelente/horrível mostra rótulo de instabilidade no card, não "boa". Detalhe de record antigo mostra os tags/quality de então, não os recalculados.
- **Dependência:** Fase 1.
- **Ganho percebido:** alto para usuário que olha histórico.

### Fase 4 — Comparação A vs B com mais sinais

- **Objetivo de produto:** quando upload despenca de um cômodo para outro, o app diz "cobertura Wi-Fi" — não "Os resultados variaram".
- **Arquivos:** `src/utils/comparison.ts` — receber dois `InterpretedResult` (de Fase 1) em vez de dois `SpeedTestResult` crus, e considerar drop em upload, jitter e perda. Ou mover para `src/core/compareInterpreted.ts`.
- **Arquivos tocados na UI:** `src/screens/ComparisonScreen.tsx` (chamada).
- **Risco:** baixo no layout. Mensagem fica no mesmo card.
- **Critério de pronto:** novo teste em `src/__tests__/compare.test.ts` cobrindo: upload despencando 80% com download estável → `coverage_issue`. Hoje cai em `'other'`.
- **Dependência:** Fase 1.
- **Ganho percebido:** médio — usuários poucos usam Comparar locais hoje, mas a feature passa a entregar diagnóstico real.

### Fase 5 — Polimento de copy e remoção de termos técnicos

- **Objetivo de produto:** "Perda de pacotes" some da UI. "Oscilação" e "Resposta" repensados como labels amigáveis. "Pode falhar" calibrado.
- **Arquivos:** `src/core/copyDictionary.ts` (única fonte de copy), `src/screens/ResultScreen.tsx:243`, `src/screens/HistoryScreen.tsx:276`. Eliminar redundância entre `tagLabel('packetLoss')='Perda de sinal'` e `<dt>Perda de pacotes</dt>`.
- **Risco:** baixo. Trocas de string em pontos isolados.
- **Critério de pronto:** grep por `Perda de pacotes`, `Jitter`, `pacotes` na pasta `src/screens/` retorna zero. Card de detalhes do PDF pode manter termo técnico — decidir explicitamente.
- **Dependência:** Fase 2.
- **Ganho percebido:** alto em percepção de clareza.

### Fase 6 — Remoção do legado e dead code

- **Objetivo de produto:** menos código para manter. Tema, settings e componentes que não fazem nada saem.
- **Arquivos:** `src/utils/classifier.ts` — remover `qualityHeadline`, `tagLabel`, `stabilityLabel`, `buildShortPhrase`, `buildDiagnosis` (ficam no motor) ou marcar deprecated. `src/hooks/useSettings.ts` linha 5: remover `scale` ou ressuscitar o uso (decisão do produto). `src/components/LiveChart.tsx`: usar de fato em `RunningScreen` ou deletar. `src/App.tsx:25`: decidir tema default. `src/utils/speedtest.ts:42-48`: substituir `PHASE_RANGES` fixos por progresso ponderado pelo tempo real estimado de cada fase (resolve achado 13).
- **Risco:** médio se mexer em progresso. Mitigação: feature-flag para o cálculo novo.
- **Critério de pronto:** classifier.ts < 50 linhas, sem código não usado. `npm run build` sem warnings de import dead.
- **Dependência:** Fases 2-5.
- **Ganho percebido:** zero direto, mas saúde do projeto.

### Fase 7 — Contrato de embed Flutter

- **Objetivo de produto:** linka Flutter consome o motor sem precisar do PWA inteiro. Frontend Flutter renderiza com seus próprios componentes.
- **Arquivos novos:** `src/core/index.ts` (export público explícito), `src/core/embed.ts` com:
  - `runHeadlessTest(profile, mode, onProgress): Promise<InterpretedResult>` — combina `runSpeedTest` + `interpretSpeedTestResult`.
  - Sem nada de `localStorage`, `navigator`, DOM dentro de `core/`. Histórico vira responsabilidade do host (PWA usa localStorage; Flutter usa SQLite/sharedPrefs).
- **Risco de layout:** zero (módulo isolado).
- **Critério de pronto:** `core/` não importa de `react`, `react-dom`, `screens`, `components`, `hooks`. Bundle separado compilado standalone (pode ser `@linka/speedtest-core` futuro). Documento em `docs/ContratoEmbedFlutter.md` descrevendo input/output.
- **Dependência:** Fases 1-3.
- **Ganho percebido:** estratégico — desbloqueia o caminho para o app principal.

### Fase 8 (paralela a 0-2) — Cobertura de testes

- **Objetivo de produto:** refatorar com rede.
- **Arquivos:** `src/__tests__/recommendations.test.ts`, `compare.test.ts`, `historyInsights.test.ts`, `interpret.test.ts`. Pode rodar em paralelo a Fases 0-2.
- **Risco:** zero.
- **Critério de pronto:** > 80% das linhas de `core/` cobertas. Cenários da matriz Anatel fixa vs. móvel testados explicitamente.
- **Ganho percebido:** zero direto, mas habilita as outras fases sem medo.

---

## Resumo executivo

A análise externa estava majoritariamente correta nos sintomas: 12 dos 14 pontos são reais no código local (1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13, 14). Pontos 6 e 8 estavam mal formulados — o cheiro existe, mas em outro lugar. **Nenhum ponto da análise externa é ataque infundado** — todos refletem fragmentação real entre 9 lugares que interpretam os mesmos números.

O caminho é construir um `core/` puro (sem React, sem DOM) com `interpretSpeedTestResult` recebendo `profile: 'fixed_broadband' | 'mobile_broadband'` e devolvendo decisão + chaves de copy + use cases + recomendações **de uma só vez**. Migrar consumidores um a um (ResultScreen, HistoryScreen, ComparisonScreen) preservando JSX. Só depois remover o legado.

A inclusão de `profile` desde Fase 0 e a separação `copyKeys` × dicionário desde Fase 1 são o que torna o motor reutilizável no Flutter. Tudo o resto é higiene incremental — necessária, mas não estratégica.
