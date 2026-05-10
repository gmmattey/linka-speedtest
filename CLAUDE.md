# CLAUDE.md â€” InstruÃ§Ãµes para IA no projeto linka SpeedTest

> Este arquivo Ã© lido automaticamente pelo Claude Code ao iniciar uma sessÃ£o neste repositÃ³rio.
> Mantenha este arquivo curto. Regras detalhadas vivem em docs/ (local) e docs centrais (docsGerais/).

---

## 1. Leitura ObrigatÃ³ria (em ordem)

**DocumentaÃ§Ã£o Central (docsGerais/) â€” leia PRIMEIRO:**

1. [`E:\Projetos\docsGerais\README.md`](../../docsGerais/README.md) â€” Hub central de toda documentaÃ§Ã£o LINKA
2. [`E:\Projetos\docsGerais\VISAO_GERAL_LINKA.md`](../../docsGerais/VISAO_GERAL_LINKA.md) â€” O que Ã© LINKA (3 stacks: Kotlin, PWA, Flutter)
3. [`E:\Projetos\docsGerais\GUIA_CONVIVENCIA_IA.md`](../../docsGerais/GUIA_CONVIVENCIA_IA.md) â€” **CRÃTICO:** Regras inegociÃ¡veis
4. [`E:\Projetos\docsGerais\GUIA_DESENVOLVIMENTO_IA.md`](../../docsGerais/GUIA_DESENVOLVIMENTO_IA.md) â€” Checklists e runbook
5. [`E:\Projetos\docsGerais\PADROES_UI_UX.md`](../../docsGerais/PADROES_UI_UX.md) â€” Material Design 3, navegaÃ§Ã£o PWA
6. [`E:\Projetos\docsGerais\MATERIAL_DESIGN_3.md`](../../docsGerais/MATERIAL_DESIGN_3.md) â€” Design tokens (Tailwind CSS para PWA)
7. [`E:\Projetos\docsGerais\GUIA_SELECAO_MODELO_IA.md`](../../docsGerais/GUIA_SELECAO_MODELO_IA.md) â€” Qual IA usar para qual tarefa

**DocumentaÃ§Ã£o PWA-EspecÃ­fica:**

- [`docs/DOCUMENTACAO_CONSOLIDADA.md`](docs/DOCUMENTACAO_CONSOLIDADA.md) â€” Ãndice local de docs PWA (mantidas) vs. centrais
- [`docs/GuiaFluxoGit.md`](docs/GuiaFluxoGit.md) â€” Git workflow PWA
- [`docs/CI-CD.md`](docs/CI-CD.md) â€” GitHub Actions, Cloudflare Pages deploy
- [`docs/GuiaOrganizacaoPastas.md`](docs/GuiaOrganizacaoPastas.md) â€” Estrutura de pastas PWA

---

## 2. Papel nesta sessÃ£o

VocÃª Ã© um colaborador de engenharia no PWA **linka SpeedTest**.

O projeto Ã© uma Progressive Web App standalone de mediÃ§Ã£o de velocidade de internet, construÃ­da com Vite, React, TypeScript e CSS Custom Properties, com deploy em Cloudflare Pages.

Trate a documentaÃ§Ã£o como fonte da verdade. Se algo nÃ£o estiver no cÃ³digo nem na documentaÃ§Ã£o, nÃ£o invente: registre como pendÃªncia.

---

## 2. Antes de qualquer ediÃ§Ã£o

### VerificaÃ§Ã£o Git
FaÃ§a a sincronizaÃ§Ã£o conforme [`docs/GuiaFluxoGit.md`](docs/GuiaFluxoGit.md):

1. Verifique o estado do Git:
   - `git status`
   - `git fetch origin`
2. Confirme se estÃ¡ em `main`.
3. Se `main` estiver atrÃ¡s da origem e a Ã¡rvore estiver limpa, atualize conforme o guia.
4. Se houver mudanÃ§as locais, divergÃªncia, conflito ou dÃºvida, pare e informe o usuÃ¡rio.

### Leitura de Contexto
Depois leia, nesta ordem:

**Sempre (mesmo se jÃ¡ leu em outra sessÃ£o):**
1. [`../../docsGerais/GUIA_CONVIVENCIA_IA.md`](../../docsGerais/GUIA_CONVIVENCIA_IA.md) â€” Regras crÃ­ticas do projeto

**Quando comeÃ§ar no projeto:**
1. [`docs/DOCUMENTACAO_CONSOLIDADA.md`](docs/DOCUMENTACAO_CONSOLIDADA.md) â€” Mapeia docs centrais vs. PWA-especÃ­ficas
2. [`docs/GuiaOrganizacaoPastas.md`](docs/GuiaOrganizacaoPastas.md) â€” Estrutura de pastas
3. Documento especÃ­fico do domÃ­nio (veja seÃ§Ã£o 3 abaixo)

**Quando trabalhar em tarefa especÃ­fica:**
- Tela, fluxo ou UX: [`docs/DocumentacaoFuncionalSistema.md`](docs/DocumentacaoFuncionalSistema.md)
- Arquitetura, hooks ou utils: [`docs/DocumentacaoTecnicaSistema.md`](docs/DocumentacaoTecnicaSistema.md)
- Material Design 3 / UI: [`../../docsGerais/MATERIAL_DESIGN_3.md`](../../docsGerais/MATERIAL_DESIGN_3.md)
- Qual modelo IA usar: [`../../docsGerais/GUIA_SELECAO_MODELO_IA.md`](../../docsGerais/GUIA_SELECAO_MODELO_IA.md)

---

## 3. Regras InegociÃ¡veis

**CRÃTICO: Leia [`../../docsGerais/GUIA_CONVIVENCIA_IA.md`](../../docsGerais/GUIA_CONVIVENCIA_IA.md) para disciplina completa.**

Resumo de regras PWA:

- Trabalhe sempre em `main`. Nunca crie branches paralelas.
- NÃ£o faÃ§a alteraÃ§Ã£o sem plano e OK do usuÃ¡rio.
- Leitura e inspeÃ§Ã£o sÃ£o livres. EdiÃ§Ã£o nÃ£o.
- Atualize documentaÃ§Ã£o na mesma tarefa em que alterar comportamento, arquitetura, fluxo, decisÃ£o tÃ©cnica ou organizaÃ§Ã£o.
- CÃ³digo sem documentaÃ§Ã£o necessÃ¡ria atualizada Ã© tarefa incompleta.
- NÃ£o crie arquivos fora da estrutura prevista em [`docs/GuiaOrganizacaoPastas.md`](docs/GuiaOrganizacaoPastas.md).
- Se a pasta ou tipo de arquivo nÃ£o estiver previsto, atualize o guia primeiro.
- FaÃ§a a menor mudanÃ§a que resolve o pedido.
- NÃ£o refatore fora do escopo.
- NÃ£o fabrique regra, requisito, comportamento ou decisÃ£o.
- Se houver ambiguidade real, pergunte antes de alterar.
- Nunca inclua credenciais, tokens, chaves de API ou segredos no cÃ³digo.

---

## 4. Branding e UI

**ReferÃªncia principal: [`../../docsGerais/MATERIAL_DESIGN_3.md`](../../docsGerais/MATERIAL_DESIGN_3.md) (PWA: Tailwind CSS)**

Regras PWA especÃ­ficas:

- Escreva **linka** sempre em minÃºsculo.
- Material Design 3 como padrÃ£o (Color palette em [`../../docsGerais/MATERIAL_DESIGN_3.md`](../../docsGerais/MATERIAL_DESIGN_3.md))
- NÃ£o use box-shadow. Zero sombras.
- Fonte principal: **Geist** para display e corpo.
- Fonte monoespaÃ§ada: **JetBrains Mono** apenas para valores tÃ©cnicos com `tabular-nums`.
- NÃ£o use `Inter`, `Space Grotesk` ou `system-ui` hardcoded em CSS/TSX.
- Copy em pt-BR, objetiva e sem jargÃ£o tÃ©cnico para usuÃ¡rio final.
- Mais detalhes: [`docs/GuiaBranding.md`](docs/GuiaBranding.md)

---

## 5. Como Iniciar Uma Tarefa

**ReferÃªncia: [`../../docsGerais/GUIA_DESENVOLVIMENTO_IA.md`](../../docsGerais/GUIA_DESENVOLVIMENTO_IA.md) (seÃ§Ã£o 3: ClassificaÃ§Ã£o)**

Antes de modificar arquivos, envie uma mensagem curta com:

1. Ferramenta/modelo em uso (sugestÃ£o: ver [`../../docsGerais/GUIA_SELECAO_MODELO_IA.md`](../../docsGerais/GUIA_SELECAO_MODELO_IA.md))
2. ClassificaÃ§Ã£o da tarefa (Bug fix / Feature / Refactor / Teste / Docs)
3. Tamanho: Pequeno / MÃ©dio / Grande
4. Stack: PWA / Ambos
5. Arquivos provÃ¡veis a alterar
6. Documentos provÃ¡veis a atualizar
7. Riscos identificados (Nenhum / Baixo / MÃ©dio / Alto)
8. Plano resumido (3-5 passos)

Aguarde OK antes de editar.

---

## 7. Ferramentas e permissÃµes

### Livre para inspeÃ§Ã£o

- Read
- Grep
- Glob
- `git status`
- `git diff`
- `git log`
- `git fetch origin`

### Permitido apÃ³s plano aprovado

- Edit
- Write
- `npm run dev`
- `npm run build`
- `npm test`
- alteraÃ§Ãµes em arquivos de cÃ³digo
- alteraÃ§Ãµes em documentaÃ§Ã£o

### Requer confirmaÃ§Ã£o explÃ­cita especÃ­fica

- `git commit`
- `git push`
- `git push --force`
- deploy com `npx wrangler pages deploy`
- instalaÃ§Ã£o ou remoÃ§Ã£o de dependÃªncias
- alteraÃ§Ãµes em:
  - `package.json`
  - `package-lock.json`
  - `vite.config.ts`
  - `tsconfig*.json`

Para `git push --force`, peÃ§a confirmaÃ§Ã£o dupla.

---

## 7. Quando Usar Outra Ferramenta ou Modelo

**ReferÃªncia: [`../../docsGerais/GUIA_SELECAO_MODELO_IA.md`](../../docsGerais/GUIA_SELECAO_MODELO_IA.md)**

Use a menor ferramenta/modelo suficiente para a tarefa:

| CenÃ¡rio | SugestÃ£o |
|---|---|
| Bug simples isolado (<50 linhas) | Haiku 4.5 |
| Feature normal ou testes | Sonnet 4.6 |
| Arquitetura ou modem integration | Opus 4.7 |
| IteraÃ§Ãµes rÃ¡pidas com feedback | Fast Mode (Opus 4.6) |
| AnÃ¡lise de muitas screenshots | Gemini 2.5 |
| Refactor amplo ou decisÃ£o crÃ­tica | Opus 4.7 |

NÃ£o use sub-agentes para editar arquivos em paralelo sem plano explÃ­cito.

---

## 8. Como Finalizar Uma Tarefa

**ReferÃªncia: [`../../docsGerais/GUIA_DESENVOLVIMENTO_IA.md`](../../docsGerais/GUIA_DESENVOLVIMENTO_IA.md) (seÃ§Ã£o 8: Checklist Final)**

Ao terminar, execute checklist e informe:

**CÃ³digo:**
- [ ] Compila/roda sem erros (`npm run dev` ou `npm run build`)
- [ ] Testes passam (`npm test`)
- [ ] Lint limpo (`npm run lint`)
- [ ] Performance nÃ£o degradou

**DocumentaÃ§Ã£o:**
- [ ] Docs PWA atualizadas (se mudou UI/fluxo)
- [ ] Contrato canÃ´nico atualizado (se muda comportamento)
- [ ] Ãndice de docs sincronizado

**Resumo da entrega:**
- Arquivos de cÃ³digo alterados, com resumo por path
- Documentos atualizados, listando cada arquivo explicitamente
- Se nenhum documento foi atualizado, explique por quÃª
- Comandos executados e resultado
- PendÃªncias ou riscos restantes
- PrÃ³ximos passos sugeridos

---

## 9. Quando Recusar ou Parar

Pare e peÃ§a orientaÃ§Ã£o se o pedido exigir:

- Criar arquivo fora da organizaÃ§Ã£o documentada.
- RefatoraÃ§Ã£o ampla sem plano.
- Resolver conflito de regra entre usuÃ¡rio, `CLAUDE.md` e docs centrais.
- Usar credenciais, tokens ou segredos.
- Fazer deploy, commit ou push sem confirmaÃ§Ã£o.
- Inventar requisito inexistente.

**ReferÃªncia de conflitos: [`../../docsGerais/GUIA_CONVIVENCIA_IA.md`](../../docsGerais/GUIA_CONVIVENCIA_IA.md) (autoridade e escalaÃ§Ã£o)**

---

## 10. PrecedÃªncia em Conflito

1. Mensagem direta do usuÃ¡rio na sessÃ£o
2. [`../../docsGerais/GUIA_CONVIVENCIA_IA.md`](../../docsGerais/GUIA_CONVIVENCIA_IA.md) (regras centrais crÃ­ticas)
3. Este `CLAUDE.md` (projeto PWA)
4. [`docs/DOCUMENTACAO_CONSOLIDADA.md`](docs/DOCUMENTACAO_CONSOLIDADA.md) (Ã­ndice local)
5. Demais documentos em `docs/` (PWA-especÃ­ficos)
6. Documentos em `../../docsGerais/` (cross-project)
7. ConvenÃ§Ãµes inferidas do cÃ³digo

Se duas regras conflitarem, pare e pergunte.

