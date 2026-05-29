import { describe, it, expect, beforeAll } from 'vitest';
import { signCookie, verifyCookie, serializeCookie, parseCookies } from '../../api/_lib/cookie.js';

beforeAll(() => {
  process.env.ARQ_COOKIE_SECRET = '0'.repeat(64);
});

describe('cookie', () => {
  it('signs and verifies a uuid', () => {
    const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const signed = signCookie(id);
    expect(verifyCookie(signed)).toBe(id);
  });

  it('rejects tampered cookies', () => {
    const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const signed = signCookie(id);
    const tampered = signed.replace(/.$/, c => c === 'a' ? 'b' : 'a');
    expect(verifyCookie(tampered)).toBeNull();
  });

  it('rejects garbage input', () => {
    expect(verifyCookie('')).toBeNull();
    expect(verifyCookie(null)).toBeNull();
    expect(verifyCookie('no-dot-separator')).toBeNull();
  });

  it('serializeCookie produces HTTPOnly+Secure+SameSite=Lax with 90d Max-Age and Path=/', () => {
    const header = serializeCookie('arq_pid', 'value');
    expect(header).toMatch(/HttpOnly/);
    expect(header).toMatch(/Secure/);
    expect(header).toMatch(/SameSite=Lax/);
    expect(header).toMatch(/Max-Age=7776000/);
    expect(header).toMatch(/Path=\//);
  });

  it('parseCookies parses standard Cookie header', () => {
    expect(parseCookies('a=1; b=2; c=hello world')).toEqual({ a: '1', b: '2', c: 'hello world' });
    expect(parseCookies('')).toEqual({});
    expect(parseCookies(undefined)).toEqual({});
  });
});
