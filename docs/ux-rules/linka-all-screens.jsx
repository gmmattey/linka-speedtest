import React, { useState } from 'react';
import {
  Wifi, WifiOff, Cable, Smartphone, Server, ChevronRight, ChevronDown, ChevronLeft, X, Settings, Moon, Sun,
  ArrowDown, ArrowUp, Activity, AlertTriangle, CheckCircle2, Info, Zap, Clock, MapPin,
  Gamepad2, Tv, Briefcase, Video, FileDown, Share2, RotateCcw, Trash2, Plus, Edit3, ExternalLink,
  TrendingUp, TrendingDown, Minus, Calendar, Filter, Search, Bell, BarChart3, History, FileText
} from 'lucide-react';

export default function LinkaScreens() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#0F0F14]" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />

      <style>{`
        body, .num { font-variant-numeric: tabular-nums; }
        .serif { font-family: 'Instrument Serif', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {/* HEADER */}
      <header className="px-6 pt-12 pb-8 max-w-3xl mx-auto">
        <div className="text-xs uppercase tracking-[0.2em] text-[#6B6B6B] mb-3 mono">Screen Map · v1</div>
        <h1 className="text-4xl md:text-5xl font-medium leading-[0.95] tracking-tight mb-4">
          11 telas, <span className="serif italic text-[#5B3FE8]">com dados.</span>
        </h1>
        <p className="serif text-xl leading-snug text-[#3A3A3A] max-w-xl">
          Cada tela tem função, dados realistas e funcionalidades listadas. Use como referência pra implementação.
        </p>
      </header>

      <div className="px-6 max-w-3xl mx-auto space-y-16 pb-20">

        {/* TELA 01 — HOME */}
        <ScreenBlock
          num="01"
          title="Home / Iniciar"
          desc="Ponto de entrada. Detecta automaticamente o tipo de conexão e operadora antes do usuário pedir."
          features={[
            "Detecção automática de tipo de conexão (Wi-Fi/Cabo/Celular)",
            "Detecção de operadora via IP",
            "CTA único e dominante (Iniciar)",
            "Aviso de consumo de dados",
            "Link rápido pro último teste / histórico",
            "Acesso a configurações e tema (header)"
          ]}
        >
          <Phone>
            <PhoneHeader showSettings />
            <div className="px-5 pt-4 pb-3 flex items-center gap-2 mono text-[10px]">
              <Wifi className="w-3 h-3 text-[#5B3FE8]" />
              <span className="text-[#6B6B6B]">DETECTADO:</span>
              <span className="text-[#0F0F14]">Wi-Fi · NC Brasil Telecom</span>
            </div>
            <div className="flex flex-col items-center justify-center px-5 pt-8 pb-8">
              <button className="w-56 h-56 rounded-full text-white text-2xl font-medium shadow-[0_20px_40px_-15px_rgba(91,63,232,0.5)]" style={{ background: '#5B3FE8' }}>
                Iniciar
              </button>
              <p className="mono text-[10px] text-[#6B6B6B] mt-5 text-center">~400 MB · ~30s</p>
              <p className="text-xs text-[#6B6B6B] mt-1 text-center">Recomendado em Wi-Fi ou cabo</p>
            </div>
            <div className="mx-5 mb-5 p-3 rounded-xl bg-white border border-[#E8E6E0] flex items-center justify-between">
              <div>
                <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider">Último teste · há 2h</div>
                <div className="mono text-sm mt-0.5">↓ 569 · ↑ 64.7 Mbps</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6B6B6B]" />
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 02 — CONFIGURAÇÕES */}
        <ScreenBlock
          num="02"
          title="Configurações"
          desc="Personalização técnica + entrada do plano contratado (essencial pra comparação Anatel)."
          features={[
            "Seleção de servidor de teste (Cloudflare/M-Lab/auto)",
            "Unidade: Mbps / Gbps",
            "Tipo de conexão forçado: Auto / Wi-Fi / Cabo / Celular",
            "Plano contratado em Mbps (libera comparação Anatel)",
            "Modo: Normal vs Detalhado (ativa bufferbloat + game ping)",
            "Tema: Auto / Claro / Escuro"
          ]}
        >
          <Phone>
            <PhoneHeader title="Configurações" backButton />
            <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
              <SettingGroup label="Teste">
                <SettingRow label="Servidor" value="Cloudflare GIG" />
                <SettingRow label="Unidade" toggle={['Mbps', 'Gbps']} active={0} />
                <SettingRow label="Conexão" toggle={['Auto', 'Wi-Fi', 'Cabo', 'Celular']} active={0} small />
                <SettingRow label="Modo" toggle={['Normal', 'Detalhado']} active={1} />
              </SettingGroup>
              <SettingGroup label="Seu plano (opcional)">
                <SettingRow label="Download contratado" value="600 Mbps" editable />
                <SettingRow label="Upload contratado" value="300 Mbps" editable />
                <div className="px-4 py-2 text-xs text-[#6B6B6B]">
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
          desc="Mostra a fase atual com indicador de progresso. Usa números tabulares pra dígitos não dançarem."
          features={[
            "Indicador de fases (Latência → Download → Upload → Sob carga)",
            "Número principal grande, em mono tabular",
            "Mini chart histórico durante o teste (acumula picos)",
            "Status técnico ('8 conexões paralelas')",
            "ETA restante",
            "Botão de cancelar discreto (X) no topo"
          ]}
        >
          <Phone>
            <div className="px-5 py-4 border-b border-[#E8E6E0] flex items-center justify-between">
              <button className="text-[#6B6B6B]"><X className="w-5 h-5" /></button>
              <div className="text-base font-bold" style={{ color: '#5B3FE8' }}>linka</div>
              <div className="w-5" />
            </div>

            {/* Fases */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mono text-[10px]">
                <PhaseDot done label="LATÊNCIA" />
                <div className="flex-1 h-px bg-[#5B3FE8] mx-1" />
                <PhaseDot active label="DOWNLOAD" />
                <div className="flex-1 h-px bg-[#E8E6E0] mx-1" />
                <PhaseDot label="UPLOAD" />
                <div className="flex-1 h-px bg-[#E8E6E0] mx-1" />
                <PhaseDot label="SOB CARGA" />
              </div>
            </div>

            {/* Número principal */}
            <div className="flex flex-col items-center justify-center pt-12 pb-4">
              <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Download</div>
              <div className="mono text-7xl font-medium tabular-nums tracking-tight">412</div>
              <div className="mono text-sm text-[#6B6B6B] mt-1">Mbps</div>
            </div>

            {/* Mini chart simulado */}
            <div className="mx-5 my-6">
              <svg viewBox="0 0 300 80" className="w-full h-20">
                <defs>
                  <linearGradient id="grad1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#5B3FE8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#5B3FE8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 70 L 30 60 L 60 40 L 90 25 L 120 18 L 150 15 L 180 12 L 210 14 L 240 13 Z M 240 80 L 0 80 Z" fill="url(#grad1)" />
                <path d="M 0 70 L 30 60 L 60 40 L 90 25 L 120 18 L 150 15 L 180 12 L 210 14 L 240 13" fill="none" stroke="#5B3FE8" strokeWidth="2" />
                <circle cx="240" cy="13" r="3" fill="#5B3FE8" />
              </svg>
            </div>

            {/* Status técnico */}
            <div className="px-5 pb-2 flex items-center justify-between mono text-[10px] text-[#6B6B6B]">
              <span>8 conexões paralelas · Cloudflare GIG</span>
              <span>~14s</span>
            </div>

            {/* Loading bar */}
            <div className="mx-5 mb-6 h-1 bg-[#E8E6E0] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: '55%', background: '#5B3FE8' }} />
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 04 — RESULTADO BOA CONEXÃO */}
        <ScreenBlock
          num="04"
          title="Resultado — conexão sem problemas"
          desc="Quando tudo está bem. Verdict editorial primeiro, métricas técnicas depois. Sem cards de causa-raiz."
          features={[
            "Verdict em itálico serif (voz humana, específica)",
            "Comparação com plano contratado em destaque",
            "Métricas em grid 2x2 com mono tabular",
            "Use cases reduzidos a 4 linhas com explicação inline",
            "Detalhes técnicos colapsados",
            "CTAs: Testar de novo, PDF, Compartilhar"
          ]}
        >
          <Phone>
            <PhoneHeader showSettings />
            <div className="px-5 pt-5">
              <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Veredito</div>
              <p className="serif text-[20px] leading-[1.25] text-[#0F0F14]">
                Aguenta <em>4K</em>, Discord e dois downloads em paralelo. Em <em>Valorant ranqueado</em>, espera lag em horário de pico.
              </p>
            </div>

            {/* Métricas */}
            <div className="mx-5 mt-5 grid grid-cols-2 gap-px bg-[#E8E6E0] rounded-xl overflow-hidden">
              <MetricCell label="Download" value="569" unit="Mbps" foot="95% do plano" footColor="#16A34A" />
              <MetricCell label="Upload" value="64.7" unit="Mbps" foot="Estável" footColor="#16A34A" />
              <MetricCell label="Latência" valueMixed={['12', '→', '187']} unit="ms" foot="+15× sob carga" footColor="#D97706" />
              <MetricCell label="Perda" value="0.0" unit="%" foot="Sem perda" footColor="#16A34A" />
            </div>

            <div className="mx-5 mt-5">
              <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Vai funcionar pra</div>
              <div className="space-y-1.5">
                <UseCaseRow icon={<Tv className="w-4 h-4" />} label="Streaming 4K" status="good" detail="Banda sobra" />
                <UseCaseRow icon={<Video className="w-4 h-4" />} label="Videochamada" status="good" detail="Latência ociosa baixa" />
                <UseCaseRow icon={<Briefcase className="w-4 h-4" />} label="Home Office" status="good" detail="Upload sustentado OK" />
                <UseCaseRow icon={<Gamepad2 className="w-4 h-4" />} label="Games competitivos" status="warn" detail="Bufferbloat compromete" />
              </div>
            </div>

            <div className="mx-5 mt-5 border-t border-[#E8E6E0] pt-4 flex items-center justify-between text-xs text-[#6B6B6B]">
              <span>Detalhes técnicos</span>
              <ChevronDown className="w-3 h-3" />
            </div>

            <div className="mx-5 my-5 space-y-2">
              <button className="w-full py-3 rounded-xl text-white font-medium text-sm" style={{ background: '#5B3FE8' }}>
                Testar novamente
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-sm font-medium flex items-center justify-center gap-1.5">
                  <FileDown className="w-4 h-4" /> PDF
                </button>
                <button className="py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-sm font-medium flex items-center justify-center gap-1.5">
                  <History className="w-4 h-4" /> Histórico
                </button>
              </div>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 05 — RESULTADO COM BUFFERBLOAT */}
        <ScreenBlock
          num="05"
          title="Resultado — bufferbloat detectado"
          desc="Quando tem problema. Card de causa-raiz aparece logo abaixo do verdict. Esse é o seu fosso vs Apple/Google."
          features={[
            "Verdict mais incisivo sobre o problema",
            "Card de causa-raiz com severidade visual (âmbar/vermelho)",
            "Diagnóstico técnico em uma linha",
            "Botão direto para a tela de solução",
            "Métrica de latência sob carga em destaque vermelho",
            "Use case afetado com badge de warning"
          ]}
        >
          <Phone>
            <PhoneHeader showSettings />
            <div className="px-5 pt-5">
              <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Veredito</div>
              <p className="serif text-[20px] leading-[1.25] text-[#0F0F14]">
                Sua banda está boa, mas <em>seu roteador trava o jogo</em> sempre que alguém na casa baixa algo.
              </p>
            </div>

            {/* CAUSA RAIZ — destaque */}
            <div className="mx-5 mt-5 p-4 rounded-xl border" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D97706' }} />
                <div className="font-semibold text-sm" style={{ color: '#92400E' }}>Bufferbloat moderado no seu roteador</div>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#78350F' }}>
                Latência ociosa <span className="mono">12ms</span>. Sob carga: <span className="mono">187ms</span>. Quando alguém baixa algo, seu jogo trava.
              </p>
              <button className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: '#5B3FE8' }}>
                Como resolver no seu roteador <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Métricas */}
            <div className="mx-5 mt-4 grid grid-cols-2 gap-px bg-[#E8E6E0] rounded-xl overflow-hidden">
              <MetricCell label="Download" value="569" unit="Mbps" foot="95% do plano" footColor="#16A34A" />
              <MetricCell label="Upload" value="64.7" unit="Mbps" foot="Estável" footColor="#16A34A" />
              <MetricCell label="Latência" valueMixed={['12', '→', '187']} unit="ms" foot="+15× sob carga" footColor="#D97706" highlight />
              <MetricCell label="Perda" value="0.2" unit="%" foot="Aceitável" footColor="#16A34A" />
            </div>

            <div className="mx-5 mt-5">
              <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Vai funcionar pra</div>
              <div className="space-y-1.5">
                <UseCaseRow icon={<Gamepad2 className="w-4 h-4" />} label="Games competitivos" status="warn" detail="Bufferbloat" />
                <UseCaseRow icon={<Video className="w-4 h-4" />} label="Videochamada" status="warn" detail="Pode travar com download" />
                <UseCaseRow icon={<Tv className="w-4 h-4" />} label="Streaming 4K" status="good" detail="Banda sobra" />
                <UseCaseRow icon={<Briefcase className="w-4 h-4" />} label="Home Office" status="good" detail="Upload OK" />
              </div>
            </div>

            <div className="mx-5 my-5 space-y-2">
              <button className="w-full py-3 rounded-xl text-white font-medium text-sm" style={{ background: '#5B3FE8' }}>
                Ver como resolver
              </button>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 06 — DIAGNÓSTICO DETALHADO */}
        <ScreenBlock
          num="06"
          title="Detalhe do diagnóstico"
          desc="Aberto a partir do card de causa-raiz. Ensina + dá passo a passo + monetiza com afiliado quando faz sentido."
          features={[
            "Explicação contextual do problema (em linguagem humana)",
            "Passo a passo numerado pra resolver",
            "Estimativa do impacto da solução",
            "Recomendação de hardware (afiliado, quando aplicável)",
            "Botão pra testar de novo após implementar"
          ]}
        >
          <Phone>
            <PhoneHeader title="Bufferbloat" backButton />
            <div className="px-5 pt-4">
              <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">O que é</div>
              <p className="serif text-base leading-snug text-[#3A3A3A] mb-4">
                Seu roteador está enchendo um "balde" de pacotes em vez de descartar. Quando o balde enche, tudo atrasa — inclusive seu jogo.
              </p>

              <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-3 mt-5">Como resolver</div>
              <div className="space-y-3 mb-5">
                <Step num="1" title="Acesse seu roteador" desc="Digite no navegador: 192.168.1.1 ou 192.168.0.1" />
                <Step num="2" title="Procure 'QoS' ou 'SQM'" desc="Pode estar em Avançado, Rede ou Aceleração" />
                <Step num="3" title="Ative o cake / fq_codel" desc="Deixe os outros valores no automático" />
                <Step num="4" title="Salve e teste de novo" desc="A latência sob carga deve cair pra ~25ms" />
              </div>

              <div className="p-3 rounded-xl mb-4" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div className="text-xs font-semibold mb-1" style={{ color: '#166534' }}>Impacto esperado</div>
                <p className="text-xs" style={{ color: '#14532D' }}>
                  Latência sob carga: <span className="mono line-through opacity-60">187ms</span> → <span className="mono font-bold">~25ms</span>
                </p>
              </div>

              <div className="p-3 rounded-xl border border-[#E8E6E0] bg-white mb-5">
                <div className="text-xs text-[#6B6B6B] mb-1">Seu roteador não tem SQM?</div>
                <div className="text-sm font-medium mb-2">Recomendamos: TP-Link Archer AX55</div>
                <a href="#" className="text-xs font-medium flex items-center gap-1" style={{ color: '#5B3FE8' }}>
                  Ver na Amazon (afiliado) <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button className="w-full py-3 rounded-xl text-white font-medium text-sm mb-5" style={{ background: '#5B3FE8' }}>
                Testar novamente
              </button>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 07 — GAME PING ATLAS */}
        <ScreenBlock
          num="07"
          title="Game Ping Atlas"
          desc="Lista contínua de ping pros servidores de jogos populares. Diferenciador frente a Speedtest/Fast/Cloudflare."
          features={[
            "Servidores agrupados por jogo (Riot, Valve, Blizzard, etc.)",
            "Ping atual + jitter (estabilidade)",
            "Indicador colorido de qualidade (verde/âmbar/vermelho)",
            "Ranking automático: melhor servidor primeiro",
            "Refresh contínuo em background",
            "Filtro por região"
          ]}
        >
          <Phone>
            <PhoneHeader title="Game Ping Atlas" backButton />
            <div className="px-5 pt-3">
              <div className="flex items-center gap-2 mono text-[10px] text-[#6B6B6B] mb-4">
                <Activity className="w-3 h-3 text-[#5B3FE8]" />
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
                <button className="text-xs font-medium" style={{ color: '#5B3FE8' }}>
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
          desc="Visão de tendência ao longo do tempo. O gráfico vem antes da lista — pra usuário ver se a internet está piorando."
          features={[
            "Gráfico de evolução DL/UL (toggle 7d/30d/90d)",
            "Média no período + indicador de tendência",
            "Lista cronológica detalhada",
            "Filtros: por operadora, por tipo de conexão, por status",
            "Botões: exportar PDF e limpar histórico"
          ]}
        >
          <Phone>
            <PhoneHeader title="Histórico" backButton showSettings />
            <div className="px-5 pt-3">
              <div className="flex items-center gap-2 mono text-[10px] mb-3">
                <button className="px-2.5 py-1 rounded-full text-white" style={{ background: '#5B3FE8' }}>7D</button>
                <button className="px-2.5 py-1 rounded-full bg-white border border-[#E8E6E0] text-[#6B6B6B]">30D</button>
                <button className="px-2.5 py-1 rounded-full bg-white border border-[#E8E6E0] text-[#6B6B6B]">90D</button>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8E6E0]">
                <div className="flex items-baseline justify-between mb-2">
                  <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider">Média 7 dias</div>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: '#16A34A' }}>
                    <TrendingUp className="w-3 h-3" /> +3.2%
                  </div>
                </div>
                <div className="flex items-baseline gap-3 mb-3">
                  <div>
                    <div className="mono text-2xl font-medium" style={{ color: '#2563EB' }}>559</div>
                    <div className="mono text-[10px] text-[#6B6B6B]">DL Mbps</div>
                  </div>
                  <div>
                    <div className="mono text-2xl font-medium" style={{ color: '#0D9488' }}>66.7</div>
                    <div className="mono text-[10px] text-[#6B6B6B]">UL Mbps</div>
                  </div>
                </div>
                <svg viewBox="0 0 280 60" className="w-full h-14">
                  <path d="M 0 20 L 40 22 L 80 18 L 120 25 L 160 15 L 200 22 L 240 18 L 280 16" fill="none" stroke="#2563EB" strokeWidth="1.5" />
                  <path d="M 0 50 L 40 52 L 80 48 L 120 54 L 160 50 L 200 52 L 240 50 L 280 48" fill="none" stroke="#0D9488" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="mt-5 mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Testes</div>

              <div className="space-y-2">
                <HistoryItem date="28/04 · 02:27" dl="569" ul="64.7" lat="44" status="good" />
                <HistoryItem date="28/04 · 02:06" dl="553" ul="59.7" lat="40" status="good" />
                <HistoryItem date="28/04 · 01:59" dl="566" ul="68.3" lat="35" status="good" />
                <HistoryItem date="27/04 · 22:14" dl="412" ul="58.1" lat="187" status="warn" />
                <HistoryItem date="27/04 · 19:32" dl="554" ul="68.3" lat="40" status="good" />
                <HistoryItem date="26/04 · 14:08" dl="571" ul="65.2" lat="38" status="good" />
              </div>

              <div className="mt-5 mb-5 grid grid-cols-2 gap-2">
                <button className="py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-xs font-medium flex items-center justify-center gap-1.5">
                  <FileDown className="w-3 h-3" /> Exportar PDF
                </button>
                <button className="py-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5" style={{ borderColor: '#FECACA', color: '#DC2626', background: 'white' }}>
                  <Trash2 className="w-3 h-3" /> Limpar
                </button>
              </div>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 09 — PLANO VS REALIDADE (ANATEL) */}
        <ScreenBlock
          num="09"
          title="Plano contratado × realidade"
          desc="Aparece quando o usuário informou o plano. Compara com regra Anatel (80% da média + 40% instantânea)."
          features={[
            "Comparação % do contratado vs entregue",
            "Status segundo regra Anatel (≥80% médio, ≥40% instantâneo)",
            "Distribuição de testes acima/abaixo do mínimo",
            "Pior e melhor teste do período",
            "Geração de relatório formal pra reclamação"
          ]}
        >
          <Phone>
            <PhoneHeader title="Plano vs Realidade" backButton />
            <div className="px-5 pt-3">
              <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Últimos 30 dias</div>

              <div className="p-4 rounded-xl bg-white border border-[#E8E6E0] mb-3">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <div className="text-xs text-[#6B6B6B]">Plano contratado</div>
                    <div className="mono text-xl font-medium">600 Mbps</div>
                  </div>
                  <button className="text-[10px]" style={{ color: '#5B3FE8' }}>Editar</button>
                </div>
                <div className="border-t border-[#E8E6E0] pt-3">
                  <div className="text-xs text-[#6B6B6B]">Média entregue</div>
                  <div className="flex items-baseline gap-2">
                    <div className="mono text-3xl font-medium">559</div>
                    <div className="mono text-xs text-[#6B6B6B]">Mbps</div>
                    <div className="mono text-sm font-medium ml-2" style={{ color: '#16A34A' }}>93%</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl mb-4" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#16A34A' }} />
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#166534' }}>Acima do mínimo Anatel</div>
                    <div className="text-xs mt-0.5" style={{ color: '#14532D' }}>Mínimo exigido: 480 Mbps (80%). Você está em 93%.</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatBox label="Acima de 80%" value="47/50" sub="testes" />
                <StatBox label="Abaixo de 40%" value="0/50" sub="testes" tone="good" />
                <StatBox label="Pior teste" value="412" sub="68% · 27/04" tone="warn" />
                <StatBox label="Melhor teste" value="612" sub="102% · 25/04" />
              </div>

              <button className="w-full py-3 rounded-xl text-white font-medium text-sm mb-5" style={{ background: '#5B3FE8' }}>
                Gerar relatório Anatel
              </button>
            </div>
          </Phone>
        </ScreenBlock>

        {/* TELA 10 — PDF PREVIEW */}
        <ScreenBlock
          num="10"
          title="Relatório PDF (preview)"
          desc="Como o PDF exportado deve ficar. Identidade visual da marca, dados completos, pronto pra anexar em reclamação."
          features={[
            "Cabeçalho com identidade visual linka",
            "Sumário executivo (média, plano, % adequação)",
            "Gráfico de evolução",
            "Tabela detalhada de todos os testes",
            "IP, ASN, operadora, localização, data/hora",
            "Footer com link pro app e identificador único"
          ]}
        >
          <Phone>
            <div className="bg-[#0F0F14] py-3 px-3 flex items-center justify-between">
              <button className="text-white"><X className="w-4 h-4" /></button>
              <div className="text-white text-xs">linka_speedtest_28-04-2026.pdf</div>
              <button className="text-white"><Share2 className="w-4 h-4" /></button>
            </div>
            <div className="bg-[#1A1A22] p-3">
              <div className="bg-white rounded-sm overflow-hidden text-[8px] leading-tight">
                {/* PDF mock */}
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

        {/* TELA 11 — ERRO / SEM CONEXÃO */}
        <ScreenBlock
          num="11"
          title="Erro / sem conexão"
          desc="Empty state quando não há internet ou o teste falha. Sugere ações concretas, não fica reclamando."
          features={[
            "Diagnóstico rápido do problema (sem rede / falha de servidor / timeout)",
            "Lista numerada de coisas pra checar",
            "Botão de tentar de novo",
            "Link pra suporte / GitHub issues"
          ]}
        >
          <Phone>
            <PhoneHeader showSettings />
            <div className="flex flex-col items-center justify-center px-6 pt-16 pb-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: '#FEE2E2' }}>
                <WifiOff className="w-9 h-9" style={{ color: '#DC2626' }} />
              </div>
              <h3 className="text-xl font-medium mb-2 text-center">Sem internet detectada</h3>
              <p className="serif italic text-base text-[#6B6B6B] text-center leading-snug max-w-[260px] mb-6">
                Você está conectado em algum lugar? O teste precisa de pelo menos um sinal pra começar.
              </p>

              <div className="w-full mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Tente</div>
              <div className="w-full space-y-2 mb-6">
                <ChecklistItem num="1" text="Verificar se Wi-Fi está ligado" />
                <ChecklistItem num="2" text="Desativar modo avião" />
                <ChecklistItem num="3" text="Trocar Wi-Fi por dados móveis (ou vice-versa)" />
                <ChecklistItem num="4" text="Reiniciar seu roteador" />
              </div>

              <button className="w-full py-3 rounded-xl text-white font-medium text-sm mb-2" style={{ background: '#5B3FE8' }}>
                Tentar novamente
              </button>
              <a href="#" className="text-xs" style={{ color: '#5B3FE8' }}>Reportar problema no GitHub</a>
            </div>
          </Phone>
        </ScreenBlock>

      </div>

      <footer className="px-6 py-12 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <p className="serif italic text-lg text-[#3A3A3A] leading-snug">
          11 telas mapeadas. Quer que eu detalhe os estados intermediários (loading, hover, dark mode, gestos) ou prefere começar a implementar?
        </p>
        <p className="text-xs text-[#6B6B6B] mono mt-6">linka screen map · 2026</p>
      </footer>
    </div>
  );
}

/* ============ COMPONENTS ============ */

function ScreenBlock({ num, title, desc, features, children }) {
  return (
    <div className="border-t border-[#E8E6E0] pt-10">
      <div className="mb-6">
        <div className="mono text-xs text-[#6B6B6B] tracking-wider mb-2">{num}</div>
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-2">{title}</h2>
        <p className="serif italic text-lg text-[#6B6B6B] leading-snug">{desc}</p>
      </div>

      <div className="grid md:grid-cols-[340px_1fr] gap-8 items-start">
        <div>{children}</div>
        <div>
          <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-3">Funcionalidades</div>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#3A3A3A] leading-relaxed">
                <span className="mono text-[#5B3FE8] shrink-0">·</span>
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
    <div className="mx-auto max-w-[340px] rounded-[36px] bg-[#FAFAF7] border border-[#E8E6E0] overflow-hidden shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)]">
      {children}
    </div>
  );
}

function PhoneHeader({ title, backButton, showSettings }) {
  return (
    <div className="px-5 py-4 border-b border-[#E8E6E0] flex items-center justify-between">
      <div className="flex items-center gap-2">
        {backButton ? (
          <button className="text-[#6B6B6B]"><ChevronLeft className="w-5 h-5" /></button>
        ) : null}
        {title ? (
          <span className="text-base font-medium">{title}</span>
        ) : (
          <span className="text-xl font-bold" style={{ color: '#5B3FE8' }}>linka</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {showSettings ? (
          <>
            <button className="text-[#6B6B6B]"><Moon className="w-4 h-4" /></button>
            <button className="text-[#6B6B6B]"><Settings className="w-4 h-4" /></button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function MetricCell({ label, value, valueMixed, unit, foot, footColor, highlight }) {
  return (
    <div className={`p-3 ${highlight ? 'bg-[#FEF2F2]' : 'bg-[#FAFAF7]'}`}>
      <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">{label}</div>
      {value && (
        <div className="mono text-2xl font-medium text-[#0F0F14]">
          {value}<span className="text-xs text-[#6B6B6B] ml-1">{unit}</span>
        </div>
      )}
      {valueMixed && (
        <div className="mono text-base font-medium">
          <span className="text-[#0F0F14]">{valueMixed[0]}</span>
          <span className="text-[#6B6B6B] mx-1">{valueMixed[1]}</span>
          <span style={{ color: '#D97706' }}>{valueMixed[2]}</span>
          <span className="text-xs text-[#6B6B6B] ml-1">{unit}</span>
        </div>
      )}
      {foot && (
        <div className="mono text-[10px] mt-1" style={{ color: footColor || '#6B6B6B' }}>{foot}</div>
      )}
    </div>
  );
}

function UseCaseRow({ icon, label, status, detail }) {
  const colors = {
    good: '#16A34A',
    warn: '#D97706',
    bad: '#DC2626'
  };
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colors[status] }} />
      <div className="text-[#6B6B6B]">{icon}</div>
      <div className="flex-1 text-sm text-[#0F0F14]">{label}</div>
      <div className="text-xs text-[#6B6B6B] mono">{detail}</div>
    </div>
  );
}

function PhaseDot({ active, done, label }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className={`w-2 h-2 rounded-full ${
        active ? 'animate-pulse' : ''
      }`} style={{
        background: active || done ? '#5B3FE8' : '#E8E6E0'
      }} />
      <span style={{ color: active ? '#5B3FE8' : done ? '#0F0F14' : '#6B6B6B', fontSize: '8px' }}>
        {label}
      </span>
    </div>
  );
}

function SettingGroup({ label, children }) {
  return (
    <div className="mb-3">
      <div className="px-5 pt-4 pb-1 mono text-[10px] text-[#6B6B6B] uppercase tracking-wider">{label}</div>
      <div className="bg-white border-y border-[#E8E6E0]">{children}</div>
    </div>
  );
}

function SettingRow({ label, value, toggle, active, editable, small }) {
  return (
    <div className="px-5 py-3 border-b border-[#E8E6E0] last:border-b-0 flex items-center justify-between">
      <span className="text-sm text-[#0F0F14]">{label}</span>
      {toggle ? (
        <div className={`flex items-center gap-px rounded-full p-0.5 bg-[#F0F0EB] ${small ? 'mono text-[10px]' : 'text-xs'}`}>
          {toggle.map((t, i) => (
            <span key={i} className={`px-2.5 py-1 rounded-full ${i === active ? 'bg-white shadow-sm font-medium' : 'text-[#6B6B6B]'}`} style={i === active ? { color: '#5B3FE8' } : {}}>
              {t}
            </span>
          ))}
        </div>
      ) : editable ? (
        <div className="flex items-center gap-1.5">
          <span className="mono text-sm text-[#0F0F14]">{value}</span>
          <Edit3 className="w-3 h-3 text-[#6B6B6B]" />
        </div>
      ) : (
        <span className="text-sm text-[#6B6B6B] flex items-center gap-1.5">{value} <ChevronRight className="w-3 h-3" /></span>
      )}
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mono text-xs font-medium text-white" style={{ background: '#5B3FE8' }}>
        {num}
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-[#6B6B6B] mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function GameGroup({ name, subtitle, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium">{name}</span>
        <span className="mono text-[10px] text-[#6B6B6B]">{subtitle}</span>
      </div>
      <div className="bg-white rounded-xl border border-[#E8E6E0] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function PingRow({ city, ping, jitter, status }) {
  const colors = { good: '#16A34A', ok: '#D97706', bad: '#DC2626' };
  return (
    <div className="px-3 py-2.5 border-b border-[#E8E6E0] last:border-b-0 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors[status] }} />
        <span className="text-xs">{city}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="mono text-sm font-medium">{ping}<span className="text-[10px] text-[#6B6B6B] ml-0.5">ms</span></div>
        </div>
        <div className="mono text-[10px] text-[#6B6B6B]">±{jitter}</div>
      </div>
    </div>
  );
}

function HistoryItem({ date, dl, ul, lat, status }) {
  const colors = { good: '#16A34A', warn: '#D97706', bad: '#DC2626' };
  return (
    <div className="px-3 py-2.5 rounded-xl bg-white border border-[#E8E6E0] flex items-center justify-between">
      <div>
        <div className="text-xs text-[#6B6B6B] mono">{date}</div>
        <div className="mono text-xs mt-0.5">↓{dl} · ↑{ul} · {lat}ms</div>
      </div>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors[status] }} />
    </div>
  );
}

function StatBox({ label, value, sub, tone }) {
  const toneColors = {
    good: '#16A34A',
    warn: '#D97706',
    bad: '#DC2626'
  };
  return (
    <div className="p-3 rounded-xl bg-white border border-[#E8E6E0]">
      <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider">{label}</div>
      <div className="mono text-xl font-medium mt-1" style={{ color: tone ? toneColors[tone] : '#0F0F14' }}>{value}</div>
      <div className="mono text-[10px] text-[#6B6B6B] mt-0.5">{sub}</div>
    </div>
  );
}

function ChecklistItem({ num, text }) {
  return (
    <div className="flex gap-3 items-center">
      <span className="mono text-xs text-[#6B6B6B] w-4">{num}.</span>
      <span className="text-sm text-[#3A3A3A]">{text}</span>
    </div>
  );
}
