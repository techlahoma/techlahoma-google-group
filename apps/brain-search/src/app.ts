/**
 * Pure routing helpers: real paths (`/search?q=`, `/setup`, `/people`,
 * `/n/orgs/gdg-tulsa`), legacy hash redirects, and note link resolution.
 * Shared by the browser router and the build-time pre-renderer.
 */

export type Route =
  | {name: 'home'}
  | {name: 'search'; query: string; tab: string}
  | {name: 'folder'; folder: string}
  | {name: 'note'; path: string}
  | {name: 'setup'}
  | {name: 'settings'}
  | {name: 'notFound'; path: string};

/** Brain folders that always get a page, even before the index loads. */
export const KNOWN_FOLDERS = [
  'people',
  'orgs',
  'events',
  'meetings',
  'notes',
  'ecosystem',
  'products',
];

function decode(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

export function parseLocation(
  pathname: string,
  search: string,
  folders: Iterable<string> = KNOWN_FOLDERS,
): Route {
  const path =
    pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
  if (path === '/') return {name: 'home'};
  if (path === '/search') {
    const params = new URLSearchParams(search);
    const query = params.get('q')?.trim() ?? '';
    const tab = params.get('in')?.trim() || 'all';
    return {name: 'search', query, tab};
  }
  if (path === '/setup') return {name: 'setup'};
  if (path === '/settings') return {name: 'settings'};
  if (path.startsWith('/n/')) {
    const rest = path.slice(3).split('/').filter(Boolean).map(decode).join('/');
    if (rest) return {name: 'note', path: `${rest}.md`};
  }
  const single = /^\/([a-z0-9-]+)$/.exec(path)?.[1];
  if (single && new Set(folders).has(single)) {
    return {name: 'folder', folder: single};
  }
  return {name: 'notFound', path};
}

export function searchUrl(query: string, tab = 'all'): string {
  const params = new URLSearchParams({q: query.trim()});
  if (tab && tab !== 'all') params.set('in', tab);
  return `/search?${params.toString().replace(/\+/g, '%20')}`;
}

export function folderUrl(folder: string): string {
  return `/${encodeURIComponent(folder)}`;
}

/** `orgs/gdg-tulsa.md` -> `/n/orgs/gdg-tulsa`. */
export function noteUrl(path: string): string {
  return `/n/${path
    .replace(/\.md$/, '')
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

/** Every route the build pre-renders, as URL paths. */
export function staticPaths(notePaths: string[], folders: string[]): string[] {
  return [
    '/',
    '/search',
    '/setup',
    '/settings',
    ...folders.map(folderUrl),
    ...notePaths.map(noteUrl),
  ];
}

/**
 * Map links shared before the switch to real paths:
 * `#/setup`, `#/settings`, `#/search?q=x&tab=people`, `#q=x`,
 * `#/note/orgs/x.md`. Returns null when the hash is not an old route.
 */
export function legacyHashToPath(hash: string): string | null {
  const raw = hash.replace(/^#/, '');
  if (!raw) return null;
  if (/^q=/.test(raw)) {
    const query = new URLSearchParams(raw).get('q')?.trim();
    return query ? searchUrl(query) : '/';
  }
  if (!raw.startsWith('/')) return null;
  const [path = '', search = ''] = raw.split('?');
  if (path === '/' || path === '') return '/';
  if (path === '/setup' || path.startsWith('/setup/')) return '/setup';
  if (path === '/settings') return '/settings';
  if (path === '/search') {
    const params = new URLSearchParams(search);
    const query = params.get('q')?.trim() ?? '';
    if (!query) return '/';
    if (query === '*') return folderUrl(params.get('tab') || 'notes');
    return searchUrl(query, params.get('tab') ?? 'all');
  }
  if (path.startsWith('/note/')) {
    return noteUrl(decode(path.slice('/note/'.length)));
  }
  return null;
}

/** Resolve a relative link inside a note (e.g. `../orgs/x.md`) to a brain path. */
export function resolveNotePath(fromPath: string, href: string): string | null {
  const [target = ''] = href.split('#');
  if (!target.endsWith('.md')) return null;
  const parts = fromPath.split('/').slice(0, -1);
  for (const part of target.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (parts.length === 0) return null;
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join('/');
}

/**
 * Should the client router handle a click on this href? Same origin, an app
 * path (no file extension), and not a hash-only jump.
 */
export function isAppLink(href: URL, origin: string): boolean {
  if (href.origin !== origin) return false;
  const last = href.pathname.split('/').pop() ?? '';
  return !/\.[a-z0-9]+$/i.test(last);
}
