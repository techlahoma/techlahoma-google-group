# Seed your brain from your meetings

- `Tease:` Turn meeting notes into people, decisions and follow-ups in your brain.
- `Lede:` Paste the prompt into any agent that can reach your meeting notes: Granola, Google Meet notes in Google Drive, Docs, exported transcripts, or text you paste.
- `Why it matters:` Meetings hold most of what you'd want to recall later, and nobody writes it down.
- `Go deeper:` The full procedure is the brain skill [`brain-seed-from-meetings`](brain/.agents/skills/brain-seed-from-meetings/SKILL.md). Follow-ups use Sam's [action-items skill](https://github.com/ThatGuySam/skills/tree/main/skills/sams-action-items).

## Copy this prompt

```text
Go through my meetings and seed my brain.

My brain is at: [path, private GitHub repo, or Drive folder]. Read its AGENTS.md and .agents/skills/brain-seed-from-meetings/SKILL.md and follow them.

1. Ask before opening anything sensitive (HR, health, legal, money, one-on-ones). Find my meetings from the last [30] days using whatever you can reach: a meeting-notes connector (for example Granola), Google Drive/Docs (Google Meet "Notes by Gemini" and transcripts are saved as Docs), files in a folder I name, or transcripts I paste below. List them (title, date) and let me remove any I want kept out.
2. For each meeting write meetings/YYYY-MM-DD-short-title.md with attendees, a short summary, Decisions, Follow-ups and open questions. Create or update people/ and orgs/ notes for durable facts (roles, projects), never contact details.
3. Capture follow-ups as checkbox lines with owner and due date. If you can, install or follow the action-items skill at https://github.com/ThatGuySam/skills/tree/main/skills/sams-action-items to find them.
4. Search before writing: update existing notes instead of duplicating. Update index.md. Never invent attendees, decisions or dates; write TODO: verify when unsure. Summarize, don't quote.
5. If the local search page is running in watch mode, it re-indexes by itself. Otherwise re-index with absolute, quoted paths and BRAIN_DIR set to my brain (the indexer prints this line, filled in, after every run): BRAIN_DIR="/absolute/path/to/this/brain" bun run --cwd "/absolute/path/to/techlahoma-google-group/apps/brain-search" index
6. Sync: if my brain is a Git repo, commit the new notes and push (ask me before the first push); if it is a Drive or OneDrive folder, save the files there.
7. Report: meetings processed, notes created and updated, follow-ups by owner, and anything skipped.

[Paste transcripts here if the app can't reach your meeting notes.]
```

## Try it with the sample meetings

The starter brain has three fictional meetings in `brain/meetings/` (marked
`sample: true`). Ask your agent: "Read the sample meetings in my brain and list
every follow-up by owner." Then search Brain Search for `follow-ups`.

## Where meeting notes usually live

| Source | How an agent reaches it |
|---|---|
| Granola | A Granola connector or MCP server in the agent, or export notes and paste them |
| Google Meet | "Take notes with Gemini" and transcripts save to Google Docs in the organizer's Drive; use a Drive connector or download the Docs |
| Zoom / Teams | Download the transcript file (`.vtt` or `.docx`) into a folder the agent can read |
| Anything else | Copy the notes and paste them into the prompt |
