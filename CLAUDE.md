# CLAUDE.md — Instruções para IA no projeto linka SpeedTest

> Este arquivo é lido automaticamente pelo Claude Code ao iniciar uma sessão neste repositório.
> Mantenha este arquivo curto. Regras detalhadas vivem em docs/ (local).

---

## 1. Leitura Obrigatória (em ordem)

**Documentação Central do workspace — leia PRIMEIRO:**

1. [`E:\Projetos\Linka\CLAUDE.md`](../CLAUDE.md) — Hub central: visão geral, agentes, fluxo de trabalho, regras gerais
   - Cobre: o que é o Linka, projetos, módulos Android, fluxo oficial, agentes disponíveis, skills

2. [`E:\Projetos\Linka\docs\VISAO_GERAL_LINKA.md`](../docs/VISAO_GERAL_LINKA.md) — O que é o Linka, os dois projetos, stacks, relação entre eles, onde encontrar cada tipo de informação
3. [`E:\Projetos\Linka\docs\GUIA_CONVIVENCIA_IA.md`](../docs/GUIA_CONVIVENCIA_IA.md) — Sistema multiagente: quem é cada agente, quando acionar, fluxo oficial, regras de comportamento para IAs
4. [`E:\Projetos\Linka\docs\GUIA_DESENVOLVIMENTO_IA.md`](../docs/GUIA_DESENVOLVIMENTO_IA.md) — Como trabalhar em código com IA: sequência de leitura, classificação de task, regras por projeto, erros comuns
5. [`E:\Projetos\Linka\docs\PADROES_UI_UX.md`](../docs/PADROES_UI_UX.md) — Padrões UI/UX compartilhados: iOS-Calma, nomenclatura de métricas, estados visuais, chips, ícones, copy
6. [`E:\Projetos\Linka\docs\MATERIAL_DESIGN_3.md`](../docs/MATERIAL_DESIGN_3.md) — Tokens MD3: paleta de cores, tipografia, espaçamento, componentes em uso (Android e PWA)
7. [`E:\Projetos\Linka\docs\GUIA_SELECAO_MODELO_IA.md`](../docs/GUIA_SELECAO_MODELO_IA.md) — Qual modelo e agente usar para cada tipo de task, regras de economia de tokens

**Documentação PWA-Específica:**

- [`docs/DOCUMENTACAO_CONSOLIDADA.md`](docs/DOCUMENTACAO_CONSOLIDADA.md) — Índice local de docs PWA
- [`docs/GuiaFluxoGit.md`](docs/GuiaFluxoGit.md) — Git workflow PWA
- [`docs/CI-CD.md`](docs/CI-CD.md) — GitHub Actions, Cloudflare Pages deploy
- [`docs/GuiaOrganizacaoPastas.md`](docs/GuiaOrganizacaoPastas.md) — Estrutura de pastas PWA

---

## 2. Papel nesta sessão

Você é um colaborador de engenharia no PWA **linka SpeedTest**.

O projeto é uma Progressive Web App standalone de medição de velocidade de internet, construída com Vite, React, TypeScript e CSS Custom Properties, com deploy em Cloudflare Pages.

Trate a documentação como fonte da verdade. Se algo não estiver no código nem na documentação, não invente: registre como pendência.

---

## 2. Antes de qualquer edição

### Verificação Git
Faça a sincronização conforme [`docs/GuiaFluxoGit.md`](docs/GuiaFluxoGit.md):

1. Verifique o estado do Git:
   - `git status`
   - `git fetch origin`
2. Confirme se está em `main`.
3. Se `main` estiver atrás da origem e a árvore estiver limpa, atualize conforme o guia.
4. Se houver mudanças locais, divergência, conflito ou dúvida, pare e informe o usuário.

### Leitura de Contexto
Depois leia, nesta ordem:

**Sempre (mesmo se já leu em outra sessão):**
1. [`../CLAUDE.md`](../CLAUDE.md) — Regras críticas do workspace Linka

**Quando começar no projeto:**
1. [`docs/DOCUMENTACAO_CONSOLIDADA.md`](docs/DOCUMENTACAO_CONSOLIDADA.md) — Mapeia docs centrais vs. PWA-específicas
2. [`docs/GuiaOrganizacaoPastas.md`](docs/GuiaOrganizacaoPastas.md) — Estrutura de pastas
3. Documento específico do domínio (veja seção 3 abaixo)

**Quando trabalhar em tarefa específica:**
- Tela, fluxo ou UX: [`docs/DocumentacaoFuncionalSistema.md`](docs/DocumentacaoFuncionalSistema.md)
- Arquitetura, hooks ou utils: [`docs/DocumentacaoTecnicaSistema.md`](docs/DocumentacaoTecnicaSistema.md)
- Material Design 3 / UI: [`E:\Projetos\Linka\docs\MATERIAL_DESIGN_3.md`](../docs/MATERIAL_DESIGN_3.md)
- Qual modelo IA usar: [`E:\Projetos\Linka\docs\GUIA_SELECAO_MODELO_IA.md`](../docs/GUIA_SELECAO_MODELO_IA.md)

---

## 3. Regras Inegociáveis

Regras gerais do ecossistema: consulte [`../CLAUDE.md`](../CLAUDE.md).

Resumo de regras PWA:

- Trabalhe sempre em `main`. Nunca crie branches paralelas.
- Não faça alteração sem plano e OK do usuário.
- Leitura e inspeção são livres. Edição não.
- Atualize documentação na mesma tarefa em que alterar comportamento, arquitetura, fluxo, decisão técnica ou organização.
- Código sem documentação necessária atualizada é tarefa incompleta.
- Não crie arquivos fora da estrutura prevista em [`docs/GuiaOrganizacaoPastas.md`](docs/GuiaOrganizacaoPastas.md).
- Se a pasta ou tipo de arquivo não estiver previsto, atualize o guia primeiro.
- Faça a menor mudança que resolve o pedido.
- Não refatore fora do escopo.
- Não fabrique regra, requisito, comportamento ou decisão.
- Se houver ambiguidade real, pergunte antes de alterar.
- Nunca inclua credenciais, tokens, chaves de API ou segredos no código.

---

## 4. Branding e UI

Regras PWA específicas:

- Escreva **linka** sempre em minúsculo.
- Material Design 3 como padrão (referência: [`E:\Projetos\Linka\docs\MATERIAL_DESIGN_3.md`](../docs/MATERIAL_DESIGN_3.md))
- Não use box-shadow. Zero sombras.
- Fonte principal: **Geist** para display e corpo.
- Fonte monoespaçada: **JetBrains Mono** apenas para valores técnicos com `tabular-nums`.
- Não use `Inter`, `Space Grotesk` ou `system-ui` hardcoded em CSS/TSX.
- Copy em pt-BR, objetiva e sem jargão técnico para usuário final.
- Mais detalhes: [`docs/GuiaBranding.md`](docs/GuiaBranding.md)

---

## 5. Como Iniciar Uma Tarefa

Antes de modificar arquivos, envie uma mensagem curta com:

1. Ferramenta/modelo em uso
2. Classificação da tarefa (Bug fix / Feature / Refactor / Teste / Docs)
3. Tamanho: Pequeno / Médio / Grande
4. Stack: PWA / Ambos
5. Arquivos prováveis a alterar
6. Documentos prováveis a atualizar
7. Riscos identificados (Nenhum / Baixo / Médio / Alto)
8. Plano resumido (3-5 passos)

Aguarde OK antes de editar.

---

## 7. Ferramentas e permissões

### Livre para inspeção

- Read
- Grep
- Glob
- `git status`
- `git diff`
- `git log`
- `git fetch origin`

### Permitido após plano aprovado

- Edit
- Write
- `npm run dev`
- `npm run build`
- `npm test`
- alterações em arquivos de código
- alterações em documentação

### Requer confirmação explícita específica

- `git commit`
- `git push`
- `git push --force`
- deploy com `npx wrangler pages deploy`
- instalação ou remoção de dependências
- alterações em:
  - `package.json`
  - `package-lock.json`
  - `vite.config.ts`
  - `tsconfig*.json`

Para `git push --force`, peça confirmação dupla.

---

## 7. Quando Usar Outra Ferramenta ou Modelo

Use a menor ferramenta/modelo suficiente para a tarefa:

| Cenário | Sugestão |
|---|---|
| Bug simples isolado (<50 linhas) | Haiku 4.5 |
| Feature normal ou testes | Sonnet 4.6 |
| Arquitetura ou integração complexa | Opus 4 |
| Análise de muitas screenshots | Gemini 2.5 |
| Refactor amplo ou decisão crítica | Opus 4 |

Não use sub-agentes para editar arquivos em paralelo sem plano explícito.

---

## 8. Como Finalizar Uma Tarefa

Ao terminar, execute checklist e informe:

**Código:**
- [ ] Compila/roda sem erros (`npm run dev` ou `npm run build`)
- [ ] Testes passam (`npm test`)
- [ ] Lint limpo (`npm run lint`)
- [ ] Performance não degradou

**Documentação:**
- [ ] Docs PWA atualizadas (se mudou UI/fluxo)
- [ ] Contrato canônico atualizado (se muda comportamento)
- [ ] Índice de docs sincronizado

**Resumo da entrega:**
- Arquivos de código alterados, com resumo por path
- Documentos atualizados, listando cada arquivo explicitamente
- Se nenhum documento foi atualizado, explique por quê
- Comandos executados e resultado
- Pendências ou riscos restantes
- Próximos passos sugeridos

---

## 9. Quando Recusar ou Parar

Pare e peça orientação se o pedido exigir:

- Criar arquivo fora da organização documentada.
- Refatoração ampla sem plano.
- Resolver conflito de regra entre usuário, `CLAUDE.md` e docs.
- Usar credenciais, tokens ou segredos.
- Fazer deploy, commit ou push sem confirmação.
- Inventar requisito inexistente.

---

## 10. Precedência em Conflito

1. Mensagem direta do usuário na sessão
2. [`../CLAUDE.md`](../CLAUDE.md) (regras centrais do workspace Linka)
3. Este `CLAUDE.md` (projeto PWA)
4. [`docs/DOCUMENTACAO_CONSOLIDADA.md`](docs/DOCUMENTACAO_CONSOLIDADA.md) (índice local)
5. Demais documentos em `docs/` (PWA-específicos)
6. Convenções inferidas do código

Se duas regras conflitarem, pare e pergunte.
