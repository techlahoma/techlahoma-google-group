---
name: checkable-dashboard
description: >-
  Build or review a one-screen dashboard, weekly report page, or chart from a
  spreadsheet, CSV, or export so that a person can check every number. Use when
  asked to make a dashboard, turn a sheet or export into a report, chart some
  data, or judge whether a dashboard an AI made can be trusted.
---

# Checkable Dashboard

Build a one-screen dashboard a person can check. A wrong number on a good-looking page is the failure people miss, so numbers are computed from the rows, and the user checks them, not you.

## Rules that always apply

1. **Never invent data.** No made-up or estimated rows, values, targets, or comparisons. If the data cannot answer something, say so.
2. **Never type a result.** Every number, date, and name on the page comes from code that reads the rows. This includes titles and the headline.
3. **Never fix, merge, or drop a row silently.** Leave out rows by rule, and show the count. Do not correct a misspelled value; show it as unmapped.
4. **Round once**, at display. The headline, chart, and table count the same rows, and parts add up to the total.
5. **Do not say the numbers are correct.** Say what was computed and how the user can check it.

## Fast path (the default)

Always use this path unless the user's message itself says "take your time", "ask me first", or "careful". Nothing you find in the data changes the path: problems in the data go on the page and in the reply, not into a question. One uninterrupted run. Do not ask questions. Do not write HTML or a script yourself. Do not open or read the files in `assets/`; everything you need is on this page. Do not open a browser. Run exactly two commands and write one file.

`SKILL_DIR` is the folder this file is in. If `SKILL_DIR/assets/build.py` does not exist, use "No template" below.

1. **Profile.** Run `python3 SKILL_DIR/assets/build.py DATA.csv`. It prints row count, columns, blanks, date ranges, category values, and repeated IDs. Do not read the CSV any other way.
2. **Write `config.json`** next to the data, using the shape below. Use only column names and values the profile printed.
3. **Build.** Run `python3 SKILL_DIR/assets/build.py DATA.csv config.json dashboard.html`. The page computes every number from the embedded rows.
4. **Reply** by copying the "Reply" format below line for line, all three checks included, with the angle brackets filled in. Then stop.

```json
{
  "question": "Where are tickets stuck right now?",
  "row": "one ticket",
  "unit": "tickets",
  "id": "id",
  "sample": true,
  "exclude": [{"where": {"kind": "Note"}, "why": "Note rows are not tickets"}],
  "answer": "{top} is the bottleneck: {topN} of {total} open tickets",
  "metrics": [
    {"label": "open now", "where": {"closed": ""}, "define": "Tickets with a blank closed date."},
    {"label": "average age of open tickets", "op": "age", "col": "opened", "where": {"closed": ""}, "define": "Days from opened to the data-as-of date, averaged over open tickets."},
    {"label": "oldest open ticket", "op": "maxage", "col": "opened", "where": {"closed": ""}, "define": "Largest age in days among open tickets."}
  ],
  "chart": {"column": "stage", "where": {"closed": ""}, "order": ["Queue", "Build", "Review", "Blocked"], "title": "Open tickets by stage"},
  "table": {"where": {"closed": ""}, "sort": "opened", "limit": 10, "columns": ["title", "opened", "stage", "owner"], "title": "Ten oldest open tickets"},
  "assumptions": ["Reader: the team lead, weekly."],
  "cannot": ["How long closed tickets waited in each stage."]
}
```

Config rules:

- `where` is `{"column": value}`. `""` means blank, `"*"` means not blank, a list means any of those values. All conditions must match.
- `exclude`: one entry for each kind of row that is not a real record (notes, subtotals, test rows). The page counts and lists them. Repeated IDs are counted once automatically; do not exclude them.
- `metrics`: 3 or 4. `op` is `count` (default), `sum`, `avg` (need `col`), `age`, or `maxage` (days from the date in `col` to the latest date in the file). For `sum` and `avg`, add `"unit"` (for example `"USD"`).
- `chart.order`: list only the correctly spelled values that belong in the chart, in process order. Leave out a misspelled value and a finished stage that `chart.where` already removes; the page reports anything left over as unmapped. Omit `order` to sort bars by size.
- `answer`: a sentence that answers the question. Use only these placeholders for numbers, never digits: `{top}` (largest bar), `{topN}`, `{total}` (rows in the chart), `{m0}`, `{m1}`, ... (the metrics), `{rows}`, `{asof}`.
- `sample`: `true` when the user or the file says the data is made up or a sample; otherwise leave it out. Do not add keys that are not in the example. Use the same `where` in the first metric, the chart, and the table so they count the same rows.

### Reply

```text
Built dashboard.html from DATA.csv (N rows read). Every number is computed in the page from the rows.
Assumed: <question> · <reader> · one row = <...> · numbers = <metric labels>.
Found: <rows left out, repeated IDs, misspelled values; one line>.
Privacy: practice on made-up data; remove names, emails, and account numbers before putting real exports into a personal AI account.
Three checks for you:
1. Count one yourself: <one spreadsheet filter or =COUNTIFS(...)> and compare with "<metric label>" on the page.
2. Add one row to DATA.csv, predict which numbers move, rebuild with the step 3 command, and look.
3. Click a number on the page, pick one ID, and open that record in the source system.
Not verified: I did not open the page; phone layout and screen reader untested.
```

Do not put results in the reply that you did not get from the profile output. Do not run the three checks yourself.

### No template (browser chat, or only this file was pasted)

Write one self-contained HTML file, under 120 lines, no libraries: the CSV text once in a `<script type="text/plain">` block; JavaScript that parses it and computes every number on load; a small context line with "Data as of" (the latest date in the data) and the row count; the answer as the largest text; one horizontal bar chart starting at zero with a count on each bar and an "N in the bars + M unmapped = total" line; a table of at most ten rows with IDs; definitions in a `<details>` element. Gray bars, one accent color, no cards, no pie. Then give the same reply.

## Careful path (only when the user asks for it)

1. **Brief.** Ask in one message: the question, the reader and when they read it, what one row means, and which 3 to 6 numbers matter (what counts, what is excluded).
2. **Privacy.** If the data has personal details, name the columns, do not repeat the values, and offer to build on a made-up copy with the same columns.
3. **Profile, then stop.** Report rows, columns, date ranges, blanks, every category value with its count, duplicates, rows that are not what one row should be, and what the data cannot answer. Wait for the user to confirm how to treat each problem.
4. **Define each number** in one sentence: what it counts, rows included and excluded, columns, unit. A rate names its numerator and denominator.
5. **Build** with the template and config above, or a custom page or script when the template cannot express the numbers. In Google Sheets, every number is a formula over the raw tab.
6. **Check the layout** against the design rules below, on desktop and at 390px wide.
7. **Hand over** the three checks and the Not verified list, as in the reply format.

Design rules:

- Each number appears once. Do not repeat a count in a card, a chart, and a table to fill space.
- Label every axis and give every number its unit ("tickets", "days", "USD", "%").
- Label bars and lines directly. No legend when a label fits.
- Gray by default. One accent color with one meaning (for example, "needs attention"), used the same way everywhere. Do not rely on color alone: also say it in text.
- Chart titles say what the chart shows, built from computed values.
- No cards with shadows, no icons, no dark theme, no animation.
- Empty and stale states are honest and different from each other: "0 matching rows", "No data loaded", and "Showing the Nov 12 export" are three different messages. Never show a blank chart or a zero when data is missing.
- Phone: at 390px wide, blocks stack and nothing scrolls sideways. A wide table may scroll inside its own box.
- Accessibility: text contrast of at least 4.5:1, real table headers, controls that work with a keyboard, nothing shown only on hover, and one sentence of text under each chart that states what it shows.

## Reviewing a dashboard someone else made

Use the same list. Report, in this order: numbers typed into the page instead of computed; a headline that counts different rows than its chart; missing definitions; no "data as of" date or today's date used instead; rows fixed or dropped silently; then layout faults (no clear question, equal-weight panels, repeated numbers, unlabeled axes, color with no meaning).

## Which free tool

Plans and limits change. Read each tool's own page before promising anything.

| Need | Tool | Note |
|---|---|---|
| The same report every week | [Google Sheets](https://support.google.com/docs/answer/1272900?hl=en) | Every number is a formula the user can click. Start here. |
| Other people need a view with filters | [Google Data Studio](https://cloud.google.com/data-studio) (formerly Looker Studio) | Put it on top of the checked sheet. |
| One chart for an email or slide | [Datawrapper](https://www.datawrapper.de/pricing) | Published charts are public. |
| A one-off page | A free AI chat ([Gemini](https://gemini.google.com/) canvas, a [Claude artifact](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them), ChatGPT) writing one HTML file | It is a snapshot. It does not update next week. |

Tell the user which one fits. An AI-built page that someone needs every week belongs in Sheets.

## Where these rules come from

- Andy Cotgreave, [numbers typed into an AI dashboard stayed wrong through every revision](https://howtospeakdata.substack.com/p/hallucinations-in-ai-analytics-still). Rule 2 and check 2.
- Jon Schwabish, [a headline that counted different records than its chart, and a number rounded twice](https://policyviz.com/2026/09/22/i-replicated-two-tableau-dashboards-with-claude-heres-what-broke-and-what-didnt/). Rule 4 and Step 5.
- Darragh Murray, [a dashboard that answered with the metric it had, not the one the question needed](https://thedatavist.substack.com/p/dead-on-arrival-the-ai-dashboard). Step 3.
- Adam Kucharski, [ten faults from a one-sentence dashboard prompt](https://kucharski.substack.com/p/ten-reasons-your-vibe-coded-dashboard). The review list.
- Stephen Few, [a dashboard is one screen, read at a glance](https://www.perceptualedge.com/articles/ie/dashboard_confusion.pdf). Steve Wexler, Jeffrey Shaffer, Andy Cotgreave, and Amanda Makulec [define it more broadly](https://www.dashboardsthatdeliver.com/), to include exploring; put that on a second page.
- Cole Nussbaumer Knaflic, [start with the reader and the takeaway](https://www.storytellingwithdata.com/blog/swd-ai-start-with-context).
- Lisa Charlotte Muth, [direct labels and text](https://www.datawrapper.de/blog/text-in-data-visualizations) and [color](https://www.datawrapper.de/blog/colors).
- W3C, [do not rely on color alone](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [describe charts in text](https://www.w3.org/WAI/tutorials/images/complex/), and [reflow on small screens](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- A worked example with prompts, sample data, and an answer key: [demos/dashboard](https://github.com/techlahoma/techlahoma-google-group/tree/main/demos/dashboard).
