# Guia de Seleção de Modelo e Ferramenta IA — linka SpeedTest PWA

> Use este guia antes de iniciar qualquer tarefa para escolher a ferramenta e o modelo mais eficientes. Economize custo sem sacrificar qualidade.
>
> **Aplicabilidade:** Este guia vale para qualquer IA colaborando neste repositório — Claude Code, Cursor, GitHub Copilot, Gemini CLI, ou outra.

---

## 1. Matriz principal: tarefa → ferramenta + modelo

| Tarefa | Ferramenta | Modelo/variante | Por quê |
|---|---|---|---|
| Renomear identificador, ajuste de CSS simples, lookup | Claude Code | Haiku 4.5 | Custo mínimo, tarefa mecânica |
| Bug fix isolado, nova feature em 1-2 arquivos | Claude Code | Sonnet 4.6 | Melhor custo/benefício para implementação |
| Edição ou criação de documentação em pt-BR | Claude Code | Sonnet 4.6 | Lida bem com texto longo estruturado |
| Refactor cross-file com consistência de tipos | Claude Code | Sonnet 4.6 | Navegação multi-arquivo + TypeScript |
| Decisão arquitetural (novo hook, nova dependência) | Claude Code | Opus 4.7 | Profundidade de raciocínio compensa custo |
| Code review crítico (classifier, speedtest) | Claude Code | Opus 4.7 | Lógica complexa exige raciocínio profundo |
| 4+ sub-tarefas independentes em paralelo | Sub-agentes Claude Code | Sonnet 4.6 | Paralelismo nativo |
| Edição cirúrgica em arquivo aberto no IDE | Cursor | Agent mode | Contexto de editor, sem abrir sessão nova |
| Autocompletar enquanto escreve código | GitHub Copilot | — | Inline, sem interromper fluxo de edição |
| Análise de 10+ screenshots iOS/Android | Gemini 2.5 Flash | — | Multimodal barato, janela 1M+ |
| Leitura de codebase inteiro de uma vez (50+ arquivos) | Gemini 2.5 Pro | — | Contexto longo, mais barato que Claude Opus para bulk |
| Perguntas à doc Cloudflare / wrangler | Gemini CLI | 2.5 Flash | Janela grande para colar páginas de doc |
| Boilerplate React previsível (widget novo no padrão) | Codex / Copilot | — | Loop de geração mais ágil para código repetitivo |

---

## 2. Modelos Claude detalhados

| Modelo | ID | Quando usar |
|---|---|---|
| Haiku 4.5 | `claude-haiku-4-5` | Tarefas curtas/mecânicas: renomear, formatar, lookup, perguntas factuais |
| Sonnet 4.6 | `claude-sonnet-4-6` | **Padrão.** Implementação, bug fix, refactor moderado, docs |
| Opus 4.7 | `claude-opus-4-7` | Decisão arquitetural, refactor não-trivial cross-file, análise de algoritmo speedtest |
| Opus 4.6 fast | `/fast` no CLI | Raciocínio Opus com latência menor (quando velocidade importa mais que custo) |

> **Regra:** comece pelo menor modelo que resolve. Escale se travar.
> A troca de modelo **não é automática** — use `/model <id>` no CLI do Claude Code.

---

## 3. Ferramentas não-Claude: capacidades e limites

### Cursor

**Pontos fortes:**
- Contexto do arquivo aberto no IDE + arquivos recentes visíveis
- Edição cirúrgica rápida ("muda só essa função") sem overhead de sessão
- Agent mode lê e edita vários arquivos de uma vez dentro do projeto

**Limites:**
- Não tem acesso a ferramentas de sistema (deploy, testes via CLI) por padrão
- Histórico de sessão mais curto que Claude Code
- Sem suporte a plano formal + aprovação antes de executar (executa direto)

**Use quando:** você já está no editor, a tarefa é local e cirúrgica, e não quer abrir outra sessão.

---

### GitHub Copilot

**Pontos fortes:**
- Autocomplete inline enquanto digita — zero latência percebida
- Bom para completar padrões já estabelecidos no arquivo (segue o estilo local)
- Chat integrado ao editor (Copilot Chat) para perguntas rápidas

**Limites:**
- Não lê contexto amplo do projeto — só o arquivo atual e vizinhos imediatos
- Não executa planos, não atualiza docs, não faz git
- Propenso a sugerir código fora do padrão do projeto se o arquivo aberto for pouco representativo

**Use quando:** você está escrevendo código novo e quer autocompletar baseado no padrão local. Não substitui Claude ou Cursor para tarefas com escopo maior.

---

### Gemini CLI / Gemini 2.5 Flash

**Pontos fortes:**
- Janela de contexto de 1M+ tokens — cabe o codebase inteiro
- Multimodal: análise de screenshots, vídeos, PDFs em volume
- Custo muito menor que Claude Opus para tarefas de leitura em massa

**Limites:**
- Não tem acesso ao sistema de arquivos local por padrão (depende de integração)
- Menor precisão em TypeScript cross-file que Claude Code
- Sem protocolo de plano + aprovação nativo

**Use quando:** análise de muitos screenshots, leitura de doc extensa, comparação de 10+ arquivos de uma vez, ou perguntas à documentação do Cloudflare/Vite/React.

---

### Gemini 2.5 Pro

**Pontos fortes:**
- Contexto longo com raciocínio mais profundo que Flash
- Bom para análise de código em escala (entender um projeto desconhecido de ponta a ponta)

**Limites:**
- Mais caro que Flash; ainda abaixo de Claude Opus em raciocínio TypeScript
- Mesmo limite de integração com sistema local que Flash

**Use quando:** você precisa do contexto longo do Gemini mas com mais profundidade de análise.

---

### Codex (OpenAI)

**Pontos fortes:**
- Loop de geração de código repetitivo mais ágil (ex.: criar N telas no mesmo padrão)
- Bom para scaffolding inicial quando o padrão já está definido

**Limites:**
- Não conhece as convenções específicas deste projeto sem prompt detalhado
- Sem acesso a histórico de sessão, docs locais, ou ferramentas de sistema
- Precisa de revisão: tende a introduzir padrões não alinhados ao design system

**Use quando:** gerar boilerplate React previsível a partir de especificação clara. Sempre revise antes de commitar.

---

## 4. Protocolo "cost check" — faça no início de cada tarefa

Antes de qualquer tool de modificação, envie ao usuário **em uma única mensagem**:

```
**Tarefa:** [classificação em uma frase]
**Ferramenta + modelo em uso:** [ex: Claude Code / Sonnet 4.6]
**Modelo mais adequado para esta tarefa:** [se diferente do atual, sugira troca]
**Tamanho:** Pequeno / Médio / Grande
**Arquivos prováveis:** [lista]
**Docs a atualizar:** [lista]
**Riscos:** [se houver]
```

### 4.1 Quando pular o cost check

- Tarefa explicitamente trivial declarada pelo usuário ("só muda essa linha")
- Continuação direta no mesmo escopo da mesma sessão
- Perguntas factuais sem tools

---

## 5. Sinais para recomendar handoff de ferramenta

Identifique e comunique ao usuário quando a tarefa pede uma ferramenta diferente da atual:

| Sinal | Recomendação |
|---|---|
| 10+ arquivos para ler/analisar de uma vez | Gemini 2.5 Flash ou Pro |
| 5+ screenshots para comparar | Gemini 2.5 Flash |
| Edição pontual em arquivo já aberto no IDE | Cursor Agent |
| Autocompletar código no padrão atual | GitHub Copilot |
| Geração de código Flutter/Dart (outro projeto) | Abrir sessão no projeto LINKA |
| Sessão com muito contexto acumulado + nova tarefa independente | Nova sessão Claude Code |
| Tarefa de DevOps/infra Cloudflare complexa | Gemini CLI + docs Cloudflare |
| Tarefa arquitetural crítica em Sonnet | Escalar para Opus 4.7 |

**Como comunicar o handoff:**
> "Esta tarefa é melhor resolvida com [ferramenta/modelo] porque [razão]. Quer que eu continue aqui com as limitações, ou prefere abrir uma sessão nova?"

---

## 6. Especificidades do projeto linka SpeedTest

### Domínios de maior risco (use Opus ou peça revisão)

- `src/utils/classifier.ts` — Lógica de classificação com regras de negócio específicas. Mudança pode quebrar diagnóstico ou testes.
- `src/utils/speedtest.ts` — Algoritmo de medição com EMA, P90, AbortController. Qualquer mudança afeta precisão.
- `src/utils/serverRegistry.ts` — Integração com Cloudflare. Mudança de endpoints pode quebrar detecção de ISP.

### Domínios de baixo risco (Sonnet ou Haiku)

- `src/screens/*.css` — Ajustes visuais isolados.
- `src/utils/format.ts` — Funções de formatação simples.
- `src/utils/history.ts` — CRUD localStorage com schema simples.
- `docs/*.md` — Documentação em pt-BR.

### Dependências sensíveis

- `vite-plugin-pwa`: versão fixada em `^1.2` por incompatibilidade com Vite 8. **Não atualizar sem testar.**
- `recharts`: versão atual. `AreaChart` é o único gráfico usado — evitar introduzir outros tipos.

---

## 7. Deploy: pré-condições obrigatórias

Antes de qualquer `wrangler pages deploy`:

1. `npm run build` sem erros TypeScript
2. `npm test` — todos os testes passando
3. Confirmação explícita do usuário

Comando de deploy:
```bash
npx wrangler pages deploy dist --project-name linka-speedtest --branch main
```
