# Documentação Consolidada — linkaSpeedtestPwa PWA

> Mapa de referência: esta página direciona para a documentação centralizada (projeto-agnóstica) versus
> documentação PWA-específica. Atualizado em: 2026-05-16.

---

## Documentação Central (Todos os Projetos)

**Localização:** `E:\Projetos\Linka\CLAUDE.md` (hub central do workspace)

Os documentos de docs gerais externos (`docsGerais/`) estavam em path fora do workspace e não estão disponíveis.
Os TODOs de criação estão registrados no `linkaSpeedtestPwa/CLAUDE.md`.

---

## Documentação PWA-Específica

Documentos em `linkaSpeedtestPwa/docs/` exclusivos desta implementação.

### Operacional & Deploy

| Documento | Propósito |
|---|---|
| [**CI-CD.md**](CI-CD.md) | GitHub Actions pipelines, Cloudflare Pages, secrets, deploy |

### Design & Branding

| Documento | Propósito |
|---|---|
| [**GuiaBranding.md**](GuiaBranding.md) | Identidade visual PWA: cores, tipografia, componentes design iOS-Calma |
| [**GuiaOrganizacaoPastas.md**](GuiaOrganizacaoPastas.md) | Estrutura de pastas, naming conventions PWA |

### Especificação Funcional e Técnica (documentos primários)

> **Importante:** Os dois monólitos abaixo são os documentos primários de especificação do PWA.
> Eles contêm detalhe que NÃO existe em nenhum outro doc:
> - `DocumentacaoFuncionalSistema.md`: layouts ASCII por tela, frases exibidas por fase, edge cases,
>   props de componente, regras de haptic, acessibilidade, pull-to-refresh, gestos, onboarding.
> - `DocumentacaoTecnicaSistema.md`: contratos TypeScript completos, algoritmos do Motor v2
>   (download/upload/latência), configurações de probe, classifier, interpret, anatelColor, deploy.
>
> `SCREENS_PWA.md` e `COMPONENTS_PWA.md` são tabelas de inventário (úteis para orientação rápida)
> mas NÃO substituem os monólitos. Use os monólitos quando precisar de comportamento detalhado.

| Documento | Propósito | Atualizado |
|---|---|---|
| [**DocumentacaoFuncionalSistema.md**](DocumentacaoFuncionalSistema.md) | Especificação completa de UX: layout por tela, estados visuais, frases exibidas, props de componente, edge cases, gestos, haptics, acessibilidade | 2026-05-09 |
| [**DocumentacaoTecnicaSistema.md**](DocumentacaoTecnicaSistema.md) | Arquitetura técnica: tipos TypeScript, Motor v2 (algoritmos DL/UL/latência), hooks, utils, classifier, interpret, anatelColor, deploy | 2026-05-09 |
| [**EvolucaoSpeedTest.md**](EvolucaoSpeedTest.md) | Roadmap futuro: diagnóstico avançado, comparativos | — |
| [**EvolucaoTelaDesktop.md**](EvolucaoTelaDesktop.md) | Design telas desktop, responsividade | — |

### Telas & Componentes (inventário rápido — v1.0.0)

> Use para orientação rápida de quais telas/componentes existem. Para comportamento detalhado, consulte
> os monólitos acima.

| Documento | Propósito | Atualizado |
|---|---|---|
| [**SCREENS_PWA.md**](SCREENS_PWA.md) | Tabela de 17 telas PWA com arquivo, rota e propósito | 2026-05-15 |
| [**COMPONENTS_PWA.md**](COMPONENTS_PWA.md) | Tabela de 27 componentes agrupados por domínio | 2026-05-15 |

### Avaliação de Paridade Android/PWA

| Documento | Propósito | Atualizado |
|---|---|---|
| [**ORB-151_Avaliacao_Tecnica_Paridade_PWA_Android.md**](ORB-151_Avaliacao_Tecnica_Paridade_PWA_Android.md) | Inventário técnico PWA, mapa PWA->Android, proposta de design tokens, isolamento do motor | 2026-05-14 |

### Pendências & Débito

| Documento | Propósito |
|---|---|
| [**PendenciasLayout.md**](PendenciasLayout.md) | Backlog UX/Layout |

### Contratos & Outros

| Documento | Propósito |
|---|---|
| [**CONTRATO_DIAGNOSTICO_RECOMENDACOES_V1.md**](CONTRATO_DIAGNOSTICO_RECOMENDACOES_V1.md) | Contrato diagnóstico/recomendações |
| [**RecomendacaoEquipamentos.md**](RecomendacaoEquipamentos.md) | Plano de monetização: recomendações automáticas |
| [**GuiaFluxoGit.md**](GuiaFluxoGit.md) | Protocolo Git para PWA |
| [**PoliticaBranchUnico.md**](PoliticaBranchUnico.md) | Política: trabalhar sempre em `main` |
| [**DiagnosticoWifiNativo.md**](DiagnosticoWifiNativo.md) | Diagnóstico Wi-Fi nativo |
| [**Feature App - Scanner de Dispositivos.md**](Feature%20App%20-%20Scanner%20de%20Dispositivos.md) | Feature específica |
| [**Feature iOS - Obter Dados WiFi via Atalho.md**](Feature%20iOS%20-%20Obter%20Dados%20WiFi%20via%20Atalho.md) | Feature específica |

---

## Qual Documentação Ler Quando?

### Para IA na PWA — sequência de leitura

```
1. E:\Projetos\Linka\CLAUDE.md                          (regras do workspace — obrigatório)
2. linkaSpeedtestPwa/CLAUDE.md                          (regras PWA)
3. linkaSpeedtestPwa/docs/DOCUMENTACAO_CONSOLIDADA.md   (este arquivo — índice)
4. Conforme a tarefa:
   - Tela, fluxo ou UX → DocumentacaoFuncionalSistema.md
   - Arquitetura, hooks, motor → DocumentacaoTecnicaSistema.md
   - Qual tela/componente existe → SCREENS_PWA.md ou COMPONENTS_PWA.md
   - Paridade com Android → ORB-151_Avaliacao_Tecnica_Paridade_PWA_Android.md
```

### Para Feature UI Nova

```
1. GuiaBranding.md
2. DocumentacaoFuncionalSistema.md (seção da tela afetada)
3. DocumentacaoTecnicaSistema.md (componentes técnicos envolvidos)
```

### Para Bug em Motor de Speedtest

```
1. DocumentacaoTecnicaSistema.md §3.1 (Motor v2 — cloudflareSpeedTest, latencyProbe,
   downloadProbe, uploadProbe, speedTestOrchestrator)
```

---

## Consolidação — Histórico de Decisões

### 2026-05-16 (Taisa) — PendenciasTecnicas.md arquivado

**Revalidação de pendências técnicas:**

Documento `PendenciasTecnicas.md` (datado 2026-05-09) revisado item a item com verificação no código:

- Fases 1–3 (classifier, interpreter, copyDictionary, testes, motor v2): `concluído` — verificado em `src/utils/classifier.ts`, `src/core/copyDictionary.ts`, `src/__tests__/classifier.test.ts`.
- Fase 4 (documentação técnica cross-platform): `migrado` — coberto pelos docs `FUNCIONAL_CROSSPLATFORM.md`, `TECNICO_CROSSPLATFORM.md`, `DESIGN_SYSTEM_CROSSPLATFORM.md` em `E:\Projetos\Linka\docs\`.
- Fase 5 (release 1.1.0 CI/CD): `não se aplica` — item de processo de release, não pendência de documentação.
- Seção 20 (critérios de aceite): `concluído` — 12/13 itens confirmados; README existente não é template Vite.

**Decisão:** todos os itens são `concluído`, `migrado` ou `não se aplica`. Arquivo arquivado em `.old/PendenciasTecnicas.2026-05-16.old.md`. Nenhuma pendência ativa restante neste documento.

---

### 2026-05-16 (Taisa) — Auditoria dos monólitos vs docs recentes

**Auditoria dos monólitos vs docs recentes:**

Avaliação realizada comparando `DocumentacaoFuncionalSistema.md` e `DocumentacaoTecnicaSistema.md`
(09/05) com `SCREENS_PWA.md` e `COMPONENTS_PWA.md` (15/05):

- `SCREENS_PWA.md` é tabela de 17 telas sem nenhuma especificação de comportamento. Não substitui
  o monólito funcional — que contém layout ASCII, frases por fase, edge cases, props, haptics,
  pull-to-refresh, gestos, acessibilidade.
- `COMPONENTS_PWA.md` é tabela de 27 componentes sem nenhuma especificação técnica. Não substitui
  o monólito técnico — que contém tipos TypeScript, algoritmos do Motor v2, contratos de interface.

**Decisão:** Monólitos mantidos. Não arquivados. Tabelas recentes mantidas como inventário complementar.

Nota adicional: `SCREENS_PWA.md` contém uma inconsistência — afirma que o roteamento usa React Router v6.
O monólito funcional (mais detalhado) afirma que o roteamento é por `switch/case` em `App.tsx` via
`useState<Screen>`, sem react-router. Esta inconsistência deve ser verificada no código antes de qualquer
implementação que dependa do mecanismo de roteamento.

### 2026-05-09 (consolidação anterior)

- Documentação central hub criado em `docsGerais/` (externo ao workspace — não disponível)
- PWA documentação específica preservada em `linkaSpeedtestPwa/docs/`
- Este mapa criado para orientar referências

---

**Última atualização:** 2026-05-16
**Status:** Monólitos funcionais e técnicos confirmados como documentação primária. Docs de inventário (SCREENS/COMPONENTS) mantidos como complemento.
