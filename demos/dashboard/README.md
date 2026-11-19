# Demo 7: a dashboard you can check

- `Tease:` Write down three numbers before you ask. Then check those three.
- `Lede:` One made-up ticket export becomes a one-screen dashboard that opens with its answer ("Review is the bottleneck") and the people to nudge, plus a short weekly report in sentences, both made from the same computed numbers. You count three numbers yourself first, and you check the result against them.
- `Why it matters:` Polish is not proof. A wrong number on a good-looking page is the failure people miss, experts included.
- `Go deeper:` [The prompts and presenter steps](PROMPT.md) · [the sample data](sample/README.md) · [reference output](expected/) · [answer key and checks](TEST.md)

## The habit

**Write down three numbers before you ask. Then check those three.**

For the sample they are: how many rows are in the file, how many tickets are open, and which open ticket is the oldest. You get them from a spreadsheet filter or one formula each, with no AI. Then when the AI hands you a page, you have something of your own to hold it against.

Asking the AI "are these numbers right?" is not a check. In [Nate Rosidi's test](https://kdnuggets.com/i-asked-chatgpt-to-analyze-3-datasets-it-made-the-same-mistakes-every-time), a review pass approved a conclusion that was backwards.

## Why bother: two stories

- **Andy Cotgreave**, co-author of [*Dashboards That Deliver*](https://www.dashboardsthatdeliver.com/), [wrote about](https://howtospeakdata.substack.com/p/hallucinations-in-ai-analytics-still) a dashboard Claude built that was shown on a live chart show. One headline number was a wrong subtraction. Another said the peak year was 2008 when the chart on the same page showed 2001. A panel of chart experts did not notice. The numbers had been typed into the page, so every later revision kept them. "Polish is not proof" is the first takeaway in [a recap of his talk on this](https://www.thoughtspot.com/blog/is-you-ai-analyst-lying-andy-cotgreave-webinar-recap).
- **Adam Kucharski** gave an AI one sentence, "Make me a visually attractive interactive dashboard", and [listed ten faults](https://kucharski.substack.com/p/ten-reasons-your-vibe-coded-dashboard) in the result, such as no clear question, panels of equal weight, and the same count shown three times.

## Try it in 10 minutes

All the prompts are in [PROMPT.md](PROMPT.md). Nothing is installed and nothing is sent anywhere. The agent reads `sample/` and writes files to `output/`.

1. **Write down three numbers** from `sample/tickets.csv`, in Google Sheets or by eye.
2. **Ask badly.** Paste the lazy prompt, open `output/lazy-dashboard.html`, and count the faults with the list below.
3. **Ask well.** Paste Prompt A. It profiles the file first, then builds the page from a written brief.
4. **Check it yourself.** Seven checks, done by you with your three numbers.
5. **Predict, then change one row.** Add one ticket, say which numbers will move, and run it again.
6. **Take the habit home.** For anything weekly, build it once in Google Sheets.

## What Prompt A writes

| File | What it is |
|---|---|
| `output/profile.md` | What is in the file: rows, columns, date range, blanks, and every value in `kind` and `stage` |
| `output/brief.md` | Four lines: audience, question, what one row means, data-through date |
| `output/build.py` | The script that computes every number and writes the page. Run it again whenever the data changes. |
| `output/dashboard.html` | One screen, read top to bottom: a one-sentence verdict in the biggest text, who to nudge, open tickets by stage, and the ten oldest open tickets. Definitions are folded away at the bottom. Opens with a double-click, no internet. |
| `output/definitions.md` | Each number, its definition in one sentence, and the columns it uses |
| `output/weekly-report.md` | Five to eight bullets that state findings, using the same numbers |

A finished run looks like [expected/dashboard.png](expected/dashboard.png). On a phone it looks like [expected/dashboard-phone.png](expected/dashboard-phone.png). Why it is laid out this way is in [UX-REVIEW.md](UX-REVIEW.md).

The layout is in the brief, in plain words: what goes first, what is biggest, what is quiet. Change those sentences and you change the page. That is the part to copy for your own work.

A dashboard and a report are different jobs. A dashboard is something you glance at every Monday, so it should say one thing loudly and keep the rest quiet. A report explains, so it needs sentences and titles that state the finding.

## Count the faults

Use this on the lazy dashboard, or on any dashboard someone hands you. The first ten are Adam Kucharski's. The last four are about the numbers.

| # | Fault | Look for |
|---|---|---|
| 1 | No question | Can you say in one sentence what this page is for? |
| 2 | No hierarchy | Are all the panels the same size and weight? |
| 3 | Best space wasted | Is the biggest thing on the page the most useful thing? |
| 4 | A table of everything | Does a table list every row, so the page scrolls? |
| 5 | Unlabeled axes | Does every chart say what it measures? |
| 6 | The interesting number is buried | Is the answer in small text somewhere? |
| 7 | Repeats | Is the same count shown more than once to fill space? |
| 8 | Color with no meaning | Many colors, or a dark theme, that tell you nothing? |
| 9 | Default look | Does it look like every other AI dashboard? |
| 10 | No consistency | Many font sizes and corner styles? |
| 11 | Wrong records | Does the headline count the same rows as the chart under it? Compare it with your number. |
| 12 | Quiet fixes | Did it change, merge, or drop rows on its own? |
| 13 | No definitions | Does it say what "open" means, and from which columns? |
| 14 | No date, or today's date | Does it say "data through" the export date, or does it use the clock? |

Our lazy run on Gemini Flash is saved as [expected/lazy-dashboard.png](expected/lazy-dashboard.png). It looks polished, and its big orange headline says 25 open items. The right answer is 22: it counted three notes as tickets, and it lists the duplicate ticket twice. A Claude Haiku run ([expected/lazy-dashboard-haiku.png](expected/lazy-dashboard-haiku.png)) got 22 right but quietly changed the misspelled stage to Review. Yours will differ, which is the point of counting.

## The sample

`sample/tickets.csv` is 56 rows from the work board of Bramblewick Event Rentals, an invented company. **Everything in it is fictional.** It has four planted problems: three rows that are notes and not tickets, one misspelled stage, one row pasted in twice, and one average that comes out differently if you round it twice. [sample/README.md](sample/README.md) explains each one.

## Free tools

- **Every week:** [Google Sheets](https://sheets.new) for the numbers, with [Data Studio](https://cloud.google.com/data-studio) (the new name for Looker Studio) on top if other people need a view. Both are free in a browser. Every number is a formula you can click, and the page updates when the sheet does. [PROMPT.md](PROMPT.md#the-same-numbers-in-google-sheets) has a paste-ready block of formulas for the sample. Start a report from a sheet with [Google's guide](https://docs.cloud.google.com/data-studio/create-a-report-from-google-sheets).
- **One chart for an email or a slide:** [Datawrapper](https://www.datawrapper.de/). Published charts are public.
- **A one-off page like this demo:** [Gemini](https://gemini.google.com/) or a [Claude artifact](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them) on the free plan. What you get is a snapshot of one file. It will not update next week.

## Then use your own

**Prompt B** in [PROMPT.md](PROMPT.md#prompt-b-now-on-your-own-stuff) does the same job on your own export, in a browser chat or in Antigravity.

**Remove sensitive data first:** names, emails, customer or donor details, salaries, account numbers. **Check your employer's AI policy** before work data goes into a personal AI account. If you are not sure, practice on a made-up copy with the same columns.

## Credits

The method here comes from people who build and teach dashboards.

- Andy Cotgreave, ["Hallucinations in AI Analytics: still real and dangerous"](https://howtospeakdata.substack.com/p/hallucinations-in-ai-analytics-still). Typed-in numbers, and why to change an input and look again.
- Adam Kucharski, ["Ten reasons your vibe-coded dashboard looks terrible"](https://kucharski.substack.com/p/ten-reasons-your-vibe-coded-dashboard). The fault list.
- Jon Schwabish, ["I replicated two Tableau dashboards with Claude"](https://policyviz.com/2026/09/22/i-replicated-two-tableau-dashboards-with-claude-heres-what-broke-and-what-didnt/). A headline that counted different records than the chart beside it, and a number rounded twice.
- Nate Rosidi, ["I Asked ChatGPT to Analyze 3 Datasets"](https://kdnuggets.com/i-asked-chatgpt-to-analyze-3-datasets-it-made-the-same-mistakes-every-time). Define each number in words, and count the rows first.
- Stephen Few, ["Dashboard Confusion"](https://www.perceptualedge.com/articles/ie/dashboard_confusion.pdf). One screen, read at a glance.
- Cole Nussbaumer Knaflic, ["How to use AI to design better graphs and slides"](https://www.storytellingwithdata.com/blog/swd-ai-design-effective-graphs-and-slides). Titles that state the takeaway, and color used sparingly.
- Stephanie Evergreen and Ann K. Emery, [Data Visualization Checklist](https://stephanieevergreen.com/wp-content/uploads/2016/10/DataVizChecklist_May2016.pdf). Bars from zero, and the finding in the title.
- Lisa Charlotte Muth, ["What to consider when using text in data visualizations"](https://blog.datawrapper.de/text-in-data-visualizations/). Direct labels instead of legends.
- Katie Fifer and Claire, ["Embrace Your New Dashboarding Superpowers"](https://technicallycurious.substack.com/p/embrace-your-new-dashboarding-superpowers). Keep the math out of the picture.
- The ["numbers before pixels" checks](https://github.com/abdiraimov-otabek/dashboard-design-skill/blob/HEAD/skills/dashboard-design/references/qa.md) in an open dashboard design skill. Known totals, parts that sum to the headline, and the one-second glance.

Every link above loaded on November 19, 2026.
