/**
 * Bridge web para o plugin Capacitor `PacketLoss` (Android).
 *
 * No PWA web puro, retorna `{ available: false }` — o orchestrator
 * deve cair pra estimativa atual (heurística do `latencyResult.approximateLoss`).
 *
 * No APK Android, dispara o plugin nativo (50 pacotes UDP DNS por
 * default) e devolve `lossPercent` + `avgRttMs` reais.
 *
 * Para uma versão iOS no futuro, basta criar um plugin Capacitor
 * homônimo em Swift; o nome registrado deve ser exatamente "PacketLoss"
 * para que `Capacitor.Plugins.PacketLoss` resolva sem mudanças aqui.
 */
export type PacketLossPlatform = 'android' | 'ios' | 'web';

export interface PacketLossResult {
  /** `true` quando a medição nativa rodou. `false` no web ou em falha. */
  available: boolean;
  /** Pacotes enviados (apenas se `available`). */
  sent?: number;
  /** Pacotes recebidos dentro do timeout (apenas se `available`). */
  received?: number;
  /** Percentual de perda arredondado (0..100). `undefined` se indisponível. */
  lossPercent?: number;
  /** RTT médio em ms dos pacotes que voltaram. `-1` quando nenhum voltou. */
  avgRttMs?: number;
  /** Plataforma onde a medição ocorreu — para auditoria. */
  platform?: PacketLossPlatform;
}

interface PacketLossNativePlugin {
  measurePacketLoss: (opts?: {
    host?: string;
    port?: number;
    packetCount?: number;
    timeoutMs?: number;
    spacingMs?: number;
  }) => Promise<{
    sent: number;
    received: number;
    lossPercent: number;
    avgRttMs: number;
    platform: PacketLossPlatform;
  }>;
}

interface CapacitorWindow {
  Capacitor?: {
    Plugins?: { PacketLoss?: PacketLossNativePlugin };
    isNativePlatform?: () => boolean;
  };
  PacketLoss?: PacketLossNativePlugin;
}

function getNativePlugin(): PacketLossNativePlugin | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as CapacitorWindow;
  const fromCapacitor = w.Capacitor?.Plugins?.PacketLoss;
  if (fromCapacitor?.measurePacketLoss) return fromCapacitor;
  if (w.PacketLoss?.measurePacketLoss) return w.PacketLoss;
  return null;
}

/**
 * Tenta medir packet loss real via plugin nativo. Sempre resolve — em
 * web ou em falha, devolve `{ available: false }`. Nunca lança.
 */
export async function measurePacketLossNative(opts?: {
  host?: string;
  port?: number;
  packetCount?: number;
  timeoutMs?: number;
  spacingMs?: number;
}): Promise<PacketLossResult> {
  const plugin = getNativePlugin();
  if (!plugin) return { available: false, platform: 'web' };

  try {
    const native = await plugin.measurePacketLoss({
      host: opts?.host ?? '1.1.1.1',
      port: opts?.port ?? 53,
      packetCount: opts?.packetCount ?? 50,
      timeoutMs: opts?.timeoutMs ?? 1000,
      spacingMs: opts?.spacingMs ?? 20,
    });
    return {
      available: true,
      sent: native.sent,
      received: native.received,
      lossPercent: native.lossPercent,
      avgRttMs: native.avgRttMs,
      platform: native.platform,
    };
  } catch (err) {
    // Logging deliberadamente leve — é uma feature opcional, não pode
    // quebrar o fluxo principal do speedtest.
    console.warn('[packetLoss] native measurement failed:', err);
    return { available: false };
  }
}

/**
 * Indica se o plugin nativo está disponível no runtime atual. Útil pra
 * UI decidir mostrar (ou ocultar) o label "estimado".
 */
export function isPacketLossNativeAvailable(): boolean {
  return getNativePlugin() !== null;
}
