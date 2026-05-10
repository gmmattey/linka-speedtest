/**
 * Log estruturado de medição de speedtest.
 * Segue o schema em docs/contratos/FormatoLogMedicao.md v1.0.0.
 *
 * Habilitado apenas em modo dev (import.meta.env.DEV ou flag localStorage
 * 'linka.dev.logs=true'). Dados sensíveis omitidos em produção.
 */

import type { TipoRede, EstadoRede } from '../hooks/useEstadoRede';
import type { SpeedTestResult as SpeedTestResultNative } from '../types';

const LOG_KEY = 'linka_medicoes';
const MAX_REGISTROS = 20;
const DEV_FLAG_KEY = 'linka.dev.logs';

export function isDevLogsAtivo(): boolean {
  return import.meta.env.DEV || localStorage.getItem(DEV_FLAG_KEY) === 'true';
}

// ── Schema do log ─────────────────────────────────────────────────────────────

export interface AmostraTemporalLog {
  tMs: number;
  mbps: number;
}

export interface LogMedicao {
  specVersion: string;
  logVersion: string;
  timestampInicio: string;
  timestampFim: string;
  duracaoTotalMs: number;

  plataforma: 'pwa';
  so: string;
  navegador: string;
  versaoApp: string;
  modoTeste: 'fast' | 'complete';
  specVersionUsada: string;
  contaminado: boolean;

  rede: {
    tipoInicio: TipoRede;
    tipoFim: TipoRede;
    ssid: string | null;
    ipLocal: string | null;
    gateway: string | null;
    ipPublico: string | null;
    internetValidadaAntes: boolean;
    internetValidadaApos: boolean;
  };

  servidor: {
    nome: string;
    urlDownload: string;
    urlUpload: string;
    urlPing: string;
    protocolo: string;
    httpVersion: string;
  };

  configuracao: {
    payloadDownloadBytes: number;
    payloadUploadBytes: number;
    streamsDownloadInicial: number;
    streamsDownloadMaximo: number;
    streamsUploadInicial: number;
    streamsUploadMaximo: number;
    warmupMs: number;
    duracaoFaseMs: number;
    pingCount: number;
    sampleIntervalMs: number;
    modoUploadAdaptativo: boolean;
  };

  latencia: {
    medianaMs: number;
    mediaMs: number;
    jitterMs: number;
    perda: number;
    fontePerda: 'estimated' | 'nativo-udp';
    pingsExecutados: number;
    pingsValidos: number;
    amostrasMs?: number[];
  };

  download: {
    throughputMbps: number;
    peakMbps: number;
    stabilityScore: number;
    streamsMaxUsados: number;
    latenciaSOBCargaMs: number;
    bufferbloatDeltaMs: number;
    bufferbloatSeveridade: string;
    amostrasTemporais?: AmostraTemporalLog[];
  };

  upload: {
    throughputMbps: number;
    peakMbps: number;
    stabilityScore: number;
    streamsMaxUsados: number;
    latenciaSOBCargaMs: number;
    bufferbloatDeltaMs: number;
    bufferbloatSeveridade: string;
    falhou: boolean;
    amostrasTemporais?: AmostraTemporalLog[];
  };

  dns: {
    latenciaMs: number | null;
    resolverIp: string | null;
    provedor: string | null;
    falhou: boolean;
  };

  erros: string[];
}

// ── API pública ───────────────────────────────────────────────────────────────

export function salvarLogMedicao(log: LogMedicao): void {
  if (!isDevLogsAtivo()) return;
  try {
    const existentes = carregarLogs();
    const anel = [log, ...existentes].slice(0, MAX_REGISTROS);
    localStorage.setItem(LOG_KEY, JSON.stringify(anel));
  } catch {
    // localStorage cheio ou desabilitado — ignora silenciosamente.
  }
}

export function carregarLogs(): LogMedicao[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LogMedicao[]) : [];
  } catch {
    return [];
  }
}

export function exportarLogsJson(): void {
  const logs = carregarLogs();
  if (logs.length === 0) {
    alert('Nenhuma medição registrada. Ative os logs em modo dev e faça um teste.');
    return;
  }
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `linka-medicoes-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function limparLogs(): void {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch {
    // ignora
  }
}

// ── Helper composto ───────────────────────────────────────────────────────────

/// Constrói e salva o log de uma medição a partir do resultado nativo do PWA.
/// Chama `salvarLogMedicao` internamente; respeita a flag de dev.
export function salvarLogDeTeste({
  resultado,
  redeInicio,
  redeFim,
  contaminado,
  modoTeste,
  erros = [],
}: {
  resultado: SpeedTestResultNative;
  redeInicio: EstadoRede;
  redeFim: EstadoRede;
  contaminado: boolean;
  modoTeste: 'fast' | 'complete';
  erros?: string[];
}): void {
  if (!isDevLogsAtivo()) return;

  const isFast = modoTeste === 'fast';
  const pingCount = isFast ? 15 : 25;
  const fim = new Date(resultado.timestamp);
  const inicio = new Date(resultado.timestamp - (resultado.elapsedMs ?? 0));
  const latMediana = resultado.latencyUnloaded ?? resultado.latency;
  const latencyDl = resultado.latencyDownload ?? latMediana;
  const latencyUl = resultado.latencyUpload ?? latencyDl;

  const log: LogMedicao = {
    specVersion: '1.0.0',
    logVersion: '1.0.0',
    timestampInicio: inicio.toISOString(),
    timestampFim: fim.toISOString(),
    duracaoTotalMs: resultado.elapsedMs ?? 0,
    plataforma: 'pwa',
    so: detectarSo(),
    navegador: detectarNavegador(),
    versaoApp: '—',
    modoTeste,
    specVersionUsada: '1.0.0',
    contaminado,
    rede: {
      tipoInicio: redeInicio.tipo,
      tipoFim: redeFim.tipo,
      ssid: redeInicio.ssid,
      ipLocal: redeInicio.ipLocal,
      gateway: redeInicio.gateway,
      ipPublico: null,
      internetValidadaAntes: redeInicio.internet,
      internetValidadaApos: redeFim.internet,
    },
    servidor: {
      nome: 'cloudflare',
      urlDownload: 'https://speed.cloudflare.com/__down',
      urlUpload: 'https://speed.cloudflare.com/__up',
      urlPing: 'https://speed.cloudflare.com/__down?bytes=0',
      protocolo: 'https',
      httpVersion: '2.0',
    },
    configuracao: {
      payloadDownloadBytes: isFast ? 10_000_000 : 25_000_000,
      payloadUploadBytes: isFast ? 5_000_000 : 10_000_000,
      streamsDownloadInicial: 2,
      streamsDownloadMaximo: isFast ? 4 : 8,
      streamsUploadInicial: isFast ? 4 : 8,
      streamsUploadMaximo: isFast ? 4 : 8,
      warmupMs: isFast ? 1000 : 2000,
      duracaoFaseMs: isFast ? 7000 : 18000,
      pingCount,
      sampleIntervalMs: 300,
      modoUploadAdaptativo: resultado.ulFailed ?? false,
    },
    latencia: {
      medianaMs: latMediana,
      mediaMs: resultado.latency,
      jitterMs: resultado.jitter,
      perda: resultado.packetLoss,
      fontePerda: resultado.packetLossSource === 'native' ? 'nativo-udp' : 'estimated',
      pingsExecutados: pingCount,
      pingsValidos: pingCount - 1,
    },
    download: {
      throughputMbps: resultado.dl,
      peakMbps: resultado.peakDlMbps ?? resultado.dl,
      stabilityScore: resultado.stabilityScore ?? 0,
      streamsMaxUsados: isFast ? 4 : 8,
      latenciaSOBCargaMs: latencyDl,
      bufferbloatDeltaMs: resultado.bufferbloatDeltaMs ?? 0,
      bufferbloatSeveridade: resultado.bufferbloatSeverity ?? 'low',
      amostrasTemporais: resultado.dlSamples?.map((s) => ({ tMs: s.tMs, mbps: s.mbps })),
    },
    upload: {
      throughputMbps: resultado.ul,
      peakMbps: resultado.peakUlMbps ?? resultado.ul,
      stabilityScore: resultado.stabilityScore ?? 0,
      streamsMaxUsados: isFast ? 4 : 8,
      latenciaSOBCargaMs: latencyUl,
      bufferbloatDeltaMs: resultado.bufferbloatDeltaMs ?? 0,
      bufferbloatSeveridade: resultado.bufferbloatSeverity ?? 'low',
      falhou: resultado.ulFailed ?? false,
      amostrasTemporais: resultado.ulSamples?.map((s) => ({ tMs: s.tMs, mbps: s.mbps })),
    },
    dns: {
      latenciaMs: resultado.dnsLatencyMs ?? null,
      resolverIp: resultado.dnsResolverIp ?? null,
      provedor: resultado.dnsProvider ?? null,
      falhou: resultado.dnsLatencyMs == null,
    },
    erros,
  };

  salvarLogMedicao(log);
}

// ── Helpers de contexto ───────────────────────────────────────────────────────

export function detectarSo(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return `Android`;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'desconhecido';
}

export function detectarNavegador(): string {
  const ua = navigator.userAgent;
  if (/Chrome\/(\d+)/i.test(ua)) return `Chrome ${RegExp.$1}`;
  if (/Firefox\/(\d+)/i.test(ua)) return `Firefox ${RegExp.$1}`;
  if (/Safari\/(\d+)/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Edg\/(\d+)/i.test(ua)) return `Edge ${RegExp.$1}`;
  return 'desconhecido';
}
