// First-pass checker for one run of Prompt A. No packages. It changes nothing in the run.
//
//   bun demos/dashboard/check.ts                    checks demos/dashboard/output
//   bun demos/dashboard/check.ts expected           checks the reference output
//   bun demos/dashboard/check.ts /tmp/run/output    checks a run made somewhere else
//
// It recomputes every answer from sample/tickets.csv with its own code, looks for
// those answers in the output files, then runs the run's build script on a copy of
// the data with one ticket added to see whether the numbers move.
//
// A pass here is not a pass. Finish with the human read in TEST.md.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

const here = import.meta.dir;
const arg = process.argv[2] ?? "output";
const outDir = isAbsolute(arg) ? arg : existsSync(resolve(arg)) ? resolve(arg) : join(here, arg);
const samplePath = join(here, "sample", "tickets.csv");
const PLUS_ONE = "T-1056,Ticket,Confirm the tree lot delivery date,2026-11-19,Review,2026-11-19,Marcus Bell,";
const STAGES = ["Queue", "Build", "Review", "Blocked"];

// ---------- Independent recompute ----------

type Row = { id: string; kind: string; title: string; opened: string; stage: string; owner: string; closed: string; line: string };

function parse(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  return lines.slice(1).map((line) => {
    const c = line.split(","); // the sample has no quoted commas
    return { id: c[0], kind: c[1], title: c[2], opened: c[3], stage: c[4], owner: c[6], closed: c[7] ?? "", line };
  });
}
const days = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86400000;
const isoOf = (d: number) => new Date(d * 86400000).toISOString().slice(0, 10);

function compute(text: string, opts = { keepNotes: false, keepDuplicates: false }) {
  const all = parse(text);
  const dates = all.flatMap((r) => r.line.split(",").filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c)));
  const through = Math.max(...dates.map(days));
  const weekEarlier = through - 7;
  const seen = new Set<string>();
  const unique = all.filter((r) => (opts.keepDuplicates || !seen.has(r.line)) && seen.add(r.line));
  const tickets = unique.filter((r) => opts.keepNotes || r.kind === "Ticket");
  const open = tickets.filter((r) => r.closed === "");
  const openThen = tickets.filter((r) => days(r.opened) <= weekEarlier && (r.closed === "" || days(r.closed) > weekEarlier));
  const byStage = Object.fromEntries(STAGES.map((s) => [s, open.filter((r) => r.stage === s).length]));
  const unmapped = open.filter((r) => !STAGES.includes(r.stage));
  const ages = open.map((r) => through - days(r.opened));
  const exactAverage = ages.reduce((a, b) => a + b, 0) / ages.length;
  const oldest = [...open].sort((a, b) => days(a.opened) - days(b.opened) || a.id.localeCompare(b.id));
  const bottleneck = STAGES.reduce((a, b) => (byStage[b] > byStage[a] ? b : a));
  const stuck = open.filter((r) => r.stage === bottleneck);
  return {
    bottleneck, stuck, nudgeOwners: [...new Set(stuck.map((r) => r.owner))],
    bottleneckInTen: oldest.slice(0, 10).filter((r) => r.stage === bottleneck).length,
    rows: all.length, tickets: tickets.length, through: isoOf(through), weekEarlier: isoOf(weekEarlier),
    open: open.length, openThen: openThen.length, byStage, unmapped, exactAverage,
    average: Math.round(exactAverage), averageRoundedTwice: Math.round(Math.round(exactAverage * 10) / 10),
    tenOldest: oldest.slice(0, 10), eleventh: oldest[10], oldestAge: through - days(oldest[0].opened),
    notes: unique.filter((r) => r.kind !== "Ticket"),
    duplicates: all.filter((r, i) => all.findIndex((o) => o.line === r.line) !== i),
  };
}

const sampleText = readFileSync(samplePath, "utf8");
const key = compute(sampleText);
const plus = compute(`${sampleText.trimEnd()}\n${PLUS_ONE}\n`);
const withNotes = compute(sampleText, { keepNotes: true, keepDuplicates: false });
const withDuplicates = compute(sampleText, { keepNotes: false, keepDuplicates: true });

const stageLine = (k: typeof key) => STAGES.map((s) => `${s} ${k.byStage[s]}`).join(", ");
console.log("Recomputed from sample/tickets.csv:");
console.log(`  rows ${key.rows} | tickets ${key.tickets} | data through ${key.through}`);
console.log(`  open now ${key.open} | open 7 days earlier (${key.weekEarlier}) ${key.openThen}`);
console.log(`  ${stageLine(key)} | unmapped ${key.unmapped.length} (${key.unmapped.map((r) => `${r.stage} ${r.id}`).join(", ")})`);
console.log(`  average age ${key.average} days (exact ${key.exactAverage.toFixed(4)}) | oldest open ${key.tenOldest[0].id}, ${key.tenOldest[0].opened}, ${key.oldestAge} days`);
console.log(`  ten oldest: ${key.tenOldest.map((r) => r.id).join(" ")}`);
console.log(`  bottleneck ${key.bottleneck} (${key.bottleneckInTen} of the ten oldest) | who to nudge: ${key.nudgeOwners.join(", ")} | ${key.stuck.map((r) => r.id).join(" ")}`);
console.log("Wrong answers the traps produce:");
console.log(`  notes counted: open ${withNotes.open}, ${stageLine(withNotes)}, oldest ${withNotes.tenOldest[0].id}`);
console.log(`  duplicate counted twice: open 7 days earlier ${withDuplicates.openThen}, tickets ${withDuplicates.tickets}`);
console.log(`  rounded twice: average age ${key.averageRoundedTwice} days`);
console.log("After adding one Review ticket (T-1056):");
console.log(`  rows ${plus.rows} | open now ${plus.open} | 7 days earlier ${plus.openThen} | ${stageLine(plus)} | average age ${plus.average} (exact ${plus.exactAverage.toFixed(4)})\n`);

// ---------- Checks ----------

let failed = 0;
function check(label: string, ok: boolean, hint = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${!ok && hint ? `\n      ${hint}` : ""}`);
  if (!ok) failed++;
}
const read = (name: string) => (existsSync(join(outDir, name)) ? readFileSync(join(outDir, name), "utf8") : "");
const strip = (h: string) =>
  h.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&middot;/g, "·").replace(/&nbsp;/g, " ").replace(/&[lr]dquo;|&quot;/g, '"').replace(/\s+/g, " ");
const has = (text: string, n: number) => new RegExp(`(?<![\\d.,-])${n}(?![\\d]|\\.\\d)`).test(text);
const datePattern = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const month = d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return new RegExp(`${iso}|${month.slice(0, 3)}[a-z]*\\.? ${d.getUTCDate()}(,? ${d.getUTCFullYear()})?`);
};
const stageCount = (text: string, stage: string, n: number) => new RegExp(`\\b${stage}\\b\\D{0,60}?(?<!\\d)${n}(?!\\d)`).test(text);

function checkDashboard(label: string, htmlText: string, k: typeof key) {
  const text = strip(htmlText);
  // The table of the ten oldest: of all tables on the page, the one holding the most of those ten ids.
  const tables = (htmlText.match(/<table[\s\S]*?<\/table>/gi) ?? [htmlText]).map(strip);
  const hits = (t: string) => k.tenOldest.filter((r) => t.includes(r.id)).length;
  const table = tables.reduce((best, t) => (hits(t) > hits(best) ? t : best), tables[0]);
  check(`${label}: "Data through" with ${k.through} and ${k.rows} rows`,
    /data through/i.test(text) && datePattern(k.through).test(text) && new RegExp(`(?<!\\d)${k.rows} (data )?rows`).test(text));
  check(`${label}: the verdict names ${k.bottleneck} as the bottleneck, with ${k.byStage[k.bottleneck]} of ${k.open} open and ${k.bottleneckInTen} of the ten oldest`,
    new RegExp(`${k.bottleneck}[^.]{0,40}bottleneck[^.]{0,20}?(?<!\\d)${k.byStage[k.bottleneck]} of (the )?${k.open}\\b[^.]{0,40}?(?<!\\d)${k.bottleneckInTen} of the (10|ten) oldest`, "i").test(text));
  const outside = strip(htmlText.replace(/<table[\s\S]*?<\/table>/gi, " ").replace(/<details[\s\S]*?<\/details>/gi, " "));
  check(`${label}: "who to nudge" lists all ${k.stuck.length} ${k.bottleneck} tickets and their ${k.nudgeOwners.length} owners, outside the table`,
    /nudge/i.test(outside) && k.stuck.every((r) => outside.includes(r.id)) && k.nudgeOwners.every((o) => outside.includes(o)),
    `Missing: ${[...k.stuck.filter((r) => !outside.includes(r.id)).map((r) => r.id), ...k.nudgeOwners.filter((o) => !outside.includes(o))].join(" ")}`);
  check(`${label}: open tickets now is ${k.open}`, has(text, k.open),
    has(text, withNotes.open) ? `Found ${withNotes.open}: the Note rows were counted as tickets.` : "");
  check(`${label}: open tickets 7 days earlier is ${k.openThen}`, has(text, k.openThen),
    has(text, withDuplicates.openThen) ? `Found ${withDuplicates.openThen}: the duplicate row may have been counted twice.` : "");
  for (const s of STAGES) check(`${label}: ${s} bar is ${k.byStage[s]}`, stageCount(text, s, k.byStage[s]));
  check(`${label}: unmapped stage "Reveiw" is reported, not fixed`, /Reveiw/.test(text) && /unmapped/i.test(text));
  const twice = k.averageRoundedTwice !== k.average;
  check(`${label}: average age of open tickets is ${k.average} days${twice ? `, not ${k.averageRoundedTwice}` : ""}`,
    new RegExp(`average[^.]{0,80}?(?<![\\d.])${k.average}(?!\\d)`, "i").test(text) &&
      !(twice && new RegExp(`average age[^.]{0,60}?(?<![\\d.])${k.averageRoundedTwice} days`, "i").test(text)));
  check(`${label}: table has the ten oldest open tickets (${k.tenOldest[0].id} to ${k.tenOldest[9].id})`,
    k.tenOldest.every((r) => table.includes(r.id)),
    `Missing: ${k.tenOldest.filter((r) => !table.includes(r.id)).map((r) => r.id).join(" ")}`);
  check(`${label}: table has no Note rows and stops at ten`,
    k.notes.every((r) => !table.includes(r.id)) && !table.includes(k.eleventh.id));
  check(`${label}: oldest open ticket is ${k.tenOldest[0].id}, ${k.oldestAge} days`, table.includes(k.tenOldest[0].id) && has(table, k.oldestAge));
}

const dash = read("dashboard.html");
const profile = read("profile.md");
const brief = read("brief.md");
const definitions = read("definitions.md");
const report = read("weekly-report.md");
const scriptName = ["build.py", "build.js", "build.mjs", "build.ts"].find((n) => existsSync(join(outDir, n)));

console.log(`Checking ${outDir}\n`);
check("output has profile.md, brief.md, dashboard.html, definitions.md, weekly-report.md",
  [profile, brief, dash, definitions, report].every((t) => t.length > 0));
check("output has the build script (build.py or build.js)", scriptName !== undefined);

check("profile.md: 56 rows, Note 3, the stage Reveiw, the duplicate T-1033, 25 blanks in closed",
  has(profile, key.rows) && /Note/.test(profile) && /Reveiw/.test(profile) && /T-1033/.test(profile) && has(profile, 25));

check("dashboard.html loads nothing from the network and has no script or canvas",
  dash.length > 0 && !/(src|href)\s*=\s*["']?(https?:)?\/\//i.test(dash) && !/<link\b|<script\b|<canvas\b|<img\b|@import|url\(\s*["']?http/i.test(dash));
check('dashboard.html has a "Definitions" section', /definitions/i.test(strip(dash)));
check("dashboard.html keeps the definitions in a closed <details>, out of the way",
  /<details(?![^>]*\bopen\b)[^>]*>[\s\S]*?definitions[\s\S]*?<\/details>/i.test(dash));
checkDashboard("dashboard.html", dash, key);

check('definitions.md says the average is rounded once', /round(ed|ing)?\s+(only\s+)?once/i.test(definitions));
check("definitions.md says how Note rows, the duplicate, and Reveiw were handled",
  /Note/.test(definitions) && /duplicate/i.test(definitions) && /Reveiw/.test(definitions) && /unmapped/i.test(definitions));
check("definitions.md defines 7 days earlier with a date and names its columns",
  datePattern(key.weekEarlier).test(definitions) && /opened/.test(definitions) && /closed/.test(definitions) && /kind/.test(definitions));

const bullets = report.split(/\r?\n/).filter((l) => /^\s*([-*]|\d+[.)])\s+/.test(l));
check(`weekly-report.md has 5 to 8 bullets, each starting with a bold finding (found ${bullets.length})`,
  bullets.length >= 5 && bullets.length <= 8 && bullets.every((l) => /^\s*([-*]|\d+[.)])\s+\*\*/.test(l)));
check(`weekly-report.md uses ${key.open} open, ${key.openThen} a week earlier, and Review ${key.byStage.Review}`,
  has(report, key.open) && has(report, key.openThen) && stageCount(report, "Review", key.byStage.Review));

// ---------- Typed or computed: run the run's own script ----------

function runScript(csvText: string): { html: string; printout: string; error: string } {
  if (!scriptName) return { html: "", printout: "", error: "no build script" };
  const work = mkdtempSync(join(tmpdir(), "dashboard-check-"));
  mkdirSync(join(work, "sample"));
  mkdirSync(join(work, "output"));
  writeFileSync(join(work, "sample", "tickets.csv"), csvText);
  copyFileSync(join(outDir, scriptName), join(work, "output", scriptName));
  const runner = scriptName.endsWith(".py") ? "python3" : scriptName.endsWith(".ts") ? "bun" : "node";
  const r = spawnSync(runner, [join("output", scriptName), join("sample", "tickets.csv"), join("output", "dashboard.html")],
    { cwd: work, encoding: "utf8", timeout: 60000 });
  const htmlPath = join(work, "output", "dashboard.html");
  return {
    html: existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "",
    printout: r.stdout ?? "",
    error: r.status === 0 ? "" : (r.stderr || r.error?.message || `exit ${r.status}`).trim().split("\n").slice(-2).join(" "),
  };
}

const again = runScript(sampleText);
check(`${scriptName ?? "build script"} runs on the sample and writes the page`, again.error === "" && again.html.length > 0, again.error);
if (again.html) {
  // Whole-number parts only, so 13.45 in the report matches 13.4545 in the printout. Ticket ids are skipped.
  const wholeNumbers = (s: string) => (s.match(/\d+(\.\d+)?/g) ?? []).map((n) => Math.trunc(Number(n)));
  const printed = new Set(wholeNumbers(again.printout));
  const strays = [...new Set(wholeNumbers(report.replace(/\bT-\d+/g, " ")))].filter((n) => !printed.has(n) && ![7, 10].includes(n));
  check("every number in weekly-report.md appears in the script's printout", strays.length === 0,
    `Not in the printout: ${strays.join(", ")}. Read those sentences by hand.`);
}

const moved = runScript(`${sampleText.trimEnd()}\n${PLUS_ONE}\n`);
check("the script runs on the data with one ticket added", moved.error === "" && moved.html.length > 0, moved.error);
if (moved.html) checkDashboard("plus one", moved.html, plus);

const runSample = join(outDir, "..", "sample", "tickets.csv");
if (existsSync(runSample)) check("sample/tickets.csv next to the output was not changed", readFileSync(runSample, "utf8") === sampleText);

console.log(failed === 0
  ? "\nAll automated checks passed. That is not a pass yet: do the human read in TEST.md with the numbers you wrote down."
  : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
