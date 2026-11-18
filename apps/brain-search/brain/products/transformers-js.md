---
title: Transformers.js
tags: [product, hugging-face, javascript, machine-learning, in-browser, embeddings]
source:
  - https://huggingface.co/docs/transformers.js/index
  - https://huggingface.co/Xenova/all-MiniLM-L6-v2
updated: 2026-11-18
---

# Transformers.js

Transformers.js is Hugging Face's JavaScript library for running pretrained ML models in the browser.

- The docs say: "Run 🤗 Transformers directly in your browser, with no need for a server!" It aims to match the Python `transformers` API.
- Models run through ONNX Runtime. In the browser the default is WASM on the CPU; `device: 'webgpu'` uses the GPU (the docs note WebGPU is still experimental in many browsers).
- `dtype` picks precision: `fp32` (default for WebGPU), `fp16`, `q8` (default for WASM) or `q4`.
- Install: `npm i @huggingface/transformers`. The `pipeline()` function bundles a model with pre- and post-processing.
- Embedding example from the Xenova/all-MiniLM-L6-v2 card: `pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')`, then call it with `{ pooling: 'mean', normalize: true }` to get 384-dimension vectors. See [all-MiniLM-L6-v2](all-minilm-l6-v2.md).
- Used by [FetchMoji](../notes/fetchmoji-emoji-search.md) for in-browser semantic search. Background: [Embeddings and semantic search](../notes/embeddings-and-semantic-search.md).

## Sources

- [Transformers.js docs](https://huggingface.co/docs/transformers.js/index)
- [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
