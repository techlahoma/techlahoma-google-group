# Antigravity prompt: your brain + your own Google

- `Tease:` One pasted prompt sets up a brain, seeds it, indexes it, and opens a personal search page.
- `Lede:` Paste the prompt below into the Antigravity Agent panel. It works in a fresh folder or inside a clone of this repository.
- `Why it matters:` Workshop attendees type nothing by hand; the agent asks only the choices a person must make (where the brain lives).
- `Go deeper:` [Setup for every AI app](SETUP.md), [app README](README.md), [seed from meetings](SEED_FROM_MEETINGS.md).

## Copy this prompt

```text
Set up "Brain Search" for me: a personal Markdown memory ("brain") plus a local search page that works like my own 2010-style Google.

Use absolute paths everywhere and wrap them in double quotes, for example "/Users/sam/Brain" or "C:\Users\sam\Brain". Never use relative paths like ../Brain.

1. Get the code. If this workspace is not already a clone of https://github.com/techlahoma/techlahoma-google-group, clone it into a new folder and open it. Read AGENTS.md, apps/AGENTS.md and apps/brain-search/README.md. Check that Git and Bun (the version in package.json) are installed; if not, follow .agents/skills/bootstrap-workspace and ask me before installing anything. Then run: bun install --frozen-lockfile
   Tell me first that this installs the whole workshop repository, which can take a minute or more on slow Wi-Fi.

2. Pick where my brain lives. Check what you can reach from here: GitHub (gh CLI signed in?), a synced Google Drive or OneDrive folder on this computer, and local folders. List only the options that work, in this order: a new PRIVATE GitHub repo, a shared/synced drive folder, a local folder such as ~/Brain. Ask me to choose. Never create a public repo. If I'm unsure, use ~/Brain; it can move later. Ask for my first name too.

3. Create the brain at that location by copying apps/brain-search/brain (keep AGENTS.md, CLAUDE.md, index.md and .agents/skills). Ask whether to keep the example notes; if I say no, keep only AGENTS.md, CLAUDE.md, .agents and an index.md with empty headings. Read the brain's AGENTS.md and follow it for the rest of this session: recall before answering, capture after learning, update index.md, never invent facts.

4. Seed it. Ask me for 3-5 things I want to remember (my role, projects, groups I belong to, people I work with, recent meetings). Capture each as a note in the right folder with sources. If I have meeting notes you can reach, offer to run apps/brain-search/SEED_FROM_MEETINGS.md.

5. Index and launch. Work out the absolute path of the brain folder and of this repository's apps/brain-search folder, then run one line like this, with every path absolute and quoted:
   BRAIN_DIR="/Users/sam/Brain" BRAIN_LOCATION="~/Brain" BRAIN_OWNER="Sam" bun run --cwd "/Users/sam/code/techlahoma-google-group/apps/brain-search" index
   BRAIN_DIR is the brain folder. BRAIN_LOCATION is how AI prompts should describe it (a repo URL, a drive folder, or ~/Brain). BRAIN_OWNER is my first name. The index goes to apps/brain-search/.brain-local/, which is gitignored, so my notes are never committed to this public repository. The indexer ends by printing the exact re-index command for my brain: keep that line.
   Then start the page: bun run --cwd "/absolute/path/to/apps/brain-search" dev
   Open the printed local address (normally http://localhost:5173/). The logo is a pun on my first name (Sam becomes Samoogle), and I can click it and type to rename it. Search for one of my new notes to prove it works, and check that the footer says "your brain".

6. Make it stick. Antigravity reads AGENTS.md and .agents/skills from the folder it has open. A brain at ~/Brain sits outside this code workspace, so tell me plainly to open the brain folder as its own Antigravity project (or add it to this one with "add folder"). Don't promise that it loads automatically anywhere else unless you have checked. If the brain is a GitHub repo, offer to commit and push it; do that only if I say yes.

Finish with a short summary: where the brain lives, how many notes, the search URL, and the re-index line the indexer printed.
```
