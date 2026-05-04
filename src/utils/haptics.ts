// Wrapper sobre `navigator.vibrate(...)`. Web standard — Capacitor traduz
// automaticamente para haptics nativos no Android. iOS Safari/PWA ignora
// silenciosamente (não há equivalente público), o que é aceitável.
//
// Usado por RunningScreen (transições de fase, conclusão, erro) e por
// qualquer fluxo que queira sinalização tátil no futuro. Bloco 3
// (Polimento, 2026-05).

export type HapticPattern =
  | 'phaseChange'   // 30ms — entre fases ativas (ex.: download → upload)
  | 'success'       // 50ms — conclusão do teste
  | 'error';        // [100, 50, 100] — erro

const PATTERNS: Record<HapticPattern, number | number[]> = {
  phaseChange: 30,
  success:     50,
  error:       [100, 50, 100],
};

/**
 * Dispara vibração no dispositivo se o usuário tiver haptics habilitados
 * e a API estiver disponível. Falha silenciosamente — nunca lança.
 */
export function triggerHaptic(pattern: HapticPattern, enabled: boolean): void {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(PATTERNS[pattern]);
    }
  } catch {
    // sandbox / política de permissão — ignora.
  }
}
