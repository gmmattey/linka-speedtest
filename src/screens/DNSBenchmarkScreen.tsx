import { useCallback, useRef, useState } from 'react';
import { Icon } from '../components/icons';
import { IOSList } from '../components/IOSList';
import { runDNSBenchmark, loadLastDnsResult } from '../utils/dnsBenchmark';
import type { DnsBenchmarkResult } from '../utils/dnsBenchmark';
import './DNSBenchmarkScreen.css';

interface Props {
  onBack: () => void;
  onShowDNSGuide?: (serverId: string) => void;
}

type Phase = 'idle' | 'running' | 'done' | 'error';

function gradeColor(grade: string): string {
  if (grade === 'A') return 'var(--ul)';
  if (grade === 'B') return 'var(--ul)';
  if (grade === 'C') return 'var(--warn)';
  return 'var(--error)';
}

function gradeLabel(grade: string): string {
  if (grade === 'A') return 'Excelente';
  if (grade === 'B') return 'Bom';
  if (grade === 'C') return 'Aceitável';
  return 'Lento';
}

export function DNSBenchmarkScreen({ onBack, onShowDNSGuide }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState<{ done: number; total: number; current: string }>({ done: 0, total: 5, current: '' });
  const [result, setResult] = useState<DnsBenchmarkResult | null>(() => loadLastDnsResult());
  const ctrlRef = useRef<AbortController | null>(null);

  const handleStart = useCallback(async () => {
    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setPhase('running');
    setProgress({ done: 0, total: 5, current: '' });

    try {
      const res = await runDNSBenchmark(ctrl.signal, (done, total, current) => {
        setProgress({ done, total, current });
      });
      setResult(res);
      setPhase('done');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setPhase('idle');
      } else {
        setPhase('error');
      }
    }
  }, []);

  const handleCancel = useCallback(() => {
    if (ctrlRef.current) ctrlRef.current.abort();
    setPhase('idle');
  }, []);

  const winner = result?.winner;
  const servers = result?.servers ?? [];

  return (
    <div className="lk-dns">
      <div className="lk-dns__head">
        <button className="lk-dns__back" onClick={onBack} aria-label="Voltar">
          ‹ Resultado
        </button>
        <span className="lk-dns__title">DNS</span>
        <span />
      </div>

      <div className="lk-dns__scroll">
        <p className="lk-dns__intro">
          Verifica qual servidor DNS responde mais rápido na sua rede atual.
        </p>

        {phase === 'running' && (
          <div className="lk-dns__progress">
            <div className="lk-dns__progress-bar">
              <div
                className="lk-dns__progress-fill"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
            <p className="lk-dns__progress-label">
              {progress.current ? `Testando ${progress.current}…` : 'Iniciando…'}
            </p>
            <button className="btn-text" onClick={handleCancel}>Cancelar</button>
          </div>
        )}

        {phase !== 'running' && (
          <div className="lk-dns__action">
            <button className="btn-primary" onClick={handleStart}>
              {result ? 'Testar novamente' : 'Iniciar verificação'}
            </button>
          </div>
        )}

        {phase === 'error' && (
          <p className="lk-dns__error">Falha ao testar os servidores. Verifique sua conexão e tente novamente.</p>
        )}

        {result && winner && (
          <>
            <div className="lk-dns__section-label">Resultado</div>
            <IOSList
              items={[
                {
                  icon: <Icon name="bolt" size={14} color={gradeColor(winner.grade)} />,
                  iconBg: 'var(--surface-3)',
                  title: winner.name,
                  subtitle: `Mais rápido · ${winner.ip}`,
                  trailing: (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: gradeColor(winner.grade), fontWeight: 700, fontSize: 15 }}>
                        {Math.round(winner.p50)} ms
                      </div>
                      <div style={{ fontSize: 10, color: gradeColor(winner.grade) }}>
                        {gradeLabel(winner.grade)}
                      </div>
                    </div>
                  ),
                },
                ...servers
                  .filter(s => s.id !== winner.id && s.samples > 0)
                  .sort((a, b) => a.p50 - b.p50)
                  .map(s => ({
                    icon: <Icon name="ping" size={14} color="var(--text-3)" />,
                    iconBg: 'var(--surface-3)',
                    title: s.name,
                    subtitle: s.ip,
                    trailing: (
                      <span style={{ color: 'var(--text-2)', fontSize: 13 }}>
                        {Math.round(s.p50)} ms
                      </span>
                    ),
                  })),
                ...(onShowDNSGuide ? [{
                  icon: <Icon name="cog" size={14} color="#fff" />,
                  iconBg: 'var(--accent)',
                  title: 'Como trocar o DNS',
                  subtitle: `Usar ${winner.name} no seu dispositivo`,
                  showChevron: true,
                  onClick: () => onShowDNSGuide(winner.id),
                }] : []),
              ]}
            />
            <p className="lk-dns__rec">
              {Math.round(winner.p50) < 50
                ? `${winner.name} é o mais rápido na sua rede — mantenha o atual.`
                : `Considere usar ${winner.name} para reduzir o tempo de resolução DNS.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
