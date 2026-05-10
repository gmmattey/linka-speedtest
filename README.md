# LINKA SpeedTest

PWA standalone para medir velocidade e qualidade de conexÃ£o de internet com diagnÃ³stico simples para usuÃ¡rio final.

O objetivo do LINKA SpeedTest nÃ£o Ã© apenas mostrar Mbps. A proposta Ã© responder, em linguagem clara, se a conexÃ£o atual serve para usos reais como jogos online, streaming em 4K, videochamadas e trabalho remoto.

AplicaÃ§Ã£o pÃºblica:

```txt
https://linkaSpeedtestPwa.pages.dev/
```

---

## VisÃ£o geral

O LINKA SpeedTest Ã© uma versÃ£o isolada da feature de mediÃ§Ã£o de velocidade do ecossistema LINKA.

Ele roda como PWA, pode ser instalado no celular ou desktop e utiliza endpoints da Cloudflare para medir:

- download;
- upload;
- tempo de resposta;
- oscilaÃ§Ã£o da conexÃ£o;
- falhas/perda durante a mediÃ§Ã£o;
- histÃ³rico local dos testes;
- diagnÃ³stico por tipo de uso.

O app foi pensado para ser leve, direto e Ãºtil sem exigir login, backend ou cadastro.

---

## Principais funÃ§Ãµes

- Teste de velocidade via Cloudflare.
- Resultado com download e upload em Mbps/Gbps.
- DiagnÃ³stico de qualidade da conexÃ£o.
- Indicadores de resposta, oscilaÃ§Ã£o e estabilidade.
- Grid de uso: jogos online, streaming 4K, home office e videochamada.
- HistÃ³rico local de testes.
- ComparaÃ§Ã£o com teste anterior.
- ExportaÃ§Ã£o de resultado em PDF.
- Compartilhamento de resultado via Web Share API, quando disponÃ­vel.
- Tema claro/escuro.
- InstalaÃ§Ã£o como PWA.

---

## Stack tÃ©cnica

- Vite
- React
- TypeScript
- Vitest
- Recharts
- jsPDF
- html2canvas
- vite-plugin-pwa
- Cloudflare Pages

---

## Estrutura principal

```txt
src/
  components/       Componentes reutilizÃ¡veis
  hooks/            Hooks de mediÃ§Ã£o, configuraÃ§Ãµes e detecÃ§Ã£o de dispositivo
  screens/          Telas principais do app
  types/            Tipagens globais
  utils/            Regras, histÃ³rico, formataÃ§Ã£o, PDF e speedtest
```

Telas principais:

```txt
StartScreen      Tela inicial e inÃ­cio do teste
RunningScreen    Tela de mediÃ§Ã£o em andamento
ResultScreen     Resultado e diagnÃ³stico
HistoryScreen    HistÃ³rico de testes
```

Arquivos importantes:

```txt
src/utils/speedtest.ts        Motor de mediÃ§Ã£o
src/utils/classifier.ts       Regras de diagnÃ³stico
src/utils/history.ts          PersistÃªncia local do histÃ³rico
src/utils/pdfExport.ts        ExportaÃ§Ã£o em PDF
src/hooks/useDeviceInfo.ts    DetecÃ§Ã£o de dispositivo, rede e servidor
vite.config.ts                ConfiguraÃ§Ã£o Vite/PWA
```

---

## Como rodar localmente

### 1. Instalar dependÃªncias

```bash
npm install
```

### 2. Rodar em desenvolvimento

```bash
npm run dev
```

Por padrÃ£o, o Vite abrirÃ¡ em uma URL local como:

```txt
http://localhost:5173
```

### 3. Rodar acessÃ­vel pela rede local

Para testar no celular conectado ao mesmo Wi-Fi do computador:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Depois acesse no celular:

```txt
http://IP_DO_COMPUTADOR:5173
```

Exemplo:

```txt
http://192.168.1.50:5173
```

Se nÃ£o abrir no celular, verificar:

- se o celular e o computador estÃ£o no mesmo Wi-Fi;
- se o firewall do Windows liberou a porta;
- se hÃ¡ VPN ativa;
- se o roteador bloqueia comunicaÃ§Ã£o entre dispositivos da rede.

---

## Scripts disponÃ­veis

```bash
npm run dev       # ambiente de desenvolvimento
npm run build     # build de produÃ§Ã£o
npm run preview   # preview local do build
npm run lint      # lint do projeto
npm run test      # testes unitÃ¡rios
```

---

## Build de produÃ§Ã£o

```bash
npm run build
```

O resultado serÃ¡ gerado em:

```txt
dist/
```

Para validar o build localmente:

```bash
npm run preview
```

---

## Deploy

O projeto estÃ¡ preparado para deploy em Cloudflare Pages.

ConfiguraÃ§Ã£o recomendada:

```txt
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

---

## Como o teste funciona

O teste usa endpoints da Cloudflare para executar mediÃ§Ãµes no navegador.

Fluxo simplificado:

1. mede tempo de resposta com mÃºltiplas amostras;
2. executa aquecimento de download;
3. executa rodadas de download;
4. executa aquecimento de upload;
5. executa rodadas de upload;
6. calcula resultado final;
7. gera diagnÃ³stico;
8. salva histÃ³rico local.

Importante: o teste mede a conexÃ£o **do aparelho/navegador atual atÃ© a internet**.

Ele nÃ£o mede diretamente:

- velocidade contratada no plano;
- velocidade real saindo do modem;
- qualidade Ã³ptica da fibra;
- sinal GPON;
- Wi-Fi de outros cÃ´modos;
- trÃ¡fego de todos os dispositivos da casa.

Por isso, resultados podem variar conforme:

- distÃ¢ncia do roteador;
- qualidade do Wi-Fi;
- uso da rede por outros dispositivos;
- horÃ¡rio;
- navegador;
- capacidade do aparelho;
- economia de energia do sistema;
- limitaÃ§Ãµes de rede mÃ³vel.

---

## Regras de diagnÃ³stico

As regras de diagnÃ³stico ficam concentradas em:

```txt
src/utils/classifier.ts
```

A classificaÃ§Ã£o principal usa categorias como:

```txt
excellent
good
fair
slow
unavailable
```

AlÃ©m da classificaÃ§Ã£o principal, o app pode aplicar tags independentes, como:

```txt
highLatency
lowUpload
unstable
packetLoss
veryUnstable
```

A linguagem exibida ao usuÃ¡rio deve evitar termos excessivamente tÃ©cnicos.

Preferir:

```txt
resposta
oscilaÃ§Ã£o
perda de sinal
falhas na conexÃ£o
```

Evitar na interface principal:

```txt
latÃªncia
jitter
packet loss
perda de pacotes
RTT
threshold
```

---

## PendÃªncias tÃ©cnicas

As regras de diagnÃ³stico estÃ£o documentadas em:

```txt
docs/PendenciasTecnicas.md
```

Esse documento contÃ©m:

- auditoria das regras atuais;
- correÃ§Ãµes necessÃ¡rias;
- regras consolidadas;
- textos recomendados para cliente final;
- critÃ©rios de aceite;
- testes obrigatÃ³rios;
- sugestÃ£o de IA/modelo para implementar os ajustes.

Antes de evoluir o produto, consultar esse arquivo.

---

## Privacidade

O LINKA SpeedTest nÃ£o exige login.

O histÃ³rico de testes Ã© salvo localmente no navegador, usando armazenamento local.

Atualmente o app pode exibir dados como:

- IP pÃºblico;
- nome aproximado da operadora;
- servidor utilizado;
- data e hora do teste;
- tipo de dispositivo/conexÃ£o detectado ou informado.

Ao implementar compartilhamento pÃºblico ou exportaÃ§Ã£o de relatÃ³rio, evitar expor IP por padrÃ£o.

---

## PWA

O projeto usa `vite-plugin-pwa`.

Recursos esperados:

- manifesto PWA;
- Ã­cones instalÃ¡veis;
- modo standalone;
- orientaÃ§Ã£o portrait;
- cache de arquivos estÃ¡ticos;
- atualizaÃ§Ã£o automÃ¡tica do service worker.

O app deve abrir de forma limpa mesmo sem conexÃ£o, exibindo mensagem amigÃ¡vel. Speedtest offline nÃ£o Ã© possÃ­vel, mas a experiÃªncia nÃ£o deve cair em tela branca ou erro tÃ©cnico.

Mensagem recomendada para estado offline:

```txt
Sem conexÃ£o no momento.
Conecte-se Ã  internet para medir sua velocidade.
```

---

## LimitaÃ§Ãµes conhecidas

### DetecÃ§Ã£o de conexÃ£o no iOS

Navegadores no iOS podem nÃ£o expor o tipo real de conexÃ£o. Quando isso ocorrer, o app nÃ£o deve afirmar que o usuÃ¡rio estÃ¡ em rede mÃ³vel ou Wi-Fi sem certeza.

Preferir exibir:

```txt
ConexÃ£o: Auto
```

ou:

```txt
ConexÃ£o: NÃ£o identificada
```

### Perda de sinal

A mediÃ§Ã£o de falhas/perda Ã© baseada em requisiÃ§Ãµes do navegador durante o teste. Isso Ã© Ãºtil para diagnÃ³stico de experiÃªncia, mas nÃ£o deve ser vendido como mediÃ§Ã£o tÃ©cnica profunda de rede, como ICMP/UDP ou equipamento de operadora.

### DiagnÃ³stico regulatÃ³rio

O app nÃ£o deve afirmar que uma Ãºnica mediÃ§Ã£o prova descumprimento da operadora.

Usar linguagem cautelosa:

```txt
Repita o teste em horÃ¡rios diferentes para confirmar se o problema continua.
```

---

## ValidaÃ§Ã£o antes de publicar

Antes de publicar uma nova versÃ£o:

```bash
npm run lint
npm run test
npm run build
```

TambÃ©m validar manualmente:

- abertura no celular;
- instalaÃ§Ã£o como PWA;
- tema claro/escuro;
- teste em Wi-Fi;
- teste em rede mÃ³vel;
- histÃ³rico;
- exportaÃ§Ã£o PDF;
- compartilhamento;
- tela offline;
- diagnÃ³stico para games, streaming, home office e videochamada.

---

## Roadmap sugerido

### Prioridade 0

- Corrigir regras de diagnÃ³stico.
- Corrigir grid de uso.
- Corrigir histÃ³rico com classificaÃ§Ã£o antiga.
- Ajustar linguagem tÃ©cnica para cliente final.
- Corrigir detecÃ§Ã£o de conexÃ£o no iOS.

### Prioridade 1

- Criar teste rÃ¡pido e teste completo.
- Melhorar exportaÃ§Ã£o mobile.
- Ocultar IP por padrÃ£o no compartilhamento.
- Melhorar grÃ¡fico de histÃ³rico.
- Criar tela offline amigÃ¡vel.

### Prioridade 2

- Nomear local do teste.
- Comparar testes por ambiente.
- Exportar histÃ³rico em CSV.
- Criar relatÃ³rio compartilhÃ¡vel em imagem.
- Adicionar recomendaÃ§Ãµes prÃ¡ticas por tipo de problema.

---

## LicenÃ§a

LicenÃ§a ainda nÃ£o definida.

Antes de distribuir como produto pÃºblico, definir explicitamente a licenÃ§a do repositÃ³rio.

