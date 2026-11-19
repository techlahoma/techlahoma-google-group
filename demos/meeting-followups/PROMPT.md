# Prompts: recapping meetings and follow-ups

- `Tease:` Paste one prompt and get "who does what by when" for each meeting, follow-up emails as drafts, and one person's list for the week.
- `Lede:` Prompt A runs on three made-up meetings in `sample/`. Prompt B runs on your own meetings, either pasted into a browser chat or read from Google Meet notes, Docs, or Drive.
- `Why it matters:` The agent is told to quote the notes for every item and to write OWNER UNCLEAR or DATE UNCLEAR instead of guessing, so you can trust the list or see exactly what to ask.
- `Go deeper:` [Presenter page for the live Granola flow](GRANOLA.md) · [What this demo is](README.md) · [Output rules](RULES.md) · [How to check a run](TEST.md) · [Reference output](expected/)

## Prompt A: try it on the sample

Open this repository in Antigravity (or any agent app that can read and write files) and paste this. If you opened only the `demos/meeting-followups` folder, tell the agent the paths start there.

```text
Recap the three sample meetings in demos/meeting-followups/sample/ into "who does what by when" lists. Everything you produce is a file. Do not send email, post messages, or change any calendar.

1. Use the sams-action-items skill if it is installed. If it is not, read https://raw.githubusercontent.com/ThatGuySam/skills/main/skills/sams-action-items/SKILL.md and follow its method. If you can't open it, keep going.
2. Read demos/meeting-followups/RULES.md. It sets the output files and their exact layout. Follow it exactly.
3. Read every file in demos/meeting-followups/sample/. Note that followup-message.md was sent after meeting 3 and corrects it.
4. Write one action list per meeting in demos/meeting-followups/output/: 01-pantry-dinner-actions.md, 02-fernbrook-call-actions.md, 03-portal-status-actions.md.
5. Write one follow-up email draft per meeting in demos/meeting-followups/output/emails/: 01-pantry-dinner-email.md, 02-fernbrook-call-email.md, 03-portal-status-email.md.
6. Write demos/meeting-followups/output/dana-this-week.md: Dana Whitfield's action items from all three meetings for Monday, November 16 through Sunday, November 22, 2026.
7. Check your work. Every action row has an exact quote from the sample. Nothing is guessed: unclear owners say OWNER UNCLEAR and unclear dates say DATE UNCLEAR. Check owner and date separately for each task: a firm date stays firm even when the owner is unclear, and a meeting date mentioned for context (such as a board meeting) is not a task deadline unless the notes tie it to that task. Meeting 3 uses every corrected date from followup-message.md, and each task keeps its own deadline. Give each action its own row and its own deadline; never combine two deadlines in one row. Include any follow-up call or meeting as its own action, and ask who owns it and when it happens. Each email draft asks a direct "who" or "when" question for every unclear item. If Bun is installed, run: bun demos/meeting-followups/check.ts and fix anything it marks ❌. If you can't run it, reread all seven files against RULES.md and sample/ yourself.
8. Tell me which files you wrote, and list every OWNER UNCLEAR and DATE UNCLEAR item so I know who to ask.
```

Then open `output/` and compare with [`expected/`](expected/). [TEST.md](TEST.md) has the checks.

## Prompt B: now on your own meetings

### B1. Any browser chat (Gemini, ChatGPT, Claude): paste your notes

Works with nothing connected, so it is safe for work accounts that can't link to AI apps. Remove anything confidential before you paste.

```text
Turn the meeting notes at the bottom into a "who does what by when" list.

1. Use only what the notes say. Do not add tasks, people, dates, or numbers.
2. One line per action: owner, what they will do, by when. Turn "Friday" into a real date. The meeting was on [date].
3. If nobody clearly took a task, write OWNER UNCLEAR. If there is no date, or only "soon", write DATE UNCLEAR. Do not guess.
4. Under the list, quote the 4 to 20 words from my notes that each line came from, word for word.
5. If the later messages below change something, the later message wins. Mark that line "changed" and say what it was before.
6. List separately: decisions, open questions, and things that came up but are not action items.
7. Draft one short follow-up email to the attendees, under 200 words. Ask about every UNCLEAR item. Promise nothing the meeting didn't. I will send it myself.
8. Last, list only my items for this week. I am [your name].

Meeting notes or transcript:
[paste here]

Later messages that correct it (optional):
[paste here]
```

### B2. Antigravity or Gemini with Google Meet notes, Docs, or Drive

Use this where the app can reach your Google account, or where you have saved meeting notes into a folder. Google Meet's "Take notes with Gemini" and transcripts are saved as Google Docs in the organizer's Drive.

```text
Recap my recent meetings into "who does what by when" lists. Use the sams-action-items skill if it is installed. If it is not, read https://raw.githubusercontent.com/ThatGuySam/skills/main/skills/sams-action-items/SKILL.md and follow its method. For the layout, follow https://raw.githubusercontent.com/techlahoma/techlahoma-google-group/main/demos/meeting-followups/RULES.md if you can open it.

1. Find my meeting notes from the last [7] days in whatever you can reach: Google Meet notes and transcripts saved as Google Docs, a Drive folder I name, or files in [folder]. Show me the list (title, date) and wait for me to pick. Ask before opening anything sensitive (HR, health, legal, money, one-on-ones).
2. For each meeting I pick, look for later emails, chat messages, or doc comments that correct it. The latest version wins. Show what changed.
3. For each meeting, write one action list: owner, what, by when, with an exact quote from the notes for each line. Write OWNER UNCLEAR or DATE UNCLEAR instead of guessing. Use only what the notes say.
4. Draft one follow-up email per meeting that asks about every UNCLEAR item. Save it as a file or a draft. Do not send it.
5. Write one combined list of my own items for this week. I am [your name].
6. Save everything in [folder]/output/ if you can write files. If you can't, show it in chat.
7. Before you send any email, create a task or calendar event, or share or edit a document: show me the plan and wait for my yes.
```

## Prompt C: the brain twist (agents and people)

Run it after an action list. It suggests an owner for every task: an AI agent, a person on a team roster, or nobody. The roster comes from the people notes in the workshop's seed brain (`apps/brain-search/brain/people/`), and the prompt may use only what those notes say. How it was designed and tested: [PROMPT-NOTES.md](PROMPT-NOTES.md).

### C1. Antigravity, on the sample meeting

```text
Suggest who could do each task from a meeting: an AI agent, or a person on my team. The result is one table. Only suggest. Do not send, post, book, or change anything.

Read two files: demos/meeting-followups/demo-meeting/roster.md is the TEAM ROSTER, and demos/meeting-followups/demo-meeting/transcript.md is the MEETING. Read no other files. The roster is my team's own notes on each person's public role, and I decide who does what. Treat it as everything you know about these people. Add nothing from memory, even if you recognize a name.

1. List every task the meeting asks for, one row each, in the order it came up.
2. Pick one owner for each task. Write the Suggested owner cell exactly as one of these four, with nothing added:
   - Agent: an AI agent can do it on a computer from a file or an account, such as summarizing a list, drafting an email, or writing text for a page. The agent only drafts. A person sends or publishes.
   - A full name from the roster: the task needs a person (a call, an ask, a decision, a talk) and one roster fact fits this task. Being a host is not enough to pick someone, because several people are hosts.
   - Their name followed by (volunteered), like this: Pat Doe (volunteered). Use it when someone in the meeting said they would do the task. Keep them, even if they are not on the roster. If the meeting does not show who spoke, write: Someone in the meeting (volunteered).
   - unassigned: the task needs a person and no roster fact fits. Do not guess.
3. Why: copy 4 to 20 words from the meeting, word for word, in double quotes. Then add exactly one of these:
   - Roster: "<the one fact that fits, copied from the roster>"
   - Needs: <the files or accounts the agent must be given>
   - Volunteered.
   - No roster fact fits.
4. First step: one small action that starts the task. For an Agent row it is a draft or a summary for a person to review. Name only people and things that the meeting or the roster names.

Format: a Markdown table with these columns: # | Task | Suggested owner | Why | First step. After the table, write one line: Nothing was sent or changed.

Save the table and that line to demos/meeting-followups/output/demo-meeting/agents-and-people.md, then show the table in chat.
```

Then check it: `bun demos/meeting-followups/check-twist.ts`. Reference: [`expected/demo-meeting/agents-and-people.md`](expected/demo-meeting/agents-and-people.md).

### C2. Any browser chat, or your own meeting

Paste your transcript or notes at the bottom. To use your own team, replace the roster with one line per person, holding only facts you would be happy for them to read.

```text
Suggest who could do each task from the meeting below: an AI agent, or a person on my team. Reply with one table and nothing before it. Only suggest. Do not send, post, book, or change anything.

The TEAM ROSTER and the MEETING are at the bottom. The roster is my team's own notes on each person's public role, and I decide who does what. Treat it as everything you know about these people. Add nothing from memory, even if you recognize a name.

1. List every task the meeting asks for, one row each, in the order it came up.
2. Pick one owner for each task. Write the Suggested owner cell exactly as one of these four, with nothing added:
   - Agent: an AI agent can do it on a computer from a file or an account, such as summarizing a list, drafting an email, or writing text for a page. The agent only drafts. A person sends or publishes.
   - A full name from the roster: the task needs a person (a call, an ask, a decision, a talk) and one roster fact fits this task. Being a host is not enough to pick someone, because several people are hosts.
   - Their name followed by (volunteered), like this: Pat Doe (volunteered). Use it when someone in the meeting said they would do the task. Keep them, even if they are not on the roster. If the meeting does not show who spoke, write: Someone in the meeting (volunteered).
   - unassigned: the task needs a person and no roster fact fits. Do not guess.
3. Why: copy 4 to 20 words from the meeting, word for word, in double quotes. Then add exactly one of these:
   - Roster: "<the one fact that fits, copied from the roster>"
   - Needs: <the files or accounts the agent must be given>
   - Volunteered.
   - No roster fact fits.
4. First step: one small action that starts the task. For an Agent row it is a draft or a summary for a person to review. Name only people and things that the meeting or the roster names.

Format: a Markdown table with these columns: # | Task | Suggested owner | Why | First step. After the table, write one line: Nothing was sent or changed.

TEAM ROSTER
- Sam Carlton: hosted and demoed at "Google Dev × Women+ in Tech: Actual Productivity with AI" on Nov 19, 2026. Publishes free agent skills at skills.samcarlton.com. Built the Tulsa Ecosystem Map and FetchMoji.
- Zain Khan: organizer of GDG Tulsa. Listed as a host of the Nov 19, 2026 event.
- Jess Trippiedi: listed as a host of the Nov 19, 2026 event. No other details recorded.
- Valerie Feral: listed as a host of the Nov 19, 2026 event. No other details recorded.
- Tran Trinh: listed as a host of the Nov 19, 2026 event. No other details recorded.
- Lauren Tan: software engineer. Author of Brainmaxxing.

MEETING (Thursday, November 19, 2026):
[paste the Granola transcript or notes here]
```

### Action items for one pasted meeting (used live before Prompt C)

```text
Use the sams-action-items skill on the meeting transcript below. If the skill is not installed, read https://raw.githubusercontent.com/ThatGuySam/skills/main/skills/sams-action-items/SKILL.md and follow its method. If you can't open it, keep going with the rules here.

Reply in chat with one copyable tree of who does what by when, one line per action: owner: task · by date. The meeting was on Thursday, November 19, 2026. Use only what the transcript says. If nobody clearly took a task, write OWNER UNCLEAR. If there is no date, write DATE UNCLEAR. Do not guess. Do not send, post, or create anything.

Meeting transcript:
[paste the Granola transcript or notes here]
```

## Install the skill in an agent app

Both prompts work without installing anything. To keep the skill for every future meeting, run this in an agent app that has a terminal (Antigravity, Claude Code, Codex). It needs Node.js.

```sh
npx skills add ThatGuySam/skills --skill sams-action-items
```

Then ask: "Use the action items skill on yesterday's meeting." The skill is at [ThatGuySam/skills](https://github.com/ThatGuySam/skills/blob/main/skills/sams-action-items/SKILL.md).
