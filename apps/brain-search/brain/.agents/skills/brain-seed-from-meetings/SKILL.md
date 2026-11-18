---
name: brain-seed-from-meetings
description: Walk the user's meeting notes or transcripts (Granola, Google Meet notes, Google Docs, Zoom or Teams transcripts, or pasted text) and seed the brain with people, organizations, decisions and follow-ups. Use when the user asks to "go through my meetings", "seed my brain from meetings", or import meeting notes.
---

# Seed the brain from meetings

Turn meetings into a few well-linked notes, without copying private chatter.

## 1. Find the meetings

Ask which meetings and date range, or default to the last 30 days. Use what
this app can reach, in this order:

- A meeting-notes connector or MCP server (for example Granola).
- Google Drive / Docs (Google Meet "Notes by Gemini" and transcripts are saved
  as Docs in the organizer's Drive).
- Files in a folder the user points to (exported transcripts, `.vtt`, `.txt`, `.md`).
- Text the user pastes into the chat.

List what you found (title, date) and let the user deselect anything private.
Ask before opening anything sensitive (HR, health, legal, money, one-on-ones).

## 2. For each meeting, extract

- **Meeting note** → `meetings/YYYY-MM-DD-short-title.md`: date, attendees
  (names only), a 2-4 sentence summary, **Decisions**, **Follow-ups**, open
  questions. Source: `meeting: <title>, <date>` plus a link if one exists.
- **People** → `people/<name>.md`: role and organization as stated in the
  meeting, what they work on, and links to the meetings they were in. No contact
  details unless the user asks.
- **Organizations, projects and topics** → `orgs/`, `notes/`: only durable facts.
- **Follow-ups**: one checkbox line each, with owner and due date when stated:
  `- [ ] Owner: task (due YYYY-MM-DD)`.

For richer follow-up extraction, use Sam's public action-items skill:
https://github.com/ThatGuySam/skills/tree/main/skills/sams-action-items
(link it or install it in your agent; don't copy it into the brain).

## 3. Write

Follow the `brain-capture` skill for every note: search first, update instead
of duplicating, use the note format, update `index.md`. Then rebuild the Brain
Search index if it's installed and not in watch mode, with `BRAIN_DIR` set to
this brain:

```sh
BRAIN_DIR="/absolute/path/to/this/brain" bun run --cwd "/absolute/path/to/techlahoma-google-group/apps/brain-search" index
```

Then sync: commit and push if the brain is a Git repo (ask before the first
push), or save to the Drive/OneDrive folder.

## 4. Report

Summarize: meetings processed, notes created, notes updated, follow-ups found
(owner + task), and anything you skipped and why.

## Rules

- Never invent attendees, decisions or dates. If the transcript is unclear,
  write `TODO: verify` instead of guessing.
- Don't quote people word-for-word unless the user asks; summarize.
- Leave out sensitive personal details (health, money, HR matters).
