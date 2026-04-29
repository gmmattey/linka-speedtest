export type Quality = 'excellent' | 'good' | 'fair' | 'slow' | 'unavailable';
export type Tag = 'highLatency' | 'lowUpload' | 'unstable' | 'packetLoss' | 'veryUnstable';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type ConnectionType = 'wifi' | 'mobile' | 'cable';
export type ConnectionProfile = 'fixed_broadband' | 'mobile_broadband';
export type RuleSetVersion = string; // semântica: 'v1', 'v2', etc.
export type SpeedTestMode = 'quick' | 'complete';
export type TestPhase = 'idle' | 'latency' | 'download' | 'upload' | 'done' | 'error';

export interface SpeedTestResult {
  dl: number;
  ul: number;
  latency: number;
  jitter: number;
  packetLoss: number;
  timestamp: number;
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
