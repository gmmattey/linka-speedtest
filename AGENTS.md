# AGENTS.md â€” InstruÃ§Ãµes para Agentes IA no PWA linka SpeedTest

> Este arquivo orienta agentes de cÃ³digo (Codex, Claude via agentes, etc.) ao trabalhar neste repositÃ³rio.
> Regras detalhadas e cross-project vivem em `../../docsGerais/`.
> Regras PWA-especÃ­ficas vivem em `docs/` e `CLAUDE.md`.

---

## 1. Escopo

VocÃª estÃ¡ trabalhando no PWA **linka SpeedTest** â€” Progressive Web App standalone de speedtest, construÃ­do com Vite, React, TypeScript, CSS Custom Properties, deploy em Cloudflare Pages.

Estas instruÃ§Ãµes valem para qualquer agente IA que consiga ler, editar e executar comandos neste repositÃ³rio.

---

## 2. Fontes da Verdade (Leia Nesta Ordem)

### DocumentaÃ§Ã£o Central (../../docsGerais/) â€” LEIA PRIMEIRO
1. [`../../docsGerais/README.md`](../../docsGerais/README.md) â€” Hub central
2. [`../../docsGerais/GUIA_CONVIVENCIA_IA.md`](../../docsGerais/GUIA_CONVIVENCIA_IA.md) â€” **CRÃTICO:** Regras inegociÃ¡veis
3. [`../../docsGerais/GUIA_DESENVOLVIMENTO_IA.md`](../../docsGerais/GUIA_DESENVOLVIMENTO_IA.md) â€” Checklists, runbook
4. [`../../docsGerais/GUIA_SELECAO_MODELO_IA.md`](../../docsGerais/GUIA_SELECAO_MODELO_IA.md) â€” Qual ferramenta para qual tarefa

### DocumentaÃ§Ã£o PWA-EspecÃ­fica
5. [`docs/DOCUMENTACAO_CONSOLIDADA.md`](docs/DOCUMENTACAO_CONSOLIDADA.md) â€” Ãndice: central vs. PWA-especÃ­ficas
6. [`docs/GuiaFluxoGit.md`](docs/GuiaFluxoGit.md) â€” Git workflow
7. [`docs/GuiaOrganizacaoPastas.md`](docs/GuiaOrganizacaoPastas.md) â€” Estrutura de pastas

### Documento EspecÃ­fico da Tarefa
8. UX/tela/fluxo: [`docs/DocumentacaoFuncionalSistema.md`](docs/DocumentacaoFuncionalSistema.md)
9. Arquitetura/hooks/utils: [`docs/DocumentacaoTecnicaSistema.md`](docs/DocumentacaoTecnicaSistema.md)

Se algo nÃ£o estiver no cÃ³digo nem na documentaÃ§Ã£o, nÃ£o invente. Registre como pendÃªncia.

---

## 3. Antes de editar

Antes de qualquer alteraÃ§Ã£o, faÃ§a inspeÃ§Ã£o inicial:

```bash
git status
git fetch origin
```

Confirme:

* a branch atual Ã© `main`
* nÃ£o hÃ¡ mudanÃ§as locais inesperadas
* o repositÃ³rio nÃ£o estÃ¡ atrÃ¡s da origem
* nÃ£o hÃ¡ conflito, merge pendente ou estado Git estranho

Se houver qualquer ambiguidade, pare e informe o usuÃ¡rio.

NÃ£o crie branch paralela.

---

## 4. Protocolo de inÃ­cio

Antes de modificar arquivos, envie ao usuÃ¡rio:

```text
Tarefa: [classificaÃ§Ã£o em uma frase]
Ferramenta/modelo em uso: [ex.: Codex / modelo atual]
Classe do modelo: [rÃ¡pido / padrÃ£o / profundo / contexto longo / multimodal / agente]
Tamanho: Pequeno / MÃ©dio / Grande
Arquivos provÃ¡veis: [lista]
Docs provÃ¡veis: [lista]
Riscos: [lista curta]
Plano: [3-5 passos]
```

Aguarde OK antes de editar.

Leitura, busca e inspeÃ§Ã£o sÃ£o permitidas antes do OK.
EdiÃ§Ã£o, criaÃ§Ã£o, remoÃ§Ã£o de arquivo e comandos destrutivos nÃ£o sÃ£o permitidos antes do OK.

---

## 5. Regras InegociÃ¡veis

**REFERÃŠNCIA COMPLETA: [`../../docsGerais/GUIA_CONVIVENCIA_IA.md`](../../docsGerais/GUIA_CONVIVENCIA_IA.md)**

* Trabalhe sempre em `main`. Nunca crie branches paralelas.
* FaÃ§a a menor mudanÃ§a que resolve o pedido.
* NÃ£o refatore fora do escopo.
* NÃ£o crie arquivos fora da organizaÃ§Ã£o prevista em `docs/GuiaOrganizacaoPastas.md`.
* Se precisar criar novo tipo de arquivo ou pasta, atualize o guia primeiro.
* Atualize documentaÃ§Ã£o na mesma tarefa quando mudar comportamento, fluxo, arquitetura, decisÃ£o tÃ©cnica ou organizaÃ§Ã£o.
* CÃ³digo sem documentaÃ§Ã£o necessÃ¡ria atualizada = tarefa incompleta.
* NÃ£o adicione dependÃªncia sem confirmaÃ§Ã£o explÃ­cita.
* NÃ£o altere configuraÃ§Ã£o crÃ­tica sem confirmaÃ§Ã£o explÃ­cita.
* Nunca inclua tokens, credenciais, chaves de API ou segredos no cÃ³digo.
* **Nunca execute modificaÃ§Ã£o sem plano + OK explÃ­cito.** Leitura (Grep, Glob) Ã© livre. ModificaÃ§Ã£o (Edit, Write, bash destrutivo, git) nÃ£o.

---

## 6. Branding e UI

Respeite sempre:

* **linka** sempre minÃºsculo
* cor de destaque: `var(--accent): #6C2BFF`
* sem `box-shadow`
* zero sombras
* fonte principal: **Geist**
* fonte monoespaÃ§ada: **JetBrains Mono** apenas para valores tÃ©cnicos com `tabular-nums`
* nÃ£o usar `Inter`, `Space Grotesk` ou `system-ui` hardcoded em CSS/TSX
* copy em pt-BR, objetiva e sem jargÃ£o tÃ©cnico para usuÃ¡rio final

Se uma sugestÃ£o violar esses padrÃµes, ela estÃ¡ errada.

---

## 7. Comandos permitidos

### InspeÃ§Ã£o

Permitidos sem confirmaÃ§Ã£o adicional:

```bash
git status
git diff
git log
git fetch origin
npm run build
npm test
```

Use `npm run build` e `npm test` para validar mudanÃ§as quando aplicÃ¡vel.

### Requer confirmaÃ§Ã£o explÃ­cita

PeÃ§a confirmaÃ§Ã£o especÃ­fica antes de executar:

```bash
git commit
git push
git push --force
npm install
npm uninstall
npm rm
npx wrangler pages deploy
```

TambÃ©m exigem confirmaÃ§Ã£o explÃ­cita alteraÃ§Ãµes em:

* `package.json`
* `package-lock.json`
* `vite.config.ts`
* `tsconfig*.json`
* configuraÃ§Ã£o de PWA
* configuraÃ§Ã£o de Cloudflare/Wrangler

Para `git push --force`, peÃ§a confirmaÃ§Ã£o dupla e explique o risco.

---

## 8. DomÃ­nios de maior risco

Tenha cuidado extra e prefira plano mais detalhado quando mexer em:

### `src/utils/classifier.ts`

Risco: quebrar classificaÃ§Ã£o, diagnÃ³stico ou regra de negÃ³cio.

AtenÃ§Ã£o a:

* thresholds
* textos interpretativos
* regras de classificaÃ§Ã£o
* impacto em testes

### `src/utils/speedtest.ts`

Risco: afetar precisÃ£o da mediÃ§Ã£o.

AtenÃ§Ã£o a:

* EMA
* P90
* `AbortController`
* cÃ¡lculo de download/upload/latÃªncia
* cancelamento de teste
* regressÃ£o de performance

### `src/utils/serverRegistry.ts`

Risco: quebrar endpoints, fallback ou integraÃ§Ã£o com Cloudflare.

AtenÃ§Ã£o a:

* URLs
* seleÃ§Ã£o de servidor
* detecÃ§Ã£o de ISP
* fallback de erro

### Build/deploy

Risco: quebrar produÃ§Ã£o.

AtenÃ§Ã£o a:

* Vite
* PWA
* service worker
* Cloudflare Pages
* Wrangler
* TypeScript config

---

## 9. DependÃªncias sensÃ­veis

NÃ£o altere sem confirmaÃ§Ã£o explÃ­cita:

* `vite-plugin-pwa`
* `recharts`
* Vite
* React
* TypeScript
* Wrangler
* qualquer dependÃªncia ligada a build, PWA ou deploy

Se uma dependÃªncia parecer desatualizada, registre a recomendaÃ§Ã£o. NÃ£o atualize automaticamente.

---

## 10. Testes e validaÃ§Ã£o

Depois de editar cÃ³digo, rode conforme o impacto:

```bash
npm test
npm run build
```

Se nÃ£o rodar algum comando, explique por quÃª.

NÃ£o diga que testou se nÃ£o testou.
NÃ£o esconda erro.
NÃ£o declare sucesso parcial como sucesso total.

---

## 11. DocumentaÃ§Ã£o

Atualize documentaÃ§Ã£o quando a mudanÃ§a afetar:

* comportamento do usuÃ¡rio
* fluxo de tela
* arquitetura
* hook/util compartilhado
* organizaÃ§Ã£o de pastas
* dependÃªncia sensÃ­vel
* decisÃ£o tÃ©cnica
* processo de deploy
* regra de IA/agente

Documentos comuns:

* `docs/DocumentacaoFuncionalSistema.md`
* `docs/DocumentacaoTecnicaSistema.md`
* `docs/GuiaOrganizacaoPastas.md`
* `docs/GuiaFluxoGit.md`
* `docs/ManifestoDesenvolvimentoIA.md`
* `docs/GuiaSelecaoModeloFerramentaIA.md`

Se nenhum documento precisar mudar, justifique no encerramento.

---

## 12. Deploy

Nunca faÃ§a deploy sem confirmaÃ§Ã£o explÃ­cita.

Antes de deploy:

1. `npm run build`
2. `npm test`
3. `git status`
4. confirmaÃ§Ã£o explÃ­cita do usuÃ¡rio

Comando padrÃ£o:

```bash
npx wrangler pages deploy dist --project-name linkaSpeedtestPwa --branch main
```

Se o repositÃ³rio tiver configuraÃ§Ã£o prÃ³pria de Wrangler, siga a documentaÃ§Ã£o local.

---

## 13. Commit e push

Este arquivo nÃ£o autoriza commit nem push.

Antes de commit:

1. mostre arquivos alterados
2. resuma as mudanÃ§as
3. peÃ§a confirmaÃ§Ã£o explÃ­cita
4. sÃ³ entÃ£o execute `git commit`

Antes de push:

1. confirme branch `main`
2. confirme estado local
3. peÃ§a confirmaÃ§Ã£o explÃ­cita
4. sÃ³ entÃ£o execute `git push`

---

## 14. Encerramento da tarefa

Ao finalizar, informe:

* arquivos de cÃ³digo alterados
* documentos atualizados, listando cada path
* comandos executados e resultado
* testes/build executados ou nÃ£o executados
* pendÃªncias restantes
* riscos restantes
* prÃ³ximos passos sugeridos

Formato sugerido:

```text
CÃ³digo alterado:
- path: resumo

Docs atualizadas:
- path: resumo

ValidaÃ§Ã£o:
- comando: resultado

PendÃªncias:
- item ou â€œnenhumaâ€

PrÃ³ximos passos:
- sugestÃ£o objetiva
```

---

## 15. Quando Parar e Perguntar

Pare antes de agir se:

* houver conflito entre instruÃ§Ãµes
* o pedido exigir branch nova
* o pedido exigir arquivo fora da organizaÃ§Ã£o documentada
* a mudanÃ§a for maior que o escopo aprovado
* houver risco de quebrar build/deploy
* houver credenciais, tokens ou segredos
* o usuÃ¡rio pedir deploy, push ou force push sem confirmaÃ§Ã£o clara

Em conflito de regras, use esta precedÃªncia:

1. Mensagem direta do usuÃ¡rio na sessÃ£o
2. [`../../docsGerais/GUIA_CONVIVENCIA_IA.md`](../../docsGerais/GUIA_CONVIVENCIA_IA.md) (regras centrais crÃ­ticas)
3. `AGENTS.md` (agente-especÃ­ficas)
4. `CLAUDE.md`, se existir (project-especÃ­ficas)
5. [`docs/DOCUMENTACAO_CONSOLIDADA.md`](docs/DOCUMENTACAO_CONSOLIDADA.md) (Ã­ndice local)
6. Demais documentos em `docs/` (PWA-especÃ­ficas)
7. Documentos em `../../docsGerais/` (cross-project)
8. ConvenÃ§Ãµes inferidas do cÃ³digo

Se houver conflito, **pare e pergunte**.

