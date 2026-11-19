# Brain: how to use this memory

This folder is a **brain**: plain Markdown notes that an AI agent reads before
it answers and writes to when it learns something worth keeping. Follow these
rules whenever you work in or with this folder.

## The loop (every conversation)

1. **Recall** before answering: read `index.md`, open the notes that match,
   answer from them, and cite the note paths.
2. **Capture** after learning something durable: update a note or create one,
   and keep `index.md` current.
3. **Tell the user** which notes you read or changed.

## Layout

- `index.md`: a link to every note, grouped by folder. Links only.
- One topic per file, in a topic folder: `events/`, `orgs/`, `people/`,
  `work/`, `notes/`. Add a folder only when none fits.
- File names are lowercase with hyphens: `orgs/gdg-tulsa.md`.

## Note format

```markdown
---
title: GDG Tulsa
tags: [org, tulsa]
source:
  - https://example.org/page-you-read
updated: 2026-11-19
---

# GDG Tulsa

One-sentence summary.

- One fact per line, ending with where it came from. ([source](https://example.org/page-you-read))
- A fact from private notes or a conversation ends like this. (source: my notes, 2026-11-19)
- Related: [Techlahoma](techlahoma.md)
```

- Every fact line ends with its source: a link, or `(source: ...)` for private
  notes and things the user said.
- `source:` at the top lists every source used in the note.
- Add `sample: true` at the top of fictional practice notes.
- Keep notes short. See `notes/brainmaxxing.md` for a finished example.

## Recall: read before you answer

1. Read `index.md`. Open only the notes whose titles match the question.
2. Answer from the notes. After each fact, cite the note path in parentheses,
   for example `(orgs/gdg-tulsa.md)`.
3. If the brain doesn't say, say so plainly. Don't fill the gap from memory.

## Capture: write down what is worth keeping

Capture facts, decisions, preferences, follow-ups and corrections.

1. Search first. If a note on the topic exists, **update it**. Never make a
   duplicate. A correction replaces the old fact; mention what it was before.
2. If no note fits, create one file in the right folder, in the note format,
   and add its link to `index.md` under the right heading.
3. Cite it. For something the user said, end the line with
   `(source: said by the user, YYYY-MM-DD)` and add the same text to `source:`.
4. Set `updated` to today's date.
5. Tell the user which files you created or changed.

## Rules

- Never invent facts, dates, quotes, names or links. If you can't source it,
  leave it out.
- About real people, write only what a source or the user says. Add nothing.
- Keep private things private: no passwords, health or money details, or other
  people's contact details.
- Never make the brain public. In GitHub, keep the repo private.
