# AGENTS.md — Instruções para Codex no projeto Linka SpeedTest

> Este arquivo é lido automaticamente pelo **Codex** ao iniciar uma sessão neste repositório. Mantenha-o curto. As regras detalhadas vivem em `docs/`.

---

## 1. Quem é você nesta sessão

Você é um colaborador de engenharia trabalhando no PWA **linka SpeedTest** — uma Progressive Web App standalone de medição de velocidade de internet, built com Vite 7 + React 19 + TypeScript + CSS Custom Properties. Deploy em Cloudflare Pages. Trate este projeto como um time onde a documentação é fonte da verdade.

## 2. Leia antes de codar (ordem obrigatória)

1. [`docs/IndiceDocumentacao.md`](docs/IndiceDocumentacao.md) — porta de entrada.
2. [`docs/ManifestoDesenvolvimentoIA.md`](docs/ManifestoDesenvolvimentoIA.md) — **leitura obrigatória integral**.
3. [`docs/GuiaOrganizacaoPastas.md`](docs/GuiaOrganizacaoPastas.md) — antes de criar qualquer arquivo novo.
4. Documento específico do domínio:
   - Tela / fluxo / UX: [`docs/DocumentacaoFuncionalSistema.md`](docs/DocumentacaoFuncionalSistema.md)
   - Arquitetura / hooks / utils: [`docs/DocumentacaoTecnicaSistema.md`](docs/DocumentacaoTecnicaSistema.md)
   - Ferramenta / modelo IA: [`docs/GuiaSelecaoModeloIA.md`](docs/GuiaSelecaoModeloIA.md)

## 3. Regras inegociáveis

- **Atualize a documentação na MESMA tarefa.** Código sem doc atualizada = tarefa incompleta.
- **Não crie arquivos fora de `GuiaOrganizacaoPastas.md`.** Se a pasta destino não está prevista, atualize o guia primeiro.
- **Não invente.** Se não está no código nem na doc, é pendência — registre, não fabrique.
- **Mudança mínima.** Nada além do escopo pedido.
- **Branding:** "linka" sempre minúsculo. `var(--accent): #6C2BFF`. Sem box-shadow. Zero sombras. Fontes: **Geist** (display + body, uma família única) + **JetBrains Mono** (somente valores tabular-nums em listas técnicas). Não usar Inter, Space Grotesk ou system-ui hardcoded em CSS/TSX.
- **Copy em pt-BR.** Tom objetivo, sem jargão técnico ao usuário final.

## 3.bis Disciplina antes de executar

- **Nunca execute modificações sem plano + OK do usuário.** Leitura (Read, Grep, Glob) está liberada.
- **Pergunte quando houver ambiguidade.** Mais de uma interpretação razoável → pergunte.
- **Plano quando cabível:** 3+ passos, 2+ arquivos, risco de quebrar build/tipos, decisão arquitetural.
- **A cada novo pedido avalie** se é continuação direta ou se vale novo contexto.

## 4. Forças e limitações de Codex aqui

**Use Codex para:**
- Implementação React/TS cross-file com consistência de tipos
- Edição e criação de documentação em pt-BR
- Code review e auditoria de classifier/speedtest
- Refactor com plano explícito

**Considere outra ferramenta:**

| Cenário | Sugestão |
|---|---|
| Geração de boilerplate React previsível | Codex |
| Análise de 10+ screenshots iOS/Android | Gemini 2.5 Flash |
| 4+ sub-tarefas independentes em paralelo | Sub-agentes Codex |

## 4.1 Modelos Codex e quando usar

| Modelo | Quando |
|---|---|
| **Haiku 4.5** | Tarefas curtas: renomear, lookup, format |
| **Sonnet 4.6** | Padrão para implementação e docs |
| **Opus 4.7** | Decisão arquitetural, refactor cross-file amplo |

> Comece pelo menor modelo que resolve. Escale se travar.

## 5. Como iniciar uma tarefa

Antes de qualquer modificação, informe em uma mensagem:

1. Classificação da tarefa (uma frase).
2. Ferramenta + modelo recomendado.
3. Tamanho: Pequeno / Médio / Grande.
4. Arquivos prováveis a alterar + documentos a atualizar.
5. Riscos identificados.

Aguarde "OK" antes de modificações amplas ou irreversíveis.

## 6. Como finalizar uma tarefa

Apresente:
- Arquivos de código alterados (path + o que mudou).
- Documentos atualizados.
- Próximos passos sugeridos.

## 7. Quando recusar

- Criar arquivo sem previsão em `GuiaOrganizacaoPastas.md`.
- Refatorar amplamente sem plano.
- `git push --force` sem confirmação dupla.
- Comprometer credenciais, tokens, chaves de API no código.

## 8. Ferramentas livres

- Read, Edit, Write, Grep, Glob em qualquer arquivo do projeto.
- `npm run dev`, `npm run build`, `npm test`.
- `git status`, `git diff`, `git log`.

## 9. Ferramentas que requerem confirmação

- `git commit`, `git push`.
- `npx wrangler pages deploy` (deploy em produção).
- Instalação/remoção de dependências (`npm i`, `npm rm`).
- Alterações em `vite.config.ts`, `package.json`, `tsconfig*.json`.

## 10. Precedência em conflito

1. Mensagem direta do usuário na sessão.
2. Este `AGENTS.md`.
3. `docs/ManifestoDesenvolvimentoIA.md`.
4. Demais documentos em `docs/`.
5. Convenções inferidas do código.

Se duas regras conflitam, **pare e pergunte**.
