# LINKA SpeedTest — Pendências Técnicas de Diagnóstico

## 1. Objetivo

Este documento orienta uma IA de desenvolvimento a corrigir, consolidar e testar as regras de diagnóstico do PWA **LINKA SpeedTest**.

O objetivo não é redesenhar o app, nem trocar o motor de medição. O foco é tornar o diagnóstico mais coerente, confiável e claro para usuário final.

O app já possui boa estrutura: React, Vite, TypeScript, Vitest, PWA com `vite-plugin-pwa`, histórico local, exportação em PDF e medição via Cloudflare.

---

## 2. IA recomendada, modelo e esforço

### IA principal recomendada

**Claude Code — Sonnet 4.6**

Motivo:

- melhor custo-benefício para refatoração localizada;
- bom em TypeScript/React;
- suficiente para alterar regras, extrair utilitários, criar testes e ajustar fraseologia;
- menor risco de overengineering do que usar um modelo mais caro logo de início.

### Modelo de auditoria recomendado

**Claude Code — Opus 4.7** ou **Codex em modo revisão**

Usar apenas depois da implementação, para uma passada de auditoria. O papel dessa IA não é reescrever tudo, e sim verificar:

- se as regras foram aplicadas sem duplicidade;
- se o histórico recalcula classificação corretamente;
- se os testes cobrem os cenários críticos;
- se não sobrou texto antigo na UI;
- se não houve alteração indevida no motor de medição.

### Esforço estimado

**Tamanho: M**

Estimativa realista:

- implementação principal: **4 a 6 horas**;
- testes unitários: **1 a 2 horas**;
- auditoria/refino: **1 hora**;
- validação manual no celular: **30 a 60 minutos**.

Total provável: **6 a 9 horas**.

### Ordem recomendada de execução

1. Claude Code Sonnet 4.6 implementa as correções deste documento.
2. Rodar `npm run test` e `npm run build`.
3. Claude Code Opus 4.7 ou Codex faz auditoria do diff.
4. Testar manualmente no celular.
5. Só então publicar em produção.

---

## 3. Diagnóstico atual

### 3.1. Problema principal

As regras atuais estão parcialmente boas, mas ainda existem inconsistências entre:

- classificação principal;
- chips/tags;
- mensagens exibidas;
- grid “Para o que sua internet serve?”;
- histórico;
- PDF exportado;
- detecção de conexão no iOS;
- uso de termos técnicos para usuário final.

O risco principal é o app parecer visualmente confiável, mas dar diagnóstico contraditório.

Exemplo crítico observado:

```txt
Download: 569 Mbps
Upload: 64.7 Mbps
Resposta: 44 ms
Oscilação: 9 ms
Perda: 0%
Resultado exibido em Games online: Pode falhar
```

Esse resultado deveria ser **Bom para games online**. O diagnóstico atual está severo demais para esse caso.

---

## 4. Arquivos envolvidos

A IA deve revisar e alterar, no mínimo:

```txt
src/utils/classifier.ts
src/screens/ResultScreen.tsx
src/screens/HistoryScreen.tsx
src/screens/StartScreen.tsx
src/components/BottomSheet.tsx
src/hooks/useDeviceInfo.ts
src/utils/history.ts
src/utils/pdfExport.ts
src/utils/speedtest.ts
```

Alterar `src/utils/speedtest.ts` apenas se necessário para:

- expor modo rápido/completo;
- ajustar metadados de consumo;
- passar explicitamente o modo de teste para o histórico.

Também criar ou atualizar testes relacionados ao diagnóstico.

---

## 5. Avaliação das regras atuais

### 5.1. `classifier.ts`

O arquivo `classifier.ts` já concentra parte importante da regra, o que é positivo. Porém, há incoerências.

Problemas encontrados:

1. `fair` retorna o headline **“Conexão estável”**. Isso é incorreto, porque `fair` mede aceitabilidade geral, não estabilidade.
2. A regra `fair` aceita `download >= 10 Mbps`, mas o critério consolidado deve ser `download >= 25 Mbps`.
3. A regra `good` aceita perda até `1.5%`, mas a regra consolidada deve usar `1%`.
4. Quando `packetLoss > 2`, o código adiciona `packetLoss`, mas não adiciona automaticamente `unstable`.
5. Quando `veryUnstable` está ativo, `unstable` também deveria estar ativo.
6. A mensagem de `excellent` promete demais: “qualquer aplicativo sem limitações” e “funcionam perfeitamente”. Isso é exagerado. Internet não deve ser comunicada como garantia absoluta.

### 5.2. `ResultScreen.tsx`

O grid de uso está dentro de `ResultScreen.tsx`. O problema mais visível está em games.

A regra atual só marca games como “Bom” se a resposta for `<= 40 ms`, mesmo com oscilação baixa e perda zerada.

Isso gera diagnóstico ruim para casos aceitáveis. Para jogos online comuns, `44 ms`, `9 ms` de oscilação e `0%` de perda deve ser considerado **Bom**.

### 5.3. `HistoryScreen.tsx`

O histórico ainda usa `qualityHeadline(r.quality)` baseado na classificação salva no momento do teste.

Problema: se a regra muda, registros antigos continuam carregando classificações antigas. Isso explica a permanência de labels como **“Conexão estável”**.

A qualidade deve ser recalculada na renderização ou o histórico deve ter migração de versão.

### 5.4. `history.ts`

O histórico salva `quality` e `tags` dentro do `TestRecord`. Isso é prático, mas cria dado derivado obsoleto.

Regra correta: salvar os dados brutos do teste e recalcular diagnóstico quando exibir, exportar ou compartilhar.

### 5.5. `useDeviceInfo.ts`

O código assume `mobile` em iOS/mobile quando `navigator.connection` não está disponível.

Problema: o app mostra “Celular” mesmo quando o usuário está em Wi‑Fi. Isso é ruim para credibilidade.

Correção: quando o tipo de conexão não for detectável, usar estado `unknown` ou exibir “Auto / Não identificado”, com opção manual de Wi‑Fi ou rede móvel.

### 5.6. `speedtest.ts`

O motor atual usa Cloudflare para resposta, download e upload. Ele possui dois presets: padrão e móvel.

O preset padrão consome aproximadamente 485 MB. O texto atual fala em ~400 MB.

O preset móvel consome aproximadamente 77 MB. O texto atual fala em ~70 MB.

Problema: a comunicação de consumo está imprecisa.

Correção: exibir “até 500 MB” para teste completo e “cerca de 80 MB” para teste móvel/rápido, ou implementar explicitamente `quick` e `complete`.

### 5.7. `pdfExport.ts`

O PDF usa `qualityHeadline`, `buildDiagnosis` e registros salvos. Isso significa que ele herda os problemas do classificador e do histórico.

Além disso, o PDF mostra `linka.app`, mas o app atualmente está publicado em `pages.dev`. Evitar domínio não oficial até haver domínio definitivo.

---

## 6. Referência regulatória e cuidado de linguagem

Usar valores de referência de qualidade apenas como orientação de diagnóstico, nunca como acusação direta contra operadora.

Valores de referência adotados pelo produto para banda larga fixa terrestre:

```txt
Resposta acima de 80 ms: atenção
Oscilação acima de 50 ms: atenção
Perda/falhas acima de 2%: atenção
```

Não dizer que uma única medição prova descumprimento da operadora.

Texto proibido:

```txt
A Anatel exige...
Sua operadora está descumprindo...
Reclame com sua operadora agora...
```

Texto permitido:

```txt
Esse valor ficou acima da referência usada para avaliar qualidade de banda larga fixa.
Repita o teste em outros horários para confirmar se o problema continua.
```

---

## 7. Regra consolidada de classificação principal

A classificação principal deve ser avaliada em ordem. A primeira regra atendida vence.

### 7.1. `excellent`

Critérios:

```txt
download >= 100 Mbps
upload >= 30 Mbps
resposta <= 30 ms
oscilação <= 5 ms
falhas/perda <= 0.5%
```

Headline:

```txt
Conexão excelente
```

Mensagem:

```txt
Sua internet está muito boa. Dá para assistir vídeos em alta qualidade, fazer chamadas e jogar online com tranquilidade.
```

### 7.2. `good`

Critérios:

```txt
download >= 50 Mbps
upload >= 10 Mbps
resposta <= 60 ms
oscilação <= 15 ms
falhas/perda <= 1%
```

Headline:

```txt
Conexão boa
```

Mensagem:

```txt
Sua internet está boa para o dia a dia. Vídeos, chamadas e trabalho remoto devem funcionar bem.
```

### 7.3. `fair`

Critérios:

```txt
download >= 25 Mbps
upload >= 3 Mbps
resposta <= 100 ms
falhas/perda <= 2%
```

Headline:

```txt
Conexão aceitável
```

Mensagem:

```txt
Sua internet está funcionando, mas pode ter limitações em vídeos de alta qualidade, chamadas longas ou jogos online.
```

Importante: remover completamente o headline antigo **“Conexão estável”** como classificação principal.

### 7.4. `slow`

Critérios:

```txt
download > 0 Mbps ou upload > 0 Mbps
não atende os critérios anteriores
```

Headline:

```txt
Conexão lenta
```

Mensagem:

```txt
Sua internet está lenta. Sites, vídeos e aplicativos podem demorar para carregar.
```

### 7.5. `unavailable`

Critérios:

```txt
download = 0 e upload = 0
ou teste falhou por indisponibilidade real
```

Headline:

```txt
Não foi possível medir
```

Mensagem:

```txt
Não conseguimos medir sua internet agora. Verifique se o aparelho está conectado e tente novamente.
```

---

## 8. Tags/chips consolidados

As tags são independentes e podem aparecer junto com qualquer classificação.

### 8.1. `highLatency`

Condição:

```txt
resposta > 80 ms
```

Chip:

```txt
Resposta lenta
```

Mensagem:

```txt
A resposta da conexão está demorando mais que o ideal. Isso pode atrapalhar jogos online, chamadas de voz e comandos em tempo real.
```

### 8.2. `lowUpload`

Condição:

```txt
upload medido e upload < 5 Mbps
```

Chip:

```txt
Upload baixo
```

Mensagem:

```txt
O envio de dados está baixo. Isso pode dificultar chamadas de vídeo, envio de arquivos e transmissões ao vivo.
```

### 8.3. `packetLoss`

Condição:

```txt
falhas/perda > 2%
```

Chip:

```txt
Perda de sinal
```

Mensagem:

```txt
Parte da conexão está se perdendo no caminho. Isso pode causar travamentos, falhas em chamadas e quedas momentâneas.
```

Observação: ao ativar `packetLoss`, ativar também `unstable`.

### 8.4. `unstable`

Condição:

```txt
oscilação > 50 ms ou falhas/perda > 2%
```

Chip:

```txt
Conexão instável
```

Mensagem:

```txt
A conexão está oscilando. Mesmo com boa velocidade, ela pode falhar em chamadas, jogos ou vídeos ao vivo.
```

### 8.5. `veryUnstable`

Condição:

```txt
falhas/perda > 5% ou oscilação > 80 ms
```

Chip:

```txt
Instabilidade alta
```

Mensagem:

```txt
A conexão está muito instável. O ideal é testar de novo mais tarde e verificar se o problema continua.
```

Observação: ao ativar `veryUnstable`, ativar também `unstable`.

---

## 9. Regra de estabilidade

Manter a fórmula atual com ajustes de fallback.

Fórmula:

```ts
jitterScore = 100 - clamp((jitter / 50) * 100, 0, 100)
lossScore = 100 - clamp((packetLoss / 2) * 100, 0, 100)
stability = round((0.6 * jitterScore) + (0.4 * lossScore))
```

Regras:

- nunca dividir por resposta/latência;
- nunca retornar abaixo de 0 ou acima de 100;
- se oscilação estiver ausente, usar apenas perda;
- se perda estiver ausente, usar apenas oscilação;
- se ambos estiverem ausentes, exibir “Não medido”.

Labels:

```txt
90 a 100: Muito estável
70 a 89: Estável
50 a 69: Oscilando
0 a 49: Instável
```

Ajustar o código atual porque ele usa `>=85` para “Muito estável” e `>=60` para “Estável”.

---

## 10. Grid “Para o que sua internet serve?”

Substituir as regras atuais em `ResultScreen.tsx`.

Preferencialmente extrair para:

```txt
src/utils/useCases.ts
```

Isso evita regras presas na UI e facilita testes unitários.

### 10.1. Games online

Status `Bom`:

```txt
download >= 5 Mbps
resposta <= 60 ms
oscilação <= 20 ms
falhas/perda <= 1%
```

Status `Pode falhar`:

```txt
download >= 5 Mbps
resposta <= 90 ms
oscilação <= 40 ms
falhas/perda <= 2%
```

Caso contrário:

```txt
Limitado
```

Motivo quando não for bom:

```txt
Pode falhar por causa do tempo de resposta, oscilação ou perda de sinal.
```

### 10.2. Streaming 4K

Status `Bom`:

```txt
download >= 25 Mbps
falhas/perda <= 2%
```

Status `Pode falhar`:

```txt
download >= 10 Mbps
falhas/perda <= 2%
```

Caso contrário:

```txt
Limitado
```

### 10.3. Home Office

Status `Bom`:

```txt
download >= 5 Mbps
upload >= 2 Mbps
resposta <= 200 ms
falhas/perda <= 2%
```

Status `Pode falhar`:

```txt
download >= 2 Mbps
upload >= 1 Mbps
resposta <= 250 ms
falhas/perda <= 3%
```

Caso contrário:

```txt
Limitado
```

### 10.4. Videochamada

Status `Bom`:

```txt
download >= 3 Mbps
upload >= 1.5 Mbps
resposta <= 150 ms
oscilação <= 30 ms
falhas/perda <= 1%
```

Status `Pode falhar`:

```txt
download >= 1.5 Mbps
upload >= 0.8 Mbps
resposta <= 200 ms
oscilação <= 50 ms
falhas/perda <= 2%
```

Caso contrário:

```txt
Limitado
```

---

## 11. Linguagem de cliente final

Trocar na interface principal:

```txt
latência -> resposta
jitter -> oscilação
perda de pacotes -> perda de sinal ou falhas na conexão
packet loss -> nunca exibir
lat -> resposta
```

Manter termos técnicos apenas em código, testes ou seção “Detalhes técnicos”.

Trocar em `HistoryScreen.tsx`:

```txt
lat 44 ms
```

por:

```txt
Resposta 44 ms
```

Trocar em `ResultScreen.tsx` e `HistoryDetail`:

```txt
Perda de pacotes
```

por:

```txt
Perda de sinal
```

ou:

```txt
Falhas na conexão
```

---

## 12. Detecção de conexão no iOS

Alterar o tipo `ConnectionType`.

Hoje:

```ts
export type ConnectionType = 'wifi' | 'mobile' | 'cable';
```

Alterar para:

```ts
export type ConnectionType = 'wifi' | 'mobile' | 'cable' | 'unknown';
```

Quando `navigator.connection` não existir em mobile/iOS:

```ts
connectionType = 'unknown';
```

Exibir:

```txt
Conexão: Auto
```

ou:

```txt
Conexão: Não identificada
```

Não exibir “Celular” automaticamente.

No painel, manter override manual:

```txt
Auto
Wi‑Fi
Cabo
Celular
```

Se estiver em `Auto` e a conexão for desconhecida, exibir orientação:

```txt
Não conseguimos identificar se você está no Wi‑Fi ou rede móvel. Ajuste manualmente se quiser um teste mais adequado.
```

---

## 13. Consumo de dados

Alterar texto atual:

```txt
Usa ~400 MB no Wi‑Fi/cabo · ~70 MB em rede móvel
```

Para:

```txt
Teste completo: pode usar até 500 MB. Em rede móvel, usamos uma versão reduzida.
```

Melhor opção: implementar dois modos.

### 13.1. Modo rápido

Label:

```txt
Teste rápido
```

Uso aproximado:

```txt
até 80 MB
```

Finalidade:

```txt
Dá uma noção geral da conexão.
```

### 13.2. Modo completo

Label:

```txt
Teste completo
```

Uso aproximado:

```txt
até 500 MB
```

Finalidade:

```txt
Mais preciso, recomendado no Wi‑Fi.
```

Se implementar modo rápido/completo, alterar `runSpeedTest` para receber:

```ts
mode: 'quick' | 'complete'
```

Em vez de basear o preset apenas em `connectionType`.

---

## 14. Histórico

O histórico deve recalcular diagnóstico ao exibir.

Evitar:

```tsx
qualityHeadline(r.quality)
```

Preferir:

```ts
const current = classify({
  dl: r.dl,
  ul: r.ul,
  latency: r.latency,
  jitter: r.jitter,
  packetLoss: r.packetLoss,
  timestamp: r.timestamp,
});

qualityHeadline(current.primary);
```

Também recalcular tags.

Manter `quality` e `tags` no storage apenas por compatibilidade, mas não usar como fonte principal de verdade.

Criar migração futura:

```txt
linka.speedtest.history.v2
```

Estrutura recomendada:

```ts
interface TestRecordV2 {
  id: string;
  timestamp: number;
  dl: number;
  ul: number;
  latency: number;
  jitter: number;
  packetLoss: number;
  serverName: string;
  isp?: string;
  deviceType: DeviceType;
  connectionType: ConnectionType;
  testMode?: 'quick' | 'complete';
  appVersion?: string;
}
```

---

## 15. PDF e compartilhamento

### 15.1. PDF

Alterar textos em `pdfExport.ts` para seguir as mesmas regras de linguagem.

Trocar:

```txt
Perda
```

por:

```txt
Falhas
```

ou:

```txt
Perda de sinal
```

Remover:

```txt
linka.app
```

enquanto o domínio oficial não existir.

Usar:

```txt
Gerado por LINKA SpeedTest
```

### 15.2. Compartilhamento

No texto compartilhado, evitar IP.

Adicionar opção futura:

```txt
Ocultar meu IP ao compartilhar
```

Padrão: IP oculto.

Formato sugerido:

```txt
LINKA SpeedTest — Conexão boa
↓ 569 Mbps · ↑ 64.7 Mbps
Resposta 44 ms · Oscilação 9 ms
Estabilidade: Muito estável
28/04/2026 02:27
```

---

## 16. Mensagens finais recomendadas

### Excelente

```txt
Sua internet está muito boa. Dá para assistir vídeos em alta qualidade, fazer chamadas e jogar online com tranquilidade.
```

### Boa

```txt
Sua internet está boa para o dia a dia. Vídeos, chamadas e trabalho remoto devem funcionar bem.
```

### Aceitável

```txt
Sua internet está funcionando, mas pode ter limitações em vídeos de alta qualidade, chamadas longas ou jogos online.
```

### Lenta

```txt
Sua internet está lenta. Sites, vídeos e aplicativos podem demorar para carregar.
```

### Indisponível

```txt
Não conseguimos medir sua internet agora. Verifique se o aparelho está conectado e tente novamente.
```

### Histórico

```txt
Média dos seus testes
Conexão boa na maioria das medições
```

### Problema recorrente

```txt
Esse problema apareceu em testes diferentes. Vale reiniciar o roteador, testar mais perto do Wi‑Fi ou repetir em outro horário. Se continuar, fale com sua operadora.
```

### Um teste isolado

```txt
Um teste isolado não confirma problema permanente. Repita a medição em outro horário para comparar.
```

---

## 17. Testes obrigatórios

Criar testes unitários para `classifier.ts`.

Arquivo sugerido:

```txt
src/utils/classifier.test.ts
```

### 17.1. `excellent`

Entrada:

```ts
{ dl: 100, ul: 30, latency: 30, jitter: 5, packetLoss: 0.5 }
```

Esperado:

```txt
primary = excellent
tags vazias
```

### 17.2. `good`

Entrada:

```ts
{ dl: 50, ul: 10, latency: 60, jitter: 15, packetLoss: 1 }
```

Esperado:

```txt
primary = good
```

### 17.3. `fair`

Entrada:

```ts
{ dl: 25, ul: 3, latency: 100, jitter: 40, packetLoss: 2 }
```

Esperado:

```txt
primary = fair
headline = Conexão aceitável
```

### 17.4. `slow`

Entrada:

```ts
{ dl: 5, ul: 1, latency: 120, jitter: 20, packetLoss: 0 }
```

Esperado:

```txt
primary = slow
```

### 17.5. `unavailable`

Entrada:

```ts
{ dl: 0, ul: 0, latency: 0, jitter: 0, packetLoss: 0 }
```

Esperado:

```txt
primary = unavailable
```

### 17.6. `packetLoss` também ativa `unstable`

Entrada:

```ts
{ dl: 100, ul: 30, latency: 20, jitter: 5, packetLoss: 2.1 }
```

Esperado:

```txt
tags contém packetLoss
tags contém unstable
```

### 17.7. `veryUnstable` também ativa `unstable`

Entrada:

```ts
{ dl: 100, ul: 30, latency: 20, jitter: 81, packetLoss: 0 }
```

Esperado:

```txt
tags contém veryUnstable
tags contém unstable
```

### 17.8. Estabilidade

Entrada:

```ts
{ jitter: 0, packetLoss: 0 }
```

Esperado:

```txt
100
Muito estável
```

Entrada:

```ts
{ jitter: 50, packetLoss: 2 }
```

Esperado:

```txt
0
Instável
```

---

## 18. Testes obrigatórios para use cases

Extrair regras do grid de uso para arquivo separado.

Arquivo sugerido:

```txt
src/utils/useCases.ts
```

Criar teste:

```txt
src/utils/useCases.test.ts
```

Cenário crítico:

Entrada:

```ts
{ dl: 569, ul: 64.7, latency: 44, jitter: 9, packetLoss: 0 }
```

Esperado:

```txt
Games online = Bom
Streaming 4K = Bom
Home Office = Bom
Videochamada = Bom
```

Esse teste evita regressão do bug atual.

---

## 19. Testes obrigatórios para histórico

Criar teste para garantir que histórico recalcula classificação.

Cenário:

- um registro antigo salvo com `quality: fair`;
- valores atuais deveriam classificar como `good`;
- tela/utilitário deve retornar `good`.

Regra:

```txt
Dados brutos vencem classificação antiga salva.
```

---

## 20. Critérios de aceite

A tarefa só estará concluída quando:

1. `fair` não aparecer mais como “Conexão estável”.
2. Resultado com `569 Mbps`, `64.7 Mbps`, `44 ms`, `9 ms`, `0%` marcar games como **Bom**.
3. `packetLoss > 2` ativar `packetLoss` e `unstable`.
4. `veryUnstable` ativar `veryUnstable` e `unstable`.
5. Interface não exibir “lat”.
6. Interface não exibir “Perda de pacotes” em área principal.
7. iOS sem detecção de rede não for exibido como “Celular” automaticamente.
8. Histórico recalcular classificação com base nos dados brutos.
9. PDF usar a mesma regra nova.
10. Testes unitários cobrirem classifier, use cases e histórico.
11. `npm run test` passar.
12. `npm run build` passar.
13. README deixar de ser template do Vite.

---

## 21. Não fazer nesta tarefa

Não alterar:

- provedor Cloudflare;
- endpoints de download/upload;
- visual principal da marca;
- estrutura geral das telas;
- deploy;
- PWA manifest, exceto se necessário para textos/nome curto;
- sistema de tema claro/escuro;
- bibliotecas principais.

Não adicionar:

- login;
- backend;
- ranking;
- mapa público;
- assinatura;
- integração com modem;
- diagnóstico agressivo contra operadora.

---

## 22. Prompt direto para execução

Use este comando como orientação para a IA de desenvolvimento:

```txt
Você vai corrigir as regras de diagnóstico do PWA LINKA SpeedTest.

Leia o arquivo PendenciasTecnicas.md inteiro antes de alterar código.

Ajuste classifier.ts, ResultScreen, HistoryScreen, BottomSheet, useDeviceInfo, history e pdfExport para consolidar as regras descritas.

Não altere o motor principal de medição, exceto se necessário para expor modo rápido/completo ou corrigir a frase de consumo de dados.

Extraia as regras de “Para o que sua internet serve?” para um utilitário testável, por exemplo src/utils/useCases.ts.

Crie testes unitários para:
- classificação principal;
- tags;
- estabilidade;
- use cases;
- histórico recalculando qualidade a partir dos dados brutos.

Corrija a linguagem de cliente final:
- não usar “lat”;
- não usar “perda de pacotes” na UI principal;
- não chamar fair de “Conexão estável”;
- não afirmar que a operadora descumpriu regra com base em um único teste;
- não dizer que iOS está em “Celular” quando a conexão não foi detectada.

Ao final, rode:
npm run test
npm run build

Entregue relatório com:
1. arquivos alterados;
2. regras antigas removidas;
3. novas regras implementadas;
4. testes criados;
5. comandos executados;
6. falhas encontradas, se houver.
```

---

## 23. Resumo executivo

As regras atuais estão **parcialmente coerentes**, mas não estão prontas para produto confiável.

O principal erro é misturar conceitos:

- “conexão aceitável” com “conexão estável”;
- falha de requisição HTTP com “perda de pacotes”;
- conexão não detectada no iOS com “Celular”;
- games com resposta de 44 ms como “Pode falhar”;
- histórico salvo com classificação antiga.

A correção é relativamente pequena, mas importante. O app já tem uma base boa. O próximo passo é transformar o diagnóstico em uma camada consistente, testável e sem contradições.
