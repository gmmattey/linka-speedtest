/**
 * relativeTime.ts — formatação de tempo relativo em pt-BR.
 *
 * Usado pelo banner de contexto da `ResultScreen` (pacote premium 2026-05).
 * Saída no estilo "agora", "há 2 min", "há 3 h", "há 2 d", "há 5 sem".
 *
 * Pura: recebe `timestamp` (epoch ms) e opcional `now` (para testes).
 * Sem dependências externas. Sem libs de i18n — apenas pt-BR.
 *
 * Decisões:
 * - Janela < 60s → "agora" (não vale a pena exibir segundos).
 * - 1m a 59m → "há N min".
 * - 1h a 23h → "há N h".
 * - 1d a 6d  → "há N d".
 * - ≥ 7d    → "há N sem" (semanas, arredondado para baixo).
 * - Futuro (timestamp > now) também devolve "agora" — ResultScreen nunca
 *   mostra resultado do futuro, mas a guarda evita "há -2 min" se houver
 *   skew de relógio entre captura e render.
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
  const diffMs = Math.max(0, now - timestamp);
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'agora';
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `há ${day} d`;
  const wk = Math.floor(day / 7);
  return `há ${wk} sem`;
}
