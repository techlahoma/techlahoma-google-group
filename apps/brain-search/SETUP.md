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
