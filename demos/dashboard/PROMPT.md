# Prompts: a dashboard you can check

- `Tease:` Write down three numbers, ask badly, ask well, then check the three numbers yourself.
- `Lede:` The lazy prompt and Prompt A both run on the fictional ticket export in `sample/`. The follow-up adds one ticket so the room can predict what moves. Prompt B is the same job on your own export.
- `Why it matters:` A wrong number on a good-looking page is the failure people miss. Each step here gives a person, not the AI, something to compare.
- `Go deeper:` [README](README.md) · [answer key and checks](TEST.md) · [reference output](expected/) · [Google Sheets answer key](#the-same-numbers-in-google-sheets)

## Step 1: write down three numbers (no AI)

Open `sample/tickets.csv` in Google Sheets (File → Import → Upload). Write these on paper or a sticky note.

| Control number | Formula (type it in any empty cell in column J) | By eye |
|---|---|---|
| Rows in the file | `=COUNTA(A2:A1000)` | Last row number, minus 1 for the header |
| Open tickets | `=COUNTIFS(B2:B1000,"Ticket",H2:H1000,"")` | Data → Create a filter. Set `kind` to Ticket and `closed` to (Blanks). Select the ids that are left and read **Count** at the bottom right. |
| Oldest open ticket | `=MINIFS(D2:D1000,B2:B1000,"Ticket",H2:H1000,"")` then Format → Number → Date | With that filter on, sort `opened` A to Z. It is the top row. |

Do not look at [TEST.md](TEST.md) yet. It has the answers.

## Step 2: the lazy prompt

Open this repository (or just the `demos/dashboard` folder) in Antigravity and paste:

```text
Make me a dashboard from demos/dashboard/sample/tickets.csv (or sample/tickets.csv if this folder is open). Save it next to that sample folder as output/lazy-dashboard.html.
```

Open the page and count faults out loud with the checklist in [README.md](README.md#count-the-faults). Then compare its biggest number with the open tickets you wrote down.

## Step 3: Prompt A, the brief

Start a new chat so the lazy answer does not carry over. Paste the brief below. Step 5 is the layout, in plain words: what comes first, what is biggest, what stays quiet. To adapt it, change those sentences. No code is needed.

```text
Work only inside demos/dashboard/ (if that is the folder you have open, it is the current folder). Read only sample/tickets.csv. Do not open TEST.md, check.ts, or expected/; they are the answer key. Do not change sample/, install anything, or send anything anywhere.

1. Profile first. Write output/profile.md: data rows read (not counting the header), column names, earliest and latest date, blanks per column, every distinct value in kind and in stage with its count, and any exact duplicate rows.
2. Then write a second file, output/brief.md, with 4 lines. Audience: a project manager who checks this Monday morning. Question: where are tickets stuck right now? What one row means. Data through: the latest nonblank date across the opened, stage_entered, and closed columns (never today's date).
3. Rules for every number. Count only rows where kind is Ticket. Count an exact duplicate row once. A ticket is open when closed is blank. The stages, in process order, are Queue, Build, Review, Blocked, Done. Never fix a stage that is spelled differently: count it as "unmapped" and report it. Age is the data-through date minus opened, in days. Round only once, when a number is displayed.
4. Write output/build.py (Python standard library only; if Python is missing, write output/build.js for Node or Bun with no packages). It reads the CSV path given as its first argument (default sample/tickets.csv), computes every number, prints each one, and writes the HTML file named by its second argument (default output/dashboard.html). Type no result into the script or the page. Run it once; do not write a second builder.
5. The page is ONE self-contained file: inline CSS, no CDN, no JavaScript, no images, opens with a double-click. A project manager must get the answer in two seconds, so build it in this order, top to bottom, each block quieter than the one above:
   a. One small gray line: the question from the brief on the left, "Data through <date> · <N> rows" on the right.
   b. The verdict, as the biggest text on the page (about 44px, bold, the only big text): "<Stage with the most open tickets> is the bottleneck: <its count> of <open> open tickets, <how many> of the 10 oldest." Under it, one normal gray line: "<open> tickets are open, <difference> more (or fewer) than a week ago (<count> on <date>). Average age of open tickets: <whole days> days." A week ago means 7 days before the data-through date: opened on or before that day and not closed on or before it.
   c. Two blocks side by side (stacked on a phone). Left, "Who to nudge": a plain list, not a table. One line per owner who has open tickets in the bottleneck stage: the name in bold, then each of their tickets there as a small rounded chip with its id and age in days, oldest first. Order the owners by their oldest ticket. Right, "Open tickets by stage": four horizontal bars in process order (Queue, Build, Review, Blocked), starting at zero, the count written at the end of each bar. Under the bars, one small line naming any unmapped stage, its count, and the sum: "<bars total> in the bars + <unmapped> unmapped = <open> open."
   d. The only table on the page: the ten oldest open tickets, oldest first, one line per row. Columns: id, title (cut with "…" if it does not fit), stage as a small rounded pill, owner, opened, and age in days followed by a thin bar whose length matches the age (starting at zero).
   e. Last: a <details> element, closed, with the summary "Definitions and how rows were counted".
   Look: white page, dark gray text, thin gray lines between rows, no boxes, cards, or shadows. Bars and pills are gray. Use ONE accent color, only for the bottleneck stage: its name in the verdict, its bar, its pills and age bars in the table, and the chips. No legend, pie chart, gauge, or icons. Each block has a short title built from the computed numbers. Write dates like "Nov 19, 2026" on the page. At 390px wide nothing scrolls sideways: each table row becomes a compact block of exactly three lines (id and title; stage pill and owner on their own line; opened and age), with no column labels, and nothing overlaps.
6. Inside the <details>, list each number, its definition in one sentence, the columns it uses, and how Note rows, the duplicate, and the unmapped stage were handled. Define "bottleneck" and "who to nudge" there too. For the average, include the words "rounded once, at display". The script builds this list from the same computed values it uses for the page (never hand-written text), and saves the same list as output/definitions.md, so both change when the data changes.
7. Write output/weekly-report.md: 5 bullets, each starting with a short bold finding. Use only values the script printed.
8. Confirm that output/ now holds profile.md, brief.md, build.py, dashboard.html, definitions.md, and weekly-report.md. Do not tell me the numbers are correct. Tell me the rows read, open tickets now, and the oldest open ticket, so I can compare them with the three numbers I wrote down myself.
```

## Step 4: the human checks

Open `output/dashboard.html` with a double-click. A person does these, with the sticky note in hand. Asking the AI "are these numbers right?" is not a check.

1. **Rows.** Does "rows" at the top match your row count?
2. **Control totals.** Do open tickets and the oldest open ticket match what you wrote down?
3. **Adds up.** Add the four bars. Plus the unmapped line, do they equal the big number?
4. **Definitions.** Click "Definitions and how rows were counted" at the bottom and read the list. Is "open" what you mean by open? Does it say what happened to the notes, the duplicate, and the misspelled stage?
5. **Two seconds.** Look away, look back. Does your eye land on the answer? Can you say who to nudge?
6. **Date.** Is "Data through" on the page, and is it the export date, not today?
7. **Typed or computed.** That is step 5.

## Step 5: predict, then change one row

Ask the room first: "A new ticket came in this morning and went straight to Review. Which numbers move, and which stay?" Write the predictions down. Then paste:

```text
Copy sample/tickets.csv to output/tickets-plus-one.csv and add this line at the end of the copy:
T-1056,Ticket,Confirm the tree lot delivery date,2026-11-19,Review,2026-11-19,Marcus Bell,
Do not change sample/ or the build script. Create the folder output/plus-one. Then run the same script twice, first on the sample and then on the copy:
python3 output/build.py sample/tickets.csv output/dashboard.html
python3 output/build.py output/tickets-plus-one.csv output/plus-one/dashboard.html
Show me the two printouts side by side. Do not explain which numbers should have changed; I will check that myself.
```

Open `output/plus-one/dashboard.html` beside the first page and compare with the predictions. The expected before and after numbers are in [TEST.md](TEST.md#change-one-row). If nothing moved, the numbers were typed in, and the page cannot be trusted next week.

## Step 6: the takeaway

An AI-built page is a snapshot of one file. For anything you send every week, build it once in Google Sheets, with [Data Studio](https://cloud.google.com/data-studio) (the new name for Looker Studio) on top if other people need a view. Both are free in a browser, and every number is a formula you can click on.

### The same numbers in Google Sheets

This is the answer key and the offline fallback. With `sample/tickets.csv` imported so that `id` is in A1, copy this block and paste it into cell **J1**:

```tsv
Check	Value
Rows in file	=COUNTA(A2:A1000)
Repeated ids (duplicates)	=COUNTA(A2:A1000)-COUNTUNIQUE(A2:A1000)
Rows that are not tickets	=COUNTA(A2:A1000)-COUNTIF(B2:B1000,"Ticket")
Open tickets	=COUNTIFS(B2:B1000,"Ticket",H2:H1000,"")
Queue	=COUNTIFS($B$2:$B$1000,"Ticket",$H$2:$H$1000,"",$E$2:$E$1000,J6)
Build	=COUNTIFS($B$2:$B$1000,"Ticket",$H$2:$H$1000,"",$E$2:$E$1000,J7)
Review	=COUNTIFS($B$2:$B$1000,"Ticket",$H$2:$H$1000,"",$E$2:$E$1000,J8)
Blocked	=COUNTIFS($B$2:$B$1000,"Ticket",$H$2:$H$1000,"",$E$2:$E$1000,J9)
Unmapped stage	=K5-SUM(K6:K9)
Oldest open ticket opened	=MINIFS(D2:D1000,B2:B1000,"Ticket",H2:H1000,"")
Data through	=MAX(D2:D1000,F2:F1000,H2:H1000)
Open 7 days earlier	=COUNTIFS(B2:B1000,"Ticket",D2:D1000,"<="&(K12-7))-COUNTIFS(B2:B1000,"Ticket",H2:H1000,"<="&(K12-7))
Average age of open tickets (days)	=ROUND(K12-AVERAGEIFS(D2:D1000,B2:B1000,"Ticket",H2:H1000,""),0)
```

Format K11 and K12 as dates. Expected values, top to bottom: 56, 1, 3, 22, 5, 4, 9, 3, 1, Sep 28 2026, Nov 19 2026, 20, 13.

"Open 7 days earlier" reads **20** here because the sheet still holds the duplicate row. Remove it (Data → Data cleanup → Remove duplicates) and it reads **19**, rows read 55, and repeated ids 0. That is the duplicate trap, visible in a cell.

To chart it, select J6:K9 and choose Insert → Chart → Bar chart. To try the change-one-row step here, type the new ticket into the first empty row and watch K5 and K8.

## Prompt B: now on your own stuff

**Remove sensitive data first.** Before you upload or paste anything, delete or blank out names, email addresses, phone numbers, customer or donor details, salaries, account numbers, and anything about health or HR. Counts, dates, and stages are usually all a dashboard needs. **Check your employer's AI policy** before any work data goes into a personal AI account. If the answer is no or unclear, practice on a made-up copy with the same columns.

First write down three numbers from your own export, the way step 1 does.

### In a browser chat (Gemini, Claude, ChatGPT)

Attach the export (CSV or XLSX) or paste the rows, then paste this. Fill in the two brackets.

```text
I attached (or pasted below) an export. I removed sensitive data; if you still see names, emails, or account numbers, tell me and do not repeat them.

1. Before building anything, tell me: rows read, column names, the date range, blanks per column, the distinct values in each category column, and any duplicate rows. Then stop and wait for me.
2. After I answer, build a one-screen dashboard as one self-contained HTML page (an artifact or canvas is fine).
   Audience: [who reads it and when]. Question: [the one question it answers].
3. Show exactly three things: one headline number with the same number 7 days earlier beside it, one bar chart, and one table of the ten rows that most need attention.
4. Compute every number from the data with code. Type no result into the page. Round only once, at display.
5. At the top show "Data through <latest date in the data> · <N> rows".
6. Bars start at zero, in an order that means something (process order or by value). Gray, with one accent color for the bar that needs attention. Label bars directly. No legend, pie chart, or gauge. Each title states the finding.
7. Never fix or drop a row silently. List anything you excluded, merged, or could not map, with its count.
8. Under the dashboard, list each number, its definition in one sentence, and the columns it uses.
9. Do not tell me the numbers are right. Tell me the row count and the headline number so I can compare them with my own.
```

Then change one row in your file, upload it again in the same chat, and ask for a rebuild. The number you expect to move should move.

### In Antigravity (a folder of exports)

Put your exports in a new, empty folder. For Google Sheets, use File → Download → CSV for each tab. Open that folder in Antigravity and paste:

```text
This folder has my own exports. I removed sensitive data; if you find names, emails, or account numbers, stop and tell me. Do not send, post, upload, or share anything, do not install anything, and do not change my original files.

1. Write output/profile.md: for each file, rows read, column names, date range, blanks per column, distinct values in each category column, and duplicate rows.
2. Propose in output/brief.md: the audience, the one question, one headline number, one bar chart, one table of ten rows, and a one-sentence definition of each number with its columns. Show me the brief and wait for my yes.
3. After I say yes, write output/build.py (Python standard library only, or output/build.js with no packages). It reads the file paths from its arguments, computes and prints every number, and writes output/dashboard.html as one self-contained page: "Data through <date> · <N> rows" at the top, bars from zero in gray with one accent color, direct labels, no legend, pie, or gauge, titles that state the finding, and the definitions listed under the dashboard.
4. Never fix or drop a row silently. List what you excluded or could not map, with counts.
5. Write output/weekly-report.md: 5 to 8 bullets, each starting with a bold finding, with every number copied from the script's printout.
6. Do not tell me the numbers are right. Tell me the rows read and the headline number so I can compare them with my own.
```

Next week, drop the new export in the folder and run the same script again. If you find yourself doing that every week, move it to Google Sheets and Data Studio.
