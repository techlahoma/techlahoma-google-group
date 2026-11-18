# Brain Search: your own brain + your own Google

- `Tease:` A Markdown memory any AI app can read and write, plus a personal search page that runs in your browser.
- `Lede:` `brain/` holds one-topic-per-file notes with an index and an agent contract; `bun run index` embeds them; `bun run dev` serves a search page that ranks by meaning and keywords and hands weak searches to Antigravity, Gemini, ChatGPT or Claude.
- `Why it matters:` Closing demo for the Techlahoma / GDG Tulsa / Women in Tech workshop on 2026-11-19: everyone leaves with a brain their AI apps share.
- `Go deeper:` [Antigravity prompt](PROMPT.md) · [Setup for every AI app](SETUP.md) (also below and at `/setup` in the app) · [AI Studio demo](AI_STUDIO_PROMPT.md) · [No-install artifact](ARTIFACT_PROMPT.md) · [Seed from meetings](SEED_FROM_MEETINGS.md)

Inspired by [brainmaxxing](https://github.com/poteto/brainmaxxing) by Lauren Tan (a Markdown brain
plus skills, for Claude Code) and by FetchMoji ([ThatGuySam/emoji-search](https://github.com/ThatGuySam/emoji-search),
in-browser embeddings over a precomputed index). This app extends the idea to every major AI app.

## Run it

```sh
bun install                                   # once, from the repository root
bun run --cwd apps/brain-search index         # index the bundled example brain into public/
bun run --cwd apps/brain-search dev           # open the printed address
```

Search your own brain instead of the example one (absolute, quoted paths):

```sh
BRAIN_DIR="$HOME/Brain" BRAIN_LOCATION="~/Brain" BRAIN_OWNER="Sam" bun run --cwd apps/brain-search index
```

A personal brain's index goes to `apps/brain-search/.brain-local/`, which is
gitignored and never built into `dist/`. The dev and preview servers serve it at
`/local/`, and the page uses it ahead of the bundled example (the footer then says
"your brain"). Every run ends by printing the exact re-index command for that
brain. Without `BRAIN_DIR`, the bundled example brain is indexed into `public/`.

| Command | Effect |
|---|---|
| `bun run index` | Read `brain/**/*.md` (or `BRAIN_DIR`), chunk by heading, embed with `Xenova/all-MiniLM-L6-v2` (q8), and write the index into `public/` (or `.brain-local/` for `BRAIN_DIR`). Skips work when nothing changed; output is byte-identical on re-runs. |
| `bun run index:check` | Read-only: exit 1 if the index is older than the brain. |
| `NO_EMBED=1 bun run index` | Keyword (BM25) index only, no model download. |
| `bun run check` | Typecheck, unit tests (including brain lint and index freshness), and a production build that pre-renders every page. |
| `bun run preview` | Serve `dist/` like Firebase does (clean URLs, deep links). |
| `bun run dev` | Vite dev server. |

Other options: `BRAIN_OWNER` (first name for the wordmark), `OUT_DIR`, `BRAIN_MODEL`, `FORCE=1`. The model downloads once into
`apps/brain-search/.cache/models` (gitignored).

## How it works

```text
brain/*.md ──index──> public/brain-index.json   (notes, chunks, BM25 term stats)
                  └─> public/brain-vectors.json (int8 vectors + one scale per chunk, ~60 KB)
browser: page opens ──> fetch both files + start the model in a Web Worker
         query ──worker──> vector ──cosine──┐
         query ──tokens──> BM25 × coverage ─┴─> hybrid rank, best chunk per note
```

- **A 2010 throwback.** The pages look like a 2010 search engine: a beveled serif
  logo, a plain rectangular box, grey gradient buttons, blue underlined titles, green
  `brain/folder/file.md` lines, and grey "Source - Similar" links. Light mode only.
  This is an homage for a Google Developer Group event; it doesn't use Google's logo
  image or fonts and is not affiliated with Google.
- **The logo is a pun on your name, and it's editable.** It defaults to the owner's
  first name plus "oogle" (Sam → Samoogle, Katie → Katoogle). The name comes from
  `?name=Sam`, the Search settings page, or `BRAIN_OWNER` at index time. With no
  name it says **Brainoogle**. Click the logo and type to rename it live ("Valerie");
  each letter keeps the blue, red, yellow, blue, green, red sequence and the bevel.
  Enter or clicking away saves the rename in localStorage, and a saved rename wins
  over the default. Escape cancels. `?logo=Valerie` sets literal text. The search
  button and the tab icon follow the logo.
- **Real URLs, pre-rendered.**
  - Routes: `/`, `/search?q=…&in=people`, `/setup`, `/settings`, one page per
    folder (`/people`, `/orgs`, `/events`, `/meetings`, `/notes`, `/ecosystem`,
    `/products`), and one page per note (`/n/orgs/gdg-tulsa`).
  - `bun run build` pre-renders every static route to `dist/<route>/index.html`
    with the same render functions the browser uses (`src/render.ts`,
    `scripts/prerender.ts`), so pages read without JS and can be crawled.
  - In the browser, a small History API router renders links in place and handles
    back and forward. Instant search replaces the URL as you type; submitting
    pushes a new entry.
  - Old hash links (`#/setup`, `#/search?q=`, `#q=`) redirect to the new paths.
  - Unknown paths get a 2010-style "Not Found" page with a search box.
- **Folders everywhere.** The top link bar (Everything, Organizations, People, Events,
  Meetings, Tools, Notes, Ecosystem, more ▾) and the results sidebar filter by brain
  folder. "Similar" ranks notes by how close their stored vectors are to that note
  (`related:` queries), so it works without the query model.
- **Loading.** The index, the vectors and the meaning model (about 23 MB, cached by
  the browser after the first visit) all start loading as soon as the page opens. The
  model runs in a Web Worker so typing never stutters. If you search before they're
  ready, you get a skeleton results page that swaps to real results the moment they
  are. If the model takes longer than 8 seconds, keyword results show first and get
  re-ranked by meaning when the model arrives.
- **Instant results.** These turn on automatically once everything is ready: the first
  keystroke flips to the results page, and results update 150 ms after you stop
  typing. Turn it off in Search settings (or the sidebar) for classic search with
  Enter or the button. The footer shows whether meaning search is ready.
- **Weak or empty searches** show a sponsored-links-style "Ask an AI" column with
  **Antigravity, Gemini, ChatGPT, Claude**. Each copies a prompt (your query + "search
  my brain at <location> and answer; capture anything new") and then opens the app.
  ChatGPT (`chatgpt.com/?q=`) and Claude (`claude.ai/new?q=`) open with it filled
  in; both URLs work as of 2026-11-14 but are not officially documented. Gemini has
  no prompt parameter, and Antigravity has no documented deep link, so those two
  rely on paste.
- **Easter eggs:** `do a barrel roll` (skipped when your system asks for reduced
  motion), `askew`, `recursion`, and your own first name (set it in Search settings).
- **Copy buttons:** every code block (Setup page, notes) and the AI prompt has a small
  Copy button. It uses the clipboard API, with a fallback for plain-HTTP pages.
- **Favicon:** an original serif letter in classic blue (`public/favicon.svg` plus
  32 px and 180 px PNGs). The tab icon changes to the first letter when you rename
  the logo.
- **Deploying:** `firebase.json` serves `dist/` with clean URLs: static pages
  first, then unknown paths fall back to `/index.html`. It sets immutable caching
  for `/assets/**` and revalidation for `brain-*.json`. Pre-rendering always uses
  the bundled `public/` index, never `.brain-local/`.

## The brain

```text
brain/
  AGENTS.md          agent contract: recall before answering, capture after learning
  CLAUDE.md          imports AGENTS.md for Claude Code
  index.md           links only, every note
  .agents/skills/    brain-recall, brain-capture, brain-seed-from-meetings (SKILL.md)
  people/ orgs/ events/ meetings/ products/ notes/
```

Seed notes are public facts with source URLs (checked 2026-11-18). The three notes
in `meetings/` are **fictional samples** (`sample: true`) for the meeting-capture demo.

## Files

| Path | Purpose |
|---|---|
| `scripts/index-brain.ts` | Indexer (`bun run index`) |
| `scripts/sync-readme.ts` | Copies `SETUP.md` into this README (`bun run readme:apply`) |
| `scripts/write-favicon.ts` | Writes `public/favicon.svg`; the PNG fallbacks come from `rsvg-convert` |
| `src/lib/` | Frontmatter, chunking, BM25, hybrid ranking, Markdown rendering, AI handoff |
| `src/render.ts` | Page markup as pure functions, shared by the browser and the pre-renderer |
| `src/main.ts`, `src/settings.ts` | Router, loading, skeleton, instant search, settings |
| `scripts/prerender.ts`, `vite.config.ts` | Build-time pre-rendering; `/local/` brain and clean URLs in dev and preview |
| `src/embed.worker.ts`, `src/embedder.ts` | Query embedding in a Web Worker |
| `src/lib/brand.ts` | Logo letter colors, folder links, Easter eggs |
| `e2e/smoke.spec.ts` | Browser smoke test for `bun run app:browser:verify --app brain-search` |

## Setup for every AI app

The section below is a copy of [SETUP.md](SETUP.md), which the app shows at `/setup`.

<!-- SETUP:START -->
# Set up your brain in any AI app

Your **brain** is a folder of Markdown notes plus one instructions file
(`AGENTS.md`) that tells any AI how to **recall** (search your notes before
answering) and **capture** (save what it learns). Pick the app you use below,
paste the prompt, and let the AI do the setup.

Checked against official docs on 2026-11-18. Items marked *(unverified)* could
not be confirmed on an official page. Details: [AI surfaces research](https://github.com/techlahoma/techlahoma-google-group/blob/main/docs/research/brain-search-ai-surfaces-2026-11-18.md).

## Step 1: choose where your brain lives

The setup prompt checks what this app can reach and **lets you pick**. The
recommended order:

1. **A private GitHub repository** (best: history, works with most apps). Never public by default.
2. **Google Drive, OneDrive or another shared drive** (easy to reach from web chat apps).
3. **A local folder**, for example `~/Brain` (simplest; you can move it to a repo or drive later).

## Step 2: paste the setup prompt

This one prompt works in any app that can run commands or write files
(Antigravity and Antigravity CLI, Codex, Claude Code, Gemini CLI, the ChatGPT and Claude desktop apps):

```text
Set up a personal "brain" for me: a folder of Markdown notes that you and other AI apps can search and update.

1. Check which storage you can reach from here: a GitHub account or the gh CLI, Google Drive, OneDrive or another shared drive, and local folders. List the options you can actually use, in this order: private GitHub repo, shared drive, local folder (suggest ~/Brain). Ask me to pick one. Never create a public repo.
2. Create the brain there by copying the starter brain from https://github.com/techlahoma/techlahoma-google-group/tree/main/apps/brain-search/brain (keep AGENTS.md, CLAUDE.md, index.md and the .agents/skills folder; ask me whether to keep the example notes).
3. Read the brain's AGENTS.md and follow it from now on: recall before answering, capture after learning something durable, update index.md, never duplicate a note, never invent facts.
4. Make this app load the brain automatically next time (its instructions file, rules or skills folder), and tell me exactly what you changed.
5. Ask me three questions about my work and interests, and capture my answers as my first notes.
```

## Web chat apps

Web chat apps **cannot read a folder on your computer**. They reach your brain
through a connector (GitHub, Google Drive, Microsoft 365) or files you upload.
Paste the brain's `AGENTS.md` into the app's instructions so it knows the rules.

| App | Where the instructions go | How it reaches the brain | What you do yourself |
|---|---|---|---|
| **ChatGPT** (chatgpt.com) | A **Project** with project instructions, or Settings → Personalization → Custom instructions | Add notes to the project's **Sources**, or connect the Google Drive app. A GitHub app is reported but not confirmed in current docs *(unverified)* | Create the project, paste `AGENTS.md` into its instructions, upload or connect the notes |
| **Claude** (claude.ai) | A **Project** with project instructions, or Settings → account-wide instructions | **GitHub** connector in the project (read-only, press Sync to refresh), **Google Drive** connector, or **Microsoft 365** (OneDrive/SharePoint, read-only by default). Skills: upload a ZIP of each skill folder under Customize → Skills | Create the project, connect GitHub or Drive and pick the brain, upload the skills |
| **Gemini** (gemini.google.com) | Settings → **Personal context** ("Your instructions for Gemini") | **Import code** from GitHub (a one-time snapshot, no sync), or the Google Drive app (reading only). Upload the skill folders as Gemini **skills** (web and Mac app). Gems became skills on 2026-11-17 for personal accounts | Paste `AGENTS.md` into Personal context, import or upload the brain, re-import after big changes |
| **Google AI Studio** | Build mode does not document system instructions or file context | Build mode can **import from GitHub** and sync both ways with a repo | Use it to *build* the search page (see [AI Studio prompt](AI_STUDIO_PROMPT.md)), not as a daily brain |

**Saving from web chat:** these apps can't write to your folder (except some
Drive connectors). Ask for the finished note and its path, then save it yourself
or let a desktop/CLI agent do it later.

**Paste this into the project or custom instructions:**

```text
You have access to my "brain": Markdown notes in [GitHub repo / Drive folder / uploaded files]. Before answering, search the brain and cite note paths. If the brain lacks the answer, say so, then answer from other sources with citations. When I share something durable (a fact with a source, a decision, a follow-up), write a new or updated note in the brain's format (frontmatter: title, tags, source, updated) and tell me the path and the index.md line to add. Never invent facts.
```

## Desktop apps

| App | What it can do today | Setup |
|---|---|---|
| **Antigravity** | Reads `AGENTS.md` (and `GEMINI.md`) in your workspace and parent folders, rules in `.agents/rules/`, and skills in `.agents/skills/`. Works directly on local files | Open the brain folder (or a repo containing it) as the workspace and paste the setup prompt. For this demo, paste [PROMPT.md](PROMPT.md) |
| **ChatGPT desktop** | Includes Codex. **Local projects** attach folders that ChatGPT "can read and change", and pick up `AGENTS.md` and skills from the main folder | Create a local project on the brain folder and paste the setup prompt |
| **Claude desktop** | The **Code** tab is Claude Code with direct local file access; it reads `CLAUDE.md` and `.claude/skills/`. The Chat tab can use local MCP servers (Desktop extensions) | Open the brain folder in the Code tab and paste the setup prompt. The starter brain's `CLAUDE.md` imports `AGENTS.md` |

There is no documented `antigravity://` link that fills in a prompt, so the
Antigravity button in Brain Search copies the prompt for you to paste.

## Command-line agents

| Tool | Instructions file | Skills folder | Setup |
|---|---|---|---|
| **Codex CLI** | `AGENTS.md` (from the git root down to the current folder; 32 KiB combined limit) | `.agents/skills/` | `cd` into the brain and run `codex`; paste the setup prompt |
| **Claude Code** | `CLAUDE.md` (the starter's imports `@AGENTS.md`). It reads `AGENTS.md` by itself only when there is no `CLAUDE.md` | `.claude/skills/` (it does **not** read `.agents/skills/`) | Run `claude` in the brain; ask it to copy `.agents/skills/*` into `.claude/skills/` |
| **Antigravity CLI** (`agy`) | `AGENTS.md` or `GEMINI.md` (no changes needed when moving from Gemini CLI) | `.agents/skills/` | Run `agy` in the brain and paste the setup prompt. This is Google's CLI for free and Google AI Pro / Ultra accounts |
| **Gemini CLI** (`gemini`) | `GEMINI.md`; add `"context": {"fileName": ["AGENTS.md", "GEMINI.md"]}` to `.gemini/settings.json` to read `AGENTS.md` | `.agents/skills/` or `.gemini/skills/` | Now only for Gemini Code Assist Standard / Enterprise, Code Assist for GitHub, and legacy paid API or Vertex keys. Free and Google AI Pro / Ultra access moved to Antigravity CLI on 2026-06-18 ([Gemini CLI README](https://github.com/google-gemini/gemini-cli#readme), checked 2026-11-18) |

## Step 3: search it like your own Google

Run Brain Search on your brain:

```sh
bun install
BRAIN_DIR="$HOME/Brain" bun run --cwd apps/brain-search index
bun run --cwd apps/brain-search dev
```

Set `BRAIN_DIR` to your brain's absolute path (without it, the bundled example
brain is indexed). Your index goes to `apps/brain-search/.brain-local/`, which is
gitignored, so your notes are never committed or deployed. The indexer ends by
printing the exact re-index command for your brain. Then open the address the
dev server prints. If a search comes up short, use the
**Antigravity / Gemini / ChatGPT / Claude** buttons: each copies a ready-made
prompt and opens the app, so the AI can dig deeper and capture the answer.

No local setup? Paste the [artifact prompt](ARTIFACT_PROMPT.md) into ChatGPT or
Claude to build the search page right in the chat.

## Step 4: seed it from your meetings

Paste [SEED_FROM_MEETINGS.md](SEED_FROM_MEETINGS.md) into an agent that can
reach your meeting notes (Granola, Google Meet notes in Drive, Docs, or pasted
transcripts). For follow-ups it uses Sam's
[action-items skill](https://github.com/ThatGuySam/skills/tree/main/skills/sams-action-items).
<!-- SETUP:END -->
