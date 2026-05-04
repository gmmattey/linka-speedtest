// Banner "Nova versão disponível" do Service Worker.
//
// Estratégia (resolve o ciclo de update conservador do Safari/iOS):
//   1. `registerType: 'autoUpdate'` + `skipWaiting`/`clientsClaim` no
//      vite.config.ts — o novo SW assume controle imediatamente.
//   2. Verificação periódica a cada 60s via `registration.update()` —
//      garante que o navegador re-cheque `/sw.js` mesmo sem reload.
//   3. UX explícita: ao detectar nova versão, mostra este banner com
//      "Atualizar" (force reload) ou "Fechar" (snooze até próxima visita).
//
// Sem reload-surpresa: o usuário escolhe quando aplicar a atualização.
import { useRegisterSW } from 'virtual:pwa-register/react';
import './PwaUpdatePrompt.css';

const UPDATE_CHECK_INTERVAL_MS = 60_000;

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return;
      // Re-checa /sw.js periodicamente. O navegador compara byte-a-byte;
      // se mudou, dispara o ciclo de update e dispara `onNeedRefresh`.
      setInterval(() => {
        registration.update().catch(() => { /* offline / transient */ });
      }, UPDATE_CHECK_INTERVAL_MS);
    },
    onRegisterError(error) {
      console.warn('[pwa] register error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="lk-pwa-update" role="status" aria-live="polite">
      <span className="lk-pwa-update__text">Nova versão disponível</span>
      <button
        type="button"
        className="lk-pwa-update__button"
        onClick={() => { void updateServiceWorker(true); }}
      >
        Atualizar
      </button>
      <button
        type="button"
        className="lk-pwa-update__close"
        onClick={() => setNeedRefresh(false)}
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  );
}
