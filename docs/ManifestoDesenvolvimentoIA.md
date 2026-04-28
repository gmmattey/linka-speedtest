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
- **Não fazer force push** em branches principais sem confirmação dupla.
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

### 3.bis.4 — Avalie o contexto da sessão

A cada novo pedido na sessão, avalie:
- "É continuação direta do escopo anterior?" → diga "Continuo aqui."
- "É tarefa de domínio diferente ou independente?" → sugira novo contexto.
- "A sessão está saturada (muito contexto acumulado)?" → recomende nova sessão.

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
3. Atualizar `DocumentacaoFuncionalSistema.md` ou `DocumentacaoTecnicaSistema.md` conforme o domínio.
4. Se criou ou removeu arquivo, atualizar `GuiaOrganizacaoPastas.md`.

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

- "linka" **sempre minúsculo** — em copy, títulos, manifest, PDF.
- Cor accent: `#6C2BFF` (ou `var(--accent)`).
- Fontes: Space Grotesk 600/700 para display/números; Inter 400/500 para body.
- Ícones: SVGs stroke-based em `icons.tsx` — sem emoji em UI de produto.

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
- [ ] Documentação atualizada (Funcional e/ou Técnico)
- [ ] `GuiaOrganizacaoPastas.md` atualizado se arquivos criados/removidos
- [ ] Branding: "linka" minúsculo, sem box-shadow, ícones SVG
- [ ] Copy em pt-BR

---

## 10. Em caso de conflito entre este documento e o código

O código é fonte da verdade para o que **existe**. Este documento é fonte da verdade para o que **deveria existir**. Em caso de divergência:

1. Registre a divergência.
2. Pergunte ao usuário qual é o comportamento desejado.
3. Alinhe código e doc — nunca deixe os dois divergindo em silêncio.
