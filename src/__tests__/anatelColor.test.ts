import { describe, it, expect } from 'vitest';
import { anatelGrade, anatelGradeColorVar, anatelGradeGlowVar } from '../utils/anatelColor';

describe('anatelGrade()', () => {
  // ── Sem plano cadastrado ────────────────────────────────────────────────
  describe('sem plano contratado válido', () => {
    it('retorna null quando contractedMbps é null', () => {
      expect(anatelGrade(100, null, 'fixed_broadband')).toBeNull();
    });

    it('retorna null quando contractedMbps é undefined', () => {
      expect(anatelGrade(100, undefined, 'fixed_broadband')).toBeNull();
    });

    it('retorna null quando contractedMbps é 0', () => {
      expect(anatelGrade(100, 0, 'fixed_broadband')).toBeNull();
    });

    it('retorna null quando contractedMbps é negativo', () => {
      expect(anatelGrade(100, -50, 'fixed_broadband')).toBeNull();
    });
  });

  // ── Entrega inválida ────────────────────────────────────────────────────
  describe('entrega inválida', () => {
    it('retorna null quando deliveredMbps é 0', () => {
      expect(anatelGrade(0, 600, 'fixed_broadband')).toBeNull();
    });

    it('retorna null quando deliveredMbps é negativo', () => {
      expect(anatelGrade(-5, 600, 'fixed_broadband')).toBeNull();
    });

    it('retorna null quando deliveredMbps é Infinity', () => {
      expect(anatelGrade(Infinity, 600, 'fixed_broadband')).toBeNull();
    });

    it('retorna null quando deliveredMbps é NaN', () => {
      expect(anatelGrade(NaN, 600, 'fixed_broadband')).toBeNull();
    });
  });

  // ── Banda larga fixa ────────────────────────────────────────────────────
  describe('fixed_broadband (thresholds 80% / 40%)', () => {
    it('100% → good', () => {
      expect(anatelGrade(600, 600, 'fixed_broadband')).toBe('good');
    });

    it('80% exato → good (limite inclusivo)', () => {
      expect(anatelGrade(480, 600, 'fixed_broadband')).toBe('good');
    });

    it('79.9% → warn (logo abaixo do limite good)', () => {
      expect(anatelGrade(479.4, 600, 'fixed_broadband')).toBe('warn');
    });

    it('50% → warn', () => {
      expect(anatelGrade(300, 600, 'fixed_broadband')).toBe('warn');
    });

    it('40% exato → warn (limite inclusivo)', () => {
      expect(anatelGrade(240, 600, 'fixed_broadband')).toBe('warn');
    });

    it('39.9% → bad (logo abaixo do limite warn)', () => {
      expect(anatelGrade(239.4, 600, 'fixed_broadband')).toBe('bad');
    });

    it('10% → bad', () => {
      expect(anatelGrade(60, 600, 'fixed_broadband')).toBe('bad');
    });

    it('rajada acima do plano (120%) → good', () => {
      expect(anatelGrade(720, 600, 'fixed_broadband')).toBe('good');
    });
  });

  // ── Banda larga móvel ───────────────────────────────────────────────────
  describe('mobile_broadband (thresholds 60% / 20%)', () => {
    it('100% → good', () => {
      expect(anatelGrade(50, 50, 'mobile_broadband')).toBe('good');
    });

    it('60% exato → good (limite inclusivo)', () => {
      expect(anatelGrade(30, 50, 'mobile_broadband')).toBe('good');
    });

    it('59.9% → warn', () => {
      expect(anatelGrade(29.9, 50, 'mobile_broadband')).toBe('warn');
    });

    it('30% → warn', () => {
      expect(anatelGrade(15, 50, 'mobile_broadband')).toBe('warn');
    });

    it('20% exato → warn (limite inclusivo)', () => {
      expect(anatelGrade(10, 50, 'mobile_broadband')).toBe('warn');
    });

    it('19.9% → bad', () => {
      expect(anatelGrade(9.9, 50, 'mobile_broadband')).toBe('bad');
    });

    it('5% → bad', () => {
      expect(anatelGrade(2.5, 50, 'mobile_broadband')).toBe('bad');
    });
  });

  // ── Sanity: thresholds diferentes por perfil ───────────────────────────
  describe('paridade entre perfis', () => {
    it('30% é warn em fixed mas warn (≥20) em mobile (mesmo bucket porém limites distintos)', () => {
      expect(anatelGrade(30, 100, 'fixed_broadband')).toBe('bad'); // 30 < 40
      expect(anatelGrade(30, 100, 'mobile_broadband')).toBe('warn'); // 30 ≥ 20
    });

    it('70% é warn em fixed mas good em mobile', () => {
      expect(anatelGrade(70, 100, 'fixed_broadband')).toBe('warn');
      expect(anatelGrade(70, 100, 'mobile_broadband')).toBe('good');
    });
  });
});

describe('anatelGradeColorVar()', () => {
  it('mapeia good → --success', () => {
    expect(anatelGradeColorVar('good')).toBe('var(--success)');
  });

  it('mapeia warn → --warn', () => {
    expect(anatelGradeColorVar('warn')).toBe('var(--warn)');
  });

  it('mapeia bad → --error', () => {
    expect(anatelGradeColorVar('bad')).toBe('var(--error)');
  });
});

describe('anatelGradeGlowVar()', () => {
  it('mapeia good → --success-glow', () => {
    expect(anatelGradeGlowVar('good')).toBe('var(--success-glow)');
  });

  it('mapeia warn → --warn-glow', () => {
    expect(anatelGradeGlowVar('warn')).toBe('var(--warn-glow)');
  });

  it('mapeia bad → --error-glow', () => {
    expect(anatelGradeGlowVar('bad')).toBe('var(--error-glow)');
  });
});
