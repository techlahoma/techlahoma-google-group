/**
 * Personal wordmark, result tabs and Easter eggs. Pure helpers, no DOM.
 * The wordmark is text in a free font with a four-color letter cycle; it does
 * not use Google's logo artwork or fonts.
 */

export type WordmarkStyle = 'oogle' | 'brain';

/** Letter colors, repeating: blue, red, yellow, blue, green, red. */
export const LETTER_COLORS = [
  'blue',
  'red',
  'yellow',
  'blue',
  'green',
  'red',
] as const;

export type LetterColor = (typeof LETTER_COLORS)[number];

/** First word of a name, letters only, capitalized: "  sam carlton" -> "Sam". */
export function firstName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  const letters = first.replace(/[^\p{L}'-]/gu, '').slice(0, 20);
  if (!letters) return '';
  return letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase();
}

/**
 * "Sam" -> "Samoogle", "Katie" -> "Katoogle", "Jo" -> "Joogle".
 * With no name: "Brainoogle". The "brain" style gives "Sam's Brain".
 */
export function wordmarkText(name: string, style: WordmarkStyle): string {
  const first = firstName(name);
  if (style === 'brain') {
    if (!first) return 'My Brain';
    return `${first}${/s$/i.test(first) ? "'" : "'s"} Brain`;
  }
  if (!first) return 'Brainoogle';
  const stem = first.replace(/[aeiouy]+$/i, '') || first;
  return `${stem}oogle`;
}

export function colorLetters(
  text: string,
): Array<{char: string; color: LetterColor | null}> {
  let i = 0;
  return [...text].map(char => {
    if (!/\p{L}/u.test(char)) return {char, color: null};
    const color = LETTER_COLORS[i % LETTER_COLORS.length] ?? 'blue';
    i++;
    return {char, color};
  });
}

export interface Tab {
  id: string;
  label: string;
}

/** Links across the top of the home page, like the old service bar. */
const TOP_LINKS: Tab[] = [
  {id: 'all', label: 'Everything'},
  {id: 'orgs', label: 'Organizations'},
  {id: 'people', label: 'People'},
  {id: 'events', label: 'Events'},
  {id: 'meetings', label: 'Meetings'},
  {id: 'products', label: 'Tools'},
  {id: 'notes', label: 'Notes'},
  {id: 'ecosystem', label: 'Ecosystem'},
];

/** Left sidebar on the results page. */
const SIDEBAR: Tab[] = [
  {id: 'all', label: 'Everything'},
  {id: 'people', label: 'People'},
  {id: 'orgs', label: 'Orgs'},
  {id: 'events', label: 'Events'},
  {id: 'meetings', label: 'Meetings'},
  {id: 'notes', label: 'Notes'},
  {id: 'ecosystem', label: 'Ecosystem'},
  {id: 'products', label: 'Products'},
];

export function folderOf(path: string): string {
  return path.includes('/') ? (path.split('/')[0] ?? '') : '';
}

function extras(paths: string[], known: Tab[]): Tab[] {
  const ids = new Set(known.map(tab => tab.id));
  return [...new Set(paths.map(folderOf))]
    .filter(folder => folder && !ids.has(folder))
    .sort()
    .map(folder => ({
      id: folder,
      label: folder.charAt(0).toUpperCase() + folder.slice(1),
    }));
}

/** The fixed sidebar entries, then any other brain folders, alphabetically. */
export function tabsFor(paths: string[]): Tab[] {
  return [...SIDEBAR, ...extras(paths, SIDEBAR)];
}

/** Top-bar links, plus the folders that only fit under "more". */
export function topLinksFor(paths: string[]): {main: Tab[]; more: Tab[]} {
  return {main: TOP_LINKS, more: extras(paths, TOP_LINKS)};
}

export type EasterEgg = 'barrel-roll' | 'askew' | 'recursion' | 'self' | null;

function squash(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function easterEgg(query: string, name: string): EasterEgg {
  if (squash(query).startsWith('related ')) return null;
  const q = squash(query);
  if (q === 'do a barrel roll' || q === 'z or r twice') return 'barrel-roll';
  if (q === 'askew' || q === 'tilt') return 'askew';
  if (q === 'recursion') return 'recursion';
  const first = squash(firstName(name));
  if (first && (q === first || q === squash(wordmarkText(name, 'oogle')))) {
    return 'self';
  }
  return null;
}

/** First letter of the logo, lowercased, for the favicon ("Google" -> "g"). */
export function faviconLetter(logo: string): string {
  const letter = [...logo].find(char => /\p{L}|\p{N}/u.test(char));
  return letter ? letter.toLowerCase() : 'g';
}

/**
 * An original 2010-flavored favicon: a bold serif letter in a beveled classic
 * blue on a white tile. `public/favicon.svg` is this function's output for "g".
 */
export function faviconSvg(letter: string): string {
  const safe = faviconLetter(letter)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
    '<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#8fb4ff"/><stop offset=".45" stop-color="#2b67e6"/>' +
    '<stop offset="1" stop-color="#0f2f80"/></linearGradient></defs>' +
    '<rect x=".5" y=".5" width="31" height="31" rx="5" fill="#fff" stroke="#c9d7f1"/>' +
    '<text x="16" y="22" text-anchor="middle" font-family="Cardo,Georgia,\'Times New Roman\',serif" ' +
    'font-weight="700" font-size="25" fill="url(#b)" stroke="#0b2a6b" stroke-width=".35">' +
    `${safe}</text></svg>`
  );
}

export function faviconDataUri(logo: string): string {
  return `data:image/svg+xml,${encodeURIComponent(faviconSvg(logo))}`;
}
