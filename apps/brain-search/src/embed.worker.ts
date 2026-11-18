/**
 * Query embedding off the main thread, so typing never waits on the model.
 * Messages in:  {type: 'init', model, dtype} | {type: 'embed', id, text}
 * Messages out: {type: 'ready'} | {type: 'failed', error} |
 *               {type: 'vector', id, vector} | {type: 'embed-error', id, error}
 */
import type {FeatureExtractionPipeline} from '@huggingface/transformers';

export type WorkerRequest =
  | {type: 'init'; model: string; dtype: string}
  | {type: 'embed'; id: number; text: string};

export type WorkerResponse =
  | {type: 'ready'}
  | {type: 'failed'; error: string}
  | {type: 'vector'; id: number; vector: Float32Array}
  | {type: 'embed-error'; id: number; error: string};

interface WorkerScope {
  postMessage(message: WorkerResponse, transfer: Transferable[]): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<WorkerRequest>) => void,
  ): void;
}

const scope = self as unknown as WorkerScope;
let extractor: Promise<FeatureExtractionPipeline> | null = null;

function post(message: WorkerResponse, transfer: Transferable[] = []): void {
  scope.postMessage(message, transfer);
}

scope.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  if (message.type === 'init') {
    extractor ??= (async () => {
      const {pipeline, env} = await import('@huggingface/transformers');
      env.allowLocalModels = false;
      // Cache Storage keeps the model, so repeat visits load instantly.
      // The Cache API exists only in secure contexts (HTTPS or localhost).
      // On plain-HTTP LAN or tailnet URLs, load without caching instead of failing.
      env.useBrowserCache = typeof caches !== 'undefined';
      return pipeline('feature-extraction', message.model, {
        dtype: message.dtype as 'q8',
      }) as Promise<FeatureExtractionPipeline>;
    })();
    extractor.then(
      () => post({type: 'ready'}),
      (error: unknown) => {
        extractor = null;
        post({type: 'failed', error: String(error)});
      },
    );
    return;
  }
  if (message.type === 'embed') {
    if (!extractor) {
      post({type: 'embed-error', id: message.id, error: 'not initialized'});
      return;
    }
    void extractor
      .then(run => run(message.text, {pooling: 'mean', normalize: true}))
      .then(
        output => {
          const vector = Float32Array.from(output.data as Float32Array);
          post({type: 'vector', id: message.id, vector}, [vector.buffer]);
        },
        (error: unknown) =>
          post({type: 'embed-error', id: message.id, error: String(error)}),
      );
  }
});
