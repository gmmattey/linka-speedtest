import type { Classification, Recommendation, SpeedTestResult, TestRecord } from '../types';
import { resolveCopy } from '../core';

// ── Empty-state positivo ────────────────────────────────────────────────────

export interface PositiveUsecase {
  id: string;
  label: string;
  status: 'good' | 'limited';
}

export interface HistorySummary {
  deltaPct: number;   // positivo = acima da média
  count: number;      // total de registros do histórico
}

export const PREVENTIVE_TIPS = [
  {
    title: 'Reinicie o roteador a cada 30 dias',
    desc: 'Libera memória e renova sessões.',
  },
  {
    title: 'Mantenha o firmware atualizado',
    desc: 'Correções e segurança vêm em atualizações da operadora.',
  },
  {
    title: 'Refaça o teste se notar lentidão',
    desc: 'A causa pode aparecer só sob carga ou em horários de pico.',
  },
] as const;

export function derivePositiveUsecases(result: SpeedTestResult | null): PositiveUsecase[] {
  if (!result) return [];
  const { dl, ul, latency, jitter } = result;
  // Labels longos (consistência com o motor `interpret.ts` / dictionary).
  return [
    {
      id: 'streaming',
      label: resolveCopy('useCase.streaming_4k.label'),
      status: dl >= 25 && latency <= 80 ? 'good' : 'limited',
    },
    {
      id: 'gaming',
      label: resolveCopy('useCase.gaming.label'),
      status: latency <= 50 && jitter <= 20 ? 'good' : 'limited',
    },
    {
      id: 'videocall',
      label: resolveCopy('useCase.video_call.label'),
      status: latency <= 100 && ul >= 2 ? 'good' : 'limited',
    },
    {
      id: 'remote',
      label: resolveCopy('useCase.home_office.label'),
      status: ul >= 10 && dl >= 20 ? 'good' : 'limited',
    },
  ];
}

export function summarizeHistory(
  currentDl: number,
  history: TestRecord[],
): HistorySummary | null {
  if (history.length < 3) return null;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = history.filter((r) => r.timestamp > thirtyDaysAgo && r.dl > 0);
  if (recent.length < 3) return null;
  const avgDl = recent.reduce((s, r) => s + r.dl, 0) / recent.length;
  if (avgDl === 0) return null;
  return {
    deltaPct: Math.round(((currentDl - avgDl) / avgDl) * 100),
    count: recent.length,
  };
}

function rec(
  id: string,
  title: string,
  description: string,
  priority: Recommendation['priority'],
  actionType: Recommendation['actionType'],
): Recommendation {
  return { id, title, description, priority, actionType };
}

function hasRecurringProblem(
  history: TestRecord[],
  check: (r: TestRecord) => boolean,
  threshold = 3,
): boolean {
  return history.slice(0, 5).filter(check).length >= threshold;
}

export function buildRecommendations(
  _result: SpeedTestResult,
  c: Classification,
  recentHistory: TestRecord[] = [],
): Recommendation[] {
  if (c.primary === 'unavailable') {
    return [
      rec('check_conn', 'Verifique sua conexão', 'Nenhum dado chegou ao servidor. Confirme se o Wi‑Fi ou cabo está ativo.', 'high', 'none'),
    ];
  }

  if (c.primary === 'excellent') return [];

  const recs: Recommendation[] = [];

  const isDownloadLow = c.primary === 'slow' || c.primary === 'fair';
  const isUploadLow = c.tags.has('lowUpload');
  const isHighLatency = c.tags.has('highLatency');
  const isUnstable = c.tags.has('unstable') || c.tags.has('veryUnstable');
  const hasPacketLoss = c.tags.has('packetLoss') || c.tags.has('veryUnstable');

  if (hasPacketLoss) {
    const recurring = hasRecurringProblem(recentHistory, (r) => r.packetLoss > 2);
    if (recurring) {
      recs.push(rec(
        'proof_mode', 'Registre os testes como prova',
        'O problema apareceu em vários testes. Use Prova Real para gerar um histórico organizado para suporte.',
        'high', 'run_proof_mode',
      ));
    } else {
      recs.push(rec(
        'repeat_loss', 'Repita o teste',
        'Falhas na conexão foram detectadas. Pode ser momentâneo — teste novamente para confirmar.',
        'high', 'repeat_test',
      ));
    }
  }

  if (isUnstable && !hasPacketLoss) {
    const recurringUnstable = hasRecurringProblem(recentHistory, (r) => r.jitter > 50 || r.packetLoss > 2);
    if (recurringUnstable) {
      recs.push(rec(
        'restart_router', 'Reinicie o roteador',
        'A oscilação apareceu em vários testes. Desligue o roteador por 30 segundos e ligue novamente.',
        'medium', 'restart_router',
      ));
    } else {
      recs.push(rec(
        'compare_loc', 'Teste em outro cômodo',
        'A velocidade está oscilando. Compare o resultado perto do roteador para ver se melhora.',
        'medium', 'compare_location',
      ));
    }
  }

  if (isHighLatency) {
    recs.push(rec(
      'move_router', 'Fique mais perto do roteador',
      'A resposta está lenta — isso afeta jogos e chamadas. Teste perto do roteador para comparar.',
      'high', 'move_closer_router',
    ));
  }

  if (isDownloadLow) {
    const recurringSlow = hasRecurringProblem(recentHistory, (r) => r.quality === 'slow');
    if (recurringSlow) {
      recs.push(rec(
        'contact_op', 'Fale com a operadora',
        'A lentidão apareceu em vários testes recentes. Vale abrir um chamado ou verificar seu plano.',
        'high', 'contact_operator',
      ));
    } else {
      recs.push(rec(
        'close_apps', 'Feche outros apps que usam internet',
        'O download está baixo. Feche aplicativos em segundo plano e repita o teste.',
        'medium', 'repeat_test',
      ));
    }
  }

  if (isUploadLow) {
    recs.push(rec(
      'upload_warn', 'Upload fraco pode afetar chamadas',
      'O envio de dados está baixo — videochamadas e envio de arquivos podem ser lentos. Tente o cabo se possível.',
      'medium', 'try_cable',
    ));
  }

  // Ordena por prioridade e limita a 3
  const order: Record<Recommendation['priority'], number> = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 3);
}
