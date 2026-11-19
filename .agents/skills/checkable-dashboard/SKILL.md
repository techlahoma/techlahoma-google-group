---
name: checkable-dashboard
description: >-
  Build or review a one-screen dashboard, weekly report page, or chart from a
  spreadsheet, CSV, or export so that a person can check every number. Use when
  asked to make a dashboard, turn a sheet or export into a report, chart some
  data, or judge whether a dashboard an AI made can be trusted.
---

# Checkable Dashboard

Build a dashboard a person can check. A wrong number on a good-looking page is the failure people miss, so the numbers come before the design, and the user checks them, not you.

Follow the steps in order. Do not skip a step because the request looks simple.

## Rules that always apply

1. **Never invent data.** Do not make up, estimate, or fill in rows, values, targets, or comparisons. If the data cannot answer something, say so on the page and in your reply.
2. **Never type a result into the page.** Every number, date, and name shown comes from code that reads the rows. No totals, percentages, or findings written by hand, in the page or in its titles.
3. **Never fix, merge, or drop a row silently.** Count what you excluded or could not map, and show that count.
4. **Round once**, when a number is displayed. Compute a rate as total divided by total, not as an average of rounded rates.
5. **Do not say the numbers are correct.** Say what you computed and what the user should compare it with.

## Step 1: Write the brief

Before building, get these four answers. Ask for all four in one message. If the user already gave some, do not ask again.

1. **Question.** What one question does this dashboard answer? ("Where are tickets stuck right now?")
2. **Reader.** Who reads it, and when? ("A project manager, Monday morning.")
3. **One row.** What does one row of the data mean? ("One ticket." "One order line.")
4. **Numbers.** Which 3 to 6 numbers matter? For each: what counts, and what is excluded.

If the user says "just build it", write your best answers as four lines labeled **Assumptions**, show them, and continue. Put the same lines in the definitions on the page.

## Step 2: Check the data is safe to use

Say this once, before the user shares data or as soon as you see it:

> Practice on made-up data. Do not put real customer, employee, donor, or patient exports into a personal AI account. Remove names, emails, phone numbers, account numbers, and pay first, and check your employer's AI policy.

If the data you were given contains personal details, say which columns, do not repeat the values, and offer to build on a made-up copy with the same columns. If you create sample data, label it "Made-up sample data" on the page. Never pass sample data off as real.

## Step 3: Profile the data, then stop

Report these before you build anything:

- Rows read (not counting the header) and the column names
- Earliest and latest date in each date column
- Blanks per column
- Every distinct value in each category column, with its count (this is where misspellings show up)
- Duplicate rows and repeated IDs
- Rows that are not what one row is supposed to be (notes, subtotals, test records)
- **What this data cannot answer.** For example: "There is no close date, so I cannot show how long tickets take."

Then stop and wait for the user to confirm how to treat the problems you found. If you cannot wait (the user asked for one uninterrupted run), choose the option that changes the fewest rows, and report each choice.

## Step 4: Define each number

For every number on the page, write one sentence: what it counts, which rows are included and excluded, which columns it uses, and its unit. A rate names its numerator and denominator. A comparison names both periods.

Use the latest date in the data as "data as of". Do not use today's date.

## Step 5: Compute with code

- **In a browser chat** (artifact or canvas): one self-contained HTML file. Put the rows in the page once, as data. JavaScript in the page computes every number from those rows when the page loads. No libraries from the internet.
- **In a folder with an agent** (Antigravity, Claude Code, Codex): either the same single file, or a small script that reads the file, prints every number, and writes the page. Running it again on new data must produce new numbers.
- **In Google Sheets:** every number is a formula over the raw tab. The chart reads the summary cells.

The headline, the chart, and the table must count the same rows. Parts must add up to the total. If they do not, show the difference as its own labeled line ("21 in the bars + 1 unmapped = 22 open").

## Step 6: Lay out one screen

Build top to bottom in this order. Each block is quieter than the one above.

1. **Context line**, small: the question, the date range, "Data as of <date>", and the row count.
2. **The answer**, as the largest text on the page: one sentence built from computed values that answers the question. If the page has filters, the sentence must update with them.
3. **One or two charts**, chosen for the comparison:
   - Compare categories: horizontal bars, starting at zero, in process order or sorted by value.
   - Change over time: a line, in time order. Leave a gap where data is missing.
   - Look up specific items: a short table of the rows that need attention, at most ten.
   - No pie charts, gauges, 3D, or dual axes.
4. **Definitions**, folded away at the bottom (a `<details>` element), with the Step 4 sentences and the counts of excluded or unmapped rows.

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

## Step 7: Make it checkable

- Each number can show the rows behind it: click or expand the number to list the matching IDs, or put a filtered table under it.
- Each row in a table shows its ID, so the user can find that record in the source system.
- The definitions are on the page, not only in the chat.

## Step 8: Hand over three checks

End your reply with these three checks for the user to run. Fill in the specifics from their data. Do not run them yourself and report success.

1. **Compute one total yourself.** Name one number and how to get it without AI, such as a spreadsheet filter or one formula like `=COUNTIFS(...)`. The user compares their result with the page.
2. **Change one thing and predict.** Name one row to add or one filter to change. Ask the user to write down which numbers will move and which will stay, then make the change and look. If nothing moves, the numbers were typed in.
3. **Open one source record.** Name one ID from the table. The user opens that record in the original system and compares its fields with the page.

Then list **Not verified**: anything you did not test, such as the phone layout, a screen reader, a filter, or a column you guessed the meaning of. If you tested nothing, say so.

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
