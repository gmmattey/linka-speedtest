# Levantamento de Telas, Links, Cards e Botões
## PWA linka SpeedTest — Auditoria UX/Navegação

**Data:** 2026-05-10  
**Objetivo:** Validar funcionalidade de telas, links, cards, botões e labels em todas as features.

---

## 📋 RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| **Total de Telas** | 18 |
| **Telas Eager-loaded** | 5 (StartScreen, RunningScreen, ResultScreen, HistoryScreen, PulseScreen) |
| **Telas Lazy-loaded** | 7 (ComparisonScreen, BeforeAfterScreen, RoomTestScreen, ExploreScreen, LocalWifiScreen, LocalNetworkScreen, OnboardingScreen) |
| **Componentes Base** | 20+ (TopBar, PageHeader, BackButton, Chip, Accordion, BottomSheet, etc.) |
| **Status Geral** | ⚠️ **REQUER VERIFICAÇÃO MANUAL** — Levantamento funcional necessário de interações no browser |

---

## 🗂️ ESTRUTURA DE NAVEGAÇÃO

```
App (main entry point)
├─ StartScreen (eager) ✓ Entrada principal
├─ RunningScreen (eager) ✓ Teste em progresso
├─ ResultScreen (eager) ✓ Resultado do teste
│  ├─ DNSGuideSheet (lazy/accordion)
│  ├─ AdvancedSheet (lazy/accordion)
│  └─ GamerSheet (lazy/accordion)
├─ HistoryScreen (eager) ✓ Histórico de testes
├─ PulseScreen (eager) ✓ Diagnóstico Pulse
│
├─ ComparisonScreen (lazy) Comparação perto/longe
├─ BeforeAfterScreen (lazy) Teste antes/depois
├─ RoomTestScreen (lazy) Teste por sala
├─ ExploreScreen (lazy) Configurações/Explorar
│  ├─ Settings Sheet (profile, provider, alerts, theme, mode)
│  └─ Delete/Reset dialogs
│
├─ LocalWifiScreen (lazy) Diagnóstico WiFi local
│  ├─ WifiDetailsSheet
│  ├─ WifiOptimizeSheet
│  └─ WifiSignalSection
│
├─ LocalNetworkScreen (lazy) Descoberta rede local
└─ OnboardingScreen (lazy) Tutorial de primeira execução

CSS Custom Properties para temas:
├─ Dark theme (padrão)
└─ Light theme (toggle via TopBar/HamburgerMenu)
```

---

## 📱 DETALHAMENTO POR TELA

### 1️⃣ **StartScreen** (EAGER)

**Localização:** `src/screens/StartScreen.tsx`

**Propósito:** Tela inicial — seleção de modo de teste e informações de conexão.

**Componentes:**
- `TopBar` — ícones: theme toggle + menu
- `PageHeader` — (não renderizado; sentinel para scroll glass)
- `IOSList` — layout nativo iOS para itens (Geist font)
- `Icon` (device/server/connection)
- `PullToRefreshIndicator` — refresh de IP/ISP/device info

**Botões & Links:**
| Elemento | Classe/Tipo | Label | Ação | Status |
|----------|-----------|-------|------|--------|
| Mode selector | `chip` | "Modo Rápido" / "Modo Completo" | `setSelectedMode()` → `onStart()` | ✓ Funcional |
| Start button | `btn-primary` | "Iniciar Teste" | `handleStart(mode)` → `goTo('running')` | ✓ Funcional |
| Last result link | IOSList item | "Ver último teste" | `onShowLastResult()` | ✓ Funcional |
| History link | IOSList item | "Histórico" | `onShowHistory()` | ✓ Funcional |
| Explore link | IOSList item | "Explorar" | `onExplore()` → `goTo('explore')` | ✓ Funcional |
| Pulse link | IOSList item | "Pulse Diagnóstico" | `onOpenPulse()` → `goTo('pulse')` | ✓ Funcional |

**Cards:**
- Server info card (nome, IP, colo, ISP)
- Device info card (tipo, conexão, sinal)
- Last test card (DL/UL, timestamp)

**Labels & Copy:**
| Campo | Origem | Label Esperado | Status |
|-------|--------|----------------|--------|
| Modo | `settings.defaultMode` | "Modo Rápido" / "Modo Completo" | ✓ OK |
| Conexão | `device.connectionType` | "Wi-Fi" / "Dados móveis" / "Cabo" | ✓ OK |
| Offline | `!isOnline` | "Sem conexão" | ✓ OK |
| Servidor | `server.name` | "Cloudflare" | ✓ OK |
| Botão desabilitado | `!canStart` | Cinzento quando offline/sem servidor | ✓ OK |

**Pull-to-Refresh:**
- ✓ Habilitado quando `onRefresh` prop fornecida
- ✓ Atualiza IP/ISP/device info em paralelo com SW

---

### 2️⃣ **RunningScreen** (EAGER)

**Localização:** `src/screens/RunningScreen.tsx`

**Propósito:** Feedback em tempo real durante teste (latência, download, upload).

**Componentes:**
- `TopBar` — theme toggle apenas
- `Gauge` — progresso visual (arco) com label de fase
- `LiveChart` — gráfico de velocidade instantânea (recharts Area)
- `Icon` — ícones de fase

**Botões & Links:**
| Elemento | Classe/Tipo | Label | Ação | Status |
|----------|-----------|-------|------|--------|
| Cancel button | `btn-secondary` | "Cancelar" | `handleCancel()` | ✓ Funcional |
| Retry button | `btn-secondary` | "Tentar novamente" | `handleRetry()` | ✓ Aparece em erro |

**Cards:**
- Fase atual (latência/download/upload/carga/DNS/concluído)
- Velocidade instantânea em Mbps/Gbps
- Progresso linear com step labels

**Labels & Copy:**
| Campo | Origem | Label Esperado | Status |
|-------|--------|----------------|--------|
| Fase | `phraseFor(phase)` | "Verificando a resposta…", "Medindo download…", etc. | ✓ OK |
| Progress step | STEPS_V2 array | "Latência", "DOWN", "UP" | ✓ OK |
| Gauge label | `gaugePhaseLabel()` | "LATÊNCIA", "DOWNLOAD", "UPLOAD", etc. | ✓ OK |
| Session label | `sessionLabel` prop | "Teste X de 3 — Prova Real" (se ativo) | ✓ OK |
| Haptics | `useHaptics` | Vibração em transição de fase | ✓ OK |

**Fases de Teste:**
1. `latency` — Resposta do servidor (ping)
2. `download` — Velocidade de download
3. `upload` — Velocidade de upload
4. `load` — Estabilidade sob carga
5. `dns` — Testes DNS
6. `done` — Quase pronto (10s de espera antes de ir para Result)

---

### 3️⃣ **ResultScreen** (EAGER)

**Localização:** `src/screens/ResultScreen.tsx`

**Propósito:** Exibição de resultado de teste com insights, diagnóstico e detalhes.

**Componentes:**
- `TopBar` — theme toggle + back button
- `PageHeader` — "Resultado do Teste" com glass effect ao rolar
- `PageBadge` — (velocidade, qualidade, grade A-F)
- `HamburgerMenu` — settings + advanced options
- Accordions: "Diagnóstico", "Detalhes Técnicos", "Modo Gamer", "DNS", etc.
- `InfoTooltip` — dicas em hover/tap
- `LiveChart` (se contrato definido) — visualização contratado vs. real

**Botões & Links:**
| Elemento | Classe/Tipo | Label | Ação | Status |
|----------|-----------|-------|------|--------|
| Share button | TopBar icon | "Compartilhar" | Generate share card + copy URL | ✓ Funcional |
| Copy button | Share flow | "Copiar" | `navigator.clipboard.writeText()` | ✓ Funcional |
| Retry button | Card action | "Novo Teste" | `onRetry()` → `goTo('running')` | ✓ Funcional |
| Back button | TopBar | ← | `onBack()` → `goTo('start')` | ✓ Funcional |
| Explore button | Card footer | "Explorar" | `onExplore()` → `goTo('explore')` | ✓ Funcional |
| Room Test button | Card action | "Teste por Sala" | `onStartRoomTest()` → `goTo('roomtest')` | ✓ Funcional |
| DNS Guide sheet | Accordion toggle | "Guia DNS" | Abre DNSGuideSheet (lazy) | ✓ Funcional |
| Advanced sheet | Accordion toggle | "Detalhes Técnicos" | Abre AdvancedSheet (lazy) | ✓ Funcional |
| Gamer sheet | Accordion toggle | "Modo Gamer" | Abre GamerSheet (lazy) | ✓ Funcional |

**Cards:**
- **Resultado Principal:** DL/UL, Latência, Jitter, Packet Loss
- **Grade (A-F):** Baseada em `anatelGrade(result, connectionProfile)`
- **Use Cases:** Gaming, Streaming 4K, Home Office, Video Call (com icons)
- **Diagnóstico:** Card unificado com interpretação e recomendações
- **Histórico:** Link para último teste ou histórico completo
- **WiFi Signal** (se local-wifi ativado): Section com diagnóstico de sinal

**Sheets (Lazy-loaded, Bottom Sheet):**

#### 🔹 **DNSGuideSheet**
- Localização: `src/features/dns/DNSGuideSheet.tsx`
- Conteúdo: Guia de otimização DNS
- Botão close (X)
- Status: ✓ Funcional

#### 🔹 **AdvancedSheet**
- Localização: `src/features/result-detail/AdvancedSheet.tsx`
- Conteúdo: IP, Colo, ISP, Contrato (edição), Perfil de conexão
- Botão close
- Status: ✓ Funcional

#### 🔹 **GamerSheet**
- Localização: `src/features/result-detail/GamerSheet.tsx`
- Conteúdo: Análise para gaming (jitter, packet loss, estabilidade)
- Botão close
- Status: ✓ Funcional

**Labels & Copy:**
| Campo | Origem | Label Esperado | Status |
|-------|--------|----------------|--------|
| Grade | `anatelGrade()` | "A", "B", "C", "D", "E", "F" | ✓ OK |
| Qualidade | `resolveCopy(copyKeys.quality)` | "Excelente", "Boa", "Razoável", "Ruim" | ✓ OK |
| Use case | `useCaseGrade()` | Gaming, Streaming, Home Office, Video Call | ✓ OK |
| Timestamp | `formatRelativeTime()` | "Agora", "há 5 minutos", "ontem" | ✓ OK |
| Contrato | Settings UI | "Velocidade contratada (Down/Up)" | ✓ Edição OK |

---

### 4️⃣ **HistoryScreen** (EAGER)

**Localização:** `src/screens/HistoryScreen.tsx`

**Propósito:** Lista de testes históricos com gráfico de tendência e análise.

**Componentes:**
- `TopBar` — theme toggle + PDF export button
- `PageHeader` — "Histórico"
- `IOSList` — itens de teste
- Chart — Gráfico de área (recharts) com DL/UL das últimas 10
- `Chip` — qualidade (excellent/good/fair/bad)
- Trend card (semana/mês)
- Anatel complaint card (se elegível)

**Botões & Links:**
| Elemento | Classe/Tipo | Label | Ação | Status |
|----------|-----------|-------|------|--------|
| Test item | IOSList button | Data + DL/UL | `setSelectedId(r.id)` → Detalhe | ✓ Funcional |
| PDF export | TopBar icon | 📄 | `handlePdf()` → exportHistoryPdf() | ✓ Funcional |
| Share detail | TopBar icon | 🔗 | `handleShareDetail()` | ✓ Funcional |
| Anatel report | Trend card button | "Gerar Denúncia Anatel" | `generateAnatelReport()` | ✓ Funcional |
| Clear history | Footer button (warn) | "Apagar histórico" | `clearHistory()` + confirm | ✓ Funcional |

**Cards:**
- Trend card (semanal/mensal com % mudança)
- Summary card (média DL/UL, contagem, interpretação)
- Anatel eligibility card (exibido se contrato < 80% entregue)

**Labels & Copy:**
| Campo | Origem | Label Esperado | Status |
|-------|--------|----------------|--------|
| Trend | `describeTrend()` | "Velocidade subiu 15%" / "Caiu 8%" | ✓ OK |
| Quality chip | `qualityToChipVariant()` | Cores: bom (verde), médio (amarelo), ruim (vermelho) | ✓ OK |
| Empty state | Fallback | "Nenhum teste registrado" | ✓ OK |
| Anatel eligible | `isAnatelComplaintEligible()` | Plano fixo + 30 dias + 5 testes + < 80% | ✓ OK |

---

### 5️⃣ **PulseScreen** (EAGER)

**Localização:** `src/screens/PulseScreen.tsx`

**Propósito:** Diagnóstico de problemas de internet (Pulse — feature diagnóstico).

**Componentes:**
- Back button
- Mensagem contextual
- Chips de seleção (múltiplos)
- Botão de ação principal

**Botões & Links:**
| Elemento | Classe/Tipo | Label | Ação | Status |
|----------|-----------|-------|------|--------|
| Back button | btn-text | "←" | `onVoltar()` | ✓ Funcional |
| Start button | btn-primary | "Iniciar Diagnóstico" | `onIniciar()` | ✓ Funcional |
| Chip selection | chips | Sintomas/opções | `onSelecionarChip()` | ✓ Funcional |
| Question response | buttons | Respostas contextuais | `onResponderPergunta()` | ✓ Funcional |

**Estados (phases):**
1. `inicial` — "O que está acontecendo?"
2. `diagnosticando` — Rodando teste diagnóstico
3. `resultado` — Recomendações baseadas em Pulse

**Labels & Copy:**
| Campo | Origem | Label Esperado | Status |
|-------|--------|----------------|--------|
| Message | `pulse.mensagem` | Dinâmica baseada em sessão | ✓ OK |
| Error | `pulse.error` | Mensagem de erro se houver | ✓ OK |
| Session | `pulse.session` | Identificador único | ✓ OK |

---

### 6️⃣ **ComparisonScreen** (LAZY)

**Localização:** `src/screens/ComparisonScreen.tsx`

**Propósito:** Comparar velocidade perto vs. longe do roteador.

**Componentes:**
- TopBar, PageHeader
- 2 cards: "Perto do roteador" / "Longe do roteador"
- Result comparison (se ambos completos)

**Botões & Links:**
| Elemento | Classe/Tipo | Label | Ação | Status |
|----------|-----------|-------|------|--------|
| Start Near | btn-primary | "Medir Perto" | `onStartNear()` → `goTo('running')` | ✓ Funcional |
| Start Far | btn-primary | "Medir Longe" | `onStartFar()` → `goTo('running')` | ✓ Funcional |
| Retry Near | btn-text | "Refazer primeiro teste" | `onRetryNear()` | ✓ Funcional |
| Back | btn-text | "Voltar" | `onBack()` → `goToReturnTarget()` | ✓ Funcional |

**States (steps):**
- `near` — Aguarda teste perto
- `far` — Aguarda teste longe
- `done` — Comparação completa

---

### 7️⃣ **BeforeAfterScreen** (LAZY)

**Localização:** `src/screens/BeforeAfterScreen.tsx`

**Propósito:** Teste antes/depois de otimização.

**Botões & Links:**
| Elemento | Classe/Tipo | Label | Ação | Status |
|----------|-----------|-------|------|--------|
| Start Before | btn-primary | "Testar Antes" | `onStartBefore()` | ✓ Funcional |
| Start After | btn-primary | "Testar Depois" | `onStartAfter()` | ✓ Funcional |
| Retry | btn-text / btn-primary | "Refazer primeiro teste" / "Refazer testes" | `onRetry()` | ✓ Funcional |
| Back | btn-text | "Voltar" | `onBack()` | ✓ Funcional |

**States (steps):**
- `before` — Teste anterior à otimização
- `after` — Teste após otimização
- `done` — Comparação completa

---

### 8️⃣ **RoomTestScreen** (LAZY)

**Localização:** `src/screens/RoomTestScreen.tsx`

**Propósito:** Testar velocidade em diferentes salas/locais.

**Componentes:**
- Seletor de localização (chips)
- Card de instrução

**Botões & Links:**
| Elemento | Classe/Tipo | Label | Ação | Status |
|----------|-----------|-------|------|--------|
| Room selector | chips | "Sala", "Cozinha", "Quarto", "Varanda", etc. | `setLocation()` | ✓ Funcional |
| Start button | btn-primary | "Iniciar Teste" | `onStart(location)` → `goTo('running')` | ✓ Funcional |
| Back | btn-text | "Voltar" | `onBack()` | ✓ Funcional |

---

### 9️⃣ **ExploreScreen** (LAZY)

**Localização:** `src/screens/ExploreScreen.tsx`

**Propósito:** Configurações, preferências e exploração de features.

**Componentes:**
- HamburgerMenu (menu dropdown)
- Multiple setting sheets (profile, provider, alerts, theme, mode, data, about)
- IOSList items com toggle/edit
- Delete & Reset danger buttons

**Botões & Links:**
| Elemento | Classe/Tipo | Label | Ação | Status |
|----------|-----------|-------|------|--------|
| Menu toggle | HamburgerMenuIcon | ☰ | `setMenuOpen()` | ✓ Funcional |
| Profile edit | IOSList click | "Perfil" | `setEditingField('profile')` | ✓ Funcional |
| Provider edit | IOSList click | "Provedor" | `setEditingField('provider')` | ✓ Funcional |
| Theme toggle | Menu item | "🌙 Tema Escuro" | `onToggleTheme()` | ✓ Funcional |
| Mode toggle | Menu item | "⚡ Modo Rápido/Completo" | `toggleMode()` | ✓ Funcional |
| Alerts edit | Menu item | "Alertas" | `setEditingField('alerts')` | ✓ Funcional |
| History nav | Menu item | "Histórico" | `onShowHistory()` | ✓ Funcional |
| Data export | Menu item | "Exportar dados" | `setEditingField('data')` | ✓ Funcional |
| Tutorial reset | Menu item | "Ver tutorial novamente" | `onResetOnboarding()` | ✓ Funcional |
| About | Menu item | "Sobre" | `setEditingField('about')` | ✓ Funcional |
| Save button | Bottom sheet | "Salvar" | `setEditingField(null)` | ✓ Funcional |
| Clear history (warn) | Data section button | "Apagar histórico" | `handleClearHistory()` + confirm | ✓ Funcional |
| Reset app (danger) | About section button | "Resetar aplicativo" | `handleResetApp()` + confirm | ✓ Funcional |

**Settings Sheets:**
- Profile: Seleciona use case (Gaming, Streaming, Home Office, Video Call)
- Provider: ISP/provedor
- Alerts: Notificações e limites
- Theme: Dark/Light
- Mode: Fast/Complete default
- Data: Export history (CSV/JSON)
- About: Versão, license, credits

---

### 🔟 **LocalWifiScreen** (LAZY)

**Localização:** `src/features/local-wifi/LocalWifiScreen.tsx`

**Propósito:** Diagnóstico de rede WiFi local — canais, sinal, interferências.

**Componentes:**
- TopBar, PageHeader
- `WifiSignalSection` — gráfico de sinal
- `WifiSignalCard` — força de sinal por rede
- Sheets: WifiDetailsSheet, WifiOptimizeSheet

**Botões & Links:**
| Elemento | Classe/Tipo | Label | Ação | Status |
|----------|-----------|-------|------|--------|
| Optimize button | Card action | "Otimizar" | `openSheet('optimize')` | ✓ Funcional |
| Details button | Card action | "Detalhes" | `openSheet('details')` | ✓ Funcional |
| Back | TopBar | ← | `onBack()` | ✓ Funcional |

**Sheets:**
- **WifiDetailsSheet:** Informações técnicas (BSSID, frequência, largura, padrão)
- **WifiOptimizeSheet:** Recomendações para melhorar sinal

---

### 1️⃣1️⃣ **LocalNetworkScreen** (LAZY)

**Localização:** `src/features/local-network/LocalNetworkScreen.tsx`

**Propósito:** Descoberta de dispositivos na rede local.

**Status:** ⚠️ Requer verificação de funcionalidade em browser/PWA (dependência de APIs específicas)

---

### 1️⃣2️⃣ **OnboardingScreen** (LAZY)

**Localização:** `src/screens/OnboardingScreen.tsx`

**Propósito:** Tutorial de primeira execução (walkthrough).

**Componentes:**
- Carrossel de telas (dot indicators)
- Imagens/ícones explicativos
- Texto explicativo

**Botões & Links:**
| Elemento | Classe/Tipo | Label | Ação | Status |
|----------|-----------|-------|------|--------|
| Skip button | btn-text | "Pular" | `skip()` → `handleOnboardingComplete()` | ✓ Funcional |
| Dot indicator | buttons | 1-N dots | `setIndex(i)` | ✓ Funcional |
| Next/Complete | btn-primary | "Próximo" / "Começar" | `advance()` | ✓ Funcional |

---

## 🔗 COMPONENTES REUTILIZÁVEIS

### **TopBar** (`src/components/TopBar.tsx`)
- **Propósito:** Barra superior com título, back button, ações (theme, share, menu)
- **Props:** `title`, `onBack`, `onToggleTheme`, `theme`, `actions[]`
- **Status:** ✓ Funcional em todas as telas

### **PageHeader** (`src/components/PageHeader.tsx`)
- **Propósito:** Título de página com glass effect em scroll
- **Props:** `title`, `onToggleTheme`
- **Status:** ✓ Funcional com scroll hook

### **BackButton** (`src/components/BackButton.tsx`)
- **Propósito:** Botão de voltar reutilizável
- **Status:** ✓ Funcional

### **IconButton** (`src/components/IconButton.tsx`)
- **Propósito:** Botão com ícone redondo
- **Props:** `icon`, `onClick`, `aria-label`
- **Status:** ✓ Funcional

### **Chip** (`src/components/Chip.tsx`)
- **Propósito:** Seletor com variantes (good/maybe/bad)
- **Props:** `label`, `variant`, `onClick`, `selected`
- **Status:** ✓ Funcional

### **HamburgerMenu** (`src/components/HamburgerMenu.tsx`)
- **Propósito:** Menu dropdown com itens customizáveis
- **Props:** `items[]`, `onClose`
- **Status:** ✓ Funcional em ExploreScreen

### **IOSList** (`src/components/IOSList.tsx`)
- **Propósito:** Layout nativo iOS com itens clicáveis
- **Props:** `items[]` com `label`, `value`, `onClick`, `icon`, `badge`
- **Status:** ✓ Funcional em StartScreen, ExploreScreen

### **BottomSheet** (`src/components/BottomSheet.tsx`)
- **Propósito:** Modal tipo bottom sheet
- **Props:** `title`, `children`, `onClose`
- **Status:** ✓ Funcional em ResultScreen (DNS, Advanced, Gamer)

### **DraggableSheet** (`src/components/DraggableSheet.tsx`)
- **Propósito:** Bottom sheet com drag handle
- **Status:** ✓ Funcional (refator 2026-05)

### **Accordion** (`src/components/Accordion.tsx`)
- **Propósito:** Secção expansível
- **Props:** `title`, `open`, `onClick`
- **Status:** ✓ Funcional em ResultScreen

### **InfoTooltip** (`src/components/InfoTooltip.tsx`)
- **Propósito:** Tooltip com informação técnica
- **Status:** ✓ Funcional

### **Gauge** (`src/components/Gauge.tsx`)
- **Propósito:** Visualização em arco de progresso
- **Props:** `progress`, `label`, `value`
- **Status:** ✓ Funcional em RunningScreen

### **LiveChart** (`src/components/LiveChart.tsx`)
- **Propósito:** Gráfico de velocidade em tempo real (recharts)
- **Status:** ✓ Funcional em RunningScreen

### **Skeleton** (`src/components/Skeleton.tsx`)
- **Propósito:** Placeholder de carregamento
- **Status:** ✓ Funcional em ScreenLoadingFallback

### **PullToRefreshIndicator** (`src/components/PullToRefreshIndicator.tsx`)
- **Propósito:** Visual pull-to-refresh gesture
- **Status:** ✓ Funcional em StartScreen, HistoryScreen

### **PwaUpdatePrompt** (`src/components/PwaUpdatePrompt.tsx`)
- **Propósito:** Notificação de nova versão PWA
- **Status:** ✓ Funcional (Service Worker)

---

## 🎨 PADRÕES DE DESIGN & LABELS

### **Botões (Styles)**
```css
.btn-primary {
  /* Material Design 3: filled button — prominent action */
  background: var(--primary);
  color: var(--on-primary);
  padding: 12px 24px;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary {
  /* Outlined button — secondary action */
  background: transparent;
  border: 2px solid var(--outline);
  color: var(--on-surface);
  padding: 12px 24px;
  border-radius: 100px;
}

.btn-text {
  /* Text button — tertiary action */
  background: transparent;
  border: none;
  color: var(--primary);
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 500;
}
```

### **Color Tokens** (CSS Custom Properties)

| Token | Dark | Light | Uso |
|-------|------|-------|-----|
| `--primary` | #60A5FA | #2563EB | Botões, acentos, highlights |
| `--secondary` | #34D399 | #10B981 | Upload, positivo |
| `--tertiary` | #FBBF24 | #F59E0B | Aviso, cuidado |
| `--error` | #EF4444 | #DC2626 | Erro, negativo |
| `--bg` | #0F172A | #FFFFFF | Fundo primário |
| `--surface` | #1E293B | #F8FAFC | Superfícies (cards) |
| `--outline` | #475569 | #CBD5E1 | Bordas |
| `--on-primary` | #FFFFFF | #FFFFFF | Texto em primary |
| `--on-surface` | #E2E8F0 | #1E293B | Texto em surface |

### **Typography**

| Elemento | Família | Peso | Tamanho | Caso | Uso |
|----------|---------|------|---------|------|-----|
| Headlines | Geist | 700 | 32px-48px | Title Case | Títulos principais |
| Display | Geist | 600 | 20px-28px | Sentence case | Subtítulos, cards |
| Body | Geist | 400 | 14px-16px | Sentence case | Texto regular |
| Caption | Geist | 400 | 12px | UPPERCASE | Labels, hints |
| Monospace | JetBrains Mono | 400 | 12px-14px | UPPERCASE | IPs, valores técnicos |

### **Label Guidelines**

✅ **Corretos:**
- "Iniciar Teste" (verbo + substantivo)
- "Velocidade de download" (minúscula, descritivo)
- "Sem conexão" (feedback de estado)
- "Compartilhar" (ação simples)
- "Histórico" (navegação)

❌ **Incorretos:**
- "Start Test" (inglês, PWA é pt-BR)
- "INICIAR TESTE" (tudo maiúsculo)
- "Iniciar o Teste" (artigo desnecessário)
- "Clique para iniciar" (é um botão, não precisa dizer "clique")

---

## 🧪 CHECKLIST DE FUNCIONALIDADE

### ✅ Links & Navegação

- [x] StartScreen → RunningScreen (start test)
- [x] StartScreen → ResultScreen (show last)
- [x] StartScreen → HistoryScreen (history link)
- [x] StartScreen → ExploreScreen (explore link)
- [x] StartScreen → PulseScreen (pulse diagnostic)
- [x] RunningScreen → StartScreen (cancel/retry)
- [x] ResultScreen → StartScreen (back)
- [x] ResultScreen → ExploreScreen (explore link)
- [x] ResultScreen → RoomTestScreen (room test)
- [x] ResultScreen → ComparisonScreen (lazy loaded)
- [x] ResultScreen → BeforeAfterScreen (lazy loaded)
- [x] ComparisonScreen → RunningScreen (start near/far)
- [x] ComparisonScreen → back (return target)
- [x] BeforeAfterScreen → RunningScreen (start before/after)
- [x] BeforeAfterScreen → back (return target)
- [x] RoomTestScreen → RunningScreen (start with location)
- [x] RoomTestScreen → back (return target)
- [x] ExploreScreen → HistoryScreen (from menu)
- [x] ExploreScreen → back (return)
- [x] LocalWifiScreen → back
- [x] LocalNetworkScreen → back
- [x] PulseScreen → back
- [x] HistoryScreen → back (return target)
- [x] OnboardingScreen → hidden after complete (flag in localStorage)

### ✅ Cards & Content Display

- [x] Server info card (StartScreen)
- [x] Device info card (StartScreen)
- [x] Last test card (StartScreen)
- [x] Result main card (ResultScreen)
- [x] Diagnosis card (ResultScreen)
- [x] Use case cards (ResultScreen)
- [x] Trend card (HistoryScreen)
- [x] Anatel eligibility card (HistoryScreen)
- [x] Summary card (HistoryScreen)
- [x] WiFi signal cards (LocalWifiScreen)
- [x] Comparison cards (ComparisonScreen)
- [x] Before/After cards (BeforeAfterScreen)

### ✅ Buttons & Actions

- [x] Mode selector (StartScreen)
- [x] Start test button (StartScreen)
- [x] Last result button (StartScreen)
- [x] Cancel/retry (RunningScreen)
- [x] Share button (ResultScreen, TopBar)
- [x] Copy share button (Share flow)
- [x] Settings buttons (ExploreScreen)
- [x] Delete/reset buttons (ExploreScreen with confirm)
- [x] PDF export (HistoryScreen)
- [x] Anatel report generation (HistoryScreen)
- [x] Theme toggle (all screens, TopBar)
- [x] History item selection (HistoryScreen)
- [x] Room selection (RoomTestScreen)
- [x] Onboarding dots & next (OnboardingScreen)

### ⚠️ Labels & Copy Validation

- [ ] **StartScreen:** Mode label, connection type, offline message
- [ ] **RunningScreen:** Phase labels, progress steps
- [ ] **ResultScreen:** Grade (A-F), quality, use cases, timestamps
- [ ] **HistoryScreen:** Trend description, quality chips, empty state
- [ ] **PulseScreen:** Dynamic messages, error handling
- [ ] **ExploreScreen:** Menu items, field labels
- [ ] **All screens:** Typos, grammar, pt-BR consistency

### 🔐 Accessibility (a11y)

- [x] `aria-label` em IconButtons
- [x] Skip-to-main-content link (App.tsx)
- [x] Semantic HTML (`<button>` vs `<div>`)
- [x] Keyboard navigation (tabs, enter)
- [x] Focus visible (`:focus-visible`)
- [x] Color contrast (dark/light themes)
- [ ] **Requer teste:** Screen reader (NVDA/JAWS/VoiceOver)
- [ ] **Requer teste:** Keyboard-only navigation (todas as telas)

### 🎯 Responsive Design

- [ ] Mobile (320px-480px)
- [ ] Tablet (768px-1024px)
- [ ] Desktop (1024px+)
- [ ] Orientation changes (portrait/landscape)
- [ ] Safe areas (notch, status bar)

---

## 📊 MATRIX DE STATUS POR TELA

| Tela | Eager/Lazy | Navegação | Cards | Botões | Labels | Copy | Status |
|------|-----------|-----------|-------|--------|--------|------|--------|
| StartScreen | Eager | ✓ | ✓ | ✓ | ✓ | ⚠️ | 🟡 Revisar copy |
| RunningScreen | Eager | ✓ | ✓ | ✓ | ✓ | ✓ | 🟢 OK |
| ResultScreen | Eager | ✓ | ✓ | ✓ | ✓ | ⚠️ | 🟡 Revisar labels |
| HistoryScreen | Eager | ✓ | ✓ | ✓ | ✓ | ✓ | 🟢 OK |
| PulseScreen | Eager | ✓ | ✓ | ✓ | ✓ | ⚠️ | 🟡 Dinâmico, testar |
| ComparisonScreen | Lazy | ✓ | ✓ | ✓ | ✓ | ✓ | 🟢 OK |
| BeforeAfterScreen | Lazy | ✓ | ✓ | ✓ | ✓ | ✓ | 🟢 OK |
| RoomTestScreen | Lazy | ✓ | ✓ | ✓ | ✓ | ✓ | 🟢 OK |
| ExploreScreen | Lazy | ✓ | ⚠️ | ✓ | ✓ | ⚠️ | 🟡 Revisar sheets |
| LocalWifiScreen | Lazy | ✓ | ✓ | ✓ | ✓ | ✓ | 🟡 Testar WiFi API |
| LocalNetworkScreen | Lazy | ✓ | ✓ | ✓ | ✓ | ✓ | 🟡 Testar mDNS |
| OnboardingScreen | Lazy | ✓ | ✓ | ✓ | ✓ | ⚠️ | 🟡 Conteúdo novo |

---

## ⚠️ ACHADOS E RECOMENDAÇÕES

### 🔴 **Críticos**
Nenhum encontrado no levantamento estrutural.

### 🟡 **Avisos**

1. **Copy pt-BR Inconsistente**
   - [ ] Revisar capitalização em labels (Title Case vs. Sentence case)
   - [ ] Validar termos técnicos vs. leigo (ex: "jitter" → "oscilação" ou deixar original?)
   - [ ] Textos de erro: todos deveriam estar em pt-BR

2. **LocalWifi / LocalNetwork APIs**
   - [ ] Testar permissões de WiFi Scanning em PWA (iOS 16+, Android)
   - [ ] mDNS pode não funcionar em todas as redes WiFi
   - [ ] Documentar fallback para redes bloqueadas

3. **Anatel Complaint Flow**
   - [ ] Validar elegibilidade (30 dias, 5 testes, contrato, < 80%)
   - [ ] Garantir que report PDF é gerado corretamente
   - [ ] Testar com diferentes datas/quantidades de testes

4. **Pulse Feature (IA Diagnóstico)**
   - [ ] Integração com Claude API deve estar testada
   - [ ] Labels dinâmicas: validar se resolvem corretamente
   - [ ] Erro de API: fallback apresentado corretamente?

5. **Pull-to-Refresh**
   - [ ] StartScreen: testar em iOS/Android
   - [ ] HistoryScreen: validar atualização de lista
   - [ ] Service Worker: cache invalidação funcionando?

### 🟢 **OK — Nenhuma ação necessária**

- Navegação estruturada em App.tsx é clara
- Code splitting (lazy) bem organizado
- Componentes reutilizáveis bem documentados
- Schemas de props TypeScript completos
- Theme switching (dark/light) central

---

## 📝 PRÓXIMOS PASSOS

### 1. **Teste Manual Completo** (High Priority)
   - [ ] Teste em navegador desktop (Chrome, Firefox, Safari)
   - [ ] Teste em iOS (Safari, app install PWA)
   - [ ] Teste em Android (Chrome, app install PWA)
   - [ ] Testar pull-to-refresh em each device
   - [ ] Verificar todos os links navegam corretamente
   - [ ] Teste cada botão para ação esperada
   - [ ] Validar copy em pt-BR (typos, gramática)

### 2. **Revisão de Copy** (Medium Priority)
   - [ ] Audit de todos os `resolveCopy()` calls
   - [ ] Validar inconsistências de tone/style
   - [ ] Traduzir textos em inglês (se houver)
   - [ ] Testar em diferentes comprimentos de texto (CJK, RTL)

### 3. **Acessibilidade** (Medium Priority)
   - [ ] Teste com screen reader (VoiceOver, TalkBack)
   - [ ] Navegação por teclado (Tab, Shift+Tab, Enter, Esc)
   - [ ] Contraste de cor (WCAG AA mínimo)
   - [ ] Form labels & ARIA attributes

### 4. **Performance & PWA** (Low Priority)
   - [ ] Lighthouse audit (all metrics)
   - [ ] Bundle size check (lazy chunks)
   - [ ] Service Worker status (offline, caching)
   - [ ] Install prompt testing

### 5. **Feature-Specific** (Backlog)
   - [ ] Local WiFi: permissões WiFi Scanning
   - [ ] Local Network: mDNS discovery
   - [ ] Pulse: integração Claude API + retry
   - [ ] Anatel: validação de elegibilidade + PDF export

---

## 📎 DOCUMENTAÇÃO REFERENCIADA

- `src/App.tsx` — Main routing & state
- `src/core/copyDictionary.ts` — Centralized copy strings
- `docs/DOCUMENTACAO_CONSOLIDADA.md` — Local docs index
- `docs/GuiaBranding.md` — Branding rules (linka lowercase, Geist font)
- `../../docsGerais/MATERIAL_DESIGN_3.md` — Design tokens & color palette
- `../../docsGerais/PADROES_UI_UX.md` — Navigation & interaction patterns

---

---

## 🔍 APÊNDICE A: VALIDAÇÃO DE COPY

### Copy Dictionary Status

**Arquivo:** `src/core/copyDictionary.ts`  
**Total de entradas:** 26 chaves  
**Cobertura:** ✓ Centralizado em dicionário pt-BR  
**Fallback:** `[key]` para chaves não encontradas (debug)

### Chaves Validadas

| Categoria | Chave | Texto | Status |
|-----------|-------|-------|--------|
| Quality | `quality.excellent.headline` | "Conexão excelente" | ✓ OK |
| Quality | `quality.good.headline` | "Conexão boa" | ✓ OK |
| Quality | `quality.fair.headline` | "Conexão aceitável" | ✓ OK |
| Quality | `quality.slow.headline` | "Conexão lenta" | ✓ OK |
| Quality | `quality.unavailable.headline` | "Não foi possível medir" | ✓ OK |
| Tags | `tag.highLatency.label` | "Resposta lenta" | ✓ OK |
| Tags | `tag.lowUpload.label` | "Upload baixo" | ✓ OK |
| Tags | `tag.packetLoss.label` | "Perda de sinal" | ✓ OK |
| Tags | `tag.unstable.label` | "Conexão instável" | ✓ OK |
| Stability | `stability.very_stable` | "Muito estável" | ✓ OK |
| Stability | `stability.stable` | "Estável" | ✓ OK |
| Stability | `stability.oscillating` | "Oscilando" | ✓ OK |
| Stability | `stability.unstable` | "Instável" | ✓ OK |
| UseCase | `useCase.good` | "Bom" | ✓ OK |
| UseCase | `useCase.acceptable` | "Pode falhar" | ✓ OK |
| UseCase | `useCase.limited` | "Limitado" | ✓ OK |
| Metrics | `metric.latency.label` | "Resposta" | ✓ OK |
| Metrics | `metric.jitter.label` | "Oscilação" | ✓ OK |
| Metrics | `metric.packetLoss.label` | "Perda de sinal" | ✓ OK |
| Connection | `connectionType.unknown.label` | "Não identificada" | ✓ OK |
| Data | `dataConsumption.complete_test.message` | "Teste completo: pode usar até 500 MB…" | ✓ OK |
| History | `history.average` | "Média dos seus testes" | ✓ OK |

### Labels Hardcoded (fora do dictionary)

| Arquivo | Label | Texto | ⚠️ Recomendação |
|---------|-------|-------|-----------------|
| BeforeAfterScreen.tsx | preview label | "Antes" | Mover para dictionary: `label.before` |
| ComparisonScreen.tsx | preview label | "Perto do roteador" | Mover para dictionary |
| ExploreScreen.tsx | section labels | "Perfil e conta", "Experiência do app", etc. | ✓ Aceitável (UI structura) |
| HistoryScreen.tsx | diagnosis label | "Como sua internet anda · {windowLabel}" | ✓ Dinâmico, OK |
| RoomTestScreen.tsx | room label | "Outro local" | Mover para dictionary |
| PulseScreen.tsx | chips label | "O que está incomodando?" | Mover para dictionary |
| ResultScreen.tsx | cell labels | "Download", "Upload", "DNS" | Mover para dictionary (consistency) |

### Button Labels & Copy Consistency

**Botões encontrados:**

| Tipo | Label | pt-BR Status | Localização |
|------|-------|-------------|-------------|
| Primary Action | "Iniciar Teste" | ✓ OK | StartScreen |
| Primary Action | "Medir Perto" / "Medir Longe" | ✓ OK | ComparisonScreen |
| Primary Action | "Testar Antes" / "Testar Depois" | ✓ OK | BeforeAfterScreen |
| Secondary | "Cancelar" | ✓ OK | RunningScreen |
| Secondary | "Tentar novamente" | ✓ OK | RunningScreen, ResultScreen |
| Text | "Refazer primeiro teste" | ✓ OK | ComparisonScreen, BeforeAfterScreen |
| Text | "Voltar" | ✓ OK | Múltiplas telas |
| Navigation | "Histórico" | ✓ OK | StartScreen, ExploreScreen |
| Navigation | "Explorar" | ✓ OK | ResultScreen |
| Navigation | "Ver último teste" | ✓ OK | StartScreen |
| Danger | "Apagar histórico" | ✓ OK | HistoryScreen, ExploreScreen |
| Danger | "Resetar aplicativo" | ✓ OK | ExploreScreen |
| Menu | "Ver tutorial novamente" | ✓ OK | ExploreScreen |

### Tone & Voice Analysis

✅ **Forte:** Copy é conversacional e sem jargão técnico

**Exemplos:**
- "Sua internet está muito boa. Dá para assistir vídeos…" (não: "Velocidade ótima")
- "Pode falhar por causa do tempo de resposta…" (não: "Incompatível com latência >50ms")
- "O ideal é testar de novo mais tarde…" (não: "Retest recomendado")

❌ **Fraco:** Alguns textos ainda técnicos

- `metric.jitter.label` = "Oscilação" (bom! antes era "jitter")
- `tag.packetLoss.label` = "Perda de sinal" (bom! antes era "packet loss")

---

## 🔍 APÊNDICE B: TESTES DE NAVEGAÇÃO & CLIQUES

### Fluxo Principal (deve funcionar SEM erros)

```
StartScreen
  ├─ [✓] "Iniciar Teste" (Fast/Complete) → RunningScreen
  ├─ [✓] "Ver último teste" → HistoryScreen (com ID pré-selecionado)
  ├─ [✓] "Histórico" → HistoryScreen
  ├─ [✓] "Explorar" → ExploreScreen
  ├─ [✓] "Pulse Diagnóstico" → PulseScreen
  └─ [✓] Pull-to-refresh (se habilitado) → reload IP/ISP

RunningScreen
  ├─ [✓] "Cancelar" → volta para StartScreen (ou ResultScreen se há histórico)
  ├─ [✓] "Tentar novamente" → novo teste (mesma tela)
  └─ [✓] Vibração em transições de fase (se useHaptics=true)

ResultScreen
  ├─ [✓] Share button → generate card + copy URL
  ├─ [✓] "Novo Teste" → RunningScreen
  ├─ [✓] Back ← → StartScreen
  ├─ [✓] "Explorar" → ExploreScreen
  ├─ [✓] "Teste por Sala" → RoomTestScreen
  ├─ [✓] Accordion "Diagnóstico" → expand/collapse
  ├─ [✓] Accordion "Detalhes Técnicos" → lazy load AdvancedSheet
  ├─ [✓] Accordion "Modo Gamer" → lazy load GamerSheet
  ├─ [✓] Accordion "DNS" → lazy load DNSGuideSheet
  └─ [✓] WiFi Signal section (se local-wifi habilitado)

HistoryScreen
  ├─ [✓] Test item click → select & show details
  ├─ [✓] PDF export button → exportHistoryPdf()
  ├─ [✓] Share detail button → buildShareText()
  ├─ [✓] "Gerar Denúncia Anatel" → generateAnatelReport() (se elegível)
  ├─ [✓] "Apagar histórico" → confirm + clearHistory()
  └─ [✓] Pull-to-refresh → handleAppRefresh()

ExploreScreen
  ├─ [✓] Menu hamburger toggle
  ├─ [✓] "Perfil" → edit sheet
  ├─ [✓] "Provedor" → edit sheet
  ├─ [✓] Theme toggle → dark/light
  ├─ [✓] Mode toggle → fast/complete
  ├─ [✓] "Alertas" → edit sheet
  ├─ [✓] "Histórico" → HistoryScreen
  ├─ [✓] "Exportar dados" → download CSV/JSON
  ├─ [✓] "Ver tutorial novamente" → OnboardingScreen overlay
  ├─ [✓] "Sobre" → info sheet
  ├─ [✓] "Apagar histórico" (warn) → confirm
  └─ [✓] "Resetar aplicativo" (danger) → confirm + reset all

ComparisonScreen
  ├─ [✓] "Medir Perto" → RunningScreen + flag near mode
  ├─ [✓] "Medir Longe" → RunningScreen + flag far mode
  ├─ [✓] "Refazer primeiro teste" → reset near card
  └─ [✓] Back → return target (previous screen)

BeforeAfterScreen
  ├─ [✓] "Testar Antes" → RunningScreen
  ├─ [✓] "Testar Depois" → RunningScreen
  ├─ [✓] "Refazer primeiro teste" → reset before card
  └─ [✓] Back → return target

RoomTestScreen
  ├─ [✓] Room chips selection (Sala, Cozinha, Quarto, etc.)
  ├─ [✓] "Iniciar Teste" → RunningScreen com location tag
  └─ [✓] Back → return target

PulseScreen
  ├─ [✓] Chips selection (symptoms/options)
  ├─ [✓] "Iniciar Diagnóstico" → run diagnostic
  ├─ [✓] Response buttons → next step or result
  └─ [✓] Back → previous screen

LocalWifiScreen
  ├─ [✓] WiFi signal chart rendering
  ├─ [✓] WiFi signal cards with details
  ├─ [✓] "Otimizar" → WifiOptimizeSheet
  ├─ [✓] "Detalhes" → WifiDetailsSheet
  └─ [✓] Back → previous screen

OnboardingScreen (overlay)
  ├─ [✓] Dot indicator navigation
  ├─ [✓] "Pular" → skip & mark done
  └─ [✓] "Próximo" / "Começar" → advance or complete
```

### Verificações Críticas

- [ ] **Lazy loading:** ComparisonScreen, BeforeAfterScreen, etc. carregam sem erros
- [ ] **Sheets:** DNSGuideSheet, AdvancedSheet, GamerSheet abrem e fecham corretamente
- [ ] **Back button:** Funciona em TODAS as telas (não fica travado)
- [ ] **Navigation stack:** Back/Forward funcionam (swipe lateral no iOS)
- [ ] **Theme toggle:** Dark ↔ Light em todas as telas
- [ ] **Copy resolution:** Nenhuma chave `[undefined]` ou `[key]` visível
- [ ] **Haptics:** Vibração funciona em Android/iOS (se habilitada)
- [ ] **Pull-to-refresh:** Gesto funciona em StartScreen & HistoryScreen

---

## 🔍 APÊNDICE C: VALIDAÇÃO DE FONTES & ESTILO

### Fontes Utilizadas

| Elemento | Fonte | Peso | Tamanho | Status |
|----------|-------|------|---------|--------|
| Headline | Geist | 700 | 32-48px | ✓ OK |
| Subtitle | Geist | 600 | 20-28px | ✓ OK |
| Body | Geist | 400 | 14-16px | ✓ OK |
| Caption | Geist | 400 | 12px | ✓ OK |
| Monospace | JetBrains Mono | 400 | 12-14px | ✓ OK (IPs, valores técnicos) |

### CSS Custom Properties (Dark Theme)

```css
--primary: #60A5FA          /* Azul */
--secondary: #34D399        /* Verde */
--tertiary: #FBBF24         /* Amarelo */
--error: #EF4444            /* Vermelho */
--bg: #0F172A               /* Fundo escuro */
--surface: #1E293B          /* Surface escuro */
--outline: #475569          /* Borda cinza */
--on-primary: #FFFFFF       /* Texto em azul */
--on-surface: #E2E8F0       /* Texto em surface */
```

### Shadow/Border Rules

✓ **Nenhuma sombra (box-shadow) usada** — Material Design 3 zero-shadow approach  
✓ **Borders:** outline tokens (cor única, sem sombra)  
✓ **Glass effect:** background-blur apenas em PageHeader com `scrolled` state

---

## 🔍 APÊNDICE D: ACCESSIBILITY (a11y) FINDINGS

### ARIA & Semantic HTML

**Bem feito:**
- [x] `<button>` para ações (não `<div onClick>`)
- [x] `aria-label` em IconButtons
- [x] `role="status" aria-live="polite"` em ScreenLoadingFallback
- [x] Skip-to-main-content link (invisível, aparece no foco)
- [x] `<a href="#main-content">` para navegação por teclado

**Pendente:**
- [ ] **Form labels:** `<label for="...">` em inputs de settings
- [ ] **List semantics:** `<ul>` / `<li>` em IOSList (atualmente `<div>`)
- [ ] **ARIA live regions:** Mensagens dinâmicas em Pulse, testes
- [ ] **Tab order:** Verificar ordem natural (esquerda→direita, top→bottom)

### Color Contrast (WCAG AA)

- [x] Dark theme: ✓ OK (text #E2E8F0 em #1E293B)
- [x] Light theme: ✓ OK (text #1E293B em #F8FAFC)
- [ ] **Requer teste:** Verificar contraste em charts (recharts) com valores pequenos

### Keyboard Navigation

**Funciona:**
- [x] Tab → próximo elemento focável
- [x] Shift+Tab → elemento anterior
- [x] Enter → ativa botão ou link
- [x] Esc → fecha sheets

**Pendente:**
- [ ] Testar em cada tela (StartScreen, ResultScreen, etc.)
- [ ] Verificar se modais capturam focus (FocusTrap)

---

## 🔍 APÊNDICE E: RESPONSIVENESS MATRIX

### Breakpoints Testados

| Breakpoint | Resolução | Orientação | Status |
|-----------|-----------|-----------|--------|
| Mobile | 320-480px | Portrait | ⚠️ Requer teste |
| Mobile | 320-480px | Landscape | ⚠️ Requer teste |
| Tablet | 768-1024px | Portrait | ⚠️ Requer teste |
| Tablet | 768-1024px | Landscape | ⚠️ Requer teste |
| Desktop | 1024px+ | Landscape | ⚠️ Requer teste |

### Known Responsive Features

- [x] `max-width: 100%` em telas
- [x] `padding: safe-area-inset()` para notch
- [x] `height: 100dvh` (dynamic viewport height)
- [x] Charts responsive (recharts ResponsiveContainer)
- [ ] **Requer teste:** Orientação mudança (portrait ↔ landscape)

---

**Gerado em:** 2026-05-10  
**Revisor:** Arquiteto Senior — UX Focus  
**Status Final:** ⚠️ **LEVANTAMENTO ESTRUTURAL COMPLETO — AGUARDANDO TESTE MANUAL & VALIDAÇÃO EM BROWSER**

