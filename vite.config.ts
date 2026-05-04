import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Versão do app lida do package.json no build (sem import-attribute para
// não depender de Node 21+). Exposta como `__APP_VERSION__` via Vite
// `define`. Consumida pelo accordion "Avançado" da ResultScreen.
const pkgPath = fileURLToPath(new URL('./package.json', import.meta.url));
const pkgVersion = JSON.parse(readFileSync(pkgPath, 'utf-8')).version as string;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkgVersion),
  },
  test: {
    environment: 'node',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      workbox: {
        // Atualização ágil (resolve ciclo conservador do Safari/iOS):
        // skipWaiting + clientsClaim ativam o novo SW imediatamente.
        // cleanupOutdatedCaches remove caches Workbox antigos no activate.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
      },
      // Audit 2026-05: includeAssets garante que todos os ícones cacheados
      // pelo SW estejam disponíveis offline. Mantém favicon + svg + apple
      // touch icons além dos PWA icons base.
      includeAssets: [
        'favicon.ico',
        'icon.svg',
        'logo.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-192.png',
        'icon-maskable-512.png',
        'apple-touch-icon.png',
        'touch-icon/ios/AppIcon@2x.png',
        'touch-icon/ios/AppIcon@2x~ipad.png',
        'touch-icon/ios/AppIcon-83.5@2x~ipad.png',
      ],
      manifest: {
        name: 'linka SpeedTest',
        short_name: 'linka Speed',
        description: 'Meça a qualidade real da sua internet com clareza.',
        // theme_color / background_color alinhados com o `--bg` do tema dark
        // (#0A0A0F) e com as `<meta name="theme-color">` em `index.html`.
        // Antes: '#6C2BFF' (accent roxo) — causava flash roxo no splash do
        // PWA iOS/Android antes do app pintar a tela. Mantido o roxo apenas
        // como cor da marca em UI (`--accent`), não como cor de chrome/splash.
        theme_color: '#0A0A0F',
        background_color: '#0A0A0F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'pt-BR',
        // Audit 2026-05: declara todos os tamanhos disponíveis em public/.
        // SVG vetor adicional ajuda user agents modernos a zoom sem aliasing.
        // 192/512 (any + maskable) são os tamanhos obrigatórios para
        // install criteria do Chrome/Android.
        icons: [
          { src: '/icon-192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png',          sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon.svg',              sizes: 'any',     type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
});
