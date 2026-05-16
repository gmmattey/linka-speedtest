export type PulsePhase =
  | 'idle'
  | 'collecting'
  | 'thinking'
  | 'analyzing'
  | 'awaitingChips'
  | 'awaitingAnswer'
  | 'result'
  | 'error';

export type PulseResultLevel = 'success' | 'warning' | 'critical';

export interface OpcaoResposta {
  id: string;
  label: string;
  contextoParaIA: string;
}

export interface QuestionNode {
  id: string;
  texto: string;
  opcoes: OpcaoResposta[];
}

export interface QuestionAnswer {
  questionId: string;
  questionText: string;
  answerId: string;
  answerText: string;
  contextContribution: string;
}

export interface AiAnalysisEntry {
  trigger: string;
  content: string;
  isFallback: boolean;
  timestamp: number;
}

export interface IntelligentSession {
  sessionId: string;
  createdAt: number;
  downloadMbps: number | null;
  uploadMbps: number | null;
  latencyMs: number | null;
  jitterMs: number | null;
  lossPercent: number | null;
  connectionType: string;
  diagnosticSeverity: PulseResultLevel;
  questionHistory: QuestionAnswer[];
  pendingQuestion: QuestionNode | null;
  activeChips: OpcaoResposta[];
  analyses: AiAnalysisEntry[];
  contextAccumulated: string;
}
