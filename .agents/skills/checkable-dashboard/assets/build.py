#!/usr/bin/env python3
"""checkable-dashboard helper. No dependencies.

  python3 build.py data.csv                      -> print a profile of the data
  python3 build.py data.csv config.json out.html -> write the dashboard page

The page computes every number from the embedded rows; this script only copies text in.
"""
import csv, io, json, re, sys
from collections import Counter
from pathlib import Path

def profile(text):
    rows = list(csv.DictReader(io.StringIO(text)))
    cols = list(rows[0].keys()) if rows else []
    print(f"rows read: {len(rows)} (header not counted)")
    print("columns: " + ", ".join(cols))
    for c in cols:
        vals = [(r.get(c) or "").strip() for r in rows]
        blanks = sum(v == "" for v in vals)
        filled = [v for v in vals if v]
        distinct = Counter(filled)
        line = f"- {c}: {blanks} blank"
        if filled and all(re.match(r"\d{4}-\d{2}-\d{2}", v) for v in filled):
            line += f", dates {min(filled)} to {max(filled)}"
        elif len(distinct) <= 12:
            line += ", values " + ", ".join(f"{k} ({n})" for k, n in distinct.most_common())
        else:
            line += f", {len(distinct)} distinct"
            if c == cols[0]:
                rep = [k for k, n in distinct.items() if n > 1]
                line += ", repeated: " + (", ".join(rep) if rep else "none")
        print(line)
    print("Look for: rows that are not real records, misspelled category values, repeated IDs.")

def main(a):
    if len(a) not in (1, 3):
        sys.exit(__doc__)
    text = Path(a[0]).read_text(encoding="utf-8-sig")
    if len(a) == 1:
        return profile(text)
    cfg = json.loads(Path(a[1]).read_text(encoding="utf-8"))
    page = (Path(__file__).parent / "dashboard-template.html").read_text(encoding="utf-8")
    safe = lambda s: s.replace("</", "<\\/")
    page = page.replace('id="config">{}</script>', 'id="config">' + safe(json.dumps(cfg, indent=1)) + "</script>", 1)
    page = page.replace('id="data"></script>', 'id="data">' + text.replace("</script", "<\\/script") + "</script>", 1)
    Path(a[2]).write_text(page, encoding="utf-8")
    print(f"wrote {a[2]}: {len(text.splitlines()) - 1} data rows embedded. Numbers are computed in the page.")

main(sys.argv[1:])
