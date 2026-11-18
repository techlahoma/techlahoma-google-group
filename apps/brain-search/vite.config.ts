import {defineConfig} from 'vite';

export default defineConfig({
  // Transformers.js ships its own ONNX runtime loader; pre-bundling breaks it.
  optimizeDeps: {exclude: ['@huggingface/transformers']},
  build: {target: 'esnext', chunkSizeWarningLimit: 1200},
  worker: {format: 'es'},
});
