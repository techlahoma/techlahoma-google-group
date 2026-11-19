# Test a run of the meeting follow-ups demo

- `Tease:` Ten minutes to decide whether a Prompt A run passed.
- `Lede:` Run the script for the mechanical checks, then read three things yourself: that every action traces to the sample, that nothing unclear was guessed, and that the corrected decision won.
- `Why it matters:` A recap that invents one owner or keeps one cancelled date is worse than no recap, because people act on it.
- `Go deeper:` [Prompts](PROMPT.md) · [Output rules](RULES.md) · [Reference output](expected/) · [Sample meetings](sample/README.md)

A run **passes** when every check in parts 1 to 5 passes. Wording can differ from `expected/`. Extra action rows are fine if they pass check 2.

## Part 1. Run the script (optional, needs Bun)

```sh
bun demos/meeting-followups/check.ts            # checks output/
bun demos/meeting-followups/check.ts expected   # checks the reference run
```

It prints ✅ or ❌ per check and ends with "All automatic checks passed" or a count of failures. It covers the checks marked **(script)** below. No Bun: do them by hand.

## Part 2. Files

| # | Check | Pass when |
|---|---|---|
| 1.1 | Seven files exist **(script)** | `output/` has `01-pantry-dinner-actions.md`, `02-fernbrook-call-actions.md`, `03-portal-status-actions.md`, `dana-this-week.md`, and `emails/` has `01-pantry-dinner-email.md`, `02-fernbrook-call-email.md`, `03-portal-status-email.md` |
| 1.2 | Copyable list | Each action file has one block between ```` ```text ```` fences with one numbered row per action |
| 1.3 | Nothing left the folder | No email was sent, no calendar or task was created, and no file outside `demos/meeting-followups/output/` was written |

## Part 3. Nothing is invented

This is the main test. Do it for all three action files.

| # | Check | Pass when |
|---|---|---|
| 2.1 | Every row has a quote **(script)** | Each numbered row has a matching number under "Where each line came from", with words in double quotes |
| 2.2 | Every quote is real **(script)** | Search the named sample file for the quoted words. They are there, word for word. One quote you can't find is a fail |
| 2.3 | The quote supports the row | Read the quote in place. The person named as owner is the one who said they would do it, or was asked and agreed. The date in the row is the date that passage gives. Spot-check at least three rows per file by hand, because the script can't judge this |
| 2.4 | Every owner is a real attendee **(script)** | Each row's owner is a name in `sample/people.md`, or `OWNER UNCLEAR` |
| 2.5 | Dates are real dates **(script)** | Weekdays match the 2026 calendar: Nov 16 is a Monday, Nov 20 a Friday, Dec 1 a Tuesday |
| 2.6 | No invented addresses **(script)** | Every email address in `output/` is listed in `sample/people.md` |
| 2.7 | No invented tasks | None of these appears as an action row: a silent auction, Walt setting up a card reader, a kids' table, confirming the emcee, a printed check-in list, a Spanish how-to guide **(script, first three)** |

## Part 4. Unclear is marked, not guessed

| # | Sample line | Pass when the row says |
|---|---|---|
| 3.1 | "Someone should probably call the church about using their lot" | `OWNER UNCLEAR` and `DATE UNCLEAR`. Fail if it names Roz, Tomás, Dana, or anyone else **(script)** |
| 3.2 | "Dana, Keiko, can one of you two grab them?" (centerpieces) | `OWNER UNCLEAR`, ideally naming both. Date Fri Dec 4. Fail if it assigns one of them **(script)** |
| 3.3 | Keiko's sign-up form, "soon" | Keiko Sandoval, `DATE UNCLEAR`. Fail if it gives a date **(script)** |
| 3.4 | "jules wants samples of the heavier cardstock ... who??" | `OWNER UNCLEAR`, `DATE UNCLEAR` **(script)** |
| 3.5 | "follow up call - week after thanksgiving, no date picked" | `DATE UNCLEAR`. Fail if it gives a specific day **(script)** |
| 3.6 | "priscilla to send address + logo files ... early next week" | Priscilla Okonkwo, `DATE UNCLEAR` with her words kept. Fail if it gives a specific day **(script)** |
| 3.7 | "Dana: update the FAQ page copy. No date set." | Dana Whitfield, `DATE UNCLEAR` |
| 3.8 | Postcard quantity and the opening month | Listed under "Open questions". The Fernbrook email asks about them. Fail if the email states "5,000 per location", "February", or "spring" as settled |
| 3.9 | "andre thinks we can do 10 day turnaround - DONT promise yet" | The Fernbrook email does not offer or mention a 10 day turnaround **(script)** |

Clear items must stay clear. These rows need the right owner and date, with no UNCLEAR mark: Tomás Ibarra, tables and chairs, Wed Nov 18. Roz Baptiste, caterer headcount, Mon Nov 23. Walt Pruitt, sponsor list, Tue Nov 17. Dana Whitfield, program proof, Fri Nov 20. Dana Whitfield, Fernbrook quote, Thu Nov 19 **(script, last one)**.

## Part 5. The corrected decision wins

`sample/followup-message.md` was sent the morning after meeting 3. Check `03-portal-status-actions.md`, `emails/03-portal-status-email.md`, and `dana-this-week.md`.

| # | Item | Meeting said | Pass when the output says |
|---|---|---|---|
| 4.1 | Launch date | Mon Nov 30 | Monday, December 7, under "Decisions". November 30 appears only as the cancelled date **(script)** |
| 4.2 | Dana's launch announcement | Fri Nov 20 | Tue Dec 1, marked 🔁, with "(was Fri Nov 20)" **(script)** |
| 4.3 | Marcus's payment testing | Tue Nov 24 | Wed Dec 2 **(script)** |
| 4.4 | Staff training | Wed Nov 25 | Thu Dec 3 **(script)** |
| 4.5 | Lena's how-to guide | Mon Nov 23 | Mon Nov 23, unchanged **(script)** |
| 4.6 | Phone testing | "still needs an owner" | Marcus Dellinger, `DATE UNCLEAR` **(script)** |
| 4.7 | The email draft | | Gives December 7 and December 1, and says what changed. It does not tell Dana to send anything on Friday **(script, dates only)** |
| 4.8 | Dana's week | | The launch announcement is under "Coming later" at Tue Dec 1. It is **not** under "Due this week" **(script)** |

## Part 6. Dana's week and the email drafts

| # | Check | Pass when |
|---|---|---|
| 5.1 | Due this week | Exactly three items (the script checks that these three are there, not that there are no others): ask Glenn about the banner (Tue Nov 17), send the Fernbrook quote (Thu Nov 19), send Roz the program proof (Fri Nov 20) |
| 5.2 | Only Dana's items | No row under "Due this week" or "Coming later" belongs to someone else. Other people's items appear only under "Waiting on others" |
| 5.3 | Might be mine | The centerpiece pickup is shown as unclear between Dana and Keiko, not as Dana's |
| 5.4 | Nothing marked done | No item is marked finished. The notes don't say |
| 5.5 | Drafts only **(script)** | Each email file starts with "Draft. Not sent." and its body is under about 200 words |
| 5.6 | Emails ask, not assume | Each `OWNER UNCLEAR` and `DATE UNCLEAR` item from the action list shows up in the email as a question |

## Part 7. The brain twist (Prompt C)

Prompt C produces one table: task, suggested owner, why, first step. Check `output/demo-meeting/agents-and-people.md`, or a table pasted from a chat and saved to a file.

```sh
bun demos/meeting-followups/check-twist.ts                                             # checks output/demo-meeting/agents-and-people.md
bun demos/meeting-followups/check-twist.ts expected/demo-meeting/agents-and-people.md  # checks the reference run
bun demos/meeting-followups/check-twist.ts /path/to/table.md /path/to/transcript.md    # a live Granola meeting: general checks only
```

A run **passes** when 6.1 to 6.7 pass. For the sample meeting, 6.8 to 6.13 must pass too.

| # | Check | Pass when |
|---|---|---|
| 6.1 | One table **(script)** | Columns are `# | Task | Suggested owner | Why | First step`, with one row per task |
| 6.2 | Owners are allowed values **(script)** | Each owner is exactly `Agent`, a full name from the roster, `Name (volunteered)`, or `unassigned` |
| 6.3 | Every row quotes the meeting **(script)** | The words in double quotes are in the transcript, word for word |
| 6.4 | Every person match cites a roster fact **(script)** | Each row owned by a roster name has `Roster:` followed by words copied from **that person's** line in `demo-meeting/roster.md` |
| 6.5 | No invented facts | Read each person row and each first step. Nothing is said about a person that the roster does not say: no job title, employer, skill, contact, or group membership. "Being a host" is never the only reason for a match. The script checks the copied fact; you check everything else in the row |
| 6.6 | Agent tasks list the access needed **(script)** | Each `Agent` row has `Needs:` followed by the files or accounts the agent must be given. Read it: the need is something the meeting mentions or plainly implies (the RSVP export, tonight's notes, the event page) |
| 6.7 | Nothing was sent **(script, last line only)** | The reply ends "Nothing was sent or changed." No email, post, calendar event, or page edit happened. Agent first steps are drafts or summaries for a person to review |

Sample meeting only (`demo-meeting/transcript.md`):

| # | Task in the meeting | Pass when the owner is |
|---|---|---|
| 6.8 | Recap email, RSVP summary, event page description | `Agent` for all three **(script)** |
| 6.9 | "Someone from GDG Tulsa has to confirm that January works" | Zain Khan, citing "organizer of GDG Tulsa" **(script)** |
| 6.10 | "whoever wrote Brainmaxxing" gives a talk | Lauren Tan, citing "Author of Brainmaxxing" **(script)** |
| 6.11 | "Someone who knows agent skills" runs a session | Sam Carlton, citing the free agent skills fact **(script)** |
| 6.12 | "I'll ask tonight's venue before I leave" | `Odalys Brandt (volunteered)` **(script)** |
| 6.13 | Sponsor ask, and bringing in the Women+ in Tech side | `unassigned` for both. Fail if either goes to Jess Trippiedi, Valerie Feral, or Tran Trinh: the roster records nothing about them beyond "host", so any match is a guess **(script)** |

Extra rows are fine if they pass 6.2 to 6.6, for example a separate `unassigned` row for publishing the event page.

For a live Granola meeting there is no answer key. Apply 6.1 to 6.7, and read three person rows aloud with the room: is the quote something that was said, and is the fact on the roster?

## If a check fails

- A quote that isn't in the sample (2.2): the model tidied the wording or made the item up. Ask it: "Row N's quote is not in the sample. Copy the exact words, or delete the row."
- A guessed owner or date (Part 4): ask it to re-read rule 2 in `RULES.md` and fix that row.
- An old date in meeting 3 (Part 5): ask it to re-read `sample/followup-message.md` and apply rule 4.
- Prompt C gave a person a task with no roster fact (6.4, 6.5): ask it: "Row N's reason is not on the roster. Copy the fact from the roster, or change the owner to unassigned."
- Still failing: show [`expected/`](expected/) instead.
