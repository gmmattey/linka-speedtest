# DocumentaÃ§Ã£o Consolidada â€” linkaSpeedtestPwa PWA

> Mapa de referÃªncia: esta pÃ¡gina direciona vocÃª para a documentaÃ§Ã£o centralizada (projeto-agnÃ³stica) versus documentaÃ§Ã£o PWA-especÃ­fica.

---

## ðŸ“ DocumentaÃ§Ã£o Central (Todos os Projetos)

**LocalizaÃ§Ã£o:** `E:\Projetos\docsGerais\`

Leia estes documentos **em primeiro lugar** para entender LINKA como um todo:

| Documento | PropÃ³sito | Leitura Recomendada |
|---|---|---|
| **[README.md](../../docsGerais/README.md)** | Hub central de toda documentaÃ§Ã£o | Primeira coisa |
| **[VISAO_GERAL_LINKA.md](../../docsGerais/VISAO_GERAL_LINKA.md)** | O que Ã© LINKA, 3 implementaÃ§Ãµes (Kotlin, PWA, Flutter) | Segunda coisa |
| **[DECISOES_TECNICAS.md](../../docsGerais/DECISOES_TECNICAS.md)** | Por que Kotlin Ã© prioritÃ¡rio, por que Flutter descontinuado, papel da PWA | Antes de arquitetar |
| **[ROADMAP.md](../../docsGerais/ROADMAP.md)** | Timeline, deliverables, riscos, mÃ©tricas de sucesso | Antes de planejar |
| **[PADROES_UI_UX.md](../../docsGerais/PADROES_UI_UX.md)** | NavegaÃ§Ã£o, componentes, Material Design 3 | Antes de implementar UI |
| **[MATERIAL_DESIGN_3.md](../../docsGerais/MATERIAL_DESIGN_3.md)** | Design tokens, cores, tipografia, implementaÃ§Ã£o (CSS) | Para referÃªncia visual |
| **[PADROES_NOMENCLATURA.md](../../docsGerais/PADROES_NOMENCLATURA.md)** | Naming conventions (Kotlin, TypeScript) | Antes de codar |
| **[GUIA_CONVIVENCIA_IA.md](../../docsGerais/GUIA_CONVIVENCIA_IA.md)** | **CRÃTICO:** Regras inegociÃ¡veis para trabalhar com IA | ObrigatÃ³rio para IAs |
| **[GUIA_DESENVOLVIMENTO_IA.md](../../docsGerais/GUIA_DESENVOLVIMENTO_IA.md)** | Checklists, runbook, best practices | Para IAs |

---

## ðŸ”§ DocumentaÃ§Ã£o PWA-EspecÃ­fica

Documentos que vivem **aqui em `linkaSpeedtestPwa/docs/`** porque sÃ£o exclusivos desta implementaÃ§Ã£o:

### Operacional & Deploy

| Documento | PropÃ³sito |
|---|---|
| [**CI-CD.md**](CI-CD.md) | GitHub Actions pipelines, Cloudflare Pages, secrets, deploy |
| **CLAUDE.md** (na raiz do projeto) | InstruÃ§Ãµes Claude Code especÃ­ficas PWA |

### Design & Branding

| Documento | PropÃ³sito |
|---|---|
| [**GuiaBranding.md**](GuiaBranding.md) | Identidade visual PWA: cores, tipografia, componentes design iOS-Calma |
| [**GuiaOrganizacaoPastas.md**](GuiaOrganizacaoPastas.md) | Estrutura de pastas, naming conventions PWA |

### Fluxos & Prototipagem

| Documento | PropÃ³sito |
|---|---|
| [**DocumentacaoFuncionalSistema.md**](DocumentacaoFuncionalSistema.md) | Telas, fluxos, estados, UX PWA |
| [**DocumentacaoTecnicaSistema.md**](DocumentacaoTecnicaSistema.md) | Stack tÃ©cnico (Vite, React, hooks), deploy PWA |
| [**EvolucaoSpeedTest.md**](EvolucaoSpeedTest.md) | Roadmap futuro: diagnÃ³stico avanÃ§ado, comparativos |
| [**EvolucaoTelaDesktop.md**](EvolucaoTelaDesktop.md) | Design telas desktop, responsividade |

### Fases & Consolidação

| Documento | Propósito |
|---|---|
| [**FASE_3_CONSOLIDACAO.md**](FASE_3_CONSOLIDACAO.md) | Status Phase 3 completo: placeholder cleanup, capability gating, E2E tests (14/14 passing) |

### Pendências & Débito

| Documento | Propósito |
|---|---|
| [**PendenciasLayout.md**](PendenciasLayout.md) | Backlog UX/Layout |
| [**PendenciasTecnicas.md**](PendenciasTecnicas.md) | Backlog técnico |

### Outros

| Documento | PropÃ³sito |
|---|---|
| [**RecomendacaoEquipamentos.md**](RecomendacaoEquipamentos.md) | Plano de monetizaÃ§Ã£o: recomendaÃ§Ãµes automÃ¡ticas |
| [**GuiaFluxoGit.md**](GuiaFluxoGit.md) | Protocolo Git para PWA |
| [**PoliticaBranchUnico.md**](PoliticaBranchUnico.md) | PolÃ­tica: trabalhar sempre em `main` |
| [**ContratoEmbedFlutter.md**](ContratoEmbedFlutter.md) | IntegraÃ§Ã£o histÃ³rica Flutter (legado) |
| [**DiagnosticoWifiNativo.md**](DiagnosticoWifiNativo.md) | DiagnÃ³stico Wi-Fi nativo |
| [**Feature App - Scanner de Dispositivos.md**](Feature%20App%20-%20Scanner%20de%20Dispositivos.md) | Feature especÃ­fica |
| [**Feature iOS - Obter Dados WiFi via Atalho.md**](Feature%20iOS%20-%20Obter%20Dados%20WiFi%20via%20Atalho.md) | Feature especÃ­fica |

---

## ðŸ“š Qual DocumentaÃ§Ã£o Ler Quando?

### Primeira sessÃ£o em linkaSpeedtestPwa

```
1. E:\Projetos\docsGerais\README.md
2. E:\Projetos\docsGerais\VISAO_GERAL_LINKA.md
3. E:\Projetos\projetosAtivos\linkaSpeedtestPwa\CLAUDE.md
4. E:\Projetos\projetosAtivos\linkaSpeedtestPwa\docs\DOCUMENTACAO_CONSOLIDADA.md (este arquivo)
5. Docs especÃ­ficos de sua tarefa (veja seÃ§Ãµes acima)
```

### Para IA na PWA

```
1. E:\Projetos\docsGerais\GUIA_CONVIVENCIA_IA.md (CRÃTICO)
2. E:\Projetos\docsGerais\GUIA_DESENVOLVIMENTO_IA.md
3. E:\Projetos\projetosAtivos\linkaSpeedtestPwa\CLAUDE.md
4. DocumentaÃ§Ã£o PWA-especÃ­fica conforme tarefa
```

### Para Feature UI Nova

```
1. E:\Projetos\docsGerais\PADROES_UI_UX.md
2. E:\Projetos\docsGerais\MATERIAL_DESIGN_3.md
3. E:\Projetos\projetosAtivos\linkaSpeedtestPwa\docs\GuiaBranding.md
4. E:\Projetos\projetosAtivos\linkaSpeedtestPwa\docs\DocumentacaoFuncionalSistema.md
```

---

## ðŸ”„ ConsolidaÃ§Ã£o Realizada (2026-05-09)

**MudanÃ§as:**
- âœ… Central documentation hub criado em `docsGerais/` com 9 documentos
- âœ… PWA documentaÃ§Ã£o especÃ­fica preservada em `linkaSpeedtestPwa/docs/`
- âœ… Este mapa (`DOCUMENTACAO_CONSOLIDADA.md`) criado para orientar referÃªncias
- âœ… Duplicatas consolidadas (nÃ£o deletadas, apenas mapeadas para central)

**Documentos que apontam para central:**
- IndiceDocumentacao.md â†’ README.md (central) + seÃ§Ãµes acima
- ManifestoDesenvolvimentoIA.md â†’ GUIA_CONVIVENCIA_IA.md (central)
- GuiaSelecaoModeloIA.md â†’ GUIA_SELECAO_MODELO_IA.md (central, ainda por criar)

---

## âš ï¸ PrÃ³ximos Passos

1. [ ] Criar GUIA_SELECAO_MODELO_IA.md em central (faltante)
2. [ ] Atualizar CLAUDE.md da PWA para linkar documentaÃ§Ã£o central
3. [ ] Revisar GuiaOrganizacaoPastas.md PWA vs. estrutura nova
4. [ ] Arquivar pastas antigas: `archive/`, `20260429/`, `mockups/`, `ux-rules/`

---

**Ãšltima atualizaÃ§Ã£o:** 2026-05-09  
**Status:** âœ… ConsolidaÃ§Ã£o complete, documentaÃ§Ã£o centralizada em vigor

