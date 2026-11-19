---
title: FetchMoji (emoji-search)
tags: [concept, project, semantic-search, embeddings, in-browser, transformers-js]
source:
  - https://github.com/ThatGuySam/emoji-search
updated: 2026-11-18
---

# FetchMoji (emoji-search)

FetchMoji is an open-source emoji finder that runs semantic search entirely in the browser.

- README: "Find the perfect emoji using your own words. All ranking and inference run fully client‑side (No API Keys, no telemetry)." Site: fetchmoji.com. Repo: ThatGuySam/emoji-search.
- Stack: Astro + React, PGlite (Postgres in WASM) with pgvector in the browser, and [Transformers.js](../products/transformers-js.md) running the Xenova `gte-small` ONNX embedding model.
- Uses WebAssembly SIMD, threads when the page is cross-origin isolated, and WebGPU when available.
- The vector table is prebuilt and packed into a tarball that PGlite restores at runtime. Source data: about 3k core emoji plus curated synonyms and verb-to-emoji hints.
- Embedding work runs in a web worker off the main thread; the target is under 100 ms from keystroke to results. It works offline after first load.
- Shows the same idea as this brain's search: embed text once, then compare query vectors locally. See [Embeddings and semantic search](embeddings-and-semantic-search.md).

## Sources

- [ThatGuySam/emoji-search (GitHub)](https://github.com/ThatGuySam/emoji-search)
