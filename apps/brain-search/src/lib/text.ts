/** Tokenizing, chunking and snippet helpers shared by the indexer and the page. */

const STOPWORDS = new Set(
  (
    'a an and are as at be but by for from has have how i in into is it its ' +
    'me my of on or our so that the their them then there these this to was ' +
    'we were what when where which who why will with you your about can do ' +
    'does did not no yes'
  ).split(' '),
);

export function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
}

export function tokenize(text: string): string[] {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return words
    .filter(word => word.length > 1 && !STOPWORDS.has(word))
    .map(stem);
}

export interface Chunk {
  heading: string;
  text: string;
}

/** Strip Markdown syntax so chunks read as plain sentences. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_`|]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

const MAX_CHUNK = 900;

/**
 * Split a note body into heading sections, then split long sections on
 * paragraph boundaries. The `## Sources` section is left out: sources are
 * kept as metadata and shown as links instead.
 */
export function chunkNote(body: string, title: string): Chunk[] {
  const sections: Chunk[] = [];
  let heading = title;
  let buffer: string[] = [];
  const flush = () => {
    const text = plainText(buffer.join('\n'));
    if (text && !/^sources?$/i.test(heading)) sections.push({heading, text});
    buffer = [];
  };
  for (const line of body.split(/\r?\n/)) {
    const match = /^(#{1,3})\s+(.+)$/.exec(line);
    if (match) {
      flush();
      heading = match[1] === '#' ? title : (match[2] ?? title).trim();
      continue;
    }
    buffer.push(line);
  }
  flush();

  const chunks: Chunk[] = [];
  for (const section of sections) {
    if (section.text.length <= MAX_CHUNK) {
      chunks.push(section);
      continue;
    }
    let current = '';
    for (const paragraph of section.text.split('\n')) {
      if (current && current.length + paragraph.length > MAX_CHUNK) {
        chunks.push({heading: section.heading, text: current});
        current = '';
      }
      current = current ? `${current}\n${paragraph}` : paragraph;
    }
    if (current) chunks.push({heading: section.heading, text: current});
  }
  if (chunks.length === 0) chunks.push({heading: title, text: title});
  return chunks;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Reverse escapeHtml (what the browser does when it reads an attribute). */
export function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Pick a window of the text around the first query hit, escape it, and wrap
 * matching words in <b>.
 */
export function snippet(text: string, query: string, size = 220): string {
  const terms = new Set(tokenize(query));
  const flat = text.replace(/\s+/g, ' ').trim();
  let start = 0;
  const words = [...flat.matchAll(/[\p{L}\p{N}]+/gu)];
  const hit = words.find(word => terms.has(stem(word[0].toLowerCase())));
  if (hit?.index !== undefined && hit.index > size / 3) {
    start = flat.lastIndexOf(' ', hit.index - Math.floor(size / 3)) + 1;
  }
  let piece = flat.slice(start, start + size);
  if (start + size < flat.length) {
    piece = `${piece.slice(0, piece.lastIndexOf(' ') > 0 ? piece.lastIndexOf(' ') : piece.length)}…`;
  }
  if (start > 0) piece = `…${piece}`;
  return escapeHtml(piece).replace(/&#?\w+;|[\p{L}\p{N}]+/gu, word =>
    !word.startsWith('&') && terms.has(stem(word.toLowerCase()))
      ? `<b>${word}</b>`
      : word,
  );
}
