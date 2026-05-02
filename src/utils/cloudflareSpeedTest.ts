const BASE = 'https://speed.cloudflare.com';

// Tamanhos progressivos de payload
export const DL_SIZES = [100_000, 1_000_000, 10_000_000, 25_000_000, 100_000_000] as const;
//                       100 KB   1 MB        10 MB       25 MB        100 MB

export const UL_SIZES = [256_000, 1_000_000, 5_000_000, 10_000_000] as const;
//                       256 KB   1 MB        5 MB        10 MB

function cb(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Abre um ReadableStream de download para `bytes` bytes.
 * Cada chamada usa um _cb único — nunca serve cache.
 */
export async function cfDownloadStream(
  bytes: number,
  signal: AbortSignal,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const url = `${BASE}/__down?bytes=${bytes}&_cb=${cb()}`;
  const resp = await fetch(url, {
    signal,
    cache: 'no-store',
  });
  if (!resp.ok || !resp.body) throw new Error(`cfDownloadStream: HTTP ${resp.status}`);
  return resp.body.getReader();
}

/**
 * Mede o RTT de um único ping (download de 0 bytes).
 * Retorna null se o request falhar ou for abortado.
 */
export async function cfPing(signal: AbortSignal): Promise<number | null> {
  const url = `${BASE}/__down?bytes=0&_cb=${cb()}`;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  signal.addEventListener('abort', onAbort, { once: true });
  const tid = setTimeout(() => ctrl.abort(), 4000);
  const t0 = performance.now();
  try {
    const resp = await fetch(url, {
      signal: ctrl.signal,
      cache: 'no-store',
    });
    await resp.arrayBuffer();
    return performance.now() - t0;
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
    signal.removeEventListener('abort', onAbort);
  }
}

/**
 * Faz upload de `buffer` via XHR com corpo binário e resolve com os bytes
 * efetivamente enviados.
 *
 * **Sem `setRequestHeader` e sem listeners em `xhr.upload`.** Registrar
 * qualquer listener de progresso em `xhr.upload` torna o request "non-simple"
 * e força preflight CORS (OPTIONS) — que `speed.cloudflare.com/__up` rejeita
 * com HTTP 400. Por isso a granularidade fina de progresso é trocada pela
 * conclusão por POST: o sampler de 300 ms em `uploadProbe` contabiliza os
 * bytes do buffer quando o request resolve.
 */
export function cfUploadChunk(
  buffer: Uint8Array,
  signal: AbortSignal,
): Promise<number> {
  const url = `${BASE}/__up?_cb=${cb()}`;

  return new Promise<number>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('aborted', 'AbortError'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'text';

    const onAbort = () => xhr.abort();
    signal.addEventListener('abort', onAbort, { once: true });
    const cleanup = () => signal.removeEventListener('abort', onAbort);

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) resolve(buffer.byteLength);
      else reject(new Error(`cfUploadChunk: HTTP ${xhr.status}`));
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error('cfUploadChunk: network error'));
    };
    xhr.ontimeout = () => {
      cleanup();
      reject(new Error('cfUploadChunk: timeout'));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new DOMException('aborted', 'AbortError'));
    };

    const body = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
    xhr.send(body);
  });
}
