# Pendências de Layout — LINKA SpeedTest

## Objetivo

Este documento reúne as melhorias pendentes de layout, experiência do usuário, fraseologia e consistência visual do PWA LINKA SpeedTest.

A IA responsável pela implementação deve atuar com foco em:

- clareza para usuário comum;
- redução de termos técnicos na interface principal;
- consistência visual entre telas;
- melhoria da confiança no diagnóstico;
- refinamento do layout mobile;
- manutenção da identidade atual do produto.

Não é necessário redesenhar o app inteiro. A base visual está boa. O trabalho é de refinamento, correção de inconsistências e melhoria de comunicação.

---

## Recomendação de IA e modelo para executar esta atividade

### Melhor escolha para implementação

Usar **Claude Code com Claude Sonnet 4.6**, se disponível na conta.

Motivo:

- é o melhor equilíbrio entre qualidade, velocidade e custo para mudanças de layout, React, TypeScript e UX copy;
- tende a ser suficiente para aplicar alterações em múltiplos componentes sem exagerar no escopo;
- é adequado para tarefas de refino visual, consistência de texto, reorganização de componentes e pequenos ajustes de lógica de apresentação.

Configuração recomendada no Claude Code:

```bash
/model sonnet
```

ou, se o ambiente permitir fixar explicitamente:

```bash
claude --model sonnet
```

### Melhor escolha para planejamento/auditoria

Usar **Claude Code com `opusplan`** ou **Opus 4.7**, se disponível, apenas para planejar e revisar.

Motivo:

- melhor para analisar impactos, revisar consistência entre telas e detectar contradições de UX;
- melhor para auditoria depois da implementação;
- não é necessário para executar todas as mudanças, porque pode ser mais caro/lento.

Fluxo recomendado:

1. Rodar uma primeira análise com `opusplan` ou Opus, pedindo plano de execução.
2. Implementar com Sonnet 4.6.
3. Rodar revisão final com Opus ou `opusplan`.
4. Corrigir apenas o que for apontado como problema real.

### Alternativa aceitável

Usar **Codex** para execução se o objetivo for aplicar mudanças com maior controle técnico e revisão de diff.

Codex é especialmente útil se a tarefa for tratada como checklist de engenharia, com commits pequenos e validação por testes.

### Modelo que deve ser evitado para esta atividade

Evitar modelos muito rápidos/fracos para executar esta tarefa inteira, porque a melhoria depende de consistência entre telas, linguagem e regras visuais.

Não usar modelo leve para:

- reescrever fraseologia final;
- alterar diagnóstico visual;
- mexer no histórico;
- mexer em exportação;
- revisar consistência de PWA.

### Estratégia recomendada

A IA deve trabalhar em fases:

1. Ler o projeto e mapear telas/componentes afetados.
2. Aplicar correções P0 de confiança do diagnóstico.
3. Aplicar correções P1 de clareza de layout.
4. Aplicar correções P2 de refinamento.
5. Rodar build, lint e testes disponíveis.
6. Entregar relatório final com arquivos alterados e pendências.

Não executar tudo como uma única alteração gigante sem explicação.

---

## Direção geral do produto

O LINKA SpeedTest não deve ser apenas um medidor de Mbps.

A proposta correta é:

> Medir a internet e explicar se ela está boa para o que o usuário quer fazer.

A interface deve reforçar essa ideia em todas as telas.

Evitar que o produto pareça somente uma cópia genérica de speedtest. O diferencial deve ser o diagnóstico simples, visual e acionável.

---

## Identidade visual

### Nome

Manter o nome principal como:

> linka

Evitar usar “SpeedTest” como marca principal permanente. “SpeedTest” pode aparecer como descrição ou subtítulo, mas não deve competir com o nome da marca.

Recomendado:

- Nome visual: `linka`
- Nome instalado/PWA: `linka`
- Descrição: `Teste e diagnóstico da sua internet`

Evitar:

- `linka SpeedTest` como marca dominante;
- nomes genéricos como `Medidor de Internet`, `Speed Check`, `Net Test`;
- nomes muito técnicos ou corporativos.

---

## Cores

A paleta atual está boa e deve ser preservada.

### Cor principal

Manter o roxo atual como cor de marca.

O roxo deve ser usado para:

- botão principal;
- elementos de navegação;
- destaque de marca;
- ações primárias;
- estados neutros de destaque.

### Cores de métricas

Usar cores de métrica com consistência:

- Download: azul;
- Upload: verde;
- Sucesso: verde;
- Atenção: amarelo/âmbar;
- Erro ou ação destrutiva: vermelho;
- Texto principal: quase preto;
- Texto secundário: cinza médio;
- Fundo: branco ou cinza muito claro.

### Cuidados

Evitar excesso de cores competindo na mesma tela.

A interface não deve parecer um dashboard técnico cheio de cores sem hierarquia.

O roxo é a cor da marca. Azul e verde devem ser usados apenas para métricas e gráficos.

---

## Linguagem da interface

A interface principal deve usar linguagem de cliente final, não linguagem técnica.

### Trocas obrigatórias

Substituir ou evitar estes termos na interface principal:

| Termo técnico | Substituir por |
|---|---|
| Latência | Resposta da conexão |
| Jitter | Oscilação |
| Perda de pacotes | Falhas na conexão ou Perda de sinal |
| Packet loss | Falhas na conexão |
| Endpoint | Servidor |
| Throughput | Velocidade real |
| RTT | Resposta |
| Colo / GIG / código de servidor | Servidor Brasil ou Detalhes técnicos |

Termos técnicos podem existir em código, logs, comentários internos ou tela avançada, mas não devem aparecer na experiência principal.

---

## Tela inicial

### Problema atual

A tela inicial é limpa e visualmente agradável, mas está vazia demais.

O botão “Iniciar” domina a tela e não explica claramente a proposta do produto.

Hoje a percepção pode ser:

> Clique aqui para medir Mbps.

A percepção desejada é:

> Veja se sua internet está boa para vídeos, chamadas, jogos e trabalho.

### Melhorias necessárias

Adicionar frase curta de proposta acima ou abaixo do botão principal.

Texto recomendado:

> Meça sua internet e veja se ela está boa para jogos, vídeos, chamadas e trabalho.

Reduzir levemente o tamanho visual do botão “Iniciar”, entre 10% e 15%, mantendo-o como ação principal da tela.

Manter o visual limpo, mas usar melhor o espaço vazio.

### Aviso de consumo

O texto atual sobre consumo de dados deve ser mais natural.

Evitar:

> Usa ~400 MB · Recomendado em Wi-Fi ou cabo

Usar:

> Pode usar até 500 MB. Prefira fazer o teste no Wi-Fi.

Caso seja implementado teste rápido e teste completo, usar:

> Teste rápido: usa menos dados.  
> Teste completo: mais preciso, recomendado no Wi-Fi.

### Critério de aceite

A tela inicial deve responder rapidamente a três perguntas:

1. O que o app faz?
2. O que acontece ao tocar em iniciar?
3. Existe consumo relevante de dados?

---

## Botão principal

### Estado atual

O botão circular grande funciona visualmente, mas está exagerado.

Ele passa boa sensação de ação principal, porém pode parecer lúdico demais.

### Ajuste recomendado

Manter formato circular ou semi-circular se fizer parte da identidade, mas reduzir a escala.

O botão deve continuar sendo a ação mais importante da tela.

Texto recomendado:

> Iniciar teste

Evitar:

- “Executar benchmark”;
- “Rodar diagnóstico”;
- “Medir agora” se ficar menos direto;
- qualquer frase técnica.

---

## Painel inferior de configuração

### Problema atual

O painel inferior é bonito, mas sua leitura não é clara.

A sequência atual como “Celular → Celular → Cloudflare” pode confundir.

O usuário pode não entender se aquilo é:

- rota da medição;
- status da rede;
- configuração;
- diagnóstico;
- informação técnica.

### Melhoria necessária

Adicionar título claro ao painel.

Texto recomendado:

> Como o teste será feito

Substituir a sequência visual por:

> Este aparelho → Rede atual → Servidor Cloudflare

### Campos recomendados

Exibir informações de forma humana:

- Dispositivo: iPhone, Android, Desktop ou Tablet;
- Conexão: Wi-Fi, Rede móvel ou Não identificada;
- Servidor: Cloudflare Brasil;
- Operadora: nome curto, com limite de uma linha;
- IP: ocultável ou secundário.

### Detecção de rede no iOS

Se o navegador não permitir identificar o tipo de conexão, não afirmar que é “Celular”.

Usar:

> Conexão: Não identificada

ou:

> Conexão: Auto

Opcionalmente, permitir que o usuário confirme:

> Você está usando Wi-Fi?  
> Wi-Fi / Rede móvel

### Siglas técnicas

Não exibir siglas como `GIG`, `colo`, `BR · GIG` ou equivalentes na interface principal.

Se forem mantidas, colocar apenas em uma área chamada:

> Detalhes técnicos

### Critério de aceite

O usuário comum deve entender:

> Meu aparelho está testando minha rede contra um servidor externo.

Sem precisar interpretar siglas ou termos técnicos.

---

## Tela de teste em andamento

### Estado atual

A tela durante o teste é visualmente forte.

O número central grande funciona bem e transmite sensação de medição real.

O gráfico dá dinamismo.

### Problemas

Falta indicar claramente em qual etapa o teste está.

O usuário vê “Download” e o número, mas não sabe se ainda faltam upload, resposta e estabilidade.

Isso pode causar sensação de travamento.

### Melhorias necessárias

Adicionar indicação textual de etapa.

Exemplos:

> 1 de 4 · Medindo download  
> 2 de 4 · Medindo upload  
> 3 de 4 · Verificando resposta  
> 4 de 4 · Analisando estabilidade

Adicionar microtexto discreto:

> Isso pode levar alguns segundos.

### Gráfico

O gráfico inferior não deve parecer cortado ou vazando da tela.

Se necessário:

- reduzir altura;
- colocar dentro de um card;
- limitar área visível;
- priorizar legibilidade sobre efeito visual.

### Cancelamento

O botão “X” deve cancelar o teste.

Ao cancelar, mostrar estado claro:

> Teste cancelado.  
> Nenhum resultado foi salvo.

### Critério de aceite

Durante o teste, o usuário deve saber:

1. O que está sendo medido agora;
2. Quantas etapas existem;
3. Que o app não travou;
4. Como cancelar.

---

## Tela de resultado

### Estado atual

É a melhor tela do produto.

A hierarquia visual está boa.

Os números principais aparecem com clareza.

A classificação geral é fácil de entender.

### Problema principal

Existe risco de contradição entre diagnóstico geral e cards de uso.

Exemplo observado:

- Conexão boa;
- Download muito alto;
- Upload alto;
- Resposta 44 ms;
- Oscilação 9 ms;
- Perda 0%;
- Games online: Pode falhar.

Isso parece errado para o usuário.

Se a conexão é boa e os números são bons, “Games online” não deve aparecer como “Pode falhar” sem explicação.

### Correção necessária

Ajustar a regra visual do card “Games online”.

Critério sugerido:

- Bom:
  - Download >= 5 Mbps;
  - Resposta <= 60 ms;
  - Oscilação <= 20 ms;
  - Falhas <= 1%.

- Pode falhar:
  - velocidade suficiente, mas resposta/oscilação/falhas acima do ideal.

- Limitado:
  - velocidade insuficiente ou falhas graves.

Quando aparecer “Pode falhar”, explicar o motivo.

Exemplos:

> Pode falhar por causa do tempo de resposta.

ou:

> Pode falhar por oscilação na conexão.

### Métricas

Manter:

- Download;
- Upload;
- Resposta;
- Oscilação;
- Estabilidade.

Trocar:

> Perda de pacotes

por:

> Falhas na conexão

ou:

> Perda de sinal

### Texto explicativo

A seção “O que isso significa?” deve ser específica de acordo com o resultado.

Evitar texto genérico demais.

Exemplo para conexão boa:

> Sua internet está boa para o dia a dia. A velocidade está alta e a conexão está estável para vídeos, chamadas e trabalho remoto.

Exemplo para conexão instável:

> A velocidade pode até estar boa, mas a conexão está oscilando. Isso pode causar travamentos em chamadas, jogos e vídeos ao vivo.

### Botões

Manter “Testar novamente” como ação principal.

Transformar “Compartilhar” em botão secundário com texto claro:

> Compartilhar resultado

Evitar ícones soltos sem legenda para ações importantes.

Se houver exportação, usar texto:

> Exportar relatório

ou incluir a exportação dentro do fluxo de compartilhamento.

### IP

Se o resultado exibir IP, permitir ocultar ao compartilhar.

Recomendação:

> Ocultar meu IP ao compartilhar

Essa opção deve vir ativada por padrão.

### Critério de aceite

A tela de resultado deve explicar:

1. Qual é a qualidade geral;
2. Quais métricas sustentam essa avaliação;
3. Para quais usos a conexão serve;
4. O que pode falhar;
5. O que o usuário pode fazer em seguida.

---

## Cards “Para o que serve”

### Estado atual

A ideia é boa e deve ser mantida.

Ela diferencia o LINKA de medidores genéricos.

### Problema

Os estados “Bom” e “Pode falhar” precisam explicar o motivo.

### Estados recomendados

Usar três estados:

- Bom;
- Pode falhar;
- Limitado.

Evitar apenas:

- OK;
- Lento.

Porque isso simplifica demais.

### Cards recomendados

Manter quatro cards principais:

- Jogos online;
- Vídeo em 4K;
- Trabalho remoto;
- Videochamada.

### Texto auxiliar

Quando o status for “Pode falhar”, mostrar motivo curto.

Exemplos:

> Resposta alta.

> Conexão oscilando.

> Upload baixo.

> Falhas detectadas.

### Critério de aceite

O usuário deve entender não apenas se serve ou não serve, mas por quê.

---

## Histórico

### Estado atual

O histórico é um diferencial forte.

Ele transforma o app de medidor pontual em ferramenta de acompanhamento.

### Problemas

O gráfico atual é bonito, mas pouco informativo.

A lista mistura linguagem técnica e amigável.

A classificação antiga “Conexão estável” ainda pode aparecer se estiver salva no histórico.

O botão “Limpar histórico” está chamando atenção demais para uma ação destrutiva.

### Melhorias necessárias

Adicionar resumo antes do gráfico.

Exemplo:

> Média dos seus testes  
> Download médio: 559 Mbps  
> Upload médio: 66 Mbps  
> Resposta média: 39 ms  
> 5 testes salvos

Adicionar interpretação:

> Sua conexão ficou estável nos últimos testes.

ou:

> A velocidade caiu em relação aos testes anteriores.

### Gráfico

Avaliar se o gráfico atual deve ser:

- mantido com legenda mais clara;
- dividido em dois gráficos menores;
- ou complementado com números de média, melhor e pior teste.

Sugestão preferencial:

- Mini gráfico de download;
- Mini gráfico de upload;
- resumo textual acima.

### Lista de testes

Trocar linguagem técnica.

Evitar:

> lat 44 ms

Usar:

> Resposta 44 ms

Evitar:

> Perda de pacotes 0%

Usar:

> Falhas 0%

### Classificação salva

Não confiar apenas no texto salvo no histórico.

Se possível, recalcular a classificação com base nos valores do teste.

Isso evita que históricos antigos continuem mostrando classificações antigas como “Conexão estável”.

Caso não seja possível recalcular, criar migração de histórico.

### Botão limpar histórico

Mover para posição menos nobre.

Usar texto:

> Apagar histórico

Exigir confirmação:

> Deseja apagar todos os testes salvos?  
> Cancelar / Apagar

### Critério de aceite

O histórico deve responder:

1. Minha internet está melhorando ou piorando?
2. Qual foi minha média?
3. Qual foi meu melhor e pior teste?
4. O problema se repetiu ou foi isolado?

---

## Exportação e compartilhamento

### Estado atual

A exportação existe, mas parece relatório desktop espremido no celular.

### Melhoria necessária

Criar dois formatos:

1. Card visual para compartilhar;
2. Relatório técnico em PDF.

### Card para compartilhar

Deve ser vertical, legível e bonito no celular.

Formato sugerido:

> linka  
> Conexão boa  
>
> Download: 569 Mbps  
> Upload: 64 Mbps  
> Resposta: 44 ms  
> Estabilidade: Muito estável  
>
> Teste feito em 28/04/2026 às 02:27  
> Servidor: Cloudflare Brasil

Não exibir IP por padrão.

### PDF técnico

Pode ser mais completo, mas deve ter fonte maior e layout confortável em mobile.

Evitar tabela espremida.

### Domínio

Evitar exibir domínio inconsistente, como `linka.app`, se o app ainda está em `pages.dev`.

Usar apenas:

> Gerado por LINKA SpeedTest

ou:

> Gerado por linka

até existir domínio oficial.

### Critério de aceite

O usuário deve conseguir compartilhar o resultado no WhatsApp ou suporte sem expor dados sensíveis e sem imagem ilegível.

---

## Navegação

### Estado atual

A navegação funciona, mas há mistura de padrões:

- X;
- seta de voltar;
- ações flutuantes;
- botões de navegação.

### Direção recomendada

Usar:

- X apenas para cancelar teste em andamento;
- seta para voltar em telas secundárias;
- botão principal claro para ações importantes;
- evitar ícone flutuante sem legenda.

### Header

Manter header simples.

Sugestão:

> [Voltar/Cancelar]   linka   [Tema]

Em telas onde não há necessidade de voltar, deixar a marca central ou superior com respiro.

### Critério de aceite

O usuário deve saber como voltar, cancelar ou repetir teste sem depender do botão do navegador.

---

## PWA e tela instalada

### Nome do app

Usar:

- Nome: `linka`
- Nome curto: `linka`

Evitar:

- `linka Speed`;
- nomes longos que truncam na tela inicial.

### Tela offline

Criar tela amigável para quando o app instalado abrir sem internet.

Texto recomendado:

> Sem conexão no momento.  
> Conecte-se à internet para medir sua velocidade.

Não mostrar tela branca.

Não mostrar erro técnico.

### Critério de aceite

O app instalado deve parecer um app real mesmo quando não conseguir medir.

---

## Acessibilidade e legibilidade

### Requisitos

Garantir:

- contraste suficiente entre texto e fundo;
- fonte legível em telas pequenas;
- botões com área de toque confortável;
- textos importantes sem truncamento indevido;
- labels claras para ícones;
- foco visual correto em ações principais.

### Cuidado com textos longos

Operadora, servidor e IP podem quebrar layout.

Aplicar:

- limite de uma linha;
- reticências;
- detalhe expandido sob demanda.

---

## Ordem de prioridade

### Prioridade 0 — Confiança do diagnóstico

Implementar primeiro:

1. Corrigir inconsistência do card “Games online”;
2. Remover “Conexão estável” como classificação principal;
3. Trocar “Perda de pacotes” por linguagem amigável;
4. Parar de afirmar “Celular” quando a conexão não foi detectada;
5. Corrigir textos técnicos visíveis na interface principal.

### Prioridade 1 — Clareza de layout

Implementar depois:

6. Melhorar tela inicial com frase de valor;
7. Reescrever painel inferior;
8. Adicionar etapas durante o teste;
9. Melhorar seção “O que isso significa?”;
10. Melhorar histórico com resumo antes do gráfico.

### Prioridade 2 — Refinamento de produto

Implementar por último:

11. Criar card visual de compartilhamento;
12. Melhorar PDF técnico;
13. Criar tela offline;
14. Ajustar nome curto do PWA;
15. Revisar acessibilidade e contraste.

---

## Textos finais recomendados

### Home

> Meça sua internet e veja se ela está boa para jogos, vídeos, chamadas e trabalho.

> Pode usar até 500 MB. Prefira fazer o teste no Wi-Fi.

### Painel inferior

> Como o teste será feito

> Este aparelho → Rede atual → Servidor Cloudflare

### Teste em andamento

> Medindo download...

> Medindo upload...

> Verificando resposta da conexão...

> Analisando estabilidade...

### Resultado bom

> Sua internet está boa para o dia a dia. A velocidade está alta e a conexão está estável para vídeos, chamadas e trabalho remoto.

### Resultado instável

> A velocidade pode até estar boa, mas a conexão está oscilando. Isso pode causar travamentos em chamadas, jogos ou vídeos ao vivo.

### Games bom

> Bom para jogos online.

### Games com alerta

> Pode falhar por causa do tempo de resposta ou da oscilação.

### Histórico

> Média dos seus testes

> Sua conexão ficou estável nos últimos testes.

### Exportação

> Relatório do teste

> Gerado por linka

---

## Restrições

A IA não deve:

- redesenhar a identidade inteira;
- trocar o nome do produto;
- trocar a cor principal;
- adicionar visual gamer;
- deixar a interface mais técnica;
- criar login;
- criar ranking público;
- adicionar configurações avançadas na tela principal;
- expor IP no compartilhamento por padrão;
- alterar a lógica de medição sem autorização explícita;
- alterar endpoints, Cloudflare ou infraestrutura de teste sem autorização.

---

## Critério final de aceite

A implementação será considerada boa se:

1. O app continuar visualmente limpo;
2. A marca `linka` continuar evidente;
3. O usuário entender o que está sendo medido;
4. O resultado explicar o motivo do diagnóstico;
5. Não houver termos técnicos desnecessários na interface principal;
6. O histórico ajudar a entender tendência;
7. O compartilhamento for legível no celular;
8. Nenhuma tela parecer relatório técnico espremido;
9. O PWA instalado tiver nome e comportamento coerentes;
10. A experiência parecer produto final, não protótipo técnico.

---

## Resultado esperado

Após essas melhorias, o LINKA SpeedTest deve transmitir:

- simplicidade;
- confiança;
- clareza;
- diagnóstico útil;
- identidade própria;
- aparência de produto real.

O objetivo não é parecer mais técnico.

O objetivo é parecer mais confiável.
