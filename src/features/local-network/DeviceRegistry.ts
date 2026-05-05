import type {
  ClientIdentityProvider,
  DeviceConfidence,
  DeviceHostnameSource,
  DeviceKind,
  DeviceObservation,
  DeviceObservationSource,
  IdentifiedDevice,
} from './types';

const MAC_SEPARATORS = /[:-]/g;
const TECHNICAL_NETBIOS_NAMES = new Set(['WORKGROUP', 'MSHOME', '__MSBROWSE__']);

export function normalizeMac(mac?: string): string | undefined {
  if (!mac) return undefined;
  const normalized = mac.replace(MAC_SEPARATORS, '').toLowerCase();
  return /^[0-9a-f]{12}$/.test(normalized) ? normalized : undefined;
}

export function normalizeIp(ip?: string): string | undefined {
  if (!ip) return undefined;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return undefined;
  const numbers = parts.map((part) => Number(part));
  if (numbers.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return undefined;
  return numbers.join('.');
}

export function normalizeIdentityMap(input: Map<string, string>): Map<string, string> {
  const out = new Map<string, string>();
  for (const [rawKey, rawName] of input) {
    const name = cleanName(rawName);
    if (!name) continue;
    const mac = normalizeMac(rawKey);
    const ip = normalizeIp(rawKey);
    if (mac) out.set(mac, name);
    if (ip) out.set(ip, name);
  }
  return out;
}

export function observationsFromClientIdentities(input: Map<string, string>): DeviceObservation[] {
  const identities = normalizeIdentityMap(input);
  const observations: DeviceObservation[] = [];
  for (const [key, name] of identities) {
    const ip = normalizeIp(key);
    observations.push({
      ip: ip ?? '',
      mac: ip ? undefined : key,
      modemClientName: name,
      source: 'router',
      hostnameSource: 'router',
    });
  }
  return observations;
}

export async function observationsFromClientIdentityProvider(
  provider?: ClientIdentityProvider,
): Promise<DeviceObservation[]> {
  if (!provider) return [];
  return observationsFromClientIdentities(await provider.getClientIdentities());
}

export function mergeDeviceObservations(observations: DeviceObservation[]): IdentifiedDevice[] {
  const buckets = new Map<string, DeviceObservation[]>();
  const macToBucket = new Map<string, string>();
  const ipToBucket = new Map<string, string>();

  for (const observation of observations) {
    const ip = normalizeIp(observation.ip);
    const mac = normalizeMac(observation.mac);
    if (!ip && !mac) continue;

    const macBucket = mac ? macToBucket.get(mac) : undefined;
    const ipBucket = ip ? ipToBucket.get(ip) : undefined;
    const bucketKey = macBucket ?? ipBucket ?? mac ?? ip!;

    if (macBucket && ipBucket && macBucket !== ipBucket) {
      mergeBuckets(buckets, macToBucket, ipToBucket, macBucket, ipBucket);
    }

    const finalKey = macToBucket.get(mac ?? '') ?? ipToBucket.get(ip ?? '') ?? bucketKey;
    const list = buckets.get(finalKey) ?? [];
    list.push({ ...observation, ip: ip ?? observation.ip, mac: mac ?? observation.mac });
    buckets.set(finalKey, list);
    if (mac) macToBucket.set(mac, finalKey);
    if (ip) ipToBucket.set(ip, finalKey);
  }

  return [...buckets.values()]
    .map(buildIdentifiedDevice)
    .sort((a, b) => numericIp(a.ip).localeCompare(numericIp(b.ip)));
}

function mergeBuckets(
  buckets: Map<string, DeviceObservation[]>,
  macToBucket: Map<string, string>,
  ipToBucket: Map<string, string>,
  keep: string,
  drop: string,
): void {
  const keepList = buckets.get(keep) ?? [];
  const dropList = buckets.get(drop) ?? [];
  buckets.set(keep, [...keepList, ...dropList]);
  buckets.delete(drop);
  for (const [mac, bucket] of macToBucket) {
    if (bucket === drop) macToBucket.set(mac, keep);
  }
  for (const [ip, bucket] of ipToBucket) {
    if (bucket === drop) ipToBucket.set(ip, keep);
  }
}

function buildIdentifiedDevice(observations: DeviceObservation[]): IdentifiedDevice {
  const ip = firstValidIp(observations) ?? '0.0.0.0';
  const mac = firstValidMac(observations);
  const sources = uniqueSources(observations);
  const kind = chooseKind(observations);
  const vendor = chooseVendor(observations);
  const chosenName = chooseDisplayName(observations, vendor, kind, ip, mac);

  return {
    id: mac ?? ip,
    displayName: chosenName.name,
    ip,
    mac,
    vendor,
    kind,
    nameSource: chosenName.source,
    confidence: confidenceForSources(sources),
    sources,
  };
}

function chooseDisplayName(
  observations: DeviceObservation[],
  vendor: string | undefined,
  kind: DeviceKind,
  ip: string,
  mac?: string,
): { name: string; source: DeviceHostnameSource } {
  const candidates: Array<[DeviceHostnameSource, string | undefined]> = [
    ['userDefined', firstClean(observations.map((item) => item.userDefinedName))],
    ['router', firstClean(observations.map((item) => item.modemClientName))],
    ['ssdp', firstClean(observations.map((item) => item.friendlyName))],
    ['mdns', firstClean(observations.map((item) => item.mdnsName))],
    ['netbios', firstUsefulNetbiosName(observations)],
    ['dns', firstClean(observations.map((item) => item.hostname))],
  ];

  for (const [source, name] of candidates) {
    if (name) return { name, source };
  }

  if (vendor && kind !== 'unknown') {
    return { name: `${vendor} · ${kindLabel(kind)}`, source: 'vendor' };
  }
  if (vendor) return { name: vendor, source: 'vendor' };
  if (mac) return { name: mac, source: 'ip' };
  if (ip && ip !== '0.0.0.0') return { name: ip, source: 'ip' };
  return { name: 'Dispositivo desconhecido', source: 'ip' };
}

function firstClean(values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const clean = cleanName(value);
    if (clean) return clean;
  }
  return undefined;
}

function firstUsefulNetbiosName(observations: DeviceObservation[]): string | undefined {
  for (const value of observations.map((item) => item.netbiosName)) {
    const clean = cleanName(value);
    if (!clean) continue;
    if (TECHNICAL_NETBIOS_NAMES.has(clean.toUpperCase())) continue;
    if (/^[0-9A-F]{12,}$/i.test(clean)) continue;
    return clean;
  }
  return undefined;
}

function cleanName(value?: string): string | undefined {
  if (!value) return undefined;
  const clean = value.replace(/\0/g, '').trim();
  return clean.length > 0 ? clean : undefined;
}

function chooseKind(observations: DeviceObservation[]): DeviceKind {
  for (const observation of observations) {
    if (observation.kind && observation.kind !== 'unknown') return observation.kind;
  }

  const text = observations
    .flatMap((item) => [item.hostname, item.friendlyName, item.mdnsName, item.netbiosName, item.modemClientName, item.vendor])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (text.includes('router') || text.includes('gateway')) return 'router';
  if (text.includes('tv') || text.includes('chromecast') || text.includes('roku')) return 'tv';
  if (text.includes('iphone') || text.includes('android') || text.includes('galaxy') || text.includes('phone')) return 'phone';
  if (text.includes('printer') || text.includes('epson') || text.includes('hp ')) return 'printer';
  if (text.includes('camera')) return 'camera';
  if (text.includes('speaker') || text.includes('echo')) return 'speaker';
  if (text.includes('pc') || text.includes('notebook') || text.includes('desktop')) return 'computer';
  return 'unknown';
}

function chooseVendor(observations: DeviceObservation[]): string | undefined {
  return firstClean(observations.map((item) => item.vendor));
}

function confidenceForSources(sources: DeviceObservationSource[]): DeviceConfidence {
  if (sources.length >= 3) return 'confirmed';
  if (sources.length === 2) return 'medium';
  if (sources.length === 1 && sources[0] === 'cache') return 'inferred';
  return 'probable';
}

function uniqueSources(observations: DeviceObservation[]): DeviceObservationSource[] {
  return [...new Set(observations.map((item) => item.source))];
}

function firstValidIp(observations: DeviceObservation[]): string | undefined {
  for (const observation of observations) {
    const ip = normalizeIp(observation.ip);
    if (ip) return ip;
  }
  return undefined;
}

function firstValidMac(observations: DeviceObservation[]): string | undefined {
  for (const observation of observations) {
    const mac = normalizeMac(observation.mac);
    if (mac) return mac;
  }
  return undefined;
}

function kindLabel(kind: DeviceKind): string {
  switch (kind) {
    case 'phone': return 'celular';
    case 'computer': return 'computador';
    case 'tv': return 'TV';
    case 'router': return 'roteador';
    case 'printer': return 'impressora';
    case 'speaker': return 'caixa de som';
    case 'camera': return 'câmera';
    case 'iot': return 'dispositivo inteligente';
    case 'unknown':
    default: return 'dispositivo';
  }
}

function numericIp(ip: string): string {
  return ip.split('.').map((part) => part.padStart(3, '0')).join('.');
}
