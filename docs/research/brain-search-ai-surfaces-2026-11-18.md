# AI surfaces: how to give each one a persistent "brain"

- `Tease:` Which AI apps can read a Markdown brain, its AGENTS.md, and its skills, as of 2026-11-18.
- `Lede:` Desktop and CLI agents read a local folder and AGENTS.md; web chats reach a brain only through connectors (GitHub, Drive, Microsoft 365) or uploads.
- `Why it matters:` The Brain Search setup page and prompts depend on these claims being current.
- `Go deeper:` [`apps/brain-search/SETUP.md`](../../apps/brain-search/SETUP.md) applies these findings. Gathered by a research sub-agent from official docs; rows marked unverified were not confirmed on an official page.

Researched 2026-11-18. Goal: which surfaces can take a folder of Markdown notes, an AGENTS.md-style instructions file, and skills.

"Verified?" means: **yes** = read on an official page today; **unverified** = secondary source, search snippet, or the official page could not be loaded.

Access notes: `help.openai.com` returns HTTP 403 from this machine, so ChatGPT Help Center facts are unverified. OpenAI's Codex docs (`developers.openai.com/codex/*`) now 308-redirect to `learn.chatgpt.com/docs/*`, which loaded fine.

## Headline changes (as of 2026-11-18)

- **Gemini Gems are gone for personal accounts.** On 2026-11-17 Gems became read-only and turned into *skills*. They are removed on 2026-12-17. The Gemini app's skills accept uploaded `SKILL.md` folders (web and Mac only). Work/school accounts move in 2027.
- **Gemini CLI has been replaced by Antigravity CLI (`agy`)** for individual accounts (announced 2026-05-19, cut-over 2026-06-18). Gemini CLI still runs with paid API keys.
- **Claude Code now reads `AGENTS.md` natively** (v2.1.277+), but only when no `CLAUDE.md` exists. The `@AGENTS.md` import is no longer needed in that case.
- **The ChatGPT desktop app now includes Codex**, with local folder projects that can read and change files, and it supports standalone skills.
- **Antigravity reads `AGENTS.md` and `GEMINI.md` natively**, plus `.agents/rules/` and `.agents/skills/`. Its workflows are deprecated in favor of skills.

---

## Web

### ChatGPT web

| Capability | Finding | Source URL | Verified? |
|---|---|---|---|
| Custom instructions | "Custom instructions" plus "Base style and tone" under Settings > Personalization. Memory is managed in Settings > Personalization. The learn.chatgpt.com page names the setting but gives no web menu path or character limit. | https://learn.chatgpt.com/docs/personalize ; https://learn.chatgpt.com/docs/customization/memories | yes (menu path partly) |
| Project + files | Projects have "Project instructions" that apply across the project's chats, plus a **Sources** section for shared files and connected sources. The official page gives no limits. Secondary sources report 5 files (Free), 25 (Go/Plus), 40 (Pro/Business/Enterprise), 512 MB per file, and 10 files per upload batch. | https://learn.chatgpt.com/docs/projects ; https://help.openai.com/en/articles/10169521-projects-in-chatgpt (403) | yes (feature) / unverified (limits) |
| Connectors | Now called apps/plugins. A plugin bundles skills plus MCP servers. A **Google Drive** plugin works across Drive, Docs, Sheets and Slides. Admins set read and write actions separately per app. The learn.chatgpt.com pages do not name a chat-side GitHub or SharePoint/OneDrive app. Secondary sources say GitHub and SharePoint apps exist, and that custom MCP on Pro is limited to read/fetch. | https://learn.chatgpt.com/docs/plugins ; https://learn.chatgpt.com/docs/enterprise/apps-and-connectors | yes (Drive, read/write split) / unverified (GitHub, SharePoint, Pro read-only) |
| Local file access | Not on the web. Desktop app only (see below). | https://learn.chatgpt.com/docs/projects | yes |
| Skills | Plugin-bundled skills work in Chat and Work on web, desktop and mobile. Invoke them with `@`. Standalone skills are desktop app, CLI and IDE only. | https://learn.chatgpt.com/docs/build-skills | yes |
| Prompt prefill URL | `https://chatgpt.com/?q=<text>` prefills the input. It is **not officially documented**; an OpenAI community reply calls it unsupported. Tenable's 2025 advisory says OpenAI added auto-submit protections, so expect a prefill without auto-send. | https://community.openai.com/t/url-to-pass-prompt-into-gpt/574003 ; https://www.tenable.com/security/research/tra-2025-22 | unverified (works per caller's 2026-11-14 test; no official doc) |

### Claude.ai

| Capability | Finding | Source URL | Verified? |
|---|---|---|---|
| Custom instructions | Account-wide "Instructions" under Settings > **Your Claude** (older layout: Account > "Instructions for Claude"). Memory and "Search and reference chats" are under Settings > Memory (paid plans). Styles were not covered on the official page read. | https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features ; https://support.claude.com/en/articles/11817273 | yes (instructions) / unverified (memory toggle path) |
| Project + files | Projects have project knowledge (upload docs, text, code) and project instructions. Free plan: up to 5 projects. On paid plans, RAG expands knowledge "by up to 10x". The page states no file count or size cap. A redesigned Projects beta is rolling out. | https://support.claude.com/en/articles/9517075-what-are-projects | yes |
| Connectors: GitHub | "Add from GitHub" in chats and projects. Syncs the file names and contents of selected files on one branch; a Sync button refreshes them. Private repos need the Claude GitHub App. **Read-only**: no write is described. Must fit in the context window. | https://support.claude.com/en/articles/10167454-using-the-github-integration | yes |
| Connectors: Google Drive | Search and read Docs, Sheets, Slides, PDFs and Office files. **Not read-only**: it can share, move, trash, upload and create folders. Drive files can be added to *private* projects only. Available on all plans. | https://support.claude.com/en/articles/10166901-using-the-google-drive-integration | yes |
| Connectors: OneDrive/SharePoint | Microsoft 365 connector on all plans (Free through Enterprise). Read-only by default (`Files.Read.All`, `Sites.Read.All`). Write (`Files.ReadWrite.All`) needs Entra admin consent plus org admin enabling write tools. It cannot read OneNote. | https://support.claude.com/en/articles/12542951-enabling-and-using-the-microsoft-365-connector | yes |
| Local file access | Not on the web. Use Claude Desktop (Code / Cowork tabs) instead. | https://code.claude.com/docs/en/desktop | yes |
| Skills | Yes, on Free, Pro, Max, Ultra, Team and Enterprise. Requires code execution. Upload a ZIP of a skill folder containing `SKILL.md` at Customize > Skills > + > Create skill > Upload a skill. Uploads accept only the frontmatter fields `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools`. | https://support.claude.com/en/articles/12512180-using-skills-in-claude ; https://code.claude.com/docs/en/skills | yes |
| Prompt prefill URL | **Desktop is documented:** `claude://claude.ai/new?q=` prefills without sending (q truncated at about 14,000 chars). Also `claude://code/new` and `claude://cowork/new` with `q`, `folder` and `file`. The **web** form `https://claude.ai/new?q=` is not in Anthropic's docs. Community reports say it prefills; one GitHub issue says auto-submit stopped in Oct 2025. | https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link | yes (claude://) / unverified (https web form; caller's 2026-11-14 test says it works) |

### Gemini web app (gemini.google.com)

| Capability | Finding | Source URL | Verified? |
|---|---|---|---|
| Custom instructions | **Personal context** (Settings > Personal context, or gemini.google.com/saved-info). Saved info appears there as "Your instructions for Gemini". | https://support.google.com/gemini/answer/16413516 | yes |
| Project + files | **Gems are retired for personal accounts.** From 2026-11-17 Gems are read-only and converted to skills; they are removed 2026-12-17. Work/school accounts follow in 2027 (business Mar, education Jun). Skills hold reference files with a 100 MB total; GitHub files, archives and legacy Office files don't carry over from Gems. Gems could use uploaded files, Drive files and NotebookLM notebooks as Knowledge. | https://support.google.com/gemini/answer/18560919 ; https://support.google.com/gemini/answer/15146780 ; https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/ | yes |
| Connectors: Drive | Connected Apps: summarize Docs, Sheets, Slides and PDFs. It **cannot** create or move files, read pictures or videos, or create Docs/Sheets/Slides (you can export a response instead), so in practice read-only. Mention the app with `@` in each new chat. Needs Gemini history on. | https://support.google.com/gemini/answer/14959807 | yes |
| Connectors: GitHub | "Add file > Import code": 1 repo per chat, at most 5,000 files and 100 MB. It is a **snapshot with no sync**. Private repos need GitHub linked to the Google account. Web only for import. Read-only. | https://support.google.com/gemini/answer/16176929 | yes |
| Connectors: OneDrive/SharePoint | None documented. | https://support.google.com/gemini/answer/14959807 | yes (absence) |
| Local file access | Upload only (files and code folders); no live folder access. | https://workspaceupdates.googleblog.com/2025/06/upload-code-folders-and-github-repositories-to-gemini.html | unverified (not read) |
| Skills | **Yes, new.** Invoke a skill with `/` (soon `@`); Gemini can also apply one automatically. You can import a skill by uploading a folder containing `SKILL.md`, only on gemini.google.com and the Mac app. Downloading a skill gives a .zip. Gemini app skills don't sync with Workspace skills. | https://support.google.com/gemini/answer/18560919 | yes |
| Prompt prefill URL | **Not officially documented.** Third-party extensions claim `gemini.google.com/app?prompt=` or `?q=` works, but these may depend on the extension itself. A teacher blog cites `gemini.google.com/guided-learning?query=`. No Google source for either. | https://learninginhand.com/blog/2025/12/15/preload-learning-prompts-for-students-in-google-gemini | unverified |

### Google AI Studio (Build mode)

| Capability | Finding | Source URL | Verified? |
|---|---|---|---|
| System instructions | Not mentioned on the Build mode page. Prompt/Chat mode has system instructions (not re-checked today). | https://aistudio.google.com/docs/aistudio-build-mode | yes (absence on page) |
| Project + files | Build mode can "Import from GitHub" from the + menu. No general file-upload-as-context feature is described. Export as ZIP. | https://aistudio.google.com/docs/aistudio-build-mode | yes |
| Connectors | **Two-way GitHub sync**: push with generated commit messages, pull external changes, resolve conflicts, managed in Settings > GitHub. Drive appears only as an API that generated apps can call via OAuth, not as a context source. | https://aistudio.google.com/docs/aistudio-build-mode | yes |
| Local file access | None documented. | same | yes (absence) |
| Skills / AGENTS.md | Not documented for Build mode. | same | yes (absence) |
| Prompt prefill URL | Not documented. | same | yes (absence) |

---

## Desktop

### ChatGPT desktop app

| Capability | Finding | Source URL | Verified? |
|---|---|---|---|
| What it is | One desktop workspace for macOS, Windows and Linux. It has Chat and Work modes, and **Codex is built in** ("Choose ChatGPT or Codex"). It works with the browser, desktop apps and plugins, can be given computer access, and can schedule tasks. | https://learn.chatgpt.com/docs/app | yes |
| Local file access | **Local projects**: attach one or more local folders, and "ChatGPT can read and change files in every attached folder." The primary folder is used to discover `AGENTS.md`, skills and `config.toml`. Remote projects support one folder. Work mode needs local computer access enabled by the workspace. | https://learn.chatgpt.com/docs/projects | yes |
| Instructions | `AGENTS.md` in the primary folder; custom instructions are stored in global `AGENTS.md` in Codex. | https://learn.chatgpt.com/docs/personalize | yes |
| Skills | Standalone skills are available in the desktop app. | https://learn.chatgpt.com/docs/build-skills | yes |
| Prompt prefill / deep link | None found in docs. | — | unverified (not found) |

### Claude Desktop

| Capability | Finding | Source URL | Verified? |
|---|---|---|---|
| Code tab | Yes: "In the Claude Desktop app, Claude Code is the **Code** tab." Environments: Local (direct file access), Cloud, SSH, WSL. Runs on macOS, Windows, and Linux (beta). Local sessions load `~/.claude/skills/` and project skills. | https://code.claude.com/docs/en/desktop | yes |
| Cowork tab | Exists for longer agentic work. Its skills, plugins and connectors sync from the claude.ai account, not from `~/.claude`. Its `claude://cowork/new?folder=` link attaches a folder after confirmation. | https://code.claude.com/docs/en/desktop ; https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link | yes |
| Local MCP / extensions | Desktop extensions (`.mcpb`) install local MCP servers from Settings > Desktop app > Extensions, or from a custom file under Advanced settings. No filesystem extension is named on that page. | https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop | yes |
| Prompt prefill | `claude://claude.ai/new?q=`, `claude://code/new?q=&folder=`, `claude://cowork/new?q=&folder=&file=`. These prefill and do not send. | https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link | yes |

### Google Antigravity

| Capability | Finding | Source URL | Verified? |
|---|---|---|---|
| What it is | Google's agent platform with several surfaces: Antigravity **App** (desktop), **Antigravity CLI** (`agy`, successor to Gemini CLI), standalone **Antigravity IDE**, **IDE extensions** (VS Code, Visual Studio, JetBrains, Android Studio, Zed, Xcode, Eclipse, ACP) and a Python **SDK**. There is a free tier for personal accounts. | https://antigravity.google/docs/getting-started ; https://antigravity.google/docs/faq/ | yes |
| Instructions / rules | **Reads both `AGENTS.md` and `GEMINI.md`**, which are always active and need no frontmatter. Workspace locations, checked in the project folder and each parent up to the repo root: `<dir>/AGENTS.md`, `<dir>/GEMINI.md`, `<dir>/.agents/AGENTS.md`, `<dir>/.agents/GEMINI.md`, and `<dir>/.agents/rules/*.md` (legacy `.agent/rules/`, scanned one level deep). Global locations: `~/.gemini/AGENTS.md`, `~/.gemini/GEMINI.md`, `~/.gemini/config/{AGENTS,GEMINI}.md`, and `~/.gemini/config/rules/*.md` (frontmatter required). `CLAUDE.md` is not listed. | https://antigravity.google/docs/rules/ ; https://antigravity.google/docs/customization-discovery/ | yes |
| Skills | Yes, in Agent Skills `SKILL.md` format (`description` required). Workspace: `.agents/skills/<name>/`, with the App and CLI also checking parent folders up to the repo root (legacy `.agent/skills`). Global: `~/.gemini/config/skills/`. CLI only: `~/.gemini/skills/` and `~/.gemini/antigravity-cli/skills/`. IDE legacy: `~/.gemini/antigravity/skills/`. | https://antigravity.google/docs/skills/ | yes |
| Workflows | **Deprecated**: "Workflows are deprecated, and a new workflows system is on the way." Migrate them to skills with `/migrate-workflows` (App 2.12.0+). | https://antigravity.google/docs/ide/workflows/ | yes |
| Other config | `.agents/mcp_config.json`, `.agents/hooks.json`, `.agents/agents/`, `.agents/plugins/`, and manifests (`skills.json`, `rules.json`). | https://antigravity.google/docs/customization-discovery/ | yes |
| Deep link / URL scheme | **NOT documented.** The docs nav, FAQ, rules and customization pages have no `antigravity://` scheme and no prompt-prefill link. The only evidence is a user forum post showing an `antigravity-ide://oauth-success` OAuth callback, which is not a prompt deep link. The IDE is a VS Code fork, so it may register its own scheme, but nothing documents a prefill parameter. | https://antigravity.google/docs/faq/ ; https://discuss.ai.google.dev/t/subject-oauth-token-missing-from-redirect-url-after-successful-authentication/169323 | yes (absence in docs) / unverified (forum) |

---

## CLI

### Codex CLI

| Capability | Finding | Source URL | Verified? |
|---|---|---|---|
| Instructions | Global: `$CODEX_HOME` (default `~/.codex`) `AGENTS.override.md`, else `AGENTS.md`. Project: walks from the Git root down to the cwd; in each directory it uses `AGENTS.override.md`, then `AGENTS.md`, then names listed in `project_doc_fallback_filenames`, at most one file per directory. Files are concatenated root-first. The combined cap `project_doc_max_bytes` defaults to **32 KiB**, and content past it is truncated. | https://learn.chatgpt.com/docs/agent-configuration/agents-md | yes |
| Skills | Yes. Repo: `.agents/skills` in each directory from the cwd up to the repo root. User: `$HOME/.agents/skills`. Admin: `/etc/codex/skills`. Plus bundled system skills. `SKILL.md` needs `name` and `description`. `~/.codex/skills` is not listed. | https://learn.chatgpt.com/docs/build-skills | yes |
| Local file access | Yes (workspace sandbox). | https://learn.chatgpt.com/docs/cli | unverified (page not read) |

### Claude Code

| Capability | Finding | Source URL | Verified? |
|---|---|---|---|
| Instructions | `CLAUDE.md` or `.claude/CLAUDE.md` in the project, `CLAUDE.local.md`, `~/.claude/CLAUDE.md`, managed policy files, and `.claude/rules/` (path-scoped). Files in parent directories load at launch; subdirectory files load on demand. Target under 200 lines. | https://code.claude.com/docs/en/memory | yes |
| AGENTS.md | **Native since v2.1.277**, through the built-in plugin `cc-plugin-agents-md@builtin`. The default `claude-md-or-agents-md` reads `AGENTS.md` only if no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in the cwd or above. Options: `claude-md-and-agents-md`, `claude-md`, `managed-only`. It never reads `AGENTS.override.md`, `AGENTS.local.md` or anything under `.agents/`. | https://code.claude.com/docs/en/memory | yes |
| Imports | `@path/to/file` works anywhere in `CLAUDE.md` and is not parsed inside code spans. Relative paths resolve from the importing file. Imports nest up to 4 hops. External imports trigger a one-time approval dialog. `@AGENTS.md` is still the documented way to share one file. | https://code.claude.com/docs/en/memory | yes |
| Skills | `.claude/skills/<name>/SKILL.md` (project, nested, and parents up to the repo root), `~/.claude/skills/`, plugin skills, enterprise skills, `--add-dir`, and skills synced from the claude.ai account (`~/.claude/skills/synced/`). `.agents/skills` is **not** listed. | https://code.claude.com/docs/en/skills | yes |
| Prompt prefill | `claude-cli://open?q=&cwd=&repo=` opens a terminal with the prompt prefilled, not sent (q up to 5,000 chars). The VS Code extension uses `vscode://anthropic.claude-code/open`. | https://code.claude.com/docs/en/deep-links | yes |

### Gemini CLI (legacy) and Antigravity CLI

| Capability | Finding | Source URL | Verified? |
|---|---|---|---|
| Status | Gemini CLI was **replaced by Antigravity CLI (`agy`)**: announced 2026-05-19, with individual accounts cut over on 2026-06-18. It stays available with paid Gemini or Enterprise API keys. The Gemini CLI docs themselves note the replacement. | https://geminicli.com/docs/cli/skills/ ; https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/ | yes (geminicli.com) / unverified (blog not read) |
| Instructions | Loads `~/.gemini/GEMINI.md`, then workspace and parent `GEMINI.md` files, then just-in-time files from the directories that tools access. Setting `"context": {"fileName": ["AGENTS.md", "CONTEXT.md", "GEMINI.md"]}` makes it read `AGENTS.md` too. Supports `@file.md` imports. | https://geminicli.com/docs/cli/gemini-md/ | yes |
| Skills | Built-in < extension < user (`~/.gemini/skills/` or the `~/.agents/skills/` alias) < workspace (`.gemini/skills/` or the `.agents/skills/` alias). `.agents/` wins over `.gemini/`. | https://geminicli.com/docs/cli/skills/ | yes |
| Migration to agy | `GEMINI.md` and `AGENTS.md` keep working with no changes. Workspace skills must move from `.gemini/skills/` to `.agents/skills/`. `agy plugin import gemini` converts extensions into plugins. | https://antigravity.google/docs/cli/gcli-migration/ | yes |

---

## Portable "brain" layout implied by the docs

- One `AGENTS.md` at the repo root is read natively by Codex, Antigravity (App, CLI, IDE), Claude Code (when there is no `CLAUDE.md`), the ChatGPT desktop app (local projects) and Gemini CLI (with `context.fileName`).
- `.agents/skills/<name>/SKILL.md` is read by Codex, Antigravity, and Gemini CLI. **Claude Code does not read it**: use `.claude/skills` or a symlink.
- Web surfaces cannot read a live folder. Options:
  - Claude.ai: GitHub sync in Projects (read-only, manual Sync).
  - Gemini: GitHub import (snapshot).
  - ChatGPT: project Sources or plugins.
  - Skills upload as a ZIP to Claude.ai, or as a folder to the Gemini web app.
