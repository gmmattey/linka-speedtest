/**
 * Dicionário de copy pt-BR do motor unificado.
 *
 * O motor (`interpret.ts`) retorna apenas chaves; a camada de UX resolve via
 * `resolveCopy()`. Isso permite que o linka Flutter use o mesmo motor com seu
 * próprio dicionário (eventualmente i18n).
 *
 * Paridade com o classifier legado nas chaves principais — calibrações de copy
 * acontecem em fases posteriores do plano (provavelmente Fase 5).
 */

const DICTIONARY: Record<string, string> = {
  // --- Quality (paridade com qualityHeadline() legacy) ---
  'quality.excellent':   'Conexão excelente',
  'quality.good':        'Conexão boa',
  'quality.fair':        'Conexão aceitável',
  'quality.slow':        'Conexão lenta',
  'quality.unavailable': 'Sem conexão',

  // --- Stability (paridade com stabilityLabel() legacy) ---
  'stability.very_stable': 'Muito estável',
  'stability.stable':      'Estável',
  'stability.oscillating': 'Oscilando',
  'stability.unstable':    'Instável',

  // --- Métricas: nomes amigáveis exibidos ao usuário final ---
  // packetLoss → "Falhas" (curto) / "Falhas na conexão" (longo)
  'metric.packetLoss':         'Falhas',
  'metric.packetLoss.long':    'Falhas na conexão',
  // latency → "Resposta" (curto) / "RESP" (sigla compacta no gauge/steps)
  // .loaded para latência sob carga (bufferbloat); .loadedValue para o valor
  // bruto medido durante a carga.
  'metric.latency':             'Resposta',
  'metric.latency.short':       'RESP',
  'metric.latency.loaded':      'Resposta com a rede ocupada',
  'metric.latency.loadedValue': 'Resposta com tráfego',

  // --- Use cases: status textual em formato "Categoria: avaliação" ---
  // (mantidos para paridade com chamadores legados — chips/labels novos
  // usam useCase.X.label[.short] e useCase.status.X[.short] abaixo.)
  'useCase.gaming.good':            'Jogos: ótima experiência',
  'useCase.gaming.maybe':           'Jogos: pode ter impacto',
  'useCase.gaming.limited':         'Jogos: pode falhar',
  'useCase.streaming_4k.good':      '4K: estável',
  'useCase.streaming_4k.maybe':     '4K: pode oscilar',
  'useCase.streaming_4k.limited':   '4K: insuficiente',
  'useCase.home_office.good':       'Office: tranquilo',
  'useCase.home_office.maybe':      'Office: alguns travamentos',
  'useCase.home_office.limited':    'Office: limitado',
  'useCase.video_call.good':        'Vídeo: nítida',
  'useCase.video_call.maybe':       'Vídeo: pode travar',
  'useCase.video_call.limited':     'Vídeo: comprometida',

  // --- Use cases: rótulo da categoria (longo + curto p/ chip) ---
  'useCase.gaming.label':             'Jogos online',
  'useCase.gaming.label.short':       'Jogos',
  'useCase.streaming_4k.label':       'Streaming 4K',
  'useCase.streaming_4k.label.short': '4K',
  'useCase.home_office.label':        'Home office',
  'useCase.home_office.label.short':  'Trabalho',
  'useCase.video_call.label':         'Videochamada',
  'useCase.video_call.label.short':   'Vídeo',

  // --- Use cases: verdict (descritivo + curto p/ chip apertado) ---
  'useCase.status.good':          'Funciona bem',
  'useCase.status.good.short':    'OK',
  'useCase.status.maybe':         'Pode oscilar',
  'useCase.status.maybe.short':   'Atenção',
  'useCase.status.limited':       'Não vai funcionar',
  'useCase.status.limited.short': 'Ruim',

  // --- Tema (Light/Dark → pt-BR) ---
  'theme.light': 'Claro',
  'theme.dark':  'Escuro',

  // --- Flags (paridade resumida com tagLabel() legacy) ---
  'flag.highLatency':  'Resposta alta',
  'flag.lowUpload':    'Upload baixo',
  'flag.unstable':     'Oscilação alta',
  'flag.packetLoss':   'Falhas na conexão',
  'flag.veryUnstable': 'Oscilação crítica',

  // --- Diagnosis (paridade com buildDiagnosis() legacy, abreviada) ---
  'diagnosis.excellent':         'Sua internet está excelente. Você pode usar qualquer aplicativo sem limitações — streaming em 4K, jogos online e videochamadas funcionam perfeitamente.',
  'diagnosis.good':              'Sua internet está boa para o dia a dia. Streaming, videochamadas e trabalho remoto funcionam sem problemas.',
  'diagnosis.fair':              'Sua internet está funcionando, mas pode ter dificuldade com streaming em alta qualidade ou vários dispositivos ao mesmo tempo.',
  'diagnosis.slow':              'Sua internet está lenta. Páginas demoram para carregar e aplicativos podem travar com frequência.',
  'diagnosis.unavailable':       'Não foi possível medir sua conexão. Verifique se você está conectado à internet.',
  'diagnosis.veryUnstable':      'A conexão está muito instável. Chamadas e streaming podem cair com frequência.',
  'diagnosis.packetLoss':        'Sua conexão está com falhas no caminho — isso causa engasgos e lentidão em aplicativos.',
  'diagnosis.unstable':          'A velocidade está oscilando bastante, o que pode causar quedas em chamadas ou streaming.',
  'diagnosis.highLatency':       'O servidor está demorando para responder — isso pode causar atrasos em jogos online e videochamadas.',
  'diagnosis.lowUpload':         'Seu envio de dados está fraco — subir arquivos grandes ou fazer transmissões ao vivo pode ser lento.',
  'diagnosis.history.latency':   'Nos últimos testes a resposta continua alta — pode ser um problema recorrente na sua conexão.',
  'diagnosis.history.loss':      'Falhas na conexão foram detectadas em vários testes recentes — considere verificar o roteador ou o cabo.',
  'diagnosis.history.slow':      'Sua conexão tem mostrado lentidão em vários testes — vale entrar em contato com sua operadora.',

  // --- Short phrases (paridade com buildShortPhrase() legacy, simplificadas) ---
  'shortPhrase.excellent':       'Internet excelente — todos os usos funcionam perfeitamente.',
  'shortPhrase.good':            'Boa conexão — streaming, trabalho e jogos funcionam bem.',
  'shortPhrase.fair':            'Conexão funcional — pode ter dificuldades com streaming ou múltiplos dispositivos.',
  'shortPhrase.slow':            'Internet lenta — velocidade insuficiente para a maioria dos usos.',
  'shortPhrase.slow.unstable':   'Conexão instável — chamadas e streaming podem falhar.',
  'shortPhrase.unavailable':     'Sem conexão detectada — verifique se está conectado à internet.',
};

/**
 * Resolve uma chave do dicionário para a string pt-BR correspondente.
 *
 * `params` permite interpolação simples no estilo `{name}` — ex.:
 * `resolveCopy('foo', { count: 3 })` substitui `{count}` no template.
 *
 * Se a chave não existir, retorna a própria chave (fallback visível —
 * facilita detectar copy faltando em testes/QA).
 */
export function resolveCopy(
  key: string,
  params?: Record<string, string | number>,
): string {
  const template = DICTIONARY[key];
  if (template === undefined) return key;
  if (!params) return template;

  let out = template;
  for (const [name, value] of Object.entries(params)) {
    // Substitui todas as ocorrências de {name} sem usar regex (evita escapar)
    out = out.split(`{${name}}`).join(String(value));
  }
  return out;
}
