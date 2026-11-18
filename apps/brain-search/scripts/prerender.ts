/**
 * Pre-render every static route into dist/<route>/index.html using the same
 * render functions as the browser, so pages read without JS and can be
 * crawled. Runs from the Vite build (see vite.config.ts). Always uses the
 * bundled example index in public/, never a personal index in .brain-local/.
 */
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {
  KNOWN_FOLDERS,
  parseLocation,
  staticPaths,
  type Route,
} from '../src/app';
import {firstName, folderOf} from '../src/lib/brand';
import type {BrainIndex} from '../src/lib/search';
import {
  gbarHtml,
  logoLetters,
  logoText,
  pageTitle,
  staticViewHtml,
  type RenderContext,
} from '../src/render';
import {DEFAULT_SETTINGS} from '../src/settings';
import {escapeHtml, plainText} from '../src/lib/text';

function replaceOnce(
  html: string,
  find: string | RegExp,
  value: string,
): string {
  const next = html.replace(find, () => value);
  if (next === html && !html.includes(value)) {
    throw new Error(`Pre-render marker not found: ${String(find)}`);
  }
  return next;
}

export function fillTemplate(
  template: string,
  ctx: RenderContext,
  route: Route,
): string {
  let html = template;
  html = replaceOnce(
    html,
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(pageTitle(ctx, route))}</title>`,
  );
  html = replaceOnce(
    html,
    '<body data-route="home">',
    `<body data-route="${route.name}">`,
  );
  html = replaceOnce(
    html,
    '<nav class="gbar-left" aria-label="Brain folders" id="gbar-folders"></nav>',
    `<nav class="gbar-left" aria-label="Brain folders" id="gbar-folders">${gbarHtml(ctx, route)}</nav>`,
  );
  html = replaceOnce(
    html,
    '<span class="logo small" data-logo></span>',
    `<span class="logo small" data-logo>${logoLetters(logoText(ctx))}</span>`,
  );
  html = replaceOnce(
    html,
    '<main id="view" tabindex="-1"></main>',
    `<main id="view" tabindex="-1">${staticViewHtml(ctx, route)}</main>`,
  );
  if (route.name === 'note') {
    const doc = ctx.index?.docs.find(d => d.path === route.path);
    if (doc) {
      const summary = plainText(doc.body.replace(/^\s*#\s+.+\n/, ''))
        .replace(/\s+/g, ' ')
        .slice(0, 155);
      html = html.replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
        () => `<meta name="description" content="${escapeHtml(summary)}" />`,
      );
    }
  }
  return html;
}

export function prerender(appDir: string, outDir: string): number {
  const template = readFileSync(join(outDir, 'index.html'), 'utf8');
  const index = JSON.parse(
    readFileSync(join(appDir, 'public', 'brain-index.json'), 'utf8'),
  ) as BrainIndex;
  const ctx: RenderContext = {
    index,
    settings: {...DEFAULT_SETTINGS},
    ownerName: firstName(index.owner ?? ''),
    setupMarkdown: readFileSync(join(appDir, 'SETUP.md'), 'utf8'),
  };
  const folders = [
    ...new Set([
      ...KNOWN_FOLDERS,
      ...index.docs.map(doc => folderOf(doc.path)).filter(Boolean),
    ]),
  ];
  const paths = staticPaths(
    index.docs.map(doc => doc.path),
    folders,
  );
  for (const path of paths) {
    const route = parseLocation(path, '', folders);
    const file =
      path === '/'
        ? join(outDir, 'index.html')
        : join(outDir, path, 'index.html');
    mkdirSync(dirname(file), {recursive: true});
    writeFileSync(file, fillTemplate(template, ctx, route));
  }
  return paths.length;
}
