import { describe, it, expect } from 'vitest';
import { toConnectionProfile } from '../utils/connectionProfile';

describe('toConnectionProfile()', () => {
  it('mobile -> mobile_broadband', () => {
    expect(toConnectionProfile('mobile')).toBe('mobile_broadband');
  });

  it('wifi -> fixed_broadband', () => {
    expect(toConnectionProfile('wifi')).toBe('fixed_broadband');
  });

  it('cable -> fixed_broadband', () => {
    expect(toConnectionProfile('cable')).toBe('fixed_broadband');
  });

  it('undefined -> fixed_broadband (default conservador para iOS sem navigator.connection)', () => {
    expect(toConnectionProfile(undefined)).toBe('fixed_broadband');
  });
});
