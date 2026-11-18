---
title: Embeddings and semantic search
tags: [concept, embeddings, semantic-search, vectors]
source:
  - https://huggingface.co/blog/getting-started-with-embeddings
  - https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
updated: 2026-11-18
---

# Embeddings and semantic search

An embedding turns text into a list of numbers so a computer can find passages with similar meaning, not just matching words.

- Hugging Face defines an embedding as "a numerical representation of a piece of information, for example, text, documents, images, audio, etc."
- A sentence can become a vector of, for example, 384 numbers. [all-MiniLM-L6-v2](../products/all-minilm-l6-v2.md) produces 384-dimension vectors.
- Semantic search: embed every document once, embed the query, score the query against each document, and return the closest.
- The Hugging Face guide uses cosine similarity by default; dot product is another option. With normalized vectors the two rank results the same way.
- [Transformers.js](../products/transformers-js.md) can compute embeddings in the browser, as [FetchMoji](fetchmoji-emoji-search.md) does.
- Embeddings can miss exact terms such as names or codes, which is why many systems add [BM25](bm25.md) keyword ranking and use [hybrid search](hybrid-search.md).

## Sources

- [Getting Started With Embeddings (Hugging Face, 2022)](https://huggingface.co/blog/getting-started-with-embeddings)
- [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
