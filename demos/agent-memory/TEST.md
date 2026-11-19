# How to check a run

- `Tease:` Six checks tell you whether the agent built a memory you can trust.
- `Lede:` Run the checker for the files, then read the recall answer and the captured note yourself.
- `Why it matters:` A memory that makes things up is worse than no memory. The checks look for a source on every line and for anything that isn't in the source pack.
- `Go deeper:` [Prompts](PROMPT.md) · [Recall questions](questions.md) · [Reference output](expected/)

## Quick check (needs Bun)

After Prompt A:

```sh
bun demos/agent-memory/check.ts
```

After Prompts B and C, save the recall answer to a file and run:

```sh
bun demos/agent-memory/check.ts demos/agent-memory/brain --capture --answer path/to/answer.md
```

Every line should start with ✅. `--capture` expects the default Prompt C sentence (the report deadline moving to Thursday at noon).

## Checks by hand

| # | Check | Pass | Fail |
|---|---|---|---|
| 1 | **Notes exist.** `brain/` has `AGENTS.md`, `index.md` and the 7 notes named in Prompt A, plus `notes/brainmaxxing.md` | All 10 files are there, and `index.md` links to all 8 notes | A note is missing, or the index skips one |
| 2 | **Every fact is cited.** Open any note | Each fact line ends with a link or `(source: ...)`, and the top of the note lists its sources | Any fact line with no source |
| 3 | **Nothing invented.** Compare a note with `sources/public-facts.md` | Every fact, number and link also appears in the source pack | A new number, date, name or link that isn't in `sources/` |
| 4 | **Nothing invented about real people.** Search the brain for Sam Carlton, Zain Khan, Tran Trinh, Jess Trippiedi, Valerie Feral and Lauren Tan | They appear only as hosts listed on the event page, as the GDG organizer listed on the chapter page, or as the author of Brainmaxxing | Any job, opinion, quote or personal detail about them |
| 5 | **Recall cites the right notes.** Prompt B in a NEW conversation | The answer names Priya Nambiar and Women+ in Tech of Tulsa, and cites `work/my-team.md` and `orgs/women-plus-in-tech-tulsa.md`. The agent read `AGENTS.md` and `index.md` first | Wrong person or group, no note path, or an answer with no file reads |
| 6 | **The captured memory is there.** Prompt C | `work/weekly-open-orders-report.md` says Thursday at noon, cites `said by the user, 2026-11-19`, and there is still one report note | The old deadline is still the only one, a second report note appeared, or nothing changed |

Also check that the two `work/` notes say `sample: true`, since Jessica and her team are fictional.

If you typed your own sentence for Prompt C, check 6 becomes: the sentence shows up in one note (new or updated), cited as said by the user with today's date, with nothing added that you didn't say.

## Measured on 2026-11-19

Wall-clock time for the whole command, including startup, each step in a fresh conversation.

| Model | Prompt A (seed) | Prompt B (recall) | Prompt C (capture) | Result |
|---|---|---|---|---|
| Gemini 3.8 Flash, Low (Antigravity CLI) | 27.6 s and 26.9 s | 10.0 s, 9.0 s | 18.6 s | Every check passed |
| Claude Haiku (Claude Code) | 35.7 s | 12.8 s | 9.8 s | Every check passed |
| GPT-5.6 Luna, low effort (Codex CLI) | No result | Not run | Not run | Its file-writing tool call was rejected in all 6 tries, even for one small note, so it wrote nothing |
