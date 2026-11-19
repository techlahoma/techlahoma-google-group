# How to check a run of Demo 7

- `Tease:` The answer key, a script for the first pass, and the read a person has to do.
- `Lede:` A run passes when the page shows the numbers below, reports the three data problems without hiding or fixing them, and its numbers move when one ticket is added.
- `Why it matters:` In testing the earlier version of this demo, automated checks passed runs that failed when a person read them. The script here is a first pass. The human read is the test.
- `Go deeper:` [Prompts](PROMPT.md) · [checker script](check.ts) · [reference output](expected/)

Attendees: this page has the answers. Write down your three numbers first.

## The answer key

Recomputed from `sample/tickets.csv` by `check.ts` with its own code. Data through **Thursday, November 19, 2026**.

| Number | Correct value | How |
|---|---|---|
| Rows in the file | **56** | Data rows, header not counted |
| Tickets | **52** | 56 rows, minus 3 Note rows, minus 1 duplicate copy of T-1033 |
| Open tickets now | **22** | Tickets with a blank `closed` |
| Open tickets 7 days earlier | **19** | On Nov 12: opened on or before it, not closed on or before it |
| Queue, Build, Review, Blocked | **5, 4, 9, 3** | Open tickets by `stage`. The four bars add up to 21. |
| Unmapped stage | **1** | T-1047 says "Reveiw". 21 + 1 = 22. |
| Average age of open tickets | **13 days** | 296 days ÷ 22 = 13.4545, rounded once |
| Oldest open ticket | **T-1011**, opened Sep 28, 2026, **52 days** | "Replace the label printer in the warehouse", Blocked |
| Ten oldest open tickets | T-1011, T-1024, T-1029, T-1032, T-1034, T-1035, T-1036, T-1038, T-1039, T-1040 | Ages 52, 31, 27, 22, 20, 17, 16, 15, 14, 13 days. 6 of the ten are in Review. |
| Bottleneck | **Review** | The stage with the most open tickets: 9 of 22 |
| Who to nudge | Hannah Whitlow (T-1024, T-1050), Marcus Bell (T-1029, T-1040, T-1043, T-1049), Dana Okafor (T-1034), Luis Ortega (T-1036), Priya Nair (T-1038) | The 9 open Review tickets, grouped by owner. Owners are ordered by their oldest ticket: 31, 27, 20, 16, 15 days. |

The three control numbers an attendee writes down are **56 rows, 22 open tickets, and T-1011 (Sep 28)**.

## Wrong answers and what they mean

| You see | What went wrong |
|---|---|
| 25 open, Queue 7, or Review 10 with Queue 7 | The 3 Note rows were counted as tickets |
| T-1001 as the oldest, or any of T-1001, T-1026, T-1052 in the table | Same: notes counted as tickets |
| Review 10 and no unmapped line | "Reveiw" was quietly changed to Review. Fail, even if a banner mentions it. |
| The bars add up to 21 and nothing explains the missing 1 | The unmapped ticket was dropped from the bars without a word |
| 20 open 7 days earlier, or 53 tickets | The duplicate row T-1033 was counted twice |
| Average age 14 days | Rounded twice: 13.4545, then 13.5, then 14 |
| 55 rows at the top | It reported unique rows. The file has 56. Not wrong if labeled, but it will not match your count. |
| A date other than Nov 19, 2026 | It used today's date. Every age is then off. |

## First pass: the script

From anywhere, after the agent has written `demos/dashboard/output/`:

```sh
bun demos/dashboard/check.ts                  # checks demos/dashboard/output
bun demos/dashboard/check.ts expected         # checks the reference output
bun demos/dashboard/check.ts /tmp/run/output  # checks a run made in another folder
```

The folder argument lets you grade a run without putting this answer key in the folder the agent can read. The script prints PASS or FAIL per line and exits 1 on any failure. It also copies the run's `build.py` to a temporary folder and runs it twice, once on the sample and once with one ticket added, so only run it on output you made yourself.

It changes nothing in the run.

## The test: a person reads it

Have your three numbers on paper. Open `output/dashboard.html` with a double-click.

**The seven checks**

1. **Rows.** The top line says "Data through Nov 19, 2026 · 56 rows".
2. **Control totals.** The verdict says "9 of 22 open tickets", and the line under it starts "22 tickets are open". The first row of the table is T-1011, opened Sep 28, 52 days.
3. **Adds up.** The bars read Queue 5, Build 4, Review 9, Blocked 3. That is 21. The line under the bars reports 1 unmapped, "Reveiw". 21 + 1 = 22.
4. **Definitions.** Click "Definitions and how rows were counted" at the bottom. The list says: open means `closed` is blank; 7 days earlier means Nov 12, with the rule; Note rows were left out; the duplicate was counted once; "Reveiw" was not changed; the average was rounded once, at display.
5. **Two seconds.** Look away and back. The eye lands on the verdict, "Review is the bottleneck: 9 of 22 open tickets, 6 of the 10 oldest." Without scrolling you can say what the page is, the one thing to act on, and who to nudge.
6. **Date.** "Data through" is Nov 19, 2026, not the day you ran it.
7. **Typed or computed.** See the next section.

**The page**

8. One loud thing: the verdict is the only big text. Then, quieter: who to nudge (a list of five owners with their Review tickets), four bars, and one table of ten rows. No pie, gauge, legend, or extra cards.
9. Bars are in process order (Queue, Build, Review, Blocked), start at zero, are gray, and only Review has the accent color. Each bar has its count on it. The same accent marks Review everywhere else: the word in the verdict, the pills and age bars in the table, the ticket chips.
10. The table is one line per ticket: the stage is a pill, the age has a thin bar from zero, and a long title is cut, not wrapped. The definitions are folded away until clicked.
11. With Wi-Fi off, the page still opens. At phone width (390px), nothing scrolls sideways and each table row is a small stacked block.

**The other files**

12. `profile.md` shows 56 rows, 25 blanks in `closed`, `kind` values Ticket 53 and Note 3, the stage value "Reveiw", and the duplicate T-1033.
13. `weekly-report.md` has 5 to 8 bullets, each starting with a bold finding. **Read every number in it** and find it in the script's printout or the table above. Totals can be right while a detail is wrong.
14. `sample/tickets.csv` is unchanged: 57 lines, and line 49 still says "Reveiw".

A run that passes 1 to 7 is a success for the room. 8 to 14 are what make it worth sharing.

## Change one row

The follow-up prompt adds this line to a copy of the data and runs the same script:

```text
T-1056,Ticket,Confirm the tree lot delivery date,2026-11-19,Review,2026-11-19,Marcus Bell,
```

| Number | Before | After | Moves? |
|---|---|---|---|
| Rows in the file | 56 | **57** | Yes |
| Open tickets now | 22 | **23** | Yes |
| Review bar | 9 | **10** | Yes |
| Bars plus unmapped | 21 + 1 = 22 | **22 + 1 = 23** | Yes |
| Open tickets 7 days earlier | 19 | 19 | No. The new ticket did not exist on Nov 12. |
| Queue, Build, Blocked | 5, 4, 3 | 5, 4, 3 | No |
| Unmapped | 1 | 1 | No |
| Average age of open tickets | 13 days (13.4545) | 13 days (12.8696) | The exact value drops. The displayed number stays 13. |
| Ten oldest table | T-1011 first | Same ten rows | No. The new ticket is 0 days old. |
| Data through | Nov 19, 2026 | Nov 19, 2026 | No |

The "who to nudge" list should gain T-1056 under Marcus Bell. The sentences should follow: "Review is the bottleneck: 10 of 23 open tickets, 6 of the 10 oldest." and "23 tickets are open, 4 more than a week ago". If the page still says 22 and 9, the numbers were typed in.

A good question for the room: "Does the average age change?" It does, from 13.45 to 12.87, and the page still shows 13.

## If the live run fails

Show [`expected/dashboard.html`](expected/dashboard.html) or the screenshot [`expected/dashboard.png`](expected/dashboard.png). To show the change-one-row step with no AI at all, from `demos/dashboard/`:

```sh
python3 expected/build.py sample/tickets.csv output/dashboard.html
cp sample/tickets.csv output/tickets-plus-one.csv
echo "T-1056,Ticket,Confirm the tree lot delivery date,2026-11-19,Review,2026-11-19,Marcus Bell," >> output/tickets-plus-one.csv
python3 expected/build.py output/tickets-plus-one.csv output/plus-one/dashboard.html
```

With no laptop tools at all, the Google Sheets block in [PROMPT.md](PROMPT.md#the-same-numbers-in-google-sheets) gives the same numbers.
