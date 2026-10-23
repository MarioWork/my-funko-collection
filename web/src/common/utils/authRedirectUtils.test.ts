import { loginPathFor, safeRedirectPath } from './authRedirectUtils';

describe('safeRedirectPath', () => {
  it.each(['/funkos?q=yoda', '/collections/2', '/settings'])('keeps the app page %s', (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    null,
    '',
    '//evil.example',
    '/\\evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    '/login',
    '/nope',
  ])('falls back to Home for %s', (path) => {
    expect(safeRedirectPath(path)).toBe('/home');
  });
});

describe('loginPathFor', () => {
  it('remembers the page to come back to', () => {
    expect(loginPathFor('/funkos?q=yoda')).toBe('/login?redirectTo=%2Ffunkos%3Fq%3Dyoda');
  });

  it('leaves out the start page', () => {
    expect(loginPathFor('/home')).toBe('/login');
  });
});
