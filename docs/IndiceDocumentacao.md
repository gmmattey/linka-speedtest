# Índice da Documentação — linka SpeedTest PWA

> Porta de entrada para toda a documentação do projeto. Leia este arquivo primeiro.

---

## Documentos de processo e disciplina

| Documento | Finalidade |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Instruções para Claude Code nesta sessão — regras, precedências, fluxo de trabalho |
| [`ManifestoDesenvolvimentoIA.md`](ManifestoDesenvolvimentoIA.md) | Disciplina completa de desenvolvimento assistido por IA: proibições, checklist, padrões |
| [`GuiaSelecaoModeloIA.md`](GuiaSelecaoModeloIA.md) | Matriz tarefa → ferramenta + modelo IA; custo/benefício |

## Documentos de projeto

| Documento | Finalidade |
|---|---|
| [`GuiaOrganizacaoPastas.md`](GuiaOrganizacaoPastas.md) | Estrutura oficial de pastas; naming conventions; regras de criação de arquivos |
| [`DocumentacaoFuncionalSistema.md`](DocumentacaoFuncionalSistema.md) | Descrição das 4 telas, fluxos de navegação, estados, UX |
| [`DocumentacaoTecnicaSistema.md`](DocumentacaoTecnicaSistema.md) | Arquitetura, tipos, hooks, utils, componentes, deploy |

---

## Visão geral do produto

**linka SpeedTest** é uma PWA standalone de medição de velocidade de internet, desenvolvida como produto complementar ao app LINKA. Roda 100% no browser — sem backend próprio, sem banco de dados servidor, sem autenticação.

**Stack:** Vite 7 · React 19 · TypeScript · CSS Custom Properties · vite-plugin-pwa 1.2  
**Deploy:** Cloudflare Pages (projeto `linka-speedtest`)  
**Servidor de teste:** Cloudflare Speed Test (`speed.cloudflare.com`)  
**Testes:** Vitest (24 testes unitários — `src/__tests__/`)

## Estado atual (2026-04-28)

- [x] 4 telas implementadas: StartScreen, RunningScreen, ResultScreen, HistoryScreen
- [x] Algoritmo speedtest completo (DL/UL/latência/jitter/packetLoss)
- [x] Presets de payload por tipo de conexão: ~400 MB em Wi-Fi/cabo, ~70 MB em rede móvel
- [x] Classificador de qualidade (5 níveis, 5 tags, diagnóstico em linguagem leiga)
- [x] Histórico local (localStorage, FIFO 50 registros) com bloco de diagnóstico 24h acima do gráfico
- [x] StartScreen com card do último resultado e atalho para histórico (sem precisar rodar novo teste)
- [x] RunningScreen minimalista (número + frase narrativa) e estado de falha com retry
- [x] Botão Iniciar vazado com pulso na borda
- [x] BottomSheet com swipe-up para abrir e swipe-down para fechar
- [x] Navegação por swipe lateral (pilha back/forward em `App.tsx`)
- [x] Header sem linha e sem botão "X / voltar"
- [x] Normalização de operadora brasileira (Vivo/Claro/TIM/Oi/Algar) sobre `asOrganization` da Cloudflare
- [x] Heurística de conexão móvel para iOS Safari (sem `navigator.connection`)
- [x] Exportação PDF (resultado individual + histórico completo)
- [x] PWA manifest + service worker (vite-plugin-pwa)
- [x] Deploy em produção (Cloudflare Pages)
- [x] Tema dark/light com persistência
- [x] Configurações: unidade (Mbps/Gbps), conexão override, servidor

## Backlog registrado

- [ ] Análise de padrão histórico para sugestão de melhoria (Wi-Fi/5GHz/posicionamento)
- [ ] Suporte a N servidores de teste (arquitetura já pronta em `serverRegistry.ts`)
- [ ] Compartilhamento nativo de resultado (Web Share API — já parcialmente implementado)
