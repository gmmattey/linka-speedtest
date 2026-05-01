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
  quality: Quality;
  tags: Tag[];
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
