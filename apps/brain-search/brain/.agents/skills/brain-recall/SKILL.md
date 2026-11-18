---
name: brain-recall
description: Search the user's brain (a folder of Markdown notes with an index.md) before answering a question about people, organizations, events, meetings, decisions or anything the user may have noted before. Use when the user asks "what do I know about...", "check my brain", or any question the brain might answer.
---

# Brain recall

Answer from the user's own notes first, and show where each answer came from.

## Find the brain

Use the first one that exists: the folder the user named; a `brain/` folder in
the current workspace; `~/Brain`; or a connected source the user set up
(a private GitHub repo, Google Drive or OneDrive folder, or project files).
If you can't reach any, ask the user where the brain lives. Don't guess.

## Steps

1. Read `index.md`. Pick the notes whose titles or folders match the question.
2. Search all notes for the key words, names and synonyms. Include `tags` and
   `title` lines.
3. Open the best 3-8 notes and read them in full.
4. Answer in plain language. After each fact, cite the note path, e.g.
   `(orgs/gdg-tulsa.md)`. Mention the note's own source URL when the user
   needs to verify.
5. Notes with `sample: true` are fictional demo data: say so if you use them.
6. If the brain has no answer, say "Your brain doesn't have this yet", then
   answer from other sources with citations, and offer to capture the answer
   (see the `brain-capture` skill).

## Don't

- Don't present a guess as something the brain says.
- Don't edit notes during recall unless the user asks; suggest a capture instead.
