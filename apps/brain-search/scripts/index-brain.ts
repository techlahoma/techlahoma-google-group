#!/usr/bin/env bun
/**
 * Build the search index for a brain folder.
 *
 *   bun run index                                # bundled example brain -> public/
 *   BRAIN_DIR="/abs/path/Brain" bun run index    # your brain -> .brain-local/
 *   bun run index -- --check                     # read-only: is the index current?
 *
 * A personal brain (any BRAIN_DIR other than the bundled one) is written to
 * .brain-local/, which is gitignored and never built into dist/. The dev and
 * preview servers serve it at /local/, and the page prefers it over the
 * bundled example. Each run ends by printing the exact re-index command.
 *
 * Environment:
 *   BRAIN_DIR       brain folder to read (default: <app>/brain)
 *   OUT_DIR         where to write the index (default: <app>/.brain-local for
 *                   a personal brain, <app>/public for the bundled example)
 *   BRAIN_LOCATION  how prompts should name the brain, e.g. "github.com/me/brain"
 *                   (default: BRAIN_DIR as given, or apps/brain-search/brain)
 *   BRAIN_OWNER     first name for the wordmark, e.g. Sam -> "Samoogle"
 *   BRAIN_MODEL     embedding model (default: Xenova/all-MiniLM-L6-v2)
 *   NO_EMBED=1      skip embeddings and write the keyword index only
 *   FORCE=1         rebuild even when the brain has not changed
 *
 * Output: OUT_DIR/brain-index.json (notes + BM25 index) and
 * OUT_DIR/brain-vectors.json (embeddings). Output is deterministic, so
 * re-running on an unchanged brain changes nothing.
 */
import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {mkdirSync, statSync} from 'node:fs';
import {dirname, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  buildIndex,
  contentHash,
  isNoteFile,
  lintBrain,
  type BrainFile,
} from '../src/lib/build';
import {
  encodeVectors,
  type BrainIndex,
  type VectorIndex,
} from '../src/lib/search';

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2';
const DTYPE = 'q8';

const brainDirInput = process.env.BRAIN_DIR?.trim();
const brainDir = brainDirInput
  ? resolve(brainDirInput.replace(/^~(?=$|\/)/, process.env.HOME ?? '~'))
  : join(APP_DIR, 'brain');
const bundled = brainDir === join(APP_DIR, 'brain');
const outDir = resolve(
  process.env.OUT_DIR?.trim() ||
    join(APP_DIR, bundled ? 'public' : '.brain-local'),
);
const locationInput = process.env.BRAIN_LOCATION?.trim() ?? '';
const brainLocation =
  locationInput || (bundled ? 'apps/brain-search/brain' : brainDir);
const owner = process.env.BRAIN_OWNER?.trim() ?? '';
const model = process.env.BRAIN_MODEL?.trim() || DEFAULT_MODEL;
const checkOnly = process.argv.includes('--check');
const indexPath = join(outDir, 'brain-index.json');
const vectorsPath = join(outDir, 'brain-vectors.json');

function readBrain(dir: string): BrainFile[] {
  const files: BrainFile[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, {withFileTypes: true})) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        files.push({
          path: relative(dir, full).split(sep).join('/'),
          content: readFileSync(full, 'utf8'),
        });
      }
    }
  };
  walk(dir);
  return files;
}

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

/** Write only when the bytes differ, so an unchanged brain leaves files untouched. */
function writeIfChanged(path: string, text: string): boolean {
  if (existsSync(path) && readFileSync(path, 'utf8') === text) return false;
  writeFileSync(path, text);
  return true;
}

async function embed(texts: string[]): Promise<Float32Array> {
  const {pipeline, env} = await import('@huggingface/transformers');
  env.cacheDir = join(APP_DIR, '.cache', 'models');
  const extractor = await pipeline('feature-extraction', model, {dtype: DTYPE});
  const parts: Float32Array[] = [];
  const batch = 16;
  for (let i = 0; i < texts.length; i += batch) {
    const output = await extractor(texts.slice(i, i + batch), {
      pooling: 'mean',
      normalize: true,
    });
    parts.push(output.data as Float32Array);
    process.stdout.write(
      `  embedded ${Math.min(i + batch, texts.length)}/${texts.length}\r`,
    );
  }
  process.stdout.write('\n');
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const all = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    all.set(part, offset);
    offset += part.length;
  }
  // Round to 6 decimals so tiny float noise across runs cannot change the file.
  for (let i = 0; i < all.length; i++)
    all[i] = Math.round((all[i] ?? 0) * 1e6) / 1e6;
  return all;
}

async function main(): Promise<void> {
  if (!existsSync(brainDir) || !statSync(brainDir).isDirectory()) {
    throw new Error(`Brain folder not found: ${brainDir}`);
  }
  const files = readBrain(brainDir);
  const notes = files.filter(file => isNoteFile(file.path));
  console.log(`Brain: ${brainDir} (${notes.length} notes)`);
  for (const problem of lintBrain(files)) console.warn(`  warn: ${problem}`);

  const hash = await contentHash(notes, model);
  const existing = readJson<BrainIndex>(indexPath);
  const existingVectors = readJson<VectorIndex>(vectorsPath);
  const indexCurrent =
    existing?.contentHash === hash &&
    existing.brainLocation === brainLocation &&
    existing.owner === owner;
  const vectorsCurrent = existingVectors?.contentHash === hash;

  if (checkOnly) {
    if (indexCurrent && vectorsCurrent) {
      console.log('Index is up to date.');
      return;
    }
    console.error(`Index is out of date. Run:\n  ${reindexCommand()}`);
    process.exitCode = 1;
    return;
  }

  const wantVectors = process.env.NO_EMBED !== '1';
  if (
    indexCurrent &&
    (vectorsCurrent || !wantVectors) &&
    process.env.FORCE !== '1'
  ) {
    console.log('Index is up to date; nothing to do.');
    return;
  }

  const {index, embedTexts} = await buildIndex(files, {
    brainLocation,
    model,
    owner,
  });
  mkdirSync(outDir, {recursive: true});
  const wrote = writeIfChanged(indexPath, `${JSON.stringify(index)}\n`);
  console.log(
    `${wrote ? 'Wrote' : 'Unchanged'} ${relative(process.cwd(), indexPath)}: ${index.docs.length} notes, ${index.chunks.length} chunks`,
  );

  if (!wantVectors) {
    if (existsSync(vectorsPath)) rmSync(vectorsPath);
    console.log(
      'NO_EMBED=1: keyword index only; the page will use keyword search.',
    );
    return;
  }
  if (vectorsCurrent && process.env.FORCE !== '1') {
    console.log('Embeddings are current; kept brain-vectors.json.');
    return;
  }
  try {
    console.log(
      `Embedding with ${model} (${DTYPE}); first run downloads the model to .cache/models ...`,
    );
    const vectors = await embed(embedTexts);
    const dims = embedTexts.length ? vectors.length / embedTexts.length : 0;
    const payload: VectorIndex = {
      version: index.version,
      contentHash: hash,
      model,
      dtype: DTYPE,
      dims,
      encoding: 'int8',
      ...encodeVectors(vectors, dims),
    };
    const wroteVectors = writeIfChanged(
      vectorsPath,
      `${JSON.stringify(payload)}\n`,
    );
    console.log(
      `${wroteVectors ? 'Wrote' : 'Unchanged'} ${relative(process.cwd(), vectorsPath)}: ${embedTexts.length} x ${dims}`,
    );
  } catch (error) {
    // Keyword search still works; remove stale vectors so they cannot mismatch.
    if (existsSync(vectorsPath)) rmSync(vectorsPath);
    console.warn(
      `Embedding failed (${error instanceof Error ? error.message : String(error)}).`,
    );
    console.warn(
      'Wrote the keyword index only; search falls back to keywords.',
    );
  }
}

/** Quote a value for a POSIX shell line. */
function shellQuote(value: string): string {
  return /^[\w@%+=:,./-]+$/.test(value)
    ? `"${value}"`
    : `'${value.replace(/'/g, "'\\''")}'`;
}

/** The exact command that re-indexes this brain with the same settings. */
function reindexCommand(): string {
  const env = [
    bundled ? '' : `BRAIN_DIR=${shellQuote(brainDir)}`,
    locationInput ? `BRAIN_LOCATION=${shellQuote(locationInput)}` : '',
    owner ? `BRAIN_OWNER=${shellQuote(owner)}` : '',
    process.env.OUT_DIR?.trim() ? `OUT_DIR=${shellQuote(outDir)}` : '',
  ].filter(Boolean);
  return [...env, `bun run --cwd ${shellQuote(APP_DIR)} index`].join(' ');
}

await main();
if (!checkOnly && process.exitCode !== 1) {
  console.log('');
  if (!bundled) {
    console.log(
      `Your index is in ${outDir} (gitignored: never committed or deployed).`,
    );
  }
  console.log('Re-index after you edit notes (copy this one line):');
  console.log(`  ${reindexCommand()}`);
  console.log('Start the search page:');
  console.log(`  bun run --cwd ${shellQuote(APP_DIR)} dev`);
}
