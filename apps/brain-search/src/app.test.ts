import {describe, expect, test} from 'bun:test';
import {noteHash, parseRoute, resolveNotePath, searchHash} from './app';

describe('routes', () => {
  test('round-trips a search query', () => {
    expect(parseRoute(searchHash('women in tech & GDG'))).toEqual({
      name: 'search',
      query: 'women in tech & GDG',
      tab: 'all',
    });
    expect(parseRoute(searchHash('x', 'people'))).toEqual({
      name: 'search',
      query: 'x',
      tab: 'people',
    });
  });

  test('empty search goes home', () => {
    expect(parseRoute('#/search?q=%20')).toEqual({name: 'home'});
  });

  test('parses note and setup routes', () => {
    expect(parseRoute(noteHash('orgs/gdg-tulsa.md'))).toEqual({
      name: 'note',
      path: 'orgs/gdg-tulsa.md',
    });
    expect(parseRoute('#/setup')).toEqual({name: 'setup', section: ''});
    expect(parseRoute('#/settings')).toEqual({name: 'settings'});
    expect(parseRoute('#/unknown')).toEqual({name: 'home'});
  });

  test('resolves relative note links', () => {
    expect(resolveNotePath('people/x.md', '../orgs/gdg-tulsa.md')).toBe(
      'orgs/gdg-tulsa.md',
    );
    expect(resolveNotePath('orgs/a.md', 'b.md#part')).toBe('orgs/b.md');
    expect(resolveNotePath('a.md', '../../escape.md')).toBeNull();
    expect(resolveNotePath('a.md', 'https://example.com')).toBeNull();
  });
});
