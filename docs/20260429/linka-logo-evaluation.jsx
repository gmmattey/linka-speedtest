import React, { useState } from 'react';

export default function LinkaLogoEvaluation() {
  const [iconChoice, setIconChoice] = useState('arc');

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#0F0F14]" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />

      <style>{`
        body, .num { font-variant-numeric: tabular-nums; }
        .serif { font-family: 'Instrument Serif', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <header className="px-6 pt-12 pb-8 max-w-3xl mx-auto">
        <div className="text-xs uppercase tracking-[0.2em] text-[#6B6B6B] mb-3 mono">Logo Eval · App Icon Proposal</div>
        <h1 className="text-4xl md:text-5xl font-medium leading-[0.95] tracking-tight mb-4">
          O wordmark já está bom.
          <span className="serif italic text-[#6B6B6B]"> O ícone não.</span>
        </h1>
      </header>

      {/* RANKING */}
      <section className="px-6 py-8 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <div className="mono text-xs text-[#6B6B6B] tracking-wider mb-4">01 · RANKING DAS 4 OPÇÕES</div>

        <div className="space-y-3">
          <RankItem
            rank="3"
            title="Imagem 3 — wordmark limpo + app icon 'k'"
            verdict="wordmark salva, ícone fraco"
            reason="Wordmark de cima é o que você já tem (bom). App icon 'k' sozinho compete com Kindle, Klarna, Kayak, Keep — letras solitárias são esquecíveis."
            color="#D97706"
          />
          <RankItem
            rank="4"
            title="Imagem 4 — ponto flutuante + nó no k"
            verdict="conceito OK, execução machuca"
            reason="O pontinho acima do 'i' sugere ping sutilmente — boa ideia. Mas a alteração do 'k' (curva no lugar da diagonal) reduz legibilidade em tamanhos pequenos."
            color="#D97706"
          />
          <RankItem
            rank="5"
            title="Imagem 1 — nó visível entre n e k"
            verdict="literal demais"
            reason="Mesmo conceito da 4 mas mais pesado. Em favicon vira ruído indistinguível. O 'k' deformado é o que mais dói."
            color="#DC2626"
          />
          <RankItem
            rank="6"
            title="Imagem 2 — i-dot virou martelo"
            verdict="descarta"
            reason="O elemento sobre o 'i' parece um martelo angulado. Não comunica internet, rede, velocidade ou medição. Lê como bug visual."
            color="#DC2626"
          />
        </div>

        <div className="mt-6 p-4 rounded-xl bg-white border border-[#E8E6E0]">
          <div className="serif italic text-lg text-[#0F0F14] leading-snug">
            O wordmark original (sem nó, sem martelo, sem ponto extra) é melhor que todos os 4. Mantenha ele.
          </div>
          <p className="text-xs text-[#6B6B6B] mt-3">
            Linear, Stripe, Vercel, Notion, Cloudflare — wordmarks limpos sem metáfora dentro das letras. O significado vem do produto ao longo do tempo, não da modificação tipográfica.
          </p>
        </div>
      </section>

      {/* SOBRE O NOME */}
      <section className="px-6 py-8 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <div className="mono text-xs text-[#6B6B6B] tracking-wider mb-4">02 · SOBRE O NOME "LINKA"</div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#E8E6E0]">
            <div className="mono text-[10px] uppercase tracking-wider text-[#16A34A] mb-2">Funciona</div>
            <ul className="text-sm space-y-1.5 text-[#3A3A3A]">
              <li>· Curto, fácil de digitar e falar</li>
              <li>· Lowercase moderno</li>
              <li>· Conecta com "link" sem ser óbvio</li>
              <li>· Som brasileiro (-ka)</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#E8E6E0]">
            <div className="mono text-[10px] uppercase tracking-wider text-[#D97706] mb-2">Limitações</div>
            <ul className="text-sm space-y-1.5 text-[#3A3A3A]">
              <li>· Não comunica categoria — exige qualifier ("linka SpeedTest")</li>
              <li>· Existe marca "Linka Locks" — verifique INPI</li>
              <li>· .com tomado, mas .app, .com.br provavelmente livres</li>
            </ul>
          </div>
        </div>

        <p className="serif italic text-xl text-[#3A3A3A] mt-6 leading-snug">
          Veredito: não troque. Custo de renomear &gt; ganho. Investe no produto.
        </p>
      </section>

      {/* APP ICON PROPOSALS */}
      <section className="px-6 py-8 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <div className="mono text-xs text-[#6B6B6B] tracking-wider mb-4">03 · PROPOSTAS DE APP ICON</div>

        <p className="text-sm text-[#3A3A3A] leading-relaxed mb-6">
          Wordmark fica intacto pro header. Ícone resolve o problema dos espaços pequenos — favicon (16px), Android (192px), App Store (1024px). Três direções, todas com personalidade própria sem cair em "letra solta":
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 mono text-xs">
          <IconTab id="arc" current={iconChoice} setCurrent={setIconChoice}>ARCO</IconTab>
          <IconTab id="pulse" current={iconChoice} setCurrent={setIconChoice}>PULSO</IconTab>
          <IconTab id="node" current={iconChoice} setCurrent={setIconChoice}>NÓ</IconTab>
        </div>

        {/* Icon showcase */}
        {iconChoice === 'arc' && (
          <IconShowcase
            name="Arco"
            concept="Velocidade & medição"
            reasoning="Arco simples sugere movimento, aceleração, ponteiro de velocímetro abstraído. O ponto na ponta marca 'pico medido'. Funciona como animação de loading durante o teste — o arco se completa."
            renderIcon={(size) => <ArcIcon size={size} />}
            wordmarkBeside
          />
        )}

        {iconChoice === 'pulse' && (
          <IconShowcase
            name="Pulso"
            concept="Sinal & ping"
            reasoning="Três arcos concêntricos como pulso/onda. Comunica sinal, conexão, medição contínua. Risco: WiFi e signal bars usam metáfora parecida — diferenciação vem do estilo (não bars, é arco fluido)."
            renderIcon={(size) => <PulseIcon size={size} />}
            wordmarkBeside
          />
        )}

        {iconChoice === 'node' && (
          <IconShowcase
            name="Nó"
            concept="Rede & conexão"
            reasoning="Dois pontos conectados por uma linha. Topologia de rede minimalista. Mais abstrato que os outros dois — menos óbvio na categoria, mais distintivo. Risco: pode ser interpretado como app de transporte/rotas."
            renderIcon={(size) => <NodeIcon size={size} />}
            wordmarkBeside
          />
        )}

        {/* Tamanhos reais */}
        <div className="mt-8">
          <div className="mono text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-3">Teste em tamanhos reais</div>
          <div className="flex items-end gap-6 p-6 bg-white rounded-xl border border-[#E8E6E0]">
            {iconChoice === 'arc' && <>
              <div className="flex flex-col items-center gap-2">
                <ArcIcon size={16} />
                <span className="mono text-[9px] text-[#6B6B6B]">16px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ArcIcon size={32} />
                <span className="mono text-[9px] text-[#6B6B6B]">32px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ArcIcon size={64} />
                <span className="mono text-[9px] text-[#6B6B6B]">64px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ArcIcon size={120} />
                <span className="mono text-[9px] text-[#6B6B6B]">120px</span>
              </div>
            </>}
            {iconChoice === 'pulse' && <>
              <div className="flex flex-col items-center gap-2">
                <PulseIcon size={16} />
                <span className="mono text-[9px] text-[#6B6B6B]">16px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PulseIcon size={32} />
                <span className="mono text-[9px] text-[#6B6B6B]">32px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PulseIcon size={64} />
                <span className="mono text-[9px] text-[#6B6B6B]">64px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PulseIcon size={120} />
                <span className="mono text-[9px] text-[#6B6B6B]">120px</span>
              </div>
            </>}
            {iconChoice === 'node' && <>
              <div className="flex flex-col items-center gap-2">
                <NodeIcon size={16} />
                <span className="mono text-[9px] text-[#6B6B6B]">16px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <NodeIcon size={32} />
                <span className="mono text-[9px] text-[#6B6B6B]">32px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <NodeIcon size={64} />
                <span className="mono text-[9px] text-[#6B6B6B]">64px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <NodeIcon size={120} />
                <span className="mono text-[9px] text-[#6B6B6B]">120px</span>
              </div>
            </>}
          </div>
          <p className="text-xs text-[#6B6B6B] mt-3 leading-relaxed">
            Critério crítico: <strong className="text-[#0F0F14]">se some/borra a 16px, descarta.</strong> Esse é o teste que reprova o "k" solitário e qualquer wordmark miniaturizado.
          </p>
        </div>

        {/* Recomendação */}
        <div className="mt-8 p-4 rounded-xl border" style={{ background: '#F5F0FF', borderColor: '#D4C4FF' }}>
          <div className="mono text-[10px] uppercase tracking-wider mb-2" style={{ color: '#5B3FE8' }}>Minha recomendação</div>
          <p className="serif italic text-lg leading-snug text-[#0F0F14]">
            Vai de Arco. Comunica velocidade/medição diretamente, sobrevive em 16px, e tem bonus track: serve como animação de loading durante o teste — o arco se completa enquanto mede.
          </p>
        </div>
      </section>

      {/* WORDMARK + ICON JUNTOS */}
      <section className="px-6 py-8 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <div className="mono text-xs text-[#6B6B6B] tracking-wider mb-4">04 · WORDMARK + ICON JUNTOS</div>

        <p className="text-sm text-[#3A3A3A] leading-relaxed mb-6">
          Wordmark vai onde tem espaço (header do app, web, PDF, materiais). Icon vai onde não tem (favicon, app launcher, share preview, OG image, push notification).
        </p>

        <div className="space-y-4">
          <ContextExample label="Header do app (web/PWA)" bg="#FFFFFF">
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="text-2xl font-bold" style={{ color: '#5B3FE8' }}>linka</span>
            </div>
          </ContextExample>

          <ContextExample label="Favicon (browser tab)" bg="#E5E5EA">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-t-lg max-w-[200px]">
              {iconChoice === 'arc' && <ArcIcon size={14} />}
              {iconChoice === 'pulse' && <PulseIcon size={14} />}
              {iconChoice === 'node' && <NodeIcon size={14} />}
              <span className="text-xs text-[#0F0F14] truncate">linka — Speed Test</span>
            </div>
          </ContextExample>

          <ContextExample label="App launcher (Android/iOS)" bg="#1A1A22">
            <div className="flex items-center justify-center py-6">
              <div className="flex flex-col items-center gap-1">
                {iconChoice === 'arc' && <ArcIcon size={56} />}
                {iconChoice === 'pulse' && <PulseIcon size={56} />}
                {iconChoice === 'node' && <NodeIcon size={56} />}
                <span className="text-[11px] text-white">linka</span>
              </div>
            </div>
          </ContextExample>

          <ContextExample label="OG image / share preview" bg="#FFFFFF">
            <div className="flex items-center gap-4 p-5">
              {iconChoice === 'arc' && <ArcIcon size={48} />}
              {iconChoice === 'pulse' && <PulseIcon size={48} />}
              {iconChoice === 'node' && <NodeIcon size={48} />}
              <div>
                <div className="text-base font-semibold">linka SpeedTest</div>
                <div className="text-xs text-[#6B6B6B]">Sua internet, com diagnóstico de verdade.</div>
              </div>
            </div>
          </ContextExample>
        </div>
      </section>

      <footer className="px-6 py-12 max-w-3xl mx-auto border-t border-[#E8E6E0]">
        <p className="serif italic text-lg text-[#3A3A3A] leading-snug">
          Resumo: wordmark original fica. Esquece os 4 que você fez. Adiciona um app icon de verdade pros lugares apertados — minha aposta é o Arco.
        </p>
        <p className="text-xs text-[#6B6B6B] mono mt-6">linka logo eval · 2026</p>
      </footer>
    </div>
  );
}

/* ============ COMPONENTS ============ */

function RankItem({ rank, title, verdict, reason, color }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-white border border-[#E8E6E0]">
      <div className="mono text-3xl font-medium shrink-0 leading-none" style={{ color }}>#{rank}</div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-[#0F0F14]">{title}</div>
        <div className="serif italic text-sm mb-2" style={{ color }}>{verdict}</div>
        <p className="text-xs text-[#6B6B6B] leading-relaxed">{reason}</p>
      </div>
    </div>
  );
}

function IconTab({ id, current, setCurrent, children }) {
  const active = current === id;
  return (
    <button
      onClick={() => setCurrent(id)}
      className={`px-4 py-2 rounded-full transition-colors ${
        active ? 'text-white' : 'bg-white border border-[#E8E6E0] text-[#6B6B6B]'
      }`}
      style={active ? { background: '#5B3FE8' } : {}}
    >
      {children}
    </button>
  );
}

function IconShowcase({ name, concept, reasoning, renderIcon, wordmarkBeside }) {
  return (
    <div className="p-6 rounded-xl bg-white border border-[#E8E6E0]">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="shrink-0">{renderIcon(140)}</div>
        <div className="flex-1">
          <div className="mono text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1">{concept}</div>
          <div className="text-2xl font-medium mb-2">{name}</div>
          <p className="text-sm text-[#3A3A3A] leading-relaxed">{reasoning}</p>
        </div>
      </div>
      {wordmarkBeside && (
        <div className="mt-6 pt-6 border-t border-[#E8E6E0]">
          <div className="mono text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-3">Lock-up: ícone + wordmark</div>
          <div className="flex items-center gap-3">
            {renderIcon(48)}
            <span className="text-3xl font-bold" style={{ color: '#5B3FE8' }}>linka</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ContextExample({ label, bg, children }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-2">{label}</div>
      <div className="rounded-xl overflow-hidden border border-[#E8E6E0]" style={{ background: bg }}>
        {children}
      </div>
    </div>
  );
}

/* ============ ICON SVGS ============ */

function IconFrame({ size, children }) {
  // Squircle iOS-style border-radius — ~22.5% of size
  const radius = size * 0.225;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: 'block' }}
    >
      <rect width="100" height="100" rx={(radius / size) * 100} fill="#5B3FE8" />
      {children}
    </svg>
  );
}

function ArcIcon({ size }) {
  // Arco que sobe da esquerda-baixo até a direita-cima, com ponto na ponta
  // Sugere velocímetro/aceleração
  return (
    <IconFrame size={size}>
      <path
        d="M 25 70 A 35 35 0 0 1 75 35"
        fill="none"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="75" cy="35" r="6" fill="white" />
    </IconFrame>
  );
}

function PulseIcon({ size }) {
  // Três arcos concêntricos saindo de um ponto no canto inferior esquerdo
  // Sugere sinal/onda/wifi mas em estilo fluido (não bars)
  return (
    <IconFrame size={size}>
      <circle cx="32" cy="68" r="5" fill="white" />
      <path
        d="M 32 50 A 18 18 0 0 1 50 68"
        fill="none"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 32 36 A 32 32 0 0 1 64 68"
        fill="none"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 32 22 A 46 46 0 0 1 78 68"
        fill="none"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </IconFrame>
  );
}

function NodeIcon({ size }) {
  // Dois nós conectados por linha — topologia de rede minimal
  return (
    <IconFrame size={size}>
      <line
        x1="32" y1="68"
        x2="68" y2="32"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="32" cy="68" r="11" fill="white" />
      <circle cx="68" cy="32" r="11" fill="white" />
      <circle cx="32" cy="68" r="5" fill="#5B3FE8" />
    </IconFrame>
  );
}
