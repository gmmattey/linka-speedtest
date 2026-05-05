# AGENTS.md — Instruções para agentes IA no projeto linka SpeedTest

> Este arquivo orienta agentes de código, especialmente Codex, ao trabalhar neste repositório.
> Mantenha este arquivo curto, prático e operacional.
>
> Regras detalhadas vivem em `docs/`.

---

## 1. Escopo

Você está trabalhando no PWA **linka SpeedTest**.

O projeto é uma Progressive Web App standalone de medição de velocidade de internet, construída com Vite, React, TypeScript e CSS Custom Properties, com deploy em Cloudflare Pages.

Estas instruções valem para Codex e qualquer outro agente IA que consiga ler, editar e executar comandos neste repositório.

---

## 2. Fontes da verdade

Antes de modificar arquivos, leia nesta ordem:

1. `docs/IndiceDocumentacao.md`
2. `docs/ManifestoDesenvolvimentoIA.md`
3. `docs/GuiaFluxoGit.md`
4. `docs/GuiaOrganizacaoPastas.md`
5. Documento específico da tarefa:

   * UX, tela ou fluxo: `docs/DocumentacaoFuncionalSistema.md`
   * Arquitetura, hooks ou utils: `docs/DocumentacaoTecnicaSistema.md`
   * Escolha de ferramenta/modelo IA: `docs/GuiaSelecaoModeloFerramentaIA.md`

Se algo não estiver no código nem na documentação, não invente. Registre como pendência.

---

## 3. Antes de editar

Antes de qualquer alteração, faça inspeção inicial:

```bash
git status
git fetch origin
```

Confirme:

* a branch atual é `main`
* não há mudanças locais inesperadas
* o repositório não está atrás da origem
* não há conflito, merge pendente ou estado Git estranho

Se houver qualquer ambiguidade, pare e informe o usuário.

Não crie branch paralela.

---

## 4. Protocolo de início

Antes de modificar arquivos, envie ao usuário:

```text
Tarefa: [classificação em uma frase]
Ferramenta/modelo em uso: [ex.: Codex / modelo atual]
Classe do modelo: [rápido / padrão / profundo / contexto longo / multimodal / agente]
Tamanho: Pequeno / Médio / Grande
Arquivos prováveis: [lista]
Docs prováveis: [lista]
Riscos: [lista curta]
Plano: [3-5 passos]
```

Aguarde OK antes de editar.

Leitura, busca e inspeção são permitidas antes do OK.
Edição, criação, remoção de arquivo e comandos destrutivos não são permitidos antes do OK.

---

## 5. Regras inegociáveis

* Trabalhe sempre em `main`.
* Nunca crie branches paralelas.
* Faça a menor mudança que resolve o pedido.
* Não refatore fora do escopo.
* Não crie arquivos fora da organização prevista em `docs/GuiaOrganizacaoPastas.md`.
* Se precisar criar novo tipo de arquivo ou pasta não prevista, atualize o guia primeiro.
* Atualize documentação na mesma tarefa quando mudar comportamento, fluxo, arquitetura, decisão técnica ou organização.
* Código sem documentação necessária atualizada é tarefa incompleta.
* Não adicione dependência sem confirmação explícita.
* Não altere configuração crítica sem confirmação explícita.
* Nunca inclua tokens, credenciais, chaves de API ou segredos no código.

---

## 6. Branding e UI

Respeite sempre:

* **linka** sempre minúsculo
* cor de destaque: `var(--accent): #6C2BFF`
* sem `box-shadow`
* zero sombras
* fonte principal: **Geist**
* fonte monoespaçada: **JetBrains Mono** apenas para valores técnicos com `tabular-nums`
* não usar `Inter`, `Space Grotesk` ou `system-ui` hardcoded em CSS/TSX
* copy em pt-BR, objetiva e sem jargão técnico para usuário final

Se uma sugestão violar esses padrões, ela está errada.

---

## 7. Comandos permitidos

### Inspeção

Permitidos sem confirmação adicional:

```bash
git status
git diff
git log
git fetch origin
npm run build
npm test
```

Use `npm run build` e `npm test` para validar mudanças quando aplicável.

### Requer confirmação explícita

Peça confirmação específica antes de executar:

```bash
git commit
git push
git push --force
npm install
npm uninstall
npm rm
npx wrangler pages deploy
```

Também exigem confirmação explícita alterações em:

* `package.json`
* `package-lock.json`
* `vite.config.ts`
* `tsconfig*.json`
* configuração de PWA
* configuração de Cloudflare/Wrangler

Para `git push --force`, peça confirmação dupla e explique o risco.

---

## 8. Domínios de maior risco

Tenha cuidado extra e prefira plano mais detalhado quando mexer em:

### `src/utils/classifier.ts`

Risco: quebrar classificação, diagnóstico ou regra de negócio.

Atenção a:

* thresholds
* textos interpretativos
* regras de classificação
* impacto em testes

### `src/utils/speedtest.ts`

Risco: afetar precisão da medição.

Atenção a:

* EMA
* P90
* `AbortController`
* cálculo de download/upload/latência
* cancelamento de teste
* regressão de performance

### `src/utils/serverRegistry.ts`

Risco: quebrar endpoints, fallback ou integração com Cloudflare.

Atenção a:

* URLs
* seleção de servidor
* detecção de ISP
* fallback de erro

### Build/deploy

Risco: quebrar produção.

Atenção a:

* Vite
* PWA
* service worker
* Cloudflare Pages
* Wrangler
* TypeScript config

---

## 9. Dependências sensíveis

Não altere sem confirmação explícita:

* `vite-plugin-pwa`
* `recharts`
* Vite
* React
* TypeScript
* Wrangler
* qualquer dependência ligada a build, PWA ou deploy

Se uma dependência parecer desatualizada, registre a recomendação. Não atualize automaticamente.

---

## 10. Testes e validação

Depois de editar código, rode conforme o impacto:

```bash
npm test
npm run build
```

Se não rodar algum comando, explique por quê.

Não diga que testou se não testou.
Não esconda erro.
Não declare sucesso parcial como sucesso total.

---

## 11. Documentação

Atualize documentação quando a mudança afetar:

* comportamento do usuário
* fluxo de tela
* arquitetura
* hook/util compartilhado
* organização de pastas
* dependência sensível
* decisão técnica
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

Nunca faça deploy sem confirmação explícita.

Antes de deploy:

1. `npm run build`
2. `npm test`
3. `git status`
4. confirmação explícita do usuário

Comando padrão:

```bash
npx wrangler pages deploy dist --project-name linka-speedtest --branch main
```

Se o repositório tiver configuração própria de Wrangler, siga a documentação local.

---

## 13. Commit e push

Este arquivo não autoriza commit nem push.

Antes de commit:

1. mostre arquivos alterados
2. resuma as mudanças
3. peça confirmação explícita
4. só então execute `git commit`

Antes de push:

1. confirme branch `main`
2. confirme estado local
3. peça confirmação explícita
4. só então execute `git push`

---

## 14. Encerramento da tarefa

Ao finalizar, informe:

* arquivos de código alterados
* documentos atualizados, listando cada path
* comandos executados e resultado
* testes/build executados ou não executados
* pendências restantes
* riscos restantes
* próximos passos sugeridos

Formato sugerido:

```text
Código alterado:
- path: resumo

Docs atualizadas:
- path: resumo

Validação:
- comando: resultado

Pendências:
- item ou “nenhuma”

Próximos passos:
- sugestão objetiva
```

---

## 15. Quando parar e perguntar

Pare antes de agir se:

* houver conflito entre instruções
* o pedido exigir branch nova
* o pedido exigir arquivo fora da organização documentada
* a mudança for maior que o escopo aprovado
* houver risco de quebrar build/deploy
* houver credenciais, tokens ou segredos
* o usuário pedir deploy, push ou force push sem confirmação clara

Em conflito de regras, use esta precedência:

1. Mensagem direta do usuário na sessão
2. `AGENTS.md`
3. `CLAUDE.md`, se existir
4. `docs/ManifestoDesenvolvimentoIA.md`
5. demais documentos em `docs/`
6. convenções inferidas do código

Se ainda houver d
