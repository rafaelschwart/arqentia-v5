import { describe, it, expect } from 'vitest';
import { checkRate } from '../../api/_lib/ratelimit.js';

describe('checkRate', () => {
  it('allows under the limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRate('test:1.2.3.4', 10, 60_000).allowed).toBe(true);
    }
  });

  it('blocks the 11th request', () => {
    const key = 'test:2.2.2.2';
    for (let i = 0; i < 10; i++) checkRate(key, 10, 60_000);
    expect(checkRate(key, 10, 60_000).allowed).toBe(false);
  });

  it('resets after window', async () => {
    const key = 'test:3.3.3.3';
    for (let i = 0; i < 5; i++) checkRate(key, 5, 50);
    expect(checkRate(key, 5, 50).allowed).toBe(false);
    await new Promise(r => setTimeout(r, 80));
    expect(checkRate(key, 5, 50).allowed).toBe(true);
  });
});
