# Agent prompt: your brain + your own (local) Google

- `Tease:` One pasted prompt connects a finished 2010-style search page to your own notes, files and meetings, and teaches your AI apps to remember.
- `Lede:` Paste the prompt below into Antigravity, or any agent that can run terminal commands (Codex, Claude Code, the ChatGPT or Claude desktop app). The search page is already built; the agent's job is to connect it to your context, keep the brain where you choose, run it on your computer only, and keep the brain up to date.
- `Why it matters:` Attendees type nothing by hand. The agent asks only what a person must decide: which sources to read and where the brain lives.
- `Go deeper:` [Setup for every AI app](SETUP.md), [app README](README.md), [seed from meetings](SEED_FROM_MEETINGS.md).

## Copy this prompt

```text
Set up "Brain Search" for me: a personal Markdown memory ("brain") that my AI apps read and write, plus a finished 2010-style search page that runs only on my computer.

Ground rules:
- The search page is a finished template in apps/brain-search. Do not rebuild, restyle or redesign it, and do not generate a new UI. Your job is to connect it to my context, not to write a web app.
- Everything stays local. Run the page on localhost only. Never deploy it, publish it, or upload my index anywhere.
- Use absolute paths everywhere and wrap them in double quotes, for example "/Users/sam/Brain" or "C:\Users\sam\Brain". Never use relative paths like ../Brain.
- Ask before reading anything sensitive (email, HR, health, legal, money, private chats), and before any push or upload.

1. Get the template. If this workspace is not already a clone of https://github.com/techlahoma/techlahoma-google-group, clone it into a new folder and open it. Read AGENTS.md, apps/AGENTS.md and apps/brain-search/README.md. Check that Git and Bun (the version in package.json) are installed; if not, follow .agents/skills/bootstrap-workspace and ask me before installing anything. Tell me that the next step installs the whole workshop repository and can take a minute or more on slow Wi-Fi, then run: bun install --frozen-lockfile

2. Inventory my context. Check what you can actually reach from here, without opening private contents yet: folders on this computer (Documents, Desktop, notes apps such as Obsidian), synced Google Drive or OneDrive folders, GitHub (is the gh CLI signed in?), meeting notes (a Granola or Google Meet connector, transcript files, Google Docs), and any connectors or MCP servers this app has. Show me the list with what each would add, and let me pick which to use.

3. Pick the brain's home. Offer the options that work, in this order: a new PRIVATE GitHub repo, a Google Drive or OneDrive folder (a synced folder on disk is easiest), or a local folder such as ~/Brain (it can move later). Never create a public repo. Ask for my first name too.
   Create the brain there by copying apps/brain-search/brain (keep AGENTS.md, CLAUDE.md, index.md and .agents/skills). Ask whether to keep the example notes; if not, keep only AGENTS.md, CLAUDE.md, .agents and an index.md with empty headings. Read the brain's AGENTS.md and follow its loop for the rest of this session: recall, capture, re-index, sync.

4. Seed it from my real context. From the sources I picked, write 5-15 notes about the people, organizations, projects, events, meetings and decisions that matter to me: one topic per file, every fact with a source (a URL, a file path, or "meeting: <title>, <date>"). For meetings, follow apps/brain-search/SEED_FROM_MEETINGS.md. Never invent facts. Show me the list of notes before you write them.

5. Index and start the local page. Work out the absolute paths of the brain and of this repository's apps/brain-search folder, then run one line like this, with every path absolute and quoted:
   BRAIN_DIR="/Users/sam/Brain" BRAIN_LOCATION="~/Brain" BRAIN_OWNER="Sam" bun run --cwd "/Users/sam/code/techlahoma-google-group/apps/brain-search" index
   BRAIN_DIR is the brain folder. BRAIN_LOCATION is how AI prompts should describe it (a repo URL, a drive folder, or ~/Brain). BRAIN_OWNER is my first name. The index goes to apps/brain-search/.brain-local/, which is gitignored, so my notes never enter this public repository. The indexer ends by printing the exact re-index command: keep that line.
   Then start the page in watch mode. It listens on 127.0.0.1 only; never add --host 0.0.0.0 or deploy it:
   BRAIN_DIR="/Users/sam/Brain" BRAIN_LOCATION="~/Brain" BRAIN_OWNER="Sam" bun run --cwd "/Users/sam/code/techlahoma-google-group/apps/brain-search" dev
   Open the printed address (normally http://127.0.0.1:5173/). The logo is a pun on my name (Sam becomes Samoogle) and I can click it to rename it. Search for one of my new notes to prove it works, and check that the footer says "your brain". While it runs, any note you or another agent writes is re-indexed within a second or two and the page refreshes.

6. Install the read-and-write memory loop. Make this agent read the brain before answering and write new memories back:
   - Antigravity reads AGENTS.md and .agents/skills from the folder it has open. A brain at ~/Brain sits outside this code workspace, so tell me plainly to open the brain folder as its own Antigravity project (or add it with "add folder").
   - Codex and the ChatGPT desktop app read AGENTS.md; Claude Code and the Claude desktop Code tab read the brain's CLAUDE.md (which imports AGENTS.md) and need the skills copied into .claude/skills; Gemini CLI reads GEMINI.md, or AGENTS.md if configured.
   Don't promise anything loads automatically unless you have checked it in this app. Then offer to set up my other AI apps from apps/brain-search/SETUP.md, one at a time, and tell me what I must click myself.
   If the brain is a GitHub repo, offer to commit and push the first version; do it only if I say yes.

Finish with a short summary: where the brain lives, which sources you used, how many notes, the local search URL, the re-index line the indexer printed, and which apps now read and write the brain.
```
