// src/core/copyDictionary.ts
// Dicionário de textos em pt-BR para o motor de interpretação.
// Cada chave corresponde a um `copyKey` retornado por `interpretSpeedTestResult`.
// O formato `pt-BR:<chave>` é uma convenção para identificar a origem do texto.

export const copyDictionary: Record<string, string> = {
  // Qualidade primária (Seção 7)
  'quality.excellent.headline': 'Conexão excelente',
  'quality.excellent.shortPhrase': 'Sua internet está muito boa. Dá para assistir vídeos em alta qualidade, fazer chamadas e jogar online com tranquilidade.',
  'quality.good.headline': 'Conexão boa',
  'quality.good.shortPhrase': 'Sua internet está boa para o dia a dia. Vídeos, chamadas e trabalho remoto devem funcionar bem.',
  'quality.fair.headline': 'Conexão aceitável',
  'quality.fair.shortPhrase': 'Sua internet está funcionando, mas pode ter limitações em vídeos de alta qualidade, chamadas longas ou jogos online.',
  'quality.slow.headline': 'Conexão lenta',
  'quality.slow.shortPhrase': 'Sua internet está lenta. Sites, vídeos e aplicativos podem demorar para carregar.',
  'quality.unavailable.headline': 'Não foi possível medir',
  'quality.unavailable.shortPhrase': 'Não conseguimos medir sua internet agora. Verifique se o aparelho está conectado e tente novamente.',

  // Tags/chips consolidados (Seção 8 e 11)
  'tag.highLatency.label': 'Resposta lenta',
  'tag.highLatency.message': 'A resposta da conexão está demorando mais que o ideal. Isso pode atrapalhar jogos online, chamadas de voz e comandos em tempo real.',
  'tag.lowUpload.label': 'Upload baixo',
  'tag.lowUpload.message': 'O envio de dados está baixo. Isso pode dificultar chamadas de vídeo, envio de arquivos e transmissões ao vivo.',
  'tag.packetLoss.label': 'Perda de sinal',
  'tag.packetLoss.message': 'Parte da conexão está se perdendo no caminho. Isso pode causar travamentos, falhas em chamadas e quedas momentâneas.',
  'tag.unstable.label': 'Conexão instável',
  'tag.unstable.message': 'A conexão está oscilando. Mesmo com boa velocidade, ela pode falhar em chamadas, jogos ou vídeos ao vivo.',
  'tag.veryUnstable.label': 'Instabilidade alta',
  'tag.veryUnstable.message': 'A conexão está muito instável. O ideal é testar de novo mais tarde e verificar se o problema continua.',

  // Regra de estabilidade (Seção 9)
  'stability.very_stable': 'Muito estável',
  'stability.stable': 'Estável',
  'stability.oscillating': 'Oscilando',
  'stability.unstable': 'Instável',

  // Grid "Para o que sua internet serve?" (Seção 10)
  'useCase.good': 'Bom',
  'useCase.acceptable': 'Pode falhar',
  'useCase.limited': 'Limitado',
  'useCase.gaming.acceptable_reason': 'Pode falhar por causa do tempo de resposta, oscilação ou perda de sinal.',
  'useCase.gaming.label': 'Jogos online',
  'useCase.gaming.label.short': 'Jogos',
  'useCase.streaming_4k.label': 'Streaming 4K',
  'useCase.streaming_4k.label.short': 'Streaming',
  'useCase.home_office.label': 'Home office',
  'useCase.home_office.label.short': 'Home office',
  'useCase.video_call.label': 'Videochamada',
  'useCase.video_call.label.short': 'Vídeo',
  'useCase.status.good': 'Funciona bem',
  'useCase.status.good.short': 'OK',
  'useCase.status.maybe.short': 'Atenção',
  'useCase.status.limited.short': 'Ruim',

  // Linguagem de cliente final (Seção 11)
  'metric.latency.label': 'Resposta',
  'metric.latency': 'Resposta',
  'metric.latency.short': 'RESP',
  'metric.latency.loaded': 'Resposta com a rede ocupada',
  'metric.jitter.label': 'Oscilação',
  'metric.packetLoss.label': 'Perda de sinal',
  'metric.packetLoss.altLabel': 'Falhas na conexão',
  'metric.packetLoss': 'Falhas',
  'metric.packetLoss.long': 'Falhas na conexão',

  // Tema
  'theme.light': 'Claro',
  'theme.dark': 'Escuro',

  // Flags de diagnóstico
  'flag.packetLoss': 'Falhas na conexão',

  // Detecção de conexão no iOS (Seção 12)
  'connectionType.unknown.label': 'Não identificada',
  'connectionType.unknown.guidance': 'Não conseguimos identificar se você está no Wi‑Fi ou rede móvel. Ajuste manualmente se quiser um teste mais adequado.',

  // Consumo de dados (Seção 13)
  'dataConsumption.complete_test.message': 'Teste completo: pode usar até 500 MB. Em rede móvel, usamos uma versão reduzida.',
  'dataConsumption.quick_test.label': 'Teste rápido',
  'dataConsumption.quick_test.usage': 'até 80 MB',
  'dataConsumption.quick_test.purpose': 'Dá uma noção geral da conexão.',
  'dataConsumption.complete_test.label': 'Teste completo',
  'dataConsumption.complete_test.usage': 'até 500 MB',
  'dataConsumption.complete_test.purpose': 'Mais preciso, recomendado no Wi‑Fi.',

  // Histórico (Seção 16)
  'history.average': 'Média dos seus testes',
  'history.good_overall': 'Conexão boa na maioria das medições',
  'history.recurrent_problem': 'Esse problema apareceu em testes diferentes. Vale reiniciar o roteador, testar mais perto do Wi‑Fi ou repetir em outro horário. Se continuar, fale com sua operadora.',
  'history.isolated_test': 'Um teste isolado não confirma problema permanente. Repita a medição em outro horário para comparar.',

  // Aviso de dados móveis — W1-04
  'dataWarning.mobile.title': 'Você está em dados móveis',
  'dataWarning.mobile.fast': 'O teste rápido pode consumir cerca de 15 MB da sua franquia. Prefere esperar um Wi-Fi?',
  'dataWarning.mobile.complete': 'O teste completo pode consumir até 45 MB da sua franquia. Recomendamos fazer no Wi-Fi.',
  'dataWarning.mobile.confirm': 'Continuar mesmo assim',
  'dataWarning.mobile.cancel': 'Cancelar',

  // Privacidade — W1-09
  'privacy.title': 'Dados usados pelo Linka',
  'privacy.collects.header': 'O que medimos',
  'privacy.collects.1': 'Velocidade de download e upload da sua internet',
  'privacy.collects.2': 'Tempo de resposta da conexão (latência)',
  'privacy.collects.3': 'Tipo de rede em uso (Wi-Fi ou dados móveis)',
  'privacy.collects.4': 'Qualidade do servidor de nomes (DNS)',
  'privacy.not.header': 'O que o Linka NÃO faz',
  'privacy.not.1': 'Não acessa suas mensagens, fotos ou arquivos',
  'privacy.not.2': 'Não vende nem compartilha nenhum dado com terceiros',
  'privacy.not.3': 'Não cria perfil seu nem rastreia seu uso fora do app',
  'privacy.not.4': 'Não exige cadastro nem e-mail para funcionar',
  'privacy.rights.header': 'Você tem controle total',
  'privacy.rights.1': 'Você pode apagar todo o histórico de testes a qualquer momento',
  'privacy.rights.2': 'Nenhum dado sai do seu celular — tudo fica armazenado localmente',
  'privacy.rights.3': 'Se quiser, pode redefinir o app completamente e começar do zero',
  'privacy.delete.button': 'Apagar meus dados',
  'privacy.delete.subtitle': 'Envia um e-mail para nossa equipe confirmar a exclusão.',

  // PDF / Laudo para operadora — W1-12
  'pdf.cta.button': 'Gerar Laudo para a Operadora',
  'pdf.cta.title': 'Comprovante de qualidade da sua internet',
  'pdf.cta.subtitle': 'Este documento registra os resultados dos seus testes. Você pode usar para questionar cobranças ou pedir desconto na sua operadora.',
  'pdf.cta.tooltip': 'Use para reclamar no site da ANATEL ou no Procon da sua cidade.',
};

export function resolveCopy(key: string): string {
  const text = copyDictionary[key];
  if (text) {
    return text;
  }
  return `[${key}]`; // Fallback para chaves não encontradas
}
