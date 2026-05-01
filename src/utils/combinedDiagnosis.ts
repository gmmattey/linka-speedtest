import type {
  CombineDiagnosticsInput,
  CombinedDiagnosis,
  CombinedDiagnosisCause,
  WifiDiagnosticResult,
  MobileDiagnosticResult,
  SpeedTestResult,
} from '../types';

const COPY: Record<CombinedDiagnosisCause, { title: string; explanation: string; primaryAction: string }> = {
  healthy: {
    title: 'Conexão saudável',
    explanation: 'Sua internet está funcionando bem. Velocidade, resposta e qualidade do sinal dentro do esperado.',
    primaryAction: 'Nenhuma ação necessária. Continue usando normalmente.',
  },
  wifi_bottleneck: {
    title: 'Wi-Fi limitando a conexão',
    explanation: 'O sinal Wi-Fi está fraco ou lento, e isso está afetando a velocidade da internet.',
    primaryAction: 'Aproxime-se do roteador, mude para a faixa 5 GHz ou reinicie o roteador.',
  },
  operator_or_wan_issue: {
    title: 'Possível problema na operadora',
    explanation: 'O sinal Wi-Fi parece bom, mas a velocidade está abaixo do esperado. O problema provavelmente está fora de casa.',
    primaryAction: 'Verifique se há instabilidade na sua operadora ou entre em contato com o suporte.',
  },
  local_wifi_risk: {
    title: 'Wi-Fi com sinal fraco',
    explanation: 'A velocidade está boa agora, mas o sinal Wi-Fi é fraco e pode causar problemas conforme o uso aumenta.',
    primaryAction: 'Melhore o posicionamento do roteador ou considere um repetidor de sinal.',
  },
  mobile_network_issue: {
    title: 'Instabilidade na rede móvel',
    explanation: 'Sua velocidade está abaixo do esperado para uma rede móvel. Pode ser congestionamento ou cobertura insuficiente.',
    primaryAction: 'Tente se mover para uma área com melhor cobertura ou aguarde alguns minutos.',
  },
  mobile_signal_risk: {
    title: 'Sinal móvel fraco',
    explanation: 'O sinal da operadora está fraco e está afetando — ou pode afetar — a qualidade da conexão.',
    primaryAction: 'Mova-se para uma área com melhor sinal ou verifique se há cobertura 4G/5G disponível.',
  },
  internet_issue: {
    title: 'Problema de internet',
    explanation: 'A velocidade está abaixo do esperado. Pode ser uma instabilidade no provedor ou no cabo de rede.',
    primaryAction: 'Reinicie o modem e o roteador. Se o problema persistir, contate sua operadora.',
  },
  inconclusive: {
    title: 'Diagnóstico incompleto',
    explanation: 'Não foi possível identificar a causa com precisão. São necessários mais dados de sinal.',
    primaryAction: 'Refaça o teste ou ative o diagnóstico de Wi-Fi para uma análise mais completa.',
  },
};

function isSpeedBad(s: SpeedTestResult): boolean {
  return (
    s.dl < 50 ||
    s.ul < 10 ||
    s.latency > 80 ||
    s.jitter > 30 ||
    s.packetLoss > 2 ||
    (s.bufferbloatDeltaMs ?? 0) > 100
  );
}

function isWifiBad(w: WifiDiagnosticResult): boolean {
  return (
    (w.rssiDbm !== undefined && w.rssiDbm < -67) ||
    (w.linkSpeedMbps !== undefined && w.linkSpeedMbps < 100) ||
    w.quality === 'weak' ||
    w.quality === 'critical'
  );
}

function isWifiGood(w: WifiDiagnosticResult): boolean {
  return (
    w.rssiDbm !== undefined &&
    w.rssiDbm >= -60 &&
    w.linkSpeedMbps !== undefined &&
    w.linkSpeedMbps >= 300 &&
    (w.band === '5GHz' || w.band === '6GHz')
  );
}

function isMobileBad(m: MobileDiagnosticResult): boolean {
  return (
    m.available === false ||
    m.signalLevel === 'weak' ||
    m.signalLevel === 'critical' ||
    (m.rsrpDbm !== undefined && m.rsrpDbm < -110) ||
    (m.rsrqDb !== undefined && m.rsrqDb < -15) ||
    (m.sinrDb !== undefined && m.sinrDb < 5)
  );
}

export function combineDiagnostics(input: CombineDiagnosticsInput): CombinedDiagnosis {
  const { speed, connectionType, wifi, mobile } = input;
  const speedBad = isSpeedBad(speed);

  let cause: CombinedDiagnosisCause;
  let confidence: 'low' | 'medium' | 'high';

  if (connectionType === 'wifi') {
    if (!wifi) {
      cause = speedBad ? 'inconclusive' : 'healthy';
      confidence = speedBad ? 'low' : 'medium';
    } else {
      const wifiBad = isWifiBad(wifi);
      const wifiGood = isWifiGood(wifi);

      if (!speedBad && wifiGood) {
        cause = 'healthy';
        confidence = 'high';
      } else if (speedBad && wifiBad) {
        cause = 'wifi_bottleneck';
        confidence = 'high';
      } else if (speedBad && !wifiBad) {
        cause = 'operator_or_wan_issue';
        confidence = wifiGood ? 'high' : 'medium';
      } else {
        cause = 'local_wifi_risk';
        confidence = 'medium';
      }
    }
  } else if (connectionType === 'mobile') {
    if (!mobile) {
      cause = speedBad ? 'mobile_network_issue' : 'healthy';
      confidence = 'medium';
    } else {
      const mobileBad = isMobileBad(mobile);

      if (!speedBad && !mobileBad) {
        cause = 'healthy';
        confidence = 'high';
      } else if (speedBad && mobileBad) {
        cause = 'mobile_signal_risk';
        confidence = 'high';
      } else if (speedBad && !mobileBad) {
        cause = 'mobile_network_issue';
        confidence = 'medium';
      } else {
        cause = 'mobile_signal_risk';
        confidence = 'medium';
      }
    }
  } else {
    cause = speedBad ? 'internet_issue' : 'healthy';
    confidence = speedBad ? 'low' : 'medium';
  }

  return { cause, confidence, ...COPY[cause] };
}
