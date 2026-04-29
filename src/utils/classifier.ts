import type { Classification, Quality, RuleSetVersion, SpeedTestResult, Tag, TestRecord } from '../types';

export const RULE_SET_VERSION: RuleSetVersion = 'v1';

export function classify(r: SpeedTestResult): Classification {
  const tags = new Set<Tag>();

  if (r.latency > 80) tags.add('highLatency');
  if (r.ul < 5) tags.add('lowUpload');
  if (r.jitter > 50) tags.add('unstable');
  if (r.packetLoss > 2) tags.add('packetLoss');
  if (r.packetLoss > 5 || r.jitter > 80) tags.add('veryUnstable');

  let primary: Quality;
  if (r.dl === 0 && r.ul === 0) {
    primary = 'unavailable';
  } else if (
    r.dl >= 100 && r.ul >= 30 &&
    r.latency <= 30 && r.jitter <= 5 && r.packetLoss <= 0.5
  ) {
    primary = 'excellent';
  } else if (
    r.dl >= 50 && r.ul >= 10 &&
    r.latency <= 60 && r.jitter <= 15 && r.packetLoss <= 1.5
  ) {
    primary = 'good';
  } else if (
    r.dl >= 10 && r.ul >= 3 &&
    r.latency <= 100 && r.packetLoss <= 2
  ) {
    primary = 'fair';
  } else if (r.dl > 0 || r.ul > 0) {
    primary = 'slow';
  } else {
    primary = 'unavailable';
  }

  return { primary, tags };
}

export function qualityHeadline(q: Quality): string {
  switch (q) {
    case 'excellent': return 'Conexão excelente';
    case 'good':      return 'Conexão boa';
    case 'fair':      return 'Conexão estável';
    case 'slow':      return 'Conexão lenta';
    case 'unavailable': return 'Sem conexão';
  }
}

export function tagLabel(t: Tag): string {
  switch (t) {
    case 'highLatency':  return 'Resposta lenta';
    case 'lowUpload':    return 'Upload fraco';
    case 'unstable':     return 'Oscilação alta';
    case 'packetLoss':   return 'Perda de sinal';
    case 'veryUnstable': return 'Instabilidade alta';
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function stability(r: SpeedTestResult): number {
  const jitterScore = 100 - clamp((r.jitter / 50) * 100, 0, 100);
  const lossScore   = 100 - clamp((r.packetLoss / 2) * 100, 0, 100);
  return Math.round(0.6 * jitterScore + 0.4 * lossScore);
}

export function stabilityLabel(score: number): string {
  if (score >= 85) return 'Muito estável';
  if (score >= 60) return 'Estável';
  if (score >= 35) return 'Oscilando';
  return 'Instável';
}

export function buildDiagnosis(
  _r: SpeedTestResult,
  c: Classification,
  recentHistory: TestRecord[] = [],
): string[] {
  const parts: string[] = [];

  switch (c.primary) {
    case 'excellent':
      parts.push('Sua internet está excelente. Você pode usar qualquer aplicativo sem limitações — streaming em 4K, jogos online e videochamadas funcionam perfeitamente.');
      break;
    case 'good':
      parts.push('Sua internet está boa para o dia a dia. Streaming, videochamadas e trabalho remoto funcionam sem problemas.');
      break;
    case 'fair':
      parts.push('Sua internet está funcionando, mas pode ter dificuldade com streaming em alta qualidade ou vários dispositivos ao mesmo tempo.');
      break;
    case 'slow':
      parts.push('Sua internet está lenta. Páginas demoram para carregar e aplicativos podem travar com frequência.');
      break;
    case 'unavailable':
      parts.push('Não foi possível medir sua conexão. Verifique se você está conectado à internet.');
      break;
  }

  if (c.tags.has('veryUnstable')) {
    parts.push('A conexão está muito instável. Chamadas e streaming podem cair com frequência.');
  } else if (c.tags.has('packetLoss')) {
    parts.push('Sua conexão está perdendo dados no caminho — isso causa engasgos e lentidão em aplicativos.');
  } else if (c.tags.has('unstable')) {
    parts.push('A velocidade está oscilando bastante, o que pode causar quedas em chamadas ou streaming.');
  }

  if (c.tags.has('highLatency')) {
    parts.push('O servidor está demorando para responder — isso pode causar travamentos em jogos online e chamadas de voz.');
  }

  if (c.tags.has('lowUpload')) {
    parts.push('Seu envio de dados está fraco — subir arquivos grandes ou fazer transmissões ao vivo pode ser lento.');
  }

  if (recentHistory.length >= 3) {
    const last5 = recentHistory.slice(0, 5);
    const latCount  = last5.filter((h) => h.latency > 80).length;
    const lossCount = last5.filter((h) => h.packetLoss > 2).length;
    const slowCount = last5.filter((h) => h.quality === 'slow' || h.quality === 'unavailable').length;
    if (latCount >= 3) {
      parts.push('Nos últimos testes a resposta continua alta — pode ser um problema recorrente na sua conexão.');
    }
    if (lossCount >= 3) {
      parts.push('Perda de dados foi detectada em vários testes recentes — considere verificar o roteador ou o cabo.');
    }
    if (slowCount >= 3) {
      parts.push('Sua conexão tem mostrado lentidão em vários testes — vale entrar em contato com sua operadora.');
    }
  }

  return parts;
}

export function buildShortPhrase(
  r: SpeedTestResult,
  quality: Quality,
  scenarios: { gamesAlerted: boolean; gamesBad: boolean; otherAlerted: boolean },
): string {
  if (quality === 'unavailable') {
    return 'Sem conexão detectada — verifique se está conectado à internet.';
  }
  if (quality === 'slow') {
    const isActuallyFast = r.dl > 30 || r.ul > 10;
    const hasStabilityIssue = r.packetLoss > 2 || r.jitter > 50 || r.latency > 80;
    if (isActuallyFast && hasStabilityIssue) {
      return 'Conexão instável — verifique o roteador ou o cabo.';
    }
    return 'Internet lenta — velocidade insuficiente para a maioria dos usos.';
  }
  if (quality === 'fair') {
    return 'Conexão funcional — pode ter dificuldades com streaming ou múltiplos dispositivos.';
  }
  // excellent or good
  const { gamesAlerted, gamesBad, otherAlerted } = scenarios;
  if (!gamesAlerted && !otherAlerted) {
    return quality === 'excellent'
      ? 'Internet excelente — todos os usos funcionam perfeitamente.'
      : 'Boa conexão — streaming, trabalho e jogos funcionam bem.';
  }
  if (gamesAlerted && !otherAlerted) {
    if (gamesBad) {
      return 'Boa para navegação e streaming — pode não ser ideal para jogos online.';
    }
    if (r.packetLoss > 1) {
      return 'Boa para o dia a dia — jogos online podem ter impacto por perda de pacotes.';
    }
    if (r.jitter > 20) {
      return 'Boa para o dia a dia — jogos online podem ter impacto por oscilação.';
    }
    return 'Boa para o dia a dia — jogos online podem ter impacto por latência.';
  }
  return 'Boa para uso geral — alguns cenários podem ser afetados.';
}
