import type { TestRecord } from '../types';

export interface HistoryInsight {
  id: string;
  type: 'trend' | 'drop' | 'improvement' | 'recurring_issue' | 'stable_period' | 'info';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

function avg(records: TestRecord[], key: keyof Pick<TestRecord, 'dl' | 'ul' | 'latency' | 'jitter' | 'packetLoss'>): number {
  if (records.length === 0) return 0;
  return records.reduce((s, r) => s + r[key], 0) / records.length;
}

function pct(a: number, b: number): number {
  if (b === 0) return 0;
  return ((a - b) / b) * 100;
}

export function buildHistoryInsights(records: TestRecord[]): HistoryInsight[] {
  if (records.length < 3) return [];

  const insights: HistoryInsight[] = [];
  const recent5 = records.slice(0, 5);
  const all = records;

  // Comparar primeira metade vs segunda metade para detectar tendência
  const half = Math.floor(all.length / 2);
  const older = all.slice(half);
  const newer = all.slice(0, half);
  const olderAvgDl = avg(older, 'dl');
  const newerAvgDl = avg(newer, 'dl');
  const dlTrend = pct(newerAvgDl, olderAvgDl);

  if (dlTrend < -20 && all.length >= 6) {
    insights.push({
      id: 'dl_drop_trend',
      type: 'drop',
      title: 'Download em queda',
      description: `O download caiu cerca de ${Math.abs(dlTrend).toFixed(0)}% nos testes mais recentes comparado aos anteriores.`,
      severity: dlTrend < -40 ? 'critical' : 'warning',
    });
  } else if (dlTrend > 20 && all.length >= 6) {
    insights.push({
      id: 'dl_improvement',
      type: 'improvement',
      title: 'Download melhorando',
      description: `O download aumentou cerca de ${dlTrend.toFixed(0)}% nos testes mais recentes.`,
      severity: 'info',
    });
  }

  // Detectar problema recorrente de latência
  const highLatencyCount = recent5.filter((r) => r.latency > 80).length;
  if (highLatencyCount >= 3) {
    insights.push({
      id: 'recurring_latency',
      type: 'recurring_issue',
      title: 'Resposta alta nos testes recentes',
      description: `A resposta ficou acima de 80 ms em ${highLatencyCount} dos últimos ${recent5.length} testes. Pode ser um problema recorrente.`,
      severity: highLatencyCount >= 4 ? 'critical' : 'warning',
    });
  }

  // Detectar problema recorrente de packetLoss
  const highLossCount = recent5.filter((r) => r.packetLoss > 2).length;
  if (highLossCount >= 3) {
    insights.push({
      id: 'recurring_loss',
      type: 'recurring_issue',
      title: 'Perda de dados repetida',
      description: `Perda de dados foi detectada em ${highLossCount} dos últimos ${recent5.length} testes. Vale verificar o roteador ou cabo.`,
      severity: 'critical',
    });
  }

  // Detectar upload consistentemente baixo
  const avgUl = avg(recent5, 'ul');
  if (avgUl < 5) {
    insights.push({
      id: 'low_upload',
      type: 'recurring_issue',
      title: 'Upload fraco',
      description: `A média de upload nos testes recentes é ${avgUl.toFixed(1)} Mbps — pode impactar chamadas e envio de arquivos.`,
      severity: 'warning',
    });
  }

  // Detectar período estável (últimos 5 com boa estabilidade)
  const stableCount = recent5.filter((r) => r.jitter <= 15 && r.packetLoss <= 1).length;
  if (stableCount >= 4 && insights.length === 0) {
    insights.push({
      id: 'stable_period',
      type: 'stable_period',
      title: 'Conexão estável',
      description: `${stableCount} dos últimos ${recent5.length} testes mostraram boa estabilidade. Jitter e perda dentro do esperado.`,
      severity: 'info',
    });
  }

  // Upload caiu em relação à média geral
  const overallAvgUl = avg(all, 'ul');
  const recentAvgUl = avg(recent5, 'ul');
  const ulDrop = pct(recentAvgUl, overallAvgUl);
  if (ulDrop < -30 && all.length >= 6 && !insights.some((i) => i.id === 'low_upload')) {
    insights.push({
      id: 'ul_drop',
      type: 'drop',
      title: 'Upload abaixo da média',
      description: `O upload recente está ${Math.abs(ulDrop).toFixed(0)}% abaixo da sua média histórica.`,
      severity: 'warning',
    });
  }

  // Comparação semana a semana
  const now = Date.now();
  const DAY_MS = 24 * 3600 * 1000;
  const thisWeek = all.filter((r) => now - r.timestamp < 7 * DAY_MS);
  const lastWeek = all.filter((r) => now - r.timestamp >= 7 * DAY_MS && now - r.timestamp < 14 * DAY_MS);
  if (thisWeek.length >= 2 && lastWeek.length >= 2) {
    const twDl = avg(thisWeek, 'dl');
    const lwDl = avg(lastWeek, 'dl');
    const weekDelta = pct(twDl, lwDl);
    if (weekDelta < -20 && !insights.some((i) => i.type === 'drop')) {
      insights.push({
        id: 'week_drop',
        type: 'drop',
        title: 'Semana pior que a anterior',
        description: `O download desta semana (${twDl.toFixed(0)} Mbps em média) está ${Math.abs(weekDelta).toFixed(0)}% abaixo da semana passada.`,
        severity: weekDelta < -40 ? 'critical' : 'warning',
      });
    } else if (weekDelta > 20 && !insights.some((i) => i.type === 'improvement')) {
      insights.push({
        id: 'week_improvement',
        type: 'improvement',
        title: 'Semana melhor que a anterior',
        description: `O download desta semana (${twDl.toFixed(0)} Mbps) está ${weekDelta.toFixed(0)}% acima da semana passada.`,
        severity: 'info',
      });
    }
  }

  // Análise de horário de pico — detecta se a conexão é significativamente pior em algum período
  if (all.length >= 6) {
    type Bucket = 'madrugada' | 'manhã' | 'tarde' | 'noite';
    const buckets: Record<Bucket, number[]> = { madrugada: [], manhã: [], tarde: [], noite: [] };
    for (const r of all) {
      const h = new Date(r.timestamp).getHours();
      const b: Bucket = h < 6 ? 'madrugada' : h < 12 ? 'manhã' : h < 18 ? 'tarde' : 'noite';
      buckets[b].push(r.dl);
    }
    const populated = (Object.keys(buckets) as Bucket[])
      .filter((b) => buckets[b].length >= 2)
      .map((b) => ({ b, avg: buckets[b].reduce((s, v) => s + v, 0) / buckets[b].length }));
    if (populated.length >= 2) {
      const best  = populated.reduce((a, c) => c.avg > a.avg ? c : a);
      const worst = populated.reduce((a, c) => c.avg < a.avg ? c : a);
      const peakDrop = pct(worst.avg, best.avg);
      if (peakDrop < -30 && !insights.some((i) => i.id === 'peak_hour')) {
        insights.push({
          id: 'peak_hour',
          type: 'recurring_issue',
          title: `Conexão mais lenta à ${worst.b}`,
          description: `À ${worst.b} o download é ${Math.abs(peakDrop).toFixed(0)}% menor do que à ${best.b}. Congestionamento de rede pode ser a causa.`,
          severity: peakDrop < -50 ? 'critical' : 'warning',
        });
      }
    }
  }

  return insights.slice(0, 4);
}
