#!/usr/bin/env bun
// Talk dashboard demo: a local MCP server that drives the dashboard page open in your browser.
//   1. Speaks MCP over stdio (JSON-RPC), so Antigravity, Claude Code or Codex get the tools below.
//   2. Serves web/ on http://127.0.0.1:4820 with a WebSocket. Tool calls are forwarded to the
//      open page, which recounts and redraws. The transcript stays on this computer.
// Bun built-ins only, no packages. Adapted from demos/mail/mcp.ts.
// Run by hand (page only): bun demos/talk-dashboard/mcp.ts --serve
// Options: --port=4820 (or TALK_PORT), --serve (keep running without an MCP client).
// If a tool is called while no page is open, the server opens the dashboard in your browser.
// TALK_NO_OPEN=1 turns that off.

import { existsSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';

const WEB_DIR = join(import.meta.dir, 'web');
const DEMO_DIR = import.meta.dir;
const MAX_FILE_BYTES = 2_000_000;
const HOST = '127.0.0.1';
const argv = process.argv.slice(2);
const portArg = argv.find((a) => a.startsWith('--port='));
const FIRST_PORT = Number(portArg?.split('=')[1] ?? process.env.TALK_PORT ?? 4820);
const PORT_TRIES = 10;
const SERVE_ONLY = argv.includes('--serve');
const SERVER_NAME = 'talk-dashboard-demo';
const CALL_TIMEOUT_MS = 20_000;
const PAGE_WAIT_MS = 2_500;
const PAGE_OPEN_WAIT_MS = 15_000; // after this server opens the browser itself

const log = (...parts: unknown[]) => console.error('[talk]', ...parts);

// ---------------------------------------------------------------- tools

const TOOLS = [
  {
    name: 'update_dashboard',
    description:
      'Replace the transcript on the dashboard with this text and recount everything. Pass the transcript exactly as given. Returns the counts; read numbers from the result, never count yourself.',
    inputSchema: { type: 'object', properties: { transcript: { type: 'string', description: 'The whole transcript so far.' } }, required: ['transcript'] },
  },
  {
    name: 'load_transcript_file',
    description:
      'Fastest way to update: read a transcript from a text file on this computer and put it on the dashboard. Use this when the transcript is already saved in a file, so you do not have to repeat its text.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Path to a .txt or .md file. Default: transcript.txt next to this server.' } },
    },
  },
  {
    name: 'add_to_transcript',
    description: 'Add more text to the end of the transcript on the dashboard and recount. Returns the counts.',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
  },
  {
    name: 'get_dashboard',
    description: 'Read the current counts: words, minutes, watch words, themes the audience asked for, and worries.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_lines',
    description: 'List the transcript lines behind one number. Pass a watch word or a theme label exactly as get_dashboard shows it, for example "women" or "Email".',
    inputSchema: { type: 'object', properties: { label: { type: 'string' } }, required: ['label'] },
  },
  {
    name: 'add_watch_word',
    description: 'Start counting another word or short phrase on the dashboard (whole words, any case). Returns its count so far.',
    inputSchema: { type: 'object', properties: { word: { type: 'string', description: 'For example "dashboard".' } }, required: ['word'] },
  },
  {
    name: 'load_sample',
    description: 'Put the made-up practice transcript on the dashboard. Its known answers are in TEST.md.',
    inputSchema: { type: 'object', properties: {} },
  },
];
const TOOL_NAMES = new Set(TOOLS.map((t) => t.name));

// ---------------------------------------------------------------- bridge to the page

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> };
type Socket = { send(data: string): unknown; close(): unknown };

let port = 0; // the port this process listens on (0 = not listening)
let peerPort = 0; // another running copy of this server, which owns the page
const pages: Socket[] = [];
const pending = new Map<string, Pending>();
let nextCall = 1;

const url = () => `http://${HOST}:${port || peerPort || FIRST_PORT}`;
const openFirst = () => `Open ${url()} in your browser first, then try again. The dashboard lives in that page.`;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function isLocalHost(req: Request): boolean {
  const host = (req.headers.get('host') ?? '').replace(/:\d+$/, '');
  return host === '127.0.0.1' || host === 'localhost';
}

function isOwnOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin GETs and non-browser clients send none
  try {
    const u = new URL(origin);
    return (u.hostname === '127.0.0.1' || u.hostname === 'localhost') && Number(u.port) === port;
  } catch {
    return false;
  }
}

function callPage(tool: string, args: unknown, silent = false): Promise<unknown> {
  const page = pages[pages.length - 1];
  if (!page) return Promise.reject(new Error(openFirst()));
  const id = String(nextCall++);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`The page at ${url()} did not answer. Reload it and try again.`));
    }, CALL_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    page.send(JSON.stringify({ id, tool, args: args ?? {}, silent }));
  });
}

let lastOpen = 0;

/** No page is connected: open the inbox in the system browser (at most once every 30 seconds). */
function openBrowser(): boolean {
  if (process.env.TALK_NO_OPEN === '1' || Date.now() - lastOpen < 30_000) return false;
  lastOpen = Date.now();
  const target = url();
  const cmd = process.env.TALK_OPEN_CMD
    ? [process.env.TALK_OPEN_CMD, target]
    : process.platform === 'darwin'
      ? ['open', target]
      : process.platform === 'win32'
        ? ['cmd', '/c', 'start', '', target]
        : ['xdg-open', target];
  try {
    Bun.spawn(cmd, { stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' });
    log('No page was open, so I opened', target);
    return true;
  } catch (error) {
    log('Could not open a browser:', (error as Error).message);
    return false;
  }
}

async function waitForPage(): Promise<void> {
  if (pages.length > 0) return;
  const opened = openBrowser();
  const until = Date.now() + (opened ? PAGE_OPEN_WAIT_MS : PAGE_WAIT_MS);
  while (pages.length === 0 && Date.now() < until) await Bun.sleep(100);
}

function listen(tryPort: number): boolean {
  try {
    Bun.serve({
      hostname: HOST,
      port: tryPort,
      async fetch(req, server) {
        if (!isLocalHost(req)) return new Response('Local only', { status: 403 });
        const { pathname } = new URL(req.url);

        if (pathname === '/__talk/ws') {
          if (!isOwnOrigin(req)) return new Response('Forbidden', { status: 403 });
          return server.upgrade(req) ? undefined : new Response('Expected a WebSocket', { status: 400 });
        }
        if (pathname === '/__talk/ping') {
          return Response.json({ server: SERVER_NAME, port: tryPort, pages: pages.length });
        }
        if (pathname === '/__talk/call' && req.method === 'POST') {
          // Used by a second copy of this server (and check.ts) so every MCP client shares one page.
          if (req.headers.get('origin')) return new Response('Forbidden', { status: 403 });
          try {
            const { tool, args, silent } = (await req.json()) as { tool: string; args: unknown; silent?: boolean };
            if (!TOOL_NAMES.has(tool)) return Response.json({ ok: false, error: `Unknown tool: ${tool}` });
            await waitForPage();
            return Response.json({ ok: true, result: await callPage(tool, args, silent === true) });
          } catch (error) {
            return Response.json({ ok: false, error: (error as Error).message });
          }
        }

        // Static files from web/.
        const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
        // The page asks for ../topics.json and ../sample/; they live one folder above web/.
        const shared = rel === 'topics.json' || rel.startsWith('sample/');
        const root = shared ? DEMO_DIR : WEB_DIR;
        const file = normalize(join(root, rel));
        if (file !== root && !file.startsWith(root + sep)) return new Response('Not found', { status: 404 });
        if (!existsSync(file)) return new Response('Not found', { status: 404 });
        const ext = file.slice(file.lastIndexOf('.'));
        return new Response(Bun.file(file), {
          headers: { 'content-type': TYPES[ext] ?? 'application/octet-stream', 'cache-control': 'no-store' },
        });
      },
      websocket: {
        open(ws) {
          pages.push(ws);
          log(`page connected (${pages.length})`);
        },
        close(ws) {
          const i = pages.indexOf(ws);
          if (i >= 0) pages.splice(i, 1);
          log(`page disconnected (${pages.length})`);
        },
        message(_ws, raw) {
          let msg: { id?: string; ok?: boolean; result?: unknown; error?: string };
          try {
            msg = JSON.parse(String(raw));
          } catch {
            return;
          }
          const waiting = msg.id ? pending.get(msg.id) : undefined;
          if (!waiting) return;
          pending.delete(msg.id as string);
          clearTimeout(waiting.timer);
          if (msg.ok) waiting.resolve(msg.result);
          else waiting.reject(new Error(msg.error ?? 'The page reported an error.'));
        },
      },
    });
    port = tryPort;
    peerPort = 0;
    return true;
  } catch {
    return false;
  }
}

async function isPeer(tryPort: number): Promise<boolean> {
  try {
    const res = await fetch(`http://${HOST}:${tryPort}/__talk/ping`, { signal: AbortSignal.timeout(800) });
    const body = (await res.json()) as { server?: string };
    return body.server === SERVER_NAME;
  } catch {
    return false;
  }
}

/** Listen on the first free port, or attach to a copy of this server that is already running. */
async function ensureBridge(): Promise<void> {
  if (port) return;
  if (peerPort && (await isPeer(peerPort))) return;
  peerPort = 0;
  for (let p = FIRST_PORT; p < FIRST_PORT + PORT_TRIES; p++) {
    if (listen(p)) {
      log(`dashboard page: http://${HOST}:${p}`);
      return;
    }
    if (await isPeer(p)) {
      peerPort = p;
      log(`sharing the dashboard page already served at http://${HOST}:${p}`);
      return;
    }
  }
  throw new Error(`No free port between ${FIRST_PORT} and ${FIRST_PORT + PORT_TRIES - 1}.`);
}

/** Read a transcript file here, so the agent does not have to repeat the text, then hand it to the page. */
async function fileToTranscript(args: unknown): Promise<{ transcript: string }> {
  const given = String((args as { path?: string } | null)?.path ?? '').trim();
  const path = given ? (given.startsWith('~/') ? join(process.env.HOME ?? '', given.slice(2)) : given) : join(DEMO_DIR, 'transcript.txt');
  if (!/\.(txt|md)$/i.test(path)) throw new Error('Pass a .txt or .md file.');
  if (!existsSync(path)) throw new Error(`No file at ${path}. Save the transcript there first, or use update_dashboard with the text.`);
  const file = Bun.file(path);
  if (file.size > MAX_FILE_BYTES) throw new Error('That file is larger than 2 MB.');
  return { transcript: await file.text() };
}

async function runTool(tool: string, args: unknown): Promise<unknown> {
  if (tool === 'load_transcript_file') {
    args = await fileToTranscript(args);
    tool = 'update_dashboard';
  }
  await ensureBridge();
  if (port) {
    await waitForPage();
    return callPage(tool, args);
  }
  const res = await fetch(`http://${HOST}:${peerPort}/__talk/call`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tool, args }),
  });
  const body = (await res.json()) as { ok: boolean; result?: unknown; error?: string };
  if (!body.ok) throw new Error(body.error ?? 'The dashboard page reported an error.');
  return body.result;
}

// ---------------------------------------------------------------- MCP over stdio

const PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const DEFAULT_PROTOCOL = '2025-06-18';

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

function send(message: unknown): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handle(msg: Rpc): Promise<void> {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;
  const reply = (result: unknown) => isRequest && send({ jsonrpc: '2.0', id, result });
  const fail = (code: number, message: string) => isRequest && send({ jsonrpc: '2.0', id, error: { code, message } });

  switch (method) {
    case 'initialize': {
      const asked = String(params?.protocolVersion ?? '');
      reply({
        protocolVersion: PROTOCOLS.includes(asked) ? asked : DEFAULT_PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, title: 'Talk dashboard (demo)', version: '1.0.0' },
        instructions: `A dashboard of a talk, counted by code from its transcript. It lives in a browser page at ${url()}; the server opens that page when you first use a tool. Read numbers from tool results; never count words yourself. The transcript stays on this computer.`,
      });
      return;
    }
    case 'ping':
      reply({});
      return;
    case 'tools/list':
      reply({ tools: TOOLS });
      return;
    case 'resources/list':
      reply({ resources: [] });
      return;
    case 'resources/templates/list':
      reply({ resourceTemplates: [] });
      return;
    case 'prompts/list':
      reply({ prompts: [] });
      return;
    case 'tools/call': {
      const name = String(params?.name ?? '');
      if (!TOOL_NAMES.has(name)) {
        fail(-32602, `Unknown tool: ${name}`);
        return;
      }
      try {
        const result = await runTool(name, params?.arguments ?? {});
        reply({ content: [{ type: 'text', text: JSON.stringify(result) }], isError: false });
      } catch (error) {
        reply({ content: [{ type: 'text', text: (error as Error).message }], isError: true });
      }
      return;
    }
    default:
      if (isRequest) fail(-32601, `Method not found: ${method}`);
  }
}

async function readStdin(): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of Bun.stdin.stream()) {
    buffer += decoder.decode(chunk, { stream: true });
    let newline = buffer.indexOf('\n');
    while (newline >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf('\n');
      if (!line) continue;
      let msg: Rpc;
      try {
        msg = JSON.parse(line);
      } catch {
        send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
        continue;
      }
      // Not awaited: slow tool calls must not block the next message.
      handle(msg).catch((error) => log('handler error', error));
    }
  }
}

await ensureBridge().catch((error) => log((error as Error).message));
if (SERVE_ONLY) {
  log(`serving only. Open ${url()} (Ctrl+C to stop)`);
} else {
  await readStdin();
  process.exit(0); // the MCP client closed stdin: stop and free the port
}
