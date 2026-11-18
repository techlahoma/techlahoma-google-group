# Antigravity prompt: your brain + your own Google

- `Tease:` One pasted prompt sets up a brain, seeds it, indexes it, and opens a personal search page.
- `Lede:` Paste the prompt below into the Antigravity Agent panel. It works in a fresh folder or inside a clone of this repository.
- `Why it matters:` Workshop attendees type nothing by hand; the agent asks only the choices a person must make (where the brain lives).
- `Go deeper:` [Setup for every AI app](SETUP.md), [app README](README.md), [seed from meetings](SEED_FROM_MEETINGS.md).

## Copy this prompt

```text
Set up "Brain Search" for me: a personal Markdown memory ("brain") plus a local search page that works like my own Google.

1. Get the code. If this workspace is not already a clone of https://github.com/techlahoma/techlahoma-google-group, clone it into a new folder and open it. Read AGENTS.md, apps/AGENTS.md and apps/brain-search/README.md. Check that Git and Bun (the version in package.json) are installed; if not, follow .agents/skills/bootstrap-workspace and ask me before installing anything. Then run: bun install --frozen-lockfile

2. Pick where my brain lives. Check what you can reach from here: GitHub (gh CLI signed in?), a synced Google Drive or OneDrive folder on this computer, and local folders. List only the options that work, in this order: a new PRIVATE GitHub repo, a shared/synced drive folder, a local folder such as ~/Brain. Ask me to choose. Never create a public repo. If I'm unsure, use ~/Brain; it can move later.

3. Create the brain at that location by copying apps/brain-search/brain (keep AGENTS.md, CLAUDE.md, index.md and .agents/skills). Ask whether to keep the example notes; if I say no, keep only AGENTS.md, CLAUDE.md, .agents and an index.md with empty headings. Read the brain's AGENTS.md and follow it for the rest of this session: recall before answering, capture after learning, update index.md, never invent facts.

4. Seed it. Ask me for 3-5 things I want to remember (my role, projects, groups I belong to, people I work with, recent meetings). Capture each as a note in the right folder with sources. If I have meeting notes you can reach, offer to run apps/brain-search/SEED_FROM_MEETINGS.md.

5. Index and launch. From the repository root run:
   BRAIN_DIR=<the brain folder> BRAIN_LOCATION="<how to describe it, e.g. github.com/me/brain or ~/Brain>" BRAIN_OWNER="<my first name>" bun run --cwd apps/brain-search index
   then start the page with: bun run --cwd apps/brain-search dev
   Open the printed local address (normally http://localhost:5173/) in the browser. The logo is a pun on my first name (for example Samoogle). Search for one of my new notes to prove it works.

6. Make it stick. Tell me exactly which files make Antigravity load this brain next time (it reads AGENTS.md and .agents/skills in the workspace). Offer to commit and push the brain if it is a GitHub repo; do that only if I say yes.

Finish with a short summary: where the brain lives, how many notes, the search URL, and the one command to re-index after adding notes.
