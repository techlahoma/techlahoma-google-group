import setupMarkdown from '../SETUP.md?raw';
import {
  noteHash,
  parseRoute,
  resolveNotePath,
  searchHash,
  type Route,
} from './app';
import {startEmbedder, type Embedder} from './embedder';
import {
  colorLetters,
  easterEgg,
  firstName,
  folderOf,
  tabsFor,
  topLinksFor,
  faviconDataUri,
  faviconLetter,
  wordmarkText,
  type EasterEgg,
} from './lib/brand';
import {buildPrompt, handoffs, type Handoff} from './lib/handoff';
import {renderMarkdown} from './lib/markdown';
import {
  cosineScores,
  decodeVectors,
  hybridSearch,
  relatedSearch,
  type BrainIndex,
  type SearchOutcome,
  type VectorIndex,
} from './lib/search';
import {escapeHtml, snippet} from './lib/text';
import {
  DEFAULT_LOGO,
  MAX_LOGO,
  browserStorage,
  cleanLogo,
  loadSettings,
  saveSettings,
  type Settings,
} from './settings';
import './style.css';

const REPO_APP_URL =
  'https://github.com/techlahoma/techlahoma-google-group/blob/main/apps/brain-search';
const DEBOUNCE_MS = 150;
/** Longest the skeleton waits for the model before keyword results show. */
const SKELETON_MAX_MS = 8000;

function element<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Missing ${selector}`);
  return found;
}

const view = element<HTMLElement>('#view');
const engineStatus = element<HTMLElement>('#engine-status');
const toast = element<HTMLElement>('#toast');
const headerQuery = element<HTMLInputElement>('#rhead-query');
const gbarFolders = element<HTMLElement>('#gbar-folders');

// ---------- Settings (?name= and ?logo= seed them) ----------

const storage = browserStorage();
const urlParams = new URLSearchParams(location.search);
const settings: Settings = loadSettings(storage);
const nameParam = urlParams.get('name');
const logoParam = urlParams.get('logo');
if (nameParam !== null) {
  settings.name = firstName(nameParam);
  settings.logo = cleanLogo(wordmarkText(settings.name, 'oogle'));
}
if (logoParam !== null) settings.logo = cleanLogo(logoParam);
if (nameParam !== null || logoParam !== null) saveSettings(storage, settings);

// ---------- Loading: start everything the moment the page opens ----------

type ModelState = 'loading' | 'ready' | 'failed' | 'absent' | 'off';

interface State {
  index: BrainIndex | null;
  indexError: string | null;
  vectors: Float32Array | null;
  vectorMeta: VectorIndex | null;
  embedder: Embedder | null;
  modelState: ModelState;
  searchSeq: number;
  lastRolled: string;
}

const state: State = {
  index: null,
  indexError: null,
  vectors: null,
  vectorMeta: null,
  embedder: null,
  // ?semantic=off keeps search keyword-only (slow Wi-Fi, tests).
  modelState: urlParams.get('semantic') === 'off' ? 'off' : 'loading',
  searchSeq: 0,
  lastRolled: '',
};

let markSettled: () => void = () => {};
/** Resolves once the index is in and the model is ready or ruled out. */
const settled = new Promise<void>(resolve => {
  markSettled = resolve;
});
let isSettled = false;

async function loadBrain(): Promise<void> {
  const [indexResult, vectorResult] = await Promise.allSettled([
    fetch('./brain-index.json').then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<BrainIndex>;
    }),
    fetch('./brain-vectors.json').then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<VectorIndex>;
    }),
  ]);
  if (indexResult.status === 'fulfilled') state.index = indexResult.value;
  else state.indexError = String(indexResult.reason);
  const meta = vectorResult.status === 'fulfilled' ? vectorResult.value : null;
  if (
    state.index &&
    meta?.encoding === 'int8' &&
    meta.contentHash === state.index.contentHash
  ) {
    state.vectorMeta = meta;
    state.vectors = decodeVectors(meta.scales, meta.vectors, meta.dims);
  } else if (state.modelState !== 'off') {
    state.modelState = 'absent';
  }
  paintFolders();
  updateStatus();
  if (state.modelState === 'loading' && state.vectorMeta) {
    try {
      state.embedder = startEmbedder(
        state.vectorMeta.model,
        state.vectorMeta.dtype,
      );
      await state.embedder.ready;
      state.modelState = 'ready';
    } catch (error) {
      console.warn('Meaning model unavailable; using keyword search.', error);
      state.modelState = 'failed';
    }
  }
  isSettled = true;
  updateStatus();
  markSettled();
  onSettled();
}

const indexLoaded = loadBrain();

function updateStatus(): void {
  if (state.indexError) {
    engineStatus.textContent = 'Search index missing: run “bun run index”.';
    return;
  }
  const words: Record<ModelState, string> = {
    loading: 'Meaning search: loading…',
    ready: 'Meaning search: ready',
    failed: 'Meaning search: unavailable (keywords only)',
    absent: 'Meaning search: no embeddings (keywords only)',
    off: 'Meaning search: off (keywords only)',
  };
  const notes = state.index ? `${state.index.docs.length} notes · ` : '';
  const instant = settings.instant
    ? isSettled
      ? ' · Instant: on'
      : ' · Instant: starts when ready'
    : ' · Instant: off';
  engineStatus.textContent = `${notes}${words[state.modelState]}${instant}`;
}

// ---------- Logo ----------

function logoLetters(text: string): string {
  return colorLetters(text)
    .map(({char, color}) =>
      color
        ? `<span class="l-${color}">${escapeHtml(char)}</span>`
        : `<span class="l-space">${char === ' ' ? '&nbsp;' : escapeHtml(char)}</span>`,
    )
    .join('');
}

/** The tab icon follows the logo's first letter ("Valerie" -> "v"). */
function paintFavicon(): void {
  const link = document.querySelector<HTMLLinkElement>('#favicon');
  if (!link) return;
  link.href =
    faviconLetter(settings.logo) === 'g'
      ? '/favicon.svg'
      : faviconDataUri(settings.logo);
}

function paintLogo(text = settings.logo): void {
  for (const node of document.querySelectorAll<HTMLElement>('[data-logo]')) {
    node.innerHTML = logoLetters(text);
  }
  const label = document.querySelector<HTMLElement>('#logo-label');
  if (label) label.textContent = text;
  for (const button of document.querySelectorAll<HTMLInputElement>(
    '[data-logo-button]',
  )) {
    button.value = `${settings.logo} Search`;
  }
  const route = parseRoute(location.hash);
  paintFavicon();
  if (route.name === 'home') document.title = settings.logo;
  else if (route.name === 'search') {
    document.title = `${route.query} - ${settings.logo} Search`;
  }
}

function saveLogo(input: HTMLInputElement): void {
  settings.logo = cleanLogo(input.value);
  input.value = settings.logo;
  saveSettings(storage, settings);
  paintLogo();
}

// ---------- Folder links ----------

function folderPaths(): string[] {
  return state.index?.docs.map(doc => doc.path) ?? [];
}

function currentQuery(): string {
  const route = parseRoute(location.hash);
  return route.name === 'search' ? route.query : '';
}

function paintFolders(): void {
  const route = parseRoute(location.hash);
  const current = route.name === 'search' ? route.tab : '';
  const query = currentQuery();
  const {main, more} = topLinksFor(folderPaths());
  const link = (id: string, label: string) => {
    const hash = query ? searchHash(query, id) : `#/search?q=*&tab=${id}`;
    return id === current
      ? `<b aria-current="page">${escapeHtml(label)}</b>`
      : `<a href="${hash}">${escapeHtml(label)}</a>`;
  };
  const extra = more.map(tab => `<li>${link(tab.id, tab.label)}</li>`).join('');
  gbarFolders.innerHTML = `${main.map(tab => link(tab.id, tab.label)).join(' ')}
    <details class="gbar-more"><summary>more ▾</summary><ul>${extra}
      <li><a href="#/setup">AI app setup</a></li>
      <li><a href="#/settings">Search settings</a></li>
    </ul></details>`;
}

// ---------- Clipboard and toast ----------

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function showToast(message: string): void {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 6000);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    // Legacy fallback for browsers that block the async clipboard API.
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  }
}

const copyTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

/** Copy the exact text a Copy button carries, then say so for 2 seconds. */
async function copyFromButton(button: HTMLButtonElement): Promise<void> {
  const copied = await copyText(button.dataset.copy ?? '');
  button.textContent = copied ? 'Copied!' : 'Copy failed';
  showToast(
    copied
      ? 'Copied to the clipboard.'
      : 'Could not copy automatically. Select the text and copy it by hand.',
  );
  clearTimeout(copyTimers.get(button));
  copyTimers.set(
    button,
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000),
  );
}

// ---------- Home ----------

function renderHome(): void {
  view.innerHTML = `
    <section class="home">
      <div class="logo-wrap">
        <h1 class="logo big"><span class="visually-hidden" id="logo-label"></span><span aria-hidden="true" data-logo></span></h1>
        <label class="visually-hidden" for="logo-edit">Logo text. Type to rename it, Enter to save, Escape to cancel.</label>
        <input id="logo-edit" class="logo-edit logo big" type="text" maxlength="${MAX_LOGO}"
          autocomplete="off" spellcheck="false" value="${escapeHtml(settings.logo)}" title="Click and type to rename" />
      </div>
      <form class="home-form" data-search-form role="search">
        <div class="home-row">
          <span class="home-row-spacer" aria-hidden="true"></span>
          <label class="visually-hidden" for="home-query">Search your brain</label>
          <input id="home-query" class="box big" name="q" type="text" autocomplete="off"
            spellcheck="false" enterkeyhint="search" data-query-input />
          <span class="home-side-links">
            <a href="#/settings">Search settings</a>
            <a href="#/setup">AI app setup</a>
          </span>
        </div>
        <div class="home-buttons">
          <input type="submit" class="gbutton" data-logo-button value="${escapeHtml(settings.logo)} Search" />
          <button type="button" class="gbutton" data-random>I'm Feeling Lucky</button>
        </div>
      </form>
      <p class="home-hint">Psst: click the logo and type to rename it.</p>
      ${state.indexError ? '<p class="notice">The search index is missing. Run <code>bun run --cwd apps/brain-search index</code>, then reload.</p>' : ''}
    </section>`;
  paintLogo();
}

// ---------- Results ----------

function resultsLayout(route: Extract<Route, {name: 'search'}>): void {
  const icons: Record<string, string> = {
    all: 'i-all',
    people: 'i-people',
    orgs: 'i-orgs',
    events: 'i-events',
    meetings: 'i-meetings',
    notes: 'i-notes',
    ecosystem: 'i-ecosystem',
    products: 'i-products',
  };
  const tabs = tabsFor(folderPaths())
    .map(tab => {
      const current = tab.id === route.tab;
      const icon = `<span class="side-icon ${icons[tab.id] ?? 'i-notes'}" aria-hidden="true"></span>`;
      return `<li>${
        current
          ? `<b aria-current="page">${icon}${escapeHtml(tab.label)}</b>`
          : `<a href="${searchHash(route.query, tab.id)}" data-tab="${tab.id}">${icon}${escapeHtml(tab.label)}</a>`
      }</li>`;
    })
    .join('');
  view.innerHTML = `
    <p class="result-stats" id="result-stats" aria-live="polite" aria-atomic="true">&nbsp;</p>
    <div class="results-layout" id="results-page">
      <nav class="sidebar" aria-label="Folders">
        <ul class="side-folders">${tabs}</ul>
        <ul class="side-group">
          <li>${settings.instant ? '<b>Instant results</b>' : '<button type="button" class="link-button" data-instant="on">Instant results</button>'}</li>
          <li>${settings.instant ? '<button type="button" class="link-button" data-instant="off">Press Enter to search</button>' : '<b>Press Enter to search</b>'}</li>
        </ul>
      </nav>
      <div class="center" id="results-body"></div>
      <aside class="rhs" id="rhs" aria-label="Ask an AI"></aside>
    </div>`;
}

function skeletonHtml(): string {
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

function handoffBox(query: string, strong: boolean): string {
  const prompt = buildPrompt(query, brainLocation());
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

function brainLocation(): string {
  return (
    settings.location || state.index?.brainLocation || 'apps/brain-search/brain'
  );
}

function resultItem(outcome: SearchOutcome, query: string, i: number): string {
  const result = outcome.results[i];
  if (!result) return '';
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
    `<a class="fl" href="${searchHash(`related:${doc.path}`)}">Similar</a>`,
  ]
    .filter(Boolean)
    .join(' - ');
  return `
    <li class="g">
      <h3><a href="${noteHash(doc.path)}">${escapeHtml(doc.title)}</a>${doc.sample ? ' <span class="sample">[sample]</span>' : ''}</h3>
      <div class="s">${snippet(result.chunk.text, query)}<br />
        <cite>brain/${escapeHtml(doc.path)}</cite> - ${links}
        ${settings.showScores ? `<span class="why">${why}</span>` : ''}
      </div>
    </li>`;
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function eggLine(egg: EasterEgg, query: string): string {
  switch (egg) {
    case 'recursion':
      return `<p class="spell">Did you mean: <a href="${searchHash(query)}"><b><i>recursion</i></b></a></p>`;
    case 'self':
      return `<p class="spell">Searching for yourself${settings.name ? `, ${escapeHtml(settings.name)}` : ''}? Your brain hasn't written you down yet. Capture a note in <code>people/</code>.</p>`;
    case 'barrel-roll':
      return reducedMotion()
        ? '<p class="spell">Barrel roll skipped: your device asks for reduced motion. Consider it rolled.</p>'
        : '';
    default:
      return '';
  }
}

function applyEgg(egg: EasterEgg, query: string): void {
  document.body.classList.toggle('askew', egg === 'askew');
  if (egg !== 'barrel-roll') {
    state.lastRolled = '';
    return;
  }
  if (state.lastRolled === query || reducedMotion()) return;
  state.lastRolled = query;
  document.body.classList.remove('barrel-roll');
  void document.body.offsetWidth;
  document.body.classList.add('barrel-roll');
}

function statusSuffix(): string {
  if (state.modelState === 'loading') return ' · meaning search still loading';
  if (state.modelState === 'ready') return '';
  return ' · keyword search';
}

function renderOutcome(
  query: string,
  tab: string,
  outcome: SearchOutcome,
  seconds: number,
): void {
  const body = document.querySelector<HTMLElement>('#results-body');
  const rhs = document.querySelector<HTMLElement>('#rhs');
  const stats = document.querySelector<HTMLElement>('#result-stats');
  const page = document.querySelector<HTMLElement>('#results-page');
  if (!body || !rhs || !stats || !page) return;
  const count = outcome.results.length;
  stats.textContent = `${count === 0 ? 'No results' : `About ${count} ${count === 1 ? 'result' : 'results'}`} (${seconds.toFixed(2)} seconds)${statusSuffix()}`;
  page.dataset.strength = outcome.strength;
  page.dataset.loading = 'false';
  const egg = easterEgg(query, settings.name);
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
            ${tab === 'all' ? '' : `<li><a href="${searchHash(query)}">Search all folders</a>.</li>`}
            <li>Ask an AI, then capture the answer in your brain.</li>
          </ul>
        </div>`
      : '';
  const items = outcome.results
    .map((_, i) => resultItem(outcome, query, i))
    .join('');
  const strong = outcome.strength === 'strong';
  body.innerHTML = `
    ${eggLine(egg, query)}
    ${related && count ? '<p class="spell">Notes similar in meaning:</p>' : ''}
    ${empty}
    ${count ? `<ol class="results" id="results">${items}</ol>` : ''}
    ${strong && !related && query !== '*' ? handoffBox(query, true) : ''}`;
  rhs.innerHTML = strong || related ? '' : handoffBox(query, false);
  applyEgg(egg, query);
}

function searchOutcome(
  query: string,
  tab: string,
  semantic: number[] | null,
): SearchOutcome {
  const index = state.index as BrainIndex;
  let outcome: SearchOutcome;
  if (query.startsWith('related:')) {
    outcome =
      state.vectors && state.vectorMeta
        ? relatedSearch(
            index,
            state.vectors,
            state.vectorMeta.dims,
            query.slice('related:'.length),
            200,
          )
        : {results: [], strength: 'none', mode: 'keyword'};
  } else if (query === '*') {
    // Browse a folder from the top links: every note, newest first.
    const results = index.docs
      .map((doc, docIndex) => ({
        doc,
        docIndex,
        chunk: index.chunks.find(c => c.doc === docIndex) ?? {
          doc: docIndex,
          heading: doc.title,
          text: doc.title,
        },
        score: 1,
        keyword: 0,
        coverage: 0,
        semantic: null,
      }))
      .sort(
        (a, b) =>
          b.doc.updated.localeCompare(a.doc.updated) ||
          a.doc.title.localeCompare(b.doc.title),
      );
    outcome = {results, strength: 'strong', mode: 'keyword'};
  } else {
    outcome = hybridSearch(index, query, semantic, 200);
  }
  const results = (
    tab === 'all'
      ? outcome.results
      : outcome.results.filter(r => folderOf(r.doc.path) === tab)
  ).slice(0, 30);
  return {
    ...outcome,
    results,
    strength: results.length ? outcome.strength : 'none',
  };
}

/**
 * Show results for a query. Before the brain and model are ready this shows a
 * skeleton, then swaps in real results the moment they are.
 */
async function runSearch(query: string, tab: string): Promise<void> {
  const seq = ++state.searchSeq;
  const page = document.querySelector<HTMLElement>('#results-page');
  if (!isSettled) {
    const body = document.querySelector<HTMLElement>('#results-body');
    const stats = document.querySelector<HTMLElement>('#result-stats');
    if (body && !body.querySelector('.skeleton'))
      body.innerHTML = skeletonHtml();
    if (stats) stats.textContent = 'Warming up your brain…';
    if (page) page.dataset.loading = 'true';
    await Promise.race([
      settled,
      indexLoaded.then(
        () =>
          new Promise<void>(resolve => {
            setTimeout(resolve, SKELETON_MAX_MS);
          }),
      ),
    ]);
    if (seq !== state.searchSeq) return;
  }
  await indexLoaded;
  if (seq !== state.searchSeq) return;
  if (!state.index) {
    const body = document.querySelector<HTMLElement>('#results-body');
    if (body) {
      body.innerHTML = `<p class="notice">The search index is missing. Run <code>bun run --cwd apps/brain-search index</code>, then reload.</p>${handoffBox(query, false)}`;
    }
    return;
  }
  const started = performance.now();
  let semantic: number[] | null = null;
  if (
    state.modelState === 'ready' &&
    state.embedder &&
    state.vectors &&
    state.vectorMeta &&
    !query.startsWith('related:') &&
    query !== '*'
  ) {
    try {
      const vector = await state.embedder.embed(query);
      if (seq !== state.searchSeq) return;
      semantic = cosineScores(state.vectors, state.vectorMeta.dims, vector);
    } catch (error) {
      console.warn('Query embedding failed; using keyword search.', error);
    }
  }
  renderOutcome(
    query,
    tab,
    searchOutcome(query, tab, semantic),
    (performance.now() - started) / 1000,
  );
  // Timed out of the skeleton with the model still loading: rerank later.
  if (state.modelState === 'loading') {
    void settled.then(() => {
      const route = parseRoute(location.hash);
      if (
        route.name === 'search' &&
        route.query === query &&
        seq === state.searchSeq
      ) {
        void runSearch(query, route.tab);
      }
    });
  }
}

// ---------- Reader, setup, settings ----------

function renderNote(path: string): void {
  const doc = state.index?.docs.find(d => d.path === path);
  if (!doc) {
    view.innerHTML = `<article class="reader"><h1>Note not found</h1>
      <p>No note at <code>${escapeHtml(path)}</code>. <a href="#/">Back to search</a></p></article>`;
    return;
  }
  const body = renderMarkdown(doc.body.replace(/^\s*#\s+.+\n/, ''), {
    resolveLink: href => {
      const target = resolveNotePath(doc.path, href);
      return target ? noteHash(target) : href;
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
    .map(tag => `<a href="${searchHash(tag)}">${escapeHtml(tag)}</a>`)
    .join(', ');
  view.innerHTML = `
    <article class="reader">
      <p class="reader-back"><a href="#/" data-back>« Back to results</a></p>
      <h1>${escapeHtml(doc.title)}</h1>
      <p class="reader-meta"><cite>brain/${escapeHtml(doc.path)}</cite>
        ${doc.updated ? ` - updated ${escapeHtml(doc.updated)}` : ''}
        ${doc.sample ? ' - <span class="sample">sample, fictional</span>' : ''}
        ${tags ? `<br />Tags: ${tags}` : ''}
        - <a class="fl" href="${searchHash(`related:${doc.path}`)}">Similar notes</a></p>
      <div class="prose">${body}</div>
      ${sources && !hasSourceSection ? `<h2>Sources</h2><ul>${sources}</ul>` : ''}
    </article>`;
}

function renderSetup(section: string): void {
  view.innerHTML = `<article class="reader setup-page prose">${renderMarkdown(
    setupMarkdown,
    {resolveLink: href => `${REPO_APP_URL}/${href}`},
  )}</article>`;
  if (section) document.getElementById(section)?.scrollIntoView();
}

function renderSettings(): void {
  view.innerHTML = `
    <article class="reader settings-page">
      <h1>Search settings</h1>
      <form id="settings-form" class="settings-form">
        <fieldset>
          <legend>Instant results</legend>
          <label><input type="radio" name="instant" value="on" ${settings.instant ? 'checked' : ''} />
            Use Instant: results appear as you type</label>
          <label><input type="radio" name="instant" value="off" ${settings.instant ? '' : 'checked'} />
            Do not use Instant: press Enter or the button</label>
        </fieldset>
        <fieldset>
          <legend>Logo</legend>
          <label for="setting-logo">Logo text (or click the logo on the home page and type)</label>
          <input id="setting-logo" type="text" maxlength="${MAX_LOGO}" value="${escapeHtml(settings.logo)}" />
          <label for="setting-name">Your first name (for one Easter egg)</label>
          <input id="setting-name" type="text" autocomplete="given-name" value="${escapeHtml(settings.name)}" />
        </fieldset>
        <fieldset>
          <legend>AI prompts</legend>
          <label for="setting-location">Where your brain lives</label>
          <input id="setting-location" type="text" placeholder="~/Brain or github.com/you/brain" value="${escapeHtml(settings.location)}" />
        </fieldset>
        <fieldset>
          <legend>Results</legend>
          <label><input id="setting-scores" type="checkbox" ${settings.showScores ? 'checked' : ''} />
            Show match scores (meaning and keywords) under each result</label>
        </fieldset>
        <p><input type="submit" class="gbutton" value="Save" /> <a href="#/" data-back>Cancel</a></p>
      </form>
    </article>`;
}

// ---------- Routing ----------

function focusAtEnd(input: HTMLInputElement): void {
  input.focus();
  const end = input.value.length;
  input.setSelectionRange(end, end);
}

async function render(): Promise<void> {
  const route: Route = parseRoute(location.hash);
  document.body.dataset.route = route.name;
  document.body.classList.remove('askew');
  paintFolders();
  switch (route.name) {
    case 'home':
      renderHome();
      element<HTMLInputElement>('#home-query').focus();
      return;
    case 'search':
      if (
        headerQuery.value !== route.query &&
        document.activeElement !== headerQuery
      ) {
        headerQuery.value = route.query === '*' ? '' : route.query;
      }
      resultsLayout(route);
      paintLogo();
      await runSearch(route.query, route.tab);
      return;
    case 'note':
      await indexLoaded;
      renderNote(route.path);
      document.title = `${state.index?.docs.find(d => d.path === route.path)?.title ?? 'Note'} - ${settings.logo}`;
      view.focus();
      return;
    case 'setup':
      document.title = `Setup - ${settings.logo}`;
      renderSetup(route.section);
      return;
    case 'settings':
      document.title = `Search settings - ${settings.logo}`;
      renderSettings();
      return;
  }
}

function instantActive(): boolean {
  return settings.instant && isSettled;
}

/** Instant mode: replace the URL (no history entry) and search. */
let typingTimer: ReturnType<typeof setTimeout> | undefined;
function onType(input: HTMLInputElement): void {
  if (!instantActive()) return;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(
    () => instantSearch(input.value.trim()),
    DEBOUNCE_MS,
  );
}

function instantSearch(query: string): void {
  const route = parseRoute(location.hash);
  if (!query) {
    if (route.name === 'search') {
      history.replaceState(null, '', '#/');
      void render().then(() => {
        const home = document.querySelector<HTMLInputElement>('#home-query');
        if (home) focusAtEnd(home);
      });
    }
    return;
  }
  const tab = route.name === 'search' ? route.tab : 'all';
  history.replaceState(null, '', searchHash(query, tab));
  if (route.name !== 'search' || !document.querySelector('#results-body')) {
    // First keystroke on the home page flips to the results page.
    headerQuery.value = query;
    void render();
    focusAtEnd(headerQuery);
    return;
  }
  document.title = `${query} - ${settings.logo} Search`;
  for (const link of view.querySelectorAll<HTMLAnchorElement>('[data-tab]')) {
    link.href = searchHash(query, link.dataset.tab ?? 'all');
  }
  paintFolders();
  void runSearch(query, tab);
}

/** If someone typed while loading, show their results now. */
function onSettled(): void {
  const route = parseRoute(location.hash);
  if (route.name !== 'home' || !settings.instant) return;
  const home = document.querySelector<HTMLInputElement>('#home-query');
  const query = home?.value.trim();
  if (query && document.activeElement === home) instantSearch(query);
}

function handleHandoff(target: Handoff, prompt: string): void {
  // Open the window inside the click so popup blockers allow it, then copy.
  if (target.url) window.open(target.url, '_blank', 'noopener');
  void copyText(prompt).then(copied => {
    showToast(
      copied
        ? target.hint
        : 'Could not copy automatically. Open “See the prompt” and copy it from there.',
    );
  });
}

function saveSettingsForm(form: HTMLFormElement): void {
  const data = new FormData(form);
  settings.instant = data.get('instant') !== 'off';
  settings.logo = cleanLogo(
    element<HTMLInputElement>('#setting-logo').value || DEFAULT_LOGO,
  );
  settings.name = firstName(element<HTMLInputElement>('#setting-name').value);
  settings.location =
    element<HTMLInputElement>('#setting-location').value.trim();
  settings.showScores = element<HTMLInputElement>('#setting-scores').checked;
  saveSettings(storage, settings);
  updateStatus();
  paintLogo();
  showToast('Your preferences have been saved.');
}

document.addEventListener('submit', event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.id === 'settings-form') {
    event.preventDefault();
    saveSettingsForm(form);
    if (history.length > 1) history.back();
    else location.hash = '#/';
    return;
  }
  if (!form.matches('[data-search-form], #rhead-form')) return;
  event.preventDefault();
  clearTimeout(typingTimer);
  const query = new FormData(form).get('q')?.toString().trim() ?? '';
  if (!query) return;
  const route = parseRoute(location.hash);
  const hash = searchHash(query, route.name === 'search' ? route.tab : 'all');
  if (location.hash === hash) void render();
  else location.hash = hash;
});

document.addEventListener('input', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (input.id === 'logo-edit') {
    paintLogo(input.value);
    return;
  }
  if (input.matches('[data-query-input]')) onType(input);
});

document.addEventListener('keydown', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.id !== 'logo-edit') return;
  if (event.key === 'Enter') {
    event.preventDefault();
    saveLogo(input);
    input.blur();
  } else if (event.key === 'Escape') {
    input.value = settings.logo;
    paintLogo();
    input.blur();
  }
});

document.addEventListener('focusout', event => {
  const input = event.target;
  if (input instanceof HTMLInputElement && input.id === 'logo-edit') {
    saveLogo(input);
  }
});

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  const copyButton = target?.closest<HTMLButtonElement>('[data-copy]');
  if (copyButton) {
    void copyFromButton(copyButton);
    return;
  }
  const handoffButton = target?.closest<HTMLElement>('[data-handoff]');
  if (handoffButton) {
    const prompt = buildPrompt(currentQuery(), brainLocation());
    const chosen = handoffs(prompt).find(
      h => h.id === handoffButton.dataset.handoff,
    );
    if (chosen) handleHandoff(chosen, prompt);
    return;
  }
  if (target?.closest('[data-random]')) {
    const docs = state.index?.docs ?? [];
    const doc = docs[Math.floor(Math.random() * docs.length)];
    if (doc) location.hash = noteHash(doc.path);
    return;
  }
  const instantToggle = target?.closest<HTMLElement>('[data-instant]');
  if (instantToggle) {
    settings.instant = instantToggle.dataset.instant === 'on';
    saveSettings(storage, settings);
    updateStatus();
    void render();
    return;
  }
  if (target?.closest('[data-back]')) {
    event.preventDefault();
    if (history.length > 1) history.back();
    else location.hash = '#/';
  }
});

document.body.addEventListener('animationend', event => {
  if (event.animationName === 'barrel-roll') {
    document.body.classList.remove('barrel-roll');
  }
});

window.addEventListener('hashchange', () => {
  void render();
});

paintLogo();
updateStatus();
void render();
