# Brain: agent contract

This folder is a **brain**: a plain-Markdown memory that any AI agent can read
and write. Follow these rules whenever you work in or with this folder. They
work in Antigravity, Codex, Claude Code, Gemini CLI, the ChatGPT and Claude
desktop apps, and as pasted instructions in any web chat.

## Layout

- `index.md`: links to every note, grouped by folder. Links only, no prose.
- One topic per file, in a topic folder: `people/`, `orgs/`, `events/`,
  `meetings/`, `products/`, `notes/`. Create a new folder only when no folder fits.
- File names are lowercase kebab-case: `orgs/gdg-tulsa.md`. Meetings start with
  the date: `meetings/2026-11-03-team-sync.md`.
- Skills live in `.agents/skills/<name>/SKILL.md`: `brain-recall`,
  `brain-capture`, `brain-seed-from-meetings`.

## Note format

```markdown
---
title: GDG Tulsa
tags: [org, tulsa, community]
source:
  - https://example.org/page-you-read
updated: 2026-11-18
---

# GDG Tulsa

One-sentence summary.

- Facts, each one backed by a source below.
- Links to related notes: [Techlahoma](../orgs/techlahoma.md)

## Sources

- [Page title](https://example.org/page-you-read)
```

- `source` lists where each fact came from: URLs, or for private material a
  short pointer such as `meeting: 2026-11-03 team sync`.
- `sample: true` marks fictional demo notes. Never treat them as facts.

## Recall: search before you answer

1. Read `index.md` and open the notes whose titles or folders match the question.
2. Search the folder for the key words and their synonyms (grep, file search,
   or the Brain Search page at `http://localhost:5173/#/search?q=...`).
3. Answer from the notes and cite their paths, for example `(orgs/techlahoma.md)`.
4. If the brain has nothing relevant, say so plainly, then answer from other
   sources and cite them.

## Capture: write down what is worth keeping

Capture when you learn something durable: a fact with a source, a decision, a
preference, a person's public role, a follow-up, a correction.

1. Search first. If a note on the topic exists, **update it**; never create a
   duplicate. Merge new facts in and bump `updated`.
2. Otherwise create one new file in the right folder, using the note format.
3. Add a link to `index.md` under the right heading, sorted by title.
4. Tell the user which files you created or changed.

## Rules

- Never invent facts, dates, quotes, names or URLs. If you can't source it,
  leave it out or mark it `TODO: verify`.
- Keep private material private: no passwords, keys, health or money details,
  or other people's contact details unless the user explicitly asks.
- Do not make the brain public. If it lives in a GitHub repo, keep the repo private.
- Prefer short notes. Split a note when it covers two topics.
- After changing notes, rebuild the search index if Brain Search is set up:
  `bun run --cwd apps/brain-search index` (or `BRAIN_DIR=<this folder> bun run index`).
