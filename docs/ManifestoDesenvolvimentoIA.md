# Manifesto de Desenvolvimento com IA — linka SpeedTest PWA

> Este documento define o processo de desenvolvimento assistido por IA para o projeto linka SpeedTest. Leitura obrigatória integral antes de qualquer sessão de trabalho.

---

## 1. Princípio fundamental

A IA é um colaborador de engenharia — não um executor automático. Toda mudança passa por:

1. **Entender** — ler o código e a documentação existente.
2. **Planejar** — delinear o que vai mudar e por quê.
3. **Confirmar** — aguardar OK do usuário para mudanças não-triviais.
4. **Executar** — fazer a mudança mínima necessária.
5. **Documentar** — atualizar docs na mesma tarefa.

---

## 2. Leia antes de codar

Antes de qualquer modificação, ler na ordem:

1. [`../CLAUDE.md`](../CLAUDE.md)
2. Este documento (leitura integral)
3. [`GuiaOrganizacaoPastas.md`](GuiaOrganizacaoPastas.md)
4. Documento do domínio da tarefa (Funcional ou Técnico)

---

## 3. Proibições absolutas

- **Não inventar.** Se algo não está no código nem na doc, é pendência — nunca fabricar comportamento.
- **Não criar arquivos fora do previsto.** Ver `GuiaOrganizacaoPastas.md`.
- **Não modificar dependências** (`package.json`) sem aprovação explícita.
- **Não fazer deploy** (`wrangler pages deploy`) sem OK do usuário.
- **Não commitar credenciais**, tokens de API, chaves Cloudflare.
- **Não refatorar amplamente** sem plano explícito aprovado.
- **Não pular hooks de commit** (`--no-verify`).
- **Não fazer force push** sem confirmação dupla.
- **Não criar branch paralela** — `claude/*`, `feat/*`, `fix/*`, ou qualquer outra. Trabalhe sempre em `main`. Ver [`PoliticaBranchUnico.md`](PoliticaBranchUnico.md).
- **Não quebrar os 24 testes existentes** sem justificativa documentada.

---

## 3.bis Disciplina antes de executar

### 3.bis.1 — Leitura livre, modificação controlada

Qualquer tool de leitura (Read, Grep, Glob, Explore) pode ser usada livremente para entender o estado atual. Tools de modificação (Edit, Write, Bash com efeitos colaterais) só após plano + OK.

### 3.bis.2 — Pergunte quando houver dúvida

Situações que exigem pergunta antes de prosseguir:
- Mais de uma interpretação razoável do pedido
- Trade-off arquitetural relevante (ex.: estado local vs. global)
- Fato não confirmável no código (ex.: "esse endpoint aceita POST?")
- Escopo não claro (ex.: "arrume o PDF" — qual PDF, qual problema?)

### 3.bis.3 — Quando fazer plano formal

Faça plano formal (lista de passos numerados) quando a tarefa envolver:
- 3 ou mais passos de modificação
- 2 ou mais arquivos alterados
- Risco de quebrar build, tipos TS, ou testes
- Decisão arquitetural (novo hook, novo componente, nova dependência)
- Deploy

**Formato de plano:**
```
Tarefa: [descrição]
Arquivos a alterar: [lista]
Passos:
1. ...
2. ...
Riscos: [se houver]
Documentos a atualizar: [lista]
```

### 3.bis.4 — Avalie o contexto da sessão e oriente o usuário

**Ao iniciar qualquer sessão**, informe em uma mensagem:
- Ferramenta e modelo em uso (ex.: "Estou rodando como Claude Code / Sonnet 4.6").
- Se a tarefa pedida exige um modelo ou ferramenta diferente, diga antes de começar.

**A cada novo pedido**, avalie e comunique:

| Situação | O que fazer |
|---|---|
| Continuação direta do escopo anterior | Diga "Continuo aqui." e prossiga. |
| Tarefa de domínio diferente ou independente | "Esta tarefa é de outro domínio — recomendo abrir nova sessão para não saturar o contexto." |
| Sessão com muito contexto acumulado | "O contexto desta sessão está longo. Para melhor qualidade, abra nova sessão e informe o objetivo." |
| Tarefa que pede modelo mais potente | "Esta decisão arquitetural pede Opus 4.7. Use `/model claude-opus-4-7` antes de prosseguir." |
| Tarefa que pede outra ferramenta | "Esta tarefa é mais eficiente com [Cursor / Gemini / Copilot] porque [razão]. Quer continuar aqui mesmo assim?" |

**Sinais concretos de sessão saturada:**
- Mais de 3 tarefas distintas já concluídas na mesma sessão.
- A IA começa a repetir contexto que já foi dado antes.
- A tarefa nova não tem relação com o histórico da sessão.

**Nunca silencie uma recomendação de handoff** por achar que o usuário não vai querer trocar de ferramenta. É obrigação da IA informar — a decisão é do usuário.

---

## 4. Processo de implementação

### 4.1 Antes de modificar qualquer tela

1. Ler `DocumentacaoFuncionalSistema.md` seção da tela.
2. Confirmar que o comportamento atual bate com a doc (se não, registrar divergência).
3. Rodar mentalmente o impacto em props e tipos TS.

### 4.2 Antes de modificar qualquer util ou hook

1. Ler `DocumentacaoTecnicaSistema.md` seção correspondente.
2. Verificar se há testes em `src/__tests__/` cobrindo o comportamento.
3. Se a mudança altera contrato público (signature de função, interface), mapear todos os chamadores.

### 4.3 Após qualquer modificação

1. Verificar que `npm run build` passa sem erros TS.
2. Verificar que `npm test` passa (todos os testes).
3. Identificar quais documentos foram impactados pela mudança e atualizá-los **antes** de declarar a tarefa concluída.

**Tabela de decisão — o que mudei → qual doc atualizar:**

| O que foi alterado | Documento a atualizar |
|---|---|
| Tela (screen), fluxo de navegação, estado de UI, UX | `DocumentacaoFuncionalSistema.md` |
| Hook, util, componente, tipo TypeScript | `DocumentacaoTecnicaSistema.md` |
| Arquivo criado ou removido | `GuiaOrganizacaoPastas.md` |
| Regra Git, branch, worktree, fluxo de commit | `GuiaFluxoGit.md` |
| Ferramenta IA, modelo, critério de seleção | `GuiaSelecaoModeloIA.md` |
| Nova pasta ou reorganização de estrutura | `GuiaOrganizacaoPastas.md` |
| Regra de processo ou disciplina de IA | `ManifestoDesenvolvimentoIA.md` e/ou `CLAUDE.md` |

> Se a mudança tocar dois domínios (ex.: novo hook que muda o fluxo de uma tela), atualize **os dois** documentos correspondentes.

---

## 5. Padrões de código

### TypeScript

- Tipos em `src/types/index.ts` — nunca inline em componentes de tela.
- Prefer `type` sobre `interface` para unions; `interface` para objetos extensíveis.
- `unknown` em vez de `any`. Se `any` for inevitável, comentar o motivo.
- Props de componente: interface local no mesmo arquivo (não exportar se não reutilizar).

### React

- `useCallback` e `useMemo` apenas quando houver custo mensurável — não como padrão defensivo.
- Hooks customizados em `src/hooks/` — nunca inline em telas.
- Estado de UI local fica no componente; estado compartilhado entre telas vai para `App.tsx`.
- Evitar prop drilling além de 2 níveis — criar hook ou contexto se necessário.

### CSS

- 100% CSS Custom Properties — zero valores hardcoded de cor ou espaçamento.
- Mobile-first. Breakpoint único: `@media (min-width: 480px)`.
- Naming: BEM-like com prefixo `.lk-` (ex.: `.lk-start__go`, `.lk-history__item`).
- Sem `box-shadow`. Sem `text-shadow`. Sem gradientes (exceto em `tokens.css` onde definido).
- Transições: máximo 300ms. Curva padrão: `cubic-bezier(0.32, 0.72, 0, 1)`.

### Branding

Ver guia completo: [`GuiaBranding.md`](GuiaBranding.md).

Regras inegociáveis (resumo):

- "linka" **sempre minúsculo** — em copy, títulos, manifest, PDF.
- Cor accent: `#6C2BFF` (ou `var(--accent)`) — **apenas** em CTAs, orb, anel do gauge, ícones pinned.
- **Zero box-shadow e text-shadow.**
- **Zero emoji em UI de produto** — apenas SVGs stroke-based de `icons.tsx`.
- Fonte: **Geist** 400/500/600/700 — família única para toda a interface (display e body).
- Números de métrica **sempre** em `var(--font-display)` (Geist).
- Cores via tokens (`var(--*)`) — sem hex hardcoded em `.tsx` ou `.css`.
- Design direction **iOS-Calma**: superfícies neutras, hierarquia pelo tamanho, dados com cor semântica (DL azul, UL verde, accent para latência/accent).
- Cabeçalho de tela: `‹ Início` (accent, 14px, 500) à esquerda + label (text-3, 13px) à direita, `padding: 14px 16px 4px`.
- Copy em pt-BR, tom objetivo, sem jargão técnico ao usuário final.

---

## 6. Fluxo Git

### 6.0 Sincronização pré-sessão (obrigatória)

Antes de qualquer modificação, sincronize com o remoto:

```bash
git fetch origin
git log --oneline HEAD..origin/main   # verificar commits novos
git pull origin main                  # trazer se houver
git status                            # confirmar estado limpo
```

**Regra:** se `git log HEAD..origin/main` retornar qualquer commit, **não edite nada** até completar o pull. Trabalhar sobre estado desatualizado = risco de perda de trabalho.

Ver protocolo completo em [`GuiaFluxoGit.md`](GuiaFluxoGit.md).

### 6.1 Padrões de commit

Commit apenas quando o usuário pedir explicitamente. Formato:

```
tipo: descrição curta em pt-BR

Corpo opcional explicando o porquê (não o quê — o quê está no diff).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## 7. Deploy

Deploy em Cloudflare Pages requer confirmação explícita do usuário.

Comando:
```bash
npx wrangler pages deploy dist --project-name linka-speedtest --branch main
```

Verificar antes do deploy:
- `npm run build` sem erros
- `npm test` passando
- Docs atualizadas
- Nenhuma credencial no código

---

## 8. Gestão de backlog

Pendências identificadas durante uma tarefa que **não** são parte do escopo atual devem ser registradas em [`IndiceDocumentacao.md`](IndiceDocumentacao.md) seção "Backlog registrado", não implementadas na hora.

---

## 9. Checklist final de tarefa

Antes de declarar uma tarefa concluída, confirmar:

- [ ] Build passa: `npm run build`
- [ ] Testes passam: `npm test`
- [ ] Nenhum `any` introduzido sem justificativa
- [ ] Nenhum valor hardcoded de cor/espaçamento
- [ ] Documentação atualizada: listar explicitamente quais docs foram tocados (use a tabela de decisão da seção 4.3)
- [ ] `GuiaOrganizacaoPastas.md` atualizado se arquivos criados/removidos
- [ ] Branding: "linka" minúsculo, sem box-shadow, ícones SVG
- [ ] Copy em pt-BR

---

## 10. Em caso de conflito entre este documento e o código

O código é fonte da verdade para o que **existe**. Este documento é fonte da verdade para o que **deveria existir**. Em caso de divergência:

1. Registre a divergência.
2. Pergunte ao usuário qual é o comportamento desejado.
3. Alinhe código e doc — nunca deixe os dois divergindo em silêncio.
