---
title: Agent Skills (SKILL.md format)
tags: [concept, ai-agents, skills, convention]
source:
  - https://agentskills.io/
updated: 2026-11-18
---

# Agent Skills (SKILL.md format)

Agent Skills are an open format for packaging instructions and resources that an AI agent loads on demand.

- agentskills.io: "Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows."
- A skill is a folder with a required `SKILL.md` file. Its frontmatter has at least `name` and `description`, followed by instructions. Optional folders: `scripts/`, `references/`, `assets/`.
- Progressive disclosure in three stages: Discovery (load only each skill's name and description at startup), Activation (read the full `SKILL.md` when a task matches), Execution (follow it, running bundled code or loading files as needed).
- This keeps many skills available with a small context footprint.
- The format was originally developed by Anthropic and released as an open standard; the site says a growing number of agent products have adopted it.
- [Google Antigravity](../products/google-antigravity.md)'s CLI carries over Agent Skills from [Gemini CLI](../products/gemini-cli.md). [GDG Tulsa](../orgs/gdg-tulsa.md) ran [a session on agent skills](../events/gdg-wordpress-put-agent-skills-to-work-2026-10-29.md) in October 2026. [Brainmaxxing](brainmaxxing.md) ships its loop as skills.

## Sources

- [Agent Skills overview](https://agentskills.io/)
