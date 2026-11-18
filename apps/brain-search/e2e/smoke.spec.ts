import assert from 'node:assert/strict';
import {join} from 'node:path';
import type {Page} from 'playwright';

/**
 * Brain Search (2010 throwback) smoke test for
 * `bun run app:browser:verify --app brain-search`.
 * Uses ?semantic=off so the run never downloads the embedding model; the
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
  const app = `${baseURL}?semantic=off`;
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

  // Skeleton: while the index is slow, a submitted search shows grey bars.
  await page.route('**/brain-index.json', async route => {
    await new Promise(resolve => {
      setTimeout(resolve, 1500);
    });
    await route.continue();
  });
  await page.goto(`${app}#/search?q=${encodeURIComponent('GDG Tulsa')}`);
  await page.locator('.skeleton').waitFor();
  await page.locator('#results .g').first().waitFor();
  assert.equal(await page.locator('.skeleton').count(), 0);
  await page.unroute('**/brain-index.json');

  // Home: classic logo text, two buttons, 2010 footer.
  await page.goto(app, {waitUntil: 'networkidle'});
  await page.evaluate(() => localStorage.clear());
  await page.goto(app, {waitUntil: 'networkidle'});
  await ready();
  assert.equal(await page.locator('#logo-label').textContent(), 'Google');
  assert.equal(await page.title(), 'Google');
  assert.equal(
    await page.locator('[data-logo-button]').inputValue(),
    'Google Search',
  );
  assert.ok(
    await page.getByRole('button', {name: "I'm Feeling Lucky"}).isVisible(),
  );
  assert.match(await page.locator('.footer').innerText(), /© 2010/);
  assert.match(
    await page.locator('.footer').innerText(),
    /Not affiliated with Google/,
  );
  assert.ok((await page.locator('#gbar-folders a').count()) >= 7);
  await fits('Home');

  // The logo is editable text; Enter saves, and it survives a reload.
  const logo = page.locator('#logo-edit');
  await logo.click();
  await logo.fill('Valerie');
  await logo.press('Enter');
  assert.equal(await page.locator('#logo-label').textContent(), 'Valerie');
  assert.equal(
    await page.locator('[data-logo-button]').inputValue(),
    'Valerie Search',
  );
  await logo.click();
  await logo.fill('Nope');
  await logo.press('Escape');
  assert.equal(await page.locator('#logo-label').textContent(), 'Valerie');
  await page.reload({waitUntil: 'networkidle'});
  assert.equal(await page.locator('#logo-label').textContent(), 'Valerie');
  await page.goto(`${app}&name=ada`, {waitUntil: 'networkidle'});
  assert.equal(await page.locator('#logo-label').textContent(), 'Adoogle');
  await ready();

  // Instant search: the first keystroke flips to the results page.
  await page.locator('#home-query').pressSequentially('GDG Tulsa organizer', {
    delay: 20,
  });
  await page.locator('#results .g').first().waitFor();
  assert.equal(await page.locator('body').getAttribute('data-route'), 'search');
  assert.equal(
    await page.locator('#rhead-query').inputValue(),
    'GDG Tulsa organizer',
  );
  assert.match(
    await page.locator('#result-stats').innerText(),
    /About \d+ results? \(\d+\.\d\d seconds\)/,
  );
  assert.match(
    await page.locator('#results .g h3').first().innerText(),
    /GDG Tulsa|Zain Khan/,
  );
  assert.ok((await page.locator('#results .s b').count()) > 0);
  assert.match(
    await page.locator('#results cite').first().innerText(),
    /^brain\/.+\.md$/,
  );
  assert.equal(await page.locator('#results .why').count(), 0);
  await fits('Results');

  // Sidebar filters by folder; "Similar" finds related notes.
  await page.locator('.sidebar [data-tab="people"]').click();
  await page.waitForFunction(() => location.hash.includes('tab=people'));
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('#results cite')).every(node =>
      node.textContent?.startsWith('brain/people/'),
    ),
  );
  await page.locator('.sidebar [data-tab="all"]').click();
  await page.locator('#results .g').first().waitFor();
  await page.locator('#results .fl', {hasText: 'Similar'}).first().click();
  await page.waitForFunction(() => location.hash.includes('related%3A'));
  await page.locator('#results .g').first().waitFor();

  // Reader view.
  await page.locator('#results .g h3 a').first().click();
  await page.locator('.reader h1').waitFor();

  // Empty path: AI links in the right-hand column.
  const miss = 'quantum chromodynamics lattice';
  await page.goto(`${app}#/search?q=${encodeURIComponent(miss)}`, {
    waitUntil: 'networkidle',
  });
  await page.locator('#rhs #handoff').waitFor();
  assert.match(await page.locator('#no-match').innerText(), /did not match/);
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
  await page.goto(`${app}#/settings`, {waitUntil: 'networkidle'});
  await page.getByLabel(/Do not use Instant/).check();
  await page.locator('#setting-scores').check();
  await page.getByRole('button', {name: 'Save'}).click();
  await page.goto(`${app}#/search?q=${encodeURIComponent(miss)}`, {
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

  // Setup page.
  await page.goto(`${app}#/setup`, {waitUntil: 'networkidle'});
  assert.match(
    await page.locator('.setup-page h1').innerText(),
    /Set up your brain/,
  );
  await fits('Setup');

  await page.goto(`${app}#/search?q=${encodeURIComponent('women in tech')}`, {
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
