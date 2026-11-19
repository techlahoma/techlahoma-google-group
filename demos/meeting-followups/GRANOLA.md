# Presenter page: Granola, action items, then the brain twist

- `Tease:` Record two minutes of the room planning the next meetup, then turn it into who does what, for people and for AI agents.
- `Lede:` Sam records a short live meeting in Granola, pastes the transcript with the Action Items prompt, then pastes it again with the brain twist prompt, which matches tasks to AI agents and to people on the seed brain's people list.
- `Why it matters:` The twist is a preview of the brain demo. The AI may use only what the brain's notes say about a person, so a task with no matching fact stays unassigned.
- `Go deeper:` [What this demo is](README.md) · [All prompts](PROMPT.md) · [How to check a run](TEST.md) · [Sample transcript](demo-meeting/transcript.md) · [Reference output](expected/demo-meeting/)

Every block below is ready to copy. Blocks 1 and 2 are the live plan. Blocks 3 and 4 are the pieces. Block 5 is the fallback.

## 1. Default plan: record in Granola, then run Action Items

In Granola (button names can differ a little between versions, so run through this once before the talk):

1. Open Granola and start a new note. Check that it is transcribing: the transcript should fill in as people talk.
2. Run the 2 to 3 minute planning chat with the room. Topic: the next GDG Tulsa × Women+ in Tech meetup, and follow-ups from tonight. Ask people to say their name when they take a task ("This is Dana, I'll ask the venue"). Granola records a room through one microphone, so its transcript does not label who spoke.
3. Stop the recording.
4. Open the transcript panel and copy the whole transcript. If the transcript is hard to reach, copy Granola's notes instead. Both work with the prompts below.
5. Paste the prompt below into Antigravity or a browser chat, and paste the transcript where it says to.

If you use Claude with the Granola connector, you can skip the copying: ask it for the transcript of your most recent Granola meeting, then give it the same prompt.

```text
Use the sams-action-items skill on the meeting transcript below. If the skill is not installed, read https://raw.githubusercontent.com/ThatGuySam/skills/main/skills/sams-action-items/SKILL.md and follow its method. If you can't open it, keep going with the rules here.

Reply in chat with one copyable tree of who does what by when, one line per action: owner: task · by date. The meeting was on Thursday, November 19, 2026. Use only what the transcript says. If nobody clearly took a task, write OWNER UNCLEAR. If there is no date, write DATE UNCLEAR. Do not guess. Do not send, post, or create anything.

Meeting transcript:
[paste the Granola transcript or notes here]
```

What to point at: the copyable tree, and the lines marked OWNER UNCLEAR. Those are the setup for step 2.

## 2. The brain twist: tasks for agents as well as people

Same transcript, second prompt. The roster is already filled in from the seed brain's people notes. Paste the transcript at the bottom.

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

What to point at:

- **Agent rows** say what the agent needs to be given (a file, a login). The agent drafts. A person sends.
- **Person rows** quote the roster fact that made the match. The match is only as good as the brain.
- **unassigned rows** are the honest answer when the brain has no fact that fits. Three hosts are known only as "host", so they get nothing. Add facts to the brain and those rows fill in. That is the next demo.
- Nothing was sent.

## 3. Copyable transcript (the sample meeting)

A made-up huddle between three invented attendees. Use it in place of the Granola transcript in block 1 or block 2.

```text
**Odalys Brandt:** Okay, quick huddle while we still have the room. Two things. Wrap up tonight, and get the next GDG Tulsa and Women+ in Tech meetup moving. Tonight first. We need a recap email out to everybody who came, with the link to the demos.

**Wren Castellano:** That's a writing job. Could an AI draft it from tonight's notes? Then one of us reads it before it goes out.

**Odalys Brandt:** Yes. Draft only, a person sends it. And can we get a summary of the RSVP list? How many signed up, how many showed up, and what kind of jobs people have. I want that before we pick the next topic.

**Tamsin Okafor:** The RSVP list is a spreadsheet export from the event page. That's another one for an AI. It just needs the file.

**Odalys Brandt:** Good. So, the next meetup. I'm thinking January, but we haven't picked a date.

**Tamsin Okafor:** Someone from GDG Tulsa has to confirm that January works for the chapter.

**Wren Castellano:** And we need a speaker. People kept asking about the memory thing, the brain. Could we get whoever wrote Brainmaxxing to give a talk, even over video?

**Tamsin Okafor:** Also, the agent skills part Sam demoed tonight got the most questions. Someone who knows agent skills should run a hands-on follow-up session.

**Odalys Brandt:** Love it. Venue. I'll ask tonight's venue before I leave whether we can have the room again in January.

**Tamsin Okafor:** Food. Someone should ask a sponsor to cover food. I don't know who has a sponsor contact.

**Odalys Brandt:** Me neither. Leave that one open.

**Wren Castellano:** And someone should bring in the Women+ in Tech side early this time. Which of the hosts is from Women+ in Tech?

**Tamsin Okafor:** I don't actually know.

**Odalys Brandt:** Okay, park it. Last thing. Once there's a date, the event page needs updating with the new date and a new description.

**Wren Castellano:** An AI can write the description. Somebody with the login has to publish it.

**Odalys Brandt:** Great. That's everything. Thanks, you two.
```

## 4. Copyable people list

Built from the six notes in `apps/brain-search/brain/people/`. Only facts those notes contain. For this demo, everyone listed is treated as being on the team.

```text
TEAM ROSTER
- Sam Carlton: hosted and demoed at "Google Dev × Women+ in Tech: Actual Productivity with AI" on Nov 19, 2026. Publishes free agent skills at skills.samcarlton.com. Built the Tulsa Ecosystem Map and FetchMoji.
- Zain Khan: organizer of GDG Tulsa. Listed as a host of the Nov 19, 2026 event.
- Jess Trippiedi: listed as a host of the Nov 19, 2026 event. No other details recorded.
- Valerie Feral: listed as a host of the Nov 19, 2026 event. No other details recorded.
- Tran Trinh: listed as a host of the Nov 19, 2026 event. No other details recorded.
- Lauren Tan: software engineer. Author of Brainmaxxing.
```

## 5. Fallback: Granola did not record

Use the sample meeting in [`demo-meeting/transcript.md`](demo-meeting/transcript.md). Two ways:

**Browser chat:** copy block 1 or block 2, then paste block 3 where the transcript goes.

**Antigravity, with this repository open:** paste these two prompts, one after the other. They read the sample files, so there is nothing else to paste.

```text
Use the sams-action-items skill on demos/meeting-followups/demo-meeting/transcript.md. If the skill is not installed, read https://raw.githubusercontent.com/ThatGuySam/skills/main/skills/sams-action-items/SKILL.md and follow its method. If you can't open it, keep going with the rules here.

Reply in chat only, and write no files, with one copyable tree of who does what by when, one line per action: owner: task · by date. The meeting was on Thursday, November 19, 2026. Use only what the transcript says. If nobody clearly took a task, write OWNER UNCLEAR. If there is no date, write DATE UNCLEAR. Do not guess. Do not send, post, or create anything.
```

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

If the model fails too, show the finished run: [action items](expected/demo-meeting/action-items.md) and [agents and people](expected/demo-meeting/agents-and-people.md). [`demo-meeting/granola-notes.md`](demo-meeting/granola-notes.md) shows roughly what Granola's notes for this meeting look like.
