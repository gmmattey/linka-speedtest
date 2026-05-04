// Tela removida no refator de arquitetura 2026-05.
// O benchmark deixou de ser tela dedicada; o accordion "DNS" da
// ResultScreen mostra provider + latência atuais e o atalho "Como alterar"
// abre `features/dns/DNSGuideSheet.tsx`.
// O utilitário `utils/dnsBenchmark.ts` continua disponível para futuro
// reuso, mas perdeu seu único caller hoje.
// Pendência: `git rm src/screens/DNSBenchmarkScreen.{tsx,css}` no próximo commit.
export {};
