// Tipos para o módulo virtual `virtual:pwa-register/react` exposto pelo
// `vite-plugin-pwa`. O `tsconfig.app.json` declara apenas `vite/client` em
// `types`, então o pacote `vite-plugin-pwa/client` (que normalmente
// adicionaria o ambient module) não é carregado automaticamente. Este
// arquivo cobre o subset usado em `src/components/PwaUpdatePrompt.tsx`.

declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react';

  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}
