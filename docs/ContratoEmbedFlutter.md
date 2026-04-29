# Contrato de Embed Flutter — linka SpeedTest Core

> Documento de referência para integrar o motor de interpretação do linka SpeedTest em um host externo (Flutter, Node.js, WebView isolado). Data: 2026-04-29.

---

## 1. Visão geral

O motor (`src/core/`) é uma camada pura de TypeScript sem dependências de React, DOM ou localStorage. Pode ser consumida por qualquer host que execute JavaScript moderno — incluindo WebViews no Flutter via `flutter_webview_plugin` / `webview_flutter`.

**O que o motor entrega:**
- Execução do speed test com progresso em tempo real
- Interpretação das métricas (qualidade, flags, estabilidade, casos de uso, recomendações)
- Chaves de copy prontas para tradução no dicionário do host

**O que é responsabilidade do host:**
- Persistência do histórico (localStorage no PWA, SQLite/SharedPreferences no Flutter)
- Renderização e layout (React no PWA, Widgets no Flutter)
- Internacionalização além do pt-BR (use as `copyKeys` com dicionário próprio)
- Cancelamento de testes (fornecer `AbortSignal`)

---

## 2. Ponto de entrada público

```ts
import { runHeadlessTest, interpretSpeedTestResult, resolveCopy } from './src/core';
```

Todo o contrato é exportado por `src/core/index.ts`. Nunca importe de arquivos internos do core diretamente.

---

## 3. API principal: `runHeadlessTest`

```ts
async function runHeadlessTest(
  profile: ConnectionProfile,
  options?: HeadlessTestOptions,
): Promise<HeadlessTestResult>
```

### `ConnectionProfile`

```ts
type ConnectionProfile = 'fixed_broadband' | 'mobile_broadband';
```

| Valor | Quando usar |
|---|---|
| `'fixed_broadband'` | Wi-Fi, cabo, ethernet |
| `'mobile_broadband'` | Rede celular (4G/5G) |

Determina os thresholds Anatel aplicados na interpretação.

### `HeadlessTestOptions`

```ts
interface HeadlessTestOptions {
  connectionType?: 'wifi' | 'cable' | 'mobile';  // preset de volume do teste
  mode?: 'quick' | 'complete';                    // default: 'complete'
  history?: TestRecord[];                          // últimos testes para análise histórica
  signal?: AbortSignal;                            // cancelamento externo
  onProgress?: (p: SpeedTestProgress) => void;    // progresso em tempo real
}
```

#### `SpeedTestProgress`

```ts
interface SpeedTestProgress {
  phase: 'latency' | 'download' | 'upload' | 'done' | 'error';
  instantMbps: number | null;   // velocidade instantânea (null em latência/done)
  overallProgress: number;       // 0.0 a 1.0
  partial?: SpeedTestResult;     // preenchido na fase 'done'
}
```

### `HeadlessTestResult`

```ts
interface HeadlessTestResult {
  metrics: SpeedTestResult;       // valores brutos do teste
  interpreted: InterpretedResult; // decisão completa do motor
}
```

#### `SpeedTestResult`

```ts
interface SpeedTestResult {
  dl: number;          // Mbps download (P90 das rodadas)
  ul: number;          // Mbps upload (P90 das rodadas)
  latency: number;     // ms (mediana das amostras)
  jitter: number;      // ms (variação da latência)
  packetLoss: number;  // % (falhas de ping)
  timestamp: number;   // ms desde epoch
}
```

---

## 4. `InterpretedResult` — estrutura completa

```ts
interface InterpretedResult {
  ruleSetVersion: RuleSetVersion;  // 'v1' — grave no registro histórico

  profile: ConnectionProfile;      // ecoado da entrada

  quality: Quality;
  // 'excellent' | 'good' | 'fair' | 'slow' | 'unavailable'

  flags: {
    highLatency: boolean;   // latência > limiar do perfil
    lowUpload: boolean;     // upload < limiar do perfil
    unstable: boolean;      // jitter > limiar do perfil
    packetLoss: boolean;    // perda > limiar do perfil
    veryUnstable: boolean;  // jitter ou perda muito altos
  };

  stability: {
    score: number;          // 0–100
    level: StabilityLevel;  // 'very_stable' | 'stable' | 'oscillating' | 'unstable'
  };

  useCases: UseCaseVerdict[];
  // [{ id: 'gaming', status: 'good' | 'maybe' | 'limited', blockingFactors: [...] }, ...]
  // IDs: 'gaming', 'streaming_4k', 'home_office', 'video_call'

  recommendations: InterpretedRecommendation[];
  // [{ id, priority: 'low'|'medium'|'high', actionType, triggeredBy }]

  copyKeys: {
    headlineKey: string;        // ex.: 'quality.good'
    shortPhraseKey: string;     // ex.: 'shortPhrase.good_no_alerts'
    diagnosisKeys: string[];    // ex.: ['diag.good', 'diag.highLatency']
    stabilityLabelKey: string;  // ex.: 'stability.stable'
  };
}
```

---

## 5. Uso das `copyKeys`

O motor não retorna texto — retorna chaves. O host é responsável por traduzir.

### Opção A: usar o dicionário pt-BR embutido

```ts
import { resolveCopy } from './src/core';

const headline = resolveCopy(result.interpreted.copyKeys.headlineKey);
// 'Conexão boa'
```

### Opção B: dicionário próprio do Flutter

```dart
const Map<String, String> dict = {
  'quality.good': 'Good connection',
  'stability.stable': 'Stable',
  // ...
};

String resolveCopy(String key) => dict[key] ?? key;
```

O dicionário pt-BR completo está em `src/core/copyDictionary.ts` como referência de todas as chaves possíveis.

---

## 6. Exemplo completo de integração

### Via WebView (JavaScript injetado)

```javascript
// Injetado no WebView do Flutter
const { runHeadlessTest } = await import('/core/index.js');

const result = await runHeadlessTest('fixed_broadband', {
  mode: 'quick',
  onProgress: (p) => {
    // Enviar para Flutter via postMessage
    window.flutter_inappwebview.callHandler('onProgress', p);
  },
});

// Enviar resultado completo para Flutter
window.flutter_inappwebview.callHandler('onResult', {
  dl: result.metrics.dl,
  ul: result.metrics.ul,
  quality: result.interpreted.quality,
  headlineKey: result.interpreted.copyKeys.headlineKey,
  useCases: result.interpreted.useCases,
});
```

### Cancelamento

```javascript
const controller = new AbortController();

// Iniciar teste
runHeadlessTest('mobile_broadband', {
  signal: controller.signal,
  onProgress: handleProgress,
}).then(handleResult).catch((e) => {
  if (e.name === 'AbortError') console.log('Cancelado pelo usuário');
});

// Cancelar (ex.: botão "Parar")
controller.abort();
```

---

## 7. Interpretação sem executar o teste

Para reinterpretar um registro histórico já salvo:

```ts
import { interpretSpeedTestResult } from './src/core';

const interpreted = interpretSpeedTestResult({
  metrics: savedRecord,
  profile: 'fixed_broadband',
  history: recentRecords, // opcional — enriquece o diagnóstico
});
```

---

## 8. Restrições e garantias

| Item | Garantia |
|---|---|
| Importações React/DOM | Zero em `src/core/` |
| localStorage / sessionStorage | Zero em `src/core/` — host gerencia histórico |
| APIs de rede | `fetch` (universal em WebView moderno) |
| Determinismo | Dado os mesmos `metrics` + `profile`, `interpretSpeedTestResult` retorna sempre o mesmo resultado |
| Versão das regras | `ruleSetVersion: 'v1'` — gravar em cada `TestRecord` para futura reinterpretação |
| Thresholds | `fixed_broadband` alinhado com Anatel RES 574/2011; `mobile_broadband` com tolerâncias deflacionadas (~50% de DL/UL) |

---

## 9. Próximos passos sugeridos

- **WASM / Dart FFI:** Para integração mais profunda, compilar `core/` para WASM via AssemblyScript ou usar `dart:js_interop` no Flutter 3.10+.
- **Dicionário multilíngue:** Adicionar `en-US` e `es-LA` ao `copyDictionary.ts` conforme expansão de mercado.
- **`compareHeadless`:** Função equivalente para o modo "Comparar locais" — recebe dois `HeadlessTestResult` e retorna diagnóstico de cobertura Wi-Fi.
