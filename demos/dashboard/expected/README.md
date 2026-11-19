# Reference output

- `Tease:` What a good run of Prompt A looks like, and what one lazy run looked like.
- `Lede:` These files were made on 2026-11-19 by following Prompt A as written against `sample/tickets.csv`. They pass every check in `../TEST.md`.
- `Why it matters:` If a live run fails, show these. `build.py` also works as a no-AI fallback.
- `Go deeper:` [Answer key](../TEST.md) · [prompts](../PROMPT.md)

| File | What it is |
|---|---|
| `profile.md`, `brief.md` | The profile step and the four-line brief |
| `build.py` | Computes every number and writes the page. `python3 expected/build.py sample/tickets.csv output/dashboard.html` |
| `dashboard.html`, `definitions.md` | Written by `build.py` |
| `dashboard.png`, `dashboard-phone.png` | The page at 1440 and 390 pixels wide |
| `before/dashboard.png`, `before/dashboard-phone.png` | The earlier layout, kept for comparison. The numbers were the same; the page did not say what to do. See `../UX-REVIEW.md`. |
| `cheap-run.png`, `cheap-run-phone.png` | One real run of Prompt A on a low-cost model (Claude Haiku, 2026-11-19), unedited. It passed every check in `../check.ts`. It used year-first dates and taller phone rows; Prompt A now asks for both to be fixed, and that wording has not been run again. |
| `weekly-report.md` | Seven bullets, numbers copied from the script's printout |
| `lazy-dashboard.html`, `lazy-dashboard.png` | One real run of the lazy prompt on Gemini 3.8 Flash (Low) in the Antigravity CLI, 2026-11-19, unedited. Headline says 25 open items (it counted 3 notes; the right answer is 22), lists the duplicate T-1033 twice, and dumps all 56 rows. |
| `lazy-dashboard-haiku.html`, `lazy-dashboard-haiku.png` | An earlier lazy run on Claude Haiku: 22 open was right, but it silently changed "Reveiw" to Review (Review bar 10, not 9). |

## What the lazy run got wrong

It is a tidy page, and its open-ticket count (22) is right. Counted against the list in `../README.md`:

- No question. Six cards of equal weight, and "open" is one of them.
- It changed "Reveiw" to "Review" on its own, so Review reads 10. The file says 9, plus 1 unmapped.
- The top line says "55 unique rows". The file has 56.
- The date is typed into its script, so it will be wrong for next week's export.
- The Done bar (30) sets the scale, so the four stages that matter are short.
- Five colors, and every title is a label ("Pipeline by stage").
- A table of all 22 open tickets and a second table by owner, so the page scrolls.
- The weekly chart compares a part week (W47) with full weeks.
- No definitions and no comparison with last week.

Another run, or another model, will make different mistakes.
