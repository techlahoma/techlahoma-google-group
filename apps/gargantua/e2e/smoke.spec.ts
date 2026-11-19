import {expect, type Page} from 'playwright/test';
import {join} from 'node:path';

interface GargantuaHarness {
  stateManager: {
    getState(): {
      camera: {distance: number; inclination: number};
      lensing: number;
      mode: string;
      paused: boolean;
    };
  };
}

declare global {
  interface Window {
    __GARGANTUA__?: GargantuaHarness;
  }
}

export async function runSmokeTest({
  page,
  baseURL,
  viewport,
}: {
  page: Page;
  baseURL: string;
  viewport: 'desktop' | 'phone';
}): Promise<void> {
  await page.goto(baseURL, {waitUntil: 'networkidle'});

  await expect(page.locator('h1')).toHaveText('GARGANTUA');
  await expect(page.locator('#canvas-webgl')).toBeVisible();
  await expect(page.locator('#btn-hold-lensing')).toBeVisible();

  const initialState = await page.evaluate(() =>
    window.__GARGANTUA__?.stateManager.getState(),
  );
  expect(initialState).toBeDefined();
  expect(initialState?.camera.distance).toBeGreaterThanOrEqual(8);
  expect(initialState?.lensing).toBe(1);

  await page.locator('#mode-physical').click();
  await expect
    .poll(() =>
      page.evaluate(() => window.__GARGANTUA__?.stateManager.getState().mode),
    )
    .toBe('physical');

  await page.locator('#btn-toggle-lensing').click();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__GARGANTUA__?.stateManager.getState().lensing,
      ),
    )
    .toBeLessThan(1);

  await page.locator('#btn-pause').click();
  await expect
    .poll(() =>
      page.evaluate(() => window.__GARGANTUA__?.stateManager.getState().paused),
    )
    .toBe(true);

  const viewportMetrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewportMetrics.scrollWidth).toBeLessThanOrEqual(
    viewportMetrics.clientWidth,
  );

  await page.goto(
    `${baseURL}?distance=not-a-number&inclination=999&lensing=-2`,
    {waitUntil: 'networkidle'},
  );
  const boundedState = await page.evaluate(() =>
    window.__GARGANTUA__?.stateManager.getState(),
  );
  expect(boundedState).toBeDefined();
  expect(Number.isFinite(boundedState?.camera.distance)).toBe(true);
  expect(boundedState?.camera.inclination).toBeLessThan(Math.PI / 2);
  expect(boundedState?.lensing).toBe(0);

  const resultDir = join(process.cwd(), 'apps', 'gargantua', 'test-results');
  await page.screenshot({
    path: join(resultDir, `smoke-${viewport}.png`),
    fullPage: false,
  });
}

export default runSmokeTest;
