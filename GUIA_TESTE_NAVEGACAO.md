# Guia Prático de Teste — Navegação & Funcionalidade
## linka SpeedTest PWA — Validação Manual

**Objetivo:** Validar que TODAS as telas, links, botões e labels funcionam corretamente.

---

## 🚀 COMO RODAR LOCALMENTE

```bash
# 1. Navegar para o projeto
cd E:\Projetos\projetosAtivos\linkaSpeedtestPwa

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Abrir no browser
# → URL: http://localhost:5173 (ou a mostrada no terminal)

# 4. Em outro terminal, abrir DevTools (F12)
# → Verificar Console para erros
# → Network para downloads
# → Application para Service Worker & localStorage
```

---

## ✅ CHECKLIST DE TESTES

### 1️⃣ START SCREEN (Primeira Tela)

**Verificações visuais:**
- [ ] Botão "Iniciar Teste" é visível e clicável
- [ ] Chips "Modo Rápido" e "Modo Completo" aparecem
- [ ] Informações de servidor (Cloudflare, IP, colo) exibidas
- [ ] Informações de dispositivo (Wi-Fi, mobile, cabo) exibidas
- [ ] Se há histórico: card "Último resultado" aparece
- [ ] TopBar com ícone de tema e menu

**Teste de cliques:**

| Elemento | Ação | Resultado Esperado | ✓ |
|----------|------|--------------------|----|
| "Iniciar Teste" | Clique | → RunningScreen |  |
| "Modo Rápido" chip | Clique | Seleciona modo & salva em settings |  |
| "Modo Completo" chip | Clique | Seleciona modo & salva em settings |  |
| "Ver último teste" | Clique | → HistoryScreen com teste selecionado |  |
| "Histórico" | Clique | → HistoryScreen |  |
| "Explorar" | Clique | → ExploreScreen |  |
| "Pulse Diagnóstico" | Clique | → PulseScreen |  |
| Ícone de tema (TopBar) | Clique | Toggle dark ↔ light |  |
| Pull-to-refresh | Gesto | Atualiza IP/ISP/device info |  |

**Validação de copy:**
- [ ] "Modo Rápido" (não "Fast Mode")
- [ ] "Modo Completo" (não "Complete Mode")
- [ ] "Wi-Fi" ou "Dados móveis" ou "Cabo"
- [ ] Nenhuma chave `[undefined]` ou `[key]` visível

---

### 2️⃣ RUNNING SCREEN (Durante Teste)

**Ação:** Clique "Iniciar Teste" → deve ir para RunningScreen

**Verificações visuais:**
- [ ] Gauge (arco) está progredindo
- [ ] Fase atual exibida (latência, download, upload, etc.)
- [ ] Velocidade instantânea em Mbps/Gbps mostrando
- [ ] Labels de step (Latência, DOWN, UP) aparecem
- [ ] Botões "Cancelar" e "Tentar novamente" (se erro) visíveis

**Teste de cliques:**

| Elemento | Ação | Resultado Esperado | ✓ |
|----------|------|--------------------|----|
| "Cancelar" | Clique | → volta para StartScreen ou ResultScreen |  |
| "Tentar novamente" (se erro) | Clique | Reinicia teste |  |
| Ícone de tema | Clique | Dark/light toggle funciona |  |

**Validação de copy:**
- [ ] "Verificando a resposta do servidor…"
- [ ] "Medindo a velocidade de download…"
- [ ] "Medindo a velocidade de upload…"
- [ ] Nenhuma string em inglês

**Validação de fases:**
- [ ] Latência (~5-10s)
- [ ] Download (~5-10s)
- [ ] Upload (~5-10s)
- [ ] Carga (opcional, ~5s)
- [ ] DNS (opcional, ~5s)
- [ ] Concluído (~10s wait)

---

### 3️⃣ RESULT SCREEN (Resultado)

**Ação:** Teste deve completar → ResultScreen

**Verificações visuais:**
- [ ] Download/Upload/Latência/Jitter/PacketLoss exibidos
- [ ] Grade A-F visível
- [ ] Qualidade (Excelente/Boa/Aceitável/Lenta)
- [ ] Cards de use cases (Gaming, Streaming, Home Office, Video Call)
- [ ] Botões: "Compartilhar", "Novo Teste", "Explorar", "Teste por Sala"
- [ ] Seção "Mais detalhes" com accordions
- [ ] TopBar com back button & share icon

**Teste de cliques:**

| Elemento | Ação | Resultado Esperado | ✓ |
|----------|------|--------------------|----|
| "Novo Teste" | Clique | → RunningScreen |  |
| "Explorar" | Clique | → ExploreScreen |  |
| "Teste por Sala" | Clique | → RoomTestScreen |  |
| "Compartilhar" (TopBar) | Clique | Gera card + copy URL (toast) |  |
| Back ← (TopBar) | Clique | → StartScreen |  |
| Accordion "Diagnóstico" | Clique | Expande/fecha diagnóstico |  |
| Accordion "Detalhes Técnicos" | Clique | Lazy load → AdvancedSheet |  |
| Accordion "Modo Gamer" | Clique | Lazy load → GamerSheet |  |
| Accordion "DNS" | Clique | Lazy load → DNSGuideSheet |  |

**Validação de copy:**
- [ ] Grade é letra (A, B, C, D, E, F)
- [ ] Qualidade em português ("Excelente", "Boa", "Aceitável", "Lenta")
- [ ] Use cases com ícones e status ("Bom", "Pode falhar", "Limitado")
- [ ] Timestamp: "agora", "há 5 minutos", "ontem", etc.

**Validação de Sheets (ao abrir acordeões):**
- [ ] DNSGuideSheet: contém guia de otimização DNS
  - [ ] Botão close (X) funciona
- [ ] AdvancedSheet: mostra IP, colo, ISP, contrato (editável)
  - [ ] Botão close funciona
  - [ ] Edição de contrato (se disponível)
- [ ] GamerSheet: análise para gaming
  - [ ] Botão close funciona

---

### 4️⃣ HISTORY SCREEN (Histórico)

**Ação:** Clique "Histórico" em StartScreen ou ResultScreen

**Verificações visuais:**
- [ ] Gráfico de área com últimos 10 testes
- [ ] Lista de testes com data, DL/UL, qualidade chip
- [ ] Botões: PDF export, share
- [ ] Summary card (média DL/UL, contagem, headline)
- [ ] Trend card (se mudança > 10% semana/mês)
- [ ] Anatel eligibility card (se elegível: plano fixo, < 80%, 30 dias, 5 testes)

**Teste de cliques:**

| Elemento | Ação | Resultado Esperado | ✓ |
|----------|------|--------------------|----|
| Test item na lista | Clique | Seleciona & mostra detalhes (expandir) |  |
| PDF export button | Clique | Download PDF do histórico |  |
| Share detail | Clique | Copia link para compartilhar |  |
| "Gerar Denúncia Anatel" (se visível) | Clique | Gera PDF de denúncia |  |
| "Apagar histórico" | Clique | Confirm → limpa histórico |  |
| Back ← | Clique | Volta para tela anterior |  |
| Pull-to-refresh | Gesto | Atualiza lista |  |

**Validação de copy:**
- [ ] Trend: "Velocidade subiu 15%" ou "Caiu 8%"
- [ ] Quality chips: cores corretas (verde, amarelo, vermelho)
- [ ] Empty state (se vazio): "Nenhum teste registrado"

---

### 5️⃣ EXPLORE SCREEN (Configurações)

**Ação:** Clique "Explorar" em StartScreen ou ResultScreen

**Verificações visuais:**
- [ ] Menu hamburger (☰) visível
- [ ] Secção "Perfil e conta"
- [ ] Secção "Experiência do app"
- [ ] Secção "Medição e alertas"
- [ ] Secção "Histórico e dados"
- [ ] Secção "Ajuda e sobre"

**Teste de cliques - Menu Items:**

| Item | Ação | Resultado Esperado | ✓ |
|------|------|--------------------|----|
| "Perfil" | Clique | Edit sheet → seleção de use case |  |
| "Provedor" | Clique | Edit sheet → input de ISP |  |
| "🌙 Tema Escuro" | Clique | Dark/light toggle |  |
| "⚡ Modo Rápido/Completo" | Clique | Toggle entre modos |  |
| "Alertas" | Clique | Edit sheet → limites de alerta |  |
| "Histórico" | Clique | → HistoryScreen |  |
| "Exportar dados" | Clique | Edit sheet → download CSV/JSON |  |
| "Ver tutorial novamente" | Clique | OnboardingScreen aparece como overlay |  |
| "Sobre" | Clique | Edit sheet → versão, créditos, license |  |

**Teste de Danger Buttons:**

| Botão | Ação | Resultado Esperado | ✓ |
|-------|------|--------------------|----|
| "Apagar histórico" (warn) | Clique | Confirm dialog |  |
| Confirm delete | Clique | Histórico limpo |  |
| "Resetar aplicativo" (danger) | Clique | Confirm dialog |  |
| Confirm reset | Clique | App reseta (tudo limpo) |  |

**Validação de copy:**
- [ ] Seção labels corretos
- [ ] Menu items em português
- [ ] Botões de ação claros

---

### 6️⃣ COMPARISON SCREEN (Perto/Longe)

**Ação:** Em ResultScreen → scrollar → "Comparar" ou menu

**Verificações visuais:**
- [ ] Título "Comparar Sinal"
- [ ] Card "Perto do roteador" (estado vazio ou com resultado)
- [ ] Card "Longe do roteador" (estado vazio ou com resultado)
- [ ] Comparação visual (se ambos completos)

**Teste de cliques:**

| Elemento | Ação | Resultado Esperado | ✓ |
|----------|------|--------------------|----|
| "Medir Perto" | Clique | → RunningScreen (com flag near) |  |
| "Medir Longe" | Clique | → RunningScreen (com flag far) |  |
| Teste perto completa | Auto | Volta para ComparisonScreen com resultado |  |
| Teste longe completa | Auto | Exibe comparação side-by-side |  |
| "Refazer primeiro teste" | Clique | Reset near card |  |
| "Voltar" | Clique | → return target (tela anterior) |  |

---

### 7️⃣ BEFORE/AFTER SCREEN (Antes/Depois)

**Ação:** Em ResultScreen → menu → "Teste Antes/Depois"

**Verificações visuais:**
- [ ] Card "Teste Antes" (vazio ou com resultado)
- [ ] Card "Teste Depois" (vazio ou com resultado)
- [ ] Comparação (se ambos completos)

**Teste de cliques:**

| Elemento | Ação | Resultado Esperado | ✓ |
|----------|------|--------------------|----|
| "Testar Antes" | Clique | → RunningScreen |  |
| "Testar Depois" | Clique | → RunningScreen |  |
| Teste antes completa | Auto | Volta com resultado |  |
| Teste depois completa | Auto | Exibe comparação |  |
| "Refazer testes" | Clique | Reset ambos |  |
| "Voltar" | Clique | → return target |  |

---

### 8️⃣ ROOM TEST SCREEN (Por Sala)

**Ação:** Em ResultScreen → "Teste por Sala"

**Verificações visuais:**
- [ ] Título "Onde você quer testar?"
- [ ] Chips de locais: "Sala", "Cozinha", "Quarto", "Varanda", "Outro local"

**Teste de cliques:**

| Elemento | Ação | Resultado Esperado | ✓ |
|----------|------|--------------------|----|
| Chip "Sala" | Clique | Seleciona |  |
| Chip "Outro local" | Clique | Abre input para nome customizado |  |
| Input customizado | Type | Salva nome da sala |  |
| "Iniciar Teste" | Clique | → RunningScreen (com location tag) |  |
| Teste completa | Auto | Salva com local tag no histórico |  |
| "Voltar" | Clique | → return target |  |

**Validação:**
- [ ] Localização salva em histórico (verificar em HistoryScreen)

---

### 9️⃣ PULSE SCREEN (Diagnóstico)

**Ação:** Em StartScreen → "Pulse Diagnóstico"

**Verificações visuais:**
- [ ] Mensagem inicial: "O que está incomodando?"
- [ ] Chips de sintomas/opções
- [ ] Botão "Iniciar Diagnóstico"

**Teste de cliques:**

| Elemento | Ação | Resultado Esperado | ✓ |
|----------|------|--------------------|----|
| Chip sintoma | Clique | Seleciona |  |
| "Iniciar Diagnóstico" | Clique | Rodando diagnóstico (API) |  |
| Resultado | Auto | Mostra recomendações |  |
| "Voltar" | Clique | → StartScreen |  |

**Validação:**
- [ ] Nenhuma mensagem de erro (se API falhar, fallback apresentado)
- [ ] Copy dinâmica renderiza corretamente

---

### 🔟 LOCAL WIFI SCREEN (WiFi Local)

**Ação:** Em StartScreen menu → se disponível → "Diagnóstico WiFi"

**Status:** ⚠️ Requer permissões WiFi Scanning (iOS 16+, Android 10+)

**Verificações (se funcionar):**
- [ ] Gráfico de sinal ao longo do tempo
- [ ] Cards de redes WiFi detectadas
- [ ] RSSI (força de sinal) em dBm
- [ ] Botões "Otimizar" e "Detalhes"

**Teste de cliques:**
- [ ] "Otimizar" → WifiOptimizeSheet (recomendações)
- [ ] "Detalhes" → WifiDetailsSheet (info técnica)
- [ ] "Voltar" → volta

---

### 1️⃣1️⃣ ONBOARDING SCREEN (Tutorial)

**Ação:** Reset flag em ExploreScreen → "Ver tutorial novamente"

**Verificações visuais:**
- [ ] Carrossel com imagens/ícones
- [ ] Dot indicators (1-N)
- [ ] Texto explicativo
- [ ] Botão "Próximo" / "Começar"
- [ ] Botão "Pular"

**Teste de cliques:**
- [ ] Dots navigation → muda slide
- [ ] "Próximo" → próximo slide
- [ ] "Começar" (último slide) → marca done, fecha overlay
- [ ] "Pular" → fecha overlay

---

## 📱 TESTE EM MOBILE

Depois de testar em desktop (chrome DevTools), testar em device real:

### iOS
```bash
# 1. Usar smartphone/tablet iOS
# 2. Abrir Safari
# 3. Ir para: http://<your-machine-ip>:5173
# 4. Compartilhar → Adicionar à tela inicial
# 5. Abrir PWA em modo standalone
```

**Validações iOS específicas:**
- [ ] Pull-to-refresh funciona (swipe down)
- [ ] Swipe lateral (back/forward) funciona
- [ ] Haptics funciona (vibração)
- [ ] Status bar (notch) respeitado
- [ ] Dark/light theme toggle funciona
- [ ] Safe area inset (não sobrepõe conteúdo)

### Android
```bash
# 1. Usar smartphone/tablet Android
# 2. Abrir Chrome
# 3. Ir para: http://<your-machine-ip>:5173
# 4. Menu → Instalar app
# 5. Abrir PWA
```

**Validações Android específicas:**
- [ ] Pull-to-refresh funciona
- [ ] Swipe lateral funciona
- [ ] Haptics funciona
- [ ] Navegação por gesture funciona
- [ ] Theme toggle funciona

---

## 🐛 DEBUG & TROUBLESHOOTING

Se algo não funcionar, usar DevTools (F12):

### Console
```javascript
// Verificar erros JavaScript
// Se há mensagens vermelhas, anotar

// Testar copy resolution
resolveCopy('quality.excellent.headline')
// Esperado: "Conexão excelente"

// Verificar localStorage
localStorage.getItem('linka.speedtest.theme')
// Esperado: "dark" ou "light"

localStorage.getItem('linka.onboarding.done')
// Esperado: "1" se onboarding completado
```

### Network
- [ ] Verificar que arquivos CSS/JS carregam (sem 404s)
- [ ] Service Worker se registra (offline)

### Application
- [ ] localStorage: theme, onboarding flag, settings
- [ ] Service Worker: escopo `/`, status ativado
- [ ] Manifest: PWA standalone config

### Performance
- [ ] Lighthouse score > 80 (todas as métricas)
- [ ] Nenhum erro de console

---

## 📋 RESUMO DO TESTE

Após completar todos os testes, resumir:

```markdown
## ✅ Teste de Navegação & Funcionalidade — Resultado

**Data:** [data]
**Testador:** [nome]
**Device:** [desktop/iPhone/Android]

### Status Geral
- [x] Todas as telas carregam sem erro
- [x] Todos os links navegam corretamente
- [x] Todos os botões funcionam
- [x] Copy renderiza sem erros
- [x] Dark/light theme funciona

### Problemas Encontrados
1. [Se houver, listar com screenshot + passo-a-passo para reproduzir]
2. ...

### Sugestões de UX
1. [Se houver, anotar ideias de melhoria]
2. ...

### Aprovação
- [x] Estrutura pronta para produção
- [ ] Críticos a resolver antes
```

---

## 📞 SE ALGO QUEBRAR

1. **Abrir DevTools (F12)**
2. **Ir para Console**
3. **Anotar erro exato** (copiar full message)
4. **Anotar passo-a-passo para reproduzir**
5. **Reportar com device/browser/URL**

Exemplo:
> **Erro:** "Uncaught TypeError: Cannot read property 'children' of undefined"  
> **Tela:** ResultScreen  
> **Passo:** 1. Iniciar teste; 2. Esperar completar; 3. Clicar acordeão "Diagnóstico"  
> **Device:** iPhone 15, Safari  
> **URL:** http://localhost:5173

---

**Teste completo? Sucesso! 🎉 Projeto está pronto para produção.**
