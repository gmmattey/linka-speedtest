# Índice da Documentação — linka SpeedTest PWA

> Porta de entrada para toda a documentação do projeto. Leia este arquivo primeiro.

---

## Documentos de processo e disciplina

| Documento | Finalidade |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Instruções para Claude Code nesta sessão — regras, precedências, fluxo de trabalho |
| [`ManifestoDesenvolvimentoIA.md`](ManifestoDesenvolvimentoIA.md) | Disciplina completa de desenvolvimento assistido por IA: proibições, checklist, padrões |
| [`GuiaFluxoGit.md`](GuiaFluxoGit.md) | Protocolo de sincronização Git para todas as IAs e humanos — checklist pré-sessão, worktrees, riscos |
| [`PoliticaBranchUnico.md`](PoliticaBranchUnico.md) | Proibição absoluta de branches paralelas — toda IA trabalha exclusivamente em `main` |
| [`GuiaSelecaoModeloIA.md`](GuiaSelecaoModeloIA.md) | Matriz tarefa → ferramenta + modelo IA; custo/benefício |

## Documentos de projeto

| Documento | Finalidade |
|---|---|
| [`GuiaOrganizacaoPastas.md`](GuiaOrganizacaoPastas.md) | Estrutura oficial de pastas; naming conventions; regras de criação de arquivos |
| [`GuiaBranding.md`](GuiaBranding.md) | Identidade visual completa: cores, tipografia, espaçamento, componentes, copy, design direction iOS-Calma |
| [`DocumentacaoFuncionalSistema.md`](DocumentacaoFuncionalSistema.md) | Descrição das telas, fluxos de navegação, estados, UX |
| [`DocumentacaoTecnicaSistema.md`](DocumentacaoTecnicaSistema.md) | Arquitetura, tipos, hooks, utils, componentes (Chip, IOSList, Gauge), deploy |
| [`EvolucaoSpeedTest.md`](EvolucaoSpeedTest.md) | Roadmap e features futuras: diagnóstico avançado, comparativos, UX evolutiva |
| [`EvolucaoTelaDesktop.md`](EvolucaoTelaDesktop.md) | Design de telas desktop — prototipagem aprovada (opção 3); layout para telas grandes |
| [`PendenciasLayout.md`](PendenciasLayout.md) | Backlog de melhorias de layout, UX, fraseologia e consistência visual |
| [`PendenciasTecnicas.md`](PendenciasTecnicas.md) | Backlog técnico: auditoria do classificador, regras de diagnóstico, coerência |
| [`RecomendacaoEquipamentos.md`](RecomendacaoEquipamentos.md) | Plano de monetização: recomendações automáticas de equipamentos por diagnóstico |

---

## Visão geral do produto

**linka SpeedTest** é uma PWA standalone de medição de velocidade de internet, desenvolvida como produto complementar ao app LINKA. Roda 100% no browser — sem backend próprio, sem banco de dados servidor, sem autenticação.

**Stack:** Vite 7 · React 19 · TypeScript · CSS Custom Properties · vite-plugin-pwa 1.2  
**Deploy:** Cloudflare Pages (projeto `linka-speedtest`)  
**Servidor de teste:** Cloudflare Speed Test (`speed.cloudflare.com`)  
**Testes:** Vitest (175 testes unitários — `src/__tests__/`)

## Estado atual (2026-04-30)

### Telas implementadas (14)

- [x] **StartScreen** — orb pulsante, info de servidor/ISP, atalho para histórico
- [x] **RunningScreen** — gauge SVG por fase (DL/UL/latência), frase narrativa, estado de erro com retry
- [x] **ResultScreen** — hero chip + título humano + chips "pronta para" + IOSList de métricas + ações (Diagnóstico / Gamer / Recomendações)
- [x] **HistoryScreen** — gráfico de evolução, média, insights, lista com Chip de qualidade, detalhe por registro com IOSList
- [x] **DiagnosticScreen** — grid 2-col de 6 cartões interpretando cada métrica
- [x] **GamerScreen** — grid ping/jitter/loss + avaliação por jogo (FPS, MOBA, MMO, Cloud Gaming)
- [x] **RecommendScreen** — 4 recomendações acionáveis com priorização por diagnóstico
- [x] **BeforeAfterScreen** — comparativo antes/depois de uma ação (tabela com delta %)
- [x] **ComparisonScreen** — comparativo entre dois pontos da casa (Prova Real — 3 testes consecutivos com média)
- [x] **RoomTestScreen** — teste por cômodo com etiqueta de local associada ao resultado
- [x] **ExploreScreen** — hub de ferramentas avançadas
- [x] **DNSBenchmarkScreen** — verificação de servidores DNS por DoH
- [x] **DNSGuideScreen** — guia de configuração de DNS
- [x] **LocalWifiScreen** — diagnóstico Wi-Fi nativo, oculto no PWA comum

### Infraestrutura e design

- [x] Design system iOS-Calma: superfícies neutras, zero sombras, accent restrito, IOSList + Chip
- [x] Componentes: `Gauge` (SVG ring), `IOSList`, `Chip` (5 variantes), `HamburgerMenu`, `BottomSheet`, `PathRow`
- [x] Algoritmo speedtest completo (DL/UL/latência/jitter/packetLoss)
- [x] Presets de payload: ~400 MB em Wi-Fi/cabo, ~70 MB em rede móvel
- [x] Classificador de qualidade (5 níveis, 5 tags, diagnóstico em linguagem leiga)
- [x] Motor de interpretação semântica (`interpret.ts`) com copyDictionary pt-BR
- [x] Histórico local (localStorage, FIFO 50 registros) com insights, gráfico e resumo
- [x] Normalização de operadora brasileira (Vivo/Claro/TIM/Oi/Algar)
- [x] Heurística de conexão móvel para iOS Safari (sem `navigator.connection`)
- [x] Exportação PDF (resultado individual + histórico completo)
- [x] PWA manifest + service worker (vite-plugin-pwa)
- [x] Deploy em produção (Cloudflare Pages — projeto `linka-speedtest`)
- [x] Tema dark/light com persistência
- [x] Configurações: unidade (Mbps/Gbps), conexão override, servidor
- [x] Prova Real: média de 3 testes consecutivos
- [x] Histórico inteligente: análise semana-a-semana e horário de pico

## Backlog registrado

- [ ] Análise de padrão histórico para sugestão de melhoria (Wi-Fi/5GHz/posicionamento)
- [ ] Suporte a N servidores de teste (arquitetura já pronta em `serverRegistry.ts`)
- [ ] Compartilhamento nativo de resultado (Web Share API — já parcialmente implementado)
