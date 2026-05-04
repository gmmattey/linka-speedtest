// Variáveis globais injetadas em build time pelo Vite (`define` em
// `vite.config.ts`). Mantenha sincronizado com qualquer adição feita lá.
//
// __APP_VERSION__: versão lida do `package.json` no build, exposta para o
//   accordion "Avançado" da ResultScreen (item "Versão do app"). Vem como
//   string. Em testes JSDOM/Vitest a global é injetada pelo plugin do
//   Vite, então `typeof __APP_VERSION__` deve ser sempre `"string"`.

declare const __APP_VERSION__: string;
