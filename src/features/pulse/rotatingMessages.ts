import type { PulsePhase } from './types';

const MESSAGES: Partial<Record<PulsePhase, string[]>> = {
  collecting: [
    'Inicializando diagnóstico inteligente…',
    'Coletando contexto da rede…',
    'Testando estabilidade…',
    'Medindo latência…',
    'Avaliando qualidade da conexão…',
    'Executando teste de velocidade…',
    'Verificando consistência dos pacotes…',
    'Analisando comportamento da conexão…',
  ],
  thinking: [
    'Detectando padrões…',
    'Cruzando métricas…',
    'Identificando possíveis causas…',
    'Correlacionando evidências…',
    'Processando dados de rede…',
  ],
  analyzing: [
    'Pensando numa resposta…',
    'Gerando análise inteligente…',
    'Formulando diagnóstico…',
    'Consultando base de conhecimento…',
    'Preparando recomendações…',
  ],
};

export function getFirstMessage(phase: PulsePhase): string {
  return MESSAGES[phase]?.[0] ?? '';
}

export function getNextMessage(phase: PulsePhase, current: string): string {
  const list = MESSAGES[phase];
  if (!list || list.length <= 1) return current;
  const idx = list.indexOf(current);
  return idx < 0 || idx >= list.length - 1 ? list[0] : list[idx + 1];
}

export function getAllMessages(phase: PulsePhase): string[] {
  return MESSAGES[phase] ?? [];
}
