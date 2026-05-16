# LINKA SpeedTest — Plano de Evolução de Produto e Features Futuras

## 1. Objetivo do documento

Este documento define a evolução planejada do **LINKA SpeedTest** para que o produto deixe de ser apenas um medidor de velocidade e passe a competir por diferenciação contra grandes players como Ookla, nPerf e similares.

O objetivo não é copiar os grandes. O LINKA não deve tentar vencer apenas mostrando Mbps. O diferencial deve ser:

```txt
Diagnóstico da internet explicado sem enrolação.
```

O LINKA deve responder perguntas reais do usuário:

```txt
Minha internet está boa para jogar?
Vai travar em chamada?
O problema é minha operadora ou meu Wi‑Fi?
A internet piora no quarto?
O roteador está mal posicionado?
Tenho prova suficiente para falar com o suporte?
O que eu faço agora?
```

Este documento foi escrito para orientar uma IA de desenvolvimento a implementar as features de forma faseada, testável e compatível com as limitações de um PWA.

## 2. Estratégia de produto

### 2.1. Posicionamento recomendado

O LINKA SpeedTest deve se posicionar como:

```txt
Um diagnóstico simples e acionável da sua internet.
```

Não como:

```txt
Mais um velocímetro de Mbps.
```

O produto deve evitar competir diretamente em:

```txt
rede global de servidores;
ranking público nacional;
mapa de cobertura massivo;
VPN;
app nativo pesado;
benchmark ultra técnico.
```

Essas frentes favorecem empresas maiores.

O LINKA deve competir em:

```txt
clareza;
diagnóstico;
histórico inteligente;
explicação simples;
comparação por cômodo;
prova real para suporte;
orientação prática;
privacidade local;
experiência PWA leve.
```

## 3. Limitações importantes do PWA

Antes de implementar qualquer feature, respeitar as limitações do PWA.

PWAs podem usar recursos como cache, service workers, armazenamento local, Web Share API, APIs de rede, notificações, workers e outras capacidades modernas, mas o suporte varia entre navegadores e sistemas. A recomendação correta é usar progressive enhancement: detectar suporte antes de usar e sempre oferecer fallback.

Service workers permitem operação offline e alguns fluxos em segundo plano, mas não ficam rodando o tempo todo. O navegador pode interromper o service worker quando achar adequado e reiniciá-lo apenas quando houver evento apropriado. Portanto, o LINKA não deve prometer monitoramento contínuo automático em background como se fosse app nativo.

### 3.1. O que o PWA pode fazer bem

```txt
medir velocidade com fetch;
medir tempo de resposta HTTP;
medir oscilação aproximada;
registrar histórico local;
salvar preferências;
exportar relatório;
gerar imagem compartilhável;
usar Web Share quando disponível;
funcionar instalado como app;
exibir tela offline;
usar notificações quando suportado e permitido;
usar IndexedDB/localStorage;
comparar testes;
criar fluxos guiados;
gerar diagnóstico textual;
rodar lógica local sem backend.
```

### 3.2. O que o PWA não deve prometer

```txt
scan profundo de rede local;
ler todos os dispositivos conectados ao roteador;
acessar MAC/BSSID de forma confiável;
medir velocidade diretamente do modem;
ler sinal GPON/fibra;
rodar teste automático 24h em background;
substituir medidor oficial da operadora;
provar sozinho descumprimento contratual;
identificar sempre se é Wi‑Fi ou rede móvel;
diagnosticar todos os problemas físicos da rede.
```

## 4. IA recomendada para implementação

### 4.1. IA principal

```txt
Claude Code — Sonnet 4.6
```

Motivo:

```txt
Melhor custo-benefício para implementar features em React/TypeScript.
Bom para refatoração incremental.
Bom para seguir documento longo.
Bom para criar testes e organizar arquivos.
Menor risco de overengineering do que modelos maiores.
```

### 4.2. IA para auditoria e refinamento

```txt
Claude Code — Opus 4.7
```

Usar depois da implementação principal para:

```txt
auditar regras;
identificar inconsistências;
revisar UX copy;
validar arquitetura;
encontrar bugs de edge case;
garantir que não houve quebra de fluxo.
```

### 4.3. IA alternativa para implementação técnica

```txt
Codex
```

Usar se a tarefa for muito focada em:

```txt
testes unitários;
refatoração de TypeScript;
extração de regras para utils;
correção de build;
ajuste de lint;
criação de fixtures;
melhoria de arquitetura.
```

### 4.4. Estratégia ideal de uso das IAs

```txt
1. Claude Sonnet 4.6 implementa por fase.
2. Codex revisa testes e build.
3. Claude Opus 4.7 audita produto, regras e UX.
```

Não entregar todas as features de uma vez. Implementar por fases pequenas.

## 5. Estimativa geral de esforço

### 5.1. Escala usada

```txt
P = pequeno: 2 a 6 horas
M = médio: 1 a 2 dias
G = grande: 3 a 5 dias
GG = muito grande: mais de 1 semana
```

### 5.2. Estimativa macro

```txt
Fase 1 — Base de diferenciação: M/G
Fase 2 — Diagnóstico guiado: G
Fase 3 — Prova Real: G
Fase 4 — Teste por local/cômodo: M/G
Fase 5 — Modo Gamer: M
Fase 6 — Teste de travamento: G
Fase 7 — Antes e Depois: M
Fase 8 — Relatórios e compartilhamento avançado: M/G
Fase 9 — Assistente LINKA: GG
```

### 5.3. Recomendação de execução

Implementar primeiro:

```txt
1. Teste rápido / teste completo
2. Diagnóstico “O que fazer agora”
3. Prova Real
4. Teste por cômodo/local
5. Compartilhamento melhorado
```

Essas features entregam maior percepção de valor com menor dependência técnica.

## 6. Arquitetura recomendada

### 6.1. Criar estrutura de domínio

Criar pasta:

```txt
src/domain
```

Estrutura sugerida:

```txt
src/domain/speedtest
src/domain/diagnosis
src/domain/history
src/domain/reports
src/domain/useCases
src/domain/experiments
```

### 6.2. Criar arquivos principais

```txt
src/domain/speedtest/testModes.ts
src/domain/speedtest/testTypes.ts
src/domain/diagnosis/diagnosisEngine.ts
src/domain/diagnosis/diagnosisMessages.ts
src/domain/diagnosis/recommendations.ts
src/domain/useCases/useCaseRules.ts
src/domain/history/historyInsights.ts
src/domain/reports/shareCard.ts
src/domain/reports/supportReport.ts
src/domain/experiments/beforeAfter.ts
src/domain/experiments/locationComparison.ts
src/domain/experiments/gamerMode.ts
src/domain/experiments/stressTest.ts
```

### 6.3. Princípio obrigatório

A UI não deve conter regra de diagnóstico pesada.

Evitar:

```tsx
if (download > 25 && latency < 60) {
  return 'Bom'
}
```

Preferir:

```ts
evaluateUseCases(result)
buildDiagnosis(result)
buildRecommendations(result)
```

As telas devem apenas renderizar resultado já calculado.

## 7. Modelo de dados recomendado

### 7.1. Resultado bruto do teste

```ts
export interface SpeedTestRawResult {
  id: string;
  timestamp: number;

  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  jitterMs: number;
  packetLossPercent: number;

  serverName?: string;
  serverLocation?: string;
  isp?: string;
  ip?: string;

  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  connectionType: 'wifi' | 'mobile' | 'cable' | 'unknown';

  testMode: 'quick' | 'complete' | 'custom';
  appVersion?: string;
}
```

### 7.2. Diagnóstico derivado

```ts
export interface DiagnosisResult {
  primary: 'excellent' | 'good' | 'fair' | 'slow' | 'unavailable';
  headline: string;
  summary: string;
  tags: DiagnosisTag[];
  stabilityLabel: string;
  stabilityScore?: number;
  recommendations: Recommendation[];
  confidence: 'low' | 'medium' | 'high';
}
```

### 7.3. Tag de diagnóstico

```ts
export interface DiagnosisTag {
  id:
    | 'highLatency'
    | 'lowUpload'
    | 'packetLoss'
    | 'unstable'
    | 'veryUnstable'
    | 'wifiLikelyIssue'
    | 'operatorPossibleIssue'
    | 'deviceLimitation'
    | 'needsMoreTests';

  label: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}
```

### 7.4. Recomendação

```ts
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionType:
    | 'repeat_test'
    | 'move_closer_router'
    | 'restart_router'
    | 'try_cable'
    | 'compare_location'
    | 'contact_operator'
    | 'run_proof_mode'
    | 'run_gamer_mode'
    | 'none';
}
```

### 7.5. Histórico

```ts
export interface TestRecordV2 extends SpeedTestRawResult {
  locationLabel?: string;
  userNote?: string;
  scenario?: 'normal' | 'near_router' | 'far_router' | 'before' | 'after' | 'gamer' | 'support_proof';
}
```

Importante: salvar dados brutos. Diagnóstico deve ser recalculado quando exibir.

## 8. Feature 1 — Teste rápido e teste completo

### 8.1. Objetivo

Dar controle ao usuário sobre consumo de dados e precisão.

Hoje o app comunica consumo aproximado, mas o usuário não escolhe claramente entre uma medição leve e uma medição mais precisa.

### 8.2. Comportamento esperado

Na tela inicial, mostrar duas opções:

```txt
Teste rápido
Teste completo
```

### 8.3. Texto sugerido

```txt
Teste rápido
Usa menos dados e dá uma noção geral da conexão.
```

```txt
Teste completo
Mais preciso. Recomendado no Wi‑Fi.
```

### 8.4. Regras de modo

```ts
export type SpeedTestMode = 'quick' | 'complete';
```

### 8.5. Configuração sugerida

```ts
export const SPEED_TEST_MODES = {
  quick: {
    label: 'Teste rápido',
    estimatedDataUsageMb: 80,
    latencySamples: 8,
    downloadRounds: 1,
    uploadRounds: 1,
    downloadPayloadMb: 50,
    uploadPayloadMb: 20,
  },
  complete: {
    label: 'Teste completo',
    estimatedDataUsageMb: 500,
    latencySamples: 20,
    downloadRounds: 3,
    uploadRounds: 3,
    downloadPayloadMb: 100,
    uploadPayloadMb: 50,
  },
};
```

### 8.6. Ajustes de UI

Tela inicial deve exibir:

```txt
Como você quer testar?
[ Teste rápido ]
[ Teste completo ]
```

Ou manter botão principal e opção secundária:

```txt
Iniciar teste rápido
Teste completo
```

Recomendação: começar com dois botões claros.

### 8.7. Critérios de aceite

```txt
Usuário consegue escolher rápido ou completo.
Resultado salva o modo usado.
Histórico mostra o modo usado.
Relatório mostra o modo usado.
Teste rápido consome menos dados.
Teste completo mantém maior precisão.
```

### 8.8. Testes obrigatórios

```txt
Selecionar quick chama runSpeedTest com mode quick.
Selecionar complete chama runSpeedTest com mode complete.
Histórico salva testMode.
PDF exibe modo usado.
```

### 8.9. Esforço

```txt
Tamanho: M
Estimativa: 1 dia
IA recomendada: Claude Sonnet 4.6
```

## 9. Feature 2 — Diagnóstico “O que fazer agora”

### 9.1. Objetivo

Transformar o resultado em ação prática.

O usuário não quer apenas saber que está “instável”. Ele quer saber o que fazer.

### 9.2. Comportamento esperado

Após cada teste, exibir um card:

```txt
O que fazer agora
```

Com até 3 recomendações relevantes.

### 9.3. Exemplos de saída

Caso upload baixo:

```txt
O envio de dados está baixo.
Isso pode atrapalhar chamadas de vídeo e envio de arquivos.
Teste novamente perto do roteador.
```

Caso resposta alta:

```txt
A resposta da conexão está lenta.
Isso pode causar atraso em jogos e chamadas.
Faça um teste perto do roteador para comparar.
```

Caso resultado ótimo:

```txt
Nada urgente.
Sua conexão está boa para o uso principal.
```

Caso problema grave:

```txt
A conexão está muito instável.
Repita o teste em outro horário. Se o problema continuar, gere um relatório para suporte.
```

### 9.4. Motor de recomendação

Criar:

```txt
src/domain/diagnosis/recommendations.ts
```

Função:

```ts
export function buildRecommendations(
  result: SpeedTestRawResult,
  diagnosis: DiagnosisResult,
  context?: DiagnosisContext
): Recommendation[]
```

### 9.5. Contexto opcional

```ts
export interface DiagnosisContext {
  hasHistory: boolean;
  recentTestsCount: number;
  repeatedProblem?: boolean;
  locationLabel?: string;
  isNearRouter?: boolean;
  isMobileData?: boolean;
}
```

### 9.6. Regras iniciais

```txt
Se download baixo:
- recomendar repetir perto do roteador;
- recomendar fechar apps usando internet.

Se upload baixo:
- recomendar testar de novo;
- explicar impacto em chamadas/envio.

Se resposta alta:
- recomendar teste perto do roteador;
- recomendar modo gamer se usuário quiser jogos.

Se oscilação alta:
- recomendar comparar outro cômodo;
- recomendar reiniciar roteador se recorrente.

Se perda/falha alta:
- recomendar repetir teste;
- se recorrente, sugerir relatório para suporte.

Se tudo bom:
- não criar alerta desnecessário.
```

### 9.7. Critérios de aceite

```txt
Cada resultado mostra recomendações contextualizadas.
Não exibir lista genérica igual para todo resultado.
Não exibir mais de 3 recomendações principais.
Não culpar operadora com base em um único teste.
```

### 9.8. Testes obrigatórios

```txt
Resultado bom retorna recomendação neutra.
Upload baixo retorna recomendação de chamada/envio.
Latência alta retorna recomendação de teste perto do roteador.
Perda alta retorna recomendação de repetição.
Problema recorrente retorna recomendação de relatório.
```

### 9.9. Esforço

```txt
Tamanho: M/G
Estimativa: 1 a 2 dias
IA recomendada: Claude Sonnet 4.6
Auditoria: Claude Opus 4.7
```

## 10. Feature 3 — Modo Prova Real

### 10.1. Objetivo

Criar um fluxo guiado para gerar evidência útil ao usuário.

Não é prova legal. Não é medição oficial. É um relatório organizado para conversar com suporte.

### 10.2. Nome da feature

```txt
Prova Real
```

### 10.3. Posicionamento

```txt
Faça testes em horários diferentes e gere um resumo simples para entender se o problema se repete.
```

### 10.4. Fluxo do usuário

```txt
1. Usuário toca em “Prova Real”.
2. App explica que serão necessários vários testes.
3. Usuário escolhe meta:
   - 3 testes;
   - 5 testes;
   - 10 testes.
4. App salva sessão de prova.
5. Usuário executa testes em horários diferentes.
6. App acompanha progresso.
7. Ao final, gera relatório.
```

### 10.5. Tela inicial da feature

Título:

```txt
Prova Real
```

Texto:

```txt
Faça alguns testes em horários diferentes para entender se o problema acontece de forma repetida.
```

Aviso:

```txt
Um teste isolado não confirma problema permanente. A Prova Real ajuda a comparar medições.
```

Botões:

```txt
Começar com 3 testes
Começar com 5 testes
```

### 10.6. Modelo de dados

```ts
export interface ProofSession {
  id: string;
  startedAt: number;
  finishedAt?: number;
  targetTests: number;
  testIds: string[];
  status: 'active' | 'completed' | 'cancelled';
  label?: string;
}
```

### 10.7. Insights da Prova Real

Gerar:

```txt
média de download;
média de upload;
melhor teste;
pior teste;
maior resposta;
maior oscilação;
quantidade de testes com instabilidade;
quantidade de testes com perda/falhas;
quantidade de testes abaixo da classificação boa;
variação percentual entre melhor e pior download;
```

### 10.8. Frases geradas

Caso problema recorrente:

```txt
O problema apareceu em testes diferentes. Vale testar mais perto do roteador e acionar a operadora se continuar.
```

Caso variação alta:

```txt
A velocidade variou bastante entre os testes. Isso pode indicar oscilação na rede ou diferença de sinal Wi‑Fi.
```

Caso tudo bom:

```txt
Os testes ficaram bons na maior parte do período. Não há sinal forte de problema recorrente.
```

### 10.9. Relatório

Gerar relatório com:

```txt
Resumo
Quantidade de testes
Período
Médias
Melhor/pior teste
Problemas encontrados
Observação de limitação
Tabela de medições
```

### 10.10. Observação obrigatória

Todo relatório deve conter:

```txt
Este relatório foi gerado a partir de medições feitas no aparelho do usuário. Os resultados podem variar conforme Wi‑Fi, distância do roteador, horário e uso da rede por outros dispositivos.
```

### 10.11. Critérios de aceite

```txt
Usuário consegue iniciar sessão Prova Real.
Sessão salva progresso.
Testes vinculados à sessão.
Relatório final é gerado.
App não afirma descumprimento da operadora.
App recomenda próximos passos.
```

### 10.12. Testes obrigatórios

```txt
Criar ProofSession.
Adicionar teste à sessão.
Completar sessão ao atingir target.
Gerar insight de problema recorrente.
Gerar relatório com aviso obrigatório.
```

### 10.13. Esforço

```txt
Tamanho: G
Estimativa: 3 a 5 dias
IA recomendada: Claude Sonnet 4.6
Auditoria: Claude Opus 4.7
```

## 11. Feature 4 — Teste por cômodo/local

### 11.1. Objetivo

Ajudar o usuário a descobrir se o problema está na internet ou na cobertura Wi‑Fi da casa.

### 11.2. Nome da feature

```txt
Teste por local
```

ou:

```txt
Mapa da casa
```

Recomendação inicial:

```txt
Teste por local
```

É mais simples e menos ambicioso que “mapa”.

### 11.3. Locais sugeridos

```txt
Perto do roteador
Sala
Quarto
Escritório
Cozinha
Varanda
Outro
```

### 11.4. Fluxo

```txt
1. Usuário escolhe “Teste por local”.
2. App pergunta onde ele está.
3. Usuário escolhe ou cria local.
4. Executa teste.
5. Resultado fica associado ao local.
6. Histórico passa a permitir filtro por local.
7. App compara locais.
```

### 11.5. Modelo de dados

```ts
export interface TestLocation {
  id: string;
  label: string;
  type:
    | 'near_router'
    | 'living_room'
    | 'bedroom'
    | 'office'
    | 'kitchen'
    | 'other';
  createdAt: number;
}
```

Adicionar ao `TestRecordV2`:

```ts
locationId?: string;
locationLabel?: string;
```

### 11.6. Insights por local

Criar:

```txt
src/domain/experiments/locationComparison.ts
```

Função:

```ts
export function compareLocations(records: TestRecordV2[]): LocationInsight[]
```

### 11.7. Exemplos de insights

```txt
A sala teve a melhor média de download.
O quarto teve queda de 72% em relação ao teste perto do roteador.
A conexão no escritório apresentou mais oscilação.
```

### 11.8. Diagnóstico de Wi‑Fi provável

Se houver teste perto do roteador e teste em outro local:

```txt
Se perto do roteador está bom
e outro cômodo está ruim
então provável problema de cobertura Wi‑Fi.
```

Mensagem:

```txt
A internet parece boa perto do roteador, mas perde desempenho neste local. O problema pode estar na cobertura Wi‑Fi.
```

### 11.9. Critérios de aceite

```txt
Usuário consegue associar teste a local.
Histórico mostra local.
Filtro por local funciona.
Comparação perto vs outro local gera diagnóstico.
Não usar geolocalização obrigatória.
Não pedir permissão de localização por padrão.
```

### 11.10. Testes obrigatórios

```txt
Criar local.
Salvar teste com local.
Comparar local com melhor/pior desempenho.
Detectar provável problema de Wi‑Fi.
```

### 11.11. Esforço

```txt
Tamanho: M/G
Estimativa: 2 a 4 dias
IA recomendada: Claude Sonnet 4.6
```

## 12. Feature 5 — Comparativo perto vs longe do roteador

### 12.1. Objetivo

Resolver uma dúvida comum:

```txt
Minha internet é ruim ou o Wi‑Fi não chega bem aqui?
```

### 12.2. Fluxo

```txt
1. App pede teste perto do roteador.
2. Usuário executa teste.
3. App pede teste no local onde a internet fica ruim.
4. Usuário executa teste.
5. App compara resultados.
```

### 12.3. Tela inicial

```txt
Teste de cobertura Wi‑Fi
Vamos comparar a conexão perto do roteador com o local onde você sente problema.
```

Botão:

```txt
Começar comparação
```

### 12.4. Modelo de dados

```ts
export interface RouterDistanceComparison {
  id: string;
  startedAt: number;
  nearRouterTestId?: string;
  targetLocationTestId?: string;
  targetLocationLabel?: string;
  status: 'started' | 'near_done' | 'completed' | 'cancelled';
}
```

### 12.5. Cálculos

```ts
downloadDropPercent =
  ((near.downloadMbps - far.downloadMbps) / near.downloadMbps) * 100;

uploadDropPercent =
  ((near.uploadMbps - far.uploadMbps) / near.uploadMbps) * 100;

latencyIncreasePercent =
  ((far.latencyMs - near.latencyMs) / near.latencyMs) * 100;
```

### 12.6. Diagnóstico

Caso queda forte:

```txt
A velocidade caiu muito longe do roteador. O problema parece estar na cobertura Wi‑Fi.
```

Caso os dois ruins:

```txt
A conexão ficou ruim nos dois pontos. O problema pode não ser apenas o Wi‑Fi da casa.
```

Caso os dois bons:

```txt
A conexão ficou boa nos dois pontos testados.
```

### 12.7. Critérios de corte

```txt
Queda de download acima de 50%: queda relevante.
Queda acima de 75%: queda forte.
Aumento de resposta acima de 100%: piora relevante.
Oscilação acima de 50 ms no ponto distante: sinal instável.
```

### 12.8. Critérios de aceite

```txt
Fluxo guiado em duas etapas.
Comparação clara.
Diagnóstico gerado.
Histórico vincula os dois testes.
```

### 12.9. Esforço

```txt
Tamanho: M
Estimativa: 1 a 2 dias
IA recomendada: Claude Sonnet 4.6
```

## 13. Feature 6 — Modo Gamer

### 13.1. Objetivo

Criar uma análise específica para jogos online.

O usuário gamer não se importa só com download. Ele quer saber se vai ter lag, delay, travamento ou queda.

### 13.2. Nome da feature

```txt
Modo Gamer
```

### 13.3. Perfis de jogo

```txt
Casual online
FPS competitivo
MOBA
Battle Royale
Cloud gaming
Console no Wi‑Fi
Console no cabo
```

### 13.4. Entrada do usuário

Tela:

```txt
Que tipo de jogo você quer avaliar?
```

Opções:

```txt
Jogos casuais
Competitivo
Cloud gaming
Console
```

### 13.5. Regras iniciais

#### Jogos casuais

```txt
download >= 5 Mbps
upload >= 1 Mbps
resposta <= 100 ms
oscilação <= 40 ms
perda <= 2%
```

#### FPS competitivo

```txt
download >= 10 Mbps
upload >= 2 Mbps
resposta <= 50 ms
oscilação <= 20 ms
perda <= 1%
```

#### MOBA / Battle Royale

```txt
download >= 10 Mbps
upload >= 2 Mbps
resposta <= 70 ms
oscilação <= 25 ms
perda <= 1%
```

#### Cloud gaming

```txt
download >= 35 Mbps
upload >= 5 Mbps
resposta <= 40 ms
oscilação <= 15 ms
perda <= 0.5%
```

### 13.6. Mensagens

Bom:

```txt
Boa conexão para esse tipo de jogo.
```

Atenção:

```txt
A velocidade é suficiente, mas a resposta ou oscilação pode causar lag.
```

Ruim:

```txt
Essa conexão pode causar atraso, travamentos ou quedas durante partidas.
```

### 13.7. Diagnóstico específico

Exemplo:

```txt
Seu download está alto, mas a resposta ficou acima do ideal para FPS competitivo.
```

Exemplo:

```txt
A oscilação está baixa. Isso é bom para jogos em tempo real.
```

### 13.8. Critérios de aceite

```txt
Usuário escolhe perfil gamer.
Resultado muda conforme perfil.
Diagnóstico explica motivo.
Não usar só download para avaliar jogo.
```

### 13.9. Testes obrigatórios

```txt
Resultado com 500 Mbps e 100 ms não deve ser ótimo para FPS.
Resultado com 50 Mbps, 30 ms, 5 ms jitter e 0% perda deve ser bom.
Cloud gaming exige critérios mais rígidos.
```

### 13.10. Esforço

```txt
Tamanho: M
Estimativa: 1 a 2 dias
IA recomendada: Claude Sonnet 4.6
```

## 14. Feature 7 — Teste de travamento

### 14.1. Objetivo

Detectar casos em que a velocidade é alta, mas a experiência é ruim.

Isso acontece quando a resposta da conexão piora durante download/upload, causando lag em jogos, chamadas e reuniões.

### 14.2. Nome da feature

```txt
Teste de travamento
```

Evitar nomes técnicos como:

```txt
Bufferbloat
Latency under load
Stress latency
```

Esses nomes podem existir apenas nos detalhes técnicos.

### 14.3. Fluxo técnico

Medir:

```txt
resposta em repouso;
resposta durante download;
resposta durante upload;
diferença percentual;
pior resposta observada;
```

### 14.4. Dados

```ts
export interface StressLatencyResult {
  idleLatencyMs: number;
  downloadLatencyMs: number;
  uploadLatencyMs: number;
  downloadImpactPercent: number;
  uploadImpactPercent: number;
  worstLatencyMs: number;
  rating: 'good' | 'warning' | 'bad';
}
```

### 14.5. Regra sugerida

```txt
Bom:
impacto menor que 50% e pior resposta menor que 100 ms.

Atenção:
impacto entre 50% e 150% ou pior resposta entre 100 e 200 ms.

Ruim:
impacto acima de 150% ou pior resposta acima de 200 ms.
```

### 14.6. Mensagens

Bom:

```txt
A conexão continuou respondendo bem durante o uso intenso.
```

Atenção:

```txt
A resposta piorou durante o uso intenso. Isso pode causar travamentos em chamadas ou jogos.
```

Ruim:

```txt
A conexão travou bastante durante o uso intenso. Mesmo com boa velocidade, a experiência pode ser ruim.
```

### 14.7. UI

Na tela de resultado, adicionar card:

```txt
Teste de travamento
```

Com:

```txt
Resposta normal: 30 ms
Durante download: 75 ms
Durante upload: 140 ms
Status: Atenção
```

### 14.8. Critérios de aceite

```txt
Teste mede resposta antes/durante carga.
Resultado explica impacto.
Não confundir com download/upload.
Não rodar por padrão no teste rápido se aumentar muito consumo.
```

### 14.9. Esforço

```txt
Tamanho: G
Estimativa: 3 a 5 dias
IA recomendada: Claude Sonnet 4.6
Auditoria técnica: Codex
```

## 15. Feature 8 — Antes e Depois

### 15.1. Objetivo

Permitir que o usuário teste se uma ação melhorou a internet.

Exemplos:

```txt
reiniciei o roteador;
mudei de cômodo;
troquei para Wi‑Fi 5 GHz;
liguei no cabo;
mudei o roteador de lugar;
desliguei repetidor ruim;
troquei DNS;
```

### 15.2. Fluxo

```txt
1. Usuário escolhe “Antes e Depois”.
2. Faz teste inicial.
3. App pede para realizar uma ação.
4. Usuário faz segundo teste.
5. App compara.
```

### 15.3. Ações sugeridas

```txt
Reiniciar roteador
Chegar mais perto do roteador
Trocar para Wi‑Fi 5 GHz
Testar no cabo
Fechar apps usando internet
Desligar VPN
Outro
```

### 15.4. Modelo de dados

```ts
export interface BeforeAfterExperiment {
  id: string;
  actionLabel: string;
  beforeTestId?: string;
  afterTestId?: string;
  startedAt: number;
  completedAt?: number;
}
```

### 15.5. Resultado

```txt
Antes: 90 Mbps
Depois: 420 Mbps
Melhora: 366%
```

Mensagem:

```txt
A ação melhorou bastante sua conexão.
```

Ou:

```txt
Não houve melhora relevante. O problema pode estar em outro ponto.
```

### 15.6. Critérios de aceite

```txt
Fluxo salva teste antes e depois.
Comparação é clara.
App calcula melhora/piora.
Resultado pode ser compartilhado.
```

### 15.7. Esforço

```txt
Tamanho: M
Estimativa: 1 a 2 dias
IA recomendada: Claude Sonnet 4.6
```

## 16. Feature 9 — Histórico inteligente

### 16.1. Objetivo

Transformar histórico em análise, não apenas lista.

### 16.2. Insights esperados

```txt
Sua média de download nos últimos 7 testes foi 420 Mbps.
O upload caiu 35% em relação à média.
A resposta ficou alta em 3 dos últimos 5 testes.
A conexão ficou melhor perto do roteador.
O quarto teve o pior desempenho.
```

### 16.3. Períodos

```txt
Hoje
7 dias
30 dias
Todos
```

### 16.4. Agrupamentos

```txt
por local;
por modo de teste;
por tipo de conexão;
por servidor;
por horário;
```

### 16.5. Modelo de insight

```ts
export interface HistoryInsight {
  id: string;
  type:
    | 'trend'
    | 'drop'
    | 'improvement'
    | 'recurring_issue'
    | 'best_location'
    | 'worst_location'
    | 'stable_period';

  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}
```

### 16.6. Critérios de aceite

```txt
Histórico mostra pelo menos 3 insights quando há dados suficientes.
Com menos de 3 testes, explicar que ainda não há histórico suficiente.
Não mostrar insight falso com poucos dados.
```

### 16.7. Esforço

```txt
Tamanho: M/G
Estimativa: 2 a 3 dias
IA recomendada: Claude Sonnet 4.6
```

## 17. Feature 10 — Compartilhamento avançado

### 17.1. Objetivo

Permitir compartilhar resultado de forma bonita, clara e segura.

### 17.2. Formatos

```txt
Card imagem
Texto simples
PDF
Relatório de suporte
```

### 17.3. Privacidade

Por padrão:

```txt
ocultar IP;
não mostrar localização precisa;
não exibir identificadores sensíveis;
não compartilhar histórico sem confirmação;
```

### 17.4. Card sugerido

```txt
LINKA SpeedTest
Conexão boa

Download: 569 Mbps
Upload: 64.7 Mbps
Resposta: 44 ms
Estabilidade: Muito estável

Bom para:
Jogos online
Streaming 4K
Videochamada
Home Office
```

### 17.5. Web Share

Usar Web Share API se disponível.

Fallback:

```txt
copiar texto;
baixar imagem;
baixar PDF;
```

### 17.6. Critérios de aceite

```txt
Compartilhar funciona quando Web Share disponível.
Fallback funciona quando não disponível.
IP oculto por padrão.
Card gerado é legível no celular.
```

### 17.7. Esforço

```txt
Tamanho: M
Estimativa: 1 a 2 dias
IA recomendada: Claude Sonnet 4.6
```

## 18. Feature 11 — Modo privado

### 18.1. Objetivo

Usar privacidade como diferencial de produto.

### 18.2. Comportamento

Criar painel:

```txt
Privacidade
```

Opções:

```txt
Ocultar IP ao compartilhar
Salvar histórico neste aparelho
Limpar histórico
Não incluir operadora no relatório
Não incluir servidor no relatório
```

### 18.3. Texto institucional

```txt
Seus testes ficam salvos neste aparelho. Você decide quando exportar ou compartilhar.
```

### 18.4. Critérios de aceite

```txt
IP oculto por padrão no compartilhamento.
Usuário pode limpar histórico.
Usuário entende que dados são locais.
```

### 18.5. Esforço

```txt
Tamanho: P/M
Estimativa: 0.5 a 1 dia
IA recomendada: Claude Sonnet 4.6
```

## 19. Feature 12 — Rotina de testes com lembrete

### 19.1. Objetivo

Ajudar o usuário a repetir testes em horários diferentes.

### 19.2. Limitação

Não prometer teste automático em background. Em PWA, o comportamento em segundo plano depende de navegador, permissão, suporte e política do sistema. A abordagem segura é usar lembrete ou notificação quando suportado.

### 19.3. Fluxo

```txt
Quer repetir o teste hoje à noite para comparar?
```

Opções:

```txt
Lembrar em 2 horas
Lembrar amanhã
Não lembrar
```

### 19.4. Fallback

Se notificação não for suportada:

```txt
Crie um lembrete manual ou volte ao app mais tarde para continuar.
```

### 19.5. Critérios de aceite

```txt
Checar suporte antes de pedir permissão.
Não pedir permissão cedo demais.
Não incomodar usuário após resultado bom.
Usar principalmente na Prova Real.
```

### 19.6. Esforço

```txt
Tamanho: M/G
Estimativa: 2 a 4 dias
IA recomendada: Claude Sonnet 4.6
Auditoria: Claude Opus 4.7
```

## 20. Feature 13 — Assistente LINKA

### 20.1. Objetivo

Criar um fluxo de perguntas e respostas para orientar diagnóstico.

### 20.2. Primeira versão sem IA generativa

Não começar usando LLM. A primeira versão deve ser árvore de decisão.

### 20.3. Perguntas

```txt
Você está perto do roteador?
Está usando Wi‑Fi ou rede móvel?
O problema acontece em todos os cômodos?
Outros aparelhos também estão ruins?
Você está em chamada, jogo ou streaming?
Já reiniciou o roteador?
O problema acontece sempre ou só em alguns horários?
```

### 20.4. Saídas

```txt
Provável problema de cobertura Wi‑Fi.
Provável instabilidade momentânea.
Pode ser congestionamento por horário.
Pode ser limitação do aparelho ou rede móvel.
Vale gerar Prova Real.
```

### 20.5. Modelo

```ts
export interface AssistantQuestion {
  id: string;
  text: string;
  options: AssistantOption[];
}

export interface AssistantOption {
  id: string;
  label: string;
  nextQuestionId?: string;
  resultId?: string;
}
```

### 20.6. Critérios de aceite

```txt
Fluxo não precisa de backend.
Fluxo não promete diagnóstico definitivo.
Fluxo recomenda próximo teste.
Fluxo usa resultado medido como contexto.
```

### 20.7. Esforço

```txt
Tamanho: GG
Estimativa: 1 a 2 semanas
IA recomendada: Claude Opus 4.7 para desenho + Claude Sonnet 4.6 para implementação
```

## 21. Ordem recomendada de implementação

## Fase 1 — Fundamento de produto

### Objetivo

Corrigir base e preparar o app para evoluir.

### Features

```txt
Teste rápido / completo
Diagnóstico “O que fazer agora”
Compartilhamento avançado básico
Modo privado básico
```

### Esforço

```txt
M/G — 3 a 5 dias
```

### IA recomendada

```txt
Claude Sonnet 4.6
```

## Fase 2 — Diferenciação forte

### Objetivo

Criar features que grandes apps não explicam bem.

### Features

```txt
Prova Real
Teste por local
Comparativo perto vs longe do roteador
Histórico inteligente
```

### Esforço

```txt
G — 1 a 2 semanas
```

### IA recomendada

```txt
Claude Sonnet 4.6 para implementação
Claude Opus 4.7 para auditoria
```

## Fase 3 — Segmentação

### Objetivo

Atender casos de uso específicos.

### Features

```txt
Modo Gamer
Teste de travamento
Antes e Depois
```

### Esforço

```txt
G — 1 semana
```

### IA recomendada

```txt
Claude Sonnet 4.6 + Codex para testes
```

## Fase 4 — Produto avançado

### Objetivo

Transformar o LINKA em assistente de diagnóstico.

### Features

```txt
Assistente LINKA
Rotina de testes
Relatórios avançados
```

### Esforço

```txt
GG — 2 semanas ou mais
```

### IA recomendada

```txt
Claude Opus 4.7 para arquitetura
Claude Sonnet 4.6 para implementação faseada
```

## 22. Roadmap resumido

```txt
P0:
- Teste rápido/completo
- O que fazer agora
- Compartilhamento seguro
- Modo privado

P1:
- Prova Real
- Teste por local
- Perto vs longe do roteador
- Histórico inteligente

P2:
- Modo Gamer
- Teste de travamento
- Antes e Depois

P3:
- Assistente LINKA
- Rotina de testes
- Relatórios avançados
```

## 23. Critérios globais de qualidade

Toda feature nova deve respeitar:

```txt
não usar linguagem técnica sem explicação;
não culpar operadora com base em teste único;
não prometer precisão que o PWA não tem;
não exigir login;
não exigir localização;
não compartilhar IP por padrão;
salvar dados localmente sempre que possível;
ter fallback quando API não for suportada;
ter teste unitário para regra de diagnóstico;
ter texto claro para usuário comum;
funcionar bem no celular.
```

## 24. Testes globais obrigatórios

Criar ou manter testes para:

```txt
diagnosisEngine;
recommendations;
useCaseRules;
historyInsights;
locationComparison;
beforeAfter;
gamerMode;
stressTest;
supportReport;
shareCard;
```

### Comandos obrigatórios ao final de cada fase

```bash
npm run test
npm run build
```

Se existir lint:

```bash
npm run lint
```

## 25. Critérios de aceite por release

Uma release só deve ser considerada pronta se:

```txt
não quebrar o teste principal;
não quebrar histórico existente;
não perder dados antigos do usuário;
não expor IP em compartilhamento por padrão;
não usar diagnóstico contraditório;
não chamar conexão desconhecida de celular;
não misturar estabilidade com classificação principal;
não exibir termos técnicos sem necessidade;
não criar feature sem fallback PWA;
passar build;
passar testes.
```

## 26. Prompt para IA implementar a Fase 1

```txt
Você vai implementar a Fase 1 de evolução do LINKA SpeedTest.

Leia o documento EvoluçãoSpeedTest.md inteiro antes de alterar código.

Objetivo da Fase 1:
- criar Teste rápido e Teste completo;
- criar card “O que fazer agora”;
- melhorar compartilhamento básico;
- iniciar modo privado básico.

Restrições:
- não criar backend;
- não criar login;
- não alterar identidade visual principal;
- não trocar Cloudflare;
- não prometer monitoramento automático;
- não expor IP no compartilhamento por padrão;
- não quebrar histórico existente.

Tarefas:
1. Criar estrutura de domínio em src/domain.
2. Criar testModes.ts.
3. Adaptar runSpeedTest para receber mode: quick | complete.
4. Salvar testMode no histórico.
5. Criar recommendations.ts.
6. Exibir card “O que fazer agora” na tela de resultado.
7. Criar opção de compartilhamento com IP oculto.
8. Ajustar textos para cliente final.
9. Criar testes unitários para testModes e recommendations.
10. Rodar npm run test e npm run build.

Ao final, entregar:
- arquivos alterados;
- features implementadas;
- testes criados;
- comandos executados;
- limitações encontradas;
- próximos passos recomendados.
```

## 27. Prompt para IA implementar a Fase 2

```txt
Você vai implementar a Fase 2 de evolução do LINKA SpeedTest.

Objetivo:
- implementar Prova Real;
- implementar Teste por local;
- implementar Comparativo perto vs longe do roteador;
- implementar Histórico inteligente.

Restrições:
- não usar geolocalização obrigatória;
- não criar backend;
- não dizer que relatório prova descumprimento da operadora;
- não apagar histórico antigo;
- não criar fluxo complexo demais.

Tarefas:
1. Criar modelo ProofSession.
2. Criar fluxo de Prova Real.
3. Vincular testes à sessão.
4. Criar relatório de Prova Real.
5. Criar modelo TestLocation.
6. Permitir associar teste a local.
7. Criar comparação perto vs longe do roteador.
8. Criar historyInsights.ts.
9. Atualizar tela de histórico com insights.
10. Criar testes unitários.
11. Rodar npm run test e npm run build.

Critério crítico:
O relatório deve sempre deixar claro que os testes foram feitos no aparelho do usuário e podem variar por Wi‑Fi, horário, distância e uso da rede.
```

## 28. Prompt para IA implementar a Fase 3

```txt
Você vai implementar a Fase 3 de evolução do LINKA SpeedTest.

Objetivo:
- implementar Modo Gamer;
- implementar Teste de travamento;
- implementar Antes e Depois.

Restrições:
- não usar termos técnicos na UI principal;
- não chamar bufferbloat de bufferbloat para usuário comum;
- não aumentar consumo de dados sem avisar;
- não rodar teste de travamento no modo rápido sem confirmação.

Tarefas:
1. Criar gamerMode.ts.
2. Criar perfis gamer.
3. Criar tela ou seção de Modo Gamer.
4. Criar stressTest.ts.
5. Medir resposta em repouso e durante carga.
6. Exibir resultado como Teste de travamento.
7. Criar beforeAfter.ts.
8. Criar fluxo Antes e Depois.
9. Criar testes unitários.
10. Rodar npm run test e npm run build.
```

## 29. Prompt para IA implementar a Fase 4

```txt
Você vai implementar a Fase 4 de evolução do LINKA SpeedTest.

Objetivo:
- criar Assistente LINKA;
- criar rotina de testes com lembrete;
- evoluir relatórios avançados.

Restrições:
- não usar LLM na primeira versão;
- criar árvore de decisão local;
- não prometer teste automático em background;
- detectar suporte antes de usar notificações;
- oferecer fallback quando notificações não estiverem disponíveis.

Tarefas:
1. Criar assistantFlow.ts.
2. Criar perguntas e respostas.
3. Usar resultado do teste como contexto.
4. Gerar diagnóstico guiado.
5. Criar fluxo de lembrete para Prova Real.
6. Implementar notificação apenas se suportada.
7. Criar fallback manual.
8. Melhorar relatório de suporte.
9. Criar testes.
10. Rodar npm run test e npm run build.
```

## 30. Resumo executivo

O LINKA SpeedTest deve evoluir para um produto de diagnóstico, não apenas medição.

A feature matadora é:

```txt
Diagnóstico guiado + Prova Real + Teste por local
```

Essa combinação permite dizer ao usuário:

```txt
Sua internet não está apenas rápida ou lenta.
O LINKA ajuda você a entender onde está o problema e o que fazer.
```

Essa é a diferenciação mais forte dentro das limitações de um PWA.

O caminho recomendado é:

```txt
Começar pequeno.
Criar features úteis.
Evitar promessas técnicas impossíveis.
Explicar tudo em linguagem simples.
Usar histórico para gerar inteligência.
Transformar teste de velocidade em diagnóstico acionável.
```

## 31. Decisão recomendada

Implementar a evolução em fases.

Não tentar construir tudo de uma vez.

Prioridade real:

```txt
1. Teste rápido/completo
2. O que fazer agora
3. Prova Real
4. Teste por local
5. Compartilhamento seguro
6. Histórico inteligente
7. Modo Gamer
8. Teste de travamento
9. Antes e Depois
10. Assistente LINKA
```

Com essa ordem, o LINKA deixa de ser só um speedtest e passa a ser um produto com proposta própria.

---

## 32. Feature Contexto Wi-Fi via Atalho iOS — Roadmap de Fases

A Fase 1 (MVP) foi implementada em 2026-05. As fases seguintes estão registradas aqui para referência.

### Fase 1 — MVP (implementado)
- Tipo `WifiContext` e `WifiContextSource` em `src/types/index.ts`.
- Utilitários em `src/features/ios-wifi-context/wifiShortcut.ts`.
- Botão outlined "Medir com contexto Wi-Fi do iPhone" na StartScreen (só iOS).
- Handler de callback `/wifi-callback` na URL (on mount em App.tsx).
- `WifiContextCard` simples na ResultScreen.
- `wifiContext` propagado para `SpeedTestResult` e `TestRecord`.
- SPA routing via `public/_redirects`.

### Fase 2 — Diagnóstico combinado
- Classificadores completos: `classifySnr`, `classifyLinkRate`.
- Regras cruzadas Wi-Fi × speedtest (seção 15 da spec):
  - Internet ruim + Wi-Fi ruim → problema de cobertura.
  - Internet ruim + Wi-Fi bom → problema de operadora/WAN.
  - Latência ruim + Wi-Fi ruim → instabilidade local.
  - Velocidade boa + Wi-Fi fraco → risco de oscilação.
  - Wi-Fi bom + latência sob carga ruim → saturação.
- Bloco "Detalhes avançados" no `WifiContextCard` com RSSI/SNR numéricos.
- Ajuste do `combineDiagnostics` para consumir `WifiContext` (hoje consome `WifiDiagnosticResult`).

### Fase 3 — Privacidade e exportação
- Mascaramento de BSSID (`aa:bb:••:••:ee:ff`) e IP local (`192.168.1.xxx`) por padrão.
- PDF padrão sem BSSID/IP; opção "Incluir dados técnicos do Wi-Fi" desligada por padrão.
- Compartilhamento: excluir identificadores sensíveis do texto/imagem compartilhados.

### Fase 4 — Robustez
- Migrar retorno do atalho para `ctx=base64url-json` (Fase 2+ do protocolo).
- Validação forte do `sessionId` (match com o ID enviado no deep link).
- Testes manuais iOS: PWA instalado, Safari, cancelamento, atalho ausente.
- Considerar QR Code para instalação do atalho na tela `/shortcut-help`.
