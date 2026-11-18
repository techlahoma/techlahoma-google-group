import {describe, expect, test} from 'bun:test';
import {
  folderUrl,
  isAppLink,
  legacyHashToPath,
  noteUrl,
  parseLocation,
  resolveNotePath,
  searchUrl,
  staticPaths,
} from './app';

describe('routes', () => {
  test('round-trips a search with a folder filter', () => {
    const url = new URL(
      searchUrl('women in tech & GDG', 'people'),
      'https://x',
    );
    expect(url.pathname + url.search).toBe(
      '/search?q=women%20in%20tech%20%26%20GDG&in=people',
    );
    expect(parseLocation(url.pathname, url.search)).toEqual({
      name: 'search',
      query: 'women in tech & GDG',
      tab: 'people',
    });
    expect(parseLocation('/search', '?q=a+b')).toEqual({
      name: 'search',
      query: 'a b',
      tab: 'all',
    });
  });

  test('parses pages, folders, notes and unknown paths', () => {
    expect(parseLocation('/', '')).toEqual({name: 'home'});
    expect(parseLocation('/index.html', '')).toEqual({name: 'home'});
    expect(parseLocation('/setup/', '')).toEqual({name: 'setup'});
    expect(parseLocation('/settings', '')).toEqual({name: 'settings'});
    expect(parseLocation('/people', '')).toEqual({
      name: 'folder',
      folder: 'people',
    });
    expect(parseLocation('/zines', '', ['zines'])).toEqual({
      name: 'folder',
      folder: 'zines',
    });
    expect(parseLocation(noteUrl('orgs/gdg-tulsa.md'), '')).toEqual({
      name: 'note',
      path: 'orgs/gdg-tulsa.md',
    });
    expect(parseLocation('/nope', '')).toEqual({
      name: 'notFound',
      path: '/nope',
    });
  });

  test('builds URLs', () => {
    expect(noteUrl('meetings/2026-11-03-sample.md')).toBe(
      '/n/meetings/2026-11-03-sample',
    );
    expect(folderUrl('orgs')).toBe('/orgs');
    expect(staticPaths(['orgs/a.md'], ['orgs'])).toEqual([
      '/',
      '/search',
      '/setup',
      '/settings',
      '/orgs',
      '/n/orgs/a',
    ]);
  });

  test('redirects old hash links', () => {
    expect(legacyHashToPath('#/setup')).toBe('/setup');
    expect(legacyHashToPath('#/settings')).toBe('/settings');
    expect(legacyHashToPath('#/search?q=gdg%20tulsa&tab=people')).toBe(
      '/search?q=gdg%20tulsa&in=people',
    );
    expect(legacyHashToPath('#q=hello')).toBe('/search?q=hello');
    expect(legacyHashToPath('#/note/orgs/gdg-tulsa.md')).toBe(
      '/n/orgs/gdg-tulsa',
    );
    expect(legacyHashToPath('#/search?q=*&tab=people')).toBe('/people');
    expect(legacyHashToPath('#sources')).toBeNull();
    expect(legacyHashToPath('')).toBeNull();
  });

  test('resolves relative note links', () => {
    expect(resolveNotePath('people/x.md', '../orgs/gdg-tulsa.md')).toBe(
      'orgs/gdg-tulsa.md',
    );
    expect(resolveNotePath('orgs/a.md', 'b.md#part')).toBe('orgs/b.md');
    expect(resolveNotePath('a.md', '../../escape.md')).toBeNull();
    expect(resolveNotePath('a.md', 'https://example.com')).toBeNull();
  });

  test('router handles app paths only', () => {
    const origin = 'https://oogle.web.app';
    expect(isAppLink(new URL('/n/orgs/a', origin), origin)).toBe(true);
    expect(isAppLink(new URL('/brain-index.json', origin), origin)).toBe(false);
    expect(isAppLink(new URL('https://example.com/x'), origin)).toBe(false);
  });
});
