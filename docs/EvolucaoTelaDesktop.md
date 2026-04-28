# Evolução Tela Desktop — LINKA SpeedTest

## 1. Objetivo

Adaptar as telas existentes do **LINKA SpeedTest PWA** para desktop, mantendo exatamente o mesmo produto, o mesmo fluxo e o mesmo branding atual.

A versão mobile atual está visualmente mais madura que a versão desktop. O objetivo desta evolução é fazer o app funcionar bem em telas grandes sem parecer um celular esticado no navegador.

A referência visual estrutural aprovada é a **opção 3** dos protótipos desktop: layout claro, organizado em cards, com métricas no topo, área principal de resultado/teste, diagnóstico lateral, histórico e detalhes bem distribuídos.

Importante: a opção 3 deve ser usada apenas como referência de composição, hierarquia e aproveitamento de espaço. As cores devem ser corrigidas para seguir o branding atual do LINKA SpeedTest.

---

## 2. Regra principal

Não criar produto novo.

Não criar tela nova.

Não remover tela existente.

Não mudar o fluxo funcional do PWA.

Apenas adaptar as telas atuais para desktop.

Telas existentes consideradas:

- Tela inicial;
- Tela de teste em andamento;
- Tela de resultado;
- Tela de histórico;
- Painel de detalhes/configurações atualmente exibido como bottom sheet;
- Exportação/relatório, se já existir no app.

Se alguma dessas telas não existir no código com esse nome exato, a IA deve localizar o equivalente real.

---

## 3. IA recomendada

### IA principal

Claude Code — Sonnet 4.6

Motivo:

- melhor custo-benefício para refatoração visual em React/TypeScript;
- boa aderência a documentos longos;
- boa capacidade para criar layout responsivo sem reescrever o produto inteiro;
- suficiente para CSS, Tailwind, grid, componentes e ajustes finos.

### IA para auditoria

Claude Code — Opus 4.7

Usar após a implementação para revisar:

- fidelidade ao branding;
- se telas extras foram criadas por engano;
- se o mobile foi preservado;
- se a versão desktop segue a opção 3 aprovada;
- se não houve regressão nas regras de diagnóstico.

### IA alternativa

Codex

Usar para:

- ajustes finos de CSS;
- correção de build;
- organização de componentes;
- testes;
- lint;
- revisão de responsividade.

---

## 4. Esforço estimado

Tamanho: M/G

Estimativa realista:

- 2 a 4 dias para implementação;
- 0,5 a 1 dia para revisão visual;
- 0,5 dia para correções finais.

Total estimado:

3 a 5 dias.

Divisão recomendada:

Dia 1:

- mapear telas reais;
- mapear componentes atuais;
- criar container responsivo;
- definir breakpoints;
- adaptar header e layout global.

Dia 2:

- adaptar tela inicial;
- adaptar tela de teste em andamento;
- adaptar painel de detalhes/configurações.

Dia 3:

- adaptar tela de resultado;
- adaptar histórico;
- ajustar exportação/relatório se necessário.

Dia 4:

- revisão mobile;
- revisão desktop 1366px;
- revisão desktop 1440px+;
- correções visuais;
- build/testes.

Dia 5, se necessário:

- auditoria com IA mais forte;
- refinamento de espaçamento, contraste, scroll e estados.

---

## 5. Referência visual aprovada

A referência estrutural correta é a opção 3 previamente aprovada.

A opção 3 funciona porque:

- aproveita bem o espaço horizontal;
- usa cards em grid;
- coloca métricas principais em destaque;
- distribui diagnóstico, histórico e detalhes sem empilhar tudo verticalmente;
- parece uma versão desktop real do produto;
- não depende de navegação complexa;
- não transforma o app em dashboard corporativo pesado.

A IA deve preservar essa direção estrutural.

### Imagem de referência geral

Adicionar no repositório, quando aprovado:

```md
![Referência desktop aprovada — opção 3](docs/prototipos/desktop/referencia-opcao-3-aprovada.png)
```

Observação:

A imagem deve ser usada como referência de composição, não de cor.

---

## 6. Branding obrigatório

A versão desktop deve seguir o branding atual do PWA mobile.

### 6.1. Paleta funcional

Usar os tokens/cores já existentes no projeto sempre que possível.

Se houver variáveis CSS ou tokens de tema, reutilizar. Não criar uma paleta nova sem necessidade.

Função das cores:

- Roxo LINKA: cor principal da marca, botões principais, foco, links principais, logo e ações primárias;
- Azul: download;
- Verde: upload, sucesso, conexão boa, confirmação;
- Amarelo/Laranja: alerta, atenção, “Pode falhar”, estados intermediários;
- Vermelho: erro, instabilidade crítica, ação destrutiva;
- Branco/off-white: fundo principal;
- Cinza claro: bordas, divisores, cards suaves;
- Cinza médio: textos secundários;
- Preto/cinza escuro: textos principais.

### 6.2. Uso obrigatório

Botões principais:

- roxo LINKA.

Links principais:

- roxo LINKA.

Download:

- azul.

Upload:

- verde.

Status bom:

- verde.

Status “Pode falhar”:

- amarelo/laranja.

Status crítico:

- vermelho.

Cards:

- fundo branco ou off-white;
- borda cinza clara;
- sombra sutil;
- bordas arredondadas.

### 6.3. Proibições

É proibido nesta tarefa:

- usar laranja como cor principal do produto;
- usar verde neon como identidade principal;
- trocar o app para tema escuro por padrão;
- alterar a logo;
- criar nova marca “LINKA SpeedTest” com símbolo diferente;
- usar visual dark/cyber/neon;
- criar sidebar pesada se o PWA atual não tiver essa lógica;
- transformar a tela em dashboard SaaS genérico.

O desktop deve parecer o mesmo LINKA do mobile, só que melhor adaptado para tela grande.

---

## 7. Breakpoints

Aplicar responsividade por largura.

Mobile:

- até 767px;
- manter layout atual como base;
- não quebrar fluxo existente.

Tablet:

- 768px a 1199px;
- layout intermediário;
- cards um pouco mais largos;
- menos empilhamento que mobile.

Desktop:

- 1200px a 1439px;
- usar grid;
- aproveitar largura horizontal;
- reduzir scroll desnecessário.

Desktop amplo:

- 1440px+;
- usar container máximo;
- evitar conteúdo excessivamente espalhado.

Recomendação de container:

```txt
max-width: 1440px;
margin: 0 auto;
padding-left/right: 32px;
```

Em telas muito largas:

```txt
max-width: 1600px;
padding-left/right: 48px;
```

---

## 8. Layout global desktop

### 8.1. Header

Manter o header simples e alinhado ao PWA atual.

Estrutura recomendada:

- logo à esquerda;
- navegação compacta, se já existir;
- tema claro/escuro à direita;
- ação principal à direita quando fizer sentido.

Não criar menu lateral se o app atual não usa navegação lateral.

A opção 3 tinha bom aproveitamento horizontal, mas qualquer navegação lateral só deve ser usada se não criar uma tela nova nem descaracterizar o PWA.

Preferência:

- header horizontal;
- conteúdo em grid abaixo.

### 8.2. Conteúdo

No desktop, cada tela deve usar cards e grid.

Regras:

- evitar coluna única muito estreita;
- evitar cards gigantes vazios;
- evitar botão central perdido;
- evitar bottom sheet esticado;
- evitar scroll longo quando o conteúdo cabe em grid.

### 8.3. Cards

Cards desktop devem ter:

- padding confortável;
- borda leve;
- sombra sutil;
- raio entre 16px e 24px;
- fundo branco/off-white;
- bom espaçamento interno.

Não exagerar em sombra.

Não usar gradiente pesado.

---

# 9. Tela Inicial — Desktop

## 9.1. Objetivo

A tela inicial deve continuar sendo a entrada do teste.

No mobile, o botão grande central funciona.

No desktop, a tela precisa contextualizar melhor o teste e aproveitar a largura.

A tela inicial desktop deve responder rapidamente:

- o que o teste faz;
- quanto pode consumir;
- qual servidor será usado;
- qual conexão foi detectada;
- quando foi o último teste, se houver;
- como iniciar.

## 9.2. Protótipo de referência

Adicionar no repositório:

```md
![Tela inicial desktop](docs/prototipos/desktop/tela-inicial-desktop.png)
```

A imagem deve derivar da opção 3 aprovada, com branding corrigido para o roxo LINKA.

## 9.3. Composição recomendada

Layout em duas ou três áreas:

Área principal:

- título;
- subtítulo;
- botão principal;
- aviso de consumo.

Card lateral ou inferior:

- servidor;
- conexão atual;
- dispositivo;
- último teste, se existir.

Se houver histórico:

- mostrar resumo discreto;
- não transformar a tela inicial em histórico.

## 9.4. Texto sugerido

Título:

```txt
Teste sua conexão
```

Subtítulo:

```txt
Veja se sua internet está boa para vídeos, chamadas, jogos e trabalho remoto.
```

Botão:

```txt
Iniciar teste
```

Aviso:

```txt
Pode usar até 500 MB no teste completo. Prefira testar no Wi-Fi.
```

Se já houver teste rápido/completo:

```txt
Teste rápido
Teste completo
```

Mas não criar essa feature nesta tarefa se ela ainda não estiver implementada.

## 9.5. Visual

O botão circular pode continuar como assinatura visual, mas no desktop deve ficar dentro de uma composição mais rica.

Opção recomendada:

- manter círculo roxo no card principal;
- ao lado ou abaixo, exibir informações da conexão;
- não deixar o círculo sozinho em uma tela enorme.

## 9.6. Critérios de aceite

- botão iniciar visível sem scroll;
- tela não parece vazia em desktop;
- visual segue o mobile;
- roxo LINKA é a cor principal;
- informações auxiliares não competem com o botão;
- mobile permanece igual ou melhor.

---

# 10. Tela de Teste em Andamento — Desktop

## 10.1. Objetivo

Mostrar a medição em tempo real de forma mais confortável em tela grande.

A tela precisa manter:

- etapa atual;
- valor principal;
- gráfico em tempo real;
- métricas secundárias;
- botão cancelar.

## 10.2. Protótipo de referência

Adicionar no repositório:

```md
![Teste em andamento desktop](docs/prototipos/desktop/teste-em-andamento-desktop.png)
```

## 10.3. Composição recomendada

Layout principal:

- card grande à esquerda ou centro com velocímetro;
- gráfico em tempo real abaixo do velocímetro;
- coluna de métricas secundárias à direita.

Métricas secundárias:

- resposta;
- oscilação;
- upload parcial;
- servidor;
- etapa atual.

## 10.4. Estados textuais

Exibir claramente:

```txt
Medindo download...
Medindo upload...
Verificando resposta...
Analisando estabilidade...
```

Se o app já suporta etapa numérica, usar:

```txt
1 de 4
2 de 4
3 de 4
4 de 4
```

## 10.5. Botão cancelar

Mobile:

- pode manter X.

Desktop:

- usar botão textual:

```txt
Cancelar teste
```

## 10.6. Gráfico

No desktop:

- gráfico não pode ficar cortado;
- deve ocupar largura útil;
- altura sugerida entre 180px e 280px;
- manter cor roxa se for gráfico geral;
- usar azul para download quando for série de download;
- usar verde para upload quando for série de upload.

## 10.7. Critérios de aceite

- valor principal legível;
- gráfico não corta;
- progresso compreensível;
- botão cancelar claro;
- não há elementos perdidos no espaço;
- mobile continua funcionando.

---

# 11. Tela de Resultado — Desktop

## 11.1. Objetivo

A tela de resultado é a principal tela desktop.

Ela deve aproveitar o espaço para mostrar:

- diagnóstico geral;
- métricas principais;
- “para o que serve”;
- detalhes;
- histórico recente;
- recomendações;
- ações.

Tudo isso sem parecer uma tela nova.

## 11.2. Protótipo de referência

Adicionar no repositório:

```md
![Resultado desktop](docs/prototipos/desktop/resultado-desktop.png)
```

Esta imagem deve seguir a estrutura da opção 3 aprovada.

Correções obrigatórias em relação ao protótipo original:

- trocar laranja primário por roxo LINKA;
- manter azul para download;
- manter verde para upload/sucesso;
- usar amarelo/laranja só para alerta;
- usar vermelho só para erro;
- manter fundo claro;
- manter cards suaves.

## 11.3. Composição recomendada

Topo:

- título/estado do resultado;
- data/hora;
- ações: testar novamente, compartilhar, exportar.

Cards superiores:

- download;
- upload;
- resposta;
- oscilação;
- perda de sinal/falhas.

Área principal:

- destaque do resultado ou gauge;
- diagnóstico textual;
- estabilidade;
- servidor/conexão.

Área lateral ou inferior:

- “Para o que sua internet serve?”;
- recomendações;
- histórico recente.

Rodapé da tela:

- detalhes técnicos em formato discreto.

## 11.4. Métricas obrigatórias

Exibir:

- Download;
- Upload;
- Resposta;
- Oscilação;
- Perda de sinal;
- Estabilidade.

Linguagem obrigatória:

Usar:

```txt
Resposta
Oscilação
Perda de sinal
```

Evitar na UI principal:

```txt
lat
jitter
packet loss
perda de pacotes
```

## 11.5. Diagnóstico textual

Exemplo:

```txt
Conexão boa
Sua internet está boa para o dia a dia. Vídeos, chamadas e trabalho remoto devem funcionar bem.
```

O diagnóstico deve ter destaque maior que os detalhes técnicos.

Não esconder o texto explicativo.

## 11.6. Grid “Para o que sua internet serve?”

Manter somente os itens já existentes:

- Games online;
- Streaming 4K;
- Home Office;
- Videochamada.

No desktop, eles podem aparecer como cards.

Status:

- Bom;
- Pode falhar;
- Limitado.

Se status for “Pode falhar”, mostrar motivo curto:

```txt
Pode falhar por resposta alta.
```

```txt
Pode falhar por oscilação.
```

```txt
Pode falhar por upload baixo.
```

## 11.7. Ações

Desktop deve exibir ações de forma clara:

- Testar novamente;
- Compartilhar;
- Exportar relatório;
- Ver histórico.

Botão principal:

- roxo LINKA.

Botões secundários:

- borda cinza ou roxo discreto.

Ação destrutiva:

- vermelho apenas quando necessário.

## 11.8. Detalhes

Detalhes devem ficar em área secundária:

- servidor;
- operadora;
- IP;
- data;
- localização aproximada;
- tipo de conexão.

Se houver opção de ocultar IP ao compartilhar, manter IP oculto por padrão em exportações.

## 11.9. Critérios de aceite

- resultado é legível em desktop;
- diagnóstico aparece com destaque;
- métricas estão organizadas em cards;
- ações são fáceis de encontrar;
- cores seguem branding;
- não há laranja como cor principal;
- mobile não quebra.

---

# 12. Tela de Histórico — Desktop

## 12.1. Objetivo

No desktop, o histórico deve deixar de parecer uma lista mobile esticada.

Deve mostrar:

- evolução recente;
- média;
- lista/tabela;
- detalhes por teste;
- exportação;
- limpeza de histórico com cautela.

## 12.2. Protótipo de referência

Adicionar no repositório:

```md
![Histórico desktop](docs/prototipos/desktop/historico-desktop.png)
```

## 12.3. Composição recomendada

Topo:

- título “Histórico de testes”;
- ação de exportar;
- filtros, se já existirem.

Área superior:

- gráfico de evolução;
- média dos testes;
- insight curto.

Área principal:

- tabela de testes.

## 12.4. Tabela desktop

Em desktop, usar tabela.

Colunas recomendadas:

- Data;
- Download;
- Upload;
- Resposta;
- Oscilação;
- Perda de sinal;
- Qualidade;
- Servidor/Operadora.

No mobile:

- manter lista/cards.

## 12.5. Gráfico

O gráfico deve ser funcional, não decorativo.

Regras:

- legenda clara;
- download azul;
- upload verde;
- eixo/escala compreensível;
- evitar upload esmagado se a escala do download for muito maior;
- considerar separar download e upload em dois gráficos ou normalizar visualmente.

## 12.6. Limpar histórico

A ação “Limpar histórico” não deve ficar grande e central demais em desktop.

Recomendado:

- colocar no rodapé da área de histórico;
- usar vermelho discreto;
- exigir confirmação.

Texto de confirmação:

```txt
Deseja apagar todos os testes salvos?
Essa ação não pode ser desfeita.
```

Botões:

```txt
Cancelar
Apagar histórico
```

## 12.7. Critérios de aceite

- histórico usa tabela no desktop;
- gráfico fica legível;
- ação destrutiva exige confirmação;
- mobile continua com lista/cards;
- classificações antigas não aparecem com texto incorreto;
- cores seguem branding.

---

# 13. Painel de Detalhes / Configurações — Desktop

## 13.1. Objetivo

O bottom sheet atual funciona no mobile, mas em desktop não deve parecer uma gaveta mobile gigante.

Adaptar o mesmo conteúdo para uma apresentação melhor em desktop.

Não criar tela nova de configurações.

## 13.2. Protótipo de referência

Adicionar no repositório:

```md
![Painel de detalhes desktop](docs/prototipos/desktop/painel-detalhes-desktop.png)
```

## 13.3. Comportamento

Mobile:

- manter bottom sheet.

Desktop:

- usar painel lateral;
- ou modal central;
- ou card fixo de detalhes;
- escolher o menor ajuste compatível com a estrutura atual.

## 13.4. Conteúdo preservado

Manter os dados já existentes:

- servidor;
- operadora;
- localização;
- IP;
- dispositivo;
- unidade;
- gráfico;
- conexão;
- servidor selecionado.

Não adicionar dado novo nesta tarefa.

## 13.5. Linguagem

Evitar siglas sem contexto:

Trocar:

```txt
Cloudflare · GIG
BR · GIG
```

Por algo mais claro, quando possível:

```txt
Cloudflare Brasil
Servidor próximo
```

Se a sigla precisar permanecer, colocá-la em detalhes técnicos.

## 13.6. Controles

No desktop, controles podem ter mais espaço:

- Unidade: Mbps / Gbps;
- Gráfico: Normal / Detalhado;
- Conexão: Auto / Wi-Fi / Cabo / Celular.

Evitar expor “Linear / Logarítmica” para usuário comum.

Se precisar manter, colocar em seção avançada.

## 13.7. Critérios de aceite

- mobile mantém bottom sheet;
- desktop não usa gaveta gigante;
- mesmos dados aparecem;
- não há tela nova;
- controles ficam claros;
- branding preservado.

---

# 14. Exportação / Relatório — Desktop

## 14.1. Objetivo

Se a exportação/relatório já existir, adaptar a visualização/geração para ficar melhor em desktop.

Não criar nova feature de relatório se ela ainda não existir.

## 14.2. Protótipo de referência

Adicionar no repositório, se aplicável:

```md
![Relatório desktop](docs/prototipos/desktop/relatorio-desktop.png)
```

## 14.3. Regras

O relatório deve:

- usar logo atual;
- usar roxo LINKA como cor principal;
- usar azul para download;
- usar verde para upload/sucesso;
- evitar laranja como identidade principal;
- ser legível em PDF ou imagem;
- não expor IP por padrão, se já existir privacidade de compartilhamento.

## 14.4. Critérios de aceite

- exportação continua funcionando;
- visual fica alinhado ao branding;
- relatório não parece imagem pequena perdida em tela grande;
- não cria tela nova desnecessária.

---

# 15. Componentes recomendados

Criar ou ajustar apenas se fizer sentido na estrutura atual.

Possíveis componentes:

- ResponsivePageContainer;
- DesktopHeader;
- MetricCard;
- ResultGauge;
- UseCaseGrid;
- ConnectionDetailsPanel;
- HistoryTable;
- HistoryChart;
- ActionBar.

Não criar abstração só por criar.

Se um componente atual já resolve, apenas adaptar.

---

# 16. Regras técnicas de implementação

## 16.1. Mobile first

Manter mobile como base.

Desktop deve ser adicionado por breakpoint.

Não reescrever tudo.

## 16.2. CSS / Tailwind

Usar a abordagem já existente no projeto.

Se o projeto usa Tailwind:

- usar classes responsivas;
- evitar CSS inline excessivo;
- reutilizar tokens.

Se usa CSS module/global:

- manter padrão atual;
- criar classes responsivas bem nomeadas.

## 16.3. Grid

Desktop deve usar grid.

Exemplos conceituais:

- resultado: grid de 12 colunas;
- histórico: gráfico + resumo + tabela;
- painel: modal/painel lateral;
- tela inicial: hero + resumo.

## 16.4. Preservação funcional

Não alterar:

- motor do speedtest;
- endpoints;
- cálculo de diagnóstico;
- histórico;
- exportação;
- tema;
- PWA config;
- service worker.

Esta tarefa é de layout responsivo.

---

# 17. Acessibilidade

Garantir:

- contraste adequado;
- foco visível;
- botão de ícone com aria-label;
- navegação por teclado;
- status com texto, não apenas cor;
- textos não menores que 14px;
- cards clicáveis com área confortável.

Status devem sempre ter texto:

- Bom;
- Pode falhar;
- Limitado;
- Instável;
- Excelente.

---

# 18. Checklist de implementação

A IA deve executar:

1. Mapear telas reais existentes.
2. Confirmar componentes atuais.
3. Identificar tokens/cores atuais.
4. Definir breakpoints.
5. Criar/adaptar container responsivo.
6. Adaptar header.
7. Adaptar tela inicial.
8. Adaptar teste em andamento.
9. Adaptar resultado.
10. Adaptar histórico.
11. Adaptar bottom sheet/painel.
12. Adaptar exportação/relatório apenas se já existir.
13. Revisar branding.
14. Testar mobile.
15. Testar tablet.
16. Testar desktop 1366px.
17. Testar desktop 1440px+.
18. Rodar build.
19. Rodar testes, se existirem.

---

# 19. Critérios globais de aceite

A implementação só será aceita se:

- nenhuma tela nova for criada;
- nenhuma tela existente for removida;
- mobile continuar funcionando;
- desktop não parecer mobile esticado;
- opção 3 aprovada for respeitada como estrutura;
- cores forem corrigidas para o branding atual;
- roxo LINKA for a cor principal;
- laranja não for cor principal;
- verde neon não for usado;
- fundo claro for mantido;
- cards forem suaves e limpos;
- histórico usar melhor o espaço horizontal;
- bottom sheet não virar gaveta gigante em desktop;
- ações principais forem claras;
- build passar.

---

# 20. Comandos obrigatórios

Executar:

```bash
npm run build
```

Se existir:

```bash
npm run test
```

Se existir:

```bash
npm run lint
```

---

# 21. Prompt para IA executar

Use este prompt com a IA de código:

```txt
Você vai adaptar o LINKA SpeedTest PWA para desktop.

Leia o arquivo evolucaoTelaDesktop.md inteiro antes de alterar código.

Objetivo:
Criar uma versão responsiva desktop das telas já existentes do PWA, sem criar telas novas e sem remover telas atuais.

Referência estrutural:
Usar a opção 3 aprovada como referência de composição desktop:
- cards no topo;
- área principal de resultado/teste;
- diagnóstico lateral ou complementar;
- histórico em tabela/gráfico;
- detalhes em área secundária;
- boa ocupação horizontal.

Atenção:
A opção 3 deve ser usada apenas como referência estrutural. As cores devem seguir o branding atual do PWA.

Branding obrigatório:
- Roxo LINKA como cor principal.
- Azul para download.
- Verde para upload e sucesso.
- Amarelo/laranja apenas para alerta.
- Vermelho apenas para erro ou ação destrutiva.
- Fundo claro.
- Cards brancos/off-white com borda leve.
- Não usar laranja como cor principal.
- Não usar verde neon.
- Não criar tema escuro por padrão.
- Não alterar a logo.

Telas a adaptar:
- Tela inicial;
- Teste em andamento;
- Resultado;
- Histórico;
- Painel de detalhes/configurações/bottom sheet;
- Exportação/relatório apenas se já existir.

Restrições:
- Não criar dashboard nova.
- Não criar login.
- Não criar backend.
- Não alterar motor do speedtest.
- Não alterar endpoints.
- Não alterar regras de diagnóstico.
- Não adicionar tela Sobre se ela não existir.
- Não criar tela a mais ou a menos.
- Não quebrar mobile.

Tarefas:
1. Mapear telas e componentes atuais.
2. Identificar cores/tokens atuais do branding.
3. Definir breakpoints mobile/tablet/desktop.
4. Criar ou ajustar container responsivo.
5. Adaptar tela inicial.
6. Adaptar tela de teste em andamento.
7. Adaptar tela de resultado.
8. Adaptar tela de histórico.
9. Adaptar painel/bottom sheet para desktop.
10. Adaptar exportação/relatório apenas se já existir.
11. Validar mobile.
12. Validar desktop 1366px.
13. Validar desktop 1440px+.
14. Rodar build e testes.

Critério final:
O app deve parecer uma versão desktop natural do mesmo PWA mobile, seguindo a estrutura da opção 3 aprovada e o branding atual do LINKA.
```

---

# 22. Observação final

A versão desktop não precisa parecer outro produto.

Ela precisa parecer o LINKA SpeedTest atual, só que melhor distribuído em tela grande.

A opção 3 é a direção correta pela estrutura.

A correção obrigatória é visual:

- sair do laranja como principal;
- voltar para o roxo LINKA;
- manter azul/verde nas métricas;
- preservar fundo claro;
- não inventar telas;
- não criar identidade paralela.

Este documento substitui qualquer versão anterior desalinhada com o branding.
