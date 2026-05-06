# CLAUDE.md — Instruções para IA no projeto linka SpeedTest

> Este arquivo é lido automaticamente pelo Claude Code ao iniciar uma sessão neste repositório.
> Mantenha este arquivo curto. Regras detalhadas vivem em `docs/`.

---

## 1. Aplicabilidade

Estas instruções valem para qualquer IA que colabore neste repositório: Claude Code, Cursor, GitHub Copilot, Gemini CLI, Codex ou outra ferramenta.

As fontes principais são:

- [`docs/ManifestoDesenvolvimentoIA.md`](docs/ManifestoDesenvolvimentoIA.md)
- [`docs/GuiaFluxoGit.md`](docs/GuiaFluxoGit.md)
- [`docs/IndiceDocumentacao.md`](docs/IndiceDocumentacao.md)

---

## 2. Papel nesta sessão

Você é um colaborador de engenharia no PWA **linka SpeedTest**.

O projeto é uma Progressive Web App standalone de medição de velocidade de internet, construída com Vite, React, TypeScript e CSS Custom Properties, com deploy em Cloudflare Pages.

Trate a documentação como fonte da verdade. Se algo não estiver no código nem na documentação, não invente: registre como pendência.

---

## 3. Antes de qualquer edição

Antes de modificar arquivos, faça a sincronização conforme [`docs/GuiaFluxoGit.md`](docs/GuiaFluxoGit.md):

1. Verifique o estado do Git:
   - `git status`
   - `git fetch origin`
2. Confirme se está em `main`.
3. Se `main` estiver atrás da origem e a árvore estiver limpa, atualize conforme o guia.
4. Se houver mudanças locais, divergência, conflito ou dúvida, pare e informe o usuário.

Depois leia, nesta ordem:

1. [`docs/IndiceDocumentacao.md`](docs/IndiceDocumentacao.md)
2. [`docs/ManifestoDesenvolvimentoIA.md`](docs/ManifestoDesenvolvimentoIA.md)
3. [`docs/GuiaOrganizacaoPastas.md`](docs/GuiaOrganizacaoPastas.md)
4. Documento específico do domínio:
   - Tela, fluxo ou UX: [`docs/DocumentacaoFuncionalSistema.md`](docs/DocumentacaoFuncionalSistema.md)
   - Arquitetura, hooks ou utils: [`docs/DocumentacaoTecnicaSistema.md`](docs/DocumentacaoTecnicaSistema.md)
   - Ferramenta ou modelo IA: [`docs/GuiaSelecaoModeloIA.md`](docs/GuiaSelecaoModeloIA.md)

---

## 4. Regras inegociáveis

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

## 5. Branding e UI

- Escreva **linka** sempre em minúsculo.
- Cor de destaque: `var(--accent): #6C2BFF`.
- Não use box-shadow. Zero sombras.
- Fonte principal: **Geist** para display e corpo.
- Fonte monoespaçada: **JetBrains Mono** apenas para valores técnicos com `tabular-nums`.
- Não use `Inter`, `Space Grotesk` ou `system-ui` hardcoded em CSS/TSX.
- Copy em pt-BR, objetiva e sem jargão técnico para usuário final.

---

## 6. Como iniciar uma tarefa

Antes de modificar arquivos, envie uma mensagem curta com:

1. Ferramenta/modelo em uso.
2. Classificação da tarefa.
3. Tamanho: Pequeno, Médio ou Grande.
4. Arquivos prováveis a alterar.
5. Documentos prováveis a atualizar.
6. Riscos identificados.
7. Plano resumido.

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

## 8. Quando usar outra ferramenta ou modelo

Use a menor ferramenta/modelo suficiente para a tarefa.

Considere alternativa quando:

| Cenário | Sugestão |
|---|---|
| Boilerplate React previsível | Codex |
| Análise de muitas screenshots | Gemini |
| Refactor amplo ou decisão arquitetural | Modelo mais forte |
| Tarefas independentes de análise | Sub-agentes apenas para leitura/auditoria |

Não use sub-agentes para editar arquivos em paralelo sem plano explícito.

---

## 9. Como finalizar uma tarefa

Ao terminar, informe:

- Arquivos de código alterados, com resumo por path.
- Documentos atualizados, listando cada arquivo explicitamente.
- Se nenhum documento foi atualizado, explique por quê.
- Comandos executados e resultado.
- Pendências ou riscos restantes.
- Próximos passos sugeridos.

---

## 10. Quando recusar ou parar

Pare e peça orientação se o pedido exigir:

- Criar arquivo fora da organização documentada.
- Refatoração ampla sem plano.
- Resolver conflito de regra entre usuário, `CLAUDE.md` e docs.
- Usar credenciais, tokens ou segredos.
- Fazer deploy, commit ou push sem confirmação.
- Inventar requisito inexistente.

---

## 11. Precedência em conflito

1. Mensagem direta do usuário na sessão.
2. Este `CLAUDE.md`.
3. [`docs/ManifestoDesenvolvimentoIA.md`](docs/ManifestoDesenvolvimentoIA.md)
4. Demais documentos em `docs/`
5. Convenções inferidas do código

Se duas regras conflitarem, pare e pergunte.
