import type { Quality, SpeedTestResult } from '../types';
import { formatMbps, formatMs, formatDate } from './format';

// Card quadrado 1080×1080 — formato amigável para feeds (Instagram,
// WhatsApp Status). Refatorado no Bloco 3 (Polimento, 2026-05) para
// destacar a headline qualitativa e os 4 números do hero.
const W = 1080;
const H = 1080;

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

const ACCENT = '#6C2BFF';
const BG     = '#0E0E12';
const SURFACE = '#16161E';
const BORDER = '#262630';
const TEXT   = '#FFFFFF';
const TEXT_2 = '#A0A0B0';
const TEXT_3 = '#5E5E70';
const DL     = '#3AB6FF';
const UL     = '#22C55E';

interface ShareCardOptions {
  /** Headline qualitativa (ex.: "Conexão excelente"). Se omitida, usa o label da quality. */
  headline?: string;
  /** Operadora detectada (ex.: "Vivo Fibra"). Mostrada no rodapé. */
  isp?: string | null;
}

/**
 * Gera um PNG 1080×1080 com o resultado do teste, pronto para compartilhar.
 * Usa Canvas API direto (sem html2canvas) — mais previsível com fontes web
 * e independe de o DOM estar montado.
 */
export async function generateShareCard(
  result: SpeedTestResult,
  quality: Quality,
  unit: 'mbps' | 'gbps' = 'mbps',
  options: ShareCardOptions = {},
): Promise<Blob> {
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Accent top bar
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, W, 8);

  // Logo "linka SpeedTest" topo
  ctx.fillStyle = TEXT;
  ctx.font = '700 36px "Geist", sans-serif';
  ctx.fillText('linka', 80, 110);
  ctx.fillStyle = TEXT_2;
  ctx.font = '500 28px "Geist", sans-serif';
  ctx.fillText('SpeedTest', 200, 110);

  // Quality chip (alinhado à direita)
  const qColor = QUALITY_COLOR[quality];
  const qLabel = QUALITY_LABEL[quality];
  ctx.font = '600 22px "Geist", sans-serif';
  const qTextW = ctx.measureText(qLabel).width;
  const chipW = qTextW + 40;
  const chipH = 44;
  const chipX = W - 80 - chipW;
  const chipY = 78;
  ctx.fillStyle = qColor + '22';
  ctx.beginPath();
  ctx.roundRect(chipX, chipY, chipW, chipH, 22);
  ctx.fill();
  ctx.fillStyle = qColor;
  ctx.fillText(qLabel, chipX + 20, chipY + 30);

  // Headline qualitativa grande (centro vertical superior)
  const headline = options.headline ?? `Conexão ${qLabel.toLowerCase()}`;
  ctx.fillStyle = TEXT;
  ctx.font = '700 64px "Geist", sans-serif';
  // Quebra em duas linhas se passar de 920px
  wrapText(ctx, headline, 80, 240, 920, 76);

  // Bloco dos 4 números — grid 2×2 dentro de 4 cards
  const cardW = (W - 80 * 2 - 40) / 2;  // 80 padding lateral, 40 gap
  const cardH = 200;
  const startY = 400;
  drawMetric(ctx, 80,                 startY,           cardW, cardH, 'DOWNLOAD',  formatMbps(result.dl, unit), unit === 'gbps' ? 'Gbps' : 'Mbps', DL);
  drawMetric(ctx, 80 + cardW + 40,    startY,           cardW, cardH, 'UPLOAD',    formatMbps(result.ul, unit), unit === 'gbps' ? 'Gbps' : 'Mbps', UL);
  drawMetric(ctx, 80,                 startY + cardH + 24, cardW, cardH, 'RESPOSTA',  formatMs(result.latency), 'ms', TEXT);
  drawMetric(ctx, 80 + cardW + 40,    startY + cardH + 24, cardW, cardH, 'OSCILAÇÃO', formatMs(result.jitter),  'ms', TEXT);

  // Rodapé: ISP + timestamp esquerda, linka.app direita
  const footerY = H - 80;
  ctx.fillStyle = TEXT_3;
  ctx.font = '500 22px "Geist", sans-serif';
  const isp = options.isp && options.isp !== '—' ? options.isp : null;
  const stamp = formatDate(result.timestamp);
  const footerLeft = isp ? `${isp}  ·  ${stamp}` : stamp;
  ctx.fillText(footerLeft, 80, footerY);
  ctx.fillStyle = ACCENT;
  ctx.font = '600 22px "Geist", sans-serif';
  const right = 'linka.app';
  const rightW = ctx.measureText(right).width;
  ctx.fillText(right, W - 80 - rightW, footerY);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('toBlob failed'));
    }, 'image/png');
  });
}

function drawMetric(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  label: string, value: string, unit: string, color: string,
): void {
  // Card surface
  ctx.fillStyle = SURFACE;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 24);
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Label
  ctx.fillStyle = TEXT_3;
  ctx.font = '600 20px "Geist", sans-serif';
  ctx.fillText(label, x + 28, y + 44);

  // Value
  ctx.fillStyle = color;
  ctx.font = '700 84px "Geist", sans-serif';
  ctx.fillText(value, x + 28, y + 132);

  // Unit
  ctx.fillStyle = TEXT_2;
  ctx.font = '500 24px "Geist", sans-serif';
  ctx.fillText(unit, x + 28, y + 170);
}

/** Quebra texto em múltiplas linhas dentro de uma largura máxima. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  maxWidth: number, lineHeight: number,
): void {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    const w = ctx.measureText(test).width;
    if (w > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = words[i];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
