// Checks a brain made by Prompt A (and optionally Prompts B and C).
// Usage: bun demos/agent-memory/check.ts [brainDir] [--capture] [--answer file.md]
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const here = import.meta.dirname;
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const answerAt = args.indexOf("--answer");
const answerFile = answerAt >= 0 ? args[answerAt + 1] : "";
const brain = args.find((a, i) => !a.startsWith("--") && (answerAt < 0 || i !== answerAt + 1)) ?? join(here, "brain");

const expected = [
  "events/actual-productivity-with-ai-2026-11-19.md",
  "orgs/gdg-tulsa.md",
  "orgs/women-plus-in-tech-tulsa.md",
  "orgs/techlahoma.md",
  "orgs/gitwit.md",
  "work/my-team.md",
  "work/weekly-open-orders-report.md",
];
const realPeople = ["Sam Carlton", "Zain Khan", "Tran Trinh", "Jess Trippiedi", "Valerie Feral", "Lauren Tan"];

let failed = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "✅" : "❌"} ${label}${!ok && detail ? `\n     ${detail}` : ""}`);
};
const read = (p: string) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : [];
      })
    : [];

const pack =
  read(join(here, "sources/public-facts.md")) +
  read(join(here, "sources/jessica-notes.md")) +
  read(join(here, "starter/notes/brainmaxxing.md"));
const words = (s: string) => s.toLowerCase().match(/[a-z0-9+]+(?:[’'][a-z]+)?/g) ?? [];
const packWords = new Set(words(pack));
const packUrls = new Set(pack.match(/https?:\/\/[^\s)>\]]+/g) ?? []);
// Words the note format adds that are not in the source pack.
const allowed = new Set(words("source sources sample related notes note"));

check(existsSync(join(brain, "AGENTS.md")), "brain/AGENTS.md exists");
const index = read(join(brain, "index.md"));
check(index.length > 0, "brain/index.md exists");
for (const note of expected) check(existsSync(join(brain, note)), `note exists: ${note}`);

const notes = walk(brain).filter((p) => !["AGENTS.md", "index.md"].includes(relative(brain, p)));
check(notes.length >= 6 && notes.length <= 10, `brain has 6 to 10 notes (found ${notes.length})`);

for (const path of notes) {
  const rel = relative(brain, path);
  const text = read(path);
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  const body = fm ? text.slice(fm[0].length) : text;
  check(!!fm && /^title:/m.test(fm[1]) && /^updated:/m.test(fm[1]) && /^source:\s*(\S|\n\s+-\s*\S)/m.test(fm[1]), `${rel}: has title, source and updated at the top`);
  const bullets = body.split("\n").filter((l) => /^\s*[-*] /.test(l) && !/^\s*[-*] \**Related/i.test(l));
  check(bullets.length > 0, `${rel}: has fact lines`);
  const uncited = bullets.filter((l) => !/\]\(https?:\/\/|\(source:/i.test(l));
  check(uncited.length === 0, `${rel}: every fact line ends with a source`, uncited.join(" | "));
  const urls = text.match(/https?:\/\/[^\s)>\]]+/g) ?? [];
  const strange = urls.filter((u) => !packUrls.has(u));
  check(strange.length === 0, `${rel}: every link comes from the source pack`, strange.join(" "));
  if (rel.startsWith("work/")) check(/^sample:\s*true/m.test(fm?.[1] ?? ""), `${rel}: marked sample: true`);
  check(index.includes(`(${rel})`), `${rel}: linked from index.md`);
  // No invented facts: the words of each fact line should come from the source pack.
  const summaries = body.split("\n").filter((l) => l.trim() && !/^\s*[-*#]/.test(l));
  for (const line of [...bullets, ...summaries]) {
    if (/said by the user/i.test(line)) continue; // a captured memory comes from the user, not the source pack
    const clean = line.replace(/\]\([^)]*\)/g, "]").replace(/\(source:[^)]*\)/gi, "");
    const ws = words(clean).filter((w) => w.length > 3 || /\d/.test(w));
    const unknown = ws.filter((w) => !packWords.has(w) && !allowed.has(w));
    const numbers = unknown.filter((w) => /\d/.test(w));
    const aboutRealPerson = realPeople.some((n) => line.includes(n));
    // A one-sentence summary may be reworded; a fact line may not.
    const loose = summaries.includes(line) ? Math.max(4, Math.floor(ws.length * 0.4)) : Math.max(2, Math.floor(ws.length * 0.2));
    const limit = aboutRealPerson ? 0 : loose;
    check(numbers.length === 0 && unknown.length <= limit, `${rel}: no invented ${aboutRealPerson ? "words about a real person" : "facts"} in "${clean.trim().slice(0, 50)}..."`, `not in the source pack: ${unknown.join(", ")}`);
  }
}

for (const link of index.match(/\]\(([^)]+\.md)\)/g) ?? []) {
  const target = link.slice(2, -1);
  check(existsSync(join(dirname(join(brain, "index.md")), target)), `index link resolves: ${target}`);
}

if (flag("--capture")) {
  const report = read(join(brain, "work/weekly-open-orders-report.md"));
  check(/thursday/i.test(report) && /noon/i.test(report), "capture: the weekly report note says Thursday at noon");
  check(/said by the user/i.test(report) && report.includes("2026-11-19"), "capture: the new fact cites 'said by the user' and the date");
  check(notes.length === 8, `capture: updated the existing note, no duplicate (8 notes, found ${notes.length})`);
}

if (answerFile) {
  const answer = read(answerFile);
  check(/Priya/.test(answer), "recall: answer names Priya Nambiar");
  check(/Women\+ in Tech/i.test(answer), "recall: answer names Women+ in Tech of Tulsa");
  check(answer.includes("work/my-team.md"), "recall: cites work/my-team.md");
  check(answer.includes("orgs/women-plus-in-tech-tulsa.md"), "recall: cites orgs/women-plus-in-tech-tulsa.md");
}

console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
