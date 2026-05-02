import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IOSList } from '../components/IOSList';
import { Icon } from '../components/icons';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { generateShareCard } from '../utils/shareCard';
import { buildShareText, shareResultText } from '../utils/share';
import type { ServerInfo, SpeedTestResult, TestRecord } from '../types';
import { interpretSpeedTestResult } from '../core';

import type { UseCaseId } from '../core';
import { loadHistory } from '../utils/history';
import { formatMbps, formatMs } from '../utils/format';
import type { ConnectionType, GamingProfile } from '../types';
import './ResultScreen.css';
import { combineDiagnostics } from '../utils/combinedDiagnosis';
import { toConnectionProfile } from '../utils/connectionProfile';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  result: SpeedTestResult;
  server: ServerInfo | null;
  previous: TestRecord | null;
  onRetry: () => void;
  onShowHistory: () => void;
  onDiagnostic?: () => void;
  onRecommend?: () => void;
  onDetails?: () => void;
  onExplore?: () => void;
  onStartRoomTest?: () => void;
  unit?: 'mbps' | 'gbps';
  hideIpOnShare?: boolean;
  gamingProfile?: GamingProfile;
  connectionType?: ConnectionType | null;
  contractedDown?: number | null;
  contractedUp?: number | null;
  onUpdateContracted?: (down: number | null, up: number | null) => void;
}

type ShareStatus = 'idle' | 'copied';

type GradeTier = 'a' | 'b' | 'c' | 'd' | 'f';

function dlGrade(dl: number): GradeTier {
  if (dl >= 100) return 'a';
  if (dl >= 25)  return 'b';
  if (dl >= 10)  return 'c';
  if (dl >= 5)   return 'd';
  return 'f';
}

function ulGrade(ul: number): GradeTier {
  if (ul >= 30) return 'a';
  if (ul >= 10) return 'b';
  if (ul >= 5)  return 'c';
  if (ul >= 1)  return 'd';
  return 'f';
}

function latGrade(ms: number): GradeTier {
  if (ms <= 30)  return 'a';
  if (ms <= 60)  return 'b';
  if (ms <= 100) return 'c';
  if (ms <= 200) return 'd';
  return 'f';
}

function jitterGrade(ms: number): GradeTier {
  if (ms <= 5)  return 'a';
  if (ms <= 15) return 'b';
  if (ms <= 30) return 'c';
  if (ms <= 50) return 'd';
  return 'f';
}

function gradeLabel(g: GradeTier): string {
  const map: Record<GradeTier, string> = { a: 'Excelente', b: 'Bom', c: 'Regular', d: 'Ruim', f: 'Crítico' };
  return map[g];
}

function gradeStyle(g: GradeTier): { background: string; color: string } {
  const bg = (g === 'a' || g === 'b') ? 'var(--color-good-bg)'
           : g === 'c' ? 'var(--color-warn-bg)'
           : 'var(--color-bad-bg)';
  return { background: bg, color: `var(--grade-${g})` };
}

function ucIcon(id: UseCaseId): string {
  if (id === 'gaming')       return 'game';
  if (id === 'streaming_4k') return 'stream';
  if (id === 'home_office')  return 'work';
  return 'videoCall';
}

function ucIconBg(status: string): string {
  if (status === 'good')  return 'var(--ul-tint)';
  if (status === 'maybe') return 'var(--color-warn-bg)';
  return 'var(--color-bad-bg)';
}

function ucIconColor(status: string): string {
  if (status === 'good')  return 'var(--ul)';
  if (status === 'maybe') return 'var(--warn)';
  return 'var(--error)';
}

function ucLabel(id: UseCaseId): string {
  if (id === 'gaming')       return 'Jogos';
  if (id === 'streaming_4k') return '4K';
  if (id === 'home_office')  return 'Office';
  return 'Vídeo';
}

function ucChipLabel(status: string): string {
  if (status === 'good')  return 'Bom';
  if (status === 'maybe') return 'Atenção';
  return 'Ruim';
}

export function ResultScreen({
  theme, onToggleTheme,
  result,
  onRetry, onShowHistory,
  onDiagnostic, onRecommend, onDetails, onExplore,
  unit = 'mbps',
  connectionType, contractedDown = null, contractedUp = null, onUpdateContracted,
}: Props) {
  const history = useMemo(() => loadHistory(), []);
  const interpreted = useMemo(
    () => interpretSpeedTestResult({
      metrics: result,
      profile: toConnectionProfile(connectionType ?? undefined),
      history,
    }),
    [result, connectionType, history],
  );

  const combined = useMemo(
    () =>
      combineDiagnostics({
        speed: result,
        connectionType: connectionType ?? 'unknown',
        wifi: undefined,
        mobile: undefined,
      }),
    [result, connectionType],
  );

  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [waGenerating, setWaGenerating] = useState(false);
  const shareResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (shareResetRef.current) clearTimeout(shareResetRef.current);
  }, []);

  const handleShare = async () => {
    const text = buildShareText(result, interpreted.quality, unit);
    const outcome = await shareResultText(text);
    if (outcome === 'copied') {
      setShareStatus('copied');
      if (shareResetRef.current) clearTimeout(shareResetRef.current);
      shareResetRef.current = setTimeout(() => {
        setShareStatus('idle');
        shareResetRef.current = null;
      }, 2000);
    }
  };

  const handleWhatsApp = async () => {
    if (waGenerating) return;
    setWaGenerating(true);
    try {
      const blob = await generateShareCard(result, interpreted.quality, unit);
      const file = new File([blob], 'linka-speedtest.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'linka SpeedTest' });
      } else {
        const text = buildShareText(result, interpreted.quality, unit);
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      }
    } catch { /* cancelado */ }
    finally { setWaGenerating(false); }
  };

  const handleNativeShare = useCallback(async () => {
    const blob = await generateShareCard(result, interpreted.quality, unit);
    const file = new File([blob], 'linka-speedtest.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'linka SpeedTest' });
    } else {
      const text = buildShareText(result, interpreted.quality, unit);
      await shareResultText(text);
    }
  }, [result, interpreted.quality, unit]);

  return (
    <div className="lk-result fade-in">
      <div className="lk-result__head">
        <button className="lk-result__back" onClick={onShowHistory}>Histórico</button>
        <HamburgerMenu
          theme={theme}
          onToggleTheme={onToggleTheme}
          onShare={handleNativeShare}
          contractedDown={contractedDown}
          contractedUp={contractedUp}
          onUpdateContracted={onUpdateContracted ?? (() => {})}
          showContracted={connectionType !== 'mobile'}
        />
      </div>

      <div className="lk-result__scroll">
        {/* Metric grid 2×2 */}
        <div className="lk-result__metrics-block">
          <div className="lk-result__metric-grid">
            <div className="lk-result__metric-cell">
              <div className="lk-result__metric-lbl">Download</div>
              <div className="lk-result__metric-val--lg" style={{ color: 'var(--dl)' }}>
                {formatMbps(result.dl, unit)}
              </div>
              <span className="lk-result__metric-unit">{unitLabel}</span>
              <div className="lk-result__grade-badge" style={gradeStyle(dlGrade(result.dl))}>
                {dlGrade(result.dl).toUpperCase()} · {gradeLabel(dlGrade(result.dl))}
              </div>
            </div>
            <div className="lk-result__metric-cell">
              <div className="lk-result__metric-lbl">Upload</div>
              <div className="lk-result__metric-val--lg" style={{ color: 'var(--ul)' }}>
                {formatMbps(result.ul, unit)}
              </div>
              <span className="lk-result__metric-unit">{unitLabel}</span>
              <div className="lk-result__grade-badge" style={gradeStyle(ulGrade(result.ul))}>
                {ulGrade(result.ul).toUpperCase()} · {gradeLabel(ulGrade(result.ul))}
              </div>
            </div>
            <div className="lk-result__metric-cell">
              <div className="lk-result__metric-lbl">Resposta</div>
              <div className="lk-result__metric-val--md">
                {formatMs(result.latency)}<span className="lk-result__metric-unit--inline"> ms</span>
              </div>
              <div className="lk-result__grade-badge" style={gradeStyle(latGrade(result.latency))}>
                {latGrade(result.latency).toUpperCase()} · {gradeLabel(latGrade(result.latency))}
              </div>
            </div>
            <div className="lk-result__metric-cell">
              <div className="lk-result__metric-lbl">Oscilação</div>
              <div className="lk-result__metric-val--md">
                {formatMs(result.jitter)}<span className="lk-result__metric-unit--inline"> ms</span>
              </div>
              <div className="lk-result__grade-badge" style={gradeStyle(jitterGrade(result.jitter))}>
                {jitterGrade(result.jitter).toUpperCase()} · {gradeLabel(jitterGrade(result.jitter))}
              </div>
            </div>
          </div>
        </div>

        {/* Use cases row */}
        {interpreted.useCases.length > 0 && (
          <div className="lk-result__use-row">
            {interpreted.useCases.map(({ id, status }) => (
              <div key={id} className="lk-result__use-item">
                <div
                  className="lk-result__use-icon"
                  style={{ background: ucIconBg(status), color: ucIconColor(status) }}
                >
                  <Icon name={ucIcon(id)} size={18} />
                </div>
                <span className="lk-result__use-lbl">{ucLabel(id)}</span>
                <span
                  className="lk-result__use-chip"
                  style={{ background: ucIconBg(status), color: ucIconColor(status) }}
                >
                  {ucChipLabel(status)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Combined Diagnosis */}
        <div className="lk-result__combined">
          <p className="lk-result__combined-kicker">Diagnóstico da conexão</p>
          <p className="lk-result__combined-title">{combined.title}</p>
          <div className="lk-result__combined-action">
            <span>O que fazer agora:</span>
            <strong>{combined.primaryAction}</strong>
          </div>
        </div>

        {/* Explorar */}
        <div className="lk-result__tools">
          <p className="lk-result__tools-label">Explorar</p>
          <IOSList
            items={[
              ...(onDiagnostic ? [{
                icon: <Icon name="shield" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Diagnóstico',
                showChevron: true,
                onClick: onDiagnostic,
              }] : []),
              ...(onRecommend ? [{
                icon: <Icon name="bulb" size={14} color="#fff" />,
                iconBg: 'var(--accent)',
                title: 'Recomendações',
                showChevron: true,
                onClick: onRecommend,
              }] : []),
              ...(onDetails ? [{
                icon: <Icon name="document" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: 'Detalhes',
                showChevron: true,
                onClick: onDetails,
              }] : []),
              ...(onExplore ? [{
                icon: <Icon name="cog" size={14} color="var(--text-2)" />,
                iconBg: 'var(--surface-3)',
                title: 'Ferramentas',
                showChevron: true,
                onClick: onExplore,
              }] : []),
            ]}
          />
        </div>

        <div className="lk-result__footer">
          <button className="btn-primary lk-result__retry" onClick={onRetry}>
            <Icon name="refresh" size={16} />Testar novamente
          </button>
          <div className="lk-result__footer-row">
            <button className="btn-text" onClick={handleWhatsApp} disabled={waGenerating}>
              {waGenerating ? 'Gerando…' : 'WhatsApp'}
            </button>
            <button className="btn-text" onClick={handleShare}>
              {shareStatus === 'copied' ? 'Copiado!' : 'Compartilhar texto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
