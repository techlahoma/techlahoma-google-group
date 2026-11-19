# Definitions

Data through Nov 19, 2026 · 56 rows. Written by build.py from tickets.csv.

- **Rows: 56.** Data rows read from the file, not counting the header. Columns: all columns.
- **Data through: Nov 19, 2026.** The latest date anywhere in the file. Today's date is never used. Columns: opened, stage_entered, closed.
- **Ticket: 52.** A row where kind is Ticket, with 1 exact duplicate row (T-1033) counted once and 3 rows with another kind (Note: 3) left out. Columns: kind, and every column for the duplicate check.
- **Open tickets now: 22.** Tickets where closed is blank. Columns: kind, closed.
- **Open tickets 7 days earlier: 19.** Tickets opened on or before Nov 12, 2026 and not closed on or before that day. Columns: kind, opened, closed.
- **Open tickets by stage: Queue 5, Build 4, Review 9, Blocked 3.** Open tickets grouped by stage, in process order. "Reveiw" on T-1047 is counted as open and reported as unmapped. It was not changed to another stage and is not in any bar. Columns: kind, closed, stage.
- **Bottleneck: Review, with 9 open tickets.** The stage with the most open tickets. It is a count, not a judgment about the people in that stage. Columns: kind, closed, stage.
- **Who to nudge: 5 owners, 9 tickets.** Every owner of an open ticket in Review, with each of those tickets and its age. Owners are ordered by their oldest ticket. Columns: kind, closed, stage, owner, opened.
- **Average age of open tickets: 13 days.** Data-through date minus opened, averaged over open tickets. Exact value 13.4545, rounded once, at display. Columns: kind, closed, opened.
- **Ten oldest open tickets: T-1011 is the oldest, opened Sep 28, 2026.** Open tickets sorted by opened, oldest first. Age is the data-through date minus opened, in days. The small bar next to each age starts at zero and is as long as the age. Columns: kind, closed, opened.
