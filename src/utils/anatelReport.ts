import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { TestRecord } from '../types';
import { formatDate, formatDateIsoLike, formatMbps, formatMs } from './format';

/**
 * anatelReport — detecção de elegibilidade + geração de PDF formal de
 * desempenho de banda larga, alinhado à Resolução Anatel 717/2019.
 *
 * Critérios da Resolução 717/2019 (banda larga fixa):
 *   - Velocidade média mensal ≥ 80% da contratada (download/upload).
 *   - Velocidade instantânea ≥ 40% da contratada em 95% das medições.
 *
 * Aqui usamos o critério mais simples e direto para o consumidor:
 * ENTREGA MÉDIA < 80% num período de 30 dias E pelo menos 5 testes.
 * O PDF entregue tem a tabela completa + estatísticas que reforçam o
 * argumento numa eventual reclamação formal (operadora / Procon / Anatel).
 *
 * Convenções:
 *   - "Entrega" = % download medido em relação ao contratado. Se o usuário
 *     não cadastrou plano (`contractedDl <= 0`), retorna `null`
 *     (não há base para comparar).
 *   - Janela: últimos 30 dias a partir de `now`.
 *   - Mínimo 5 testes na janela. Abaixo disso, amostra insuficiente.
 */

export interface AnatelComplaintData {
  contractedDownMbps: number;
  contractedUpMbps: number;
  testRecords: TestRecord[];
  /** Quantos testes ficaram abaixo de 80% do plano (download). */
  belowThresholdCount: number;
  /** Quantos testes ficaram abaixo de 40% do plano (download) — limite crítico. */
  belowCriticalCount: number;
  /** % média do plano entregue (download) na janela. */
  averageDeliveredPct: number;
  /** Janela considerada em dias. */
  windowDays: number;
}

const WINDOW_DAYS = 30;
const MIN_TESTS = 5;
const NORMAL_THRESHOLD = 80; // %
const CRITICAL_THRESHOLD = 40; // %
const DAY_MS = 24 * 3600 * 1000;

/**
 * Decide se o histórico do usuário, contra o plano contratado, configura
 * uma reclamação formal Anatel justificável.
 *
 * Retorna `null` quando:
 *   - `contractedDl <= 0`     (plano não cadastrado);
 *   - menos de 5 testes nos últimos 30 dias;
 *   - entrega média ≥ 80% (plano sendo cumprido).
 *
 * Caso contrário retorna o snapshot de evidências.
 */
export function isAnatelComplaintEligible(
  records: TestRecord[],
  contractedDl: number,
  contractedUl: number,
  now = Date.now(),
): AnatelComplaintData | null {
  if (!contractedDl || contractedDl <= 0) return null;

  const cutoff = now - WINDOW_DAYS * DAY_MS;
  const window = records.filter((r) => r.timestamp >= cutoff);
  if (window.length < MIN_TESTS) return null;

  let totalPct = 0;
  let belowThreshold = 0;
  let belowCritical = 0;

  for (const r of window) {
    const pct = (r.dl / contractedDl) * 100;
    totalPct += pct;
    if (pct < NORMAL_THRESHOLD) belowThreshold++;
    if (pct < CRITICAL_THRESHOLD) belowCritical++;
  }

  const averageDeliveredPct = totalPct / window.length;

  // Plano sendo cumprido — não há reclamação.
  if (averageDeliveredPct >= NORMAL_THRESHOLD) return null;

  return {
    contractedDownMbps: contractedDl,
    contractedUpMbps: contractedUl,
    testRecords: window,
    belowThresholdCount: belowThreshold,
    belowCriticalCount: belowCritical,
    averageDeliveredPct,
    windowDays: WINDOW_DAYS,
  };
}

// ── PDF generation ───────────────────────────────────────────────────────

const COLORS = {
  accent: '#6C2BFF',
  text: '#0D0D1A',
  muted: '#6B7280',
  border: '#E5E7EB',
  bg: '#F6F7F9',
  warn: '#D97706',
  error: '#DC2626',
  ok: '#16A34A',
};

// Fonte alinhada com o resto do app (PDF usa fontes locais via html2canvas).
const FONT = "'Geist',system-ui,sans-serif";

function formatPct(pct: number): string {
  return `${Math.round(pct)}%`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Gera o PDF formal de denúncia/relatório. Estruturado em A4 retrato:
 *
 *   1. Header — logo linka + título + linha "Resolução Anatel 717/2019".
 *   2. Identificação — operadora (do isp dominante), plano, período.
 *   3. Estatísticas — média, mediana, % entregue, contagens por threshold.
 *   4. Tabela cronológica — cada teste com data/hora, DL, UL, % do plano.
 *   5. Rodapé — instruções de uso + ressalva de aferição.
 */
export async function generateAnatelReport(
  data: AnatelComplaintData,
  isp: string | null,
): Promise<void> {
  const records = data.testRecords;
  const dlValues = records.map((r) => r.dl);
  const ulValues = records.map((r) => r.ul);
  const meanDl = dlValues.reduce((a, b) => a + b, 0) / dlValues.length;
  const meanUl = ulValues.reduce((a, b) => a + b, 0) / ulValues.length;
  const medianDl = median(dlValues);
  const medianUl = median(ulValues);

  const periodStart = Math.min(...records.map((r) => r.timestamp));
  const periodEnd   = Math.max(...records.map((r) => r.timestamp));
  const generatedAt = Date.now();

  // Tabela cronológica — ordem cronológica crescente (mais antigo no topo).
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const rows = sorted.map((r) => {
    const pct = (r.dl / data.contractedDownMbps) * 100;
    const pctColor = pct < CRITICAL_THRESHOLD ? COLORS.error
                    : pct < NORMAL_THRESHOLD  ? COLORS.warn
                    : COLORS.ok;
    return `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid ${COLORS.border};">${formatDate(r.timestamp)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid ${COLORS.border};text-align:right;">${formatMbps(r.dl)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid ${COLORS.border};text-align:right;">${formatMbps(r.ul)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid ${COLORS.border};text-align:right;">${formatMs(r.latency)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid ${COLORS.border};text-align:right;color:${pctColor};font-weight:600;">${formatPct(pct)}</td>
      </tr>
    `;
  }).join('');

  const node = document.createElement('div');
  node.style.cssText = `position:fixed;left:-9999px;top:0;width:780px;padding:40px;background:#FFFFFF;color:${COLORS.text};font-family:${FONT};font-size:13px;`;
  node.innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;border-bottom:2px solid ${COLORS.accent};padding-bottom:14px;">
      <div>
        <div style="font-family:${FONT};font-weight:700;font-size:24px;letter-spacing:-0.03em;color:${COLORS.accent};">linka</div>
        <div style="font-size:10px;color:${COLORS.muted};margin-top:2px;">SpeedTest — relatório de desempenho</div>
      </div>
      <div style="text-align:right;font-size:10px;color:${COLORS.muted};line-height:1.5;">
        Gerado em ${formatDate(generatedAt)}<br/>
        Resolução Anatel 717/2019
      </div>
    </div>

    <!-- Title -->
    <h1 style="margin:0 0 6px;font-family:${FONT};font-size:18px;font-weight:700;color:${COLORS.text};">
      Relatório de Desempenho de Banda Larga
    </h1>
    <p style="margin:0 0 24px;color:${COLORS.muted};font-size:12px;">
      Documento de evidência para reclamação formal de entrega abaixo do contratado.
    </p>

    <!-- Identification -->
    <section style="margin-bottom:20px;background:${COLORS.bg};border-radius:8px;padding:14px 16px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;">
        <div>
          <div style="color:${COLORS.muted};font-size:10px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Provedor</div>
          <div style="font-weight:600;color:${COLORS.text};">${isp && isp !== '—' ? isp : 'Não identificado'}</div>
        </div>
        <div>
          <div style="color:${COLORS.muted};font-size:10px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Período avaliado</div>
          <div style="font-weight:600;color:${COLORS.text};">${formatDate(periodStart)} a ${formatDate(periodEnd)}</div>
        </div>
        <div>
          <div style="color:${COLORS.muted};font-size:10px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Plano contratado</div>
          <div style="font-weight:600;color:${COLORS.text};">↓ ${formatMbps(data.contractedDownMbps)} Mbps · ↑ ${formatMbps(data.contractedUpMbps)} Mbps</div>
        </div>
        <div>
          <div style="color:${COLORS.muted};font-size:10px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Janela analisada</div>
          <div style="font-weight:600;color:${COLORS.text};">${data.windowDays} dias · ${records.length} medições</div>
        </div>
      </div>
    </section>

    <!-- Headline statistic -->
    <section style="margin-bottom:24px;background:${COLORS.bg};border-left:4px solid ${COLORS.error};border-radius:8px;padding:14px 18px;">
      <div style="font-family:${FONT};font-weight:700;font-size:16px;color:${COLORS.error};">
        Entrega média: ${formatPct(data.averageDeliveredPct)} do plano contratado
      </div>
      <div style="margin-top:4px;color:${COLORS.muted};font-size:12px;line-height:1.5;">
        A Resolução Anatel 717/2019 estabelece que a velocidade média mensal de download deve
        ser de pelo menos 80% da contratada. ${data.belowThresholdCount} de ${records.length}
        medições ficaram abaixo desse limiar; ${data.belowCriticalCount} ficaram abaixo de 40%
        (situação crítica).
      </div>
    </section>

    <!-- Statistics grid -->
    <section style="margin-bottom:24px;">
      <div style="font-family:${FONT};font-weight:600;font-size:14px;margin-bottom:10px;color:${COLORS.text};">
        Estatísticas das medições
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
        <div style="border:1px solid ${COLORS.border};border-radius:8px;padding:10px 12px;">
          <div style="font-size:10px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.06em;">↓ Média</div>
          <div style="font-weight:700;font-size:16px;margin-top:2px;">${formatMbps(meanDl)} <span style="font-size:11px;color:${COLORS.muted};font-weight:400;">Mbps</span></div>
        </div>
        <div style="border:1px solid ${COLORS.border};border-radius:8px;padding:10px 12px;">
          <div style="font-size:10px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.06em;">↓ Mediana</div>
          <div style="font-weight:700;font-size:16px;margin-top:2px;">${formatMbps(medianDl)} <span style="font-size:11px;color:${COLORS.muted};font-weight:400;">Mbps</span></div>
        </div>
        <div style="border:1px solid ${COLORS.border};border-radius:8px;padding:10px 12px;">
          <div style="font-size:10px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.06em;">↑ Média</div>
          <div style="font-weight:700;font-size:16px;margin-top:2px;">${formatMbps(meanUl)} <span style="font-size:11px;color:${COLORS.muted};font-weight:400;">Mbps</span></div>
        </div>
        <div style="border:1px solid ${COLORS.border};border-radius:8px;padding:10px 12px;">
          <div style="font-size:10px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.06em;">↑ Mediana</div>
          <div style="font-weight:700;font-size:16px;margin-top:2px;">${formatMbps(medianUl)} <span style="font-size:11px;color:${COLORS.muted};font-weight:400;">Mbps</span></div>
        </div>
      </div>
    </section>

    <!-- Detail table -->
    <section style="margin-bottom:24px;">
      <div style="font-family:${FONT};font-weight:600;font-size:14px;margin-bottom:10px;color:${COLORS.text};">
        Medições registradas
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
          <tr style="background:${COLORS.bg};color:${COLORS.muted};">
            <th style="padding:8px;text-align:left;font-weight:600;">Data</th>
            <th style="padding:8px;text-align:right;font-weight:600;">↓ Download</th>
            <th style="padding:8px;text-align:right;font-weight:600;">↑ Upload</th>
            <th style="padding:8px;text-align:right;font-weight:600;">Latência</th>
            <th style="padding:8px;text-align:right;font-weight:600;">% do plano</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>

    <!-- Footer / instructions -->
    <section style="margin-top:32px;padding-top:16px;border-top:1px solid ${COLORS.border};color:${COLORS.muted};font-size:10px;line-height:1.5;">
      <p style="margin:0 0 6px;">
        <strong style="color:${COLORS.text};">Como usar este documento:</strong>
        anexe-o à reclamação formal junto à operadora (protocolo obrigatório por 30 dias),
        ao Procon (consumidor.gov.br) ou à Anatel (anatel.gov.br/consumidor). Mencione
        explicitamente os artigos da Resolução 717/2019 sobre velocidade mínima de entrega.
      </p>
      <p style="margin:0;">
        Medições realizadas via Cloudflare Speed Test pelo aplicativo linka SpeedTest.
        Não substitui a aferição oficial via EAQ (Entidade Aferidora da Qualidade) da Anatel —
        serve como prova circunstancial robusta na análise da reclamação.
      </p>
    </section>
  `;

  document.body.appendChild(node);
  try {
    const canvas = await html2canvas(node, { backgroundColor: '#FFFFFF', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth  = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio  = canvas.height / canvas.width;
    const imgWidth  = pageWidth - 48;
    const imgHeight = imgWidth * ratio;

    if (imgHeight <= pageHeight - 48) {
      pdf.addImage(imgData, 'PNG', 24, 24, imgWidth, imgHeight);
    } else {
      // Conteúdo excede 1 página — particiona via cropping. jsPDF não tem
      // multi-page direto, então adicionamos a imagem em escala que
      // permite N páginas. Estratégia simples: várias addImage com offset
      // negativo de Y, cada page renderizando a "fatia" visível.
      const pages = Math.ceil(imgHeight / (pageHeight - 48));
      for (let i = 0; i < pages; i++) {
        if (i > 0) pdf.addPage();
        const y = 24 - i * (pageHeight - 48);
        pdf.addImage(imgData, 'PNG', 24, y, imgWidth, imgHeight);
      }
    }

    pdf.save(`linka-anatel-${formatDateIsoLike(generatedAt)}.pdf`);
  } finally {
    node.remove();
  }
}
