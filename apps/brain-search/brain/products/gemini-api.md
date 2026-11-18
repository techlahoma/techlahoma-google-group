---
title: Gemini API
tags: [product, google, gemini, api, llm]
source:
  - https://aistudio.google.com/docs
updated: 2026-11-18
---

# Gemini API

The Gemini API is Google's developer API for Gemini models and managed agents.

- The docs landing page ("Welcome to Gemini API") says: "Go from a quick prompt to production apps and agents with the Gemini API." The old ai.google.dev/gemini-api/docs URL now redirects to aistudio.google.com/docs (checked 2026-11-18).
- SDKs and interfaces shown: Python, JavaScript, REST, Java, Go and a CLI.
- Models named on the page as of 2026-11-18 include Gemini 4 Carbon (`gemini-4-carbon`, 1M-token context), Gemini 4 Hydrogen (`gemini-4-hydrogen`), Gemini Decision 1, Gemini 3.8 Flash TTS and Nano Banana 2.1 (image generation). Model names change often.
- API keys are created in [Google AI Studio](google-ai-studio.md) (aistudio.google.com/apikey). The REST example reads `GEMINI_API_KEY` and sends it in the `x-goog-api-key` header.
- The page says "the Interactions API has become our default interface as of June 2026" and "the `generateContent` API is now considered legacy." The Python quickstart calls `client.interactions.create()`.
- Open-weight alternative: [Gemma](gemma.md).

## Sources

- [Welcome to Gemini API](https://aistudio.google.com/docs)
