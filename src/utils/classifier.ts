import type { Classification, Quality, RuleSetVersion, SpeedTestResult, Tag } from '../types';

export const RULE_SET_VERSION: RuleSetVersion = 'v1';

export function classify(r: SpeedTestResult): Classification {
  const tags = new Set<Tag>();

  if (r.latency > 80) tags.add('highLatency');
  if (r.ul < 5) tags.add('lowUpload');
  if (r.jitter > 50) tags.add('unstable');
  if (r.packetLoss > 2) { tags.add('packetLoss'); tags.add('unstable'); }
  if (r.packetLoss > 5 || r.jitter > 80) { tags.add('veryUnstable'); tags.add('unstable'); }

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

