/**
 * A small, escape-first Markdown renderer for brain notes and the setup page.
 * All text is HTML-escaped before inline formatting is applied, and links are
 * limited to http(s), mailto, in-page and relative targets, so a note cannot
 * inject markup or script.
 *
 * Supported: ATX headings, paragraphs, bullet and numbered lists (one level of
 * nesting), blockquotes, fenced code, GFM tables, inline code, bold, italic,
 * links and bare https URLs.
 */
import {escapeHtml} from './text';

export interface RenderOptions {
  /** Rewrite a relative link (for example `../orgs/techlahoma.md`). */
  resolveLink?: (href: string) => string;
}

function safeHref(href: string, options: RenderOptions): string | null {
  const trimmed = href.trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('#')) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  return options.resolveLink ? options.resolveLink(trimmed) : trimmed;
}

export function renderInline(
  text: string,
  options: RenderOptions = {},
): string {
  const codes: string[] = [];
  let html = escapeHtml(text).replace(/`([^`]+)`/g, (_, code: string) => {
    codes.push(`<code>${code}</code>`);
    return `\uE000${codes.length - 1}\uE000`;
  });
  const links: string[] = [];
  const stash = (markup: string) => {
    links.push(markup);
    return `\uE001${links.length - 1}\uE001`;
  };
  html = html.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_, label: string, href: string) => {
      const target = safeHref(href.replace(/&amp;/g, '&'), options);
      if (target === null) return label;
      const external = /^https?:/i.test(target);
      return stash(
        `<a href="${escapeHtml(target)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`,
      );
    },
  );
  html = html.replace(
    /(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:!?'"])/g,
    (_, lead: string, url: string) =>
      `${lead}${stash(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)}`,
  );
  html = html
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, '$1<em>$2</em>');
  return html
    .replace(/\uE001(\d+)\uE001/g, (_, i: string) => links[Number(i)] ?? '')
    .replace(/\uE000(\d+)\uE000/g, (_, i: string) => codes[Number(i)] ?? '');
}

/**
 * A code block with a Copy button. The button carries the exact block text in
 * `data-copy` (HTML-escaped, so the browser hands back the original string).
 */
export function copyBlock(code: string, langAttr = ''): string {
  const text = escapeHtml(code);
  return (
    '<div class="copy-block">' +
    `<button type="button" class="copy-button" data-copy="${text}" aria-label="Copy this block">Copy</button>` +
    `<pre${langAttr}><code>${text}</code></pre></div>`
  );
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map(cell => cell.trim().replace(/\\\|/g, '|'));
}

export function renderMarkdown(
  markdown: string,
  options: RenderOptions = {},
): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;
  const inline = (text: string) => renderInline(text, options);

  while (i < lines.length) {
    const line = lines[i] ?? '';

    if (line.trim() === '') {
      i++;
      continue;
    }

    const fence = /^```(\w*)/.exec(line);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i] ?? '')) {
        code.push(lines[i] ?? '');
        i++;
      }
      i++;
      const lang = fence[1] ? ` data-lang="${escapeHtml(fence[1])}"` : '';
      out.push(copyBlock(code.join('\n'), lang));
      continue;
    }

    const heading = /^(#{1,6})\s+(.+?)\s*#*$/.exec(line);
    if (heading) {
      const level = (heading[1] ?? '#').length;
      const text = heading[2] ?? '';
      out.push(`<h${level} id="${slug(text)}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    if (
      line.includes('|') &&
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(
        lines[i + 1] ?? '',
      )
    ) {
      const head = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? '').includes('|')) {
        rows.push(splitRow(lines[i] ?? ''));
        i++;
      }
      out.push(
        '<div class="table-wrap"><table><thead><tr>' +
          head.map(cell => `<th>${inline(cell)}</th>`).join('') +
          '</tr></thead><tbody>' +
          rows
            .map(
              row =>
                '<tr>' +
                head
                  .map((_, c) => `<td>${inline(row[c] ?? '')}</td>`)
                  .join('') +
                '</tr>',
            )
            .join('') +
          '</tbody></table></div>',
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i] ?? '')) {
        quote.push((lines[i] ?? '').replace(/^>\s?/, ''));
        i++;
      }
      out.push(
        `<blockquote>${renderMarkdown(quote.join('\n'), options)}</blockquote>`,
      );
      continue;
    }

    const listMatch = /^(\s*)([-*+]|\d+[.)])\s+/.exec(line);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[2] ?? '');
      const items: string[] = [];
      while (i < lines.length) {
        const current = lines[i] ?? '';
        const item = /^([-*+]|\d+[.)])\s+(.*)$/.exec(current);
        if (item) {
          items.push(item[2] ?? '');
          i++;
          continue;
        }
        const nested = /^\s{2,}\S/.test(current);
        if (nested && items.length > 0) {
          const sub: string[] = [];
          while (i < lines.length && /^\s{2,}\S/.test(lines[i] ?? '')) {
            sub.push((lines[i] ?? '').replace(/^\s{2,4}/, ''));
            i++;
          }
          items[items.length - 1] += `\n${sub.join('\n')}`;
          continue;
        }
        break;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(
        `<${tag}>` +
          items
            .map(item => {
              const [first, ...rest] = item.split('\n');
              const nestedHtml = rest.length
                ? renderMarkdown(rest.join('\n'), options)
                : '';
              return `<li>${inline(first ?? '')}${nestedHtml}</li>`;
            })
            .join('') +
          `</${tag}>`,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() !== '' &&
      !/^(#{1,6}\s|```|>|\s*([-*+]|\d+[.)])\s)/.test(lines[i] ?? '')
    ) {
      paragraph.push((lines[i] ?? '').trim());
      i++;
    }
    out.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }
  return out.join('\n');
}
