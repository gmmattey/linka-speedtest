# Fase 2d: Integração Claude API para Diagnóstico IA

**Status:** ✅ Completa  
**Data:** 2026-05-09  
**Duração:** 1-2 dias  

---

## Resumo Executivo

Integração da Claude API (3.5 Sonnet) com timeout de 3 segundos e fallback automático para Rules Engine v1. O diagnóstico agora é IA-first com guarantee de resposta rápida.

---

## Arquitetura

```
Speed Test Result
    ↓
useDiagnosisItems (hook)
    ↓
useDiagnosis (hook assíncrono)
    ↓
combinedDiagnosis()
    ├─ Try: Claude API (3s timeout)
    │  ├─ Parse JSON response
    │  └─ Return DiagnosisRecommendation
    │
    └─ Catch: Rules Engine v1 fallback
       └─ Return DiagnosisRecommendation (source: 'fallback')
    ↓
diagnosisRecommendationToItems() (adapter)
    ↓
DiagnosisItem[] (for ResultScreen rendering)
```

---

## Arquivos Criados

### 1. `src/features/diagnosis/claudeApi.ts`

**Responsabilidade:** Integração com Claude API e fallback determinístico.

**Funções principais:**

```typescript
// Chama Claude API com prompt estruturado
async function callClaudeApi(prompt: string): Promise<string>

// Parsa resposta JSON da Claude
function parseClaudeResponse(text: string): Partial<DiagnosisRecommendation>

// Chamada principal: Claude API + fallback automático
async function claudeDiagnosis(input: DiagnosisEngineInput): Promise<DiagnosisRecommendation>

// Wrapper que encapsula a lógica completa
async function combinedDiagnosis(input: DiagnosisEngineInput): Promise<DiagnosisRecommendation>
```

**Timeout:** 3000ms (conforme contrato em docs/CONTRATO_DIAGNOSTICO_RECOMENDACOES_V1.md)

**Fallback:**
- Se Claude timeout → Rules Engine
- Se Claude erro → Rules Engine
- Se Claude JSON inválido → Rules Engine
- Se Claude sem resposta → Rules Engine

---

## Arquivos Modificados

### 1. `src/features/diagnosis/useDiagnosis.ts`

**Mudanças:**
- ✅ Substituído `useMemo` por `useState` + `useEffect` (agora assíncrono)
- ✅ Chama `combinedDiagnosis()` em vez de `rulesEngine()` diretamente
- ✅ Gerencia `loading`, `error`, e `source` corretamente
- ✅ Cleanup on unmount com `isMounted` flag

**Hook Signature:**
```typescript
function useDiagnosis(
  testResult: SpeedTestResult | null,
  connectionType?: ConnectionType | null,
  contractInfo?: ContractPlanInfo,
): UseDiagnosisResult
```

**Return:**
```typescript
{
  data: DiagnosisRecommendation | null,
  loading: boolean,
  error: string | null,
  source: 'rules-engine' | 'claude-api' | 'fallback' | null,
}
```

### 2. `src/features/diagnosis/index.ts`

**Adicionado:**
- Export de `claudeDiagnosis`
- Export de `combinedDiagnosis`

---

## Configuração (Desenvolvimento)

### 1. Obter API Key

1. Ir para https://console.anthropic.com/
2. Fazer login com conta Anthropic
3. Gerar nova API key
4. Copiar a chave (formato: `sk-ant-...`)

### 2. Configurar Variável de Ambiente

**Arquivo:** `.env.local` (não versionar!)

```env
VITE_ANTHROPIC_API_KEY=sk-ant-seu-token-aqui
```

**Nota:** O prefixo `VITE_` torna a variável acessível no código do browser via `import.meta.env`.

### 3. Verificar Configuração

```bash
npm run dev
# Check console.log for warnings about missing VITE_ANTHROPIC_API_KEY
```

---

## Fluxo de Diagnóstico

### Estado: Computando

```
useDiagnosis { loading: true, data: null }
↓
ResultScreen mostra: "Carregando diagnóstico..."
```

### Estado: Sucesso via Claude API

```
combinedDiagnosis() → Claude API (200ms)
↓
parse JSON response
↓
useDiagnosis { loading: false, data: DiagnosisRecommendation, source: 'claude-api' }
↓
diagnosisRecommendationToItems() → DiagnosisItem[]
↓
ResultScreen renderiza diagnóstico com glow animado
```

### Estado: Fallback (Timeout ou Erro)

```
combinedDiagnosis() → Claude API timeout (3s) ou erro
↓
Catch block → claudeDiagnosis() chama rulesEngine()
↓
useDiagnosis { loading: false, data: DiagnosisRecommendation, source: 'fallback' }
↓
ResultScreen renderiza diagnóstico (Rules Engine)
```

---

## Prompt da Claude

O prompt é construído dinamicamente com:
- Métricas do teste (DL, UL, ping, jitter, PL)
- Tipo de conexão
- Velocidade contratada (se disponível)

Instrui Claude a retornar JSON estruturado com:
- `cause`: tipo de diagnóstico
- `severity`: healthy/warn/fail
- `title`: título curto
- `summary`: 1-2 linhas
- `problems`: array de DiagnosisProblem
- `recommendations`: array de Recommendation
- `confidence`: 0-1 (confiança da análise)

**Exemplo de resposta esperada:**

```json
{
  "cause": "congestion",
  "severity": "warn",
  "title": "Congestionamento de rede local",
  "summary": "Sua WiFi está congestionada. Tente reduzir dispositivos conectados.",
  "problems": [
    {
      "id": "prob-jitter",
      "metric": "jitter",
      "description": "Oscilação elevada (25ms)",
      "severity": "warn"
    }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "action": "Reduzir dispositivos conectados",
      "description": "Desconecte dispositivos ociosos",
      "priority": "high",
      "category": "wifi",
      "icon": "wifi",
      "color": "#FFC107"
    }
  ],
  "confidence": 0.85
}
```

---

## Tratamento de Erros

### Cenário 1: API Key Ausente
```
Erro: VITE_ANTHROPIC_API_KEY não configurada
→ Fallback automático para Rules Engine
```

### Cenário 2: Timeout (3s)
```
AbortError: Claude API timeout (3000ms)
→ Fallback para Rules Engine
```

### Cenário 3: Erro de Rede
```
Erro: fetch error / CORS / etc
→ Fallback para Rules Engine
```

### Cenário 4: JSON Inválido
```
Erro: JSON.parse() falha
→ Fallback para Rules Engine
```

**Em todos os cenários:** `source: 'fallback'` e console.warn logueia o erro para debugging.

---

## Teste Rápido (Manual)

### 1. Abrir DevTools (F12)

```javascript
// No console do browser:
const result = {
  dl: 50, ul: 10, ping: 80, jitter: 25, packetLoss: 0.5,
  connectionType: 'wifi', timestamp: Date.now()
};

// Simular um diagnóstico (se Claude está configurado)
```

### 2. Fazer um teste de velocidade no PWA

- Start → Running → Done
- Observe: card de diagnóstico renderiza
- Check console: `source: 'claude-api'` ou `source: 'fallback'`

### 3. Performance

- Com Claude: 200-500ms (depende latência API)
- Com Rules Engine fallback: <50ms

---

## SLAs

| Cenário | Timeout | SLA |
|---------|---------|-----|
| Claude API sucesso | - | <500ms |
| Claude API timeout | 3000ms | Fallback Rules Engine |
| Rules Engine direto | - | <50ms |
| Total (com timeout) | 3000ms | Diagnóstico sempre entregue |

---

## Próximas Fases

- **Phase 2e:** Bottom sheets detalhados (AdvancedSheet, GamerSheet, DNSGuideSheet)
- **Phase 3a:** Remover placeholders vazios
- **Phase 3b:** LocalWifi + LocalNetwork gatekeeper
- **Phase 3c:** Remover seção Roteador
- **Phase 3d:** Testes E2E
- **Phase 4:** Release PWA 1.1.0

---

## Deployment

### Variáveis de Produção

Configurar em Cloudflare Pages:

```bash
# Cloudflare Pages → Settings → Environment variables
VITE_ANTHROPIC_API_KEY = sk-ant-...
```

**Nota:** O prefixo `VITE_` é obrigatório para que a variável seja injetada no bundle.

### Build Final

```bash
npm run build
# Verifica: dist/ criado sem erros
# Verifica: No missing env vars warnings
```

---

## Desenvolvimento Futuro

Se claudemodel mudar:

1. Atualizar `MODEL` em `claudeApi.ts`
2. Testar com novo modelo
3. Documentar mudança aqui

Se prompt precisa refino:

1. Editar `buildPrompt()` em `claudeApi.ts`
2. Testar com alguns casos
3. Commitar junto com exemplos

---

**Responsável:** Claude Code  
**Reviewer:** Product Manager  
**Data conclusão:** 2026-05-09
