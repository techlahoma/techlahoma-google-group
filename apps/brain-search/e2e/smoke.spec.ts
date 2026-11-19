import assert from 'node:assert/strict';
import {join} from 'node:path';
import type {Page} from 'playwright';

/**
 * Brain Search (2010 throwback) smoke test for
 * `bun run app:browser:verify --app brain-search`.
 * Adds semantic=off so the run never downloads the embedding model; the
 * meaning path is covered by unit tests and manual rehearsal.
 */
export async function runSmokeTest({
  page,
  baseURL,
  viewport,
}: {
  page: Page;
  baseURL: string;
  viewport: 'desktop' | 'phone';
}): Promise<void> {
  const origin = new URL(baseURL).origin;
  await page
    .context()
    .grantPermissions(['clipboard-read', 'clipboard-write'], {origin})
    .catch(() => undefined);
  const at = (path: string, extra = '') =>
    `${origin}${path}${path.includes('?') ? '&' : '?'}semantic=off${extra}`;
  const fits = async (label: string) =>
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      true,
      `${label} must fit the ${viewport} viewport`,
    );
  const ready = () =>
    page.waitForFunction(() =>
      /Instant: (on|off)/.test(
        document.querySelector('#engine-status')?.textContent ?? '',
      ),
    );
  const label = () => page.locator('#logo-label').textContent();

  // Skeleton: while the index is slow, a search shows grey bars, then results.
  await page.route('**/brain-index.json', async route => {
    await new Promise(resolve => {
      setTimeout(resolve, 1500);
    });
    await route.continue();
  });
  await page.goto(at(`/search?q=${encodeURIComponent('GDG Tulsa')}`));
  await page.locator('.skeleton').waitFor();
  await page.locator('#results .g').first().waitFor();
  assert.equal(await page.locator('.skeleton').count(), 0);
  await page.unroute('**/brain-index.json');

  // Home: the default logo is a pun on the owner's name (Brainoogle when none).
  await page.goto(at('/'), {waitUntil: 'networkidle'});
  await page.evaluate(() => localStorage.clear());
  await page.goto(at('/'), {waitUntil: 'networkidle'});
  await ready();
  assert.match((await label()) ?? '', /oogle$/);
  assert.equal(await page.title(), await label());
  assert.match(
    await page.locator('[data-logo-button]').inputValue(),
    /oogle Search$/,
  );
  assert.ok(
    await page.getByRole('button', {name: "I'm Feeling Lucky"}).isVisible(),
  );
  assert.match(await page.locator('.footer').innerText(), /© 2010/);
  assert.ok((await page.locator('#gbar-folders a').count()) >= 7);
  // Setup and Search settings stay visible on phones (no sideways scroll).
  assert.ok(
    await page.locator('.gbar-right a', {hasText: 'Setup'}).isVisible(),
  );
  assert.ok(
    await page
      .locator('.gbar-right a', {hasText: 'Search settings'})
      .isVisible(),
  );
  await fits('Home');

  // ?name= sets the pun; a click-to-rename wins over it and survives reloads.
  await page.goto(at('/', '&name=katie'), {waitUntil: 'networkidle'});
  assert.equal(await label(), 'Katoogle');
  const logo = page.locator('#logo-edit');
  await logo.click();
  await logo.fill('Valerie');
  await logo.press('Enter');
  assert.equal(await label(), 'Valerie');
  assert.equal(
    await page.locator('[data-logo-button]').inputValue(),
    'Valerie Search',
  );
  await logo.click();
  await logo.fill('Nope');
  await logo.press('Escape');
  assert.equal(await label(), 'Valerie');
  await page.goto(at('/'), {waitUntil: 'networkidle'});
  assert.equal(await label(), 'Valerie');
  await ready();

  // Instant search: the first keystroke flips to /search with a real URL.
  await page.locator('#home-query').pressSequentially('GDG Tulsa organizer', {
    delay: 20,
  });
  await page.locator('#results .g').first().waitFor();
  await page.waitForFunction(() => location.pathname === '/search');
  assert.equal(
    new URL(page.url()).searchParams.get('q'),
    'GDG Tulsa organizer',
  );
  assert.equal(
    await page.locator('#rhead-query').inputValue(),
    'GDG Tulsa organizer',
  );
  assert.match(
    await page.locator('#result-stats').innerText(),
    /About \d+ results? \(\d+\.\d\d seconds\)/,
  );
  assert.ok((await page.locator('#results .s b').count()) > 0);
  assert.match(
    await page.locator('#results cite').first().innerText(),
    /^brain\/.+\.md$/,
  );
  await fits('Results');

  // Sidebar filters by folder (?in=people) without a page load.
  await page.locator('.sidebar [data-tab="people"]').click();
  await page.waitForFunction(
    () => new URLSearchParams(location.search).get('in') === 'people',
  );
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('#results cite')).every(node =>
      node.textContent?.startsWith('brain/people/'),
    ),
  );

  // Note page at /n/<folder>/<slug>; Back returns to the results.
  await page.locator('#results .g h3 a').first().click();
  await page.locator('.reader h1').waitFor();
  assert.match(new URL(page.url()).pathname, /^\/n\/people\//);
  await page.goBack();
  await page.waitForFunction(() => location.pathname === '/search');
  await page.locator('#results .g').first().waitFor();

  // "Similar" runs a related: search.
  await page.locator('#results .fl', {hasText: 'Similar'}).first().click();
  await page.waitForFunction(() =>
    (new URLSearchParams(location.search).get('q') ?? '').startsWith(
      'related:',
    ),
  );

  // Pre-rendered pages work as direct loads: folder page, note page, setup.
  await page.goto(at('/orgs'), {waitUntil: 'networkidle'});
  assert.match(await page.locator('.folder-title').innerText(), /Orgs/);
  assert.ok((await page.locator('#results .g').count()) > 0);
  await page.goto(at('/n/orgs/gdg-tulsa'), {waitUntil: 'networkidle'});
  assert.match(await page.locator('.reader h1').innerText(), /GDG Tulsa/);
  await page.goto(at('/setup'), {waitUntil: 'networkidle'});
  assert.match(
    await page.locator('.setup-page h1').innerText(),
    /Set up your brain/,
  );
  await page.locator('.setup-page .copy-button').first().click();
  await page.waitForFunction(() =>
    document
      .querySelector('.setup-page .copy-button')
      ?.textContent?.includes('Copied'),
  );
  await fits('Setup');

  // Old hash links redirect; unknown paths show Not Found with a search box.
  await page.goto(`${origin}/?semantic=off#/settings`, {
    waitUntil: 'networkidle',
  });
  await page.waitForFunction(() => location.pathname === '/settings');
  await page.goto(at('/no-such-page'), {waitUntil: 'networkidle'});
  assert.match(await page.locator('.not-found h1').innerText(), /Not Found/);
  assert.equal(await page.locator('#notfound-query').count(), 1);

  // Empty path: AI links in the right-hand column.
  const miss = 'quantum chromodynamics lattice';
  await page.goto(at(`/search?q=${encodeURIComponent(miss)}`), {
    waitUntil: 'networkidle',
  });
  await page.locator('#rhs #handoff').waitFor();
  assert.deepEqual(
    (await page.locator('[data-handoff]').allInnerTexts()).map(t => t.trim()),
    ['Antigravity', 'Gemini', 'ChatGPT', 'Claude'],
  );
  assert.match(
    await page.locator('.handoff-explain').innerText(),
    /copies a ready-made prompt/,
  );
  await page.locator('[data-handoff="antigravity"]').click();
  await page.locator('#toast:not([hidden])').waitFor();
  await fits('Handoff');

  // Search settings: classic mode waits for Enter.
  await page.goto(at('/settings'), {waitUntil: 'networkidle'});
  await page.getByLabel(/Do not use Instant/).check();
  await page.locator('#setting-scores').check();
  await page.getByRole('button', {name: 'Save'}).click();
  await page.waitForFunction(() => location.pathname === '/');
  await page.goto(at(`/search?q=${encodeURIComponent(miss)}`), {
    waitUntil: 'networkidle',
  });
  await ready();
  await page.locator('#rhead-query').fill('women in tech');
  await page.waitForTimeout(400);
  assert.match(await page.locator('#no-match').innerText(), /quantum/);
  await page.locator('#rhead-query').press('Enter');
  await page.locator('#results .g').first().waitFor();
  assert.ok(await page.locator('#results .why').first().isVisible());

  // Easter egg.
  await page.locator('#rhead-query').fill('askew');
  await page.locator('#rhead-query').press('Enter');
  await page.waitForFunction(() => document.body.classList.contains('askew'));

  await page.goto(at(`/search?q=${encodeURIComponent('women in tech')}`), {
    waitUntil: 'networkidle',
  });
  await page.locator('#results .g').first().waitFor();
  await page.screenshot({
    path: join(
      process.cwd(),
      'apps',
      'brain-search',
      'test-results',
      `smoke-${viewport}.png`,
    ),
    fullPage: true,
  });
  await page.evaluate(() => localStorage.clear());
}

export default runSmokeTest;
