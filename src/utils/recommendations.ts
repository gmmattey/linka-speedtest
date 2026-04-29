import type { Classification, Recommendation, SpeedTestResult, TestRecord } from '../types';

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
        'Perda de dados foi detectada. Pode ser momentânea — teste novamente para confirmar.',
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
