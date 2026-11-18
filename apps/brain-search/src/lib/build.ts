/** Pure index building: files in, BrainIndex out. No file system or model. */
import {parseNote} from './frontmatter';
import {
  INDEX_VERSION,
  buildKeywordIndex,
  chunkSearchText,
  type BrainIndex,
  type IndexedChunk,
  type IndexedDoc,
} from './search';
import {chunkNote} from './text';

export interface BrainFile {
  /** Path relative to the brain folder, with forward slashes. */
  path: string;
  content: string;
}

/** Files that describe the brain rather than hold knowledge. */
export const SKIPPED_FILES = new Set([
  'index.md',
  'agents.md',
  'claude.md',
  'gemini.md',
  'readme.md',
]);

export function isNoteFile(path: string): boolean {
  const parts = path.split('/');
  const name = (parts[parts.length - 1] ?? '').toLowerCase();
  if (!name.endsWith('.md')) return false;
  if (parts.some(part => part.startsWith('.') || part === 'node_modules')) {
    return false;
  }
  return !SKIPPED_FILES.has(name);
}

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function contentHash(
  files: BrainFile[],
  model: string,
): Promise<string> {
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  return sha256(
    [
      `v${INDEX_VERSION}`,
      model,
      ...sorted.map(f => `${f.path}\n${f.content}`),
    ].join('\u0000'),
  );
}

export interface BuiltIndex {
  index: BrainIndex;
  /** One string per chunk, in chunk order, to embed. */
  embedTexts: string[];
}

export async function buildIndex(
  files: BrainFile[],
  options: {brainLocation: string; model: string; owner?: string},
): Promise<BuiltIndex> {
  const notes = files
    .filter(file => isNoteFile(file.path))
    .sort((a, b) => a.path.localeCompare(b.path));
  const docs: IndexedDoc[] = [];
  const chunks: IndexedChunk[] = [];
  for (const file of notes) {
    const fallback = (file.path.split('/').pop() ?? file.path).replace(
      /\.md$/,
      '',
    );
    const {meta, body} = parseNote(file.content, fallback);
    const docIndex = docs.length;
    docs.push({path: file.path, ...meta, body});
    for (const chunk of chunkNote(body, meta.title)) {
      chunks.push({doc: docIndex, ...chunk});
    }
  }
  const embedTexts = chunks.map(chunk =>
    chunkSearchText(docs[chunk.doc] as IndexedDoc, chunk),
  );
  return {
    index: {
      version: INDEX_VERSION,
      contentHash: await contentHash(notes, options.model),
      brainLocation: options.brainLocation,
      owner: options.owner ?? '',
      model: options.model,
      docs,
      chunks,
      keyword: buildKeywordIndex(embedTexts),
    },
    embedTexts,
  };
}

/** Report notes that are missing from index.md or lack required fields. */
export function lintBrain(files: BrainFile[]): string[] {
  const problems: string[] = [];
  const indexFile = files.find(file => file.path === 'index.md');
  if (!indexFile) problems.push('index.md is missing');
  for (const file of files.filter(f => isNoteFile(f.path))) {
    const {meta, hasFrontmatter} = parseNote(file.content, file.path);
    if (!hasFrontmatter) problems.push(`${file.path}: no frontmatter`);
    if (meta.tags.length === 0) problems.push(`${file.path}: no tags`);
    if (meta.source.length === 0 && !meta.sample) {
      problems.push(`${file.path}: no source URL`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.updated)) {
      problems.push(`${file.path}: updated is not YYYY-MM-DD`);
    }
    if (indexFile && !indexFile.content.includes(`(${file.path})`)) {
      problems.push(`${file.path}: not linked from index.md`);
    }
  }
  return problems;
}
