# Prompt notes: the brain twist (Prompt C)

- `Tease:` Why Prompt C is worded the way it is, and what happened when cheap models ran it.
- `Lede:` The prompt was reviewed with the zach-prompting skill on November 19, 2026, then run on Gemini 3.8 Flash at low effort, Claude Haiku, and GPT-5.6 Luna at low effort. Gemini and Haiku passed every run. Luna refuses a roster of real names.
- `Why it matters:` The failure to avoid is a confident wrong match: a real person handed a job because of a fact the AI made up.
- `Go deeper:` [The prompt](PROMPT.md) · [Presenter page](GRANOLA.md) · [Checks](TEST.md) · [Checker script](check-twist.ts)

Status: **validated** on Gemini 3.8 Flash Low and Claude Haiku. **Blocked** on GPT-5.6 Luna with the real roster (see below).

## What the prompt must keep

| Requirement | Where it lives in the prompt |
|---|---|
| Output is one table: task, suggested owner, why, first step | The first line and the Format line |
| Why holds a transcript quote plus the roster fact | Step 3 |
| No facts about a person beyond the roster | "Treat it as everything you know about these people. Add nothing from memory" |
| No roster fact, then unassigned | Step 2, fourth owner, "Do not guess" |
| Agent tasks name the access needed | Step 3, `Needs:` |
| Nothing is sent | First line, the Agent rule ("only drafts"), and the closing line |
| Works pasted into a chat with no files | C2 carries the roster and the meeting inline |

## Review notes (zach-prompting)

- **Outcome first.** The first sentence says what comes back and that it is only a suggestion. Steps come after.
- **One rule per behavior.** The no-sending rule is stated once as a rule. The closing line "Nothing was sent or changed." is output, and gives a tester something to check.
- **Decision rules, not labels.** "Agent" is defined by what the work is (done on a computer from a file or an account) with three examples. "Needs a person" is defined by four (a call, an ask, a decision, a talk).
- **Named the specific failure.** "Being a host is not enough to pick someone, because several people are hosts." Without it, a model can hand any task to any of the five hosts and cite a true fact. The reason is in the rule so the model can apply it to other shared roles.
- **Evidence is checkable.** Both halves of Why are copied text: words from the meeting, and the fact from the roster. A script can look both up.
- **Missing evidence is "unassigned", not a guess.** The roster deliberately says "No other details recorded" for three people.
- **A fourth owner was added: `Name (volunteered)`.** The brief asked for three (agent, roster person, unassigned). In a live meeting someone says "I'll do it", and marking that task unassigned would be wrong. A volunteer needs no roster fact, so this adds no invented claims. An in-room Granola transcript does not label speakers, so the prompt gives a fallback: `Someone in the meeting (volunteered)`.
- **No thinking instructions, no capital-letter warnings.** Effort is a runtime setting (Low in Antigravity). The prompt does not ask the model to think harder.
- **Exact cell values.** The first Haiku run wrote "Agent (drafts); a person sends" and dropped "(volunteered)". Step 2 now says to write the cell "exactly as one of these four, with nothing added", with a made-up example name.
- **First steps stay grounded.** One Gemini run suggested contacting "chapter co-organizers", who appear nowhere. Step 4 now ends: "Name only people and things that the meeting or the roster names."
- **One fact, not the whole line.** Gemini copied a person's entire roster line. Step 3 now asks for "the one fact that fits".
- **Model guidance.** The installed zach-prompting skill has vendor sections for OpenAI and Anthropic models and none for Gemini, so the Gemini fit rests on the test runs below, not on vendor guidance.

## Test runs (November 19, 2026)

All runs used the sample meeting and were scored with `check-twist.ts` (20 checks: 10 general, 10 for the sample meeting). "File" means Prompt C1 in a fresh copy of the folder. "Paste" means Prompt C2 with the roster and transcript inline.

| Model | Mode | Runs | Result | Wall time |
|---|---|---|---|---|
| Gemini 3.8 Flash, Low (Antigravity CLI 1.5.12) | File, final prompt | 2 | 2 pass | 17 s, 22 s |
| Gemini 3.8 Flash, Low | Paste, final prompt | 1 | pass | 7 s |
| Gemini 3.8 Flash, Low | Paste, speaker names removed | 1 | pass, venue row became "Someone in the meeting (volunteered)" | 7 s |
| Gemini 3.8 Flash, Low | Earlier wordings, file and paste | 7 | 7 pass | 7 to 19 s |
| Claude Haiku (`claude -p --model haiku`) | Paste, final prompt | 2 | 2 pass | 26 s, 27 s |
| Claude Haiku | Paste, earlier wordings | 6 | 5 pass. The first run failed 3 checks on owner labels, fixed by "exactly as one of these four" | 23 to 30 s |
| GPT-5.6 Luna, low effort (`codex exec`) | Paste, real roster, three wordings | 5 | 5 refused | 15 to 31 s |
| GPT-5.6 Luna, low effort | Paste, roster names swapped for invented ones | 1 | pass on the 10 general checks | not timed |

**The GPT-5.6 Luna refusal.** With the real roster, Luna answered that it could not assign named people, or that a content filter blocked the reply. Rewording the roster as "my team's own notes on each person's public role" did not change that. The same prompt with invented names ran and passed, so the cause is the real names, not the task. In ChatGPT or Codex on a cheap model, use a roster of your own team, or expect a refusal on this one. This was not tried on a larger GPT model.

Raw outputs and logs are in `/tmp/wit-tests/meeting-twist/` on the machine that ran them. They are not part of this repository.

## Not tested

- A real Granola transcript. Granola's wording, timestamps, and "Me:" labels were approximated by removing speaker names from the sample.
- The Antigravity desktop app. The runs used the Antigravity command line with the same model and effort.
- Rosters much longer than six people.
