# Trial report: brain-search (opus)

- `Tease:` A working Markdown brain, indexer, hybrid search page, AI handoff row, setup page and paste-ready prompts, all inside `apps/brain-search`.
- `Lede:` `index` and `check` pass, the dev server served the page and both index files (curl), and the browser smoke spec is written but not run (no browser on this machine).
- `Why it matters:` Sam can compare this with the other trials and only needs to look at the decisions and gaps listed below.
- `Go deeper:` [README](README.md), [SETUP.md](SETUP.md), [PROMPT.md](PROMPT.md), [surface research](../../docs/research/brain-search-ai-surfaces-2026-11-18.md).

## Round 4 (2026-11-18): copy buttons, favicon, Gemini CLI check

- **Copy buttons:**
  - Every rendered code block gets a small 2010-style grey "Copy" button at its top-right. That covers the Setup page, notes and the reader view.
  - The "See the prompt" box has one too.
  - Each button carries the exact block text in `data-copy` and copies it with the clipboard API, falling back to a hidden textarea and `execCommand('copy')` on plain-HTTP pages.
  - The label reads "Copied!" for 2 seconds and the message is announced through the toast live region. A unit test checks that the copied text matches the block exactly, including quotes, `<`, `&` and newlines.
- **Favicon:**
  - An original bold serif lowercase "g" in a beveled classic blue on a white tile.
  - Files: `public/favicon.svg` plus 32 px and 180 px PNGs (made with `rsvg-convert`).
  - The tab icon switches to the logo's first letter when it is renamed.
  - A test keeps `favicon.svg` equal to `faviconSvg('g')`.
- **Gemini CLI claim checked** against the official `google-gemini/gemini-cli` README (read with `gh` on 2026-11-18). It says free individual access and Google AI Pro / Ultra moved to Antigravity CLI on June 18, 2026, and that Gemini CLI remains for Gemini Code Assist Standard / Enterprise, Code Assist for GitHub, and legacy paid API or Vertex keys.
  - `SETUP.md` now lists Antigravity CLI (`agy`) as its own row and describes Gemini CLI that way, citing the README. The README copy is re-synced.
  - Not changed, because those files are outside the app folder or in brain content: `docs/research/brain-search-ai-surfaces-2026-11-18.md` says the same thing in shorter form, and `brain/AGENTS.md` still names Gemini CLI as a supported tool, which remains true.
- **Commands run:** `bun run check` (38 tests pass, build OK), lint and format clean, the index was already up to date, and a dev-server curl check of the favicon files on port 5308 (stopped afterwards).

## Round 3 (2026-11-18): 2010 throwback

This replaces the round 2 look; the round 2 notes below are history.

- **Look:**
  - 2010-style pages throughout: top link bar of brain folders (Everything, Organizations, People, Events, Meetings, Tools→`products/`, Notes, Ecosystem, more ▾), with "Setup | Search settings" on the right.
  - Plain rectangular box, grey gradient buttons ("<Logo> Search", "I'm Feeling Lucky").
  - Results page: small logo plus a box with an attached Search button, and a blue-tinted "About N results (0.0X seconds)" bar. The left sidebar has small colored icons, folder filters and an Instant on/off group, behind a thin rule.
  - Results: blue underlined titles, black snippets with bold terms, a green `brain/…md` line, and grey "Source - Similar" links. No chips, badges or pills. Light mode only; the dark-mode styles were removed.
- **Editable logo:**
  - Cardo 700 (Google Fonts, falls back to Georgia). Each letter gets a gradient clipped to the glyph, plus drop shadows for the bevel.
  - A transparent input sits exactly over the painted letters, so clicking and typing renames the logo live. Enter or blur saves to localStorage, Escape reverts.
  - Default text is "Google". `?name=Sam` seeds "Samoogle" and `?logo=` seeds literal text.
- **"Similar":** runs a `related:<path>` search ranked by the stored vectors, so it works before the model loads.
- **AI handoff:** on weak or empty results it is a right-hand "Ask an AI" sponsored-links column with plain blue links. On strong results it is one line under the results.
- **Loading and speed:**
  - The index, the vectors and the model all start when the page opens, and the model runs in a Web Worker (`src/embed.worker.ts`).
  - Vectors are now int8 with one scale per chunk: 60 KB instead of about 240 KB. `INDEX_VERSION` is 2, and the test checks `encoding: 'int8'`.
  - Before everything is ready, a submitted search shows a shimmering skeleton that swaps to real results. After 8 seconds without the model, keyword results show first and re-rank when it arrives.
  - Instant turns on automatically once ready. If someone typed on the home page while loading, their results appear as soon as things are ready.
  - The footer shows "Meaning search: loading / ready / unavailable" and the Instant state.
- **Search settings page** (`#/settings`): "Use Instant / Do not use Instant", logo text, first name (for the Easter egg), brain location, show match scores (off by default).
- **Other:**
  - Easter eggs, reader view (restyled plainly) and the setup page are kept.
  - `firebase.json` gains cache headers: immutable for `/assets/**`, revalidate for `brain-*.json`.
- **Commands run:**
  - `bun run index` (83 notes, 117 chunks), and a re-run reported up to date.
  - `bun run check`: 35 tests pass, build OK. The worker bundles as its own chunk and the main JS is 39 KB.
  - `gts lint`, `biome lint` and `biome format` are clean.
  - Dev server on port 5307: page, JSON and the worker module returned 200; the server was stopped afterwards.
  - Ranking with int8 vectors in Bun matches the round 1 results (Antigravity → `products/google-antigravity.md`; pizza → weak). Similar for GDG Tulsa → Google Developer Groups, Zain Khan, the Aug 6 event.
- **Not verified (needs a browser):**
  - Logo bevel quality and caret alignment over the painted letters.
  - Worker model loading in Chromium and Safari.
  - Skeleton shimmer and the swap without a jump.
  - The rewritten smoke spec: it typechecks but has not run. It delays `brain-index.json` with `page.route` to exercise the skeleton.

## Round 2 (2026-11-18): Google-style UI (superseded)

- **Home:** centered personal wordmark and a pill search box with search and clear icons. Two buttons: **Brain Search** and **I'm Feeling Brainy** (opens a random note). Top right has Setup and a gear for settings.
- **Wordmark:** a pun on the user's first name ("Sam" → Samoogle; "Sam's Brain" style in settings). The name comes from `?name=`, then localStorage, then `BRAIN_OWNER` stored in the index, then the default "Brainoogle". It is text in the free Outfit font (Google Fonts) with letters colored blue, red, yellow, blue, green, red; no logo artwork or font files are copied. Footer on every page: "Not affiliated with Google. A personal-search demo for GDG Tulsa."
- **Results:**
  - Top bar has the small wordmark and the search pill, with results lined up under the pill.
  - Folder tabs: All, People, Orgs, Events, Meetings, Notes, plus any other folder (Ecosystem, Products).
  - "About N results (0.0X seconds)" is a live region.
  - Each result has a colored initial badge, a `brain › folder › file` breadcrumb, a blue title (purple once visited), a date, a snippet with bold matches, tags and a Source link.
  - The AI row looks like related-search chips. It comes first when results are weak or empty, under a "did not match" suggestions block, and last when results are strong.
  - The score line is hidden unless "Show match scores" is on.
  - Notes open in a serif reader view.
- **Instant results (default on):** search runs 150 ms after typing stops. Keyword results show first; the meaning re-rank replaces them when ready, and stale results are dropped. The AI row is held back until the final pass so it doesn't flicker. Typing on the home page switches to the results layout and moves the cursor to the top bar. The gear toggles classic mode (Enter or button only). Settings are stored in localStorage behind try/catch (`src/settings.ts`).
- **Easter eggs:** `do a barrel roll` spins once (with reduced motion it prints a line instead). `askew` tilts the page. `recursion` shows "Did you mean: recursion". Searching your own first name or pun gives a joke telling you to capture a note about yourself.
- **Repo rename:** links in the app docs, prompts and `src/main.ts` now point to `techlahoma/techlahoma-google-group`.
- **Commands run:**
  - `bun run index` took the coordinator's new notes: 83 notes, 117 chunks, 117 × 384.
  - `bun run check`: 33 tests pass, build OK.
  - `gts lint` and `biome lint`/`format` on the app are clean.
  - Dev server on port 5292: page and modules returned 200 and the title was Brainoogle; the server was stopped afterwards.
  - The smoke spec was rewritten for instant search, tabs, classic mode, settings and the askew egg. It typechecks but has not been run.
- **Still to check in a browser:** wordmark look and alignment, the instant home → results switch keeping the cursor, the barrel roll, dark mode, and phone layout.

## What I built (round 1)

- **Brain** (`brain/`): 37 notes (34 sourced public notes plus 3 fictional `sample: true` meetings), an `index.md` with links only, `AGENTS.md` (the recall and capture contract), `CLAUDE.md` (`@AGENTS.md`), and three skills in `.agents/skills/`: `brain-recall`, `brain-capture`, `brain-seed-from-meetings`. The last one links Sam's action-items skill and does not copy it.
- **Indexer** (`scripts/index-brain.ts`):
  - Chunks notes by heading and leaves out the `## Sources` section.
  - Embeds with `Xenova/all-MiniLM-L6-v2` q8 through `@huggingface/transformers` 4.2.0, which was already in the lockfile.
  - Writes `public/brain-index.json` (notes, chunks, BM25 statistics) and `public/brain-vectors.json` (base64 Float32 vectors).
  - Options: `BRAIN_DIR`, `BRAIN_LOCATION`, `OUT_DIR`, `NO_EMBED=1`, `FORCE=1`, and `--check`.
  - Skips work when nothing has changed, and output is byte-identical on re-runs.
  - The model is cached in `.cache/models`, which is gitignored.
- **Page** (Vite, no framework):
  - **Search:**
    - The home page is a centered search box with an original "neurons" logo.
    - Keyword search works as soon as the page loads. The model loads lazily on the first search, and `?semantic=off` forces keyword-only search.
    - Results show title, highlighted snippet, tags, path, source links, and a "meaning / keywords" score line.
  - **AI handoff:**
    - Weak or empty searches put the **Antigravity / Gemini / ChatGPT / Claude** row first. The panel explains that each button copies a prompt and then opens the app.
    - "See or edit the prompt" lets you change where the brain lives; this is saved in localStorage.
  - **Other pages:**
    - The note page renders Markdown safely (escape first, allowlisted links).
    - `#/setup` renders `SETUP.md`.
- **Docs and prompts:**
  - `SETUP.md` covers every surface, with a universal setup prompt where the user picks the storage. It is copied into the README by `bun run readme:apply`, and a test enforces the copy.
  - Also written: `PROMPT.md` (Antigravity), `AI_STUDIO_PROMPT.md`, `ARTIFACT_PROMPT.md`, `SEED_FROM_MEETINGS.md`.
  - Added the root README entry "In preparation — Your Brain + Personal Google (Nov 19)" and one row in the `PROJECT.md` source map.

## File map

| Path | Purpose |
|---|---|
| `brain/` | Example brain, contract and skills |
| `scripts/index-brain.ts` | `bun run index` / `index:check` |
| `scripts/sync-readme.ts` | `readme:apply` / `readme:check` |
| `scripts/repo.test.ts` | Brain lint, link check, index freshness, README sync |
| `src/lib/{frontmatter,text,search,build,markdown,handoff}.ts` (+ `lib.test.ts`) | Core logic, unit-tested |
| `src/{main,app,embedder}.ts`, `src/style.css`, `index.html` | Page |
| `e2e/smoke.spec.ts` | `runSmokeTest`: search, note, empty-path handoff, setup, phone fit |
| `../../docs/research/brain-search-ai-surfaces-2026-11-18.md` | Capability table per AI surface, with sources |

## Commands run (real results, Bun 1.3.14)

- `bun run app:create plan|apply --name brain-search --title "Brain Search"`: created the workspace.
- `bun run --cwd apps/brain-search index`: 37 notes, 59 chunks, 59 × 384 vectors, about 2 s with the model cached. The second run printed "Index is up to date; nothing to do". With `FORCE=1`, both files were "Unchanged" (same sha256).
- `NO_EMBED=1` and `BRAIN_DIR=brain/meetings` runs into a scratch `OUT_DIR` worked. The scratch output was deleted.
- `bun run --cwd apps/brain-search check`: typecheck clean, 25 tests pass, Vite build OK. The build bundles the ONNX wasm (23.6 MB) so it is served from the same origin.
- `gts lint` on `apps/brain-search/src`: clean. `biome lint` / `biome format` on the app: clean.
- Root `bun test tests`: 79 pass, 0 fail.
- Dev server on port 5291, checked with curl:
  - `/` returned 200 with `<title>Brain Search</title>`.
  - `/brain-index.json` and `/brain-vectors.json` returned 200.
  - `/src/main.ts` returned 200.
  - Then I stopped the server and confirmed the port was free.
- Search quality, checked in Bun with the real model:
  - "who runs the Tulsa developer meetups" → Tulsa Web Devs (strong).
  - "follow-ups from the planning meeting" → the sample planning meeting.
  - "best pizza in Tulsa" → weak.
  - "quantum chromodynamics lattice" → none.

## Not verified

- **No browser run.** `e2e/smoke.spec.ts` has not been executed. In-browser model loading and the clipboard and window-open behaviour are untested. Run `bun run app:browser:verify --app brain-search`. `app.contract.json` stays `scaffold` until that passes.
- **Prefill links:**
  - `chatgpt.com/?q=` and `claude.ai/new?q=` rely on your 2026-11-14 check; neither is in official docs.
  - Gemini has no documented prompt parameter.
  - No `antigravity://` deep link is documented, so that button only copies the prompt.
- **Surface claims:** these come from a research sub-agent reading official docs on 2026-11-18. Rows marked unverified are flagged in the research doc; help.openai.com returned 403. Some findings are new and worth a second look before the workshop:
  - Gems became skills on 2026-11-17.
  - Gemini CLI was replaced by Antigravity CLI on 2026-06-18.
  - Claude Code reads AGENTS.md natively only when no CLAUDE.md exists.
  - ChatGPT desktop now includes Codex.
- **Google Meet notes location:** the claim in `SEED_FROM_MEETINGS.md` that "Notes by Gemini" are saved as Docs in the organizer's Drive is from general knowledge and was not checked in this run.
- **Links to GitHub `main`:** `SETUP.md` and the prompts point to `github.com/techlahoma/techlahoma-google-group/tree/main/apps/brain-search/...` (the repo was renamed; old URLs redirect). Those links 404 until this is merged.

## Known gaps

- **No Women in Tech note.** The seed agent found no public Techlahoma "Women in Tech" group page and no public page for the Nov 19 event, so neither has a note. OKWIT and SheCodes Tulsa are included instead; `orgs/techlahoma.md` says no such group is listed.
- **Model and wasm come from outside.** The meaning model downloads from the Hugging Face hub in the browser, so it is not available offline. Keyword search is the fallback. The ONNX wasm is bundled with the app.
- **Ranking is basic.** It uses a fixed weight (0.6 meaning / 0.4 keywords), and the weak and strong thresholds were tuned on 9 queries against this brain only. There is no stemming beyond plurals; for example, "October" does not match "Oct".
- **Markdown renderer is minimal** and hand-written: one level of nested lists, no images.
- **No notes-to-index sync in the browser.** After editing notes you must re-run `bun run index`, and the repo test fails until you do.

## Decisions for Sam to review

1. **Skill location.** Skills live in `brain/.agents/skills/`, which Codex, Antigravity and Gemini CLI read. Claude Code does not, so `brain/CLAUDE.md` tells it to copy them into `.claude/skills/`. There is no `GEMINI.md`, because Antigravity reads both files and would load the contract twice.
2. **Index files are committed.** `public/brain-*.json` (about 245 KB) is committed so the page works right after cloning. A repo test fails if the brain changes without re-indexing; participants editing their own brain won't hit this, because they use `BRAIN_DIR`.
3. **Handoff row is always visible.** It shows on every search, first when results are weak or empty and last when they are strong, so the demo can always reach it.
4. **Score line on results.** Each result shows a "meaning 0.72 · keywords 0.75" line, to make the hybrid ranking visible to a non-developer audience. Remove it if it's noise.
5. **People notes.** `people/` holds only two public-role notes: Lauren Tan (brainmaxxing author, per GitHub) and Zain Khan (listed as GDG Tulsa organizer on gdg.community.dev). Sam is not named in any note.
6. **No markdown library.** I hand-wrote the Markdown renderer instead of adding one such as `marked`, which does not sanitize. It escapes all HTML first and allows only safe links.
