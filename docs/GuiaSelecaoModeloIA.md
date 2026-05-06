# Guia de Seleção de Modelo e Ferramenta IA — linka SpeedTest PWA

> Use este guia antes de iniciar qualquer tarefa no repositório para escolher a ferramenta e o modelo mais adequados.
> O objetivo é resolver bem, com o menor custo e o menor risco possível.
>
> **Aplicabilidade:** Este guia vale para qualquer IA colaborando neste repositório — Claude Code, Cursor, GitHub Copilot, Gemini CLI, Codex, ChatGPT, agentes locais ou outra ferramenta.

---

## 1. Princípio central

A escolha do modelo não deve começar pela ferramenta preferida. Deve começar pela tarefa.

Antes de agir, classifique:

1. Qual é o tipo de tarefa?
2. Qual é o risco de errar?
3. Quantos arquivos ou fontes precisam ser lidos?
4. A tarefa exige edição, análise, geração, revisão, multimodalidade ou deploy?
5. Existe impacto em arquitetura, testes, build, PWA, classificação de velocidade ou produção?

Use o menor modelo/ferramenta que resolve a tarefa com segurança.

Não use modelo caro por preguiça.  
Não use modelo fraco em tarefa sensível.  
Não edite código sem entender documentação e escopo.  
Não invente requisito ausente.

---

## 2. Classes de modelo

Use esta classificação genérica, independente de fornecedor.

| Classe | Quando usar | Exemplos de uso |
|---|---|---|
| Modelo rápido/barato | Tarefa mecânica, baixo risco, pouco contexto | Renomear variável, ajustar copy, lookup local, mudança CSS simples |
| Modelo padrão de implementação | Código real em escopo pequeno/médio | Bug fix, feature pequena, refactor moderado, documentação técnica |
| Modelo de raciocínio profundo | Alta complexidade ou alto risco | Arquitetura, algoritmo de speedtest, classifier, refactor amplo |
| Modelo de contexto longo | Precisa ler muitos arquivos/docs de uma vez | Auditoria do projeto, comparação de 10+ arquivos, leitura extensa de documentação |
| Modelo multimodal | Precisa analisar imagem, screenshot, vídeo ou PDF visual | Screenshots iOS/Android, fluxo visual, comparação de layout |
| Autocomplete/inline | Ajuda enquanto o humano escreve código | Completar JSX, CSS, função repetitiva, padrão local |
| Agente com terminal e filesystem | Precisa navegar repo, editar arquivos, rodar testes/build | Implementação completa, revisão com comandos, validação local |

Modelos mudam. O critério fica.

---

## 3. Matriz principal: tarefa → tipo de ferramenta/modelo

| Tarefa | Ferramenta/modelo recomendado | Risco | Observação |
|---|---|---|---|
| Corrigir typo, copy ou comentário | Modelo rápido/barato ou autocomplete | Baixo | Não precisa modelo forte |
| Ajuste visual isolado em CSS | Modelo rápido/barato ou padrão | Baixo | Verificar branding e ausência de sombras |
| Renomear identificador local | Modelo rápido/barato | Baixo | Confirmar impacto com busca |
| Bug fix em 1-2 arquivos | Agente com filesystem + modelo padrão | Médio | Rodar testes/build se aplicável |
| Feature pequena em 1-2 arquivos | Agente com filesystem + modelo padrão | Médio | Atualizar documentação se mudar comportamento |
| Refactor moderado em múltiplos arquivos | Agente com filesystem + modelo padrão forte | Médio/alto | Planejar antes de editar |
| Refactor amplo cross-file | Agente com filesystem + modelo de raciocínio profundo | Alto | Exige plano, revisão e validação |
| Decisão arquitetural | Modelo de raciocínio profundo | Alto | Não implementar direto sem decisão registrada |
| Code review crítico | Modelo de raciocínio profundo | Alto | Priorizar bugs, regressões e riscos ocultos |
| Análise de 10+ arquivos | Modelo de contexto longo | Médio | Separar leitura/análise de edição |
| Análise de screenshots em volume | Modelo multimodal | Médio | Ideal para UX visual e comparação de telas |
| Boilerplate previsível | Ferramenta de geração/autocomplete | Baixo/médio | Revisar para aderência ao projeto |
| Perguntas sobre documentação externa | Modelo com busca/contexto longo | Médio | Usar docs oficiais quando possível |
| Alteração de dependência | Agente com filesystem + modelo padrão forte ou profundo | Alto | Exige confirmação específica |
| Build, testes, deploy | Agente com terminal | Alto | Deploy exige confirmação explícita |

---

## 4. Escolha por capacidade necessária

### 4.1 Quando precisa editar arquivos

Use uma ferramenta que consiga:

- ler o repositório
- editar arquivos
- mostrar diff
- rodar comandos
- respeitar o fluxo Git
- atualizar documentação

Exemplos: Claude Code, Cursor Agent, Codex em modo agente, agente local equivalente.

Não use apenas autocomplete para tarefa que exige rastrear impacto cross-file.

---

### 4.2 Quando precisa apenas escrever código repetitivo

Use autocomplete ou gerador de código quando:

- o padrão já existe
- o escopo é pequeno
- a mudança é local
- o humano vai revisar antes de aplicar

Exemplos: GitHub Copilot, Cursor inline, Codex, ChatGPT/Codex em geração pontual.

Cuidado: boilerplate errado se espalha rápido. Código repetitivo ruim vira dívida técnica em escala.

---

### 4.3 Quando precisa entender muita coisa antes de mexer

Use modelo de contexto longo quando:

- há muitos arquivos envolvidos
- a documentação é extensa
- o pedido exige comparar versões, padrões ou decisões
- a pergunta é mais “entenda o sistema” do que “mude esta linha”

Exemplos: Gemini Pro/Flash com contexto longo, ChatGPT com contexto longo, Claude/Opus quando disponível, ferramentas locais com indexação do repo.

Se a ferramenta de contexto longo não edita o projeto com segurança, use-a para análise e depois aplique a mudança com agente de filesystem.

---

### 4.4 Quando precisa raciocinar profundamente

Use modelo de raciocínio profundo quando o erro pode quebrar:

- algoritmo de medição
- classificação de resultado
- fluxo principal do usuário
- build/PWA
- deploy
- arquitetura de hooks/utils
- persistência de histórico
- compatibilidade TypeScript

Não use modelo barato em tarefa onde a economia é menor que o prejuízo de uma regressão.

---

### 4.5 Quando precisa analisar imagens, screenshots ou PDFs visuais

Use modelo multimodal quando o input principal for visual.

Exemplos:

- screenshots de iOS/Android
- comparação de layout
- auditoria visual de responsividade
- fluxos de instalação PWA
- PDFs com tabelas, prints ou diagramas

Não force uma ferramenta textual a interpretar algo que é claramente visual.

---

## 5. Protocolo de início de tarefa

Antes de qualquer modificação, a IA deve enviar uma mensagem curta ao usuário:

```text
Tarefa: [classificação em uma frase]
Ferramenta/modelo em uso: [nome real disponível no ambiente]
Classe do modelo: [rápido / padrão / profundo / contexto longo / multimodal / autocomplete]
Ferramenta/modelo mais adequado: [se diferente do atual, diga qual e por quê]
Tamanho: Pequeno / Médio / Grande
Arquivos prováveis: [lista]
Docs prováveis: [lista]
Riscos: [lista curta]
Plano: [3-5 passos]
```

Depois deve aguardar OK antes de editar arquivos.

### Quando pode pular

Pode pular somente quando:

- for pergunta factual sem edição
- for apenas leitura/inspeção
- for continuação direta de tarefa já aprovada no mesmo escopo
- o usuário pedir explicitamente uma alteração trivial, como corrigir um typo específico

Na dúvida, faça o protocolo. É burocracia útil, não enfeite.

---

## 6. Sinais de que a ferramenta atual não é ideal

| Sinal | Melhor escolha |
|---|---|
| A tarefa exige terminal, build ou testes | Agente com terminal/filesystem |
| A tarefa exige editar vários arquivos com consistência | Agente com filesystem + modelo padrão/profundo |
| A tarefa exige ler muitos arquivos antes de decidir | Modelo de contexto longo |
| A tarefa exige analisar muitas imagens | Modelo multimodal |
| A tarefa é autocomplete local | Ferramenta inline |
| A tarefa é boilerplate previsível | Gerador/autocomplete + revisão |
| A tarefa envolve arquitetura ou algoritmo | Modelo de raciocínio profundo |
| A sessão atual está poluída com contexto antigo | Nova sessão ou contexto limpo |
| A tarefa exige documentação externa atualizada | Ferramenta com busca ou docs oficiais |

Como comunicar:

```text
Esta tarefa parece mais adequada para [classe/ferramenta] porque [motivo].
Posso continuar aqui com estas limitações: [limitações concretas].
```

Não use isso como desculpa para empurrar trabalho. Se a ferramenta atual resolve bem, resolva.

---

## 7. Exemplos de ferramentas por categoria

> Esta tabela é ilustrativa. Não trate nomes de modelos como contrato fixo.
> Se uma ferramenta mudar nome, plano ou disponibilidade, use o equivalente mais próximo.

| Categoria | Exemplos |
|---|---|
| Agente com filesystem e terminal | Claude Code, Cursor Agent, Codex agent, agentes locais equivalentes |
| Autocomplete/inline | GitHub Copilot, Cursor inline, IDE assistant |
| Contexto longo | Gemini, ChatGPT com contexto longo, Claude com contexto longo, ferramentas de indexação local |
| Multimodal | Gemini, ChatGPT multimodal, Claude multimodal |
| Busca/documentação externa | ChatGPT com busca, Gemini CLI, browser/manual + docs oficiais |
| Geração pontual de boilerplate | Codex, Copilot, Cursor, ChatGPT |

---

## 8. Especificidades do projeto linka SpeedTest

### 8.1 Domínios de maior risco

Use modelo de raciocínio profundo ou peça revisão adicional quando mexer em:

- `src/utils/classifier.ts`
  - regras de negócio de classificação
  - diagnóstico exibido ao usuário
  - thresholds
  - textos interpretativos

- `src/utils/speedtest.ts`
  - algoritmo de medição
  - EMA
  - P90
  - `AbortController`
  - cálculo de download/upload/latência
  - precisão percebida pelo usuário

- `src/utils/serverRegistry.ts`
  - endpoints
  - integração com Cloudflare
  - detecção de ISP
  - fallback de servidor

- configuração de build/deploy
  - `vite.config.ts`
  - `package.json`
  - `package-lock.json`
  - `tsconfig*.json`
  - configuração PWA
  - Cloudflare Pages

### 8.2 Domínios de risco médio

Use modelo padrão de implementação e rode testes/build quando mexer em:

- hooks React
- estado local/global
- componentes compartilhados
- fluxo entre telas
- histórico de testes
- persistência em `localStorage`
- tratamento de erro visível ao usuário

### 8.3 Domínios de baixo risco

Modelo rápido ou padrão é suficiente quando o escopo for isolado:

- ajustes visuais simples em `src/screens/*.css`
- copy em pt-BR
- pequenos ajustes em `src/utils/format.ts`
- documentação em `docs/*.md`
- renomeações locais sem impacto público

Baixo risco não significa “sem documentação”. Se mudar comportamento, fluxo, decisão ou organização, atualize docs.

---

## 9. Branding e padrões do projeto

Toda ferramenta/modelo deve respeitar:

- **linka** sempre minúsculo
- cor de destaque: `var(--accent): #6C2BFF`
- sem `box-shadow`
- zero sombras
- fonte principal: **Geist**
- fonte monoespaçada: **JetBrains Mono** apenas para valores técnicos com `tabular-nums`
- não usar `Inter`, `Space Grotesk` ou `system-ui` hardcoded em CSS/TSX
- copy em pt-BR, objetiva e sem jargão técnico para usuário final

Se a IA sugerir algo contra esses padrões, a sugestão está errada.

---

## 10. Dependências sensíveis

Antes de alterar dependências, peça confirmação específica.

Atenção especial para:

- `vite-plugin-pwa`
  - não atualizar sem testar build, PWA e service worker

- `recharts`
  - evitar introduzir novos tipos de gráfico sem justificativa
  - manter o padrão visual do projeto

- Vite / React / TypeScript
  - mudanças podem afetar build, tipos e compatibilidade do PWA

- Cloudflare / Wrangler
  - mudanças podem afetar deploy de produção

Alterações em `package.json`, `package-lock.json`, `vite.config.ts` e `tsconfig*.json` exigem confirmação explícita.

---

## 11. Git, commit, push e deploy

Este guia não autoriza commit, push ou deploy.

### Commit

Antes de commitar:

1. Mostrar resumo das alterações.
2. Mostrar arquivos alterados.
3. Pedir confirmação explícita.
4. Só então executar `git commit`.

### Push

Antes de push:

1. Confirmar branch `main`.
2. Confirmar estado local.
3. Pedir confirmação explícita.
4. Só então executar `git push`.

Para `git push --force`, peça confirmação dupla e explique o risco.

### Deploy

Antes de qualquer deploy em Cloudflare Pages:

1. Confirmar que a tarefa foi concluída.
2. Rodar `npm run build`.
3. Rodar `npm test`.
4. Verificar `git status`.
5. Confirmar explicitamente com o usuário.
6. Só então executar deploy.

Comando padrão:

```bash
npx wrangler pages deploy dist --project-name linka-speedtest --branch main
```

Se o projeto estiver usando configuração Wrangler própria, siga a configuração documentada no repositório.

Nunca faça deploy para produção sem confirmação explícita.

---

## 12. Encerramento da tarefa

Ao finalizar, informe:

- arquivos de código alterados
- documentos atualizados, listando cada path
- comandos executados e resultado
- testes/build executados ou não executados
- pendências restantes
- próximos passos sugeridos

Se nenhum documento foi atualizado, explique em uma frase por quê.

---

## 13. Manutenção deste guia

Atualize este guia quando:

- uma nova ferramenta entrar no fluxo do projeto
- uma categoria de modelo deixar de fazer sentido
- o time mudar o padrão de aprovação
- uma dependência sensível mudar
- uma tarefa recorrente exigir critério próprio

Evite transformar este guia em catálogo de fornecedor.

O guia deve ensinar a escolher bem, não decorar nome de modelo.
