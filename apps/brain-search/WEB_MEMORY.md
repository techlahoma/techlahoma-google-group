# Use your brain as memory in ChatGPT and Claude

- `Tease:` No install? Your chat Projects can still read your brain and help write it.
- `Lede:` Put the brain's notes and memory instructions in a ChatGPT or Claude Project. The chat reads them as context and drafts new notes; a connector or a local agent writes them back.
- `Why it matters:` The search page is a finished local template; nobody needs to rebuild it in a chat. What a chat app adds is memory.
- `Go deeper:` [Setup for every AI app](SETUP.md) has the per-app details and which claims are verified; [PROMPT.md](PROMPT.md) sets up the brain and the local page.

## What this does and doesn't do

- **Does:** the Project reads your notes before answering, cites them, and writes
  new memories back when its connector allows it. Otherwise it drafts the note
  for you to save.
- **Doesn't:** host the search page. That runs only on your computer
  (`bun run --cwd apps/brain-search dev`). The hosted demo at
  [oogle.web.app](https://oogle.web.app) shows the example brain only.
- Notes you upload or connect are sent to that AI provider. Leave out anything
  you wouldn't put in a chat.

## Claude Project

1. Create a Project and paste the memory instructions below into its
   instructions.
2. Connect the brain:
   - **GitHub** ("Add from GitHub"): pick the private brain repo. It's read-only;
     press Sync after the brain changes.
   - **Google Drive:** pick the brain folder. The connector can also upload files,
     so Claude can save new notes there.
3. Optional: upload each folder in the brain's `.agents/skills/` as a ZIP under
   Customize → Skills.

## ChatGPT Project

1. Create a Project and paste the memory instructions into its project
   instructions.
2. Add the brain: upload the notes to the Project's Sources, or connect the
   Google Drive app to the brain folder. Re-upload after big changes.
3. Writing back: ChatGPT drafts the note (path, frontmatter, `index.md` line).
   Save it yourself, or let the ChatGPT desktop app (local project), Codex or
   another local agent write and commit it.

## Memory instructions (paste into the Project)

```text
My "brain" is a folder of Markdown notes in this Project ([GitHub repo / Drive folder / uploaded files]). It has an index.md and one note per topic (people/, orgs/, events/, meetings/, notes/).

Read: before answering, search the brain and cite note paths like (orgs/gdg-tulsa.md). If it lacks the answer, say so, then answer from other sources with citations.

Write: when I share something durable (a fact with a source, a decision, a follow-up with an owner), update the matching note or create one. Use frontmatter with title, tags, source and updated (YYYY-MM-DD), keep one topic per file, and add a link in index.md. If you can write to the connected folder, save it there and tell me the path. If you can't, give me the finished note, its exact path and the index.md line to add.

Never invent facts, dates, names or URLs. Keep other people's private details out unless I ask.
```
