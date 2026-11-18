---
name: brain-capture
description: Write or update a note in the user's brain (a folder of Markdown notes with an index.md) after learning something durable, such as a sourced fact, a decision, a preference, a person's public role or a follow-up. Use when the user says "remember this", "save this to my brain", "capture that", or at the end of a session that produced new knowledge.
---

# Brain capture

Keep the brain small, sourced and free of duplicates.

## Decide what to capture

Capture durable things: facts with a source, decisions and their reasons,
preferences, corrections, follow-ups with an owner, a person's public role.
Skip small talk, secrets, and anything you can't source.

## Steps

1. **Search first.** Look for an existing note on the topic in `index.md` and by
   searching titles, tags and text. Check spelling variants of names.
2. **Update or create.**
   - Existing note: add the new facts where they fit, keep earlier facts unless
     they are now wrong (then correct them and say why), add the new source,
     and set `updated` to today.
   - New note: create one file in the right folder (`people/`, `orgs/`,
     `events/`, `meetings/`, `products/`, `notes/`), lowercase kebab-case name.
3. **Use the note format** from the brain's `AGENTS.md`:
   frontmatter with `title`, `tags`, `source`, `updated`; a `# Title`; a
   one-sentence summary; short bullet facts; related-note links; `## Sources`.
4. **Update `index.md`**: add a link under the folder's heading, sorted by title.
   Links only.
5. **Report back**: list the files you created or changed, in one line each.
6. **Re-index.** If the local search page is running in watch mode
   (`BRAIN_DIR=... bun run dev`), it re-indexes by itself. Otherwise run the
   line the indexer printed last time, or fill this in with absolute quoted
   paths (always set `BRAIN_DIR` to this brain):

   ```sh
   BRAIN_DIR="/absolute/path/to/this/brain" bun run --cwd "/absolute/path/to/techlahoma-google-group/apps/brain-search" index
   ```
7. **Sync.** Git repo: commit the changed notes (`brain: update people/ada.md`)
   and push; ask before the first push, never make the repo public. Drive or
   OneDrive: a synced folder uploads by itself; through a connector, write the
   files back. No write access: give the user the note text, its path and the
   `index.md` line to save, or suggest an agent that can write (Codex, Claude
   Code, Antigravity, a desktop app).

## Rules

- Never invent facts, dates, quotes or URLs. Unsourced claims get `TODO: verify`
  or stay out.
- One topic per file. If a note grows two topics, split it and link them.
- Keep other people's private details (contact info, health, money) out unless
  the user explicitly asks.
- A read-only connector or web chat can't write files: give the user the
  finished note text and the exact path to save it at, plus the line to add to
  `index.md`.
