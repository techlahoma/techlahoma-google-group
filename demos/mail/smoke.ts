#!/usr/bin/env bun
// A tiny MCP client for testing mcp.ts by hand: JSON-RPC over stdio, no packages.
// Usage: bun demos/mail/smoke.ts            (lists tools, reads the inbox, saves one draft)
//        bun demos/mail/smoke.ts --no-write (read-only)
// Open the printed address in a browser first, or the tool calls return "Open ... first".
import { join } from 'node:path';

const write = !process.argv.includes('--no-write');
const child = Bun.spawn([process.execPath, join(import.meta.dir, 'mcp.ts')], { stdin: 'pipe', stdout: 'pipe', stderr: 'inherit' });
const waiting = new Map<number, (msg: any) => void>();
let nextId = 1;

(async () => {
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of child.stdout) {
    buffer += decoder.decode(chunk, { stream: true });
    let i = buffer.indexOf('\n');
    while (i >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      i = buffer.indexOf('\n');
      if (!line) continue;
      const msg = JSON.parse(line);
      waiting.get(msg.id)?.(msg);
      waiting.delete(msg.id);
    }
  }
})();

function rpc(method: string, params?: unknown): Promise<any> {
  const id = nextId++;
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  child.stdin.flush();
  return new Promise((resolve) => waiting.set(id, resolve));
}

async function tool(name: string, args: unknown = {}) {
  const started = performance.now();
  const res = await rpc('tools/call', { name, arguments: args });
  const text = res.result?.content?.[0]?.text ?? JSON.stringify(res.error);
  const ms = Math.round(performance.now() - started);
  console.log(`\n${res.result?.isError ? 'ERROR' : 'ok'} ${name} (${ms} ms): ${text.slice(0, 300)}${text.length > 300 ? '…' : ''}`);
  return res.result?.isError ? null : JSON.parse(text);
}

const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke', version: '1' } });
console.log('initialize:', init.result.protocolVersion, init.result.serverInfo.name);
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
const list = await rpc('tools/list');
console.log('tools:', list.result.tools.map((t: { name: string }) => t.name).join(', '));

const inbox = await tool('list_emails');
if (inbox && write) {
  await tool('search_emails', { query: 'Order #2291' });
  await tool('add_label', { ids: ['e10'], label: 'Needs me' });
  await tool('create_draft', {
    to: 'marcus@northgatetitle.example.com',
    subject: 'Re: Order #2291',
    body: 'Hi Marcus,\n\nSmoke test draft. Nothing is sent.\n\nThanks,\nRiley Morgan\nCopperleaf Catering',
    in_reply_to: 'e10',
  });
  await tool('list_emails', { label: 'Drafts' });
}
child.stdin.end();
await child.exited;
