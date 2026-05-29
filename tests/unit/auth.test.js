import { describe, it, expect, beforeAll, vi } from 'vitest';

// Stub supabase before any module that imports it is loaded
vi.mock('../../api/_lib/supabase.js', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) })
  }
}));

import { resolveProspectId } from '../../api/_lib/auth.js';
import { signCookie } from '../../api/_lib/cookie.js';

beforeAll(() => { process.env.ARQ_COOKIE_SECRET = '0'.repeat(64); });

describe('resolveProspectId', () => {
  it('returns id from valid arq_pid cookie', () => {
    const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const cookie = `arq_pid=${signCookie(id)}`;
    const req = { headers: { cookie }, url: '/api/x' };
    expect(resolveProspectId(req)).toEqual({ source: 'cookie', prospectId: id });
  });

  it('returns null for missing cookie', () => {
    const req = { headers: {}, url: '/api/x' };
    expect(resolveProspectId(req)).toEqual({ source: null, prospectId: null });
  });

  it('returns null for tampered cookie', () => {
    const req = { headers: { cookie: 'arq_pid=bad.value' }, url: '/api/x' };
    expect(resolveProspectId(req)).toEqual({ source: null, prospectId: null });
  });

  it('handles cookie header with multiple cookies', () => {
    const id = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
    const cookie = `other=1; arq_pid=${signCookie(id)}; another=2`;
    const req = { headers: { cookie }, url: '/api/x' };
    expect(resolveProspectId(req)).toEqual({ source: 'cookie', prospectId: id });
  });
});
