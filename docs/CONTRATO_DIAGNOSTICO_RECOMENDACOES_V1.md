# Contrato de Diagnóstico e Recomendações v1.0.0

**Data de Criação:** 2026-05-09  
**Status:** ✅ Especificação Final  
**Escopo:** Schema canônico de diagnósticos IA + fallback determinístico  

---

## 1. Visão Geral

O sistema de diagnóstico PWA Linka tem dois caminhos:

1. **IA (Claude API)** — Análise contextual com LLM, ideal para diagnósticos complexos
2. **Rules Engine v1** — Fallback determinístico baseado em thresholds, sem dependências externas

Ambos retornam o mesmo schema (`DiagnosisRecommendation`), permitindo swaps transparentes.

---

## 2. Inputs (Métricas do Speed Test)

### Conjunto obrigatório (sempre disponível)

```typescript
interface SpeedTestResult {
  // Bandwidth (Mbps)
  dl: number;           // Download (≥0)
  ul: number;           // Upload (≥0)
  
  // Latency & Jitter (ms)
  ping: number;         // RTT médio (≥0)
  jitter: number;       // Oscilação (≥0)
  
  // Packet Loss (%)
  packetLoss: number;   // 0-100
  
  // Connection info
  connectionType: 'wifi' | 'mobile' | 'cable' | 'unknown';
  
  // Server & location
  serverId?: string;
  serverName?: string;
  serverLocation?: string;
  
  // Device info
  deviceInfo?: {
    model?: string;
    os?: string;
    browser?: string;
  };
  
  // Timestamp
  timestamp: number;    // epoch ms
}
```

### Conjunto opcional (pode estar presente)

```typescript
interface ContractPlanInfo {
  // Plano contratado (ANATEL)
  contractedDl?: number;    // Mbps
  contractedUl?: number;    // Mbps
  
  // Histórico prévio (para trends)
  previousDl?: number;
  previousUl?: number;
  previousTimestamp?: number;
}
```

---

## 3. Outputs: Schema DiagnosisRecommendation

### Estrutura completa

```typescript
interface DiagnosisRecommendation {
  // Identificação
  id: string;                        // UUID
  timestamp: number;                 // epoch ms
  
  // Diagnóstico agregado
  cause: DiagnosisCause;            // 'healthy' | 'congestion' | 'wifi' | 'dns' | 'wan_issue' | 'isp_limit' | 'device' | 'unknown'
  severity: Severity;               // 'healthy' | 'warn' | 'fail'
  
  // Título e descrição
  title: string;                    // ex: "Congestionamento de rede local"
  summary: string;                  // 1-2 linhas, linguagem clara (pt-BR)
  
  // Detalhes estruturados
  problems: DiagnosisProblem[];     // 1-3 problemas identificados
  
  // Recomendações acionáveis
  recommendations: Recommendation[]; // ações concretas
  
  // Metadata
  confidence: number;               // 0-1 (nível de confiança)
  source: 'rules-engine' | 'claude-api' | 'fallback'; // qual motor gerou
  processingTimeMs: number;         // tempo de processamento
}

interface DiagnosisProblem {
  id: string;                       // problema ID
  metric: string;                   // qual métrica afetada ('dl', 'ul', 'ping', 'jitter', 'packetLoss', 'mixed')
  description: string;              // descrição curta
  severity: 'warn' | 'fail' | 'critical'; // urgência deste problema
}

interface Recommendation {
  id: string;                       // recomendação ID
  action: string;                   // verbo + substantivo ("Reiniciar roteador", "Trocar canal WiFi", etc)
  description: string;              // por quê fazer
  priority: 'high' | 'medium' | 'low'; // ordem de execução
  category: RecommendationCategory; // tipo (wifi, isp, device, etc)
  
  // Metadados para UI
  icon?: string;                    // nome de ícone
  color?: string;                   // cor CSS para destaque
}

type DiagnosisCause = 
  | 'healthy'       // Tudo certo
  | 'congestion'    // WiFi/LAN congestionada
  | 'wifi'          // Problema WiFi específico
  | 'dns'           // DNS lento/instável
  | 'wan_issue'     // Problema Internet/ISP
  | 'isp_limit'     // Limite de velocidade contratada
  | 'device'        // Problema do dispositivo
  | 'unknown';      // Não conseguiu diagnosticar

type Severity = 'healthy' | 'warn' | 'fail';

type RecommendationCategory =
  | 'wifi'          // WiFi/rede local
  | 'router'        // Roteador
  | 'device'        // Dispositivo
  | 'isp'           // ISP/internet
  | 'dns'           // DNS
  | 'general';      // Geral
```

---

## 4. Exemplos de Outputs

### Exemplo 1: Healthy

```json
{
  "id": "diag-abc123",
  "timestamp": 1715261280000,
  "cause": "healthy",
  "severity": "healthy",
  "title": "Tudo certo com sua rede",
  "summary": "Sua conexão está operando normalmente dentro do esperado.",
  "problems": [],
  "recommendations": [],
  "confidence": 1.0,
  "source": "rules-engine",
  "processingTimeMs": 12
}
```

### Exemplo 2: WiFi Congestion

```json
{
  "id": "diag-def456",
  "timestamp": 1715261280000,
  "cause": "congestion",
  "severity": "warn",
  "title": "Congestionamento de rede local",
  "summary": "Sua WiFi pode estar congestionada. Tente reduzir dispositivos conectados ou trocar de canal.",
  "problems": [
    {
      "id": "prob-wifi-1",
      "metric": "dl",
      "description": "Download 40% abaixo do esperado para WiFi",
      "severity": "warn"
    },
    {
      "id": "prob-wifi-2",
      "metric": "jitter",
      "description": "Oscilação elevada (>20ms) indica competição de banda",
      "severity": "warn"
    }
  ],
  "recommendations": [
    {
      "id": "rec-wifi-1",
      "action": "Reduzir dispositivos conectados",
      "description": "Desconecte dispositivos ociosos da WiFi para reduzir congestionamento",
      "priority": "high",
      "category": "wifi",
      "icon": "wifi",
      "color": "#FFC107"
    },
    {
      "id": "rec-wifi-2",
      "action": "Trocar canal WiFi",
      "description": "Mude para um canal menos congestionado (1, 6 ou 11 em 2.4GHz; qualquer um em 5GHz)",
      "priority": "high",
      "category": "router",
      "icon": "cog",
      "color": "#FFC107"
    },
    {
      "id": "rec-wifi-3",
      "action": "Usar 5GHz se disponível",
      "description": "A banda 5GHz geralmente tem menos interferência que 2.4GHz",
      "priority": "medium",
      "category": "wifi",
      "icon": "signal",
      "color": "#FFC107"
    }
  ],
  "confidence": 0.85,
  "source": "claude-api",
  "processingTimeMs": 1200
}
```

### Exemplo 3: ISP Limit / ANATEL

```json
{
  "id": "diag-ghi789",
  "timestamp": 1715261280000,
  "cause": "isp_limit",
  "severity": "fail",
  "title": "Entrega abaixo do contratado",
  "summary": "Sua conexão está 30% abaixo do plano contratado (100 Mbps). Contate seu ISP.",
  "problems": [
    {
      "id": "prob-anatel-1",
      "metric": "dl",
      "description": "Medido: 70 Mbps | Contratado: 100 Mbps (30% abaixo)",
      "severity": "fail"
    }
  ],
  "recommendations": [
    {
      "id": "rec-anatel-1",
      "action": "Contatar o ISP",
      "description": "Você tem direito a reclamar junto à ANATEL. Abra uma ocorrência técnica com seu ISP.",
      "priority": "high",
      "category": "isp",
      "icon": "phone",
      "color": "#F44336"
    },
    {
      "id": "rec-anatel-2",
      "action": "Registrar em ANATEL",
      "description": "Você pode registrar uma reclamação no portal ANATEL se o ISP não resolver em 2 tentativas.",
      "priority": "medium",
      "category": "isp",
      "icon": "alert",
      "color": "#F44336"
    }
  ],
  "confidence": 0.95,
  "source": "rules-engine",
  "processingTimeMs": 15
}
```

### Exemplo 4: DNS Problem

```json
{
  "id": "diag-jkl012",
  "timestamp": 1715261280000,
  "cause": "dns",
  "severity": "warn",
  "title": "DNS lento ou instável",
  "summary": "Resoluções DNS estão lentas (>100ms). Tente trocar de DNS para Cloudflare ou Google.",
  "problems": [
    {
      "id": "prob-dns-1",
      "metric": "ping",
      "description": "Latência DNS elevada (150ms) — possível gargalo de resolução",
      "severity": "warn"
    }
  ],
  "recommendations": [
    {
      "id": "rec-dns-1",
      "action": "Trocar para DNS Cloudflare",
      "description": "Primary: 1.1.1.1 | Secondary: 1.0.0.1 — mais rápido e privado",
      "priority": "high",
      "category": "dns",
      "icon": "dns",
      "color": "#2196F3"
    },
    {
      "id": "rec-dns-2",
      "action": "Ou use DNS Google",
      "description": "Primary: 8.8.8.8 | Secondary: 8.8.4.4",
      "priority": "high",
      "category": "dns",
      "icon": "dns",
      "color": "#2196F3"
    }
  ],
  "confidence": 0.75,
  "source": "claude-api",
  "processingTimeMs": 950
}
```

---

## 5. Fluxo de Processamento

### Arquitectura: IA-first com fallback determinístico

```
┌─────────────────────────────────┐
│   Speed Test Result Complete     │
│  (DL, UL, Ping, Jitter, PL)     │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│   Try Claude API (timeout 3s)   │
│  - Send metrics + context       │
│  - Parse JSON response          │
└──────┬──────────────┬───────────┘
       │              │
   SUCCESS        TIMEOUT/ERROR
       │              │
       │              ▼
       │      ┌──────────────────────┐
       │      │ Rules Engine v1      │
       │      │ (deterministic)      │
       │      └──────┬───────────────┘
       │             │
       └─────┬───────┘
             │
             ▼
┌──────────────────────────────────┐
│   DiagnosisRecommendation        │
│   (ready for ResultScreen)       │
└──────────────────────────────────┘
```

### SLA e Timeouts

- **Claude API max latency:** 3000ms
  - Se timeout → fallback para Rules Engine v1
  - Log de falha para analytics

- **Rules Engine max latency:** <50ms
  - Determinístico, sem I/O assíncrono
  - Sempre "succeeds" (worst case: "unknown")

---

## 6. Rules Engine v1 — Lógica Determinística

### Decisão Tree (pseudocódigo)

```
if (DL + UL + Ping + Jitter + PL all normal) → HEALTHY
else if (PL > 1% OR Jitter > 30ms) → CONGESTION
else if (DL < contract * 0.7 AND has_contract) → ISP_LIMIT (ANATEL)
else if (Ping > 100ms) → DNS or WAN_ISSUE
else if (DL low for WiFi standard) → WIFI
else if (DL low for mobile standard) → WAN_ISSUE
else → UNKNOWN

severity = 'healthy' if healthy, 'warn' if warn-level, 'fail' if fail-level
```

### Thresholds (para 2026-05)

```typescript
const RULES_THRESHOLDS = {
  // WiFi standards (802.11ac)
  wifi: {
    minDl: 50,      // Mbps
    minUl: 10,
    maxPing: 50,    // ms
    maxJitter: 15,
  },
  
  // Mobile (4G/5G)
  mobile: {
    minDl: 10,
    minUl: 5,
    maxPing: 100,
    maxJitter: 30,
  },
  
  // Wired/Cable
  cable: {
    minDl: 100,
    minUl: 10,
    maxPing: 30,
    maxJitter: 5,
  },
  
  // Global fail thresholds
  fail: {
    packetLoss: 1.0,          // % — acima disso = fail
    jitter: 30,               // ms
    ping: 300,                // ms
  },
  
  // ANATEL: delivery % of contract
  anatel: {
    minDeliveryPercent: 70,   // Se < 70%, reclamação válida
  },
};
```

---

## 7. Integração com Claude API

### Request Format (Claude API)

```typescript
interface ClaudeAIDiagnosisRequest {
  testResult: SpeedTestResult;
  contractInfo?: ContractPlanInfo;
  previousTests?: SpeedTestResult[];  // últimos 3-5 para trend
  
  // Instruções
  instructions: {
    language: 'pt-BR';
    responseFormat: 'json';
    maxRecommendations: 3;
    timeoutMs: 3000;
  };
}
```

### Prompt Template (Claude API)

```
You are a network diagnostician assistant for Linka, a Brazilian internet speed test app.
Analyze the provided speed test results and generate structured diagnostics and recommendations.

Input:
- Download: {{dl}} Mbps
- Upload: {{ul}} Mbps
- Ping (latency): {{ping}} ms
- Jitter (variation): {{jitter}} ms
- Packet Loss: {{packetLoss}} %
- Connection Type: {{connectionType}}
{{#if contractInfo}}
- Contracted Speed: {{contractedDl}}/{{contractedUl}} Mbps (ANATEL standard)
{{/if}}

Output: Respond with ONLY valid JSON matching this schema:
{
  "cause": "one of: healthy|congestion|wifi|dns|wan_issue|isp_limit|device|unknown",
  "severity": "healthy|warn|fail",
  "title": "em pt-BR, 5-10 palavras",
  "summary": "em pt-BR, 1-2 linhas",
  "problems": [{"metric":"...", "description":"..."}],
  "recommendations": [{"action":"...", "description":"...", "priority":"high|medium|low"}],
  "confidence": 0.0-1.0
}

Guidelines:
1. Be specific and actionable
2. Prioritize WiFi/network local issues first
3. Only mention ISP issues if metrics are consistently below contract
4. Provide at most 3 recommendations
5. Use clear, non-technical language for Brazilian users
```

### Response Parsing

```typescript
interface ClaudeAPIResponse {
  diagnosis: DiagnosisRecommendation; // parsed JSON
  rawText: string;                   // fallback
  error?: string;                    // if parsing failed
}

// If Claude response is malformed JSON → fallback to Rules Engine v1
```

---

## 8. Integração com ResultScreen

### Component Props

```typescript
interface ResultScreenProps {
  testResult: SpeedTestResult;
  contractInfo?: ContractPlanInfo;
  diagnosis?: DiagnosisRecommendation;  // computed async
  diagnosisLoading?: boolean;           // while Claude API processes
  diagnosisError?: string;              // if fallback occurred
}
```

### Rendering Logic

```tsx
// Diagnosis card
<div
  className="lk-result__combined"
  style={{
    '--diag-glow-color': diagnoseGlowColor(diagnosis?.severity),
  }}
>
  {diagnosis?.severity === 'healthy' ? (
    // Healthy state: centered check icon
    <div className="lk-result__combined--healthy">
      {/* check icon + "Tudo certo" */}
    </div>
  ) : (
    // Warning/Fail state: list of problems + recommendations
    <div>
      <h3>{diagnosis?.title}</h3>
      <p>{diagnosis?.summary}</p>
      <ul className="lk-result__combined-list">
        {diagnosis?.problems.map(problem => (
          <li>{problem.description}</li>
        ))}
      </ul>
      <div className="lk-result__combined-action">
        {/* Primary recommendation */}
      </div>
      {diagnosis?.recommendations.length > 1 && (
        <button className="lk-result__combined-more">
          Ver mais recomendações
        </button>
      )}
    </div>
  )}
</div>
```

### Glow Color Mapping

```typescript
function diagnoseGlowColor(severity?: Severity): string {
  switch (severity) {
    case 'healthy': return 'var(--success-glow)';  // green
    case 'warn': return 'var(--warn-glow)';        // yellow
    case 'fail': return 'var(--error-glow)';       // red
    default: return 'transparent';
  }
}
```

---

## 9. Fallback Strategy

### Quando Claude API falha

1. **Timeout (>3s):** Use Rules Engine v1 imediatamente
2. **Invalid JSON:** Try parse fallback, then Rules Engine v1
3. **Network error:** Rules Engine v1
4. **API error (5xx):** Rules Engine v1
5. **Quota exceeded:** Rules Engine v1 (no retry)

### Rules Engine v1 Outputs

Sempre retorna `DiagnosisRecommendation` válido — nunca null/undefined.

```typescript
// Worst case: unknown diagnosis
{
  cause: 'unknown',
  severity: 'warn',
  title: 'Não consegui diagnosticar',
  summary: 'Tente novamente ou contate suporte.',
  problems: [],
  recommendations: [],
  confidence: 0.2,
  source: 'rules-engine',
  processingTimeMs: 8
}
```

---

## 10. Analytics e Logging

### Events to Log

```typescript
interface DiagnosisEvent {
  type: 'diagnosis_generated';
  diagnosisId: string;
  cause: DiagnosisCause;
  severity: Severity;
  source: 'rules-engine' | 'claude-api' | 'fallback';
  processingTimeMs: number;
  apiLatencyMs?: number;         // se Claude
  fallbackReason?: string;       // se fallback ocorreu
  timestamp: number;
}
```

### Metrics to Track

- % de requisições Claude API com sucesso
- Latência média Claude API
- Taxa de fallback para Rules Engine
- Distribuição de diagnostics por `cause`
- Confidence score médio

---

## 11. Versionamento

**v1.0.0 (2026-05):**
- ✅ Schema canônico `DiagnosisRecommendation`
- ✅ Rules Engine v1 (determinístico)
- ✅ Claude API integration (IA)
- ✅ Fallback strategy
- ⏰ v1.1.0 planejado para melhorias de prompt + thresholds

---

## 12. Testing Strategy

### Unit Tests (Rules Engine)

```typescript
describe('Rules Engine v1', () => {
  test('healthy: DL 100, UL 20, ping 20, jitter 5, PL 0', () => {
    const diagnosis = rulesEngine({dl: 100, ul: 20, ping: 20, jitter: 5, packetLoss: 0});
    expect(diagnosis.cause).toBe('healthy');
    expect(diagnosis.severity).toBe('healthy');
  });
  
  test('congestion: high jitter', () => {
    const diagnosis = rulesEngine({dl: 100, ul: 20, ping: 25, jitter: 35, packetLoss: 0});
    expect(diagnosis.cause).toBe('congestion');
    expect(diagnosis.severity).toBe('warn');
  });
  
  // ... more tests
});
```

### Integration Tests (Claude API)

- Mock Claude API response
- Verify JSON parsing
- Test fallback on timeout
- Verify glow color mapping in ResultScreen

---

## 13. Próximas Iterações (v1.1+)

- [ ] Machine learning para melhor detection de padrões
- [ ] A/B testing de prompts Claude
- [ ] Threshold tuning baseado em feedback de usuários
- [ ] Suporte para outros idiomas
- [ ] Integração com roteador local (DHCP analysis)
- [ ] Historical trend analysis (últimas 30 dias)

---

## Anexo: Status Codes & Error Handling

```typescript
enum DiagnosisErrorCode {
  OK = 0,
  RULES_ENGINE_TIMEOUT = 1001,
  CLAUDE_API_TIMEOUT = 2001,
  CLAUDE_API_INVALID_JSON = 2002,
  CLAUDE_API_NETWORK_ERROR = 2003,
  CLAUDE_API_AUTH_FAILED = 2004,
  UNKNOWN_ERROR = 9999,
}

// Implementado em Fase 2d (IA Diagnóstico v0)
```

---

**Documento finalizado:** 2026-05-09  
**Próximo:** Fase 2b — Rules Engine v1 implementação
