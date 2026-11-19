# Brain: agent contract

This folder is a **brain**: a plain-Markdown memory that every AI agent the
user works with reads as context **and writes back to**. Follow these rules
whenever you work in or with this folder. They work in Antigravity, Codex,
Claude Code, Gemini CLI, the ChatGPT and Claude desktop apps, and as pasted
instructions in any web chat.

## The loop (every session)

1. **Recall** before answering: search the brain and cite note paths.
2. **Capture** after learning something durable: update or create a note,
   update `index.md`.
3. **Re-index** so the local search page sees the change (or rely on watch
   mode, see below).
4. **Sync**: if the brain is a Git repo, commit (and push); if it is a Google
   Drive or OneDrive folder, save the files there. Ask the user before the
   first push or upload, then follow their answer.
5. **Tell the user** which notes you changed.

If you can only read (a read-only connector or a chat with no file access),
still do steps 1 and 2: write the finished note in your reply with its exact
path and the `index.md` line, and ask the user to save it or hand it to an
agent that can write.

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
   or the local Brain Search page at `http://localhost:5173/search?q=...`).
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

## Re-index and sync

- **Watch mode:** if the user started the search page with
  `BRAIN_DIR="..." bun run --cwd ".../apps/brain-search" dev`, it re-indexes
  by itself a moment after notes change and the open page refreshes. Nothing
  else to do.
- **Otherwise** re-index by hand. Use absolute, quoted paths, and always set
  `BRAIN_DIR` to this brain (without it, the bundled example brain is indexed
  instead):

  ```sh
  BRAIN_DIR="/absolute/path/to/this/brain" bun run --cwd "/absolute/path/to/techlahoma-google-group/apps/brain-search" index
  ```

  The indexer prints this exact line, already filled in, at the end of every
  run: copy that one.
- **Git repo:** `git add` the notes you changed, commit with a short message
  (`brain: add orgs/gdg-tulsa`), and push. Ask before the first push. Never
  make the repo public.
- **Google Drive / OneDrive folder:** a synced folder on disk uploads by
  itself; through a connector, write the changed files back. If the connector
  can't write, give the user the note text and path to save.
- The search page runs only on the user's computer (localhost). Never deploy
  or publish it, or the index, anywhere.

## Rules

- Never invent facts, dates, quotes, names or URLs. If you can't source it,
  leave it out or mark it `TODO: verify`.
- Keep private material private: no passwords, keys, health or money details,
  or other people's contact details unless the user explicitly asks.
- Do not make the brain public. If it lives in a GitHub repo, keep the repo private.
- Prefer short notes. Split a note when it covers two topics.
- After changing notes, re-index and sync as described above.
