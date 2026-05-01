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
    headers: { 'Cache-Control': 'no-store' },
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
      headers: { 'Cache-Control': 'no-store' },
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
 * Faz upload de `buffer` via XHR POST.
 * `onProgress(loaded)` é chamado a cada evento de progresso.
 */
export function cfUploadChunk(
  buffer: Uint8Array,
  signal: AbortSignal,
  onProgress: (loaded: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `${BASE}/__up?_cb=${cb()}`;
    const xhr = new XMLHttpRequest();

    const onAbort = () => xhr.abort();
    signal.addEventListener('abort', onAbort, { once: true });

    xhr.upload.onprogress = (e) => {
      if (e.loaded > 0) onProgress(e.loaded);
    };

    xhr.onload = () => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    };

    xhr.onerror = () => {
      signal.removeEventListener('abort', onAbort);
      reject(new Error('cfUploadChunk: XHR error'));
    };

    xhr.onabort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    xhr.open('POST', url);
    xhr.setRequestHeader('Cache-Control', 'no-store');
    xhr.send(new Blob([buffer as unknown as BlobPart]));
  });
}
