export type Quality = 'excellent' | 'good' | 'fair' | 'slow' | 'unavailable';
export type Tag = 'highLatency' | 'lowUpload' | 'unstable' | 'packetLoss' | 'veryUnstable';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type ConnectionType = 'wifi' | 'mobile' | 'cable';
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
}

export interface Classification {
  primary: Quality;
  tags: Set<Tag>;
}
