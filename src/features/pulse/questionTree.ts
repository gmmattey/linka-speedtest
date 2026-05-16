import type { OpcaoResposta, QuestionAnswer, QuestionNode } from './types';

export const INITIAL_CHIPS: OpcaoResposta[] = [
  { id: 'internet_lenta',   label: 'Internet lenta',    contextoParaIA: 'Usuário relata lentidão geral na conexão.' },
  { id: 'jogos_travando',   label: 'Jogos travando',    contextoParaIA: 'Usuário tem problemas em jogos online.' },
  { id: 'streaming_ruim',   label: 'Streaming ruim',    contextoParaIA: 'Usuário tem problemas em plataformas de vídeo.' },
  { id: 'wifi_oscilando',   label: 'Wi-Fi oscilando',   contextoParaIA: 'Usuário relata instabilidade no sinal Wi-Fi.' },
  { id: 'chamadas_ruins',   label: 'Chamadas ruins',    contextoParaIA: 'Usuário tem qualidade ruim em chamadas de voz/vídeo.' },
  { id: 'nao_sei_explicar', label: 'Não sei explicar',  contextoParaIA: 'Usuário percebe algo errado mas não consegue descrever.' },
];

interface QuestionTreeNode extends QuestionNode {
  children: { [answerId: string]: QuestionTreeNode | null };
}

interface QuestionTree {
  [chipId: string]: QuestionTreeNode;
}

const TREE: QuestionTree = {
  internet_lenta: {
    id: 'internet_lenta_q1', texto: 'Quando a lentidão ocorre?',
    opcoes: [
      { id: 'sempre',     label: 'Sempre',              contextoParaIA: 'Lentidão constante, independente do horário.' },
      { id: 'horario',    label: 'Em horários específicos', contextoParaIA: 'Lentidão em pico de uso (noite/fim de semana).' },
      { id: 'dispositivo',label: 'Em um dispositivo só', contextoParaIA: 'Lentidão isolada em um dispositivo específico.' },
    ],
    children: {
      sempre: {
        id: 'internet_lenta_q2a', texto: 'O que fica mais lento?',
        opcoes: [
          { id: 'web',    label: 'Navegar na web',    contextoParaIA: 'Lentidão em navegação web.' },
          { id: 'video',  label: 'Vídeos/streaming',  contextoParaIA: 'Lentidão em streaming de vídeo.' },
          { id: 'tudo',   label: 'Tudo igualmente',   contextoParaIA: 'Lentidão geral em todas as atividades.' },
        ],
        children: {},
      },
      horario: {
        id: 'internet_lenta_q2b', texto: 'Qual horário costuma ser mais lento?',
        opcoes: [
          { id: 'noite',  label: 'À noite (19h–23h)',  contextoParaIA: 'Lentidão no horário de pico noturno.' },
          { id: 'semana', label: 'Fim de semana',       contextoParaIA: 'Lentidão maior no fim de semana.' },
          { id: 'varia',  label: 'Varia muito',         contextoParaIA: 'Lentidão imprevisível sem padrão claro.' },
        ],
        children: {},
      },
      dispositivo: null,
    },
  },
  jogos_travando: {
    id: 'jogos_q1', texto: 'Em qual dispositivo você joga?',
    opcoes: [
      { id: 'console',  label: 'PlayStation / Xbox', contextoParaIA: 'Jogador em console doméstico.' },
      { id: 'pc',       label: 'PC / Notebook',       contextoParaIA: 'Jogador em computador.' },
      { id: 'celular',  label: 'Celular',              contextoParaIA: 'Jogador mobile.' },
    ],
    children: {
      console: {
        id: 'jogos_q2_console', texto: 'Como o console se conecta?',
        opcoes: [
          { id: 'cabo', label: 'Cabo Ethernet', contextoParaIA: 'Console conectado por cabo — latência deve ser baixa.' },
          { id: 'wifi', label: 'Wi-Fi',          contextoParaIA: 'Console via Wi-Fi — mais suscetível a interferências.' },
        ],
        children: {},
      },
      pc: {
        id: 'jogos_q2_pc', texto: 'Como seu PC se conecta?',
        opcoes: [
          { id: 'cabo', label: 'Cabo Ethernet', contextoParaIA: 'PC com cabo — melhor estabilidade possível.' },
          { id: 'wifi', label: 'Wi-Fi',          contextoParaIA: 'PC via Wi-Fi — investigar sinal e canal.' },
        ],
        children: {},
      },
      celular: null,
    },
  },
  streaming_ruim: {
    id: 'streaming_q1', texto: 'Qual plataforma tem mais problemas?',
    opcoes: [
      { id: 'netflix',   label: 'Netflix / Prime',      contextoParaIA: 'Problemas em serviços de streaming de vídeo.' },
      { id: 'youtube',   label: 'YouTube',              contextoParaIA: 'Problemas específicos no YouTube.' },
      { id: 'outro_str', label: 'Outra / Todas',        contextoParaIA: 'Problema generalizado em qualquer streaming.' },
    ],
    children: {
      netflix: {
        id: 'streaming_q2', texto: 'Como aparece o problema?',
        opcoes: [
          { id: 'buffer',    label: 'Fica carregando (buffer)', contextoParaIA: 'Buffering frequente indica baixo download.' },
          { id: 'qualidade', label: 'Qualidade baixa',          contextoParaIA: 'Definição degradada automaticamente pelo serviço.' },
        ],
        children: {},
      },
      youtube: {
        id: 'streaming_q2_yt', texto: 'Qual resolução consegue assistir sem travar?',
        opcoes: [
          { id: 'sd',  label: 'Apenas SD (360p–480p)', contextoParaIA: 'Só sustenta qualidade SD — download muito baixo.' },
          { id: 'hd',  label: 'Até HD (720p)',          contextoParaIA: 'HD funciona mas 4K não — moderado.' },
          { id: 'ok',  label: '4K sem problema',        contextoParaIA: 'Download adequado, problema pode ser outro.' },
        ],
        children: {},
      },
      outro_str: null,
    },
  },
  wifi_oscilando: {
    id: 'wifi_q1', texto: 'Em qual área da casa o Wi-Fi oscila?',
    opcoes: [
      { id: 'proximo',   label: 'Perto do roteador',  contextoParaIA: 'Oscilação perto do roteador — suspeitar de interferência.' },
      { id: 'longe',     label: 'Longe do roteador',   contextoParaIA: 'Oscilação por distância ou paredes.' },
      { id: 'toda_casa', label: 'Em toda a casa',      contextoParaIA: 'Oscilação generalizada — problema no roteador ou provedor.' },
    ],
    children: {
      proximo: {
        id: 'wifi_q2_proximo', texto: 'Quando a oscilação ocorre?',
        opcoes: [
          { id: 'sempre_osc',    label: 'Sempre',                    contextoParaIA: 'Oscilação constante próxima ao roteador.' },
          { id: 'muitos_disp',   label: 'Quando muitos dispositivos conectados', contextoParaIA: 'Saturação do roteador com múltiplos dispositivos.' },
          { id: 'hora_pico_osc', label: 'Horário de pico',           contextoParaIA: 'Interferência de canais Wi-Fi vizinhos no horário de pico.' },
        ],
        children: {},
      },
      longe: {
        id: 'wifi_q2_longe', texto: 'Há paredes ou obstáculos entre você e o roteador?',
        opcoes: [
          { id: 'concreto', label: 'Paredes grossas / concreto', contextoParaIA: 'Concreto atenua muito o sinal Wi-Fi.' },
          { id: 'madeira',  label: 'Madeira / divisórias',       contextoParaIA: 'Obstáculos leves — sinal médio.' },
          { id: 'linha_de_visao', label: 'Visão direta, sem obstáculos', contextoParaIA: 'Atenuação por distância pura.' },
        ],
        children: {},
      },
      toda_casa: null,
    },
  },
  chamadas_ruins: {
    id: 'chamadas_q1', texto: 'Qual tipo de chamada tem problemas?',
    opcoes: [
      { id: 'video_call',  label: 'Videochamada (Meet, Teams, Zoom)', contextoParaIA: 'Problemas em videoconferência.' },
      { id: 'voz_voip',    label: 'Chamada de voz (WhatsApp, Discord)', contextoParaIA: 'Problemas em voz por dados.' },
      { id: 'celular_op',  label: 'Chamada pelo plano da operadora',   contextoParaIA: 'Problema em chamada celular tradicional — fora do escopo Wi-Fi.' },
    ],
    children: {
      video_call: {
        id: 'chamadas_q2_video', texto: 'Como o problema aparece?',
        opcoes: [
          { id: 'trava_img',  label: 'Imagem trava, voz ok',   contextoParaIA: 'Baixo download afeta vídeo mas não voz.' },
          { id: 'corta_voz',  label: 'Voz cortada',            contextoParaIA: 'Jitter ou latência alta afetando áudio.' },
          { id: 'ambos',      label: 'Imagem e voz ruins',     contextoParaIA: 'Problema grave de conexão afetando tudo.' },
        ],
        children: {},
      },
      voz_voip: {
        id: 'chamadas_q2_voip', texto: 'O problema acontece mais quando?',
        opcoes: [
          { id: 'sempre_voip', label: 'Sempre',                      contextoParaIA: 'Problema constante em VoIP.' },
          { id: 'wifi_voip',   label: 'Só no Wi-Fi (cabo funciona)', contextoParaIA: 'Wi-Fi com alta latência ou jitter.' },
          { id: 'dados_voip',  label: 'Só no 4G/5G',                contextoParaIA: 'Rede móvel com problemas de VoIP.' },
        ],
        children: {},
      },
      celular_op: null,
    },
  },
  nao_sei_explicar: {
    id: 'nao_sei_q1', texto: 'Quando você percebe que algo está errado?',
    opcoes: [
      { id: 'navegar',  label: 'Ao navegar em sites',       contextoParaIA: 'Sites lentos para carregar.' },
      { id: 'assistir', label: 'Ao assistir vídeos',        contextoParaIA: 'Problemas em reprodução de vídeo.' },
      { id: 'qualquer', label: 'Em qualquer coisa online',  contextoParaIA: 'Degradação geral percebida pelo usuário.' },
    ],
    children: {
      navegar: null,
      assistir: null,
      qualquer: {
        id: 'nao_sei_q2', texto: 'Com que frequência você percebe?',
        opcoes: [
          { id: 'constante', label: 'O tempo todo',      contextoParaIA: 'Problema crônico e constante.' },
          { id: 'as_vezes',  label: 'Às vezes',          contextoParaIA: 'Problema intermitente.' },
          { id: 'raro',      label: 'Raramente',         contextoParaIA: 'Evento esporádico.' },
        ],
        children: {},
      },
    },
  },
};

export function getInitialChips(): OpcaoResposta[] {
  return INITIAL_CHIPS;
}

export function getNextQuestion(chipId: string, history: QuestionAnswer[]): QuestionNode | null {
  const root = TREE[chipId];
  if (!root) return null;
  if (history.length === 0) return { id: root.id, texto: root.texto, opcoes: root.opcoes };

  const firstAnswer = history[0];
  if (!firstAnswer || firstAnswer.questionId !== root.id) return null;
  const depth1 = root.children[firstAnswer.answerId];
  if (!depth1) return null;

  if (history.length === 1) return { id: depth1.id, texto: depth1.texto, opcoes: depth1.opcoes };

  const secondAnswer = history[1];
  if (!secondAnswer || secondAnswer.questionId !== depth1.id) return null;
  const depth2 = depth1.children[secondAnswer.answerId];
  if (!depth2) return null;

  if (history.length === 2) return { id: depth2.id, texto: depth2.texto, opcoes: depth2.opcoes };

  return null;
}

export function isLeafAnswer(chipId: string, answerId: string, history: QuestionAnswer[]): boolean {
  const root = TREE[chipId];
  if (!root) return true;

  if (history.length === 0) {
    return root.children[answerId] === null || root.children[answerId] === undefined;
  }

  const firstAnswer = history[0];
  if (!firstAnswer || firstAnswer.questionId !== root.id) return true;
  const depth1 = root.children[firstAnswer.answerId];
  if (!depth1) return true;

  if (history.length === 1) {
    return depth1.children[answerId] === null || depth1.children[answerId] === undefined;
  }

  return true;
}

export function buildContextContribution(question: QuestionNode, answer: OpcaoResposta): string {
  return `Pergunta: ${question.texto}\nResposta: ${answer.label}\nContexto: ${answer.contextoParaIA}`;
}
