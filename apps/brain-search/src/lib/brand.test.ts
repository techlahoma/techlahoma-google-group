import {describe, expect, test} from 'bun:test';
import {
  colorLetters,
  easterEgg,
  firstName,
  tabsFor,
  wordmarkText,
} from './brand';
import {
  DEFAULT_SETTINGS,
  cleanLogo,
  loadSettings,
  saveSettings,
} from '../settings';
import {faviconDataUri, faviconLetter, faviconSvg, topLinksFor} from './brand';

describe('wordmark', () => {
  test('puns on the first name', () => {
    expect(wordmarkText('Sam', 'oogle')).toBe('Samoogle');
    expect(wordmarkText('katie smith', 'oogle')).toBe('Katoogle');
    expect(wordmarkText('Jo', 'oogle')).toBe('Joogle');
    expect(wordmarkText('', 'oogle')).toBe('Brainoogle');
  });

  test('possessive style', () => {
    expect(wordmarkText('Sam', 'brain')).toBe("Sam's Brain");
    expect(wordmarkText('Chris', 'brain')).toBe("Chris' Brain");
    expect(wordmarkText('', 'brain')).toBe('My Brain');
  });

  test('cleans names', () => {
    expect(firstName('  sAM <b>carlton')).toBe('Sam');
    expect(firstName('<script>')).toBe('Script');
    expect(firstName('123')).toBe('');
  });

  test('colors letters blue, red, yellow, blue, green, red and skips spaces', () => {
    const colors = colorLetters("Sam's Brain").map(l => l.color);
    expect(colors).toEqual([
      'blue',
      'red',
      'yellow',
      null,
      'blue',
      null,
      'green',
      'red',
      'blue',
      'red',
      'yellow',
    ]);
  });
});

describe('tabs and eggs', () => {
  test('fixed tabs first, then other folders', () => {
    const tabs = tabsFor(['orgs/a.md', 'products/b.md', 'ecosystem/c.md']);
    expect(tabs.map(t => t.id)).toEqual([
      'all',
      'people',
      'orgs',
      'events',
      'meetings',
      'notes',
      'ecosystem',
      'products',
    ]);
    expect(tabsFor(['zines/a.md']).at(-1)?.id).toBe('zines');
  });

  test('detects Easter eggs', () => {
    expect(easterEgg('Do a barrel roll!', '')).toBe('barrel-roll');
    expect(easterEgg('askew', '')).toBe('askew');
    expect(easterEgg('recursion', '')).toBe('recursion');
    expect(easterEgg('sam', 'Sam')).toBe('self');
    expect(easterEgg('Samoogle', 'Sam')).toBe('self');
    expect(easterEgg('sam', '')).toBeNull();
    expect(easterEgg('gdg tulsa', 'Sam')).toBeNull();
  });
});

describe('settings', () => {
  test('defaults: instant on, scores off', () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.instant).toBe(true);
    expect(DEFAULT_SETTINGS.showScores).toBe(false);
    expect(DEFAULT_SETTINGS.logo).toBe('Google');
  });

  test('round-trips and survives broken storage', () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    };
    saveSettings(storage, {
      ...DEFAULT_SETTINGS,
      name: 'Ada',
      logo: 'Valerie',
      instant: false,
    });
    expect(loadSettings(storage).logo).toBe('Valerie');
    expect(loadSettings(storage).name).toBe('Ada');
    expect(loadSettings(storage).instant).toBe(false);
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadSettings(broken)).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(broken, DEFAULT_SETTINGS)).not.toThrow();
    data.set('brain-search:settings:v2', '{not json');
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });
});

test('logo text is one short line with a default', () => {
  expect(cleanLogo('  Sam\noogle  ')).toBe('Sam oogle');
  expect(cleanLogo('')).toBe('Google');
  expect(cleanLogo('x'.repeat(40))).toHaveLength(20);
});

test('top links map tools to products and push extra folders under more', () => {
  const {main, more} = topLinksFor(['orgs/a.md', 'zines/b.md']);
  expect(main.map(t => t.label)).toEqual([
    'Everything',
    'Organizations',
    'People',
    'Events',
    'Meetings',
    'Tools',
    'Notes',
    'Ecosystem',
  ]);
  expect(main.find(t => t.label === 'Tools')?.id).toBe('products');
  expect(more.map(t => t.id)).toEqual(['zines']);
});

test('favicon follows the logo letter and escapes it', () => {
  expect(faviconLetter('Google')).toBe('g');
  expect(faviconLetter('  Valerie')).toBe('v');
  expect(faviconLetter('***')).toBe('g');
  expect(faviconSvg('<x')).toContain('>x</text>');
  expect(faviconSvg('&')).toContain('>g</text>');
  expect(faviconDataUri('Sam')).toStartWith('data:image/svg+xml,');
});
