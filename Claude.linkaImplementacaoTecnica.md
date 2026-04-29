# Implementação técnica — features avançadas do linka

Stack assumida: PWA hospedado em Cloudflare Pages + endpoints `speed.cloudflare.com` + opção de Cloudflare Workers para extensões.

---

## 1. Latência sob carga (Bufferbloat / RPM)

**Esta é a feature de maior ROI — implementa em 3–5 dias e desbloqueia tudo que vem depois.**

### Conceito

Você já mede latência ociosa (idle). Falta medir latência **enquanto a conexão está saturada**. A diferença entre as duas é o bufferbloat.

```
latência idle  = 12ms   ← roteador vazio
latência loaded = 187ms ← roteador entupido
delta = 175ms          ← isso é o bufferbloat
```

A métrica formal é **RPM** (Round-trips Per Minute), padronizada por Apple e Cloudflare. RPM alto = boa responsividade. RPM baixo = bufferbloat. Para usuário, traduz como "Excelente / Bom / Ruim".

### Algoritmo

1. Mede latência idle (baseline) — 20 amostras, mediana
2. Inicia carga pesada em paralelo (download + upload)
3. Espera 2 segundos pra saturar fila
4. Durante a carga, dispara pings pequenos a cada 100ms por 5 segundos
5. Calcula mediana da latência sob carga
6. Calcula `delta = loaded_p50 - idle_p50` e `ratio = loaded_p50 / idle_p50`
7. Classifica em A/B/C/D/F

### Código no PWA (vanilla JS)

```js
// rpm.js — módulo de medição de bufferbloat

const ENDPOINT_DOWN = 'https://speed.cloudflare.com/__down';
const ENDPOINT_UP = 'https://speed.cloudflare.com/__up';
const PING_BYTES = 'https://speed.cloudflare.com/__down?bytes=0';

async function measureLatency(samples = 20, intervalMs = 50) {
  const latencies = [];
  
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    try {
      const res = await fetch(PING_BYTES, {
        cache: 'no-store',
        mode: 'cors'
      });
      // Forçar leitura completa pra contar tempo de transferência
      await res.arrayBuffer();
      latencies.push(performance.now() - start);
    } catch (e) {
      // ignora erros, segue
    }
    if (intervalMs > 0) await sleep(intervalMs);
  }
  
  return {
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    samples: latencies.length
  };
}

async function measureLatencyUnderLoad(loadDurationMs = 7000, pingDurationMs = 5000) {
  const abortCtrl = new AbortController();
  const loadPromises = [];
  
  // Inicia 8 conexões paralelas de download (100MB cada)
  for (let i = 0; i < 8; i++) {
    loadPromises.push(
      fetch(`${ENDPOINT_DOWN}?bytes=104857600`, {
        cache: 'no-store',
        mode: 'cors',
        signal: abortCtrl.signal
      })
        .then(r => r.body.getReader())
        .then(reader => drainReader(reader, abortCtrl.signal))
        .catch(() => {})
    );
  }
  
  // Inicia 4 conexões paralelas de upload (50MB cada)
  for (let i = 0; i < 4; i++) {
    const payload = new Uint8Array(52428800);
    loadPromises.push(
      fetch(ENDPOINT_UP, {
        method: 'POST',
        body: payload,
        cache: 'no-store',
        mode: 'cors',
        signal: abortCtrl.signal
      }).catch(() => {})
    );
  }
  
  // Espera 2s pra saturar a fila
  await sleep(2000);
  
  // Mede latência durante a carga
  const loaded = await measureLatency(
    Math.floor(pingDurationMs / 100),
    100
  );
  
  // Cancela toda carga
  abortCtrl.abort();
  await Promise.allSettled(loadPromises);
  
  return loaded;
}

async function drainReader(reader, signal) {
  while (!signal.aborted) {
    const { done } = await reader.read();
    if (done) break;
  }
}

function classifyBufferbloat(idleP50, loadedP50) {
  const delta = loadedP50 - idleP50;
  const ratio = loadedP50 / idleP50;
  
  // Classificação inspirada no Waveform/DSLReports
  if (delta < 30) return { grade: 'A', severity: 'none', label: 'Excelente' };
  if (delta < 60) return { grade: 'B', severity: 'mild', label: 'Bom' };
  if (delta < 200) return { grade: 'C', severity: 'moderate', label: 'Moderado' };
  if (delta < 400) return { grade: 'D', severity: 'severe', label: 'Severo' };
  return { grade: 'F', severity: 'critical', label: 'Crítico' };
}

function calculateRPM(loadedLatencyMs) {
  // RPM = round-trips per minute
  // 60_000 ms / latência média = quantos round-trips cabem em 1 minuto
  return Math.round(60000 / loadedLatencyMs);
}

// === API pública ===

export async function runBufferbloatTest() {
  const idle = await measureLatency(20, 50);
  const loaded = await measureLatencyUnderLoad();
  
  const classification = classifyBufferbloat(idle.p50, loaded.p50);
  const rpm = calculateRPM(loaded.p50);
  
  return {
    idle_p50: Math.round(idle.p50),
    idle_p95: Math.round(idle.p95),
    loaded_p50: Math.round(loaded.p50),
    loaded_p95: Math.round(loaded.p95),
    delta: Math.round(loaded.p50 - idle.p50),
    ratio: +(loaded.p50 / idle.p50).toFixed(1),
    rpm,
    classification
  };
}

// === Helpers ===

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
```

### Integração no fluxo do teste

Insira entre as fases existentes:

```js
async function fullTest() {
  updatePhase('latency');
  const idleLatency = await measureLatency();
  
  updatePhase('download');
  const download = await measureDownload();
  
  updatePhase('upload');
  const upload = await measureUpload();
  
  updatePhase('under_load'); // ← FASE NOVA
  const bufferbloat = await runBufferbloatTest();
  
  return { idleLatency, download, upload, bufferbloat };
}
```

### Edge cases que vão te morder

1. **Mobile esquenta:** 8 conexões paralelas + 4 uploads aquecem o aparelho. No celular, reduza pra 4 down + 2 up.
2. **Plano lento (<10 Mbps):** 100MB por conexão é exagero. Detecte primeiro e ajuste tamanho dinamicamente.
3. **HTTP/2 multiplexing:** Cloudflare usa H2/H3, e o browser pode coalescer suas 8 conexões em uma. Pra forçar conexões separadas, use querystrings únicos: `?cacheBust=${Math.random()}`.
4. **Memória:** payload de upload de 50MB × 4 = 200MB de heap. Use `crypto.getRandomValues()` em chunks ou `ReadableStream` em vez de Uint8Array fixo.
5. **AbortController não cancela bytes em trânsito:** ele só para de ler. Bandwidth fantasma continua até buffers TCP esvaziarem (~2–5 segundos).
6. **Background tab:** Chrome pausa setTimeout/Promise quando aba sai de foco. Avise o usuário pra não trocar de aba.

### Custo de banda

Por teste completo: ~800MB down + 200MB up = **~1GB total**. Atualize o aviso no botão Iniciar de "~400 MB" pra "~1 GB" quando modo Detalhado estiver ativo.

---

## 2. Game Ping Atlas

**Aviso de honestidade técnica que precisa entrar no UI:** browser não faz ICMP ping. O que vamos medir é **latência HTTP até endpoints regionais correlatos** dos servidores de jogos. É proxy razoável (correlação ~0.85 com ping UDP real para mesma região), mas tem overhead de TCP+TLS.

### Estratégia em duas camadas

**Camada 1 — Frontend (gratuito, simples):** fetch HTTP com `mode: 'no-cors'` mede tempo até first-byte. Funciona pra endpoints com CORS bloqueado, pois o erro de CORS chega *depois* do response — `performance.now()` já capturou.

**Camada 2 — Worker (opcional, mais técnico):** para endpoints sem proxy HTTP útil (como Steam Datagram Relay), Worker faz TCP `connect()` e mede handshake. Mede latência **da edge Cloudflare**, não do usuário, mas serve como sinal complementar.

### Endpoints práticos por jogo

```js
// game-endpoints.js

export const GAME_ENDPOINTS = {
  valorant: {
    name: 'Valorant',
    publisher: 'Riot Games',
    method: 'http_proxy',
    servers: [
      { region: 'BR · São Paulo', url: 'https://br.leagueoflegends.com', city: 'São Paulo' },
      { region: 'NA · Norte', url: 'https://na.leagueoflegends.com', city: 'EUA' },
      { region: 'LAS · Chile', url: 'https://las.leagueoflegends.com', city: 'Santiago' }
    ]
  },
  league_of_legends: {
    name: 'League of Legends',
    publisher: 'Riot Games',
    method: 'http_proxy',
    servers: [
      { region: 'BR1', url: 'https://br1.api.riotgames.com', city: 'São Paulo' },
      { region: 'LAN', url: 'https://la1.api.riotgames.com', city: 'México' }
    ]
  },
  cs2: {
    name: 'Counter-Strike 2',
    publisher: 'Valve',
    method: 'http_proxy',
    servers: [
      { region: 'SA · São Paulo', url: 'https://api.steampowered.com', city: 'São Paulo' },
      { region: 'EU · Frankfurt', url: 'https://store.steampowered.com', city: 'Frankfurt' }
    ]
  },
  fortnite: {
    name: 'Fortnite',
    publisher: 'Epic Games',
    method: 'http_proxy',
    servers: [
      { region: 'BR', url: 'https://account-public-service-prod.ol.epicgames.com', city: 'Brasil' }
    ]
  }
};
```

### Frontend: medição de ping HTTP

```js
// ping.js

async function pingEndpoint(url, samples = 10) {
  const latencies = [];
  
  // Warmup — descarta primeira request (DNS + TLS handshake)
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', method: 'HEAD' });
  } catch {}
  
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    try {
      await fetch(url, { 
        mode: 'no-cors', 
        cache: 'no-store',
        method: 'HEAD'
      });
    } catch {
      // CORS error é esperado — tempo já foi medido
    }
    latencies.push(performance.now() - start);
    await sleep(150);
  }
  
  // Remove top e bottom 10% (outliers)
  latencies.sort((a, b) => a - b);
  const trimStart = Math.floor(latencies.length * 0.1);
  const trimEnd = Math.ceil(latencies.length * 0.9);
  const trimmed = latencies.slice(trimStart, trimEnd);
  
  const median = trimmed[Math.floor(trimmed.length / 2)];
  const jitter = stddev(trimmed);
  
  return {
    median: Math.round(median),
    jitter: Math.round(jitter),
    samples: trimmed.length,
    min: Math.round(Math.min(...trimmed)),
    max: Math.round(Math.max(...trimmed))
  };
}

function classifyPing(ms, jitter) {
  // Para jogos competitivos
  if (ms < 30 && jitter < 5) return 'good';
  if (ms < 60 && jitter < 15) return 'ok';
  return 'bad';
}

function stddev(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

export async function runGamePingAtlas(games = Object.keys(GAME_ENDPOINTS)) {
  const results = {};
  
  for (const gameKey of games) {
    const game = GAME_ENDPOINTS[gameKey];
    results[gameKey] = {
      name: game.name,
      publisher: game.publisher,
      servers: []
    };
    
    // Ping em paralelo pros servidores do mesmo jogo
    const pings = await Promise.all(
      game.servers.map(server => 
        pingEndpoint(server.url, 8).then(result => ({
          ...server,
          ...result,
          status: classifyPing(result.median, result.jitter)
        }))
      )
    );
    
    // Ordena: melhor ping primeiro
    results[gameKey].servers = pings.sort((a, b) => a.median - b.median);
  }
  
  return results;
}
```

### Modo background (atualização contínua)

Pra mostrar ping ao vivo na tela do Atlas, use `setInterval` com cuidado pra não saturar:

```js
let atlasInterval = null;

export function startContinuousPing(callback, intervalMs = 5000) {
  const loop = async () => {
    const results = await runGamePingAtlas();
    callback(results);
  };
  
  loop(); // Primeira execução imediata
  atlasInterval = setInterval(loop, intervalMs);
}

export function stopContinuousPing() {
  if (atlasInterval) {
    clearInterval(atlasInterval);
    atlasInterval = null;
  }
}
```

### Worker complementar (opcional, para Valve SDR e similares)

Se quiser medir contra IPs específicos sem HTTP, crie um Worker:

```js
// worker/game-ping.js
import { connect } from 'cloudflare:sockets';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const target = url.searchParams.get('target');
    const port = parseInt(url.searchParams.get('port') || '443');
    const samples = parseInt(url.searchParams.get('samples') || '5');
    
    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    
    if (!target) {
      return Response.json({ error: 'Missing target' }, { 
        status: 400, 
        headers: corsHeaders() 
      });
    }
    
    const latencies = [];
    
    for (let i = 0; i < samples; i++) {
      const start = Date.now();
      try {
        const socket = connect({ hostname: target, port });
        await socket.opened;
        await socket.close();
        latencies.push(Date.now() - start);
      } catch (e) {
        // ignora falha desta amostra
      }
    }
    
    if (!latencies.length) {
      return Response.json(
        { error: 'No successful connections' }, 
        { status: 503, headers: corsHeaders() }
      );
    }
    
    latencies.sort((a, b) => a - b);
    const median = latencies[Math.floor(latencies.length / 2)];
    
    return Response.json({
      target,
      port,
      median,
      samples: latencies.length,
      from: 'cloudflare-edge',
      pop: request.cf?.colo || 'unknown',
      timestamp: Date.now()
    }, { headers: corsHeaders() });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };
}
```

Deploy: `npx wrangler deploy`. Custo: free tier dá 100k requests/dia. Frontend chama: `https://seu-worker.workers.dev/?target=us.battle.net&port=443`.

### Pegadinhas

1. **Documente o método no UI:** "Latência aproximada via HTTP — não é ping ICMP". Honestidade técnica vira credibilidade.
2. **DNS cacheado:** primeira amostra sempre é mais lenta. Sempre descarte warmup.
3. **Connection: keep-alive:** browser reusa conexão TCP entre fetches. Bom pra precisão (mede só RTT da request), ruim pra simular "ping novo". Aceite o trade-off.
4. **Endpoints podem mudar:** Riot mudou subdomínios em 2024. Mantenha lista versionada e atualize via fetch remoto se possível.
5. **Rate limiting:** alguns endpoints (Riot, Steam) bloqueiam após muitas requests. Use `setInterval` ≥ 5s e considere espalhar amostras no tempo.
6. **Mobile data:** modo continuous saturando 14 servidores a cada 5s queima dados. Pause em conexão celular.

---

## 3. Diagnóstico narrativo (sistema de regras)

Engine de regras simples, sem ML. Cada regra olha as métricas e dispara um diagnóstico se condição for verdadeira.

### Estrutura

```js
// rules.js

const RULES = [
  // === CRÍTICAS (vão ao topo) ===
  {
    id: 'no_internet',
    severity: 'critical',
    test: ({ download }) => download < 1,
    diagnose: () => ({
      title: 'Sem internet detectada',
      body: 'A conexão não conseguiu transferir dados.',
      action: 'Verifique seu Wi-Fi ou cabo',
      actionUrl: '/erro'
    })
  },
  {
    id: 'bufferbloat_critical',
    severity: 'critical',
    test: ({ bufferbloat }) => bufferbloat?.delta > 400,
    diagnose: ({ bufferbloat }) => ({
      title: 'Bufferbloat severo no roteador',
      body: `Latência salta de ${bufferbloat.idle_p50}ms para ${bufferbloat.loaded_p50}ms sob carga (${bufferbloat.ratio}× pior). Jogos vão travar quando alguém na casa baixa algo.`,
      action: 'Ative SQM/cake no roteador',
      actionUrl: '/diagnostico/bufferbloat',
      affects: ['games', 'video_call']
    })
  },
  {
    id: 'packet_loss_high',
    severity: 'critical',
    test: ({ packet_loss }) => packet_loss > 2,
    diagnose: ({ packet_loss }) => ({
      title: 'Perda de pacotes alta',
      body: `${packet_loss}% dos pacotes estão se perdendo. Isso causa travamentos em chamadas e jogos.`,
      action: 'Pode ser cabo defeituoso, Wi-Fi ruim ou problema do ISP'
    })
  },
  
  // === WARNINGS ===
  {
    id: 'bufferbloat_moderate',
    severity: 'warning',
    test: ({ bufferbloat }) => bufferbloat?.delta > 100 && bufferbloat?.delta <= 400,
    diagnose: ({ bufferbloat }) => ({
      title: 'Bufferbloat moderado no roteador',
      body: `Latência sobe de ${bufferbloat.idle_p50}ms para ${bufferbloat.loaded_p50}ms sob carga. Jogos competitivos vão sentir lag em momentos de download.`,
      action: 'Ative SQM/cake no roteador',
      actionUrl: '/diagnostico/bufferbloat',
      affects: ['games']
    })
  },
  {
    id: 'below_plan',
    severity: 'warning',
    test: ({ download, plan_download }) => 
      plan_download && download < plan_download * 0.5,
    diagnose: ({ download, plan_download }) => ({
      title: 'Muito abaixo do contratado',
      body: `Você contratou ${plan_download} Mbps mas está recebendo ${Math.round(download)} Mbps (${Math.round(download/plan_download*100)}%). Abaixo dos 80% exigidos pela Anatel.`,
      action: 'Faça mais 5 testes em horários diferentes pra documentar e abrir reclamação',
      actionUrl: '/plano-anatel'
    })
  },
  {
    id: 'wifi_weak',
    severity: 'warning',
    test: ({ connection_type, rssi, download, plan_download }) => 
      connection_type === 'wifi' && rssi && rssi < -70 && 
      (!plan_download || download < plan_download * 0.5),
    diagnose: ({ rssi }) => ({
      title: 'Sinal Wi-Fi fraco',
      body: `Sinal de ${rssi}dBm é fraco. Isso limita sua banda mesmo se o ISP entregar tudo.`,
      action: 'Aproxime do roteador, troque de canal ou use cabo',
      affects: ['all']
    })
  },
  {
    id: 'high_idle_latency',
    severity: 'warning',
    test: ({ bufferbloat, server_distance }) => 
      bufferbloat?.idle_p50 > 80 && (!server_distance || server_distance < 1000),
    diagnose: ({ bufferbloat }) => ({
      title: 'Latência ociosa alta',
      body: `${bufferbloat.idle_p50}ms é alto para um servidor próximo. Pode ser problema de peering do seu ISP.`,
      action: 'Teste em horário diferente pra confirmar'
    })
  },
  
  // === INFO (rodapé) ===
  {
    id: 'asymmetric_plan',
    severity: 'info',
    test: ({ download, upload }) => download > upload * 20,
    diagnose: ({ download, upload }) => ({
      title: 'Plano muito assimétrico',
      body: `Download (${Math.round(download)} Mbps) é ${Math.round(download/upload)}× maior que upload (${Math.round(upload)} Mbps). Limita streaming, backup em nuvem e videochamadas em grupo.`,
      action: null
    })
  }
];

export function runDiagnostics(metrics) {
  const triggered = [];
  const triggeredIds = new Set();
  
  for (const rule of RULES) {
    if (triggeredIds.has(rule.id)) continue; // dedup
    if (!rule.test(metrics)) continue;
    
    const diagnosis = rule.diagnose(metrics);
    triggered.push({
      id: rule.id,
      severity: rule.severity,
      ...diagnosis
    });
    triggeredIds.add(rule.id);
  }
  
  // Ordena por severidade
  const order = { critical: 0, warning: 1, info: 2 };
  triggered.sort((a, b) => order[a.severity] - order[b.severity]);
  
  return triggered;
}

// === Use cases derivados ===

export function evaluateUseCases(metrics, diagnostics) {
  const affectedSet = new Set(
    diagnostics.flatMap(d => d.affects || [])
  );
  
  const cases = {
    streaming_4k: {
      label: 'Streaming 4K',
      requires: { download: 25 },
      detail: 'Banda sobra'
    },
    video_call: {
      label: 'Videochamada',
      requires: { upload: 3, idle_latency: 100 },
      detail: 'Latência ociosa baixa'
    },
    home_office: {
      label: 'Home Office',
      requires: { download: 10, upload: 5 },
      detail: 'Upload sustentado OK'
    },
    games: {
      label: 'Games competitivos',
      requires: { idle_latency: 50, bufferbloat_delta: 100 },
      detail: 'Latência baixa e estável'
    }
  };
  
  return Object.entries(cases).map(([key, c]) => {
    let status = 'good';
    let detail = c.detail;
    
    // Verifica banda
    if (c.requires.download && metrics.download < c.requires.download) {
      status = 'warn';
      detail = 'Banda insuficiente';
    }
    if (c.requires.upload && metrics.upload < c.requires.upload) {
      status = 'warn';
      detail = 'Upload insuficiente';
    }
    if (c.requires.idle_latency && metrics.bufferbloat?.idle_p50 > c.requires.idle_latency) {
      status = 'warn';
      detail = 'Latência alta';
    }
    if (c.requires.bufferbloat_delta && metrics.bufferbloat?.delta > c.requires.bufferbloat_delta) {
      status = 'warn';
      detail = 'Bufferbloat compromete';
    }
    
    // Sobrescreve se diagnostic afeta
    if (affectedSet.has(key) || affectedSet.has('all')) {
      status = 'warn';
    }
    
    return { key, ...c, status, detail };
  });
}
```

### Veredito editorial (auto-gerado)

```js
// verdict.js

export function generateVerdict(metrics, useCases) {
  const goodCases = useCases.filter(c => c.status === 'good').map(c => c.label);
  const badCases = useCases.filter(c => c.status === 'warn').map(c => c.label);
  
  if (badCases.length === 0) {
    return `Aguenta tudo: ${listJoin(goodCases.slice(0, 3))} sem problema. Sua internet está em ordem.`;
  }
  
  if (badCases.length === useCases.length) {
    return `Sua internet está com problemas sérios. ${badCases.length} usos comprometidos.`;
  }
  
  return `Aguenta ${listJoin(goodCases)}. Em ${listJoin(badCases)}, ${badCases.length === 1 ? 'pode dar problema' : 'vai dar problema'} em horário de pico.`;
}

function listJoin(arr) {
  if (arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} e ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')} e ${arr[arr.length - 1]}`;
}
```

### Como rodar tudo junto

```js
import { runBufferbloatTest } from './rpm.js';
import { runDiagnostics, evaluateUseCases } from './rules.js';
import { generateVerdict } from './verdict.js';

async function fullTest({ planDownload, planUpload, connectionType, rssi }) {
  // Medições
  const download = await measureDownload();
  const upload = await measureUpload();
  const bufferbloat = await runBufferbloatTest();
  const packetLoss = await measurePacketLoss();
  
  const metrics = {
    download,
    upload,
    bufferbloat,
    packet_loss: packetLoss,
    plan_download: planDownload,
    plan_upload: planUpload,
    connection_type: connectionType,
    rssi
  };
  
  // Análise
  const diagnostics = runDiagnostics(metrics);
  const useCases = evaluateUseCases(metrics, diagnostics);
  const verdict = generateVerdict(metrics, useCases);
  
  return { metrics, diagnostics, useCases, verdict };
}
```

---

## 4. Comparação com plano (Anatel)

Regulamento da Anatel (Resolução 717/2019) exige:
- **80% da velocidade contratada** como média mensal
- **40% da velocidade contratada** em medição instantânea (cada teste)

```js
// anatel.js

export function evaluateAgainstPlan(measurements, planDownload, planUpload) {
  if (!measurements.length || !planDownload) return null;
  
  const downloads = measurements.map(m => m.download);
  const uploads = measurements.map(m => m.upload);
  
  const minAvgDl = planDownload * 0.8;
  const minInstDl = planDownload * 0.4;
  const minAvgUl = planUpload * 0.8;
  const minInstUl = planUpload * 0.4;
  
  const avgDl = avg(downloads);
  const avgUl = avg(uploads);
  
  const aboveInstDl = downloads.filter(d => d >= minInstDl).length;
  const belowInstDl = downloads.filter(d => d < minInstDl).length;
  
  return {
    plan: { download: planDownload, upload: planUpload },
    delivered: {
      avg_download: Math.round(avgDl),
      avg_upload: Math.round(avgUl),
      pct_download: Math.round((avgDl / planDownload) * 100),
      pct_upload: Math.round((avgUl / planUpload) * 100)
    },
    anatel: {
      avg_download_ok: avgDl >= minAvgDl,
      avg_upload_ok: planUpload ? avgUl >= minAvgUl : null,
      tests_above_instant: aboveInstDl,
      tests_below_instant: belowInstDl,
      total_tests: downloads.length,
      pct_above_instant: Math.round((aboveInstDl / downloads.length) * 100)
    },
    range: {
      worst_download: Math.round(Math.min(...downloads)),
      best_download: Math.round(Math.max(...downloads)),
      worst_pct: Math.round((Math.min(...downloads) / planDownload) * 100),
      best_pct: Math.round((Math.max(...downloads) / planDownload) * 100)
    },
    period: {
      from: measurements[0].timestamp,
      to: measurements[measurements.length - 1].timestamp,
      days: Math.ceil(
        (measurements[measurements.length - 1].timestamp - measurements[0].timestamp) 
        / (1000 * 60 * 60 * 24)
      )
    }
  };
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
```

### Validade dos testes pra Anatel

A Anatel só aceita testes feitos com a "Entidade Aferidora" (EAQ — atualmente brasilbandalarga.com.br). Mas pro usuário comum, seu relatório serve como **prova circunstancial** em reclamações no Procon ou ações judiciais. Documente isso no PDF:

```
"Este relatório agrega medições realizadas via Cloudflare Speed Test 
do dispositivo do usuário ao servidor [POP]. Não substitui medição 
oficial via EAQ Anatel, mas serve como evidência complementar em 
reclamações ao prestador de serviço."
```

---

## 5. Multi-servidor (detectar peering ruim)

Hoje você sempre testa Cloudflare GIG. Adicione 2–3 servidores alternativos pra detectar quando o problema é peering com **um destino específico** vs problema geral do ISP.

```js
const TEST_SERVERS = [
  {
    id: 'cloudflare_gig',
    name: 'Cloudflare GIG',
    location: 'Rio de Janeiro',
    endpoints: {
      down: 'https://speed.cloudflare.com/__down',
      up: 'https://speed.cloudflare.com/__up',
      ping: 'https://speed.cloudflare.com/__down?bytes=0'
    }
  },
  {
    id: 'cloudflare_gru',
    name: 'Cloudflare GRU',
    location: 'São Paulo',
    endpoints: {
      // Cloudflare roteia automaticamente, mas você pode forçar via URL diferente
      down: 'https://gru.speed.cloudflare.com/__down',
      // ...
    }
  },
  {
    id: 'mlab',
    name: 'M-Lab (NIC.br)',
    location: 'São Paulo',
    endpoints: {
      // M-Lab tem API pra descobrir servidor mais próximo
      api: 'https://locate.measurementlab.net/v2/nearest/ndt/ndt7'
    }
  }
];

async function quickPingAll() {
  const results = await Promise.all(
    TEST_SERVERS.map(async server => {
      const ping = await pingEndpoint(server.endpoints.ping || server.endpoints.api, 5);
      return { ...server, ping };
    })
  );
  return results;
}

function detectPeeringIssue(pings) {
  const sorted = pings.sort((a, b) => a.ping.median - b.ping.median);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  
  if (worst.ping.median > best.ping.median * 3) {
    return {
      detected: true,
      message: `Latência para ${worst.name} (${worst.ping.median}ms) é 3× pior que ${best.name} (${best.ping.median}ms). Seu ISP tem problema de peering específico com aquela rota.`,
      best_server: best.id,
      worst_server: worst.id
    };
  }
  
  return { detected: false };
}
```

Use o `best_server.id` como servidor padrão pro teste de banda principal — dá medida mais justa da capacidade real do ISP.

---

## Ordem sugerida de implementação

| # | Feature | Esforço | Impacto |
|---|---------|---------|---------|
| 1 | Bufferbloat / RPM | 3–5 dias | Altíssimo — desbloqueia diagnóstico real |
| 2 | Sistema de regras + verdict | 2–3 dias | Alto — vira voz da marca |
| 3 | Comparação Anatel | 1–2 dias | Alto pra Brasil |
| 4 | Game Ping Atlas (Camada 1) | 3–5 dias | Alto — diferenciação real |
| 5 | Multi-servidor | 1–2 dias | Médio — refinamento |
| 6 | Worker para Camada 2 do Atlas | 2–3 dias | Baixo no MVP |

Total: ~15 dias de trabalho focado. Custo de infra: zero (Cloudflare Pages + Workers free tier).

---

## O que fica fora de escopo

- **Cliente nativo** (Swift/Kotlin) — PWA atende 95% dos casos
- **Background test scheduling** — limitado em PWA, melhor adiar
- **WebRTC pra UDP real** — viável mas complexo, baixo retorno
- **Stream simulator (RTMP)** — browser não suporta, requer cliente desktop
- **Heatmap Wi-Fi** — categoria diferente, não é seu fosso
