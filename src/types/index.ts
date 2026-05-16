export type Quality = 'excellent' | 'good' | 'fair' | 'slow' | 'unavailable';
export type Tag = 'highLatency' | 'lowUpload' | 'unstable' | 'packetLoss' | 'veryUnstable';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type ConnectionType = 'wifi' | 'mobile' | 'cable' | 'unknown';
export type ConnectionProfile = 'fixed_broadband' | 'mobile_broadband';
export type RuleSetVersion = string; // semântica: 'v1', 'v2', etc.
export type SpeedTestMode = 'quick' | 'fast' | 'complete' | 'normal' | 'advanced';
export type BufferbloatSeverity = 'low' | 'moderate' | 'high' | 'critical';
export type GamingProfile = 'off' | 'casual' | 'moba' | 'fps' | 'cloud';
export type TestPhase = 'idle' | 'latency' | 'download' | 'upload' | 'load' | 'dns' | 'done' | 'error';

export interface SpeedTestSample {
  tMs: number;
  mbps: number;
  phase: 'download' | 'upload';
}

export interface SpeedTestDiagnostics {
  streamingVerdict: 'good' | 'acceptable' | 'poor';
  gamingVerdict:    'good' | 'acceptable' | 'poor';
  videoCallVerdict: 'good' | 'acceptable' | 'poor';
  primaryBottleneck: 'none' | 'latency' | 'upload' | 'bufferbloat' | 'packetLoss';
  summaryText: string;
}

export interface SpeedTestResult {
  dl: number;
  ul: number;
  latency: number;
  jitter: number;
  packetLoss: number;
  timestamp: number;
  // Advanced mode extras (compat legado)
  dlP25?: number;
  dlP75?: number;
  ulP25?: number;
  ulP75?: number;
  latencyLoaded?: number;
  jitterLoaded?: number;
  bufferbloatGrade?: 'A' | 'B' | 'C' | 'D' | 'F';
  bufferbloatDeltaMs?: number;
  mode?: SpeedTestMode;
  dns?: import('../utils/dnsBenchmark').DnsBenchmarkResult;
  // Motor v2
  stabilityScore?: number;
  peakDlMbps?: number;
  peakUlMbps?: number;
  bufferbloatSeverity?: BufferbloatSeverity;
  latencyUnloaded?: number;
  latencyDownload?: number;
  latencyUpload?: number;
  diagnostics?: SpeedTestDiagnostics;
  dlSamples?: SpeedTestSample[];
  ulSamples?: SpeedTestSample[];
  // ── DNS feature (2026-05) ───────────────────────────────────────────
  // dnsLatencyMs: latência da primeira resolução DNS observada via
  //   Resource Timing API. `null` = sem amostra válida (cache total ou
  //   bloqueio CORS); `undefined` = não medido (registros legados).
  // dnsResolverIp / dnsProvider: identificação do resolver via probe DoH
  //   ao Cloudflare whoami (`whoami.cloudflare-dns.com`). Provider é
  //   derivado do IP por `identifyDnsProvider`. Quando o probe falha
  //   (offline, CORS, etc.), ambos ficam `null`.
  dnsLatencyMs?: number | null;
  dnsResolverIp?: string | null;
  dnsProvider?: string | null;
  // ── Tempo total do teste (2026-05) ──────────────────────────────────
  // elapsedMs: duração total do teste do `runSpeedTestV2()`, capturada
  //   pelo orchestrator (`Date.now() - testStartTime`). Inclui as três
  //   fases (latência + download + upload + probe DNS). `undefined` em
  //   registros legados ou quando o resultado vier de outra origem
  //   (fixtures, recordToResult, etc.).
  elapsedMs?: number;
  // ── Resultado parcial (2026-05) ─────────────────────────────────────
  // ulFailed: `true` quando a fase de upload falhou (ex.: chunks não
  //   completaram dentro da janela em uplink celular saturado) mas as
  //   fases de download e latência produziram amostras válidas. O
  //   resultado é tratado como "parcial": `ul=0`, mas `dl`/latência são
  //   confiáveis. UI deve sinalizar isso ao usuário em vez de invalidar
  //   o teste todo. `undefined`/`false` em testes que mediram upload com
  //   sucesso ou em registros legados.
  ulFailed?: boolean;
  // ── Origem do packet loss (2026-05) ────────────────────────────────
  // packetLossSource indica como o `packetLoss` acima foi obtido.
  //   - 'native':    plugin Capacitor PacketLoss (UDP real, Android APK).
  //   - 'estimated': heurística do PWA web (timeouts de ping HTTP/CORS).
  // `undefined` = não anotado (registros legados ou origem desconhecida).
  // UI mostra label "estimado" quando ≠ 'native' para transparência.
  packetLossSource?: 'native' | 'estimated';
  // ── Contexto Wi-Fi via Atalho iOS (2026-05) ─────────────────────────
  // Dados coletados pelo Atalho LINKA WiFi Context e associados a este
  // resultado. `undefined` = teste feito sem contexto Wi-Fi do atalho.
  wifiContext?: WifiContext;
}

export interface SpeedTestProgress {
  phase: TestPhase;
  instantMbps: number | null;
  overallProgress: number;
  partial?: Partial<SpeedTestResult>;
}

export interface ServerInfo {
  id: string;
  name: string;
  ip: string;
  colo: string;
  loc: string;
  isp: string;
  available: boolean;
}

export interface DeviceInfo {
  deviceType: DeviceType;
  connectionType: ConnectionType;
}

export interface TestRecord {
  id: string;
  timestamp: number;
  dl: number;
  ul: number;
  latency: number;
  jitter: number;
  packetLoss: number;
  serverName: string;
  isp?: string;
  deviceType: DeviceType;
  connectionType: ConnectionType;
  testMode?: SpeedTestMode;
  connectionProfile?: ConnectionProfile;
  ruleSetVersion?: RuleSetVersion;
  locationTag?: string;
  // Motor v2
  stabilityScore?: number;
  bufferbloatSeverity?: BufferbloatSeverity;
  diagnosticSummary?: string;
  peakDlMbps?: number;
  peakUlMbps?: number;
  // DNS feature (2026-05) — propagados de SpeedTestResult.
  dnsLatencyMs?: number | null;
  dnsResolverIp?: string | null;
  dnsProvider?: string | null;
  // Resultado parcial (2026-05) — propagado de SpeedTestResult.ulFailed.
  // Mantém o estado "upload não pôde ser medido" ao revisitar o teste pelo
  // histórico, evitando que `ul=0` seja exibido como "0,00 Mbps".
  ulFailed?: boolean;
  // Origem do packet loss (2026-05) — propagado de SpeedTestResult.
  // Permite que o histórico mostre o label "estimado" coerentemente ao
  // revisitar testes anteriores.
  packetLossSource?: 'native' | 'estimated';
  // Contexto Wi-Fi via Atalho iOS (2026-05) — propagado de SpeedTestResult.
  wifiContext?: WifiContext;
}

export interface Classification {
  primary: Quality;
  tags: Set<Tag>;
}

export interface ComparisonResult {
  downloadDropPercent: number;
  uploadDropPercent: number;
  latencyIncreasePercent: number;
  diagnosis: 'coverage_issue' | 'both_bad' | 'both_good' | 'other';
  message: string;
}

export type RecommendationAction =
  | 'repeat_test'
  | 'move_closer_router'
  | 'restart_router'
  | 'try_cable'
  | 'compare_location'
  | 'contact_operator'
  | 'run_proof_mode'
  | 'run_gamer_mode'
  | 'none';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionType: RecommendationAction;
}

// ── Combined Diagnosis ──────────────────────────────────────────────────────

export type CombinedDiagnosisCause =
  | 'healthy'
  | 'wifi_bottleneck'
  | 'operator_or_wan_issue'
  | 'local_wifi_risk'
  | 'mobile_network_issue'
  | 'mobile_signal_risk'
  | 'internet_issue'
  | 'inconclusive';

export interface CombinedDiagnosis {
  cause: CombinedDiagnosisCause;
  title: string;
  explanation: string;
  primaryAction: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface WifiDiagnosticResult {
  available: boolean;
  rssiDbm?: number;
  linkSpeedMbps?: number;
  band?: '2.4GHz' | '5GHz' | '6GHz';
  quality?: 'excellent' | 'good' | 'fair' | 'weak' | 'critical';
}

export interface MobileDiagnosticResult {
  available: boolean;
  carrierName?: string;
  radioType?: '3G' | '4G' | '5G' | 'unknown';
  signalLevel?: 'excellent' | 'good' | 'regular' | 'weak' | 'critical';
  rsrpDbm?: number;
  rsrqDb?: number;
  sinrDb?: number;
}

export interface CombineDiagnosticsInput {
  speed: SpeedTestResult;
  connectionType: ConnectionType;
  wifi?: WifiDiagnosticResult;
  mobile?: MobileDiagnosticResult;
}

// ── Contexto Wi-Fi via Atalho iOS ───────────────────────────────────────────
// Dados coletados pelo Atalho LINKA WiFi Context e devolvidos ao PWA via URL.
// Fase 1: recebidos por query string simples. Fase 2+: base64url-json.

export type WifiContextSource = 'ios-shortcut' | 'android-native' | 'manual' | 'unknown';

export interface WifiContext {
  version: number;
  source: WifiContextSource;
  sessionId: string;
  collectedAt: number;
  available: boolean;
  ssid?: string;
  bssid?: string;
  rssiDbm?: number;
  noiseDbm?: number;
  snrDb?: number;
  channel?: number;
  txRateMbps?: number;
  rxRateMbps?: number;
  linkSpeedMbps?: number;
  wifiStandard?: string;
  localIp?: string;
}
