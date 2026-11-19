/**
 * Minimal frontmatter reader for brain notes. It understands the small YAML
 * subset the brain contract allows: scalars, booleans, inline lists
 * (`[a, b]`) and block lists (`- item`). Anything else is kept as a string.
 */

export interface NoteMeta {
  title: string;
  tags: string[];
  source: string[];
  updated: string;
  sample: boolean;
}

export interface ParsedNote {
  meta: NoteMeta;
  body: string;
  hasFrontmatter: boolean;
}

type Value = string | boolean | string[];

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseScalar(raw: string): Value {
  const value = raw.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map(unquote)
      .filter(item => item.length > 0);
  }
  return unquote(value);
}

export function parseFrontmatterBlock(block: string): Record<string, Value> {
  const result: Record<string, Value> = {};
  let listKey: string | null = null;
  for (const line of block.split(/\r?\n/)) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const listItem = /^\s+-\s+(.*)$/.exec(line) ?? /^-\s+(.*)$/.exec(line);
    if (listItem && listKey) {
      const current = result[listKey];
      const items = Array.isArray(current) ? current : [];
      items.push(unquote(listItem[1] ?? ''));
      result[listKey] = items;
      continue;
    }
    const pair = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!pair) continue;
    const key = pair[1] ?? '';
    const rest = pair[2] ?? '';
    if (rest.trim() === '') {
      listKey = key;
      result[key] = [];
    } else {
      listKey = null;
      result[key] = parseScalar(rest);
    }
  }
  return result;
}

function asList(value: Value | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}

function firstHeading(body: string): string | null {
  const match = /^#\s+(.+)$/m.exec(body);
  return match?.[1]?.trim() ?? null;
}

export function parseNote(markdown: string, fallbackTitle: string): ParsedNote {
  const text = markdown.replace(/^\uFEFF/, '');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  const fields = match ? parseFrontmatterBlock(match[1] ?? '') : {};
  const body = match ? text.slice(match[0].length) : text;
  const title =
    (typeof fields.title === 'string' && fields.title) ||
    firstHeading(body) ||
    fallbackTitle;
  return {
    meta: {
      title,
      tags: asList(fields.tags).map(tag => tag.toLowerCase()),
      source: asList(fields.source ?? fields.sources),
      updated: typeof fields.updated === 'string' ? fields.updated : '',
      sample: fields.sample === true,
    },
    body,
    hasFrontmatter: match !== null,
  };
}
