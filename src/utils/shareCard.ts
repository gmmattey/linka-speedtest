import type { SpeedTestResult } from '../types';
import type { Quality } from '../types';
import { formatMbps, formatMs, formatDate } from './format';

const W = 1080;
const H = 540;

const QUALITY_COLOR: Record<Quality, string> = {
  excellent: '#22C55E',
  good:      '#22C55E',
  fair:      '#F5A623',
  slow:      '#FF4D4F',
  unavailable: '#FF4D4F',
};

const QUALITY_LABEL: Record<Quality, string> = {
  excellent:   'Excelente',
  good:        'Boa',
  fair:        'Regular',
  slow:        'Lenta',
  unavailable: 'Indisponível',
};

export async function generateShareCard(
  result: SpeedTestResult,
  quality: Quality,
  unit: 'mbps' | 'gbps' = 'mbps',
): Promise<Blob> {
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0E0E12';
  ctx.fillRect(0, 0, W, H);

  // Accent top bar
  ctx.fillStyle = '#6C2BFF';
  ctx.fillRect(0, 0, W, 6);

  // Header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 32px "Geist", sans-serif';
  ctx.fillText('linka SpeedTest', 60, 80);

  // Quality badge
  const accentColor = QUALITY_COLOR[quality];
  const qualityLabel = QUALITY_LABEL[quality];
  ctx.fillStyle = accentColor + '22';
  ctx.beginPath();
  ctx.roundRect(60, 100, 160, 44, 22);
  ctx.fill();
  ctx.fillStyle = accentColor;
  ctx.font = '600 22px "Inter", sans-serif';
  ctx.fillText(qualityLabel, 80, 128);

  // DL / UL large numbers
  const unitLabel = unit === 'gbps' ? 'Gbps' : 'Mbps';

  ctx.fillStyle = '#3AB6FF';
  ctx.font = '700 96px "Geist", sans-serif';
  ctx.fillText(formatMbps(result.dl, unit), 60, 270);
  ctx.fillStyle = '#8BCFFF';
  ctx.font = '500 28px "Geist", sans-serif';
  ctx.fillText(`↓ Download · ${unitLabel}`, 60, 310);

  ctx.fillStyle = '#22C55E';
  ctx.font = '700 96px "Geist", sans-serif';
  ctx.fillText(formatMbps(result.ul, unit), 560, 270);
  ctx.fillStyle = '#86EFAC';
  ctx.font = '500 28px "Geist", sans-serif';
  ctx.fillText(`↑ Upload · ${unitLabel}`, 560, 310);

  // Divider
  ctx.strokeStyle = '#2A2A35';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 350);
  ctx.lineTo(W - 60, 350);
  ctx.stroke();

  // Secondary metrics
  ctx.fillStyle = '#A0A0B0';
  ctx.font = '500 26px "Inter", sans-serif';
  ctx.fillText(`Resposta  ${formatMs(result.latency)} ms`, 60, 410);
  ctx.fillText(`Oscilação  ${formatMs(result.jitter)} ms`, 400, 410);
  ctx.fillText(`Perda  ${result.packetLoss.toFixed(1)}%`, 720, 410);

  // Footer
  ctx.fillStyle = '#505060';
  ctx.font = '400 22px "Inter", sans-serif';
  ctx.fillText(formatDate(result.timestamp), 60, 490);
  ctx.fillStyle = '#6C2BFF';
  ctx.font = '600 22px "Geist", sans-serif';
  ctx.fillText('linka.app', W - 200, 490);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('toBlob failed'));
    }, 'image/png');
  });
}
