import {describe, expect, test} from 'bun:test';
import {buildIndex, isNoteFile, lintBrain} from './build';
import {parseNote} from './frontmatter';
import {buildPrompt, handoffs} from './handoff';
import {renderMarkdown} from './markdown';
import {
  classify,
  cosineScores,
  decodeVectors,
  encodeVectors,
  hybridSearch,
} from './search';
import {chunkNote, snippet, tokenize, unescapeHtml} from './text';

const NOTE = `---
title: GDG Tulsa
tags: [org, Tulsa]
source:
  - https://gdg.community.dev/gdg-tulsa/
updated: 2026-11-18
---

# GDG Tulsa

Google Developer Group chapter in Tulsa.

## Events

Hosts workshops about Gemini and Antigravity.

## Sources

- [Chapter](https://gdg.community.dev/gdg-tulsa/)
`;

describe('frontmatter', () => {
  test('reads inline and block lists', () => {
    const {meta, body, hasFrontmatter} = parseNote(NOTE, 'x');
    expect(hasFrontmatter).toBe(true);
    expect(meta.title).toBe('GDG Tulsa');
    expect(meta.tags).toEqual(['org', 'tulsa']);
    expect(meta.source).toEqual(['https://gdg.community.dev/gdg-tulsa/']);
    expect(meta.sample).toBe(false);
    expect(body.startsWith('\n# GDG Tulsa')).toBe(true);
  });

  test('falls back to the first heading, then the file name', () => {
    expect(parseNote('# Hello\ntext', 'f').meta.title).toBe('Hello');
    expect(parseNote('text', 'f').meta.title).toBe('f');
  });
});

describe('text', () => {
  test('tokenizes, drops stopwords, stems plurals', () => {
    expect(tokenize('What are the Meetups in Tulsa?')).toEqual([
      'meetup',
      'tulsa',
    ]);
  });

  test('chunks by heading and leaves out Sources', () => {
    const chunks = chunkNote(parseNote(NOTE, 'x').body, 'GDG Tulsa');
    expect(chunks.map(c => c.heading)).toEqual(['GDG Tulsa', 'Events']);
  });

  test('snippet escapes HTML and marks hits', () => {
    expect(snippet('<b>Tulsa</b> meetups', 'meetup')).toBe(
      '&lt;b&gt;Tulsa&lt;/b&gt; <b>meetups</b>',
    );
  });
});

describe('markdown', () => {
  test('escapes raw HTML and blocks unsafe links', () => {
    const html = renderMarkdown('<script>x</script> [a](javascript:alert(1))');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('javascript:');
  });

  test('renders headings, lists, tables and external links', () => {
    const html = renderMarkdown(
      '## Hi\n\n- **one** [site](https://example.com)\n- two\n\n| a | b |\n|---|---|\n| 1 | 2 |',
    );
    expect(html).toContain('<h2 id="hi">Hi</h2>');
    expect(html).toContain(
      '<li><strong>one</strong> <a href="https://example.com" target="_blank"',
    );
    expect(html).toContain('<td>2</td>');
  });

  test('code blocks carry their exact text for the Copy button', () => {
    const code = 'BRAIN_DIR=~/Brain bun run index\necho "<b>a & b</b>" \'x\'';
    const html = renderMarkdown(`Run:\n\n\`\`\`sh\n${code}\n\`\`\`\n`);
    const attr = /data-copy="([^"]*)"/.exec(html)?.[1];
    expect(attr).toBeDefined();
    expect(unescapeHtml(attr ?? '')).toBe(code);
    expect(html).toContain('class="copy-button"');
    expect(html).toContain('aria-label="Copy this block"');
    expect(html).not.toContain('<b>a');
  });

  test('rewrites relative links', () => {
    const html = renderMarkdown('[x](../orgs/a.md)', {
      resolveLink: () => '#/note/orgs/a.md',
    });
    expect(html).toContain('href="#/note/orgs/a.md"');
  });
});

describe('index and search', () => {
  const files = [
    {path: 'orgs/gdg-tulsa.md', content: NOTE},
    {path: 'index.md', content: '- [GDG Tulsa](orgs/gdg-tulsa.md)'},
    {path: 'AGENTS.md', content: '# rules'},
    {
      path: 'meetings/sample.md',
      content:
        '---\ntitle: Sample\ntags: [meeting]\nsample: true\nupdated: 2026-11-18\n---\nFollow-ups for pizza night.',
    },
  ];

  test('skips contract files and hidden folders', () => {
    expect(isNoteFile('AGENTS.md')).toBe(false);
    expect(isNoteFile('.agents/skills/x/SKILL.md')).toBe(false);
    expect(isNoteFile('orgs/a.md')).toBe(true);
  });

  test('lint flags a note missing from index.md', () => {
    expect(lintBrain(files)).toEqual([
      'meetings/sample.md: not linked from index.md',
    ]);
  });

  test('keyword search ranks the matching note and classifies strength', async () => {
    const {index} = await buildIndex(files, {brainLocation: 'b', model: 'm'});
    expect(index.docs.map(d => d.path)).toEqual([
      'meetings/sample.md',
      'orgs/gdg-tulsa.md',
    ]);
    const hit = hybridSearch(index, 'antigravity workshops', null);
    expect(hit.results[0]?.doc.path).toBe('orgs/gdg-tulsa.md');
    expect(hit.strength).toBe('strong');
    expect(hybridSearch(index, 'quantum lattice', null).strength).toBe('none');
    expect(hybridSearch(index, 'tulsa pizza bakery oven', null).strength).toBe(
      'weak',
    );
  });

  test('builds the same index twice', async () => {
    const a = await buildIndex(files, {brainLocation: 'b', model: 'm'});
    const b = await buildIndex([...files].reverse(), {
      brainLocation: 'b',
      model: 'm',
    });
    expect(JSON.stringify(a.index)).toBe(JSON.stringify(b.index));
  });

  test('semantic scores can rescue a keyword miss', async () => {
    const {index} = await buildIndex(files, {brainLocation: 'b', model: 'm'});
    const semantic = index.chunks.map(c => (c.doc === 1 ? 0.6 : 0.1));
    const outcome = hybridSearch(index, 'developer community', semantic);
    expect(outcome.mode).toBe('hybrid');
    expect(outcome.results[0]?.doc.path).toBe('orgs/gdg-tulsa.md');
    expect(outcome.strength).toBe('strong');
    expect(classify([])).toBe('none');
  });

  test('vectors survive base64 and score by dot product', () => {
    const vectors = new Float32Array([1, 0, 0, 1]);
    const encoded = encodeVectors(vectors, 2);
    const decoded = decodeVectors(encoded.scales, encoded.vectors, 2);
    expect(Array.from(decoded)).toEqual([1, 0, 0, 1]);
    const noisy = new Float32Array([0.12, -0.34, 0.56, 0.07]);
    const back = decodeVectors(
      encodeVectors(noisy, 4).scales,
      encodeVectors(noisy, 4).vectors,
      4,
    );
    noisy.forEach((v, i) =>
      expect(Math.abs((back[i] ?? 0) - v)).toBeLessThan(0.003),
    );
    expect(cosineScores(decoded, 2, [0, 1])).toEqual([0, 1]);
  });
});

describe('handoff', () => {
  test('prompt names the query and brain location', () => {
    const prompt = buildPrompt('who runs GDG Tulsa?', '~/Brain');
    expect(prompt).toStartWith(
      'Search my brain at ~/Brain and answer: who runs GDG Tulsa?',
    );
    expect(prompt).toContain('Capture anything new');
  });

  test('targets: prefill for ChatGPT and Claude, clipboard for Gemini and Antigravity', () => {
    const targets = handoffs('a b&c');
    expect(targets.map(t => t.label)).toEqual([
      'Antigravity',
      'Gemini',
      'ChatGPT',
      'Claude',
    ]);
    expect(targets[0]?.url).toBeNull();
    expect(targets[1]?.url).toBe('https://gemini.google.com/app');
    expect(targets[2]?.url).toBe('https://chatgpt.com/?q=a%20b%26c');
    expect(targets[3]?.url).toBe('https://claude.ai/new?q=a%20b%26c');
  });
});
