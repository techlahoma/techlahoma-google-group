# Rules for the meeting follow-ups demo

- `Tease:` The output format for this demo: where the files go and what each one looks like.
- `Lede:` The method is Sam's [action-items skill](https://github.com/ThatGuySam/skills/blob/main/skills/sams-action-items/SKILL.md). That skill answers in chat unless you ask for files. This demo asks for files, and this page says exactly which ones.
- `Why it matters:` A fixed format lets a small, cheap model get it right and lets a person check the result in two minutes.
- `Go deeper:` [Prompts](PROMPT.md) · [How to check a run](TEST.md) · [Reference output](expected/)

## The rules

1. **Only what the source says.** Every action item must come from words in the meeting file. Do not add tasks, people, dates, amounts, or email addresses that are not written there.
2. **Unclear stays unclear.** Do not guess.
   - Nobody clearly took the task: write `OWNER UNCLEAR`. If the source names the candidates, add them: `OWNER UNCLEAR (Dana Whitfield or Keiko Sandoval)`.
   - No date, or only a vague one ("soon", "early next week"): write `DATE UNCLEAR` and put the source's own words after it: `DATE UNCLEAR (said "soon")`.
3. **Real dates.** Turn "Friday" or "tomorrow" into a date, counting from the meeting date. Write dates as `Fri Nov 20`.
4. **A later correction wins.** If a later message changes a decision, an owner, or a date, use the new version. Mark the row 🔁 and add the old value in parentheses: `(was Fri Nov 20)`. Never show the old value as the current one.
5. **Some things are not action items:** things finished during the meeting, things someone took back, ideas for later, things the group decided not to do, and small talk. List them under "Not action items" so the reader can see they were considered.
6. **Never send.** Emails are draft files. Do not send, post, schedule, or create tasks anywhere.

## File 1: one action list per meeting

Use exactly this layout. Replace the text in angle brackets.

````markdown
# Who does what by when: <meeting name> (<meeting date>)

```text
<meeting name> · <meeting date>
├── 1. ✅ <owner full name>: <what they will do> · by <Fri Nov 20>
├── 2. ❓ OWNER UNCLEAR: <what needs doing> · DATE UNCLEAR
└── 3. 🔁 <owner full name>: <what they will do> · by <Tue Dec 1> (was <Fri Nov 20>)
```

## Where each line came from

1. "<exact words copied from the source>" (sample/<file name>)
2. "<exact words copied from the source>" (sample/<file name>)
3. "<exact words copied from the source>" (sample/<file name>)

## Decisions

- <decision, in its corrected form if a later message changed it. Write "None stated." if there are none.>

## Open questions

- <a fact the notes say is unknown or disputed. Write "None." if there are none.>

## Not action items

- <thing that was said but is not an action>: <why: done in the meeting, taken back, idea for later, decided not to>
````

Row rules:

- One row per action. Number the rows 1, 2, 3 and so on.
- Start each row with one marker: ✅ owner and date are both clear, ❓ the owner or the date is unclear, 🔁 a later message changed this row.
- Every row has an owner (a full name, or `OWNER UNCLEAR`) and a date (like `Fri Nov 20`, or `DATE UNCLEAR`).
- Under "Where each line came from", the number matches the row number. Copy 4 to 20 words from the source exactly, typos and "um" included, inside straight double quotes. Do not tidy the words. If a later message changed the row, quote the later message.
- The block between the ```text fences is the part a person copies into a chat or an email.

## File 2: one follow-up email draft per meeting

```markdown
**Draft. Not sent.**

From: <name>
To: <addresses>
Subject: <subject>

<body>
```

- From: the person who ran the meeting or took the notes.
- To: the other people in the meeting. Use only addresses listed in `sample/people.md`. If a person has no listed address, write their name only.
- Body: under 200 words, plain and friendly. List who does what by when, using the action list you already wrote. Turn every `OWNER UNCLEAR`, `DATE UNCLEAR`, and open question into a direct question to the group.
- Do not promise anything the meeting did not promise. Do not state an unconfirmed number as a fact.
- If a later message corrected the meeting, the email gives the corrected plan and says clearly what changed.

## File 3: one person's week

````markdown
# <full name>: my action items, <Mon Nov 16> to <Sun Nov 22>

```text
<full name> · week of <Mon Nov 16>
├── 📅 Due this week
│   ├── <Tue Nov 17> · <action> (<meeting name>)
│   └── <Fri Nov 20> · <action> (<meeting name>)
├── ⏭️ Coming later
│   └── <Tue Dec 1> · <action> (<meeting name>)
├── ❓ No date yet, or might be mine
│   └── <action> · <DATE UNCLEAR or OWNER UNCLEAR, with the reason> (<meeting name>)
└── ⏳ Waiting on others
    └── <other person>: <what they owe this person> · <date or DATE UNCLEAR> (<meeting name>)
```

## Heads up

- <anything moved by a later correction, or an open question that blocks one of the items>
````

- "Due this week" holds only this person's items with a date inside the week, earliest first.
- An item that a later message moved goes under its new date, with `(was <old date>)`. It must not appear under its old date.
- "No date yet, or might be mine" holds this person's items marked `DATE UNCLEAR`, plus `OWNER UNCLEAR` items where this person is a named candidate or wrote the note.
- Do not mark anything as done. The notes don't say what has been finished since.

## For the bundled sample

| Meeting | Action list | Email draft | Email is from |
|---|---|---|---|
| Pantry dinner committee | `output/01-pantry-dinner-actions.md` | `output/emails/01-pantry-dinner-email.md` | Roz Baptiste |
| Fernbrook Dental call | `output/02-fernbrook-call-actions.md` | `output/emails/02-fernbrook-call-email.md` | Dana Whitfield |
| Reorder portal status | `output/03-portal-status-actions.md` | `output/emails/03-portal-status-email.md` | Imani Fofanah |

- The week view is `output/dana-this-week.md`, for Dana Whitfield, Monday, November 16 through Sunday, November 22, 2026.
- In `sample/02-fernbrook-call-notes.md`, "me" is Dana Whitfield. She typed the notes.
- `sample/followup-message.md` was sent after meeting 3. Where the two disagree, the message wins.
