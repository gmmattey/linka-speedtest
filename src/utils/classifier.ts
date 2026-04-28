import type { Classification, Quality, SpeedTestResult, Tag, TestRecord } from '../types';

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
  r: SpeedTestResult,
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

  if (r.latency > 80) {
    parts.push('⚠ Tempo de resposta alto — pode afetar jogos online e chamadas de voz.');
  }
  if (r.packetLoss > 2) {
    parts.push('⚠ Perda de dados detectada — verifique o cabo ou o roteador.');
  }
  if (r.jitter > 50) {
    parts.push('⚠ Oscilação alta — a velocidade pode variar muito durante o uso.');
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
