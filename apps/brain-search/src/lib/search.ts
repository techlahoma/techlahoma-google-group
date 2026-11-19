/**
 * Index format and hybrid ranking. The indexer (scripts/index-brain.ts)
 * writes `public/brain-index.json` (notes, chunks and a BM25 keyword index)
 * and `public/brain-vectors.json` (one embedding per chunk). The page loads
 * both; if the vectors or the model are unavailable it ranks by keywords only.
 */
import {tokenize} from './text';

export const INDEX_VERSION = 2;

export interface IndexedDoc {
  path: string;
  title: string;
  tags: string[];
  source: string[];
  updated: string;
  sample: boolean;
  body: string;
}

export interface IndexedChunk {
  doc: number;
  heading: string;
  text: string;
}

export interface KeywordIndex {
  k1: number;
  b: number;
  avgLength: number;
  docFreq: Record<string, number>;
  lengths: number[];
  termFreqs: Array<Record<string, number>>;
}

export interface BrainIndex {
  version: number;
  contentHash: string;
  brainLocation: string;
  /** First name for the personalized wordmark ('' when unset). */
  owner: string;
  model: string;
  docs: IndexedDoc[];
  chunks: IndexedChunk[];
  keyword: KeywordIndex;
}

export interface VectorIndex {
  version: number;
  contentHash: string;
  model: string;
  dtype: string;
  dims: number;
  /** Vectors are int8 with one float32 scale per vector (4x smaller than float32). */
  encoding: 'int8';
  /** Base64 of a little-endian Float32Array, one scale per chunk. */
  scales: string;
  /** Base64 of an Int8Array, chunks.length * dims long. */
  vectors: string;
}

/** Text that represents a chunk for both BM25 and embeddings. */
export function chunkSearchText(doc: IndexedDoc, chunk: IndexedChunk): string {
  const heading = chunk.heading === doc.title ? '' : ` — ${chunk.heading}`;
  return `${doc.title}${heading}. Tags: ${doc.tags.join(', ')}. ${chunk.text}`;
}

export function buildKeywordIndex(texts: string[]): KeywordIndex {
  const docFreq: Record<string, number> = {};
  const lengths: number[] = [];
  const termFreqs: Array<Record<string, number>> = [];
  for (const text of texts) {
    const tokens = tokenize(text);
    const counts: Record<string, number> = {};
    for (const token of tokens) counts[token] = (counts[token] ?? 0) + 1;
    for (const term of Object.keys(counts)) {
      docFreq[term] = (docFreq[term] ?? 0) + 1;
    }
    lengths.push(tokens.length);
    termFreqs.push(counts);
  }
  const total = lengths.reduce((sum, length) => sum + length, 0);
  return {
    k1: 1.2,
    b: 0.75,
    avgLength: lengths.length ? total / lengths.length : 0,
    docFreq,
    lengths,
    termFreqs,
  };
}

export function bm25Scores(index: KeywordIndex, query: string): number[] {
  const terms = [...new Set(tokenize(query))];
  const n = index.lengths.length;
  return index.termFreqs.map((counts, i) => {
    let score = 0;
    const length = index.lengths[i] ?? 0;
    for (const term of terms) {
      const tf = counts[term];
      if (!tf) continue;
      const df = index.docFreq[term] ?? 0;
      const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
      const norm =
        tf +
        index.k1 * (1 - index.b + (index.b * length) / (index.avgLength || 1));
      score += (idf * (tf * (index.k1 + 1))) / norm;
    }
    return score;
  });
}

/** Share of the distinct query terms that appear in each chunk (0..1). */
export function termCoverage(index: KeywordIndex, query: string): number[] {
  const terms = [...new Set(tokenize(query))];
  return index.termFreqs.map(counts =>
    terms.length ? terms.filter(term => counts[term]).length / terms.length : 0,
  );
}

function toBase64(view: ArrayBufferView): string {
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Quantize each vector to int8 with its own scale (max |value| / 127).
 * Cosine scores move by well under 0.01, which does not change rankings.
 */
export function encodeVectors(
  vectors: Float32Array,
  dims: number,
): {scales: string; vectors: string} {
  const count = dims ? Math.floor(vectors.length / dims) : 0;
  const scales = new Float32Array(count);
  const data = new Int8Array(count * dims);
  for (let c = 0; c < count; c++) {
    let max = 0;
    for (let d = 0; d < dims; d++) {
      max = Math.max(max, Math.abs(vectors[c * dims + d] ?? 0));
    }
    const scale = max / 127 || 1;
    scales[c] = scale;
    for (let d = 0; d < dims; d++) {
      data[c * dims + d] = Math.round((vectors[c * dims + d] ?? 0) / scale);
    }
  }
  return {scales: toBase64(scales), vectors: toBase64(data)};
}

export function decodeVectors(
  scalesBase64: string,
  vectorsBase64: string,
  dims: number,
): Float32Array {
  const scales = new Float32Array(fromBase64(scalesBase64));
  const data = new Int8Array(fromBase64(vectorsBase64));
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = (data[i] ?? 0) * (scales[Math.floor(i / dims)] ?? 0);
  }
  return out;
}

export function cosineScores(
  vectors: Float32Array,
  dims: number,
  query: ArrayLike<number>,
): number[] {
  const count = Math.floor(vectors.length / dims);
  const scores: number[] = [];
  for (let c = 0; c < count; c++) {
    let dot = 0;
    const offset = c * dims;
    for (let d = 0; d < dims; d++) {
      dot += (vectors[offset + d] ?? 0) * (query[d] ?? 0);
    }
    scores.push(dot);
  }
  return scores;
}

export interface SearchResult {
  doc: IndexedDoc;
  docIndex: number;
  chunk: IndexedChunk;
  score: number;
  /** BM25 scaled by the best hit, times term coverage (0..1). */
  keyword: number;
  /** Share of query terms found in the best chunk. */
  coverage: number;
  semantic: number | null;
}

export type Strength = 'strong' | 'weak' | 'none';

export interface SearchOutcome {
  results: SearchResult[];
  strength: Strength;
  mode: 'hybrid' | 'keyword';
}

/** Weight of the semantic score when both signals are present. */
export const SEMANTIC_WEIGHT = 0.6;
/** Below this cosine similarity a chunk with no keyword hit is dropped. */
export const MIN_SEMANTIC = 0.25;
/** A top result whose cosine reaches this is strong on meaning alone. */
export const STRONG_SEMANTIC = 0.45;
/** With half the query terms matched, this cosine is enough for strong. */
export const SUPPORTED_SEMANTIC = 0.3;

/**
 * Rank notes by combining BM25 (scaled to 0..1 by the best hit, then weighted
 * by how many query terms the chunk contains) with cosine similarity. Each
 * note is scored by its best chunk.
 */
export function hybridSearch(
  index: BrainIndex,
  query: string,
  semantic: number[] | null,
  limit = 10,
): SearchOutcome {
  const keyword = bm25Scores(index.keyword, query);
  const coverage = termCoverage(index.keyword, query);
  const maxKeyword = Math.max(0, ...keyword);
  const best = new Map<number, SearchResult>();
  index.chunks.forEach((chunk, i) => {
    const cover = coverage[i] ?? 0;
    const kw = maxKeyword > 0 ? ((keyword[i] ?? 0) / maxKeyword) * cover : 0;
    const cos = semantic ? (semantic[i] ?? 0) : null;
    if (kw === 0 && (cos === null || cos < MIN_SEMANTIC)) return;
    const score =
      cos === null ? kw : SEMANTIC_WEIGHT * cos + (1 - SEMANTIC_WEIGHT) * kw;
    const doc = index.docs[chunk.doc];
    if (!doc) return;
    const previous = best.get(chunk.doc);
    if (!previous || score > previous.score) {
      best.set(chunk.doc, {
        doc,
        docIndex: chunk.doc,
        chunk,
        score,
        keyword: kw,
        coverage: cover,
        semantic: cos,
      });
    }
  });
  const results = [...best.values()]
    .sort((a, b) => b.score - a.score || a.doc.path.localeCompare(b.doc.path))
    .slice(0, limit);
  return {
    results,
    strength: classify(results),
    mode: semantic ? 'hybrid' : 'keyword',
  };
}

export function classify(results: SearchResult[]): Strength {
  const top = results[0];
  if (!top) return 'none';
  if (top.semantic === null) return top.coverage >= 0.5 ? 'strong' : 'weak';
  if (top.semantic >= STRONG_SEMANTIC) return 'strong';
  return top.coverage >= 0.5 && top.semantic >= SUPPORTED_SEMANTIC
    ? 'strong'
    : 'weak';
}

/**
 * "Similar" pages: rank notes by how close their chunks are to the given
 * note's first chunk vector. Uses only precomputed vectors, so it works
 * before the query model loads.
 */
export function relatedSearch(
  index: BrainIndex,
  vectors: Float32Array,
  dims: number,
  path: string,
  limit = 10,
): SearchOutcome {
  const docIndex = index.docs.findIndex(doc => doc.path === path);
  const chunkIndex = index.chunks.findIndex(chunk => chunk.doc === docIndex);
  if (docIndex < 0 || chunkIndex < 0) {
    return {results: [], strength: 'none', mode: 'hybrid'};
  }
  const query = vectors.subarray(chunkIndex * dims, (chunkIndex + 1) * dims);
  const scores = cosineScores(vectors, dims, query);
  const best = new Map<number, SearchResult>();
  index.chunks.forEach((chunk, i) => {
    if (chunk.doc === docIndex) return;
    const score = scores[i] ?? 0;
    const doc = index.docs[chunk.doc];
    if (!doc || score < MIN_SEMANTIC) return;
    const previous = best.get(chunk.doc);
    if (!previous || score > previous.score) {
      best.set(chunk.doc, {
        doc,
        docIndex: chunk.doc,
        chunk,
        score,
        keyword: 0,
        coverage: 0,
        semantic: score,
      });
    }
  });
  const results = [...best.values()]
    .sort((a, b) => b.score - a.score || a.doc.path.localeCompare(b.doc.path))
    .slice(0, limit);
  return {
    results,
    strength: results.length ? 'strong' : 'none',
    mode: 'hybrid',
  };
}
