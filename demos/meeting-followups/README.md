# Recapping meetings and follow-ups

- `Tease:` Hand an AI agent your meeting notes and get back "who does what by when", follow-up emails ready to review, and your own list for the week.
- `Lede:` Three made-up meetings ship in `sample/`: a raw transcript, messy notes from a sales call, and a status meeting that was corrected the next morning. One pasted prompt turns them into action lists, email drafts, and one person's week. A second prompt does the same for your own meetings.
- `Why it matters:` The risky part of an AI recap is what it makes up. Here every action carries a quote from the notes, and anything nobody clearly owned is marked OWNER UNCLEAR or DATE UNCLEAR for you to ask about.
- `Go deeper:` [Presenter page: Granola and the brain twist](GRANOLA.md) · [Prompts](PROMPT.md) · [Output rules](RULES.md) · [How to check a run](TEST.md) · [Reference output](expected/) · [Sample meetings](sample/README.md)

Workshop demo for "Actual Productivity with AI" (Google Developer Group Tulsa × Women+ in Technology of Tulsa, with Techlahoma), November 19, 2026.

## How it is shown live

1. **Record.** Sam records a 2 to 3 minute planning chat with the room in Granola, a meeting notes app that transcribes from the laptop's microphone.
2. **Action items.** He pastes the transcript with the Action Items prompt and gets who does what by when, with unclear owners marked.
3. **The brain twist.** A second prompt suggests an owner for every task: an AI agent, or a person from the people notes in the workshop's seed brain. Agent rows say what the agent needs access to. Person rows quote the brain fact that made the match. When no fact fits, the row says unassigned.

[GRANOLA.md](GRANOLA.md) has every step and every prompt in copyable blocks. If the recording fails, [`demo-meeting/transcript.md`](demo-meeting/transcript.md) is a made-up meeting to use instead, and [`expected/demo-meeting/`](expected/demo-meeting/) holds a finished run.

You can try the twist yourself without Granola: open this repository in Antigravity and paste **Prompt C1** from [PROMPT.md](PROMPT.md), or paste **Prompt C2** into any browser chat. It takes a cheap model about 20 seconds.

## Try it in 5 minutes

1. Open this repository in Google Antigravity, or any agent app that can read and write files.
2. Copy **Prompt A** from [PROMPT.md](PROMPT.md) and paste it in.
3. Open the new `output/` folder. You get seven files.

| File | What it is |
|---|---|
| `output/01-pantry-dinner-actions.md` | Who does what by when, from a 10 minute committee transcript |
| `output/02-fernbrook-call-actions.md` | The same, from messy sales call notes |
| `output/03-portal-status-actions.md` | The same, from a status meeting plus the message that corrected it |
| `output/emails/` (3 files) | One follow-up email draft per meeting. Drafts only. Nothing is sent |
| `output/dana-this-week.md` | One attendee's items from all three meetings, for one week |

If a live run goes wrong, [`expected/`](expected/) holds a finished run to show instead.

## What to look for

- **The copyable list.** Each action file starts with a short block you can paste into a chat or an email: owner, task, date.
- **Marked, not guessed.** In the committee transcript, someone says "someone should probably call the church" and everyone agrees. Nobody takes it. The list says `OWNER UNCLEAR`, and the email draft asks the group who will do it.
- **A quote for every line.** Under each list, "Where each line came from" quotes the notes word for word. If you can't find the quote in the notes, the item was made up.
- **The correction wins.** Meeting 3 decided to launch November 30 and send an announcement Friday. The next morning the project lead took that back. The list shows December 7 and December 1, marked 🔁 with the old dates beside them.
- **Things left out on purpose.** A silent auction idea, a card reader someone offered and took back, and a 10 day turnaround nobody should promise yet are listed under "Not action items", not as tasks.

## Then use it on your own meetings

**Prompt B** in [PROMPT.md](PROMPT.md) has two versions:

- **B1, any browser chat.** Paste a transcript or your notes into Gemini, ChatGPT, or Claude. Nothing is connected to your accounts, so it works when your employer doesn't allow AI connections. Remove confidential details first.
- **B2, Antigravity or Gemini with your Google account.** The agent finds Google Meet notes, Docs, or Drive files, lets you pick the meetings, and shows a plan before it sends or changes anything.

## The skill behind it

The method comes from Sam Carlton's [action-items skill](https://github.com/ThatGuySam/skills/blob/main/skills/sams-action-items/SKILL.md): read the whole discussion, find each commitment and who made it, apply later corrections, and keep unknowns visible. Both prompts tell the agent to use it. [RULES.md](RULES.md) only adds the file names and layout for this demo.

To install the skill in an agent app that has a terminal (it needs Node.js):

```sh
npx skills add ThatGuySam/skills --skill sams-action-items
```

## What's in this folder

| Path | Purpose |
|---|---|
| `GRANOLA.md` | Presenter page for the live flow: Granola steps and every prompt, ready to copy |
| `PROMPT.md` | Prompt A (sample), Prompt B (your own meetings), Prompt C (the brain twist) |
| `PROMPT-NOTES.md` | How Prompt C was designed and what the test runs showed |
| `demo-meeting/` | A fictional 3 minute planning huddle (transcript and Granola-style notes) and the team roster built from the seed brain |
| `check-twist.ts` | Optional script for Prompt C: `bun demos/meeting-followups/check-twist.ts` |
| `RULES.md` | The output layout the prompts point to |
| `sample/` | Three fictional meetings, one follow-up message, and a roster |
| `expected/` | A reference run of Prompt A |
| `TEST.md` | Pass or fail checks for a run |
| `check.ts` | Optional script that applies most of those checks: `bun demos/meeting-followups/check.ts` |
| `output/` | Created by your run. Ignored by Git |

Everything in `sample/` is fictional. No real people, companies, or email addresses.

The speakers in `demo-meeting/` are fictional too. Its roster is different: it lists six real people, the event's hosts and the author of Brainmaxxing, with only the public facts recorded in the seed brain's notes (`apps/brain-search/brain/people/`). The demo pretends they are one team.
