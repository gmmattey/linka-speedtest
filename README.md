# LINKA SpeedTest

PWA standalone para medir velocidade e qualidade de conexão de internet com diagnóstico simples para usuário final.

O objetivo do LINKA SpeedTest não é apenas mostrar Mbps. A proposta é responder, em linguagem clara, se a conexão atual serve para usos reais como jogos online, streaming em 4K, videochamadas e trabalho remoto.

Aplicação pública:

```txt
https://linka-speedtest.pages.dev/
```

---

## Visão geral

O LINKA SpeedTest é uma versão isolada da feature de medição de velocidade do ecossistema LINKA.

Ele roda como PWA, pode ser instalado no celular ou desktop e utiliza endpoints da Cloudflare para medir:

- download;
- upload;
- tempo de resposta;
- oscilação da conexão;
- falhas/perda durante a medição;
- histórico local dos testes;
- diagnóstico por tipo de uso.

O app foi pensado para ser leve, direto e útil sem exigir login, backend ou cadastro.

---

## Principais funções

- Teste de velocidade via Cloudflare.
- Resultado com download e upload em Mbps/Gbps.
- Diagnóstico de qualidade da conexão.
- Indicadores de resposta, oscilação e estabilidade.
- Grid de uso: jogos online, streaming 4K, home office e videochamada.
- Histórico local de testes.
- Comparação com teste anterior.
- Exportação de resultado em PDF.
- Compartilhamento de resultado via Web Share API, quando disponível.
- Tema claro/escuro.
- Instalação como PWA.

---

## Stack técnica

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
  components/       Componentes reutilizáveis
  hooks/            Hooks de medição, configurações e detecção de dispositivo
  screens/          Telas principais do app
  types/            Tipagens globais
  utils/            Regras, histórico, formatação, PDF e speedtest
```

Telas principais:

```txt
StartScreen      Tela inicial e início do teste
RunningScreen    Tela de medição em andamento
ResultScreen     Resultado e diagnóstico
HistoryScreen    Histórico de testes
```

Arquivos importantes:

```txt
src/utils/speedtest.ts        Motor de medição
src/utils/classifier.ts       Regras de diagnóstico
src/utils/history.ts          Persistência local do histórico
src/utils/pdfExport.ts        Exportação em PDF
src/hooks/useDeviceInfo.ts    Detecção de dispositivo, rede e servidor
vite.config.ts                Configuração Vite/PWA
```

---

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Rodar em desenvolvimento

```bash
npm run dev
```

Por padrão, o Vite abrirá em uma URL local como:

```txt
http://localhost:5173
```

### 3. Rodar acessível pela rede local

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

Se não abrir no celular, verificar:

- se o celular e o computador estão no mesmo Wi-Fi;
- se o firewall do Windows liberou a porta;
- se há VPN ativa;
- se o roteador bloqueia comunicação entre dispositivos da rede.

---

## Scripts disponíveis

```bash
npm run dev       # ambiente de desenvolvimento
npm run build     # build de produção
npm run preview   # preview local do build
npm run lint      # lint do projeto
npm run test      # testes unitários
```

---

## Build de produção

```bash
npm run build
```

O resultado será gerado em:

```txt
dist/
```

Para validar o build localmente:

```bash
npm run preview
```

---

## Deploy

O projeto está preparado para deploy em Cloudflare Pages.

Configuração recomendada:

```txt
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

---

## Como o teste funciona

O teste usa endpoints da Cloudflare para executar medições no navegador.

Fluxo simplificado:

1. mede tempo de resposta com múltiplas amostras;
2. executa aquecimento de download;
3. executa rodadas de download;
4. executa aquecimento de upload;
5. executa rodadas de upload;
6. calcula resultado final;
7. gera diagnóstico;
8. salva histórico local.

Importante: o teste mede a conexão **do aparelho/navegador atual até a internet**.

Ele não mede diretamente:

- velocidade contratada no plano;
- velocidade real saindo do modem;
- qualidade óptica da fibra;
- sinal GPON;
- Wi-Fi de outros cômodos;
- tráfego de todos os dispositivos da casa.

Por isso, resultados podem variar conforme:

- distância do roteador;
- qualidade do Wi-Fi;
- uso da rede por outros dispositivos;
- horário;
- navegador;
- capacidade do aparelho;
- economia de energia do sistema;
- limitações de rede móvel.

---

## Regras de diagnóstico

As regras de diagnóstico ficam concentradas em:

```txt
src/utils/classifier.ts
```

A classificação principal usa categorias como:

```txt
excellent
good
fair
slow
unavailable
```

Além da classificação principal, o app pode aplicar tags independentes, como:

```txt
highLatency
lowUpload
unstable
packetLoss
veryUnstable
```

A linguagem exibida ao usuário deve evitar termos excessivamente técnicos.

Preferir:

```txt
resposta
oscilação
perda de sinal
falhas na conexão
```

Evitar na interface principal:

```txt
latência
jitter
packet loss
perda de pacotes
RTT
threshold
```

---

## Pendências técnicas

As regras de diagnóstico estão documentadas em:

```txt
docs/PendenciasTecnicas.md
```

Esse documento contém:

- auditoria das regras atuais;
- correções necessárias;
- regras consolidadas;
- textos recomendados para cliente final;
- critérios de aceite;
- testes obrigatórios;
- sugestão de IA/modelo para implementar os ajustes.

Antes de evoluir o produto, consultar esse arquivo.

---

## Privacidade

O LINKA SpeedTest não exige login.

O histórico de testes é salvo localmente no navegador, usando armazenamento local.

Atualmente o app pode exibir dados como:

- IP público;
- nome aproximado da operadora;
- servidor utilizado;
- data e hora do teste;
- tipo de dispositivo/conexão detectado ou informado.

Ao implementar compartilhamento público ou exportação de relatório, evitar expor IP por padrão.

---

## PWA

O projeto usa `vite-plugin-pwa`.

Recursos esperados:

- manifesto PWA;
- ícones instaláveis;
- modo standalone;
- orientação portrait;
- cache de arquivos estáticos;
- atualização automática do service worker.

O app deve abrir de forma limpa mesmo sem conexão, exibindo mensagem amigável. Speedtest offline não é possível, mas a experiência não deve cair em tela branca ou erro técnico.

Mensagem recomendada para estado offline:

```txt
Sem conexão no momento.
Conecte-se à internet para medir sua velocidade.
```

---

## Limitações conhecidas

### Detecção de conexão no iOS

Navegadores no iOS podem não expor o tipo real de conexão. Quando isso ocorrer, o app não deve afirmar que o usuário está em rede móvel ou Wi-Fi sem certeza.

Preferir exibir:

```txt
Conexão: Auto
```

ou:

```txt
Conexão: Não identificada
```

### Perda de sinal

A medição de falhas/perda é baseada em requisições do navegador durante o teste. Isso é útil para diagnóstico de experiência, mas não deve ser vendido como medição técnica profunda de rede, como ICMP/UDP ou equipamento de operadora.

### Diagnóstico regulatório

O app não deve afirmar que uma única medição prova descumprimento da operadora.

Usar linguagem cautelosa:

```txt
Repita o teste em horários diferentes para confirmar se o problema continua.
```

---

## Validação antes de publicar

Antes de publicar uma nova versão:

```bash
npm run lint
npm run test
npm run build
```

Também validar manualmente:

- abertura no celular;
- instalação como PWA;
- tema claro/escuro;
- teste em Wi-Fi;
- teste em rede móvel;
- histórico;
- exportação PDF;
- compartilhamento;
- tela offline;
- diagnóstico para games, streaming, home office e videochamada.

---

## Roadmap sugerido

### Prioridade 0

- Corrigir regras de diagnóstico.
- Corrigir grid de uso.
- Corrigir histórico com classificação antiga.
- Ajustar linguagem técnica para cliente final.
- Corrigir detecção de conexão no iOS.

### Prioridade 1

- Criar teste rápido e teste completo.
- Melhorar exportação mobile.
- Ocultar IP por padrão no compartilhamento.
- Melhorar gráfico de histórico.
- Criar tela offline amigável.

### Prioridade 2

- Nomear local do teste.
- Comparar testes por ambiente.
- Exportar histórico em CSV.
- Criar relatório compartilhável em imagem.
- Adicionar recomendações práticas por tipo de problema.

---

## Licença

Licença ainda não definida.

Antes de distribuir como produto público, definir explicitamente a licença do repositório.
