/** Pure page helpers: hash routes and note link resolution. */

export type Route =
  | {name: 'home'}
  | {name: 'search'; query: string; tab: string}
  | {name: 'note'; path: string}
  | {name: 'setup'; section: string}
  | {name: 'settings'};

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  const [path = '', search = ''] = raw.split('?');
  if (path === '/search') {
    const params = new URLSearchParams(search);
    const query = params.get('q')?.trim() ?? '';
    const tab = params.get('tab')?.trim() || 'all';
    return query ? {name: 'search', query, tab} : {name: 'home'};
  }
  if (path.startsWith('/note/')) {
    return {
      name: 'note',
      path: decodeURIComponent(path.slice('/note/'.length)),
    };
  }
  if (path === '/setup' || path.startsWith('/setup/')) {
    return {
      name: 'setup',
      section: decodeURIComponent(path.slice('/setup/'.length)),
    };
  }
  if (path === '/settings') return {name: 'settings'};
  return {name: 'home'};
}

export function searchHash(query: string, tab = 'all'): string {
  const base = `#/search?q=${encodeURIComponent(query.trim())}`;
  return tab && tab !== 'all' ? `${base}&tab=${encodeURIComponent(tab)}` : base;
}

export function noteHash(path: string): string {
  return `#/note/${path.split('/').map(encodeURIComponent).join('/')}`;
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

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
