---
title: Brainmaxxing
tags: [concept, agent-memory, markdown, claude-code, obsidian]
source:
  - https://github.com/poteto/brainmaxxing
updated: 2026-11-18
---

# Brainmaxxing

Brainmaxxing is an open-source (MIT) Markdown memory vault and skill set that gives a coding agent persistent memory.

- Repo description: "stupid simple persistent memory and skill improvement." The README calls it "Stupid simple persistent memory for Claude Code."
- How it works: a Markdown vault (`brain/`) that the agent reads at session start and writes to when it learns something. It is also an Obsidian vault, so people can browse the agent's memory.
- Ships with 16 engineering principles as starter content and six skills. Four form a learning loop: `/reflect` (after a session, write lessons to the brain), `/ruminate` (mine past conversations), `/meditate` (audit and prune, improve skills). Two support work: `/plan` and `/review`.
- Two hooks inject the brain index at startup and rebuild it when files change.
- The README says "`/reflect` alone gets you most of the value."
- Install: copy `brain/`, `.agents/skills/`, `.claude/hooks/` and the brain instructions in `CLAUDE.md` into a project.
- Author: [Lauren Tan](../people/lauren-tan.md) (GitHub `poteto`); the repo was created in February 2026.
- Related: [Agent Skills](agent-skills.md), [AGENTS.md](agents-md.md).

## Sources

- [poteto/brainmaxxing (GitHub)](https://github.com/poteto/brainmaxxing)
