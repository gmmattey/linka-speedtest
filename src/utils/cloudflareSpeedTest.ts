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
 * Faz upload de `buffer` via fetch com ReadableStream.
 * Sem Content-Type explícito → simple CORS request → sem preflight.
 * `onProgress(loaded)` é chamado a cada chunk de 64 KB enfileirado.
 */
export function cfUploadChunk(
  buffer: Uint8Array,
  signal: AbortSignal,
  onProgress: (loaded: number) => void,
): Promise<void> {
  const url = `${BASE}/__up?_cb=${cb()}`;
  const CHUNK = 65_536;
  let offset = 0;

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= buffer.byteLength) {
        controller.close();
        return;
      }
      const end = Math.min(offset + CHUNK, buffer.byteLength);
      controller.enqueue(buffer.subarray(offset, end));
      offset = end;
      onProgress(offset);
    },
  });

  const init: RequestInit = { method: 'POST', body: stream, signal };
  (init as any).duplex = 'half'; // required in Chrome for streaming request bodies

  return fetch(url, init).then(resp => {
    if (!resp.ok) throw new Error(`cfUploadChunk: HTTP ${resp.status}`);
  });
}
