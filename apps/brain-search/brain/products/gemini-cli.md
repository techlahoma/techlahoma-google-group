---
title: Gemini CLI
tags: [product, google, gemini, cli, ai-agents, context-files]
source:
  - https://github.com/google-gemini/gemini-cli
  - https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md
  - https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/
  - https://agents.md/
updated: 2026-11-18
---

# Gemini CLI

Gemini CLI is Google's open-source (Apache-2.0) terminal AI agent, now aimed at enterprise Gemini Code Assist users.

- Repo description: "An open-source AI agent that brings the power of Gemini directly into your terminal." Install with `npx @google/gemini-cli` or `npm install -g @google/gemini-cli`.
- **Status change (as of 2026-11-18):** the README says free individual access and Google AI Pro / Ultra moved to Antigravity CLI on June 18, 2026. Gemini CLI remains for Gemini Code Assist Standard / Enterprise, Code Assist for GitHub, and paid API keys. See [Google Antigravity](google-antigravity.md).
- **GEMINI.md context files:** the docs say context files "use the default name `GEMINI.md`" and give the model project instructions, personas or style guides, so you don't repeat them in every prompt.
- Load order: a global `~/.gemini/GEMINI.md`, then `GEMINI.md` files in workspace directories and their parents, then "just-in-time" files found when a tool touches a directory. Contents are concatenated and sent with every prompt.
- `/memory show` prints the combined context; `/memory reload` re-scans. Large files can import others with `@file.md` syntax.
- The agents.md site lists Gemini CLI among tools that support [AGENTS.md](../notes/agents-md.md).

## Sources

- [google-gemini/gemini-cli (GitHub)](https://github.com/google-gemini/gemini-cli)
- [Provide context with GEMINI.md files](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md)
- [An important update: Transitioning Gemini CLI to Antigravity CLI](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)
- [AGENTS.md](https://agents.md/)
