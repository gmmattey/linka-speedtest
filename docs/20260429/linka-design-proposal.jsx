import React, { useState } from 'react';
import { Wifi, ArrowDown, ArrowUp, Activity, AlertTriangle, CheckCircle2, ChevronRight, Zap, Gamepad2, Tv, Briefcase, Video, FileDown, Share2, RotateCcw, Info } from 'lucide-react';

export default function LinkaDesignProposal() {
  const [tab, setTab] = useState('atual');

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#0F0F14]" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />

      <style>{`
        body, .num { font-variant-numeric: tabular-nums; }
        .serif { font-family: 'Instrument Serif', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .brand { color: #5B3FE8; }
        .bg-brand { background: #5B3FE8; }
        .border-brand { border-color: #5B3FE8; }
      `}</style>

      {/* HEADER */}
      <header className="px-6 pt-12 pb-8 max-w-3xl mx-auto">
        <div className="text-xs uppercase tracking-[0.2em] text-[#6B6B6B] mb-3 mono">Design Proposal · v2</div>
        <h1 className="text-5xl md:text-6xl font-medium leading-[0.95] tracking-tight mb-4">
          <span className="brand">linka</span>
          <span className="serif italic text-[#6B6B6B] ml-2">— refinada.</span>
        </h1>
        <p className="serif text-2xl leading-snug text-[#3A3A3A] max-w-xl">
          Não é redesign. É refinamento cirúrgico do que já funciona, mais reorganização de hierarquia onde está quebrada.
        </p>
      </header>

      {/* SISTEMA DE CORES */}
      <section className="px-6 py-10 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <SectionLabel num="01" title="Cores" subtitle="Paleta restringida e semântica" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Swatch hex="#5B3FE8" name="Brand" role="Ação primária" textLight />
          <Swatch hex="#FAFAF7" name="Background" role="Cream quente" border />
          <Swatch hex="#0F0F14" name="Ink" role="Texto primário" textLight />
          <Swatch hex="#FFFFFF" name="Surface" role="Cards" border />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Swatch hex="#16A34A" name="Boa" role="Status positivo" textLight />
          <Swatch hex="#D97706" name="Atenção" role="Warnings" textLight />
          <Swatch hex="#DC2626" name="Crítico" role="Bufferbloat, perdas" textLight />
          <Swatch hex="#2563EB" name="Data" role="Download" textLight />
        </div>

        <p className="text-sm text-[#6B6B6B] mt-6 leading-relaxed">
          <strong className="text-[#0F0F14]">O que mudou:</strong> dois greens viraram um. "Pode falhar" sai do orange genérico pra âmbar específico (#D97706). Background branco vira cream sutil — diferencia do Speedtest/Fast.com sem custar legibilidade.
        </p>
      </section>

      {/* TIPOGRAFIA */}
      <section className="px-6 py-10 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <SectionLabel num="02" title="Tipografia" subtitle="Três famílias, três funções" />

        <div className="space-y-8">
          <TypeSpec
            family="Instrument Serif"
            role="Editorial · Diagnóstico humano"
            sample={<span className="serif italic">"Aguenta 4K e Discord. Em Valorant ranqueado, espera lag em horário de pico."</span>}
            note="Serif itálica pro texto narrativo. Dá voz, foge do tom corporativo de toda fintech."
          />
          <TypeSpec
            family="Geist"
            role="UI · Botões, labels, navegação"
            sample={<span className="text-2xl">Iniciar teste · Ver histórico · Compartilhar PDF</span>}
            note="Substitui o que parece ser Inter hoje. Mais geométrica, mantém legibilidade, foge do default."
          />
          <TypeSpec
            family="JetBrains Mono"
            role="Dados · Mbps, ms, percentuais"
            sample={<span className="mono text-3xl tracking-tight">569 Mbps · 44 ms · 0.0%</span>}
            note="Tabular figures: dígitos têm largura igual, números não 'dançam' ao atualizar durante o teste. Detalhe pequeno, impacto grande na percepção de qualidade."
          />
        </div>
      </section>

      {/* COMPARATIVO TELAS */}
      <section className="px-6 py-10 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <SectionLabel num="03" title="Tela de resultado" subtitle="Onde está o maior ganho de UX" />

        <div className="flex gap-2 mb-6 mono text-xs">
          <button
            onClick={() => setTab('atual')}
            className={`px-4 py-2 rounded-full ${tab === 'atual' ? 'bg-[#0F0F14] text-white' : 'bg-white border border-[#E8E6E0] text-[#6B6B6B]'}`}
          >
            ATUAL
          </button>
          <button
            onClick={() => setTab('proposta')}
            className={`px-4 py-2 rounded-full ${tab === 'proposta' ? 'bg-brand text-white' : 'bg-white border border-[#E8E6E0] text-[#6B6B6B]'}`}
          >
            PROPOSTA
          </button>
        </div>

        {tab === 'atual' ? <PhoneAtual /> : <PhoneProposta />}

        <div className="mt-6 space-y-3 text-sm leading-relaxed">
          {tab === 'atual' ? (
            <>
              <Annotation type="bad" text="Status banner ('Conexão boa') ocupa topo nobre mas não diz nada acionável." />
              <Annotation type="bad" text="Números enormes vêm antes do diagnóstico — usuário comum não sabe se 569 Mbps é bom." />
              <Annotation type="bad" text='"Pode falhar" sem causa = ansiedade sem ação.' />
              <Annotation type="bad" text="4 use-cases mostrados sempre, mesmo quando 3 estão idênticos. Ruído." />
            </>
          ) : (
            <>
              <Annotation type="good" text="Verdict editorial em itálico, primeira coisa que se lê. Voz humana, específica, acionável." />
              <Annotation type="good" text="Causa-raiz destacada quando existe. Inclui ação concreta, não só diagnóstico." />
              <Annotation type="good" text="Métricas viram referência técnica, não headline. Mono tabular pra credibilidade." />
              <Annotation type="good" text="Use-cases reduzidos a apenas o que importa, com explicação inline." />
              <Annotation type="good" text="Comparação com plano contratado (quando informado) — o '%' Anatel virou cidadão de primeira classe." />
            </>
          )}
        </div>
      </section>

      {/* CARD DE DIAGNÓSTICO */}
      <section className="px-6 py-10 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <SectionLabel num="04" title="Padrão novo: causa-raiz" subtitle="O componente que vira seu fosso" />

        <p className="serif text-xl leading-snug text-[#3A3A3A] mb-6">
          Quando há problema, este card aparece <em>antes</em> dos números. Diagnóstico → causa → ação. Em três linhas.
        </p>

        <DiagnosticCard
          severity="warning"
          icon={<AlertTriangle className="w-5 h-5" />}
          title="Bufferbloat moderado no seu roteador"
          body="Latência ociosa de 12ms, mas sob carga sobe pra 187ms. Quando alguém na sua casa baixa algo, seu jogo trava."
          action="Ative SQM/cake no seu roteador (5min de configuração)"
          actionHref="#"
        />

        <div className="mt-3" />

        <DiagnosticCard
          severity="critical"
          icon={<AlertTriangle className="w-5 h-5" />}
          title="Wi-Fi 5GHz saturado no canal 36"
          body="Outros 7 vizinhos usando o mesmo canal. RSSI -67dBm no roteador. Throughput perdendo 60%."
          action="Mude pro canal 149 ou conecte cabo"
          actionHref="#"
        />

        <div className="mt-3" />

        <DiagnosticCard
          severity="good"
          icon={<CheckCircle2 className="w-5 h-5" />}
          title="Sem problemas detectados"
          body="Latência baixa sob carga, sem perda de pacotes, peering ao Cloudflare GIG saudável."
          action={null}
        />

        <p className="text-sm text-[#6B6B6B] mt-6 leading-relaxed">
          <strong className="text-[#0F0F14]">Por que isso é seu fosso:</strong> Apple e Google nunca vão fazer isso porque é opinativo, regional e culturalmente específico. É puro código de regras em cima das métricas que você já mede. Custo: ~3 dias de dev. Diferenciação: enorme.
        </p>
      </section>

      {/* MICRODETALHES */}
      <section className="px-6 py-10 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <SectionLabel num="05" title="Microdetalhes" subtitle="O que separa amador de profissional" />

        <div className="space-y-4 text-sm leading-relaxed">
          <DetailRow label="Tabular figures" body="Mono nos números faz dígitos terem largura igual. Durante o teste, o '507' que vira '512' não pula horizontalmente. Speedtest faz, Fast.com faz, você ainda não." />
          <DetailRow label="Animação só em transições" body="Loader circular durante teste é OK. Animações decorativas em ícones, banners, hover — tira credibilidade técnica. Linka deve parecer ferramenta, não brinquedo." />
          <DetailRow label="Dark mode primeiro" body="Gamer/streamer rodam dark mode 90% do tempo. Garanta que o dark esteja igualmente bonito antes de polir o light. Background dark proposto: #0F0F14 (não #000 puro)." />
          <DetailRow label="PDF com identidade" body="Hoje o PDF é texto cru. Replicar a paleta + tipografia da marca no PDF aumenta percepção de seriedade quando o usuário compartilha pra reclamar com ISP." />
          <DetailRow label="Empty state do histórico" body="Primeiro teste = sem histórico. Mostre 'Faça mais 2 testes pra ver tendência' em vez de gráfico vazio." />
          <DetailRow label="Loading com contexto" body="Em vez de só 'Testando...', mostre o que está acontecendo: 'Medindo bufferbloat com 8 conexões paralelas'. Educa o usuário sobre por que linka é diferente." />
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="px-6 py-12 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <p className="serif italic text-xl text-[#3A3A3A] leading-snug">
          Ordem de implementação sugerida: cores e tipografia primeiro (1 dia), depois reestruturação da tela de resultado (2-3 dias), por fim os cards de diagnóstico (3-5 dias com a lógica de regras).
        </p>
        <p className="text-xs text-[#6B6B6B] mono mt-6">linka design proposal · 2026</p>
      </footer>
    </div>
  );
}

/* ============ COMPONENTES AUXILIARES ============ */

function SectionLabel({ num, title, subtitle }) {
  return (
    <div className="mb-8">
      <div className="mono text-xs text-[#6B6B6B] tracking-wider mb-2">{num}</div>
      <h2 className="text-3xl font-medium tracking-tight">{title}</h2>
      <p className="serif italic text-lg text-[#6B6B6B] mt-1">{subtitle}</p>
    </div>
  );
}

function Swatch({ hex, name, role, textLight, border }) {
  return (
    <div className={`rounded-lg overflow-hidden ${border ? 'border border-[#E8E6E0]' : ''}`}>
      <div
        className="h-20 flex items-end p-3"
        style={{ background: hex, color: textLight ? '#FFF' : '#0F0F14' }}
      >
        <span className="mono text-xs">{hex}</span>
      </div>
      <div className="px-3 py-2 bg-white">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-[#6B6B6B]">{role}</div>
      </div>
    </div>
  );
}

function TypeSpec({ family, role, sample, note }) {
  return (
    <div className="border-l-2 border-[#5B3FE8] pl-4">
      <div className="flex items-baseline gap-3 mb-1">
        <span className="mono text-xs text-[#6B6B6B] uppercase tracking-wider">{family}</span>
        <span className="text-xs text-[#6B6B6B]">· {role}</span>
      </div>
      <div className="my-3 leading-tight">{sample}</div>
      <p className="text-xs text-[#6B6B6B] leading-relaxed">{note}</p>
    </div>
  );
}

/* ========= TELA ATUAL (reconstrução fiel) ========= */
function PhoneAtual() {
  return (
    <div className="mx-auto max-w-[340px] rounded-[36px] bg-white border border-[#E8E6E0] overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-[#E8E6E0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl text-[#6B46FF] font-bold">linka</span>
        </div>
        <div className="w-6 h-6 rounded-full border border-[#E8E6E0]" />
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#F0FDF4] border-l-4 border-[#22C55E]">
          <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
          <span className="font-semibold">Conexão boa</span>
        </div>

        <div className="grid grid-cols-2 gap-3 py-3">
          <div>
            <div className="text-xs text-[#6B6B6B]">↓ Download</div>
            <div className="text-3xl font-bold text-[#3B82F6]">569<span className="text-sm text-[#6B6B6B] ml-1">Mbps</span></div>
          </div>
          <div>
            <div className="text-xs text-[#6B6B6B]">↑ Upload</div>
            <div className="text-3xl font-bold text-[#22C55E]">64.7<span className="text-sm text-[#6B6B6B] ml-1">Mbps</span></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center py-3 border-y border-[#E8E6E0]">
          <div>
            <div className="text-xl font-bold">44 ms</div>
            <div className="text-xs text-[#6B6B6B]">Resposta</div>
          </div>
          <div>
            <div className="text-xl font-bold">9 ms</div>
            <div className="text-xs text-[#6B6B6B]">Oscilação</div>
          </div>
          <div>
            <div className="text-sm font-bold">Estável</div>
            <div className="text-xs text-[#6B6B6B]">Estabilidade</div>
          </div>
        </div>

        <div>
          <div className="font-semibold mb-1">O que isso significa?</div>
          <p className="text-sm text-[#3A3A3A]">Sua internet está boa para o dia a dia. Streaming, videochamadas e trabalho remoto funcionam sem problemas.</p>
        </div>

        <div>
          <div className="font-semibold mb-2">Para o que sua internet serve?</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="border border-[#E8E6E0] rounded p-2">
              <Gamepad2 className="w-4 h-4 mb-1" />
              Games online
              <div className="inline-block ml-1 px-2 py-0.5 text-xs bg-[#FED7AA] text-[#9A3412] rounded">Pode falhar</div>
            </div>
            <div className="border border-[#E8E6E0] rounded p-2">
              <Tv className="w-4 h-4 mb-1" />
              Streaming 4K
              <div className="inline-block ml-1 px-2 py-0.5 text-xs bg-[#DCFCE7] text-[#166534] rounded">Bom</div>
            </div>
            <div className="border border-[#E8E6E0] rounded p-2">
              <Briefcase className="w-4 h-4 mb-1" />
              Home Office
              <div className="inline-block ml-1 px-2 py-0.5 text-xs bg-[#DCFCE7] text-[#166534] rounded">Bom</div>
            </div>
            <div className="border border-[#E8E6E0] rounded p-2">
              <Video className="w-4 h-4 mb-1" />
              Videochamada
              <div className="inline-block ml-1 px-2 py-0.5 text-xs bg-[#DCFCE7] text-[#166534] rounded">Bom</div>
            </div>
          </div>
        </div>

        <button className="w-full py-3 bg-[#6B46FF] text-white rounded-xl font-semibold">Testar novamente</button>
      </div>
    </div>
  );
}

/* ========= TELA PROPOSTA ========= */
function PhoneProposta() {
  return (
    <div className="mx-auto max-w-[340px] rounded-[36px] bg-[#FAFAF7] border border-[#E8E6E0] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E8E6E0] flex items-center justify-between">
        <span className="text-xl font-bold" style={{ color: '#5B3FE8' }}>linka</span>
        <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider">28 abr · 02:27</div>
      </div>

      {/* VERDICT EDITORIAL */}
      <div className="px-5 pt-6 pb-4">
        <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Veredito</div>
        <p className="serif text-[22px] leading-[1.2] text-[#0F0F14]">
          Aguenta <em>4K</em>, Discord e dois downloads em paralelo. Em <em>Valorant ranqueado</em>, espera lag em horário de pico.
        </p>
      </div>

      {/* CAUSA RAIZ */}
      <div className="mx-5 mb-5 p-4 rounded-xl border border-[#FDE68A] bg-[#FFFBEB]">
        <div className="flex items-start gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-[#D97706] mt-0.5 shrink-0" />
          <div className="font-semibold text-sm text-[#92400E]">Bufferbloat moderado detectado</div>
        </div>
        <p className="text-xs text-[#78350F] leading-relaxed mb-3">
          Latência ociosa <span className="mono">12ms</span>. Sob carga: <span className="mono">187ms</span>. Quando alguém baixa algo, seu jogo trava.
        </p>
        <a href="#" className="inline-flex items-center gap-1 text-xs font-medium text-[#5B3FE8]">
          Como resolver no seu roteador <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      {/* MÉTRICAS — referência técnica, não headline */}
      <div className="mx-5 mb-5 grid grid-cols-2 gap-px bg-[#E8E6E0] rounded-xl overflow-hidden">
        <div className="bg-[#FAFAF7] p-3">
          <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Download</div>
          <div className="mono text-2xl font-medium text-[#0F0F14]">569<span className="text-xs text-[#6B6B6B] ml-1">Mbps</span></div>
          <div className="mono text-[10px] text-[#6B6B6B] mt-1">95% do plano</div>
        </div>
        <div className="bg-[#FAFAF7] p-3">
          <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Upload</div>
          <div className="mono text-2xl font-medium text-[#0F0F14]">64.7<span className="text-xs text-[#6B6B6B] ml-1">Mbps</span></div>
          <div className="mono text-[10px] text-[#16A34A] mt-1">Estável</div>
        </div>
        <div className="bg-[#FAFAF7] p-3">
          <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Latência</div>
          <div className="mono text-base font-medium">
            <span className="text-[#0F0F14]">12</span>
            <span className="text-[#6B6B6B] mx-1">→</span>
            <span className="text-[#D97706]">187</span>
            <span className="text-xs text-[#6B6B6B] ml-1">ms</span>
          </div>
          <div className="mono text-[10px] text-[#D97706] mt-1">+15× sob carga</div>
        </div>
        <div className="bg-[#FAFAF7] p-3">
          <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Perda</div>
          <div className="mono text-2xl font-medium text-[#16A34A]">0.0<span className="text-xs text-[#6B6B6B] ml-1">%</span></div>
          <div className="mono text-[10px] text-[#6B6B6B] mt-1">Sem perda</div>
        </div>
      </div>

      {/* USE CASES — só os que importam */}
      <div className="mx-5 mb-5">
        <div className="mono text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Vai funcionar pra</div>
        <div className="space-y-1.5">
          <UseCaseRow icon={<Tv className="w-4 h-4" />} label="Streaming 4K" status="good" detail="Banda sobra" />
          <UseCaseRow icon={<Video className="w-4 h-4" />} label="Videochamada" status="good" detail="Latência ociosa baixa" />
          <UseCaseRow icon={<Briefcase className="w-4 h-4" />} label="Home Office" status="good" detail="Upload sustentado OK" />
          <UseCaseRow icon={<Gamepad2 className="w-4 h-4" />} label="Games competitivos" status="warn" detail="Bufferbloat compromete" />
        </div>
      </div>

      {/* DETALHES expandível */}
      <div className="mx-5 mb-5 border-t border-[#E8E6E0] pt-4">
        <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
          <span>Detalhes técnicos</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>

      {/* AÇÕES */}
      <div className="mx-5 mb-6 space-y-2">
        <button className="w-full py-3 rounded-xl text-white font-medium text-sm" style={{ background: '#5B3FE8' }}>
          Testar novamente
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-sm font-medium flex items-center justify-center gap-1.5">
            <FileDown className="w-4 h-4" /> PDF
          </button>
          <button className="py-2.5 rounded-xl border border-[#E8E6E0] bg-white text-sm font-medium flex items-center justify-center gap-1.5">
            <Share2 className="w-4 h-4" /> Histórico
          </button>
        </div>
      </div>
    </div>
  );
}

function UseCaseRow({ icon, label, status, detail }) {
  const colors = {
    good: { dot: '#16A34A', text: '#0F0F14' },
    warn: { dot: '#D97706', text: '#0F0F14' },
    bad: { dot: '#DC2626', text: '#0F0F14' },
  };
  const c = colors[status];
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      <div className="text-[#6B6B6B]">{icon}</div>
      <div className="flex-1 text-sm" style={{ color: c.text }}>{label}</div>
      <div className="text-xs text-[#6B6B6B] mono">{detail}</div>
    </div>
  );
}

/* ============ ANNOTATIONS & DIAG CARDS ============ */
function Annotation({ type, text }) {
  return (
    <div className="flex gap-3 items-start">
      <div className={`mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
        type === 'good' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEE2E2] text-[#991B1B]'
      }`}>
        {type === 'good' ? '✓' : '×'}
      </div>
      <p className="text-sm text-[#3A3A3A] leading-relaxed">{text}</p>
    </div>
  );
}

function DiagnosticCard({ severity, icon, title, body, action, actionHref }) {
  const styles = {
    warning: { bg: '#FFFBEB', border: '#FDE68A', icon: '#D97706', titleColor: '#92400E', bodyColor: '#78350F' },
    critical: { bg: '#FEF2F2', border: '#FECACA', icon: '#DC2626', titleColor: '#991B1B', bodyColor: '#7F1D1D' },
    good: { bg: '#F0FDF4', border: '#BBF7D0', icon: '#16A34A', titleColor: '#166534', bodyColor: '#14532D' },
  };
  const s = styles[severity];

  return (
    <div className="p-4 rounded-xl border" style={{ background: s.bg, borderColor: s.border }}>
      <div className="flex items-start gap-2 mb-2">
        <div style={{ color: s.icon }}>{icon}</div>
        <div className="font-semibold text-sm" style={{ color: s.titleColor }}>{title}</div>
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color: s.bodyColor }}>{body}</p>
      {action && (
        <a href={actionHref} className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: '#5B3FE8' }}>
          {action} <ChevronRight className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function DetailRow({ label, body }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-3 border-b border-[#E8E6E0] last:border-b-0">
      <div className="mono text-xs text-[#6B6B6B] uppercase tracking-wider">{label}</div>
      <p className="text-sm text-[#3A3A3A]">{body}</p>
    </div>
  );
}
