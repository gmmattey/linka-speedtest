import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { SpeedTestResult, TestRecord } from '../types';
import { interpretSpeedTestResult, resolveCopy } from '../core';
import { formatMbps, formatMs, formatDate, formatDateIsoLike } from './format';

async function loadLogoBase64(): Promise<string | null> {
  try {
    const resp = await fetch('/logo.png');
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const COLORS = {
  accent: '#6C2BFF',
  dl: '#3AB6FF',
  ul: '#22C55E',
  text: '#0D0D1A',
  muted: '#6B7280',
  border: '#E5E7EB',
  bg: '#F6F7F9',
};

export async function exportResultPdf(result: SpeedTestResult, serverName: string, isp?: string) {
  const interpreted = interpretSpeedTestResult({ metrics: result, profile: 'fixed_broadband' });
  const logoB64 = await loadLogoBase64();

  const node = document.createElement('div');
  node.style.cssText = 'position:fixed;left:-9999px;top:0;width:720px;padding:40px;background:#FFFFFF;color:#0D0D1A;font-family:Geist,system-ui,sans-serif;font-size:14px;';

  const logoHtml = logoB64
    ? `<img src="${logoB64}" style="height:28px;width:auto;" alt="linka" />`
    : `<div style="font-family:'Geist',sans-serif;font-weight:700;font-size:22px;letter-spacing:-0.5px;color:${COLORS.accent}">linka SpeedTest</div>`;

  node.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
      ${logoHtml}
      <div style="color:${COLORS.muted};font-size:12px;">${formatDate(result.timestamp)}</div>
    </div>
    <div style="background:${COLORS.bg};border-left:4px solid ${COLORS.accent};padding:16px 20px;border-radius:8px;margin-bottom:24px;">
      <div style="font-family:'Geist',sans-serif;font-weight:700;font-size:18px;">${resolveCopy(interpreted.copyKeys.headlineKey)}</div>
      <div style="color:${COLORS.muted};font-size:12px;margin-top:4px;">Servidor: ${serverName}${isp && isp !== '—' ? ' · ' + isp : ''}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
      <div>
        <div style="color:${COLORS.muted};font-size:12px;margin-bottom:4px;">Download</div>
        <div style="font-family:'Geist',sans-serif;font-weight:700;font-size:36px;color:${COLORS.dl};">${formatMbps(result.dl)} <span style="font-size:14px;color:${COLORS.muted};">Mbps</span></div>
      </div>
      <div>
        <div style="color:${COLORS.muted};font-size:12px;margin-bottom:4px;">Upload</div>
        <div style="font-family:'Geist',sans-serif;font-weight:700;font-size:36px;color:${COLORS.ul};">${formatMbps(result.ul)} <span style="font-size:14px;color:${COLORS.muted};">Mbps</span></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;padding-top:16px;border-top:1px solid ${COLORS.border};">
      <div><div style="color:${COLORS.muted};font-size:11px;">Resposta</div><div style="font-family:'Geist',sans-serif;font-weight:600;font-size:18px;">${formatMs(result.latency)} ms</div></div>
      <div><div style="color:${COLORS.muted};font-size:11px;">Oscilação</div><div style="font-family:'Geist',sans-serif;font-weight:600;font-size:18px;">${formatMs(result.jitter)} ms</div></div>
      <div><div style="color:${COLORS.muted};font-size:11px;">Estabilidade</div><div style="font-family:'Geist',sans-serif;font-weight:600;font-size:18px;">${resolveCopy(interpreted.copyKeys.stabilityLabelKey)}</div></div>
    </div>
    <div style="margin-bottom:24px;">
      <div style="font-family:'Geist',sans-serif;font-weight:600;font-size:15px;margin-bottom:8px;">O que isso significa?</div>
      ${interpreted.copyKeys.diagnosisKeys.map((k) => resolveCopy(k)).map((p) => `<p style="margin:0 0 8px 0;line-height:1.5;">${p}</p>`).join('')}
    </div>
    <div style="margin-top:32px;color:#9CA3AF;font-size:11px;">Gerado por linka SpeedTest · linka.app · ${formatDate(result.timestamp)}</div>
  `;

  document.body.appendChild(node);
  try {
    const canvas = await html2canvas(node, { backgroundColor: '#FFFFFF', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth  = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio      = canvas.height / canvas.width;
    const imgWidth   = pageWidth - 48;
    const imgHeight  = imgWidth * ratio;
    pdf.addImage(imgData, 'PNG', 24, 24, imgWidth, Math.min(imgHeight, pageHeight - 48));
    pdf.save(`linka-speedtest-${formatDateIsoLike(result.timestamp)}.pdf`);
  } finally {
    node.remove();
  }
}

export async function exportHistoryPdf(items: TestRecord[]) {
  if (items.length === 0) return;
  const logoB64 = await loadLogoBase64();

  const n = items.length;
  const avgDl  = items.reduce((s, r) => s + r.dl, 0)         / n;
  const avgUl  = items.reduce((s, r) => s + r.ul, 0)         / n;
  const avgLat = items.reduce((s, r) => s + r.latency, 0)    / n;
  const avgJit = items.reduce((s, r) => s + r.jitter, 0)     / n;
  const avgLos = items.reduce((s, r) => s + r.packetLoss, 0) / n;
  const avgInterpreted = interpretSpeedTestResult({ metrics: { dl: avgDl, ul: avgUl, latency: avgLat, jitter: avgJit, packetLoss: avgLos, timestamp: 0 }, profile: 'fixed_broadband' });

  const rows = items.map((r) => `
    <tr>
      <td>${formatDate(r.timestamp)}</td>
      <td style="color:${COLORS.dl}">${formatMbps(r.dl)}</td>
      <td style="color:${COLORS.ul}">${formatMbps(r.ul)}</td>
      <td>${formatMs(r.latency)}</td>
      <td>${formatMs(r.jitter)}</td>
      <td>${r.packetLoss.toFixed(1)}%</td>
      <td>${resolveCopy(`quality.${r.quality}`)}</td>
      <td>${r.isp && r.isp !== '—' ? r.isp : '—'}</td>
    </tr>`).join('');

  const logoHtml = logoB64
    ? `<img src="${logoB64}" style="height:28px;width:auto;" alt="linka" />`
    : `<div style="font-family:'Geist',sans-serif;font-weight:700;font-size:22px;color:${COLORS.accent}">linka SpeedTest</div>`;

  const node = document.createElement('div');
  node.style.cssText = 'position:fixed;left:-9999px;top:0;width:960px;padding:40px;background:#FFFFFF;color:#0D0D1A;font-family:Geist,system-ui,sans-serif;font-size:12px;';
  node.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
      ${logoHtml}
      <div style="color:${COLORS.muted};font-size:12px;">Histórico de testes · ${n} registro${n > 1 ? 's' : ''}</div>
    </div>
    <div style="background:${COLORS.bg};border-left:4px solid ${COLORS.accent};padding:14px 18px;border-radius:8px;margin-bottom:24px;">
      <div style="font-family:'Geist',sans-serif;font-weight:700;font-size:16px;">${resolveCopy(avgInterpreted.copyKeys.headlineKey)} — média</div>
      <div style="color:${COLORS.muted};font-size:12px;margin-top:4px;">
        ↓ ${formatMbps(avgDl)} Mbps · ↑ ${formatMbps(avgUl)} Mbps · Resposta ${formatMs(avgLat)} ms
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="border-bottom:2px solid ${COLORS.border};color:${COLORS.muted};">
          <th style="text-align:left;padding:6px 4px;">Data</th>
          <th style="text-align:right;padding:6px 4px;">↓ DL</th>
          <th style="text-align:right;padding:6px 4px;">↑ UL</th>
          <th style="text-align:right;padding:6px 4px;">Resp.</th>
          <th style="text-align:right;padding:6px 4px;">Oscil.</th>
          <th style="text-align:right;padding:6px 4px;">Perda</th>
          <th style="text-align:left;padding:6px 4px;">Qualidade</th>
          <th style="text-align:left;padding:6px 4px;">Operadora</th>
        </tr>
      </thead>
      <tbody style="font-family:'Geist',sans-serif;">${rows}</tbody>
    </table>
    <div style="margin-top:32px;color:#9CA3AF;font-size:10px;">Gerado por linka SpeedTest · linka.app</div>
  `;

  document.body.appendChild(node);
  try {
    const canvas = await html2canvas(node, { backgroundColor: '#FFFFFF', scale: 1.5 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
    const pageWidth  = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio      = canvas.height / canvas.width;
    const imgWidth   = pageWidth - 48;
    const imgHeight  = imgWidth * ratio;
    pdf.addImage(imgData, 'PNG', 24, 24, imgWidth, Math.min(imgHeight, pageHeight - 48));
    pdf.save(`linka-speedtest-historico-${formatDateIsoLike(Date.now())}.pdf`);
  } finally {
    node.remove();
  }
}
