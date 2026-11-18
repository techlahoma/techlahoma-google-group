#!/usr/bin/env bun
/**
 * Keep the README's setup section identical to SETUP.md.
 *   bun run readme:apply   rewrite the README section
 *   bun run readme:check   read-only; exit 1 when out of sync
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- SETUP:START -->';
const END = '<!-- SETUP:END -->';

export function syncedReadme(readme: string, setup: string): string {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < start)
    throw new Error('README is missing the SETUP markers');
  return `${readme.slice(0, start + START.length)}\n${setup.trim()}\n${readme.slice(end)}`;
}

if (import.meta.main) {
  const readmePath = join(APP_DIR, 'README.md');
  const readme = readFileSync(readmePath, 'utf8');
  const next = syncedReadme(
    readme,
    readFileSync(join(APP_DIR, 'SETUP.md'), 'utf8'),
  );
  if (process.argv.includes('--check')) {
    if (next !== readme) {
      console.error(
        'README setup section is out of date. Run: bun run readme:apply',
      );
      process.exitCode = 1;
    } else console.log('README setup section matches SETUP.md.');
  } else {
    writeFileSync(readmePath, next);
    console.log('README setup section updated from SETUP.md.');
  }
}
