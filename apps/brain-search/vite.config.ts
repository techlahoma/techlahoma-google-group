import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {defineConfig, type Connect, type Plugin} from 'vite';
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
  // Transformers.js ships its own ONNX runtime loader; pre-bundling breaks it.
  optimizeDeps: {exclude: ['@huggingface/transformers']},
  build: {target: 'esnext', chunkSizeWarningLimit: 1200},
  worker: {format: 'es'},
});
