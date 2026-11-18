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
BRAIN_DIR=~/Brain bun run --cwd apps/brain-search index
bun run --cwd apps/brain-search dev
```

Then open the address it prints. If a search comes up short, use the
**Antigravity / Gemini / ChatGPT / Claude** buttons: each copies a ready-made
prompt and opens the app, so the AI can dig deeper and capture the answer.

No local setup? Paste the [artifact prompt](ARTIFACT_PROMPT.md) into ChatGPT or
Claude to build the search page right in the chat.

## Step 4: seed it from your meetings

Paste [SEED_FROM_MEETINGS.md](SEED_FROM_MEETINGS.md) into an agent that can
reach your meeting notes (Granola, Google Meet notes in Drive, Docs, or pasted
transcripts). For follow-ups it uses Sam's
[action-items skill](https://github.com/ThatGuySam/skills/tree/main/skills/sams-action-items).
