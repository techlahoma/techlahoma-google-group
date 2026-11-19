# Sample data: ticket export

- `Tease:` One made-up ticket export, messy in the ways real exports are.
- `Lede:` `tickets.csv` is 56 rows from the work board of Bramblewick Event Rentals, an invented tent and party rental company with a five-person office team. The snapshot is "data through" Thursday, November 19, 2026.
- `Why it matters:` The file has four planted problems. A dashboard that ignores them still looks fine and shows wrong numbers.
- `Go deeper:` [The prompts](../PROMPT.md) · [the answer key](../TEST.md)

**Fictional sample data for the workshop.** The company, the people, and every ticket are invented. Any match with a real business or person is a coincidence.

## Columns

| Column | Meaning |
|---|---|
| `id` | Board id, such as `T-1011` |
| `kind` | `Ticket` for work to be done. `Note` for reminders someone parked on the board. |
| `title` | What the item is |
| `opened` | Date it was added |
| `stage` | Where it is now. In process order: Queue, Build, Review, Blocked, Done. |
| `stage_entered` | Date it moved to that stage |
| `owner` | Who has it |
| `closed` | Date it was finished. Blank means it is still open. |

One row is one item on the board on November 19, 2026.

## What is planted

1. **Three rows are notes, not tickets** (`T-1001`, `T-1026`, `T-1052`). All three have a blank `closed`, so a careless count calls them open tickets.
2. **One stage is misspelled:** `T-1047` says `Reveiw`. It should be reported, not quietly fixed.
3. **One row appears twice:** `T-1033` is on lines 34 and 43.
4. **One average rounds two ways:** the average age of open tickets is 13.4545 days. Rounded once it is 13. Rounded to 13.5 and then again, it becomes 14.

Dates are plain `YYYY-MM-DD`. No title contains a comma. The file was written for this workshop on 2026-11-19, and `../check.ts` recomputes every number in the answer key from it.
