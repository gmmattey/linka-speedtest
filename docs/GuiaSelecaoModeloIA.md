# Guia de Seleção de Modelo e Ferramenta IA — linka SpeedTest PWA

> Use este guia antes de iniciar qualquer tarefa para escolher a ferramenta e o modelo mais eficientes. Economize custo sem sacrificar qualidade.

---

## 1. Matriz principal: tarefa → ferramenta + modelo

| Tarefa | Ferramenta | Modelo | Por quê |
|---|---|---|---|
| Renomear identificador, ajuste de CSS simples, lookup | Claude Code | Haiku 4.5 | Custo mínimo, tarefa mecânica |
| Bug fix isolado, nova feature em 1-2 arquivos | Claude Code | Sonnet 4.6 | Melhor custo/benefício para implementação |
| Edição ou criação de documentação em pt-BR | Claude Code | Sonnet 4.6 | Lida bem com texto longo estruturado |
| Refactor cross-file com consistência de tipos | Claude Code | Sonnet 4.6 | Navegação entre arquivos + TypeScript |
| Decisão arquitetural (novo hook, nova dependência) | Claude Code | Opus 4.7 | Profundidade de raciocínio compensa custo |
| Code review crítico (classifier, speedtest) | Claude Code | Opus 4.7 | Lógica complexa exige raciocínio profundo |
| Boilerplate React previsível (widget novo no padrão) | Codex | — | Loop de geração mais ágil que Claude |
| Análise de 10+ screenshots iOS/Android | Gemini 2.5 Flash | — | Multimodal barato, janela 1M+ |
| 4+ sub-tarefas independentes em paralelo | Sub-agentes Claude Code | Sonnet 4.6 | Paralelismo nativo |

---

## 2. Modelos Claude detalhados

| Modelo | ID | Quando usar |
|---|---|---|
| Haiku 4.5 | `claude-haiku-4-5` | Tarefas curtas/mecânicas: renomear, formatar, lookup, perguntas factuais sobre o código |
| Sonnet 4.6 | `claude-sonnet-4-6` | **Padrão.** Implementação, bug fix, refactor moderado, docs |
| Opus 4.7 | `claude-opus-4-7` | Decisão arquitetural, refactor não-trivial cross-file, análise de algoritmo speedtest |
| Opus 4.6 fast | `/fast` | Raciocínio Opus com latência menor (quando velocidade importa mais que custo) |

> **Regra:** comece pelo menor modelo que resolve. Escale se travar.  
> A troca de modelo **não é automática** — use `/model <id>` no CLI.

---

## 3. Protocolo "cost check" — faça no início de cada tarefa

Antes de qualquer tool de modificação, envie ao usuário **em uma única mensagem**:

```
**Tarefa:** [classificação em uma frase]
**Ferramenta + modelo:** [ex: Claude Code / Sonnet 4.6]
**Tamanho:** Pequeno / Médio / Grande
**Arquivos prováveis:** [lista]
**Docs a atualizar:** [lista]
**Riscos:** [se houver]
```

### 3.1 Quando pular o cost check

- Tarefa explicitamente trivial declarada pelo usuário ("só muda essa linha")
- Continuação direta no mesmo escopo da mesma sessão
- Perguntas factuais sem tools

---

## 4. Sinais para recomendar handoff de ferramenta

Identifique e comunique ao usuário quando:

| Sinal | Recomendação |
|---|---|
| 10+ arquivos para ler/analisar de uma vez | Gemini 2.5 Flash (janela maior, custo menor) |
| 5+ screenshots para comparar | Gemini 2.5 Flash (multimodal barato) |
| Geração de código Flutter/Dart (não é o stack deste projeto) | Abrir sessão no projeto LINKA |
| Sessão com muito contexto acumulado e nova tarefa independente | Nova sessão Claude Code |
| Tarefa de DevOps/infra Cloudflare complexa | Verificar docs Cloudflare + wrangler CLI direto |

---

## 5. Especificidades do projeto linka SpeedTest

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

## 6. Deploy: pré-condições obrigatórias

Antes de qualquer `wrangler pages deploy`:

1. `npm run build` sem erros TypeScript
2. `npm test` — todos os 24 testes passando
3. Confirmação explícita do usuário

Comando de deploy:
```bash
npx wrangler pages deploy dist --project-name linka-speedtest --branch main
```
