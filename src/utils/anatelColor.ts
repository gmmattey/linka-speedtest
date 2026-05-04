import type { ConnectionProfile } from '../types';

/**
 * Cores semânticas Anatel para velocidade entregue vs contratada.
 *
 * Implementa as faixas de classificação de qualidade de banda larga
 * conforme a Resolução Anatel nº 717/2019 (Regulamento de Qualidade
 * dos Serviços de Telecomunicações — RQUAL):
 *
 * - **Banda larga fixa** (`fixed_broadband`): meta mensal mínima de
 *   80% da velocidade contratada (instantânea). 40% serve como piso
 *   abaixo do qual a entrega é considerada inaceitável.
 * - **Banda larga móvel** (`mobile_broadband`): meta mais permissiva —
 *   60% (mensal) com piso em 20% (instantâneo).
 *
 * O helper retorna uma `AnatelGrade` qualitativa (`good`/`warn`/`bad`),
 * traduzida para variáveis CSS de cor pela `anatelGradeColorVar()`.
 * Quando o plano contratado não foi cadastrado (ou é inválido), retorna
 * `null` — a UI deve cair no comportamento neutro (cor de marca, sem
 * semântica de entrega).
 *
 * Não depende de DOM/React — pura, testável com fixtures.
 *
 * Ver: `docs/DocumentacaoTecnicaSistema.md` §3.x (Anatel coloring).
 */

export type AnatelGrade = 'good' | 'warn' | 'bad';

/**
 * Avalia a velocidade entregue contra a contratada de acordo com o perfil
 * de conexão (fixa ou móvel) e os thresholds Anatel.
 *
 * @param deliveredMbps - velocidade medida (Mbps), valor absoluto.
 * @param contractedMbps - velocidade do plano (Mbps); `null`/`undefined`
 *   ou ≤ 0 desliga a avaliação.
 * @param profile - perfil regulatório (`fixed_broadband` |
 *   `mobile_broadband`). Quando `unknown`, trate como `fixed_broadband`
 *   no chamador (default conservador — alinhado a `toConnectionProfile`).
 * @returns `'good' | 'warn' | 'bad'` quando há dados suficientes; `null`
 *   quando o plano não está cadastrado ou a entrega é zero/negativa.
 */
export function anatelGrade(
  deliveredMbps: number,
  contractedMbps: number | null | undefined,
  profile: ConnectionProfile,
): AnatelGrade | null {
  if (contractedMbps == null || contractedMbps <= 0) return null;
  if (!isFinite(deliveredMbps) || deliveredMbps <= 0) return null;

  const pct = (deliveredMbps / contractedMbps) * 100;

  if (profile === 'mobile_broadband') {
    if (pct >= 60) return 'good';
    if (pct >= 20) return 'warn';
    return 'bad';
  }

  // fixed_broadband (default)
  if (pct >= 80) return 'good';
  if (pct >= 40) return 'warn';
  return 'bad';
}

/**
 * Mapeia uma `AnatelGrade` para o token CSS de cor correspondente.
 * Reutiliza os tokens semânticos já existentes (`--success`, `--warn`,
 * `--error`) — não cria novas variáveis.
 */
export function anatelGradeColorVar(grade: AnatelGrade): string {
  switch (grade) {
    case 'good': return 'var(--success)';
    case 'warn': return 'var(--warn)';
    case 'bad':  return 'var(--error)';
  }
}

/**
 * Mapeia uma `AnatelGrade` para o token CSS de glow correspondente.
 * Mantém paridade visual com os hero numbers atuais (que usam
 * `--dl-glow`/`--ul-glow` via `text-shadow`). Quando a UI tinge o número
 * com cor Anatel, troca o glow pelo da mesma família para evitar
 * "número verde com aura azul".
 */
export function anatelGradeGlowVar(grade: AnatelGrade): string {
  switch (grade) {
    case 'good': return 'var(--success-glow)';
    case 'warn': return 'var(--warn-glow)';
    case 'bad':  return 'var(--error-glow)';
  }
}
