import {describe, expect, test} from 'bun:test';
import {readFileSync, readdirSync} from 'node:fs';
import {dirname, join, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  contentHash,
  isNoteFile,
  lintBrain,
  type BrainFile,
} from '../src/lib/build';
import type {BrainIndex, VectorIndex} from '../src/lib/search';
import {syncedReadme} from './sync-readme';
import {faviconSvg} from '../src/lib/brand';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const BRAIN = join(APP, 'brain');

function brainFiles(): BrainFile[] {
  const files: BrainFile[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) {
        files.push({
          path: relative(BRAIN, full).split(sep).join('/'),
          content: readFileSync(full, 'utf8'),
        });
      }
    }
  };
  walk(BRAIN);
  return files;
}

describe('example brain', () => {
  const files = brainFiles();

  test('every note has frontmatter, tags, sources and an index link', () => {
    expect(lintBrain(files)).toEqual([]);
  });

  test('every note links resolve to existing notes', () => {
    const paths = new Set(files.map(f => f.path));
    const broken: string[] = [];
    for (const file of files.filter(
      f => isNoteFile(f.path) || f.path === 'index.md',
    )) {
      for (const [, href] of file.content.matchAll(/\]\(([^)\s]+\.md)\)/g)) {
        if (!href || /^https?:/.test(href)) continue;
        const parts = file.path.split('/').slice(0, -1);
        for (const part of href.split('/')) {
          if (part === '..') parts.pop();
          else if (part !== '.') parts.push(part);
        }
        if (!paths.has(parts.join('/'))) broken.push(`${file.path} -> ${href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test('sample notes are labeled fictional', () => {
    for (const file of files.filter(f => f.path.startsWith('meetings/'))) {
      expect(file.content).toContain('sample: true');
    }
  });

  test('committed index matches the brain (run `bun run index` after editing notes)', async () => {
    const index = JSON.parse(
      readFileSync(join(APP, 'public/brain-index.json'), 'utf8'),
    ) as BrainIndex;
    const vectors = JSON.parse(
      readFileSync(join(APP, 'public/brain-vectors.json'), 'utf8'),
    ) as VectorIndex;
    const hash = await contentHash(
      files.filter(f => isNoteFile(f.path)),
      index.model,
    );
    expect(index.contentHash).toBe(hash);
    expect(vectors.contentHash).toBe(hash);
    expect(vectors.encoding).toBe('int8');
  });
});

test('README setup section matches SETUP.md (run `bun run readme:apply`)', () => {
  const readme = readFileSync(join(APP, 'README.md'), 'utf8');
  const setup = readFileSync(join(APP, 'SETUP.md'), 'utf8');
  expect(syncedReadme(readme, setup)).toBe(readme);
});

test('public/favicon.svg matches faviconSvg("g") (run `bun scripts/write-favicon.ts`)', () => {
  const file = readFileSync(join(APP, 'public/favicon.svg'), 'utf8');
  expect(file).toBe(`${faviconSvg('g')}\n`);
});
