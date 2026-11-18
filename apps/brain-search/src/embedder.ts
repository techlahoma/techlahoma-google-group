/**
 * Main-thread client for the embedding worker. `start` begins loading the
 * model as soon as the page opens; `embed` resolves with a query vector.
 */
import type {WorkerRequest, WorkerResponse} from './embed.worker';

export interface Embedder {
  ready: Promise<void>;
  embed(text: string): Promise<Float32Array>;
}

export function startEmbedder(model: string, dtype: string): Embedder {
  const worker = new Worker(new URL('./embed.worker.ts', import.meta.url), {
    type: 'module',
  });
  const pending = new Map<
    number,
    {resolve: (v: Float32Array) => void; reject: (e: Error) => void}
  >();
  let nextId = 1;
  let markReady: () => void = () => {};
  let markFailed: (error: Error) => void = () => {};
  const ready = new Promise<void>((resolve, reject) => {
    markReady = resolve;
    markFailed = reject;
  });
  worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
    const message = event.data;
    if (message.type === 'ready') markReady();
    else if (message.type === 'failed') markFailed(new Error(message.error));
    else if (message.type === 'vector') {
      pending.get(message.id)?.resolve(message.vector);
      pending.delete(message.id);
    } else if (message.type === 'embed-error') {
      pending.get(message.id)?.reject(new Error(message.error));
      pending.delete(message.id);
    }
  });
  worker.addEventListener('error', event => {
    markFailed(new Error(event.message || 'Embedding worker failed'));
  });
  const send = (message: WorkerRequest) => worker.postMessage(message);
  send({type: 'init', model, dtype});
  return {
    ready,
    embed(text: string) {
      const id = nextId++;
      return new Promise<Float32Array>((resolve, reject) => {
        pending.set(id, {resolve, reject});
        send({type: 'embed', id, text});
      });
    },
  };
}
