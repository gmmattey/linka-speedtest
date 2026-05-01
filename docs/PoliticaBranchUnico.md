# Política de Branch Único — linka SpeedTest PWA

> Este documento se aplica a **qualquer colaborador IA**: Claude Code, Cursor, GitHub Copilot, Gemini CLI, ou qualquer outro. Não há exceções.

---

## Regra

**Toda IA trabalha exclusivamente na branch `main`. Criar branch paralela é proibido.**

Nenhuma branch do tipo `claude/*`, `feat/*`, `fix/*`, `chore/*`, `docs/*`, ou qualquer outra deve ser criada. Em nenhuma hipótese. Nem para experimentos, nem para drafts, nem para "só testar uma coisa rápida".

---

## Por quê

Este é um projeto de desenvolvedor solo. Branches paralelas criadas por IAs:

- Acumulam drift silencioso em relação ao `main`.
- Geram PRs desnecessários que ninguém revisa antes de mergear.
- Criam ruído no histórico Git sem valor real.
- Entregam falsa sensação de isolamento — o risco de conflito não desaparece, só é adiado.

O ganho de trabalhar diretamente em `main` (histórico limpo, feedback imediato, zero overhead de integração) supera qualquer vantagem hipotética de isolamento em branches.

---

## Como operar corretamente

```bash
# 1. Sincronizar antes de qualquer edição
git fetch origin
git log --oneline HEAD..origin/main   # deve estar vazio
git pull origin main                  # se não estiver

# 2. Confirmar que está em main
git branch                            # deve mostrar * main

# 3. Fazer o trabalho na branch main
# (editar, testar localmente)

# 4. Commit e push — apenas com aprovação explícita do usuário
git commit -m "tipo: descrição em pt-BR"
git push origin main
```

**Antes de qualquer push:** build limpo (`npm run build`) + testes passando (`npm test`).

---

## Worktrees do Claude Code

O Claude Code cria worktrees isolados automaticamente. Worktrees são isolamento de **diretório**, não de branch — e devem ser configurados para usar `main`:

```
Repo principal:   D:\Projetos\Linka SpeedTest\              (branch: main)
Worktree Claude:  D:\Projetos\Linka SpeedTest\.claude\worktrees\<nome>\  (branch: main)
```

Se o ambiente do Claude Code forçar a criação de uma branch nova ao montar o worktree:

1. **Não prossiga com edições.**
2. Informe o usuário imediatamente.
3. Aguarde instrução para reconfigurar ou trabalhar no repositório principal.

---

## Sem exceções

Qualquer situação que pareça justificar uma branch paralela é, na verdade, um sinal para **parar e perguntar** ao usuário — não para criar a branch e seguir em frente.
