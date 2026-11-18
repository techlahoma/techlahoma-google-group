import setupMarkdown from '../SETUP.md?raw';
import {
  KNOWN_FOLDERS,
  isAppLink,
  legacyHashToPath,
  noteUrl,
  parseLocation,
  searchUrl,
  type Route,
} from './app';
import {startEmbedder, type Embedder} from './embedder';
import {
  faviconDataUri,
  faviconLetter,
  firstName,
  folderOf,
  type EasterEgg,
} from './lib/brand';
import {buildPrompt, handoffs, type Handoff} from './lib/handoff';
import {
  cosineScores,
  decodeVectors,
  hybridSearch,
  relatedSearch,
  type BrainIndex,
  type SearchOutcome,
  type VectorIndex,
} from './lib/search';
import {
  brainLocation,
  gbarHtml,
  handoffBox,
  logoLetters,
  logoText,
  pageTitle,
  resultsFrameHtml,
  resultsParts,
  skeletonHtml,
  staticViewHtml,
  type RenderContext,
} from './render';
import {
  browserStorage,
  cleanLogo,
  loadSettings,
  saveSettings,
  type Settings,
} from './settings';
import './style.css';

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

// ---------- Old hash links redirect to real paths ----------

// Read flags (?semantic=off, ?name=, ?logo=) before any redirect drops them.
const urlParams = new URLSearchParams(location.search);
const legacy = legacyHashToPath(location.hash);
if (legacy) history.replaceState(null, '', legacy);

// ---------- Settings (?name= and ?logo= seed them) ----------

const storage = browserStorage();
const settings: Settings = loadSettings(storage);
const nameParam = urlParams.get('name');
const logoParam = urlParams.get('logo');
if (nameParam !== null) {
  // An explicit ?name= shows that person's pun, replacing an older rename.
  settings.name = firstName(nameParam);
  settings.logo = '';
}
if (logoParam !== null) settings.logo = cleanLogo(logoParam);
if (nameParam !== null || logoParam !== null) saveSettings(storage, settings);

// ---------- Loading: start everything the moment the page opens ----------

type ModelState = 'loading' | 'ready' | 'failed' | 'absent' | 'off';

interface State {
  index: BrainIndex | null;
  indexError: string | null;
  local: boolean;
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
  local: false,
  vectors: null,
  vectorMeta: null,
  embedder: null,
  // ?semantic=off keeps search keyword-only (slow Wi-Fi, tests).
  modelState: urlParams.get('semantic') === 'off' ? 'off' : 'loading',
  searchSeq: 0,
  lastRolled: '',
};

function ctx(): RenderContext {
  return {
    index: state.index,
    settings,
    ownerName: settings.name || firstName(state.index?.owner ?? ''),
    setupMarkdown,
    indexMissing: state.indexError !== null,
  };
}

function folders(): string[] {
  const found = (state.index?.docs ?? []).map(doc => folderOf(doc.path));
  return [...new Set([...KNOWN_FOLDERS, ...found.filter(Boolean)])];
}

function currentRoute(): Route {
  return parseLocation(location.pathname, location.search, folders());
}

/**
 * Fetch JSON only when the server really has it: `/local/...` answers 204 in
 * the dev server when there is no personal index, and Firebase answers with
 * the HTML page, so neither counts.
 */
async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {cache: 'no-cache'});
    const type = response.headers.get('content-type') ?? '';
    if (response.status !== 200 || !type.includes('json')) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/** Your own brain (indexed with BRAIN_DIR) first, then the bundled example. */
async function loadData(): Promise<void> {
  let index = await fetchJson<BrainIndex>('/local/brain-index.json');
  let vectorsUrl = '/local/brain-vectors.json';
  state.local = index !== null;
  if (!index) {
    index = await fetchJson<BrainIndex>('/brain-index.json');
    vectorsUrl = '/brain-vectors.json';
  }
  if (!index) {
    state.indexError = 'missing';
    if (state.modelState !== 'off') state.modelState = 'absent';
    return;
  }
  state.index = index;
  const meta = await fetchJson<VectorIndex>(vectorsUrl);
  if (meta?.encoding === 'int8' && meta.contentHash === index.contentHash) {
    state.vectorMeta = meta;
    state.vectors = decodeVectors(meta.scales, meta.vectors, meta.dims);
  } else if (state.modelState !== 'off') {
    state.modelState = 'absent';
  }
}

/** Index and vectors are in (or known missing). */
const dataLoaded = loadData();

let isSettled = false;
/** Resolves once the data is in and the model is ready or ruled out. */
const settled = dataLoaded.then(async () => {
  updateStatus();
  paintChrome();
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
  onSettled();
});

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
  const notes = state.index
    ? `${state.index.docs.length} notes${state.local ? ' (your brain)' : ''} · `
    : '';
  const instant = settings.instant
    ? isSettled
      ? ' · Instant: on'
      : ' · Instant: starts when ready'
    : ' · Instant: off';
  engineStatus.textContent = `${notes}${words[state.modelState]}${instant}`;
}

// ---------- Logo, favicon, top bar ----------

/** The tab icon follows the logo's first letter ("Valerie" -> "v"). */
function paintFavicon(logo: string): void {
  const link = document.querySelector<HTMLLinkElement>('#favicon');
  if (!link) return;
  const href =
    faviconLetter(logo) === 'g' ? '/favicon.svg' : faviconDataUri(logo);
  if (link.getAttribute('href') !== href) link.href = href;
}

function paintLogo(text = logoText(ctx())): void {
  for (const node of document.querySelectorAll<HTMLElement>('[data-logo]')) {
    node.innerHTML = logoLetters(text);
  }
  const label = document.querySelector<HTMLElement>('#logo-label');
  if (label) label.textContent = text;
  const saved = logoText(ctx());
  for (const button of document.querySelectorAll<HTMLInputElement>(
    '[data-logo-button]',
  )) {
    button.value = `${saved} Search`;
  }
  paintFavicon(saved);
  document.title = pageTitle(ctx(), currentRoute());
}

/** Top bar, logo and title: everything outside the main view. */
function paintChrome(): void {
  const route = currentRoute();
  document.body.dataset.route = route.name;
  gbarFolders.innerHTML = gbarHtml(ctx(), route);
  const edit = document.querySelector<HTMLInputElement>('#logo-edit');
  if (edit && document.activeElement !== edit) edit.value = logoText(ctx());
  paintLogo();
}

function saveLogo(input: HTMLInputElement): void {
  const text = cleanLogo(input.value);
  const fallback = logoText({...ctx(), settings: {...settings, logo: ''}});
  settings.logo = text === fallback ? '' : text;
  input.value = logoText(ctx());
  saveSettings(storage, settings);
  paintLogo();
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
    // Plain-HTTP pages have no async clipboard API; this legacy call still works.
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

// ---------- Search ----------

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

function searchOutcome(
  query: string,
  tab: string,
  semantic: number[] | null,
): SearchOutcome {
  const index = state.index as BrainIndex;
  const outcome = query.startsWith('related:')
    ? state.vectors && state.vectorMeta
      ? relatedSearch(
          index,
          state.vectors,
          state.vectorMeta.dims,
          query.slice('related:'.length),
          200,
        )
      : ({results: [], strength: 'none', mode: 'keyword'} as SearchOutcome)
    : hybridSearch(index, query, semantic, 200);
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

function showOutcome(
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
  const parts = resultsParts(
    ctx(),
    query,
    tab,
    outcome,
    seconds,
    statusSuffix(),
    reducedMotion(),
  );
  stats.innerHTML = parts.stats;
  body.innerHTML = parts.center;
  rhs.innerHTML = parts.rhs;
  page.dataset.strength = outcome.strength;
  page.dataset.loading = 'false';
  applyEgg(parts.egg, query);
}

/**
 * Show results for a query. Before the brain and model are ready this shows a
 * skeleton, then swaps in real results the moment they are.
 */
async function runSearch(query: string, tab: string): Promise<void> {
  const seq = ++state.searchSeq;
  if (!isSettled) {
    const body = document.querySelector<HTMLElement>('#results-body');
    const stats = document.querySelector<HTMLElement>('#result-stats');
    const page = document.querySelector<HTMLElement>('#results-page');
    if (body && !body.querySelector('.skeleton'))
      body.innerHTML = skeletonHtml();
    if (stats) stats.textContent = 'Warming up your brain…';
    if (page) page.dataset.loading = 'true';
    await Promise.race([
      settled,
      dataLoaded.then(
        () =>
          new Promise<void>(resolve => {
            setTimeout(resolve, SKELETON_MAX_MS);
          }),
      ),
    ]);
    if (seq !== state.searchSeq) return;
  }
  await dataLoaded;
  if (seq !== state.searchSeq) return;
  if (!state.index) {
    const body = document.querySelector<HTMLElement>('#results-body');
    if (body) {
      body.innerHTML = `<p class="notice">The search index is missing. Run <code>bun run --cwd apps/brain-search index</code>, then reload.</p>${handoffBox(ctx(), query, false)}`;
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
    !query.startsWith('related:')
  ) {
    try {
      const vector = await state.embedder.embed(query);
      if (seq !== state.searchSeq) return;
      semantic = cosineScores(state.vectors, state.vectorMeta.dims, vector);
    } catch (error) {
      console.warn('Query embedding failed; using keyword search.', error);
    }
  }
  showOutcome(
    query,
    tab,
    searchOutcome(query, tab, semantic),
    (performance.now() - started) / 1000,
  );
  // Timed out of the skeleton with the model still loading: rerank later.
  if (state.modelState === 'loading') {
    void settled.then(() => {
      const route = currentRoute();
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

// ---------- Router ----------

/** Path of the page being rendered, to drop renders a newer one replaced. */
let routePath = location.pathname;
/** True once this tab has pushed an in-app history entry (so Back stays in the app). */
let pushedInApp = false;

function focusAtEnd(input: HTMLInputElement): void {
  input.focus();
  const end = input.value.length;
  input.setSelectionRange(end, end);
}

async function render(): Promise<void> {
  const route = currentRoute();
  document.body.classList.remove('askew');
  paintChrome();
  if (route.name === 'search') {
    if (document.activeElement !== headerQuery) headerQuery.value = route.query;
    if (!route.query) {
      view.innerHTML = staticViewHtml(ctx(), route);
      return;
    }
    view.innerHTML = resultsFrameHtml(ctx(), route.query, route.tab);
    await runSearch(route.query, route.tab);
    return;
  }
  // Folder and note pages need the index; render now, then again once loaded.
  view.innerHTML = staticViewHtml(ctx(), route);
  if (route.name === 'home') {
    element<HTMLInputElement>('#home-query').focus();
  }
  const needsIndex =
    route.name === 'folder' ||
    route.name === 'note' ||
    route.name === 'notFound';
  if (!state.index && needsIndex) {
    await dataLoaded;
    const now = currentRoute();
    if (location.pathname === routePath) {
      paintChrome();
      view.innerHTML = staticViewHtml(ctx(), now);
    }
  }
  if (route.name === 'note') view.focus();
}

function navigate(url: string, mode: 'push' | 'replace' = 'push'): void {
  const target = new URL(url, location.origin);
  const same =
    target.pathname + target.search === location.pathname + location.search;
  if (mode === 'replace' || same) history.replaceState(null, '', target);
  else {
    history.pushState(null, '', target);
    pushedInApp = true;
  }
  routePath = location.pathname;
  window.scrollTo(0, 0);
  void render();
}

function instantActive(): boolean {
  return settings.instant && isSettled;
}

/** Instant mode: one history entry per search session, replaced per keystroke. */
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
  const route = currentRoute();
  if (!query) {
    if (route.name === 'search') {
      history.replaceState(null, '', '/');
      routePath = '/';
      void render().then(() => {
        const home = document.querySelector<HTMLInputElement>('#home-query');
        if (home) focusAtEnd(home);
      });
    }
    return;
  }
  const tab = route.name === 'search' ? route.tab : 'all';
  const url = searchUrl(query, tab);
  if (route.name !== 'search' || !document.querySelector('#results-body')) {
    // First keystroke elsewhere flips to the results page (a new history entry).
    headerQuery.value = query;
    history.pushState(null, '', url);
    pushedInApp = true;
    routePath = location.pathname;
    void render();
    focusAtEnd(headerQuery);
    return;
  }
  history.replaceState(null, '', url);
  paintChrome();
  for (const link of view.querySelectorAll<HTMLAnchorElement>('[data-tab]')) {
    link.href = searchUrl(query, link.dataset.tab ?? 'all');
  }
  void runSearch(query, tab);
}

/** If someone typed while loading, show their results now. */
function onSettled(): void {
  const route = currentRoute();
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
  settings.name = firstName(element<HTMLInputElement>('#setting-name').value);
  settings.logo = cleanLogo(element<HTMLInputElement>('#setting-logo').value);
  settings.location =
    element<HTMLInputElement>('#setting-location').value.trim();
  settings.showScores = element<HTMLInputElement>('#setting-scores').checked;
  saveSettings(storage, settings);
  updateStatus();
  paintLogo();
  showToast('Your preferences have been saved.');
}

function goBack(fallback: string): void {
  if (pushedInApp) history.back();
  else navigate(fallback);
}

document.addEventListener('submit', event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.id === 'settings-form') {
    event.preventDefault();
    saveSettingsForm(form);
    navigate('/');
    return;
  }
  if (!form.matches('[data-search-form], #rhead-form')) return;
  event.preventDefault();
  clearTimeout(typingTimer);
  const query = new FormData(form).get('q')?.toString().trim() ?? '';
  if (!query) return;
  const route = currentRoute();
  const url = searchUrl(query, route.name === 'search' ? route.tab : 'all');
  if (location.pathname + location.search === url) void render();
  else navigate(url);
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
    input.value = logoText(ctx());
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
    const route = currentRoute();
    const prompt = buildPrompt(
      route.name === 'search' ? route.query : '',
      brainLocation(ctx()),
    );
    const chosen = handoffs(prompt).find(
      h => h.id === handoffButton.dataset.handoff,
    );
    if (chosen) handleHandoff(chosen, prompt);
    return;
  }
  if (target?.closest('[data-random]')) {
    const docs = state.index?.docs ?? [];
    const doc = docs[Math.floor(Math.random() * docs.length)];
    if (doc) navigate(noteUrl(doc.path));
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
  const back = target?.closest<HTMLAnchorElement>('[data-back]');
  if (back) {
    event.preventDefault();
    goBack(back.getAttribute('href') ?? '/');
    return;
  }
  // Same-origin app links render in place.
  const link = target?.closest<HTMLAnchorElement>('a[href]');
  if (
    link &&
    event instanceof MouseEvent &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !link.target &&
    !link.hasAttribute('download')
  ) {
    const url = new URL(link.href, location.href);
    const hashOnly =
      url.pathname === location.pathname &&
      url.search === location.search &&
      url.hash !== '';
    if (!hashOnly && isAppLink(url, location.origin)) {
      event.preventDefault();
      navigate(url.pathname + url.search);
    }
  }
});

document.body.addEventListener('animationend', event => {
  if (event.animationName === 'barrel-roll') {
    document.body.classList.remove('barrel-roll');
  }
});

window.addEventListener('popstate', () => {
  routePath = location.pathname;
  void render();
});

updateStatus();
void render();
