---
title: "The checkable-dashboard skill"
tags: [skill, dashboard, ai, agent-skills, gdg]
source:
  - https://github.com/techlahoma/techlahoma-google-group/blob/main/.agents/skills/checkable-dashboard/SKILL.md
  - https://wit-demos.web.app/dashboard/
updated: 2026-11-20
---

# The checkable-dashboard skill

An [agent skill](agent-skills.md) from the [November 19, 2026 meetup](../events/google-dev-x-women-in-tech-2026-11-19.md) that makes an AI build a one-screen dashboard whose numbers a person can check.

- What it makes the AI do: state what the dashboard answers, compute every number from the rows with code, show one screen with the answer first, and hand you three checks to run.
- The three checks: count one total yourself, change one input and predict what moves, and open one source record.
- Why: a wrong number on a good-looking page is the failure people miss.
- Install in Google Antigravity, Claude Code, or Codex, from your project folder: `npx skills add techlahoma/techlahoma-google-group --skill checkable-dashboard`.
- No terminal: open the skill file, copy all of it, and paste it into a new Gemini, ChatGPT, or Claude chat.
- Try it on made-up data first. The [dashboard demo](https://wit-demos.web.app/dashboard/) has a sample ticket export.

## Sources

- [checkable-dashboard skill file](https://github.com/techlahoma/techlahoma-google-group/blob/main/.agents/skills/checkable-dashboard/SKILL.md)
- [Dashboard demo from the Nov 19, 2026 meetup](https://wit-demos.web.app/dashboard/)
