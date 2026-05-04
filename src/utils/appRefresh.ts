/**
 * performAppRefresh — orquestra o "refresh" disparado pelo gesto pull-to-
 * refresh nas telas Start e History.
 *
 * Estratégia em duas tentativas:
 *  1. **Service Worker update** — pergunta ao SW registrado se há nova
 *     versão. Se houver `registration.waiting` (já baixou e está esperando
 *     pra ativar), envia `SKIP_WAITING` e força reload completo da página.
 *     Isto sempre vence o caminho 2: nova versão do app é mais valioso que
 *     re-fetch de IP/ISP (a nova versão pode mudar até a forma de detectar).
 *  2. **Reload deviceInfo** — re-roda o fetch de IP/colo/ISP/tipo de
 *     conexão via `useDeviceInfo.reload()`. Atualiza o banner de contexto
 *     (Wi-Fi vs móvel, ISP, servidor) sem precisar reiniciar o app.
 *
 * Min duration de 600ms — o spinner muito rápido fica feio ("piscou e
 * sumiu"). Se a operação real é instantânea (cache hit), espera completar
 * 600ms antes de resolver pra que o usuário tenha feedback visual sólido.
 *
 * O segredo: nunca lança. Pull-to-refresh é UX, não lógica de negócio —
 * falha em silêncio e some o spinner. O reload de SW pode até nem ocorrer
 * (sem registration, sem waiting, offline) — neste caso cai no caminho 2.
 */

const MIN_DURATION_MS = 600;

interface PerformAppRefreshOptions {
  /**
   * Callback que re-roda o fetch de IP/ISP/connection type. Geralmente é
   * `deviceInfo.reload` exposto pelo `useDeviceInfo`. Pode ser síncrono
   * (apenas bumpa um reloadKey) ou assíncrono.
   */
  reloadDeviceInfo: () => Promise<void> | void;
}

/**
 * Tenta aplicar uma atualização pendente do Service Worker. Retorna `true`
 * se chegou a recarregar (ou está prestes a). Retorna `false` se não havia
 * nada para atualizar — neste caso o caller cai no fallback de
 * reloadDeviceInfo.
 */
async function tryServiceWorkerUpdate(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    // Re-checa /sw.js. Se mudou, o navegador inicia o ciclo de update; o
    // novo worker entra em `waiting` quando estiver pronto.
    await registration.update().catch(() => { /* offline / transient */ });

    if (!registration.waiting) {
      // Não há versão pendente. O caminho 2 (reloadDeviceInfo) cobre.
      return false;
    }

    // Há um SW novo esperando — envia SKIP_WAITING para que ele assuma
    // controle. O `vite-plugin-pwa` configura o SW para responder a essa
    // mensagem chamando `self.skipWaiting()`.
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Aguarda `controllerchange` antes de recarregar — assim a página já
    // bate na nova versão do SW. Failsafe: 1.2s de timeout (raro precisar).
    await new Promise<void>((resolve) => {
      let resolved = false;
      const onChange = () => {
        if (resolved) return;
        resolved = true;
        navigator.serviceWorker.removeEventListener('controllerchange', onChange);
        resolve();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onChange);
      setTimeout(() => {
        if (resolved) return;
        resolved = true;
        navigator.serviceWorker.removeEventListener('controllerchange', onChange);
        resolve();
      }, 1200);
    });

    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

export async function performAppRefresh(opts: PerformAppRefreshOptions): Promise<void> {
  const start = performance.now();

  const swUpdated = await tryServiceWorkerUpdate();

  if (!swUpdated) {
    // Caminho 2: re-fetcha device/server info. Nunca lança (o callback do
    // hook trata erro silenciosamente, mas garantimos via try/catch local).
    try {
      await opts.reloadDeviceInfo();
    } catch {
      // Engole — pull-to-refresh é UX, não crítico.
    }
  }

  // Min duration — só completa abaixo de 600ms. Se o SW recarregou, a
  // página já está sendo trocada e este código nem chega ao fim.
  const elapsed = performance.now() - start;
  const remaining = MIN_DURATION_MS - elapsed;
  if (remaining > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, remaining));
  }
}
