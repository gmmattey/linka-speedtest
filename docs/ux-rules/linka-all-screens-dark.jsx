import React from 'react';
import {
  Wifi, WifiOff, Cable, Smartphone, Server, ChevronRight, ChevronDown, ChevronLeft, X, Settings, Moon, Sun,
  ArrowDown, ArrowUp, Activity, AlertTriangle, CheckCircle2, Info, Zap, Clock, MapPin,
  Gamepad2, Tv, Briefcase, Video, FileDown, Share2, RotateCcw, Trash2, Plus, Edit3, ExternalLink,
  TrendingUp, TrendingDown, History
} from 'lucide-react';

/* ============ DARK COLOR SYSTEM ============ */
const C = {
  page: '#0A0A0F',
  phone: '#0F0F14',
  card: '#1A1A22',
  cardElevated: '#22222B',
  border: '#2A2A35',
  borderSubtle: '#1F1F2A',
  textPrimary: '#FAFAF7',
  textSecondary: '#9A9A9A',
  textTertiary: '#6B6B6B',
  brand: '#7C5FFF',
  brandSubtle: 'rgba(124, 95, 255, 0.15)',
  brandBorder: 'rgba(124, 95, 255, 0.3)',
  good: '#34D399',
  goodBg: 'rgba(52, 211, 153, 0.1)',
  goodBorder: 'rgba(52, 211, 153, 0.25)',
  warn: '#FBBF24',
  warnBg: 'rgba(251, 191, 36, 0.08)',
  warnBorder: 'rgba(251, 191, 36, 0.25)',
  bad: '#F87171',
  badBg: 'rgba(248, 113, 113, 0.08)',
  badBorder: 'rgba(248, 113, 113, 0.25)',
};

export default function LinkaScreensDark() {
  return (
    <div className="min-h-screen" style={{ background: C.page, color: C.textPrimary, fontFamily: "'Geist', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />

      <style>{`
        body, .num { font-variant-numeric: tabular-nums; }
        .serif { font-family: 'Instrument Serif', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <header className="px-6 pt-12 pb-8 max-w-3xl mx-auto">
        <div className="text-xs uppercase tracking-[0.2em] mb-3 mono" style={{ color: C.textTertiary }}>Screen Map · Dark</div>
        <h1 className="text-4xl md:text-5xl font-medium leading-[0.95] tracking-tight mb-4">
          As mesmas 11 telas, <span className="serif italic" style={{ color: C.brand }}>no escuro.</span>
        </h1>
        <p className="serif text-xl leading-snug max-w-xl" style={{ color: C.textSecondary }}>
          Não é light invertido. É decisão de design separada — purple mais claro, semáforos mais vivos, fundos translúcidos.
        </p>
      </header>

      <div className="px-6 max-w-3xl mx-auto space-y-16 pb-20">

        {/* TELA 01 — HOME */}
        <ScreenBlock
          num="01"
          title="Home / Iniciar"
          desc="Detecção automática de conexão e operadora antes do usuário pedir."
          features={[
            "Detecção automática de tipo de conexão",
            "Operadora via IP",
            "CTA único e dominante",
            "Aviso de consumo de dados",
            "Link rápido pro último teste"
          ]}
        >
          <Phone>
            <PhoneHeader showSettings dark />
            <div className="px-5 pt-4 pb-3 flex items-center gap-2 mono text-[10px]">
              <Wifi className="w-3 h-3" style={{ color: C.brand }} />
              <span style={{ color: C.textSecondary }}>DETECTADO:</span>
              <span style={{ color: C.textPrimary }}>Wi-Fi · NC Brasil Telecom</span>
            </div>
            <div className="flex flex-col items-center justify-center px-5 pt-8 pb-8">
              <button className="w-56 h-56 rounded-full text-white text-2xl font-medium" style={{
                background: C.brand,
                boxShadow: '0 20px 60px -10px rgba(124, 95, 255, 0.5)'
              }}>
                Iniciar
              </button>
              <p className="mono text-[10px] mt-5 text-center" style={{ color: C.textSecondary }}>~400 MB · ~30s</p>
              <p className="text-xs mt-1 text-center" style={{ color: C.textTertiary }}>Recomendado em Wi-Fi ou cabo</p>
            </div>
            <div className="mx-5 mb-5 p-3 rounded-xl flex items-center justify-between" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div>
                <div className="mono text-[10px] uppercase tracking-wider" style={{ color: C.textTertiary }}>Último teste · há 2h</div>
                <div className="mono text-sm mt-0.5">↓ 569 · ↑ 64.7 Mbps</div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: C.textSecondary }} />
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 02 — CONFIGURAÇÕES */}
        <ScreenBlock
          num="02"
          title="Configurações"
          desc="Personalização técnica + plano contratado (libera comparação Anatel)."
          features={[
            "Servidor de teste",
            "Unidade Mbps/Gbps",
            "Forçar tipo de conexão",
            "Plano contratado em Mbps",
            "Modo Normal vs Detalhado",
            "Tema Auto/Claro/Escuro"
          ]}
        >
          <Phone>
            <PhoneHeader title="Configurações" backButton />
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <SettingGroup label="Teste">
                <SettingRow label="Servidor" value="Cloudflare GIG" />
                <SettingRow label="Unidade" toggle={['Mbps', 'Gbps']} active={0} />
                <SettingRow label="Conexão" toggle={['Auto', 'Wi-Fi', 'Cabo', 'Celular']} active={0} small />
                <SettingRow label="Modo" toggle={['Normal', 'Detalhado']} active={1} />
              </SettingGroup>
              <SettingGroup label="Seu plano (opcional)">
                <SettingRow label="Download contratado" value="600 Mbps" editable />
                <SettingRow label="Upload contratado" value="300 Mbps" editable />
                <div className="px-4 py-2 text-xs" style={{ color: C.textSecondary }}>
                  Libera comparação com plano + relatório Anatel
                </div>
              </SettingGroup>
              <SettingGroup label="Aparência">
                <SettingRow label="Tema" toggle={['Auto', 'Claro', 'Escuro']} active={2} />
              </SettingGroup>
              <SettingGroup label="Sobre">
                <SettingRow label="Versão" value="2.0.1" />
                <SettingRow label="GitHub" value={<ExternalLink className="w-3 h-3" />} />
              </SettingGroup>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 03 — TESTE EM ANDAMENTO */}
        <ScreenBlock
          num="03"
          title="Teste em andamento"
          desc="Fase atual com indicador de progresso. Mono tabular pros números não dançarem."
          features={[
            "Indicador de fases",
            "Número principal grande, mono tabular",
            "Mini chart histórico durante o teste",
            "Status técnico",
            "ETA restante",
            "Botão cancelar discreto"
          ]}
        >
          <Phone>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
              <button style={{ color: C.textSecondary }}><X className="w-5 h-5" /></button>
              <div className="text-base font-bold" style={{ color: C.brand }}>linka</div>
              <div className="w-5" />
            </div>

            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mono text-[10px]">
                <PhaseDot done label="LATÊNCIA" />
                <div className="flex-1 h-px mx-1" style={{ background: C.brand }} />
                <PhaseDot active label="DOWNLOAD" />
                <div className="flex-1 h-px mx-1" style={{ background: C.border }} />
                <PhaseDot label="UPLOAD" />
                <div className="flex-1 h-px mx-1" style={{ background: C.border }} />
                <PhaseDot label="SOB CARGA" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center pt-12 pb-4">
              <div className="mono text-[10px] uppercase tracking-wider mb-2" style={{ color: C.textSecondary }}>Download</div>
              <div className="mono text-7xl font-medium tabular-nums tracking-tight">412</div>
              <div className="mono text-sm mt-1" style={{ color: C.textSecondary }}>Mbps</div>
            </div>

            <div className="mx-5 my-6">
              <svg viewBox="0 0 300 80" className="w-full h-20">
                <defs>
                  <linearGradient id="gradDark1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7C5FFF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#7C5FFF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 70 L 30 60 L 60 40 L 90 25 L 120 18 L 150 15 L 180 12 L 210 14 L 240 13 Z M 240 80 L 0 80 Z" fill="url(#gradDark1)" />
                <path d="M 0 70 L 30 60 L 60 40 L 90 25 L 120 18 L 150 15 L 180 12 L 210 14 L 240 13" fill="none" stroke="#7C5FFF" strokeWidth="2" />
                <circle cx="240" cy="13" r="3" fill="#7C5FFF" />
              </svg>
            </div>

            <div className="px-5 pb-2 flex items-center justify-between mono text-[10px]" style={{ color: C.textSecondary }}>
              <span>8 conexões paralelas · Cloudflare GIG</span>
              <span>~14s</span>
            </div>

            <div className="mx-5 mb-6 h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
              <div className="h-full rounded-full" style={{ width: '55%', background: C.brand }} />
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 04 — RESULTADO BOA */}
        <ScreenBlock
          num="04"
          title="Resultado — sem problemas"
          desc="Verdict editorial primeiro, métricas técnicas depois. Sem cards de causa-raiz."
          features={[
            "Verdict editorial em itálico",
            "Métricas em grid 2x2 mono tabular",
            "Use cases reduzidos com explicação inline",
            "Detalhes técnicos colapsados",
            "CTAs: Testar, PDF, Histórico"
          ]}
        >
          <Phone>
            <PhoneHeader showSettings />
            <div className="px-5 pt-5">
              <div className="mono text-[10px] uppercase tracking-wider mb-2" style={{ color: C.textSecondary }}>Veredito</div>
              <p className="serif text-[20px] leading-[1.25]" style={{ color: C.textPrimary }}>
                Aguenta <em>4K</em>, Discord e dois downloads em paralelo. Em <em>Valorant ranqueado</em>, espera lag em horário de pico.
              </p>
            </div>

            <div className="mx-5 mt-5 grid grid-cols-2 gap-px rounded-xl overflow-hidden" style={{ background: C.border }}>
              <MetricCell label="Download" value="569" unit="Mbps" foot="95% do plano" footColor={C.good} />
              <MetricCell label="Upload" value="64.7" unit="Mbps" foot="Estável" footColor={C.good} />
              <MetricCell label="Latência" valueMixed={['12', '→', '187']} unit="ms" foot="+15× sob carga" footColor={C.warn} />
              <MetricCell label="Perda" value="0.0" unit="%" foot="Sem perda" footColor={C.good} />
            </div>

            <div className="mx-5 mt-5">
              <div className="mono text-[10px] uppercase tracking-wider mb-2" style={{ color: C.textSecondary }}>Vai funcionar pra</div>
              <div className="space-y-1.5">
                <UseCaseRow icon={<Tv className="w-4 h-4" />} label="Streaming 4K" status="good" detail="Banda sobra" />
                <UseCaseRow icon={<Video className="w-4 h-4" />} label="Videochamada" status="good" detail="Latência baixa" />
                <UseCaseRow icon={<Briefcase className="w-4 h-4" />} label="Home Office" status="good" detail="Upload OK" />
                <UseCaseRow icon={<Gamepad2 className="w-4 h-4" />} label="Games competitivos" status="warn" detail="Bufferbloat" />
              </div>
            </div>

            <div className="mx-5 mt-5 pt-4 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${C.border}`, color: C.textSecondary }}>
              <span>Detalhes técnicos</span>
              <ChevronDown className="w-3 h-3" />
            </div>

            <div className="mx-5 my-5 space-y-2">
              <button className="w-full py-3 rounded-xl text-white font-medium text-sm" style={{ background: C.brand }}>
                Testar novamente
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textPrimary }}>
                  <FileDown className="w-4 h-4" /> PDF
                </button>
                <button className="py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textPrimary }}>
                  <History className="w-4 h-4" /> Histórico
                </button>
              </div>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 05 — RESULTADO BUFFERBLOAT */}
        <ScreenBlock
          num="05"
          title="Resultado — bufferbloat detectado"
          desc="Card de causa-raiz aparece logo abaixo do verdict. Esse é o seu fosso."
          features={[
            "Verdict mais incisivo",
            "Card de causa-raiz com severidade",
            "Diagnóstico em uma linha",
            "Botão direto para a solução",
            "Latência sob carga em destaque"
          ]}
        >
          <Phone>
            <PhoneHeader showSettings />
            <div className="px-5 pt-5">
              <div className="mono text-[10px] uppercase tracking-wider mb-2" style={{ color: C.textSecondary }}>Veredito</div>
              <p className="serif text-[20px] leading-[1.25]" style={{ color: C.textPrimary }}>
                Sua banda está boa, mas <em>seu roteador trava o jogo</em> sempre que alguém na casa baixa algo.
              </p>
            </div>

            <div className="mx-5 mt-5 p-4 rounded-xl" style={{ background: C.warnBg, border: `1px solid ${C.warnBorder}` }}>
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.warn }} />
                <div className="font-semibold text-sm" style={{ color: C.warn }}>Bufferbloat moderado no seu roteador</div>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: C.textPrimary }}>
                Latência ociosa <span className="mono">12ms</span>. Sob carga: <span className="mono">187ms</span>. Quando alguém baixa algo, seu jogo trava.
              </p>
              <button className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: C.brand }}>
                Como resolver no seu roteador <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mx-5 mt-4 grid grid-cols-2 gap-px rounded-xl overflow-hidden" style={{ background: C.border }}>
              <MetricCell label="Download" value="569" unit="Mbps" foot="95% do plano" footColor={C.good} />
              <MetricCell label="Upload" value="64.7" unit="Mbps" foot="Estável" footColor={C.good} />
              <MetricCell label="Latência" valueMixed={['12', '→', '187']} unit="ms" foot="+15× sob carga" footColor={C.bad} highlight />
              <MetricCell label="Perda" value="0.2" unit="%" foot="Aceitável" footColor={C.good} />
            </div>

            <div className="mx-5 mt-5">
              <div className="mono text-[10px] uppercase tracking-wider mb-2" style={{ color: C.textSecondary }}>Vai funcionar pra</div>
              <div className="space-y-1.5">
                <UseCaseRow icon={<Gamepad2 className="w-4 h-4" />} label="Games competitivos" status="warn" detail="Bufferbloat" />
                <UseCaseRow icon={<Video className="w-4 h-4" />} label="Videochamada" status="warn" detail="Pode travar" />
                <UseCaseRow icon={<Tv className="w-4 h-4" />} label="Streaming 4K" status="good" detail="Banda sobra" />
                <UseCaseRow icon={<Briefcase className="w-4 h-4" />} label="Home Office" status="good" detail="Upload OK" />
              </div>
            </div>

            <div className="mx-5 my-5 space-y-2">
              <button className="w-full py-3 rounded-xl text-white font-medium text-sm" style={{ background: C.brand }}>
                Ver como resolver
              </button>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 06 — DIAGNÓSTICO DETALHADO */}
        <ScreenBlock
          num="06"
          title="Detalhe do diagnóstico"
          desc="Aberto via card de causa-raiz. Ensina + dá passo a passo + monetiza com afiliado."
          features={[
            "Explicação contextual humana",
            "Passo a passo numerado",
            "Estimativa de impacto",
            "Recomendação de hardware (afiliado)",
            "Botão de retestar"
          ]}
        >
          <Phone>
            <PhoneHeader title="Bufferbloat" backButton />
            <div className="px-5 pt-4">
              <div className="mono text-[10px] uppercase tracking-wider mb-2" style={{ color: C.textSecondary }}>O que é</div>
              <p className="serif text-base leading-snug mb-4" style={{ color: C.textPrimary }}>
                Seu roteador está enchendo um "balde" de pacotes em vez de descartar. Quando o balde enche, tudo atrasa — inclusive seu jogo.
              </p>

              <div className="mono text-[10px] uppercase tracking-wider mb-3 mt-5" style={{ color: C.textSecondary }}>Como resolver</div>
              <div className="space-y-3 mb-5">
                <Step num="1" title="Acesse seu roteador" desc="Digite no navegador: 192.168.1.1 ou 192.168.0.1" />
                <Step num="2" title="Procure 'QoS' ou 'SQM'" desc="Pode estar em Avançado, Rede ou Aceleração" />
                <Step num="3" title="Ative o cake / fq_codel" desc="Deixe os outros valores no automático" />
                <Step num="4" title="Salve e teste de novo" desc="Latência sob carga deve cair pra ~25ms" />
              </div>

              <div className="p-3 rounded-xl mb-4" style={{ background: C.goodBg, border: `1px solid ${C.goodBorder}` }}>
                <div className="text-xs font-semibold mb-1" style={{ color: C.good }}>Impacto esperado</div>
                <p className="text-xs" style={{ color: C.textPrimary }}>
                  Latência sob carga: <span className="mono line-through opacity-60">187ms</span> → <span className="mono font-bold">~25ms</span>
                </p>
              </div>

              <div className="p-3 rounded-xl mb-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="text-xs mb-1" style={{ color: C.textSecondary }}>Seu roteador não tem SQM?</div>
                <div className="text-sm font-medium mb-2">Recomendamos: TP-Link Archer AX55</div>
                <a href="#" className="text-xs font-medium flex items-center gap-1" style={{ color: C.brand }}>
                  Ver na Amazon (afiliado) <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button className="w-full py-3 rounded-xl text-white font-medium text-sm mb-5" style={{ background: C.brand }}>
                Testar novamente
              </button>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 07 — GAME PING ATLAS */}
        <ScreenBlock
          num="07"
          title="Game Ping Atlas"
          desc="Ping contínuo aos servidores de jogos populares. Diferenciador real."
          features={[
            "Servidores agrupados por jogo",
            "Ping atual + jitter",
            "Indicador de qualidade colorido",
            "Ranking automático",
            "Refresh contínuo em background"
          ]}
        >
          <Phone>
            <PhoneHeader title="Game Ping Atlas" backButton />
            <div className="px-5 pt-3">
              <div className="flex items-center gap-2 mono text-[10px] mb-4" style={{ color: C.textSecondary }}>
                <Activity className="w-3 h-3" style={{ color: C.brand }} />
                <span>Atualizando a cada 5s · 14 servidores</span>
              </div>

              <GameGroup name="Valorant" subtitle="Riot Games">
                <PingRow city="São Paulo (SP1)" ping="12" jitter="2" status="good" />
                <PingRow city="São Paulo (SP2)" ping="14" jitter="3" status="good" />
                <PingRow city="Brasília (BR1)" ping="38" jitter="6" status="ok" />
              </GameGroup>

              <GameGroup name="CS2" subtitle="Valve · Steam Datagram Relay">
                <PingRow city="São Paulo" ping="18" jitter="2" status="good" />
                <PingRow city="Chile" ping="62" jitter="8" status="ok" />
                <PingRow city="EUA Sudeste" ping="142" jitter="22" status="bad" />
              </GameGroup>

              <GameGroup name="League of Legends" subtitle="Riot Games">
                <PingRow city="Brasil" ping="22" jitter="3" status="good" />
                <PingRow city="LAN" ping="89" jitter="12" status="ok" />
              </GameGroup>

              <GameGroup name="Fortnite" subtitle="Epic Games">
                <PingRow city="Brasil" ping="28" jitter="5" status="good" />
                <PingRow city="EUA Leste" ping="118" jitter="18" status="bad" />
              </GameGroup>

              <div className="py-4 text-center">
                <button className="text-xs font-medium" style={{ color: C.brand }}>
                  + Adicionar mais jogos
                </button>
              </div>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 08 — HISTÓRICO */}
        <ScreenBlock
          num="08"
          title="Histórico"
          desc="Tendência ao longo do tempo. Gráfico antes da lista."
          features={[
            "Gráfico de evolução DL/UL",
            "Toggle 7d/30d/90d",
            "Média + indicador de tendência",
            "Lista cronológica",
            "Exportar PDF / Limpar"
          ]}
        >
          <Phone>
            <PhoneHeader title="Histórico" backButton showSettings />
            <div className="px-5 pt-3">
              <div className="flex items-center gap-2 mono text-[10px] mb-3">
                <button className="px-2.5 py-1 rounded-full text-white" style={{ background: C.brand }}>7D</button>
                <button className="px-2.5 py-1 rounded-full" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textSecondary }}>30D</button>
                <button className="px-2.5 py-1 rounded-full" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textSecondary }}>90D</button>
              </div>

              <div className="p-3 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="mono text-[10px] uppercase tracking-wider" style={{ color: C.textSecondary }}>Média 7 dias</div>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: C.good }}>
                    <TrendingUp className="w-3 h-3" /> +3.2%
                  </div>
                </div>
                <div className="flex items-baseline gap-3 mb-3">
                  <div>
                    <div className="mono text-2xl font-medium" style={{ color: '#60A5FA' }}>559</div>
                    <div className="mono text-[10px]" style={{ color: C.textSecondary }}>DL Mbps</div>
                  </div>
                  <div>
                    <div className="mono text-2xl font-medium" style={{ color: '#2DD4BF' }}>66.7</div>
                    <div className="mono text-[10px]" style={{ color: C.textSecondary }}>UL Mbps</div>
                  </div>
                </div>
                <svg viewBox="0 0 280 60" className="w-full h-14">
                  <path d="M 0 20 L 40 22 L 80 18 L 120 25 L 160 15 L 200 22 L 240 18 L 280 16" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  <path d="M 0 50 L 40 52 L 80 48 L 120 54 L 160 50 L 200 52 L 240 50 L 280 48" fill="none" stroke="#2DD4BF" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="mt-5 mono text-[10px] uppercase tracking-wider mb-2" style={{ color: C.textSecondary }}>Testes</div>

              <div className="space-y-2">
                <HistoryItem date="28/04 · 02:27" dl="569" ul="64.7" lat="44" status="good" />
                <HistoryItem date="28/04 · 02:06" dl="553" ul="59.7" lat="40" status="good" />
                <HistoryItem date="28/04 · 01:59" dl="566" ul="68.3" lat="35" status="good" />
                <HistoryItem date="27/04 · 22:14" dl="412" ul="58.1" lat="187" status="warn" />
                <HistoryItem date="27/04 · 19:32" dl="554" ul="68.3" lat="40" status="good" />
                <HistoryItem date="26/04 · 14:08" dl="571" ul="65.2" lat="38" status="good" />
              </div>

              <div className="mt-5 mb-5 grid grid-cols-2 gap-2">
                <button className="py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textPrimary }}>
                  <FileDown className="w-3 h-3" /> Exportar PDF
                </button>
                <button className="py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5" style={{ background: C.badBg, border: `1px solid ${C.badBorder}`, color: C.bad }}>
                  <Trash2 className="w-3 h-3" /> Limpar
                </button>
              </div>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 09 — PLANO VS REALIDADE */}
        <ScreenBlock
          num="09"
          title="Plano contratado × realidade"
          desc="Comparação Anatel quando o usuário informou o plano."
          features={[
            "Comparação % do contratado",
            "Status segundo regra Anatel",
            "Distribuição de testes",
            "Pior e melhor teste",
            "Geração de relatório formal"
          ]}
        >
          <Phone>
            <PhoneHeader title="Plano vs Realidade" backButton />
            <div className="px-5 pt-3">
              <div className="mono text-[10px] uppercase tracking-wider mb-2" style={{ color: C.textSecondary }}>Últimos 30 dias</div>

              <div className="p-4 rounded-xl mb-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <div className="text-xs" style={{ color: C.textSecondary }}>Plano contratado</div>
                    <div className="mono text-xl font-medium">600 Mbps</div>
                  </div>
                  <button className="text-[10px]" style={{ color: C.brand }}>Editar</button>
                </div>
                <div className="pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div className="text-xs" style={{ color: C.textSecondary }}>Média entregue</div>
                  <div className="flex items-baseline gap-2">
                    <div className="mono text-3xl font-medium">559</div>
                    <div className="mono text-xs" style={{ color: C.textSecondary }}>Mbps</div>
                    <div className="mono text-sm font-medium ml-2" style={{ color: C.good }}>93%</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl mb-4" style={{ background: C.goodBg, border: `1px solid ${C.goodBorder}` }}>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.good }} />
                  <div>
                    <div className="text-xs font-semibold" style={{ color: C.good }}>Acima do mínimo Anatel</div>
                    <div className="text-xs mt-0.5" style={{ color: C.textPrimary }}>Mínimo exigido: 480 Mbps (80%). Você está em 93%.</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatBox label="Acima de 80%" value="47/50" sub="testes" />
                <StatBox label="Abaixo de 40%" value="0/50" sub="testes" tone="good" />
                <StatBox label="Pior teste" value="412" sub="68% · 27/04" tone="warn" />
                <StatBox label="Melhor teste" value="612" sub="102% · 25/04" />
              </div>

              <button className="w-full py-3 rounded-xl text-white font-medium text-sm mb-5" style={{ background: C.brand }}>
                Gerar relatório Anatel
              </button>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 10 — PDF PREVIEW */}
        <ScreenBlock
          num="10"
          title="Relatório PDF (preview)"
          desc="PDF mantém conteúdo claro (é pra leitura/impressão), mas o frame do visualizador é dark."
          features={[
            "Cabeçalho com identidade linka",
            "Sumário executivo",
            "Gráfico de evolução",
            "Tabela detalhada",
            "Metadados de IP/ASN/operadora",
            "Identificador único do relatório"
          ]}
        >
          <Phone>
            <div className="py-3 px-3 flex items-center justify-between" style={{ background: '#000' }}>
              <button className="text-white"><X className="w-4 h-4" /></button>
              <div className="text-white text-xs">linka_speedtest_28-04-2026.pdf</div>
              <button className="text-white"><Share2 className="w-4 h-4" /></button>
            </div>
            <div className="p-3" style={{ background: '#1A1A1A' }}>
              <div className="bg-white rounded-sm overflow-hidden text-[8px] leading-tight">
                <div className="px-4 pt-4 pb-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-base font-bold" style={{ color: '#5B3FE8' }}>linka</span>
                  <span className="mono text-[6px] text-gray-500">RELATÓRIO TÉCNICO</span>
                </div>
                <div className="px-4 py-3">
                  <div className="serif italic text-[10px] text-gray-700 mb-3 leading-tight">
                    Conexão estável ao longo de 30 dias, atendendo 93% do plano contratado de 600 Mbps.
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <div className="text-[5px] text-gray-500 uppercase">Média DL</div>
                      <div className="mono text-[9px] font-bold">559 Mbps</div>
                    </div>
                    <div>
                      <div className="text-[5px] text-gray-500 uppercase">Média UL</div>
                      <div className="mono text-[9px] font-bold">66.7 Mbps</div>
                    </div>
                    <div>
                      <div className="text-[5px] text-gray-500 uppercase">% Plano</div>
                      <div className="mono text-[9px] font-bold text-green-700">93%</div>
                    </div>
                  </div>
                  <svg viewBox="0 0 200 30" className="w-full h-5 mb-3">
                    <path d="M 0 10 L 30 12 L 60 8 L 90 14 L 120 7 L 150 10 L 180 6 L 200 8" fill="none" stroke="#2563EB" strokeWidth="0.8" />
                    <path d="M 0 25 L 30 26 L 60 24 L 90 27 L 120 25 L 150 26 L 180 25 L 200 24" fill="none" stroke="#0D9488" strokeWidth="0.8" />
                  </svg>
                  <div className="text-[5px] text-gray-500 uppercase mb-1">Últimos testes</div>
                  <div className="space-y-0.5 mb-3">
                    {[
                      ['28/04 02:27', '569', '64.7', '44ms'],
                      ['28/04 02:06', '553', '59.7', '40ms'],
                      ['27/04 22:14', '412', '58.1', '187ms'],
                      ['27/04 19:32', '554', '68.3', '40ms'],
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between mono text-[6px]">
                        <span>{row[0]}</span>
                        <span>↓{row[1]}</span>
                        <span>↑{row[2]}</span>
                        <span>{row[3]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-2 text-[5px] text-gray-500">
                    <div>IP: 45.70.55.83 · ASN: 264479 · NC Brasil Telecom</div>
                    <div>Localização: BR · GIG · Servidor: Cloudflare GIG</div>
                  </div>
                </div>
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between mono text-[5px] text-gray-500">
                  <span>linka.app · #LK-28042026-A7B9</span>
                  <span>Pág. 1 de 3</span>
                </div>
              </div>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 11 — ERRO */}
        <ScreenBlock
          num="11"
          title="Erro / sem conexão"
          desc="Empty state com checklist acionável. Não fica reclamando."
          features={[
            "Diagnóstico do problema",
            "Lista numerada de coisas pra checar",
            "Botão de tentar de novo",
            "Link pra suporte/issues"
          ]}
        >
          <Phone>
            <PhoneHeader showSettings />
            <div className="flex flex-col items-center justify-center px-6 pt-16 pb-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: C.badBg, border: `1px solid ${C.badBorder}` }}>
                <WifiOff className="w-9 h-9" style={{ color: C.bad }} />
              </div>
              <h3 className="text-xl font-medium mb-2 text-center">Sem internet detectada</h3>
              <p className="serif italic text-base text-center leading-snug max-w-[260px] mb-6" style={{ color: C.textSecondary }}>
                Você está conectado em algum lugar? O teste precisa de pelo menos um sinal pra começar.
              </p>

              <div className="w-full mono text-[10px] uppercase tracking-wider mb-2" style={{ color: C.textSecondary }}>Tente</div>
              <div className="w-full space-y-2 mb-6">
                <ChecklistItem num="1" text="Verificar se Wi-Fi está ligado" />
                <ChecklistItem num="2" text="Desativar modo avião" />
                <ChecklistItem num="3" text="Trocar Wi-Fi por dados móveis" />
                <ChecklistItem num="4" text="Reiniciar seu roteador" />
              </div>

              <button className="w-full py-3 rounded-xl text-white font-medium text-sm mb-2" style={{ background: C.brand }}>
                Tentar novamente
              </button>
              <a href="#" className="text-xs" style={{ color: C.brand }}>Reportar problema no GitHub</a>
            </div>
          </Phone>
        </ScreenBlock>

      </div>

      <footer className="px-6 py-12 max-w-3xl mx-auto" style={{ borderTop: `1px solid ${C.border}` }}>
        <p className="serif italic text-lg leading-snug" style={{ color: C.textPrimary }}>
          11 telas dark mapeadas. Mesma estrutura do light, paleta deslocada — é o que o gamer/streamer vai usar 90% do tempo.
        </p>
        <p className="text-xs mono mt-6" style={{ color: C.textTertiary }}>linka screen map · dark · 2026</p>
      </footer>
    </div>
  );
}

/* ============ COMPONENTS ============ */

function ScreenBlock({ num, title, desc, features, children }) {
  return (
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '40px' }}>
      <div className="mb-6">
        <div className="mono text-xs tracking-wider mb-2" style={{ color: C.textTertiary }}>{num}</div>
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-2">{title}</h2>
        <p className="serif italic text-lg leading-snug" style={{ color: C.textSecondary }}>{desc}</p>
      </div>

      <div className="grid md:grid-cols-[340px_1fr] gap-8 items-start">
        <div>{children}</div>
        <div>
          <div className="mono text-[10px] uppercase tracking-wider mb-3" style={{ color: C.textTertiary }}>Funcionalidades</div>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: C.textPrimary }}>
                <span className="mono shrink-0" style={{ color: C.brand }}>·</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Phone({ children }) {
  return (
    <div className="mx-auto max-w-[340px] rounded-[36px] overflow-hidden" style={{
      background: C.phone,
      border: `1px solid ${C.border}`,
      boxShadow: '0 20px 50px -15px rgba(0,0,0,0.5)'
    }}>
      {children}
    </div>
  );
}

function PhoneHeader({ title, backButton, showSettings }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2">
        {backButton ? (
          <button style={{ color: C.textSecondary }}><ChevronLeft className="w-5 h-5" /></button>
        ) : null}
        {title ? (
          <span className="text-base font-medium">{title}</span>
        ) : (
          <span className="text-xl font-bold" style={{ color: C.brand }}>linka</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {showSettings ? (
          <>
            <button style={{ color: C.brand }}><Sun className="w-4 h-4" /></button>
            <button style={{ color: C.textSecondary }}><Settings className="w-4 h-4" /></button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function MetricCell({ label, value, valueMixed, unit, foot, footColor, highlight }) {
  return (
    <div className="p-3" style={{ background: highlight ? C.badBg : C.phone }}>
      <div className="mono text-[10px] uppercase tracking-wider mb-1" style={{ color: C.textSecondary }}>{label}</div>
      {value && (
        <div className="mono text-2xl font-medium" style={{ color: C.textPrimary }}>
          {value}<span className="text-xs ml-1" style={{ color: C.textSecondary }}>{unit}</span>
        </div>
      )}
      {valueMixed && (
        <div className="mono text-base font-medium">
          <span style={{ color: C.textPrimary }}>{valueMixed[0]}</span>
          <span className="mx-1" style={{ color: C.textSecondary }}>{valueMixed[1]}</span>
          <span style={{ color: C.bad }}>{valueMixed[2]}</span>
          <span className="text-xs ml-1" style={{ color: C.textSecondary }}>{unit}</span>
        </div>
      )}
      {foot && (
        <div className="mono text-[10px] mt-1" style={{ color: footColor || C.textSecondary }}>{foot}</div>
      )}
    </div>
  );
}

function UseCaseRow({ icon, label, status, detail }) {
  const colors = { good: C.good, warn: C.warn, bad: C.bad };
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colors[status] }} />
      <div style={{ color: C.textSecondary }}>{icon}</div>
      <div className="flex-1 text-sm" style={{ color: C.textPrimary }}>{label}</div>
      <div className="text-xs mono" style={{ color: C.textSecondary }}>{detail}</div>
    </div>
  );
}

function PhaseDot({ active, done, label }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className={`w-2 h-2 rounded-full ${active ? 'animate-pulse' : ''}`} style={{
        background: active || done ? C.brand : C.border
      }} />
      <span style={{ color: active ? C.brand : done ? C.textPrimary : C.textTertiary, fontSize: '8px' }}>
        {label}
      </span>
    </div>
  );
}

function SettingGroup({ label, children }) {
  return (
    <div className="mb-3">
      <div className="px-5 pt-4 pb-1 mono text-[10px] uppercase tracking-wider" style={{ color: C.textTertiary }}>{label}</div>
      <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>{children}</div>
    </div>
  );
}

function SettingRow({ label, value, toggle, active, editable, small }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
      <span className="text-sm" style={{ color: C.textPrimary }}>{label}</span>
      {toggle ? (
        <div className={`flex items-center gap-px rounded-full p-0.5 ${small ? 'mono text-[10px]' : 'text-xs'}`} style={{ background: C.borderSubtle }}>
          {toggle.map((t, i) => (
            <span key={i} className={`px-2.5 py-1 rounded-full ${i === active ? 'font-medium' : ''}`} style={i === active ? { background: C.brand, color: '#fff' } : { color: C.textSecondary }}>
              {t}
            </span>
          ))}
        </div>
      ) : editable ? (
        <div className="flex items-center gap-1.5">
          <span className="mono text-sm" style={{ color: C.textPrimary }}>{value}</span>
          <Edit3 className="w-3 h-3" style={{ color: C.textSecondary }} />
        </div>
      ) : (
        <span className="text-sm flex items-center gap-1.5" style={{ color: C.textSecondary }}>{value} <ChevronRight className="w-3 h-3" /></span>
      )}
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mono text-xs font-medium text-white" style={{ background: C.brand }}>
        {num}
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs mt-0.5" style={{ color: C.textSecondary }}>{desc}</div>
      </div>
    </div>
  );
}

function GameGroup({ name, subtitle, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium">{name}</span>
        <span className="mono text-[10px]" style={{ color: C.textSecondary }}>{subtitle}</span>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        {children}
      </div>
    </div>
  );
}

function PingRow({ city, ping, jitter, status }) {
  const colors = { good: C.good, ok: C.warn, bad: C.bad };
  return (
    <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors[status] }} />
        <span className="text-xs">{city}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="mono text-sm font-medium">{ping}<span className="text-[10px] ml-0.5" style={{ color: C.textSecondary }}>ms</span></div>
        </div>
        <div className="mono text-[10px]" style={{ color: C.textSecondary }}>±{jitter}</div>
      </div>
    </div>
  );
}

function HistoryItem({ date, dl, ul, lat, status }) {
  const colors = { good: C.good, warn: C.warn, bad: C.bad };
  return (
    <div className="px-3 py-2.5 rounded-xl flex items-center justify-between" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div>
        <div className="text-xs mono" style={{ color: C.textSecondary }}>{date}</div>
        <div className="mono text-xs mt-0.5">↓{dl} · ↑{ul} · {lat}ms</div>
      </div>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors[status] }} />
    </div>
  );
}

function StatBox({ label, value, sub, tone }) {
  const toneColors = { good: C.good, warn: C.warn, bad: C.bad };
  return (
    <div className="p-3 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="mono text-[10px] uppercase tracking-wider" style={{ color: C.textSecondary }}>{label}</div>
      <div className="mono text-xl font-medium mt-1" style={{ color: tone ? toneColors[tone] : C.textPrimary }}>{value}</div>
      <div className="mono text-[10px] mt-0.5" style={{ color: C.textSecondary }}>{sub}</div>
    </div>
  );
}

function ChecklistItem({ num, text }) {
  return (
    <div className="flex gap-3 items-center">
      <span className="mono text-xs w-4" style={{ color: C.textSecondary }}>{num}.</span>
      <span className="text-sm" style={{ color: C.textPrimary }}>{text}</span>
    </div>
  );
}
