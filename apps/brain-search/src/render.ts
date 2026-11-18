/**
 * Page markup as pure functions (strings in, strings out, no DOM). The
 * browser renders with these, and the build pre-renders every static route
 * with the same functions, so a page reads the same with or without JS.
 */
import {
  folderUrl,
  noteUrl,
  resolveNotePath,
  searchUrl,
  type Route,
} from './app';
import {
  colorLetters,
  easterEgg,
  folderOf,
  tabsFor,
  topLinksFor,
  wordmarkText,
  type EasterEgg,
} from './lib/brand';
import {buildPrompt, handoffs} from './lib/handoff';
import {renderMarkdown} from './lib/markdown';
import type {
  BrainIndex,
  IndexedDoc,
  SearchOutcome,
  SearchResult,
} from './lib/search';
import {escapeHtml, snippet} from './lib/text';
import {MAX_LOGO, type Settings} from './settings';

export const REPO_APP_URL =
  'https://github.com/techlahoma/techlahoma-google-group/blob/main/apps/brain-search';

export interface RenderContext {
  index: BrainIndex | null;
  settings: Settings;
  /** Owner's first name from `?name=` or the index (BRAIN_OWNER). */
  ownerName: string;
  setupMarkdown: string;
  /** True only after loading finished and no index was found. */
  indexMissing?: boolean;
}

/** The logo text: a saved rename wins, else a pun on the owner's name. */
export function logoText(ctx: RenderContext): string {
  return ctx.settings.logo || wordmarkText(ctx.ownerName, 'oogle');
}

export function brainLocation(ctx: RenderContext): string {
  return (
    ctx.settings.location ||
    ctx.index?.brainLocation ||
    'apps/brain-search/brain'
  );
}

export function logoLetters(text: string): string {
  return colorLetters(text)
    .map(({char, color}) =>
      color
        ? `<span class="l-${color}">${escapeHtml(char)}</span>`
        : `<span class="l-space">${char === ' ' ? '&nbsp;' : escapeHtml(char)}</span>`,
    )
    .join('');
}

function folderPaths(ctx: RenderContext): string[] {
  return ctx.index?.docs.map(doc => doc.path) ?? [];
}

/** Top link bar: folder pages, or the current search filtered by folder. */
export function gbarHtml(ctx: RenderContext, route: Route): string {
  const query = route.name === 'search' ? route.query : '';
  const current =
    route.name === 'search'
      ? route.tab
      : route.name === 'folder'
        ? route.folder
        : route.name === 'home'
          ? 'all'
          : '';
  const {main, more} = topLinksFor(folderPaths(ctx));
  const link = (id: string, label: string) => {
    const href = query
      ? searchUrl(query, id)
      : id === 'all'
        ? '/'
        : folderUrl(id);
    return id === current
      ? `<b aria-current="page">${escapeHtml(label)}</b>`
      : `<a href="${href}">${escapeHtml(label)}</a>`;
  };
  const extra = more.map(tab => `<li>${link(tab.id, tab.label)}</li>`).join('');
  return `${main.map(tab => link(tab.id, tab.label)).join(' ')}
    <details class="gbar-more"><summary>more ▾</summary><ul>${extra}
      <li><a href="/setup">AI app setup</a></li>
      <li><a href="/settings">Search settings</a></li>
    </ul></details>`;
}

export function pageTitle(ctx: RenderContext, route: Route): string {
  const logo = logoText(ctx);
  switch (route.name) {
    case 'home':
      return logo;
    case 'search':
      return route.query ? `${route.query} - ${logo} Search` : `${logo} Search`;
    case 'folder':
      return `${folderLabel(route.folder)} - ${logo}`;
    case 'note':
      return `${ctx.index?.docs.find(d => d.path === route.path)?.title ?? 'Note'} - ${logo}`;
    case 'setup':
      return `Setup - ${logo}`;
    case 'settings':
      return `Search settings - ${logo}`;
    case 'notFound':
      return `Not Found - ${logo}`;
  }
}

function searchBox(id: string, value: string, big: boolean): string {
  return `<label class="visually-hidden" for="${id}">Search your brain</label>
    <input id="${id}" class="box${big ? ' big' : ''}" name="q" type="text" autocomplete="off"
      spellcheck="false" enterkeyhint="search" data-query-input value="${escapeHtml(value)}" />`;
}

export function homeHtml(ctx: RenderContext, indexError = false): string {
  const logo = logoText(ctx);
  return `
    <section class="home">
      <div class="logo-wrap">
        <h1 class="logo big"><span class="visually-hidden" id="logo-label">${escapeHtml(logo)}</span><span aria-hidden="true" data-logo>${logoLetters(logo)}</span></h1>
        <label class="visually-hidden" for="logo-edit">Logo text. Type to rename it, Enter to save, Escape to cancel.</label>
        <input id="logo-edit" class="logo-edit logo big" type="text" maxlength="${MAX_LOGO}"
          autocomplete="off" spellcheck="false" value="${escapeHtml(logo)}" title="Click and type to rename" />
      </div>
      <form class="home-form" action="/search" method="get" data-search-form role="search">
        <div class="home-row">
          <span class="home-row-spacer" aria-hidden="true"></span>
          ${searchBox('home-query', '', true)}
          <span class="home-side-links">
            <a href="/settings">Search settings</a>
            <a href="/setup">AI app setup</a>
          </span>
        </div>
        <div class="home-buttons">
          <input type="submit" class="gbutton" data-logo-button value="${escapeHtml(logo)} Search" />
          <button type="button" class="gbutton" data-random>I'm Feeling Lucky</button>
        </div>
      </form>
      <p class="home-hint">Psst: click the logo and type to rename it.</p>
      ${indexError ? '<p class="notice">The search index is missing. Run <code>bun run --cwd apps/brain-search index</code>, then reload.</p>' : ''}
    </section>`;
}

const ICONS: Record<string, string> = {
  all: 'i-all',
  people: 'i-people',
  orgs: 'i-orgs',
  events: 'i-events',
  meetings: 'i-meetings',
  notes: 'i-notes',
  ecosystem: 'i-ecosystem',
  products: 'i-products',
};

export function folderLabel(folder: string): string {
  const tab = tabsFor([`${folder}/x.md`]).find(t => t.id === folder);
  return tab?.label ?? folder;
}

/**
 * Results-page frame: stats bar, folder sidebar, center column, right column.
 * `query` is '' on folder pages, where the sidebar links to folder pages.
 */
export function resultsFrameHtml(
  ctx: RenderContext,
  query: string,
  current: string,
  center = '',
  rhs = '',
  stats = '&nbsp;',
): string {
  const tabs = tabsFor(folderPaths(ctx))
    .map(tab => {
      const icon = `<span class="side-icon ${ICONS[tab.id] ?? 'i-notes'}" aria-hidden="true"></span>`;
      const href = query
        ? searchUrl(query, tab.id)
        : tab.id === 'all'
          ? '/'
          : folderUrl(tab.id);
      return `<li>${
        tab.id === current
          ? `<b aria-current="page">${icon}${escapeHtml(tab.label)}</b>`
          : `<a href="${href}" data-tab="${tab.id}">${icon}${escapeHtml(tab.label)}</a>`
      }</li>`;
    })
    .join('');
  const instant = ctx.settings.instant;
  return `
    <p class="result-stats" id="result-stats" aria-live="polite" aria-atomic="true">${stats}</p>
    <div class="results-layout" id="results-page">
      <nav class="sidebar" aria-label="Folders">
        <ul class="side-folders">${tabs}</ul>
        <ul class="side-group">
          <li>${instant ? '<b>Instant results</b>' : '<button type="button" class="link-button" data-instant="on">Instant results</button>'}</li>
          <li>${instant ? '<button type="button" class="link-button" data-instant="off">Press Enter to search</button>' : '<b>Press Enter to search</b>'}</li>
        </ul>
      </nav>
      <div class="center" id="results-body">${center}</div>
      <aside class="rhs" id="rhs" aria-label="Ask an AI">${rhs}</aside>
    </div>`;
}

export function skeletonHtml(): string {
  const row = `<li class="sk-result" aria-hidden="true">
      <span class="sk sk-title"></span>
      <span class="sk sk-line"></span>
      <span class="sk sk-line short"></span>
      <span class="sk sk-url"></span>
    </li>`;
  return `<ol class="results skeleton">${row.repeat(6)}</ol>`;
}

function handoffLinks(prompt: string, withHints: boolean): string {
  const hosts: Record<string, string> = {
    antigravity: 'Paste into the Agent panel',
    gemini: 'gemini.google.com · paste the prompt',
    chatgpt: 'chatgpt.com · prompt filled in',
    claude: 'claude.ai · prompt filled in',
  };
  return handoffs(prompt)
    .map(target =>
      withHints
        ? `<li><button type="button" class="link-button ad-title" data-handoff="${target.id}">${escapeHtml(target.label)}</button>
            <span class="ad-host">${escapeHtml(hosts[target.id] ?? '')}</span></li>`
        : `<button type="button" class="link-button" data-handoff="${target.id}">${escapeHtml(target.label)}</button>`,
    )
    .join(withHints ? '' : ' - ');
}

export function handoffBox(
  ctx: RenderContext,
  query: string,
  strong: boolean,
): string {
  const prompt = buildPrompt(query, brainLocation(ctx));
  const explain =
    '<p class="handoff-explain">Each link <b>copies a ready-made prompt</b>, then opens the app.</p>';
  const details = `<details class="prompt-details"><summary>See the prompt</summary>
      <div class="copy-block">
        <button type="button" class="copy-button" data-copy="${escapeHtml(prompt)}" aria-label="Copy the prompt">Copy</button>
        <textarea id="handoff-prompt" rows="6" readonly aria-label="Prompt that will be copied">${escapeHtml(prompt)}</textarea>
      </div></details>`;
  if (strong) {
    return `<div class="handoff-inline" id="handoff">
      <h2>Ask an AI about <b>${escapeHtml(query)}</b></h2>
      <p class="handoff-links">${handoffLinks(prompt, false)}</p>${explain}${details}</div>`;
  }
  return `<div class="handoff-ads" id="handoff">
      <h2>Ask an AI</h2>
      <p class="ad-lede">Your brain has no strong match. Let an AI search it and write down what it finds.</p>
      <ul>${handoffLinks(prompt, true)}</ul>${explain}${details}</div>`;
}

function resultItem(
  ctx: RenderContext,
  result: SearchResult,
  query: string,
): string {
  const {doc} = result;
  const source = doc.source[0];
  const why =
    result.semantic === null
      ? `keywords ${result.keyword.toFixed(2)}`
      : `meaning ${result.semantic.toFixed(2)} · keywords ${result.keyword.toFixed(2)}`;
  const links = [
    source
      ? `<a class="fl" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">Source</a>`
      : '',
    `<a class="fl" href="${searchUrl(`related:${doc.path}`)}">Similar</a>`,
  ]
    .filter(Boolean)
    .join(' - ');
  return `
    <li class="g">
      <h3><a href="${noteUrl(doc.path)}">${escapeHtml(doc.title)}</a>${doc.sample ? ' <span class="sample">[sample]</span>' : ''}</h3>
      <div class="s">${snippet(result.chunk.text, query)}<br />
        <cite>brain/${escapeHtml(doc.path)}</cite> - ${links}
        ${ctx.settings.showScores ? `<span class="why">${why}</span>` : ''}
      </div>
    </li>`;
}

function eggLine(
  ctx: RenderContext,
  egg: EasterEgg,
  query: string,
  reducedMotion: boolean,
): string {
  switch (egg) {
    case 'recursion':
      return `<p class="spell">Did you mean: <a href="${searchUrl(query)}"><b><i>recursion</i></b></a></p>`;
    case 'self':
      return `<p class="spell">Searching for yourself${ctx.ownerName ? `, ${escapeHtml(ctx.ownerName)}` : ''}? Your brain hasn't written you down yet. Capture a note in <code>people/</code>.</p>`;
    case 'barrel-roll':
      return reducedMotion
        ? '<p class="spell">Barrel roll skipped: your device asks for reduced motion. Consider it rolled.</p>'
        : '';
    default:
      return '';
  }
}

export interface ResultsParts {
  stats: string;
  center: string;
  rhs: string;
  egg: EasterEgg;
}

export function resultsParts(
  ctx: RenderContext,
  query: string,
  tab: string,
  outcome: SearchOutcome,
  seconds: number,
  statusSuffix: string,
  reducedMotion: boolean,
): ResultsParts {
  const count = outcome.results.length;
  const stats = `${count === 0 ? 'No results' : `About ${count} ${count === 1 ? 'result' : 'results'}`} (${seconds.toFixed(2)} seconds)${statusSuffix}`;
  const egg = easterEgg(query, ctx.ownerName);
  const related = query.startsWith('related:');
  const empty =
    count === 0
      ? `<div class="no-match" id="no-match">
          <p>Your search - <b>${escapeHtml(query)}</b> - did not match any notes${tab === 'all' ? '' : ` in ${escapeHtml(tab)}`}.</p>
          <p>Suggestions:</p>
          <ul>
            <li>Make sure all words are spelled correctly.</li>
            <li>Try different keywords.</li>
            <li>Try more general keywords.</li>
            ${tab === 'all' ? '' : `<li><a href="${searchUrl(query)}">Search all folders</a>.</li>`}
            <li>Ask an AI, then capture the answer in your brain.</li>
          </ul>
        </div>`
      : '';
  const items = outcome.results.map(r => resultItem(ctx, r, query)).join('');
  const strong = outcome.strength === 'strong';
  const center = `
    ${eggLine(ctx, egg, query, reducedMotion)}
    ${related && count ? '<p class="spell">Notes similar in meaning:</p>' : ''}
    ${empty}
    ${count ? `<ol class="results" id="results">${items}</ol>` : ''}
    ${strong && !related ? handoffBox(ctx, query, true) : ''}`;
  const rhs = strong || related ? '' : handoffBox(ctx, query, false);
  return {stats: escapeHtml(stats), center, rhs, egg};
}

/** A 2010-style listing of every note in one folder, by title. */
export function folderHtml(ctx: RenderContext, folder: string): string {
  const index = ctx.index;
  const docs = (index?.docs ?? [])
    .map((doc, docIndex) => ({doc, docIndex}))
    .filter(({doc}) => folderOf(doc.path) === folder)
    .sort((a, b) => a.doc.title.localeCompare(b.doc.title));
  const items = docs
    .map(({doc, docIndex}) =>
      resultItem(
        {...ctx, settings: {...ctx.settings, showScores: false}},
        {
          doc,
          docIndex,
          chunk: index?.chunks.find(c => c.doc === docIndex) ?? {
            doc: docIndex,
            heading: doc.title,
            text: doc.title,
          },
          score: 1,
          keyword: 0,
          coverage: 0,
          semantic: null,
        },
        '',
      ),
    )
    .join('');
  const label = folderLabel(folder);
  const center = docs.length
    ? `<h1 class="folder-title">${escapeHtml(label)}</h1><ol class="results" id="results">${items}</ol>`
    : `<h1 class="folder-title">${escapeHtml(label)}</h1><p>No notes in <code>${escapeHtml(folder)}/</code> yet.</p>`;
  return resultsFrameHtml(
    ctx,
    '',
    folder,
    center,
    '',
    `${docs.length} ${docs.length === 1 ? 'note' : 'notes'} in ${escapeHtml(label)}`,
  );
}

export function searchPromptHtml(ctx: RenderContext): string {
  return resultsFrameHtml(
    ctx,
    '',
    'all',
    `<p>Type a search in the box above.</p>
     <noscript><p>Search runs in your browser and needs JavaScript. You can still browse the folders on the left.</p></noscript>`,
  );
}

export function noteHtml(ctx: RenderContext, path: string): string {
  const doc: IndexedDoc | undefined = ctx.index?.docs.find(
    d => d.path === path,
  );
  if (!doc) return notFoundHtml(`/n/${path.replace(/\.md$/, '')}`);
  const body = renderMarkdown(doc.body.replace(/^\s*#\s+.+\n/, ''), {
    resolveLink: href => {
      const target = resolveNotePath(doc.path, href);
      return target ? noteUrl(target) : href;
    },
  });
  const hasSourceSection = /^##\s+Sources?\s*$/im.test(doc.body);
  const sources = doc.source
    .map(
      url =>
        `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`,
    )
    .join('');
  const tags = doc.tags
    .map(tag => `<a href="${searchUrl(tag)}">${escapeHtml(tag)}</a>`)
    .join(', ');
  const folder = folderOf(doc.path);
  return `
    <article class="reader">
      <p class="reader-back"><a href="${folder ? folderUrl(folder) : '/'}" data-back>« Back</a></p>
      <h1>${escapeHtml(doc.title)}</h1>
      <p class="reader-meta"><cite>brain/${escapeHtml(doc.path)}</cite>
        ${doc.updated ? ` - updated ${escapeHtml(doc.updated)}` : ''}
        ${doc.sample ? ' - <span class="sample">sample, fictional</span>' : ''}
        ${tags ? `<br />Tags: ${tags}` : ''}
        - <a class="fl" href="${searchUrl(`related:${doc.path}`)}">Similar notes</a></p>
      <div class="prose">${body}</div>
      ${sources && !hasSourceSection ? `<h2>Sources</h2><ul>${sources}</ul>` : ''}
    </article>`;
}

export function setupHtml(ctx: RenderContext): string {
  return `<article class="reader setup-page prose">${renderMarkdown(
    ctx.setupMarkdown,
    {resolveLink: href => `${REPO_APP_URL}/${href}`},
  )}</article>`;
}

export function settingsHtml(ctx: RenderContext): string {
  const s = ctx.settings;
  const fallback = wordmarkText(ctx.ownerName, 'oogle');
  return `
    <article class="reader settings-page">
      <h1>Search settings</h1>
      <form id="settings-form" class="settings-form">
        <fieldset>
          <legend>Instant results</legend>
          <label><input type="radio" name="instant" value="on" ${s.instant ? 'checked' : ''} />
            Use Instant: results appear as you type</label>
          <label><input type="radio" name="instant" value="off" ${s.instant ? '' : 'checked'} />
            Do not use Instant: press Enter or the button</label>
        </fieldset>
        <fieldset>
          <legend>Logo</legend>
          <label for="setting-logo">Logo text (empty = ${escapeHtml(fallback)}; or click the logo on the home page and type)</label>
          <input id="setting-logo" type="text" maxlength="${MAX_LOGO}" value="${escapeHtml(s.logo)}" placeholder="${escapeHtml(fallback)}" />
          <label for="setting-name">Your first name (the default logo is a pun on it)</label>
          <input id="setting-name" type="text" autocomplete="given-name" value="${escapeHtml(s.name)}" />
        </fieldset>
        <fieldset>
          <legend>AI prompts</legend>
          <label for="setting-location">Where your brain lives</label>
          <input id="setting-location" type="text" placeholder="~/Brain or github.com/you/brain" value="${escapeHtml(s.location)}" />
        </fieldset>
        <fieldset>
          <legend>Results</legend>
          <label><input id="setting-scores" type="checkbox" ${s.showScores ? 'checked' : ''} />
            Show match scores (meaning and keywords) under each result</label>
        </fieldset>
        <p><input type="submit" class="gbutton" value="Save" /> <a href="/" data-back>Cancel</a></p>
      </form>
    </article>`;
}

export function notFoundHtml(path: string): string {
  return `
    <article class="reader not-found">
      <h1>Not Found</h1>
      <p>The requested URL <code>${escapeHtml(path)}</code> was not found in this brain.</p>
      <form action="/search" method="get" data-search-form role="search" class="not-found-form">
        ${searchBox('notfound-query', path.replace(/^\/+/, '').replace(/[-/]+/g, ' '), false)}
        <input type="submit" class="gbutton" value="Search" />
      </form>
      <p><a href="/">Go to the home page</a></p>
    </article>`;
}

/** The view for any route that doesn't need a live search. */
export function staticViewHtml(ctx: RenderContext, route: Route): string {
  switch (route.name) {
    case 'home':
      return homeHtml(ctx, ctx.indexMissing === true);
    case 'search':
      return searchPromptHtml(ctx);
    case 'folder':
      return folderHtml(ctx, route.folder);
    case 'note':
      return noteHtml(ctx, route.path);
    case 'setup':
      return setupHtml(ctx);
    case 'settings':
      return settingsHtml(ctx);
    case 'notFound':
      return notFoundHtml(route.path);
  }
}
