/**
 * Perfis de threshold do motor unificado.
 *
 * Dois eixos regulatórios Anatel:
 * - `fixed_broadband`: paridade obrigatória com `src/utils/classifier.ts`
 *   (Fase 1). Bump de `RULE_SET_VERSION` só quando divergir.
 * - `mobile_broadband`: download/upload exigem ~50% do que a fixa exige;
 *   latência tolera +30 ms; jitter e perda iguais (não há razão regulatória
 *   para afrouxar).
 *
 * Cada threshold tem comentário com a fonte (paridade legacy ou dedução móvel).
 */

import type { ConnectionProfile } from '../types';

export interface QualityThresholds {
  excellent: { dl: number; ul: number; latency: number; jitter: number; packetLoss: number };
  good:      { dl: number; ul: number; latency: number; jitter: number; packetLoss: number };
  fair:      { dl: number; ul: number; latency: number; packetLoss: number };
}

export interface FlagThresholds {
  highLatency: number;
  lowUpload: number;
  unstable: number;
  packetLoss: number;
  veryUnstable: number;
}

/**
 * Em todos os use cases, `good` e `maybe` olham as métricas relevantes ao
 * cenário. `limited` é o complemento (não cabe em `maybe`).
 *
 * Streaming 4K, Home Office e Video Call agora consideram **jitter e perda**
 * (achado da auditoria: download alto com perda de 8% não pode ser "bom para
 * streaming 4K").
 */
export interface UseCaseThresholds {
  gaming: {
    good:  { dl: number; latency: number; jitter: number; packetLoss: number };
    maybe: { dl: number; latency: number; jitter: number; packetLoss: number };
  };
  streaming_4k: {
    good:  { dl: number; jitter: number; packetLoss: number };
    maybe: { dl: number; jitter: number; packetLoss: number };
  };
  home_office: {
    good:  { dl: number; ul: number; latency: number; jitter: number; packetLoss: number };
    maybe: { dl: number; ul: number; latency: number; jitter: number; packetLoss: number };
  };
  video_call: {
    good:  { dl: number; ul: number; latency: number; jitter: number; packetLoss: number };
    maybe: { dl: number; ul: number; latency: number; jitter: number; packetLoss: number };
  };
}

export interface ProfileRules {
  quality: QualityThresholds;
  flags: FlagThresholds;
  useCases: UseCaseThresholds;
}

// =============================================================================
// fixed_broadband — paridade com classifier.ts legado (Fase 1)
// =============================================================================

const FIXED_BROADBAND: ProfileRules = {
  quality: {
    // Legacy: r.dl >= 100 && r.ul >= 30 && r.latency <= 30 && r.jitter <= 5 && r.packetLoss <= 0.5
    excellent: { dl: 100, ul: 30, latency: 30, jitter: 5,  packetLoss: 0.5 },
    // Legacy: r.dl >= 50 && r.ul >= 10 && r.latency <= 60 && r.jitter <= 15 && r.packetLoss <= 1.5
    good:      { dl: 50,  ul: 10, latency: 60, jitter: 15, packetLoss: 1.5 },
    // Legacy: r.dl >= 10 && r.ul >= 3 && r.latency <= 100 && r.packetLoss <= 2 (sem cap de jitter)
    fair:      { dl: 10,  ul: 3,  latency: 100, packetLoss: 2 },
  },
  flags: {
    // Legacy: r.latency > 80
    highLatency: 80,
    // Legacy: r.ul < 5 (motor compara ul < threshold)
    lowUpload: 5,
    // Legacy: r.jitter > 50
    unstable: 50,
    // Legacy: r.packetLoss > 2
    packetLoss: 2,
    // Legacy: r.jitter > 80 (motor combina com packetLoss > 5; ver interpret.ts)
    veryUnstable: 80,
  },
  useCases: {
    // Paridade com USE_CASES.games em ResultScreen.tsx (legacy)
    gaming: {
      good:  { dl: 10, latency: 40, jitter: 20, packetLoss: 0.5 },
      maybe: { dl: 5,  latency: 80, jitter: 40, packetLoss: 2 },
    },
    // Paridade legacy + jitter/loss adicionados (achado #3): 4K com perda alta cai
    streaming_4k: {
      good:  { dl: 25, jitter: 30, packetLoss: 1 },
      maybe: { dl: 10, jitter: 50, packetLoss: 3 },
    },
    // Paridade legacy + jitter/loss adicionados
    home_office: {
      good:  { dl: 10, ul: 5, latency: 100, jitter: 30, packetLoss: 1 },
      maybe: { dl: 5,  ul: 2, latency: 150, jitter: 50, packetLoss: 2 },
    },
    // Paridade legacy
    video_call: {
      good:  { dl: 5, ul: 2, latency: 100, jitter: 30, packetLoss: 1 },
      maybe: { dl: 2, ul: 1, latency: 150, jitter: 50, packetLoss: 3 },
    },
  },
};

// =============================================================================
// mobile_broadband — deflate de banda, latência +30 ms, jitter/perda iguais
// =============================================================================

const MOBILE_BROADBAND: ProfileRules = {
  quality: {
    // Dedução móvel: dl/ul ~50% da fixa, lat +30 ms, jitter/loss iguais
    excellent: { dl: 50, ul: 15, latency: 60,  jitter: 5,  packetLoss: 0.5 },
    good:      { dl: 25, ul: 5,  latency: 90,  jitter: 15, packetLoss: 1.5 },
    fair:      { dl: 5,  ul: 1.5, latency: 130, packetLoss: 2 },
  },
  flags: {
    // Dedução móvel: lat +30 ms
    highLatency: 110,
    // Dedução móvel: lowUpload deflacionado a metade (5 → 2.5)
    lowUpload: 2.5,
    // Iguais à fixa (jitter e perda independem de regulação fixa/móvel)
    unstable: 50,
    packetLoss: 2,
    veryUnstable: 80,
  },
  useCases: {
    // Dedução móvel: dl reduz à metade, lat +30 ms, jitter/loss iguais
    gaming: {
      good:  { dl: 5,   latency: 70,  jitter: 20, packetLoss: 0.5 },
      maybe: { dl: 2.5, latency: 110, jitter: 40, packetLoss: 2 },
    },
    streaming_4k: {
      good:  { dl: 12.5, jitter: 30, packetLoss: 1 },
      maybe: { dl: 5,    jitter: 50, packetLoss: 3 },
    },
    home_office: {
      good:  { dl: 5,   ul: 2.5, latency: 130, jitter: 30, packetLoss: 1 },
      maybe: { dl: 2.5, ul: 1,   latency: 180, jitter: 50, packetLoss: 2 },
    },
    video_call: {
      good:  { dl: 2.5, ul: 1,   latency: 130, jitter: 30, packetLoss: 1 },
      maybe: { dl: 1,   ul: 0.5, latency: 180, jitter: 50, packetLoss: 3 },
    },
  },
};

// =============================================================================
// Mapa público
// =============================================================================

export const PROFILES: Record<ConnectionProfile, ProfileRules> = {
  fixed_broadband: FIXED_BROADBAND,
  mobile_broadband: MOBILE_BROADBAND,
};
