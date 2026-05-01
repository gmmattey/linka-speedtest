# Guia de Fluxo Git — linka SpeedTest PWA

> Este documento se aplica a **qualquer colaborador**: Claude Code, Cursor, GitHub Copilot, Gemini CLI, ou humano. Sempre consulte antes de iniciar qualquer sessão de trabalho neste repositório.

---

## Princípio

**Toda sessão de trabalho começa sincronizada com o remoto.** Trabalhar sobre estado desatualizado é a principal causa de conflitos, retrabalho e perda de contribuições. Não existe "só vou dar uma olhada" sem fazer o fetch primeiro — verificar estado também conta como início de sessão.

Repositório remoto: `https://github.com/gmmattey/linka-speedtest.git`  
Branch de produção: `main`

---

## 1. Antes de qualquer sessão (checklist obrigatório)

Execute na ordem, sem pular passos:

```bash
# 1. Buscar estado atual do remoto
git fetch origin

# 2. Verificar se há commits novos que não estão no local
git log --oneline HEAD..origin/main

# 3a. Se houver commits novos → trazer para o local ANTES de qualquer edição
git pull origin main

# 3b. Se não houver commits novos → pode começar
# (sem output no passo 2 = local está atualizado)

# 4. Confirmar que está limpo e sincronizado
git status
```

**Critério de OK:** `git status` mostra `nothing to commit, working tree clean` e `Your branch is up to date with 'origin/main'`.

> **Se houver divergência (commits locais não enviados + commits remotos novos):** resolva antes de qualquer trabalho novo. Ver seção 6 (Situações de risco).

---

## 2. Durante a sessão

- Nunca iniciar edições enquanto houver commits remotos não puxados.
- Não criar commits sem aprovação explícita do usuário/responsável.
- Se perceber que o estado remoto mudou durante a sessão: pause, faça fetch, resolva antes de continuar.
- Commits incrementais são preferíveis a um commit gigante no final — facilitam revisão e reverter.

---

## 3. Ao finalizar uma sessão

```bash
# 1. Verificar o que será commitado
git status
git diff --staged

# 2. Commit (apenas com aprovação explícita)
git commit -m "tipo: descrição curta em pt-BR"

# 3. Push para o remoto (apenas com confirmação)
git push origin main
```

**Antes de qualquer push:**
- [ ] `npm run build` sem erros
- [ ] `npm test` — todos os 24 testes passando
- [ ] Documentação atualizada na mesma tarefa
- [ ] Nenhuma credencial ou token no código

---

## 4. Worktrees do Claude Code

Claude Code cria **worktrees** isolados por diretório para cada sessão. O worktree é isolamento de **diretório**, não de branch — e deve sempre usar `main`:

```
Repo principal:   D:\Projetos\Linka SpeedTest\              (branch: main)
Worktree Claude:  D:\Projetos\Linka SpeedTest\.claude\worktrees\<nome>\  (branch: main)
```

- Alterações feitas no worktree ficam isoladas no diretório até o commit + push para `main`.
- O `git fetch origin` dentro do worktree acessa o mesmo remoto — sempre funciona.
- **Nunca crie uma nova branch** a partir do worktree. Ver [`PoliticaBranchUnico.md`](PoliticaBranchUnico.md).
- Se o ambiente forçar a criação de branch nova ao montar o worktree: **pare e informe o usuário** antes de qualquer edição.

**Verificação de qual worktree e branch você está:**
```bash
git worktree list
git branch   # deve mostrar * main
```

---

## 5. Quando o humano pushes diretamente no GitHub

Situação comum: o usuário sobe documentos via GitHub web UI ou faz push de outra máquina sem avisar a sessão de IA ativa.

**O que fazer (IA):**
1. Ao receber qualquer pedido de modificação, sempre comece com `git fetch origin`.
2. Se `git log HEAD..origin/main` retornar commits: **não edite nada ainda**.
3. Execute `git pull origin main` para trazer as mudanças.
4. Só então proceda com o pedido.

**O que fazer (humano):**
- Avise a sessão de IA ativa antes de fazer push direto.
- Se já fez push sem avisar: informe a IA no início da próxima mensagem para que ela sincronize.

---

## 6. Situações de risco

### Divergência (local e remoto com commits diferentes)

```bash
# Ver o que há no remoto que não está local
git log --oneline HEAD..origin/main

# Ver o que há local que não foi pushado
git log --oneline origin/main..HEAD
```

Se ambos tiverem commits distintos (divergência real):
1. **Não use `git push --force`** sem confirmação dupla do usuário responsável.
2. Prefira `git pull --rebase origin main` para linearizar o histórico.
3. Se houver conflitos de merge: resolva arquivo a arquivo, documente a decisão.

### Duas sessões de IA em paralelo

Risco: duas IAs editando o mesmo arquivo ao mesmo tempo.

- Cada sessão deve `git fetch` ao início e ao retomar.
- Se perceber que outra sessão commitou algo: pare, faça pull, retome.
- Nunca force-push para resolver conflito sem aprovação explícita.

### Rebase de histórico público

- **Nunca rebazar commits já presentes em `origin/main`** sem aprovação explícita.
- `git commit --amend` de commits já pushados = proibido.

---

## 7. Comandos de referência rápida

| Objetivo | Comando |
|---|---|
| Verificar estado do remoto | `git fetch origin` |
| Ver commits novos no remoto | `git log --oneline HEAD..origin/main` |
| Ver commits locais não pushados | `git log --oneline origin/main..HEAD` |
| Trazer mudanças do remoto | `git pull origin main` |
| Estado atual | `git status` |
| Histórico local | `git log --oneline -10` |
| Todos os worktrees | `git worktree list` |
| Push seguro (após aprovação) | `git push origin main` |

---

## 8. Resumo em uma frase

> **fetch → verificar → pull se necessário → só então trabalhar → commit só com OK → push só com OK.**
