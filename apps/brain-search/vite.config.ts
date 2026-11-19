import {spawn} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {resolve, sep} from 'node:path';
import {
  defineConfig,
  type Connect,
  type Plugin,
  type ViteDevServer,
} from 'vite';
import {prerender} from './scripts/prerender';

const APP_DIR = __dirname;
/** Personal indexes (BRAIN_DIR=... bun run index) live here, gitignored. */
const LOCAL_DIR = resolve(APP_DIR, '.brain-local');
const LOCAL_FILES = new Set(['/brain-index.json', '/brain-vectors.json']);

/**
 * Serve /local/brain-*.json from .brain-local/ in `dev` and `preview`, so a
 * personal brain never enters public/ or dist/. No personal index: 204, and
 * the page falls back to the bundled example.
 */
const localBrain: Connect.NextHandleFunction = (req, res, next) => {
  const path = (req.url ?? '').split('?')[0] ?? '';
  if (!LOCAL_FILES.has(path)) {
    next();
    return;
  }
  const file = resolve(LOCAL_DIR, path.slice(1));
  res.setHeader('Cache-Control', 'no-store');
  if (!existsSync(file)) {
    res.statusCode = 204;
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(readFileSync(file));
};

/** Re-index soon after notes stop changing; never two indexers at once. */
const WATCH_DEBOUNCE_MS = 600;

/**
 * Watch mode for `BRAIN_DIR=... bun run dev`: re-index the personal brain
 * when its Markdown changes (the indexer re-embeds only changed chunks),
 * then tell the open page over the HMR socket.
 */
function watchBrain(server: ViteDevServer): void {
  const input = process.env.BRAIN_DIR?.trim();
  if (!input) return;
  const dir = resolve(input.replace(/^~(?=$|\/)/, process.env.HOME ?? '~'));
  if (dir === resolve(APP_DIR, 'brain') || !existsSync(dir)) return;
  const log = server.config.logger;
  const bun = process.versions.bun ? process.execPath : 'bun';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let again = false;
  const run = () => {
    if (running) {
      again = true;
      return;
    }
    running = true;
    const child = spawn(bun, [resolve(APP_DIR, 'scripts/index-brain.ts')], {
      cwd: APP_DIR,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', chunk => {
      output += String(chunk);
    });
    child.stderr.on('data', chunk => {
      output += String(chunk);
    });
    child.on('error', error => {
      running = false;
      log.error(`[brain] could not start the indexer: ${error.message}`);
    });
    child.on('close', code => {
      running = false;
      const summary = output
        .split(/\r?\n/)
        .filter(line =>
          /^(Wrote|Unchanged|Index is|  reused|  warn)/.test(line),
        )
        .join('\n  ');
      if (code === 0) {
        log.info(`[brain] re-indexed ${dir}\n  ${summary}`, {timestamp: true});
        server.ws.send({type: 'custom', event: 'brain:updated'});
      } else {
        log.error(`[brain] indexing failed (exit ${code}):\n${output}`);
      }
      if (again) {
        again = false;
        schedule();
      }
    });
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, WATCH_DEBOUNCE_MS);
  };
  const onFile = (file: string) => {
    if (file.startsWith(dir + sep) && file.toLowerCase().endsWith('.md')) {
      schedule();
    }
  };
  server.watcher.add(dir);
  server.watcher.on('add', onFile);
  server.watcher.on('change', onFile);
  server.watcher.on('unlink', onFile);
  log.info(`[brain] watching ${dir} for note changes`, {timestamp: true});
  run();
}

function brainSearch(): Plugin {
  let outDir = resolve(APP_DIR, 'dist');
  let building = false;
  return {
    name: 'brain-search',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
      building = config.command === 'build';
    },
    configureServer(server) {
      server.middlewares.use('/local', localBrain);
      watchBrain(server);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/local', localBrain);
      // Serve pre-rendered pages for clean URLs, like Firebase does:
      // /setup -> dist/setup/index.html. Unknown paths fall back to index.html.
      server.middlewares.use((req, _res, next) => {
        const [path = '/', query] = (req.url ?? '/').split('?');
        const clean = path.replace(/\/+$/, '');
        if (clean && !/\.[a-z0-9]+$/i.test(clean)) {
          const page = resolve(outDir, `.${decodeURI(clean)}`, 'index.html');
          if (page.startsWith(outDir) && existsSync(page)) {
            req.url = `${clean}/index.html${query ? `?${query}` : ''}`;
          }
        }
        next();
      });
    },
    closeBundle() {
      if (!building || !existsSync(resolve(outDir, 'index.html'))) return;
      const count = prerender(APP_DIR, outDir);
      console.log(`Pre-rendered ${count} pages into ${outDir}`);
    },
  };
}

export default defineConfig({
  plugins: [brainSearch()],
  // Local only: personal brains are served at /local/, so never listen on
  // other interfaces unless someone passes --host on purpose.
  server: {host: '127.0.0.1'},
  preview: {host: '127.0.0.1'},
  // Transformers.js ships its own ONNX runtime loader; pre-bundling breaks it.
  optimizeDeps: {exclude: ['@huggingface/transformers']},
  build: {target: 'esnext', chunkSizeWarningLimit: 1200},
  worker: {format: 'es'},
});
