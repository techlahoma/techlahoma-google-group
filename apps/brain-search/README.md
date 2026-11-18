# Brain Search: your own brain + your own Google

- `Tease:` A finished 2010-style search page over your own Markdown brain, running only on your computer, plus a memory every AI app reads and writes.
- `Lede:` The page is a template: agents never rebuild it. An agent connects it to your context (files, Drive, GitHub, meeting notes), puts the brain where you choose (private repo, Drive or OneDrive folder, or local folder), runs it on `127.0.0.1` in watch mode, and keeps the brain current. Every app you use recalls from it and captures back to it.
- `Why it matters:` Closing demo for the Techlahoma / GDG Tulsa / Women in Tech workshop on 2026-11-19: everyone leaves with a brain their AI apps share.
- `Go deeper:` [Antigravity prompt](PROMPT.md) · [Setup for every AI app](SETUP.md) (also below and at `/setup` in the app) · [AI Studio](AI_STUDIO_PROMPT.md) · [Memory in chat Projects](WEB_MEMORY.md) · [Seed from meetings](SEED_FROM_MEETINGS.md)

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
BRAIN_DIR="$HOME/Brain" bun run --cwd apps/brain-search dev   # watch mode, 127.0.0.1 only
```

**Watch mode:** with `BRAIN_DIR` set, `dev` indexes the brain on start and again
600 ms after any Markdown file in it changes. Only changed chunks are re-embedded;
the rest reuse their stored vectors. The open page then refetches `/local/` over
Vite's HMR socket and refreshes the current view without losing your typing.
Any agent that writes a note shows up in search a moment later.

A personal brain's index goes to `apps/brain-search/.brain-local/`, which is
gitignored and never built into `dist/`. The dev and preview servers serve it at
`/local/`, and the page uses it ahead of the bundled example (the footer then says
"your brain"). Every run ends by printing the exact re-index command for that
brain. Without `BRAIN_DIR`, the bundled example brain is indexed into `public/`.

| Command | Effect |
|---|---|
| `bun run index` | Read `brain/**/*.md` (or `BRAIN_DIR`), chunk by heading, embed with `Xenova/all-MiniLM-L6-v2` (q8), and write the index into `public/` (or `.brain-local/` for `BRAIN_DIR`). Skips work when nothing changed and re-embeds only changed chunks; output is byte-identical on re-runs. Keeps the existing `BRAIN_OWNER` unless you pass a new one. |
| `bun run index:check` | Read-only: exit 1 if the index is older than the brain. |
| `NO_EMBED=1 bun run index` | Keyword (BM25) index only, no model download. |
| `bun run check` | Typecheck, unit tests (including brain lint and index freshness), and a production build that pre-renders every page. |
| `bun run preview` | Serve `dist/` like Firebase does (clean URLs, deep links). |
| `bun run dev` | Vite dev server on `127.0.0.1`; watches `BRAIN_DIR` when set. |

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
(`AGENTS.md`). Every AI app you use should **read** it before answering and
**write** new memories back. Below, for each app: where the brain can live,
where the memory instructions go, how the app reads it, how it writes back, and
what you do yourself.

**The search page runs only on your computer.** `bun run dev` serves it on
`127.0.0.1`, so nothing private goes online. Web chat apps use the brain as
memory, but they don't host the page. The public demo at
[oogle.web.app](https://oogle.web.app) only shows the example brain.

Checked against official docs on 2026-11-18. Items marked *(unverified)* could
not be confirmed on an official page. Details: [AI surfaces research](https://github.com/techlahoma/techlahoma-google-group/blob/main/docs/research/brain-search-ai-surfaces-2026-11-18.md).

## Step 1: let an agent with a terminal do the setup

Paste [PROMPT.md](PROMPT.md) into Antigravity, Codex, Claude Code, or the
ChatGPT or Claude desktop app. It:

- clones the finished template (the agent must not rebuild the page);
- lists what it can reach on your computer and in your accounts, and lets you pick;
- puts the brain where you choose;
- seeds the brain from your real notes, files and meetings, with sources;
- starts the local page in watch mode;
- installs the read-and-write memory loop.

## Step 2: choose where your brain lives

The setup prompt lets you pick. The recommended order:

1. **A private GitHub repository.** You get history, and agents commit and push.
   Most apps can at least read it. Never make it public.
2. **A Google Drive or OneDrive folder.** A folder synced to your computer is
   easiest: local agents write to it like any folder and it uploads by itself.
3. **A local folder**, for example `~/Brain`. Simplest; you can move it to a repo
   or drive later.

## Step 3: connect each app (read and write)

The **memory instructions** are the brain's `AGENTS.md`, or this short version
for apps where you paste instructions:

```text
My "brain" is a folder of Markdown notes at [GitHub repo / Drive folder / uploaded files]. Before answering, search it and cite note paths. If it lacks the answer, say so, then answer from other sources with citations. When I share something durable (a fact with a source, a decision, a follow-up), write it back: update the matching note or create one (frontmatter: title, tags, source, updated; one topic per file) and add a link in index.md. If you can't write files here, give me the finished note, its exact path and the index.md line to save. Never invent facts.
```

### Agents with a terminal: full read and write

These apps read and write local files and run Git, so they keep the brain
current with no copying or pasting.

| App | Reads | Writes back | Memory instructions | You do |
|---|---|---|---|---|
| **Antigravity** (app, IDE, `agy` CLI) | The workspace folder: `AGENTS.md` and `GEMINI.md`, `.agents/rules/`, `.agents/skills/` | Edits files directly; commits and pushes with Git | The brain's `AGENTS.md` and `.agents/skills/` | Open the brain folder as its own project, or add it with "add folder" |
| **Codex CLI** | `AGENTS.md` from the Git root down to the current folder (32 KiB combined limit) | Edits files; Git | `AGENTS.md`; skills in `.agents/skills/` | Run `codex` inside the brain folder |
| **Claude Code** (CLI, or the Code tab in Claude desktop) | `CLAUDE.md` (the starter's imports `@AGENTS.md`). It reads `AGENTS.md` by itself only when there is no `CLAUDE.md` | Edits files; Git | `CLAUDE.md`; skills in `.claude/skills/` (it does **not** read `.agents/skills/`) | Run `claude` in the brain and ask it to copy `.agents/skills/*` into `.claude/skills/` |
| **ChatGPT desktop** | A **local project** on the brain folder: ChatGPT "can read and change files" there and picks up `AGENTS.md` and skills. Codex is built in | Edits files in the attached folder | `AGENTS.md` | Create a local project on the brain folder. Work mode needs computer access turned on |
| **Gemini CLI** (`gemini`) | `GEMINI.md`; add `"context": {"fileName": ["AGENTS.md", "GEMINI.md"]}` to `.gemini/settings.json` to read `AGENTS.md` | Edits files; Git | `GEMINI.md` or `AGENTS.md`; skills in `.agents/skills/` | Now only for Gemini Code Assist Standard / Enterprise, Code Assist for GitHub, and legacy paid API or Vertex keys. Free and Google AI Pro / Ultra accounts moved to Antigravity CLI on 2026-06-18 ([Gemini CLI README](https://github.com/google-gemini/gemini-cli#readme)) |

After a write, re-index: the running page in watch mode does it by itself.
Otherwise run the line the indexer printed:

```sh
BRAIN_DIR="/absolute/path/to/your/brain" bun run --cwd "/absolute/path/to/techlahoma-google-group/apps/brain-search" index
```

### Web and chat apps: read through a connector, write where allowed

These apps **can't open a folder on your computer**. They reach the brain
through a connector or uploaded files. Writing back depends on the connector.

| App | Reads the brain from | Writes back by | Memory instructions | You do |
|---|---|---|---|---|
| **Claude** (claude.ai) | **GitHub** connector in a Project: read-only, press Sync to refresh. **Google Drive** connector (search and read). **Microsoft 365** (OneDrive/SharePoint), read-only by default | **Google Drive:** the connector can upload files and create folders, so Claude can save notes to a Drive brain. **GitHub:** no writes; Claude drafts the note and you commit it, or Claude Code does. **OneDrive:** read-only unless an admin enables write | Project instructions (paste the block above), or Settings → instructions for Claude. Skills: upload each skill folder as a ZIP under Customize → Skills | Create the Project, connect GitHub or Drive and pick the brain, paste the instructions |
| **Claude desktop** (Chat and Cowork tabs) | Cowork can attach a local folder (`claude://cowork/new?folder=`, asks you to confirm). Chat can use local MCP servers through Desktop extensions | Cowork: writes in the attached folder *(unverified: write behavior not confirmed in docs read)*. For guaranteed writes, use the Code tab (Claude Code) | Cowork skills and connectors sync from your claude.ai account | Attach the brain folder, or use the Code tab |
| **ChatGPT** (chatgpt.com) | A **Project's** Sources (uploaded notes), or the **Google Drive** app. A GitHub app is reported but not confirmed in current docs *(unverified)* | Drive app: admins can allow write actions per app *(unverified for personal accounts)*. Otherwise ChatGPT drafts the note and you save it, or the ChatGPT desktop app or Codex writes it | Project instructions, or Settings → Personalization → Custom instructions | Create a Project, paste the instructions, upload or connect the notes; re-upload after big changes |
| **Gemini** (gemini.google.com) | **Import code** from GitHub (a one-time snapshot, no sync), or the Google Drive app (reads only). Upload the skill folders as Gemini **skills** (web and Mac app; Gems became skills on 2026-11-17 for personal accounts) | No file writes: Gemini drafts the note and you save it, or a local agent does | Settings → **Personal context** ("Your instructions for Gemini") | Paste the instructions, import or upload the brain, re-import after big changes |
| **Google AI Studio** | Build mode can **import from GitHub** and sync both ways with a repo | Two-way GitHub sync can push project changes to the repo *(unverified as a way to maintain a notes folder)* | Build mode doesn't document system instructions or `AGENTS.md` | See [AI Studio](AI_STUDIO_PROMPT.md). Requires a Google sign-in |

More detail for chat Projects: [Use your brain as memory in ChatGPT and Claude](WEB_MEMORY.md).

## Step 4: search it like your own Google (on your computer)

```sh
bun install
BRAIN_DIR="$HOME/Brain" bun run --cwd apps/brain-search index
BRAIN_DIR="$HOME/Brain" bun run --cwd apps/brain-search dev
```

- Set `BRAIN_DIR` to your brain's absolute path. Without it, the bundled example
  brain is indexed.
- Your index goes to `apps/brain-search/.brain-local/`, which is gitignored, so
  your notes are never committed or deployed.
- With `BRAIN_DIR` set, `dev` watches the brain: when any agent writes a note, the
  index rebuilds (re-embedding only changed notes) and the open page refreshes.
- Open the address the dev server prints (`http://127.0.0.1:5173/`).
- If a search comes up short, use the **Antigravity / Gemini / ChatGPT / Claude**
  links: each copies a ready-made prompt and opens the app, so the AI can dig
  deeper and write the answer back to your brain.

## Step 5: seed it from your meetings

Paste [SEED_FROM_MEETINGS.md](SEED_FROM_MEETINGS.md) into an agent that can
reach your meeting notes (Granola, Google Meet notes in Drive, Docs, or pasted
transcripts). For follow-ups it uses Sam's
[action-items skill](https://github.com/ThatGuySam/skills/tree/main/skills/sams-action-items).
<!-- SETUP:END -->
