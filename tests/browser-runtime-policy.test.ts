import {describe, expect, test} from 'bun:test';
import {readFileSync} from 'node:fs';
import {browserLaunchOptions} from '../scripts/browser-runtime';

describe('maintained browser policy', () => {
  test('public-web proofs select installed Chrome with its sandbox enabled', () => {
    expect(browserLaunchOptions.channel).toBe('chrome');
    expect(browserLaunchOptions.chromiumSandbox).toBe(true);
    expect(browserLaunchOptions.headless).toBe(true);
  });
  test('browser setup checks Chrome without downloading a test browser', () => {
    const manifest = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    );
    expect(manifest.scripts['browser:install']).toBe(
      'bun scripts/check-installed-chrome.ts',
    );
    expect(manifest.scripts['browser:install']).not.toContain(
      'playwright install',
    );
  });
});
