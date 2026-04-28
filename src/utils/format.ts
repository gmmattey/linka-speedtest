export function formatMbps(v: number, unit: 'mbps' | 'gbps' = 'mbps'): string {
  if (!isFinite(v) || v <= 0) return '0';
  const n = unit === 'gbps' ? v / 1000 : v;
  if (unit === 'gbps') return n >= 1 ? n.toFixed(2) : n.toFixed(3);
  return n >= 100 ? Math.round(n).toString() : n.toFixed(1);
}

export function formatMs(v: number): string {
  if (!isFinite(v) || v <= 0) return '—';
  return Math.round(v).toString();
}

export function formatPercent(v: number): string {
  return `${Math.max(0, Math.min(100, Math.round(v)))}%`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yy = d.getFullYear();
  const hh = d.getHours().toString().padStart(2, '0');
  const mi = d.getMinutes().toString().padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

export function formatDateIsoLike(ts: number): string {
  const d = new Date(ts);
  const yy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function truncateIp(ip: string): string {
  if (!ip || ip === '—') return '—';
  if (ip.includes(':') && ip.length > 16) {
    const parts = ip.split(':');
    return `${parts.slice(0, 2).join(':')}:…:${parts[parts.length - 1]}`;
  }
  return ip;
}

export function deviceLabel(d: 'mobile' | 'tablet' | 'desktop', c: 'wifi' | 'mobile' | 'cable'): string {
  const dLabel = d === 'mobile' ? 'Celular' : d === 'tablet' ? 'Tablet' : 'PC';
  const cLabel = c === 'wifi' ? 'Wi-Fi' : c === 'mobile' ? 'Celular' : 'Cabo';
  return `${dLabel} · ${cLabel}`;
}
