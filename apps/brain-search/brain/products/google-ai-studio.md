---
title: Google AI Studio
tags: [product, google, gemini, vibe-coding, prototyping]
source:
  - https://aistudio.google.com/docs/aistudio-build-mode.md.txt
  - https://aistudio.google.com/docs
updated: 2026-11-18
---

# Google AI Studio

Google AI Studio is Google's web workspace for trying Gemini models, getting API keys and building apps from prompts.

- It is where developers create [Gemini API](gemini-api.md) keys (aistudio.google.com/apikey), and it now hosts the Gemini API docs.
- **Build mode**: the docs say "AI Studio Build is a platform designed to take you from a simple prompt" to a working Gemini-powered app.
- Default web stack: "A web frontend (React is the default)" plus "A Node.js runtime that allows for secure API calls." For Android it "generates a Kotlin and Jetpack Compose project."
- "AI Studio automatically configures your Gemini API key as a secret in the app's server-side environment," so the key stays out of client code.
- Ship options: deploy to Cloud Run, sync to a new or existing GitHub repository, or download a ZIP (then set `GEMINI_API_KEY` where you host it).
- The docs say core parts of the Antigravity Agent harness power Build mode (see [Google Antigravity](google-antigravity.md)).
- Details as of 2026-11-18; the page mentions a May 14, 2026 cutoff for apps the agent auto-upgrades to server-side keys.

## Sources

- [Build apps in Google AI Studio](https://aistudio.google.com/docs/aistudio-build-mode.md.txt)
- [Welcome to Gemini API](https://aistudio.google.com/docs)
