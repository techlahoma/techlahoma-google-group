---
title: all-MiniLM-L6-v2
tags: [product, embedding-model, sentence-transformers, hugging-face]
source:
  - https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
  - https://huggingface.co/Xenova/all-MiniLM-L6-v2
updated: 2026-11-18
---

# all-MiniLM-L6-v2

all-MiniLM-L6-v2 is a small sentence-transformers embedding model for semantic search and clustering.

- The model card says it "maps sentences & paragraphs to a 384 dimensional dense vector space."
- "input text longer than 256 word pieces is truncated," so it suits sentences and short paragraphs.
- Fine-tuned from `nreimers/MiniLM-L6-H384-uncased` on "a 1B sentence pairs dataset"; the card says the total "is above 1 billion sentences."
- License: Apache-2.0. Intended uses: information retrieval, clustering and sentence similarity.
- `Xenova/all-MiniLM-L6-v2` is a port with "ONNX weights to be compatible with Transformers.js," so it runs in the browser with [Transformers.js](transformers-js.md).
- Background: [Embeddings and semantic search](../notes/embeddings-and-semantic-search.md).

## Sources

- [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
