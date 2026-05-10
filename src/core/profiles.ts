import type { ConnectionProfile, UseCaseId } from './types';

export const profiles = {
  fixed_broadband: {
    // Regra consolidada de classificação principal (Seção 7)
    excellent: {
      download: 100, // Mbps
      upload: 30,    // Mbps
      latency: 30,   // ms
      jitter: 5,     // ms
      packetLoss: 0.5, // %
    },
    good: {
      download: 50,
      upload: 10,
      latency: 60,
      jitter: 15,
      packetLoss: 1,
    },
    fair: {
      download: 25,
      upload: 3,
      latency: 100,
      packetLoss: 2,
    },
  },
  mobile_broadband: { // Mantido igual ao fixed_broadband por enquanto, ajustar se houver especificação
    excellent: {
      download: 100, // Mbps
      upload: 30,    // Mbps
      latency: 30,   // ms
      jitter: 5,     // ms
      packetLoss: 0.5, // %
    },
    good: {
      download: 50,
      upload: 10,
      latency: 60,
      jitter: 15,
      packetLoss: 1,
    },
    fair: {
      download: 25,
      upload: 3,
      latency: 100,
      packetLoss: 2,
    },
  },

  // Flags e tags consolidadas (Seção 8 e 9)
  flags: {
    highLatency: 80,    // ms, para tag highLatency
    lowUpload: 5,       // Mbps, para tag lowUpload
    packetLossWarning: 2, // %, para tag packetLoss e unstable
    unstableJitter: 50, // ms, para tag unstable
    veryUnstablePacketLoss: 5, // %, para tag veryUnstable
    veryUnstableJitter: 80,  // ms, para tag veryUnstable

    // Regra de estabilidade (Seção 9)
    stabilityJitterWeight: 0.6,
    stabilityLossWeight: 0.4,
    stabilityExcellentScore: 90, // score de estabilidade
    stabilityGoodScore: 70,    // score de estabilidade
    stabilityFairScore: 50,    // score de estabilidade
  },

  // Grid "Para o que sua internet serve?" (Seção 10)
  useCases: {
    gaming: {
      good: { download: 5, latency: 60, jitter: 20, packetLoss: 1 },
      acceptable: { download: 5, latency: 90, jitter: 40, packetLoss: 2 }, // "Pode falhar"
    },
    streaming4K: {
      good: { download: 25, packetLoss: 2 },
      acceptable: { download: 10, packetLoss: 2 }, // "Pode falhar"
    },
    homeOffice: {
      good: { download: 5, upload: 2, latency: 200, packetLoss: 2 },
      acceptable: { download: 2, upload: 1, latency: 250, packetLoss: 3 }, // "Pode falhar"
    },
    videoCall: {
      good: { download: 3, upload: 1.5, latency: 150, jitter: 30, packetLoss: 1 },
      acceptable: { download: 1.5, upload: 0.8, latency: 200, jitter: 50, packetLoss: 2 }, // "Pode falhar"
    },
  },
};

// A função `getUseCaseThresholds` não é mais necessária neste formato
// pois os use cases têm seus próprios objetos de thresholds.
// Mantenho a exportação para evitar quebras em outros arquivos que possam importar.
export function getUseCaseThresholds(_profile: ConnectionProfile, useCaseId: UseCaseId) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return profiles.useCases[useCaseId];
}

export const PROFILES = profiles;

