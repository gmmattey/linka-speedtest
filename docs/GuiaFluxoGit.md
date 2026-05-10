# Guia de Fluxo Git â€” linka SpeedTest PWA

> Este documento se aplica a **qualquer colaborador**: Claude Code, Cursor, GitHub Copilot, Gemini CLI, ou humano. Sempre consulte antes de iniciar qualquer sessÃ£o de trabalho neste repositÃ³rio.

---

## PrincÃ­pio

**Toda sessÃ£o de trabalho comeÃ§a sincronizada com o remoto.** Trabalhar sobre estado desatualizado Ã© a principal causa de conflitos, retrabalho e perda de contribuiÃ§Ãµes. NÃ£o existe "sÃ³ vou dar uma olhada" sem fazer o fetch primeiro â€” verificar estado tambÃ©m conta como inÃ­cio de sessÃ£o.

RepositÃ³rio remoto: `https://github.com/gmmattey/linkaSpeedtestPwa.git`  
Branch de produÃ§Ã£o: `main`

---

## 1. Antes de qualquer sessÃ£o (checklist obrigatÃ³rio)

Execute na ordem, sem pular passos:

```bash
# 1. Buscar estado atual do remoto
git fetch origin

# 2. Verificar se hÃ¡ commits novos que nÃ£o estÃ£o no local
git log --oneline HEAD..origin/main

# 3a. Se houver commits novos â†’ trazer para o local ANTES de qualquer ediÃ§Ã£o
git pull origin main

# 3b. Se nÃ£o houver commits novos â†’ pode comeÃ§ar
# (sem output no passo 2 = local estÃ¡ atualizado)

# 4. Confirmar que estÃ¡ limpo e sincronizado
git status
```

**CritÃ©rio de OK:** `git status` mostra `nothing to commit, working tree clean` e `Your branch is up to date with 'origin/main'`.

> **Se houver divergÃªncia (commits locais nÃ£o enviados + commits remotos novos):** resolva antes de qualquer trabalho novo. Ver seÃ§Ã£o 6 (SituaÃ§Ãµes de risco).

---

## 2. Durante a sessÃ£o

- Nunca iniciar ediÃ§Ãµes enquanto houver commits remotos nÃ£o puxados.
- NÃ£o criar commits sem aprovaÃ§Ã£o explÃ­cita do usuÃ¡rio/responsÃ¡vel.
- Se perceber que o estado remoto mudou durante a sessÃ£o: pause, faÃ§a fetch, resolva antes de continuar.
- Commits incrementais sÃ£o preferÃ­veis a um commit gigante no final â€” facilitam revisÃ£o e reverter.

---

## 3. Ao finalizar uma sessÃ£o

```bash
# 1. Verificar o que serÃ¡ commitado
git status
git diff --staged

# 2. Commit (apenas com aprovaÃ§Ã£o explÃ­cita)
git commit -m "tipo: descriÃ§Ã£o curta em pt-BR"

# 3. Push para o remoto (apenas com confirmaÃ§Ã£o)
git push origin main
```

**Antes de qualquer push:**
- [ ] `npm run build` sem erros
- [ ] `npm test` â€” todos os testes passando
- [ ] DocumentaÃ§Ã£o atualizada na mesma tarefa
- [ ] Nenhuma credencial ou token no cÃ³digo

---

## 4. Worktrees do Claude Code

Claude Code cria **worktrees** isolados por diretÃ³rio para cada sessÃ£o. O worktree Ã© isolamento de **diretÃ³rio**, nÃ£o de branch â€” e deve sempre usar `main`:

```
Repo principal:   D:\Projetos\Linka SpeedTest\              (branch: main)
Worktree Claude:  D:\Projetos\Linka SpeedTest\.claude\worktrees\<nome>\  (branch: main)
```

- AlteraÃ§Ãµes feitas no worktree ficam isoladas no diretÃ³rio atÃ© o commit + push para `main`.
- O `git fetch origin` dentro do worktree acessa o mesmo remoto â€” sempre funciona.
- **Nunca crie uma nova branch** a partir do worktree. Ver [`PoliticaBranchUnico.md`](PoliticaBranchUnico.md).
- Se o ambiente forÃ§ar a criaÃ§Ã£o de branch nova ao montar o worktree: **pare e informe o usuÃ¡rio** antes de qualquer ediÃ§Ã£o.

**VerificaÃ§Ã£o de qual worktree e branch vocÃª estÃ¡:**
```bash
git worktree list
git branch   # deve mostrar * main
```

---

## 5. Quando o humano pushes diretamente no GitHub

SituaÃ§Ã£o comum: o usuÃ¡rio sobe documentos via GitHub web UI ou faz push de outra mÃ¡quina sem avisar a sessÃ£o de IA ativa.

**O que fazer (IA):**
1. Ao receber qualquer pedido de modificaÃ§Ã£o, sempre comece com `git fetch origin`.
2. Se `git log HEAD..origin/main` retornar commits: **nÃ£o edite nada ainda**.
3. Execute `git pull origin main` para trazer as mudanÃ§as.
4. SÃ³ entÃ£o proceda com o pedido.

**O que fazer (humano):**
- Avise a sessÃ£o de IA ativa antes de fazer push direto.
- Se jÃ¡ fez push sem avisar: informe a IA no inÃ­cio da prÃ³xima mensagem para que ela sincronize.

---

## 6. SituaÃ§Ãµes de risco

### DivergÃªncia (local e remoto com commits diferentes)

```bash
# Ver o que hÃ¡ no remoto que nÃ£o estÃ¡ local
git log --oneline HEAD..origin/main

# Ver o que hÃ¡ local que nÃ£o foi pushado
git log --oneline origin/main..HEAD
```

Se ambos tiverem commits distintos (divergÃªncia real):
1. **NÃ£o use `git push --force`** sem confirmaÃ§Ã£o dupla do usuÃ¡rio responsÃ¡vel.
2. Prefira `git pull --rebase origin main` para linearizar o histÃ³rico.
3. Se houver conflitos de merge: resolva arquivo a arquivo, documente a decisÃ£o.

### Duas sessÃµes de IA em paralelo

Risco: duas IAs editando o mesmo arquivo ao mesmo tempo.

- Cada sessÃ£o deve `git fetch` ao inÃ­cio e ao retomar.
- Se perceber que outra sessÃ£o commitou algo: pare, faÃ§a pull, retome.
- Nunca force-push para resolver conflito sem aprovaÃ§Ã£o explÃ­cita.

### Rebase de histÃ³rico pÃºblico

- **Nunca rebazar commits jÃ¡ presentes em `origin/main`** sem aprovaÃ§Ã£o explÃ­cita.
- `git commit --amend` de commits jÃ¡ pushados = proibido.

---

## 7. Comandos de referÃªncia rÃ¡pida

| Objetivo | Comando |
|---|---|
| Verificar estado do remoto | `git fetch origin` |
| Ver commits novos no remoto | `git log --oneline HEAD..origin/main` |
| Ver commits locais nÃ£o pushados | `git log --oneline origin/main..HEAD` |
| Trazer mudanÃ§as do remoto | `git pull origin main` |
| Estado atual | `git status` |
| HistÃ³rico local | `git log --oneline -10` |
| Todos os worktrees | `git worktree list` |
| Push seguro (apÃ³s aprovaÃ§Ã£o) | `git push origin main` |

---

## 8. Resumo em uma frase

> **fetch â†’ verificar â†’ pull se necessÃ¡rio â†’ sÃ³ entÃ£o trabalhar â†’ commit sÃ³ com OK â†’ push sÃ³ com OK.**

