# UX review: the dashboard you can check

- `Tease:` The numbers were right and the page still did not help. Here is why, and what changed.
- `Lede:` Sam rated the first briefed dashboard 3/10: "it may be useful, but it's not scannable... I don't really understand what this is or how this helps me." The page now opens with one sentence that answers the question, then the people to nudge, then the evidence.
- `Why it matters:` A correct dashboard that nobody can read in two seconds does the same job as no dashboard. The fix was made in the brief, in plain words, so a cheap model produces it too.
- `Go deeper:` [Before, 1440px](expected/before/dashboard.png) · [after, 1440px](expected/dashboard.png) · [before, phone](expected/before/dashboard-phone.png) · [after, phone](expected/dashboard-phone.png) · [the brief](PROMPT.md#step-3-prompt-a-the-brief)

Reviewed 2026-11-19 from the rendered page at 1440px and 390px (headless Chrome screenshots) and from the source of `expected/build.py`.

## What was wrong, in Sam's terms

| # | Problem on the old page | Why it hurt | Severity |
|---|---|---|---|
| 1 | **It never said the answer.** The title was the question, "Where are tickets stuck?". The answer, Review, was split across three small headings. | "I don't really understand what this is." A reader had to assemble the finding from three places. | High |
| 2 | **The biggest thing was the least useful.** A giant "22" led the page. | 22 open tickets is context. Nobody acts on it. The best space on the page went to a number with no "so what". | High |
| 3 | **No names to act on.** Owners appeared only as the fourth column of a table. | "How does this help me?" A project manager's next step is a message to a person. The page made them work out who. | High |
| 4 | **The table could not be scanned.** Titles wrapped to two lines on half the rows, so rows had different heights. Stage was colored text. Age was text only. | The eye could not run down a column. Finding "which are old and in Review" meant reading every row. | High |
| 5 | **Definitions took a third of the first screen.** Eight paragraphs, open, at the same text size as the data. | Reference text competed with the answer. On a phone it was the last 40% of a 2,600px page. | Medium |
| 6 | **Everything had the same weight.** Three headings at the same size, two columns of equal pull. | No reading order. This is fault 2 on the demo's own fault list. | Medium |
| 7 | **The unmapped note looked like an alarm.** A boxed callout with a thick dark side bar. | It is an honest footnote about one ticket. It drew more attention than the bars it explains. | Low |

Strengths that were kept: every number is computed by the script, bars start at zero and are labeled directly, one accent color, "Data through" and the row count on the page, the bars plus unmapped add up to the headline, and no pie, gauge, or legend.

## What changed

| Before | After | Why |
|---|---|---|
| Title is a question; the answer is spread over three headings | One verdict sentence in the only large text: "Review is the bottleneck: 9 of 22 open tickets, 6 of the 10 oldest." | One dominant element. Two seconds is enough to get it. |
| A giant "22" with "19 seven days earlier" beside it | One gray line under the verdict: "22 tickets are open, 3 more than a week ago (19 on Nov 12). Average age of open tickets: 13 days." | Context stays on the page and stays checkable, but quiet. |
| Owners only inside the table | "Who to nudge": five owners, each with their Review tickets as chips (id and age), oldest first | The action comes before the evidence. |
| Titles wrap; rows have uneven heights | One line per row; a long title is cut with "…" | Every column can be scanned top to bottom. |
| Stage as colored text | Stage as a pill, gray by default, accent for Review | The stuck rows stand out at a glance. |
| Age as "52 days" text | The number plus a thin bar from zero, as long as the age | Age is compared by length, not by reading. |
| Definitions open, under the dashboard | A closed "Definitions and how rows were counted" at the bottom, with two new entries for "bottleneck" and "who to nudge" | Available, but out of the way. |
| Unmapped note in a boxed callout with a side bar | One small line under the bars: "1 unmapped ... 21 in the bars + 1 unmapped = 22 open." | Still honest, no longer loud. |
| Accent color on one bar and some table text | Accent means "the bottleneck stage" everywhere: the word in the verdict, its bar, its pills, its age bars, the chips | One color, one meaning. |
| Phone: table rows stacked as four text lines each | Phone: id, owner, and pill on one line, the title, then the age with its bar and "since Sep 28" | Same scan on a 390px screen, no sideways scroll. |

## Skills applied

- **impeccable** (critique, then polish). Run in one context, not with its two separate reviewers, so treat the critique as a single opinion. Its detector flagged a flat type scale on the old page (20, 17, 14.5px) and reports nothing on the new one. It also bans a thick colored side bar on callouts, which is fix 7.
- **sam-ux-audit**. Lens versions passed preflight. Accessibility and hierarchy were reviewed from screenshots and source. Text contrast is above 4.5:1 for every text color used, the definitions use a native `<details>`, which works with a keyboard, and the table keeps real header cells. Motion and performance do not apply: the page is static, has no script, and loads nothing. Keyboard focus was not tested in a live browser, and no screen reader was run.
- **frontend-preferences**. Adapted the existing page instead of starting over, kept it to one file, added no motion, and checked both widths in a real browser.
- **emil-design-eng**. Polish only: tabular numbers so digits line up, a themed text selection color, a visible focus ring on the definitions toggle, and no animation, because a page read every Monday should not move.

## Not verified

- The two-second claim is a design judgment. Nobody in the target audience has looked at it yet.
- "Bottleneck" means "the stage with the most open tickets". On other data the biggest stage may be Queue, which is normal and not a problem. The definition is on the page. A stricter rule, such as the stage where tickets have waited longest, would need the `stage_entered` column and one more definition.
