---
title: Hybrid search
tags: [concept, search, hybrid-search, bm25, embeddings]
source:
  - https://weaviate.io/blog/hybrid-search-explained
updated: 2026-11-18
---

# Hybrid search

Hybrid search runs keyword search and vector search together and merges the results into one ranked list.

- Weaviate's guide: "Hybrid search is a technique that combines multiple search algorithms."
- Keyword side: [BM25](bm25.md) (or BM25F). Vector side: dense [embeddings](embeddings-and-semantic-search.md). Both run in parallel, then results are fused.
- Reciprocal Rank Fusion (RRF) sums reciprocal ranks from each list, so a document ranked well in either list rises.
- Relative score fusion normalizes each list's scores to 0-1 before weighting and adding them (Weaviate's default since v1.24).
- An `alpha` weight sets the balance: near 0 favors keyword, near 1 favors vector, 0.5 is equal (Weaviate's default is 0.75).
- Why it helps: vectors understand meaning (the guide's example reads "catch" as fishing, not baseball), while keyword matching keeps exact terms like "Alaskan Pollock" in play.

## Sources

- [Hybrid Search Explained (Weaviate, Jan 27, 2025)](https://weaviate.io/blog/hybrid-search-explained)
