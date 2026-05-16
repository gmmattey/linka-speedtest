import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionType } from '../types';
import type { OpcaoResposta, PulsePhase, QuestionAnswer } from '../features/pulse/types';
import { appendAnswer, appendChip, buildInitial } from '../features/pulse/contextAccumulator';
import { generateFollowUpAnalysis, generateInitialAnalysis } from '../features/pulse/pulseApi';
import { buildContextContribution, getInitialChips, getNextQuestion, isLeafAnswer } from '../features/pulse/questionTree';
import { severityFromResult } from '../features/pulse/rulesAdapter';
import { getFirstMessage, getNextMessage } from '../features/pulse/rotatingMessages';
import { usePulseSession } from './usePulseSession';
import { useSpeedTest } from './useSpeedTest';
import type { SpeedTestResult } from '../types';

const MSG_INTERVAL_MS = 2500;

export function usePulseDiagnosis(connectionType: ConnectionType = 'unknown') {
  const connectionTypeRef = useRef<ConnectionType>(connectionType);
  useEffect(() => { connectionTypeRef.current = connectionType; }, [connectionType]);
  const [phase, setPhase] = useState<PulsePhase>('idle');
  const [mensagem, setMensagem] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState<{ result: SpeedTestResult; trigger: string } | null>(null);
  const { session, updateSession, setNewSession, clearSession } = usePulseSession();
  const speedTest = useSpeedTest();
  const msgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  const startMessageRotation = useCallback((p: PulsePhase) => {
    if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    setMensagem(getFirstMessage(p));
    msgTimerRef.current = setInterval(() => {
      setMensagem((cur) => getNextMessage(p, cur));
    }, MSG_INTERVAL_MS);
  }, []);

  const stopMessageRotation = useCallback(() => {
    if (msgTimerRef.current) {
      clearInterval(msgTimerRef.current);
      msgTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopMessageRotation(), [stopMessageRotation]);

  // React to speedtest completion
  useEffect(() => {
    if (phase !== 'collecting') return;
    if (speedTest.phase === 'done' && speedTest.result) {
      stopMessageRotation();
      setPhase('thinking');
      startMessageRotation('thinking');
      const result = speedTest.result;
      // Brief thinking delay, then trigger AI analysis
      const t = setTimeout(() => {
        setPhase('analyzing');
        startMessageRotation('analyzing');
        setPendingAnalysis({ result, trigger: 'initial' });
      }, 600);
      return () => clearTimeout(t);
    }
    if (speedTest.phase === 'error') {
      stopMessageRotation();
      setError('Não foi possível executar o teste de velocidade. Verifique sua conexão.');
      setPhase('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speedTest.phase, speedTest.result, phase]);

  // Execute AI call when pendingAnalysis is set
  useEffect(() => {
    if (!pendingAnalysis) return;
    const { result, trigger } = pendingAnalysis;
    setPendingAnalysis(null);

    const severity = severityFromResult(result);
    const connType = connectionTypeRef.current;
    const contextAccumulated = buildInitial({
      downloadMbps: result.dl,
      uploadMbps: result.ul,
      latencyMs: result.latency,
      jitterMs: result.jitter,
      lossPercent: result.packetLoss,
      connectionType: connType,
      severity,
    });

    let cancelled = false;
    generateInitialAnalysis(result, contextAccumulated, trigger).then((aiEntry) => {
      if (cancelled) return;
      stopMessageRotation();
      const chips = getInitialChips();
      setNewSession({
        sessionId: crypto.randomUUID(),
        createdAt: Date.now(),
        downloadMbps: result.dl,
        uploadMbps: result.ul,
        latencyMs: result.latency,
        jitterMs: result.jitter,
        lossPercent: result.packetLoss,
        connectionType: connType,
        diagnosticSeverity: severity,
        questionHistory: [],
        pendingQuestion: null,
        activeChips: chips,
        analyses: [aiEntry],
        contextAccumulated,
      });
      setPhase('result');
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAnalysis]);

  const iniciar = useCallback(() => {
    clearSession();
    setError(null);
    setPhase('collecting');
    startMessageRotation('collecting');
    speedTest.start(undefined, 'complete');
  }, [clearSession, speedTest, startMessageRotation]);

  const gerarAnaliseComplementar = useCallback(async (chipId: string, contexto: string) => {
    const s = sessionRef.current;
    if (!s) return;
    const result: SpeedTestResult = {
      dl: s.downloadMbps ?? 0,
      ul: s.uploadMbps ?? 0,
      latency: s.latencyMs ?? 0,
      jitter: s.jitterMs ?? 0,
      packetLoss: s.lossPercent ?? 0,
      timestamp: Date.now(),
    };

    setPhase('analyzing');
    startMessageRotation('analyzing');

    const aiEntry = await generateFollowUpAnalysis(result, contexto, `followup_${chipId}`);
    stopMessageRotation();

    const chips = getInitialChips();
    updateSession({
      pendingQuestion: null,
      activeChips: chips,
      analyses: [...(s.analyses ?? []), aiEntry],
      contextAccumulated: contexto,
    });
    setPhase('result');
  }, [startMessageRotation, stopMessageRotation, updateSession]);

  const selecionarChip = useCallback(async (chip: OpcaoResposta) => {
    const s = sessionRef.current;
    if (!s) return;
    const novoContexto = appendChip(s.contextAccumulated, chip);
    const isLeaf = isLeafAnswer(chip.id, '', []);
    const proximaPergunta = isLeaf ? null : getNextQuestion(chip.id, []);

    if (isLeaf || !proximaPergunta) {
      await gerarAnaliseComplementar(chip.id, novoContexto);
    } else {
      updateSession({
        activeChips: [],
        pendingQuestion: proximaPergunta,
        contextAccumulated: novoContexto,
        questionHistory: [],
      });
      setPhase('awaitingAnswer');
    }
  }, [gerarAnaliseComplementar, updateSession]);

  const responderPergunta = useCallback(async (opcao: OpcaoResposta) => {
    const s = sessionRef.current;
    if (!s) return;
    const question = s.pendingQuestion;
    if (!question) return;

    const novoContexto = appendAnswer(s.contextAccumulated, question, opcao);
    const novaResposta: QuestionAnswer = {
      questionId: question.id,
      questionText: question.texto,
      answerId: opcao.id,
      answerText: opcao.label,
      contextContribution: buildContextContribution(question, opcao),
    };
    const novoHistorico = [...s.questionHistory, novaResposta];
    const chipId = s.questionHistory[0]?.answerId ?? opcao.id;

    const leaf = isLeafAnswer(chipId, opcao.id, s.questionHistory);
    const proxima = leaf ? null : getNextQuestion(chipId, novoHistorico);

    if (leaf || !proxima) {
      updateSession({ questionHistory: novoHistorico, contextAccumulated: novoContexto });
      await gerarAnaliseComplementar(chipId, novoContexto);
    } else {
      updateSession({
        questionHistory: novoHistorico,
        pendingQuestion: proxima,
        contextAccumulated: novoContexto,
      });
    }
  }, [gerarAnaliseComplementar, updateSession]);

  const resetar = useCallback(() => {
    stopMessageRotation();
    clearSession();
    speedTest.reset();
    setPhase('idle');
    setError(null);
    setMensagem('');
  }, [clearSession, speedTest, stopMessageRotation]);

  return {
    phase,
    mensagem,
    error,
    session,
    iniciar,
    selecionarChip,
    responderPergunta,
    resetar,
  };
}
