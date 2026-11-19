#!/usr/bin/env python3
"""Build the "Where are tickets stuck?" dashboard from a ticket export.

Usage: python3 output/build.py [tickets.csv] [dashboard.html]
Defaults: sample/tickets.csv and output/dashboard.html.

Every number on the page is computed here from the CSV. Nothing is typed in.
Python standard library only. The page needs no network and no JavaScript.
"""
import csv
import html
import sys
from datetime import date, timedelta
from pathlib import Path

STAGES = ["Queue", "Build", "Review", "Blocked", "Done"]  # process order
OPEN_STAGES = STAGES[:-1]
DATE_COLUMNS = ["opened", "stage_entered", "closed"]

csv_path = Path(sys.argv[1] if len(sys.argv) > 1 else "sample/tickets.csv")
html_path = Path(sys.argv[2] if len(sys.argv) > 2 else "output/dashboard.html")


def day(text):
    return date.fromisoformat(text.strip())


def nice(d):
    return f"{d:%b} {d.day}, {d.year}"


def short(d):
    return f"{d:%b} {d.day}"


def plural(n, word):
    return f"{n} {word}" if n == 1 else f"{n} {word}s"


# 1. Read every row.
with csv_path.open(newline="", encoding="utf-8") as f:
    rows = [{k: (v or "").strip() for k, v in r.items()} for r in csv.DictReader(f)]
rows_read = len(rows)

# 2. Data through = the latest date anywhere in the file (never today's date).
data_through = max(day(r[c]) for r in rows for c in DATE_COLUMNS if r[c])
week_earlier = data_through - timedelta(days=7)

# 3. Count an exact duplicate row once.
seen, unique, duplicate_ids = set(), [], []
for r in rows:
    key = tuple(r.values())
    if key in seen:
        duplicate_ids.append(r["id"])
    else:
        seen.add(key)
        unique.append(r)

# 4. Only rows where kind is Ticket count.
tickets = [r for r in unique if r["kind"] == "Ticket"]
other_kinds = {}
for r in unique:
    if r["kind"] != "Ticket":
        other_kinds[r["kind"]] = other_kinds.get(r["kind"], 0) + 1
not_tickets = sum(other_kinds.values())

# 5. Open now: closed is blank.
open_now = [t for t in tickets if not t["closed"]]

# 6. Open 7 days earlier: opened on or before that day, not closed on or before it.
open_then = [
    t for t in tickets
    if day(t["opened"]) <= week_earlier and (not t["closed"] or day(t["closed"]) > week_earlier)
]
change = len(open_now) - len(open_then)

# 7. Open tickets by stage. A stage outside the list is unmapped, never fixed.
by_stage = {s: 0 for s in OPEN_STAGES}
unmapped = {}
for t in open_now:
    if t["stage"] in by_stage:
        by_stage[t["stage"]] += 1
    else:
        unmapped.setdefault(t["stage"], []).append(t["id"])
unmapped_count = sum(len(ids) for ids in unmapped.values())
bars_total = sum(by_stage.values())
accent = max(OPEN_STAGES, key=lambda s: by_stage[s])  # stage with the most open tickets

# 8. Age = data-through date minus opened. Average is rounded once, at display.
for t in open_now:
    t["age"] = (data_through - day(t["opened"])).days
average_age_exact = sum(t["age"] for t in open_now) / len(open_now) if open_now else 0
average_age = int(average_age_exact + 0.5)

# 9. Ten oldest open tickets, oldest first.
oldest = sorted(open_now, key=lambda t: (day(t["opened"]), t["id"]))[:10]
in_accent = sum(1 for t in oldest if t["stage"] == accent)

# Print every number used anywhere.
print(f"rows read: {rows_read}")
print(f"data through: {data_through.isoformat()} ({nice(data_through)})")
print(f"exact duplicate rows counted once: {len(duplicate_ids)} ({', '.join(duplicate_ids) or 'none'})")
print(f"rows that are not tickets, excluded: {not_tickets} ({', '.join(f'{k} {v}' for k, v in other_kinds.items()) or 'none'})")
print(f"tickets: {len(tickets)}")
print(f"open tickets now: {len(open_now)}")
print(f"open tickets 7 days earlier ({week_earlier.isoformat()}): {len(open_then)}")
print(f"change: {change:+d}")
for s in OPEN_STAGES:
    print(f"open in {s}: {by_stage[s]}")
print(f"open with an unmapped stage: {unmapped_count} ({'; '.join(f'{k}: {', '.join(v)}' for k, v in unmapped.items()) or 'none'})")
print(f"bars plus unmapped: {bars_total} + {unmapped_count} = {bars_total + unmapped_count}")
print(f"stage with the most open tickets: {accent} ({by_stage[accent]})")
print(f"average age of open tickets: {average_age} days (exact {average_age_exact:.4f}, rounded once)")
print("ten oldest open tickets:")
for t in oldest:
    print(f"  {t['id']} | {t['title']} | {t['stage']} | {t['owner']} | opened {t['opened']} | {t['age']} days")
print(f"of those ten, in {accent}: {in_accent}")

# 10. Who to nudge: owners of open tickets in the bottleneck stage, oldest ticket first.
stuck = sorted((t for t in open_now if t["stage"] == accent), key=lambda t: (-t["age"], t["id"]))
nudge = {}
for t in stuck:
    nudge.setdefault(t["owner"], []).append(t)  # owners end up ordered by their oldest ticket
print(f"bottleneck stage (most open tickets): {accent}")
print(f"who to nudge: {len(nudge)} owners, {len(stuck)} tickets in {accent}")
for owner, ts in nudge.items():
    print(f"  {owner}: {len(ts)} in {accent} | " + ", ".join(f"{t['id']} {t['age']} days" for t in ts))

# Titles state the finding, built from the computed numbers.
verdict_lead = " is the bottleneck:"
verdict_rest = f"{by_stage[accent]} of {len(open_now)} open tickets, {in_accent} of the {len(oldest)} oldest."
if change > 0:
    trend = f"{change} more than a week ago"
elif change < 0:
    trend = f"{-change} fewer than a week ago"
else:
    trend = "the same as a week ago"
context_line = (
    f"{plural(len(open_now), 'ticket')} {'is' if len(open_now) == 1 else 'are'} open, {trend} "
    f"({len(open_then)} on {short(week_earlier)}). Average age of open tickets: {average_age} days."
)
nudge_title = f"Who to nudge: {'1 person' if len(nudge) == 1 else f'{len(nudge)} people'} with tickets in {accent}"
bars_title = f"Where the {len(open_now)} open tickets sit"
table_title = (
    f"The {len(oldest)} oldest open tickets: {in_accent} in {accent}, the oldest has waited {oldest[0]['age']} days"
    if oldest else "No open tickets"
)

e = html.escape
longest = max(by_stage.values()) or 1
bars_html = ""
for s in OPEN_STAGES:
    width = by_stage[s] / longest * 100  # bars start at zero
    cls = "bar accent" if s == accent else "bar"
    bars_html += (
        f'<div class="row"><div class="stage">{e(s)}</div>'
        f'<div class="track"><div class="{cls}" style="width:{width:.1f}%"></div>'
        f'<span class="count">{by_stage[s]}</span></div></div>\n'
    )

if unmapped:
    parts = [f"&ldquo;{e(k)}&rdquo; ({e(', '.join(v))})" for k, v in unmapped.items()]
    unmapped_html = (
        f"<b>{unmapped_count} unmapped</b>, not fixed and not in a bar: {'; '.join(parts)}. "
        f"{bars_total} in the bars + {unmapped_count} unmapped = {len(open_now)} open."
    )
else:
    unmapped_html = f"No unmapped stages. The bars add up to {bars_total} open."

nudge_html = ""
for owner, ts in nudge.items():
    chips = "".join(f'<span class="chip">{e(t["id"])} <b>{t["age"]}d</b></span>' for t in ts)
    nudge_html += (
        f'<li><span class="who">{e(owner)}</span>'
        f'<span class="n">{plural(len(ts), "ticket")}</span>'
        f'<span class="chips">{chips}</span></li>\n'
    )

oldest_age = oldest[0]["age"] if oldest else 1
rows_html = ""
for t in oldest:
    hot = " hot" if t["stage"] == accent else ""
    width = t["age"] / oldest_age * 100  # age bars start at zero
    rows_html += (
        f'<tr><td class="id">{e(t["id"])}</td>'
        f'<td class="title"><span title="{e(t["title"])}">{e(t["title"])}</span></td>'
        f'<td class="st"><span class="pill{hot}">{e(t["stage"])}</span></td>'
        f'<td class="owner">{e(t["owner"])}</td>'
        f'<td class="opened">{short(day(t["opened"]))}</td>'
        f'<td class="age"><span class="days">{t["age"]} days</span>'
        f'<span class="agebar"><span class="fill{hot}" style="width:{width:.1f}%"></span></span></td></tr>\n'
    )

dup_text = f"{plural(len(duplicate_ids), 'exact duplicate row')} ({', '.join(duplicate_ids)}) counted once" if duplicate_ids else "no duplicate rows"
kind_text = (
    f"{plural(not_tickets, 'row')} with another kind ({', '.join(f'{k}: {v}' for k, v in other_kinds.items())}) left out"
    if not_tickets else "no rows of another kind"
)
unmapped_text = (
    "; ".join(f'"{k}" on {", ".join(v)}' for k, v in unmapped.items())
    + " is counted as open and reported as unmapped. It was not changed to another stage and is not in any bar."
    if unmapped else "No stage was unmapped."
)

definitions = [
    ("Rows", f"{rows_read}", "Data rows read from the file, not counting the header.", "all columns"),
    ("Data through", nice(data_through), "The latest date anywhere in the file. Today's date is never used.", "opened, stage_entered, closed"),
    ("Ticket", f"{len(tickets)}", f"A row where kind is Ticket, with {dup_text} and {kind_text}.", "kind, and every column for the duplicate check"),
    ("Open tickets now", f"{len(open_now)}", "Tickets where closed is blank.", "kind, closed"),
    ("Open tickets 7 days earlier", f"{len(open_then)}", f"Tickets opened on or before {nice(week_earlier)} and not closed on or before that day.", "kind, opened, closed"),
    ("Open tickets by stage", ", ".join(f"{s} {by_stage[s]}" for s in OPEN_STAGES), f"Open tickets grouped by stage, in process order. {unmapped_text}", "kind, closed, stage"),
    ("Bottleneck", f"{accent}, with {by_stage[accent]} open tickets", "The stage with the most open tickets. It is a count, not a judgment about the people in that stage.", "kind, closed, stage"),
    ("Who to nudge", f"{plural(len(nudge), 'owner')}, {plural(len(stuck), 'ticket')}", f"Every owner of an open ticket in {accent}, with each of those tickets and its age. Owners are ordered by their oldest ticket.", "kind, closed, stage, owner, opened"),
    ("Average age of open tickets", f"{average_age} days", f"Data-through date minus opened, averaged over open tickets. Exact value {average_age_exact:.4f}, rounded once, at display.", "kind, closed, opened"),
    ("Ten oldest open tickets", f"{oldest[0]['id']} is the oldest, opened {nice(day(oldest[0]['opened']))}" if oldest else "none", "Open tickets sorted by opened, oldest first. Age is the data-through date minus opened, in days. The small bar next to each age starts at zero and is as long as the age.", "kind, closed, opened"),
]
defs_html = "".join(
    f"<div><dt>{e(n)}: {e(v)}</dt><dd>{e(d)} <span class=\"cols\">Columns: {e(c)}.</span></dd></div>\n"
    for n, v, d, c in definitions
)

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Where are tickets stuck? Data through {nice(data_through)}</title>
<style>
  :root {{ --ink:#1b1f24; --soft:#59616b; --line:#e3e6ea; --gray:#b3bac3; --wash:#f3f4f6; --accent:#b4530a; --accent-wash:#fbeadb; --accent-ink:#8a3d06; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:#fff; color:var(--ink); font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; font-variant-numeric:tabular-nums; -webkit-text-size-adjust:100%; }}
  ::selection {{ background:var(--accent-wash); }}
  main {{ max-width:1120px; margin:0 auto; padding:22px 32px 40px; }}
  header {{ display:flex; flex-wrap:wrap; justify-content:space-between; gap:2px 24px; color:var(--soft); font-size:14px; }}
  header p {{ margin:0; }}
  h1 {{ font-size:46px; line-height:1.1; letter-spacing:-0.02em; font-weight:700; margin:18px 0 10px; }}
  h1 em {{ font-style:normal; color:var(--accent); }}
  h1 span {{ display:inline-block; }}
  .context {{ font-size:18px; color:var(--soft); margin:0; }}
  .cols2 {{ display:grid; grid-template-columns:minmax(0,8fr) minmax(0,5fr); gap:24px 48px; margin-top:30px; }}
  h2 {{ font-size:15px; line-height:1.3; font-weight:650; margin:0 0 10px; }}
  ul.nudge {{ list-style:none; margin:0; padding:0; border-top:1px solid var(--ink); }}
  .nudge li {{ display:grid; grid-template-columns:140px 64px 1fr; align-items:center; gap:4px 12px; padding:7px 0; border-bottom:1px solid var(--line); }}
  .who {{ font-weight:650; font-size:17px; }}
  .n {{ color:var(--soft); font-size:14px; }}
  .chips {{ display:flex; flex-wrap:wrap; gap:5px; }}
  .chip {{ background:var(--accent-wash); color:var(--accent-ink); border-radius:999px; padding:1px 9px; font-size:13.5px; white-space:nowrap; }}
  .row {{ display:grid; grid-template-columns:66px 1fr; align-items:center; gap:10px; margin:6px 0; }}
  .stage {{ font-size:15px; }}
  .track {{ display:flex; align-items:center; gap:8px; }}
  .bar {{ height:24px; background:var(--gray); border-radius:2px; min-width:2px; }}
  .bar.accent, .fill.hot {{ background:var(--accent); }}
  .count {{ font-weight:650; }}
  .unmapped {{ font-size:13.5px; color:var(--soft); margin:10px 0 0; }}
  .unmapped b {{ color:var(--ink); }}
  .oldest {{ margin-top:30px; }}
  table {{ width:100%; border-collapse:collapse; font-size:15px; border-top:1px solid var(--ink); }}
  th {{ text-align:left; font-weight:400; font-size:12.5px; color:var(--soft); padding:5px 16px 4px 0; border-bottom:1px solid var(--line); white-space:nowrap; }}
  td {{ border-bottom:1px solid var(--line); padding:5px 16px 5px 0; white-space:nowrap; vertical-align:middle; }}
  td.id {{ color:var(--soft); width:1%; }}
  td.title {{ width:99%; max-width:0; }}
  td.title span {{ display:block; overflow:hidden; text-overflow:ellipsis; }}
  td.opened {{ color:var(--soft); }}
  td.age {{ padding-right:0; }}
  .pill {{ display:inline-block; min-width:68px; text-align:center; background:var(--wash); color:var(--soft); border-radius:999px; padding:1px 10px; font-size:13px; }}
  .pill.hot {{ background:var(--accent-wash); color:var(--accent-ink); font-weight:650; }}
  .days {{ display:inline-block; width:62px; text-align:right; font-weight:650; }}
  .agebar {{ display:inline-block; width:200px; height:10px; margin-left:10px; vertical-align:middle; }}
  .fill {{ display:block; height:100%; background:var(--gray); border-radius:2px; min-width:2px; }}
  details {{ margin-top:26px; border-top:1px solid var(--line); padding-top:12px; }}
  summary {{ cursor:pointer; color:var(--soft); font-size:14px; width:fit-content; }}
  summary:focus-visible {{ outline:2px solid var(--accent); outline-offset:3px; }}
  dl {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(330px,1fr)); gap:12px 36px; margin:14px 0 0; font-size:14px; }}
  dt {{ font-weight:650; }}
  dd {{ margin:0; color:var(--soft); }}
  .cols {{ display:block; color:var(--ink); }}
  @media (max-width:860px) {{
    h1 {{ font-size:34px; }}
    .cols2 {{ grid-template-columns:1fr; }}
  }}
  @media (max-width:560px) {{
    main {{ padding:14px 16px 32px; }}
    h1 {{ font-size:27px; margin-top:14px; }}
    .context {{ font-size:16px; }}
    .cols2, .oldest {{ margin-top:24px; }}
    .nudge li {{ grid-template-columns:1fr auto; }}
    .chips {{ grid-column:1 / 3; }}
    table, tbody {{ display:block; }}
    thead {{ display:none; }}
    tr {{ display:grid; grid-template-columns:auto 1fr auto; gap:2px 10px; align-items:center; border-bottom:1px solid var(--line); padding:8px 0; }}
    td {{ border:0; padding:0; }}
    td.id {{ width:auto; }}
    td.title {{ grid-column:1 / 4; grid-row:2; width:auto; max-width:none; white-space:normal; }}
    td.st {{ grid-column:3; grid-row:1; }}
    td.owner {{ grid-column:2; grid-row:1; color:var(--soft); font-size:14px; }}
    td.opened {{ grid-column:3; grid-row:3; font-size:13px; text-align:right; }}
    td.opened::before {{ content:"since "; }}
    td.age {{ grid-column:1 / 3; grid-row:3; display:flex; align-items:center; }}
    .days {{ width:auto; min-width:58px; text-align:left; }}
    .agebar {{ flex:1; width:auto; }}
    dl {{ grid-template-columns:1fr; }}
  }}
</style>
</head>
<body>
<main>
<header>
  <p>Weekly ticket check: where are tickets stuck?</p>
  <p>Data through {nice(data_through)} &middot; {rows_read} rows</p>
</header>

<h1><em>{e(accent)}</em>{e(verdict_lead)} <span>{e(verdict_rest)}</span></h1>
<p class="context">{e(context_line)}</p>

<div class="cols2">
  <section aria-label="Who to nudge">
    <h2>{e(nudge_title)}</h2>
    <ul class="nudge">
    {nudge_html}
    </ul>
  </section>
  <section aria-label="Open tickets by stage">
    <h2>{e(bars_title)}</h2>
    {bars_html}
    <p class="unmapped">{unmapped_html}</p>
  </section>
</div>

<section class="oldest" aria-label="Ten oldest open tickets">
  <h2>{e(table_title)}</h2>
  <table>
    <thead><tr><th>ID</th><th>Ticket</th><th>Stage</th><th>Owner</th><th>Opened</th><th>Age, days since opened</th></tr></thead>
    <tbody>
    {rows_html}
    </tbody>
  </table>
</section>

<details>
  <summary>Definitions and how rows were counted</summary>
  <dl>
  {defs_html}
  </dl>
</details>
</main>
</body>
</html>
"""
html_path.parent.mkdir(parents=True, exist_ok=True)
html_path.write_text(page, encoding="utf-8")

# The same definitions as a Markdown file, next to the page.
md = ["# Definitions", "", f"Data through {nice(data_through)} · {rows_read} rows. Written by build.py from {csv_path.name}.", ""]
for n, v, d, c in definitions:
    md.append(f"- **{n}: {v}.** {d} Columns: {c}.")
(html_path.parent / "definitions.md").write_text("\n".join(md) + "\n", encoding="utf-8")
print(f"wrote {html_path} and {html_path.parent / 'definitions.md'}")
