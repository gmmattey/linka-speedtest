import { describe, it, expect } from 'vitest';
import { deriveScrolled } from '../hooks/useScrollHeader';

// Testa apenas o helper puro `deriveScrolled`. O hook em si depende do
// React runtime + IntersectionObserver e não temos @testing-library/react
// nem polyfill de IO no JSDOM — a cobertura aqui mira a regra de decisão,
// que é o coração do efeito de glass header.

describe('useScrollHeader helpers — deriveScrolled', () => {
  it('sentinel visível na viewport => scrolled = false', () => {
    expect(deriveScrolled(true)).toBe(false);
  });

  it('sentinel fora da viewport (rolou) => scrolled = true', () => {
    expect(deriveScrolled(false)).toBe(true);
  });

  it('é função inversa simples — idempotente quando aplicada duas vezes', () => {
    // deriveScrolled(deriveScrolled(x)) tem que dar !!x novamente:
    // !(!(x)) === x apenas para boolean direto.
    expect(deriveScrolled(deriveScrolled(true))).toBe(true);
    expect(deriveScrolled(deriveScrolled(false))).toBe(false);
  });
});
