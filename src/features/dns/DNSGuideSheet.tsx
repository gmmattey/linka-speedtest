import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../../components/icons';
import { DraggableSheet } from '../../components/DraggableSheet';
import type { SpeedTestResult } from '../../types';
import {
  chooseDnsRecommendation,
  loadLastDnsResult,
  runDNSBenchmark,
  type DnsBenchmarkResult,
} from '../../utils/dnsBenchmark';
import './DNSGuideSheet.css';

type Platform = 'ios' | 'android' | 'router';

interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * Resultado do speedtest atual — usado para mostrar provedor DNS e
   * latência atual no hero "Recomendação". Quando ausente, o hero cai
   * pra um modo neutro (sem comparação).
   */
  result?: SpeedTestResult;
  /**
   * Benchmark DNS já executado externamente (parâmetro legado do tempo
   * em que o accordion DNS da ResultScreen disparava o teste). Quando
   * ausente — o caso padrão hoje — o sheet roda seu próprio benchmark ao
   * abrir, usando como seed o último resultado salvo (`loadLastDnsResult`).
   */
  benchmark?: DnsBenchmarkResult | null;
  /** Compatibilidade com chamada legada — nunca foi usado em produção. */
  serverId?: string;
}

interface ServerStatic {
  id: string;
  name: string;
  primary: string;
  secondary: string;
}

const SERVERS: Record<string, ServerStatic> = {
  cloudflare: { id: 'cloudflare', name: 'Cloudflare', primary: '1.1.1.1',        secondary: '1.0.0.1' },
  google:     { id: 'google',     name: 'Google',     primary: '8.8.8.8',        secondary: '8.8.4.4' },
  quad9:      { id: 'quad9',      name: 'Quad9',      primary: '9.9.9.9',        secondary: '149.112.112.112' },
  opendns:    { id: 'opendns',    name: 'OpenDNS',    primary: '208.67.222.222', secondary: '208.67.220.220' },
  adguard:    { id: 'adguard',    name: 'AdGuard',    primary: '94.140.14.14',   secondary: '94.140.15.15' },
};

const PLATFORM_LABELS: Record<Platform, string> = {
  ios:     'iPhone',
  android: 'Android',
  router:  'Roteador',
};

/**
 * Auto-detecção de plataforma. Lê navigator.userAgent porque o projeto
 * não importa `@capacitor/core` aqui — `navigator.userAgent` é estável
 * dentro do Capacitor e do navegador. Fallback para Android (mais comum
 * no PWA brasileiro).
 */
function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'android';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'android';
}

function getSteps(platform: Platform, primary: string, secondary: string): string[] {
  switch (platform) {
    case 'ios':
      return [
        'Abra Ajustes → Wi-Fi.',
        'Toque em ⓘ ao lado da rede conectada.',
        'Em DNS, escolha "Configurar DNS → Manual".',
        `Adicione ${primary} e ${secondary}, depois toque em Salvar.`,
      ];
    case 'android':
      return [
        'Abra Configurações → Rede e internet → DNS privado.',
        'Selecione "Hostname do provedor DNS privado".',
        'Use o hostname DoT do servidor (ex.: 1dot1dot1dot1.cloudflare-dns.com).',
        `Alternativa: em Wi-Fi → rede → Avançado → IP estático, defina ${primary} e ${secondary}.`,
      ];
    case 'router':
      return [
        'Acesse o painel do roteador (geralmente 192.168.0.1 ou 192.168.1.1).',
        'Faça login (admin / admin costuma ser o padrão).',
        'Procure WAN → DNS, ou Configurações avançadas → DNS.',
        `Defina DNS primário ${primary} e secundário ${secondary}, depois salve.`,
      ];
  }
}

interface ToastMessage {
  text: string;
  variant: 'info' | 'error';
}

/**
 * DNSGuideSheet — refator "premium" 2026-05.
 *
 * Estrutura visual: hero recomendação (atual → recomendado) + pills com
 * outros 3 servidores + tabs por plataforma + steps numerados + CTA
 * pareado ("Copiar IPs" + "Fechar").
 *
 * Substitui a antiga DNSGuideScreen (rota dedicada). Acionado pelo botão
 * "Como alterar" do accordion DNS na ResultScreen.
 */
export function DNSGuideSheet({ open, onClose, result, benchmark }: Props) {
  const [platform, setPlatform] = useState<Platform>(() => detectPlatform());
  const [internalBench, setInternalBench] = useState<DnsBenchmarkResult | null>(
    () => benchmark ?? null,
  );
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const startedRef = useRef(false);

  // Mantém em sync com o benchmark vindo do pai — quando termina lá, espelha aqui.
  useEffect(() => {
    if (benchmark) setInternalBench(benchmark);
  }, [benchmark]);

  // Body scroll lock + Esc são tratados pelo DraggableSheet — não duplicamos
  // aqui (refator 2026-05).

  // Quando abre sem benchmark do pai, roda um próprio. Usa loadLastDnsResult
  // como seed pra mostrar dados imediatos enquanto o refresh roda em background.
  // Deps mínimas: [open]. O gate via `startedRef` impede re-disparo. Se
  // colocássemos `internalBench` nas deps, o setState do seed reentraria
  // o effect, abortaria o ctrl novo e o benchmark nunca terminaria.
  useEffect(() => {
    if (!open) return;
    if (startedRef.current) return;
    if (benchmark) return;
    startedRef.current = true;

    const seed = loadLastDnsResult();
    if (seed) setInternalBench(seed);

    const ctrl = new AbortController();
    setRunning(true);
    runDNSBenchmark(ctrl.signal)
      .then((r) => setInternalBench(r))
      .catch(() => { /* ignora — seed continua válido */ })
      .finally(() => setRunning(false));

    return () => {
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const effectiveBench = benchmark ?? internalBench;

  const sortedServers = useMemo(() => {
    if (!effectiveBench) return [];
    return [...effectiveBench.servers]
      .filter((s) => s.samples > 0)
      .sort((a, b) => a.p50 - b.p50);
  }, [effectiveBench]);

  const fastest = sortedServers[0] ?? null;
  const currentLatencyMs = result?.dnsLatencyMs ?? null;

  // Recomendação inteligente: compara DNS atual contra o mais rápido do
  // benchmark e decide se vale a pena trocar (≥ 20ms E ≥ 30% de ganho).
  // Estados: 'switch' (vale trocar), 'already_good' (já está bom),
  // 'no_data' (faltam dados).
  const recommendation = useMemo(
    () => chooseDnsRecommendation(currentLatencyMs, sortedServers),
    [currentLatencyMs, sortedServers],
  );

  // Servidor selecionado para os steps. Preferimos o "fastest" do bench
  // mesmo no estado already_good — quem decide trocar mesmo assim ainda
  // precisa dos IPs. Sem bench, cai pro Cloudflare.
  const selectedServerStatic = useMemo(() => {
    if (fastest) {
      return SERVERS[fastest.id] ?? SERVERS.cloudflare;
    }
    return SERVERS.cloudflare;
  }, [fastest]);

  const steps = useMemo(
    () => getSteps(platform, selectedServerStatic.primary, selectedServerStatic.secondary),
    [platform, selectedServerStatic.primary, selectedServerStatic.secondary],
  );

  // Pills: outros servidores além do destacado no hero. No estado
  // 'switch' o destaque é o `fastest`; em 'already_good' não há destaque
  // (mostramos todos os medidos ordenados por latência). Limita a 3.
  const pills = useMemo(() => {
    if (recommendation.type === 'switch') {
      return sortedServers.filter((s) => s.id !== fastest?.id).slice(0, 3);
    }
    return sortedServers.slice(0, 3);
  }, [sortedServers, fastest?.id, recommendation.type]);

  const handleCopyIps = async () => {
    const text = `${selectedServerStatic.primary}, ${selectedServerStatic.secondary}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback raro (iOS standalone antigo) — cria input temporário.
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setToast({ text: 'IPs copiados', variant: 'info' });
    } catch {
      setToast({ text: 'Não foi possível copiar', variant: 'error' });
    }
    window.setTimeout(() => setToast(null), 1800);
  };

  const currentSeverity = currentLatencyMs != null
    ? (currentLatencyMs >= 100 ? 'error' : currentLatencyMs >= 50 ? 'warn' : 'good')
    : 'neutral';

  // Bug-2 fix (2026-05): nome a exibir para o "Seu DNS".
  // Provider conhecido > IP cru (resolver detectado mas não mapeado) >
  // "Não identificado" (probe falhou). NUNCA "Detectando…" — quando o
  // sheet abre, o speedtest já terminou: a probe foi rodada (ou falhou)
  // mas não está mais em curso. O benchmark dos DoH alternativos é
  // independente do estado de detecção do resolver atual.
  const currentDnsLabel =
    result?.dnsProvider
    ?? result?.dnsResolverIp
    ?? 'Não identificado';

  // CTA primário: estado-dependente. 'switch' / 'no_data' → "Copiar IPs".
  // 'already_good' → "Fechar" (sem incentivar troca desnecessária).
  const primaryCtaIsCopy = recommendation.type !== 'already_good';

  return (
    <DraggableSheet open={open} onClose={onClose} ariaLabel="Configurar Serviços de Internet (DNS)">
      <div className="lk-dns-sheet__inner">
        <header className="lk-dns-sheet__header">
          <div className="lk-dns-sheet__title-row">
            <h2 className="lk-dns-sheet__title">Configurar Serviços de Internet</h2>
            <button
              type="button"
              className="lk-dns-sheet__close"
              onClick={onClose}
              aria-label="Fechar"
            >
              <Icon name="close" size={16} color="var(--text-2)" />
            </button>
          </div>
        </header>

        <div className="lk-dns-sheet__content">
          {/* 1. Hero Recomendação — 3 estados ─────────────────────────
              switch       → atual + seta + recomendado + chip "−Xms"
              already_good → card único centralizado (DNS atual ok)
              no_data      → mantém layout switch com "—" do lado dir.

              Lógica em `chooseDnsRecommendation` (utils/dnsBenchmark.ts):
              só recomenda trocar se ganho ≥ 20ms E ≥ 30%. */}
          {recommendation.type === 'already_good' ? (
            <section
              className="lk-dns-sheet__hero lk-dns-sheet__hero--already-good"
              aria-label="Serviços de Internet (DNS) atual"
            >
              <div className="lk-dns-sheet__hero-good-icon" aria-hidden="true">
                <Icon name="check-circle" size={36} color="var(--success)" />
              </div>
              <p className="lk-dns-sheet__hero-good-title">Seus Serviços de Internet (DNS) estão excelentes</p>
              <p className="lk-dns-sheet__hero-good-sub">
                <span className="lk-dns-sheet__hero-good-name">{currentDnsLabel}</span>
                <span className="lk-dns-sheet__hero-good-dot">·</span>
                <span className="lk-dns-sheet__hero-good-latency">
                  {currentLatencyMs != null ? Math.round(currentLatencyMs) : '—'} ms
                </span>
                <span className="lk-dns-sheet__hero-good-tail"> — sem necessidade de trocar</span>
              </p>
            </section>
          ) : (
            <section className="lk-dns-sheet__hero" aria-label="Recomendação">
              <div className={`lk-dns-sheet__hero-side lk-dns-sheet__hero-side--current lk-dns-sheet__hero-side--${currentSeverity}`}>
                <p className="lk-dns-sheet__hero-kicker">Seu Provedor (DNS)</p>
                <p className="lk-dns-sheet__hero-name">{currentDnsLabel}</p>
                <p className="lk-dns-sheet__hero-latency">
                  {currentLatencyMs != null ? `${Math.round(currentLatencyMs)}` : '—'}
                  <span className="lk-dns-sheet__hero-latency-unit">ms</span>
                </p>
              </div>

              <div className="lk-dns-sheet__hero-arrow" aria-hidden="true">
                <Icon name="chevron" size={18} color="var(--text-3)" />
              </div>

              <div className="lk-dns-sheet__hero-side lk-dns-sheet__hero-side--recommended">
                <p className="lk-dns-sheet__hero-kicker">Recomendado</p>
                <p className="lk-dns-sheet__hero-name">
                  {recommendation.type === 'switch'
                    ? recommendation.target.name
                    : (running ? 'Medindo…' : '—')}
                </p>
                <p className="lk-dns-sheet__hero-latency lk-dns-sheet__hero-latency--good">
                  {recommendation.type === 'switch'
                    ? `${Math.round(recommendation.target.p50)}`
                    : '—'}
                  <span className="lk-dns-sheet__hero-latency-unit">ms</span>
                </p>
                {recommendation.type === 'switch' && (
                  <span className="lk-dns-sheet__hero-delta">
                    −{Math.round(recommendation.deltaMs)} ms · −{Math.round(recommendation.deltaPct)}%
                  </span>
                )}
              </div>
            </section>
          )}

          {/* 2. Pills com outros servidores ──────────────────────────── */}
          {pills.length > 0 && (
            <section className="lk-dns-sheet__pills" aria-label="Outros servidores">
              {pills.map((p) => (
                <span key={p.id} className="lk-dns-sheet__pill">
                  <span className="lk-dns-sheet__pill-name">{p.name}</span>
                  <span className="lk-dns-sheet__pill-dot">·</span>
                  <span className="lk-dns-sheet__pill-latency">{Math.round(p.p50)} ms</span>
                </span>
              ))}
            </section>
          )}

          {/* 3. Tabs por plataforma ─────────────────────────────────── */}
          <div className="lk-dns-sheet__tabs" role="tablist" aria-label="Plataforma">
            {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => {
              const active = platform === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`lk-dns-sheet__tab${active ? ' lk-dns-sheet__tab--active' : ''}`}
                  onClick={() => setPlatform(p)}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              );
            })}
          </div>

          {/* 4. Steps ───────────────────────────────────────────────── */}
          <ol className="lk-dns-sheet__steps">
            {steps.map((step, i) => (
              <li key={i} className="lk-dns-sheet__step">
                <span className="lk-dns-sheet__step-num">{i + 1}</span>
                <span className="lk-dns-sheet__step-text">{step}</span>
              </li>
            ))}
          </ol>

          {/* IPs em destaque para conferência manual quando o usuário não copia. */}
          <p className="lk-dns-sheet__ips-line">
            <span className="lk-dns-sheet__ips-label">IPs ({selectedServerStatic.name}):</span>{' '}
            <span className="lk-dns-sheet__ips-value">
              {selectedServerStatic.primary} · {selectedServerStatic.secondary}
            </span>
          </p>
        </div>

        {/* 5. Footer fixo (CTA estado-dependente) ───────────────────────
            'switch' / 'no_data' → "Copiar IPs" + "Fechar".
            'already_good'       → só "Fechar" (sem incentivar troca). */}
        <div className="lk-dns-sheet__footer">
          {toast && (
            <div className={`lk-dns-sheet__toast lk-dns-sheet__toast--${toast.variant}`} role="status">
              {toast.text}
            </div>
          )}
          {primaryCtaIsCopy ? (
            <>
              <button
                type="button"
                className="lk-dns-sheet__cta-primary"
                onClick={handleCopyIps}
              >
                Copiar IPs
              </button>
              <button
                type="button"
                className="lk-dns-sheet__cta-secondary"
                onClick={onClose}
              >
                Fechar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="lk-dns-sheet__cta-primary"
              onClick={onClose}
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </DraggableSheet>
  );
}

