import { describe, it, expect, vi, afterEach } from 'vitest';
import type { SpeedTestResult } from '../types';
import { buildShareText, shareResultText } from '../screens/ResultScreen';

const baseResult: SpeedTestResult = {
  dl: 87.3,
  ul: 32.1,
  latency: 18.2,
  jitter: 3.4,
  packetLoss: 0,
  timestamp: new Date('2026-04-28T14:32:00-03:00').getTime(),
};

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('share result', () => {
  it('usa navigator.share quando disponível e envia title + text corretos', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true });

    const text = buildShareText(baseResult, 'good', 'mbps');
    const outcome = await shareResultText(text);

    expect(outcome).toBe('shared');
    expect(mockShare).toHaveBeenCalledTimes(1);
    expect(mockShare).toHaveBeenCalledWith({
      title: 'linka SpeedTest',
      text,
    });
    expect(text).toContain('↓ 87.3 Mbps');
    expect(text).toContain('↑ 32.1 Mbps');
    expect(text).toContain('Resposta 18 ms');
    expect(text).toContain('Oscilação 3 ms');
  });

  it('chama clipboard.writeText quando navigator.share não existe', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    });

    const text = buildShareText(baseResult, 'good', 'mbps');
    const outcome = await shareResultText(text);

    expect(outcome).toBe('copied');
    expect(mockWriteText).toHaveBeenCalledTimes(1);
    expect(mockWriteText).toHaveBeenCalledWith(text);
  });

  it('não lança quando navigator.share rejeita', async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error('cancelled'));
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true });

    const text = buildShareText(baseResult, 'good', 'mbps');

    await expect(shareResultText(text)).resolves.toBe('none');
  });

  it('não lança quando clipboard falha', async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error('no permission'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    });

    const text = buildShareText(baseResult, 'good', 'mbps');

    await expect(shareResultText(text)).resolves.toBe('none');
  });
});
