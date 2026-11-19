---
title: AGENTS.md
tags: [concept, ai-agents, context-files, convention]
source:
  - https://agents.md/
updated: 2026-11-18
---

# AGENTS.md

AGENTS.md is an open Markdown file convention for giving coding agents project instructions, "a README for agents."

- Typical contents: setup and build commands, test instructions, code style, PR or commit rules, security notes and deployment steps. No sections are required.
- A README is for human contributors; AGENTS.md holds agent-focused detail that would clutter a README.
- Monorepos can put an AGENTS.md in each subproject. Agents read the nearest file in the directory tree, and explicit user prompts override all AGENTS.md files.
- The site says over 60k open-source projects use it (checked 2026-11-18).
- Supporting tools listed include OpenAI Codex, Google Jules, Cursor, Aider, goose, opencode, Zed, Warp, VS Code, Devin, JetBrains Junie, Amp, RooCode, [Gemini CLI](../products/gemini-cli.md), GitHub Copilot's coding agent, Windsurf and Augment Code.
- The format is now stewarded by the Agentic AI Foundation under the Linux Foundation.
- Related: Gemini CLI's own `GEMINI.md` context files, [Agent Skills](agent-skills.md), [Brainmaxxing](brainmaxxing.md).

## Sources

- [AGENTS.md](https://agents.md/)
