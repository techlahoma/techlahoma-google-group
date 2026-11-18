# Google AI Studio: import the template, or use it as a memory agent

- `Tease:` Bring the finished Brain Search template into AI Studio's Build mode, or use AI Studio to read and write brain notes.
- `Lede:` Build mode documents "Import from GitHub" and two-way GitHub sync, so it can open this repository instead of generating a new page. Whether it runs this monorepo's Vite app in its preview is not confirmed, so there's a fallback.
- `Why it matters:` The UI is done. AI Studio should connect it to your notes, not generate a new search page.
- `Go deeper:` [AI Studio Build mode docs](https://aistudio.google.com/docs/aistudio-build-mode), [setup for every app](SETUP.md), [surface research](../../docs/research/brain-search-ai-surfaces-2026-11-18.md).

## What the official docs say (checked 2026-11-18)

- Build mode imports code with **Import from GitHub**, from the **Add files** (+)
  menu in the prompt box.
- It can connect to a GitHub repository for **two-way sync**: push changes made in
  AI Studio, and pull changes made elsewhere.
- Its default stack is a React frontend with a Node.js runtime. You can edit files
  in the **Code** tab, and **export a ZIP**.
- The docs don't say whether you can import one folder of a repository, whether
  private repos work, or whether it runs `bun` or this app's Vite scripts.
- AI Studio needs a Google sign-in (seen in a test on 2026-11-18).

## Path A: import the template (try this first)

1. Sign in at [aistudio.google.com](https://aistudio.google.com/) and open **Build**.
2. In the prompt box, choose **+ → Import from GitHub** and pick
   `techlahoma/techlahoma-google-group`. Paste this prompt:

```text
This repository contains a finished web app at apps/brain-search: a 2010-style search page over a folder of Markdown notes (a "brain"). Do not redesign, restyle or regenerate the UI. Keep its files as they are.

1. Run apps/brain-search in the preview. It is a Vite + TypeScript app ("vite" dev server, entry apps/brain-search/index.html). If the preview can't run it, tell me exactly why and stop; don't rewrite it as a new app.
2. My notes: I'll upload or paste Markdown files. Put them in apps/brain-search/brain/ (one topic per file, frontmatter with title, tags, source, updated). Then rebuild the search index the way apps/brain-search/README.md describes ("bun run index" in apps/brain-search), or tell me if the index can't be rebuilt here.
3. Follow apps/brain-search/brain/AGENTS.md: search the notes before answering my questions, and write new notes back when I tell you something worth remembering.
```

3. Upload or paste a few of your notes when it asks. If you connected a **private**
   repository for two-way sync, your notes can be pushed there. Never push personal
   notes to the public workshop repository.

If the preview runs, you have the template plus your notes. If it can't run the
app (for example no Bun, or it only previews React apps it generated), use Path B.

## Path B: AI Studio as a memory agent

Use AI Studio chat (or Build) to **read and write brain notes**, and see the page
itself on your computer or at [oogle.web.app](https://oogle.web.app) (the example
brain).

```text
You are my memory agent. I'll paste or upload notes from my "brain" (Markdown files with frontmatter: title, tags, source, updated; one topic per file; an index.md of links).

Read: before answering, look through the notes I gave you and cite their paths. If they don't cover it, say so.
Write: when I share something durable, write the finished note (path, frontmatter, body, sources) and the index.md line to add, so I can save it or have a local agent commit it.
Never invent facts, dates or URLs.
```

## Honest limits

- AI Studio can't read a folder on your computer. Notes reach it by upload,
  paste, or a GitHub repository you connect.
- The real search page runs locally (`bun run --cwd apps/brain-search dev`), so
  nothing private goes online.
