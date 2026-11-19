# Profile of sample/tickets.csv

- **Data rows read:** 56 (the header is not counted).
- **Columns (8):** id, kind, title, opened, stage, stage_entered, owner, closed.
- **Date range:** earliest date 2026-09-10, latest date 2026-11-19, across opened, stage_entered, and closed.

## Blanks per column

| Column | Blank cells |
|---|---|
| id | 0 |
| kind | 0 |
| title | 0 |
| opened | 0 |
| stage | 0 |
| stage_entered | 0 |
| owner | 0 |
| closed | 25 |

## Distinct values in kind

| Value | Rows |
|---|---|
| Ticket | 53 |
| Note | 3 |

The 3 Note rows are T-1001, T-1026, and T-1052. They are not tickets.

## Distinct values in stage

| Value | Rows |
|---|---|
| Queue | 7 |
| Build | 4 |
| Review | 10 |
| Blocked | 3 |
| Done | 31 |
| Reveiw | 1 |

"Reveiw" (T-1047) is not one of the five stages. It is left as written and counted as unmapped.

## Exact duplicate rows

One row appears twice: T-1033, "Repair the torn sidewall on tent 14", on lines 34 and 43 of the file. It is counted once.
