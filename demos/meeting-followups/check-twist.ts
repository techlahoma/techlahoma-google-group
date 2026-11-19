// Checks the "agents and people" table from the brain twist prompt (Prompt C).
// No packages. Run from anywhere:
//   bun demos/meeting-followups/check-twist.ts                       (checks output/demo-meeting/agents-and-people.md)
//   bun demos/meeting-followups/check-twist.ts expected/demo-meeting/agents-and-people.md
//   bun demos/meeting-followups/check-twist.ts <table.md> <transcript file> <roster file>   (your own meeting)
// Paths are relative to this folder unless they start with "/".
import {existsSync, readFileSync} from 'node:fs';
import {isAbsolute, join} from 'node:path';

const here = import.meta.dir;
const at = (p: string): string => (isAbsolute(p) ? p : join(here, p));
const tablePath = at(process.argv[2] ?? 'output/demo-meeting/agents-and-people.md');
const transcriptPath = at(process.argv[3] ?? 'demo-meeting/transcript.md');
const rosterPath = at(process.argv[4] ?? 'demo-meeting/roster.md');
const isSample = !process.argv[3];

let failed = 0;
function check(ok: boolean, label: string, detail = ''): void {
  if (!ok) failed += 1;
  console.log(`${ok ? '✅' : '❌'} ${label}${!ok && detail ? `\n     ${detail}` : ''}`);
}
// Lowercase, straighten quotes, and reduce everything else to single spaces,
// so a quote still matches when only punctuation or spacing differs.
function plain(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9'+]+/g, ' ')
    .trim();
}

for (const p of [tablePath, transcriptPath, rosterPath]) {
  if (!existsSync(p)) {
    console.log(`❌ Missing file: ${p}`);
    process.exit(1);
  }
}
const table = readFileSync(tablePath, 'utf8').replace(/[“”]/g, '"').replace(/\\"/g, '"');
const transcript = plain(readFileSync(transcriptPath, 'utf8'));

// Roster lines look like "- Full Name: fact. fact."
const roster = new Map<string, string>();
for (const line of readFileSync(rosterPath, 'utf8').split('\n')) {
  const m = line.match(/^- ([^:|]+): (.+)$/);
  if (m) roster.set(m[1].trim(), plain(m[2]));
}
check(roster.size > 0, `Roster has people (${roster.size})`);

type Row = {n: string; task: string; owner: string; why: string; first: string};
const rows: Row[] = [];
for (const line of table.split('\n')) {
  const cells = line.split('|').map((c) => c.trim());
  if (cells.length < 7 || !/^\d+$/.test(cells[1])) continue;
  rows.push({n: cells[1], task: cells[2], owner: cells[3].replace(/\*/g, ''), why: cells[4], first: cells[5]});
}
check(/\|\s*Task\s*\|\s*Suggested owner\s*\|\s*Why\s*\|\s*First step\s*\|/i.test(table), 'Table has the columns # | Task | Suggested owner | Why | First step');
check(rows.length >= 3, `Table has task rows (${rows.length})`);

const bad = {owner: [] as string[], quote: [] as string[], fact: [] as string[], needs: [] as string[], none: [] as string[], first: [] as string[]};
for (const r of rows) {
  const quote = r.why.match(/"([^"]+)"/)?.[1] ?? '';
  if (plain(quote).split(' ').length < 3 || !transcript.includes(plain(quote))) bad.quote.push(`row ${r.n}: "${quote}"`);
  if (!r.first) bad.first.push(`row ${r.n}`);
  if (r.owner === 'Agent') {
    if (!/Needs:\s*\S/.test(r.why)) bad.needs.push(`row ${r.n}`);
  } else if (r.owner.toLowerCase() === 'unassigned') {
    if (!/No roster fact fits/i.test(r.why)) bad.none.push(`row ${r.n}`);
  } else if (/\(volunteered\)$/.test(r.owner)) {
    const name = r.owner.replace(/\s*\(volunteered\)$/, '');
    if (name !== 'Someone in the meeting' && !transcript.includes(plain(name))) bad.owner.push(`row ${r.n}: ${r.owner} is not in the meeting`);
  } else if (roster.has(r.owner)) {
    // The fact follows "Roster:", with or without quotes around it.
    const fact = (r.why.split(/Roster:/)[1] ?? '').replace(/\\"/g, '"').trim();
    if (!fact || !roster.get(r.owner)!.includes(plain(fact))) bad.fact.push(`row ${r.n}: ${r.owner}, fact "${fact}"`);
  } else {
    bad.owner.push(`row ${r.n}: "${r.owner}"`);
  }
}
check(bad.owner.length === 0, 'Every owner is Agent, a roster name, Name (volunteered), or unassigned', bad.owner.join('; '));
check(bad.quote.length === 0, 'Every row quotes the meeting word for word', bad.quote.join('; '));
check(bad.fact.length === 0, "Every person match copies a fact from that person's roster line", bad.fact.join('; '));
check(bad.needs.length === 0, 'Every Agent row says what the agent needs (Needs: ...)', bad.needs.join('; '));
check(bad.none.length === 0, 'Every unassigned row says "No roster fact fits."', bad.none.join('; '));
check(bad.first.length === 0, 'Every row has a first step', bad.first.join('; '));
check(/Nothing was sent or changed/i.test(table), 'Ends with "Nothing was sent or changed."');

if (isSample) {
  console.log('\nSample meeting checks (demo-meeting/transcript.md):');
  const find = (re: RegExp): Row[] => rows.filter((r) => re.test(r.task));
  const owners = (re: RegExp): string => find(re).map((r) => r.owner).join(', ') || 'no such row';
  const all = (re: RegExp, want: RegExp): boolean => find(re).length > 0 && find(re).every((r) => want.test(r.owner));
  const some = (re: RegExp, want: RegExp): boolean => find(re).some((r) => want.test(r.owner));
  check(some(/recap email/i, /^Agent$/), 'Recap email draft goes to Agent', owners(/recap email/i));
  check(some(/RSVP/i, /^Agent$/), 'RSVP summary goes to Agent', owners(/RSVP/i));
  check(some(/description|event page/i, /^Agent$/), 'Event page description goes to Agent', owners(/description|event page/i));
  check(some(/January|GDG Tulsa/i, /^Zain Khan$/), 'GDG Tulsa date check goes to Zain Khan', owners(/January|GDG Tulsa/i));
  check(some(/Brainmaxxing/i, /^Lauren Tan$/), 'Brainmaxxing talk goes to Lauren Tan', owners(/Brainmaxxing/i));
  check(some(/agent skills/i, /^Sam Carlton$/), 'Agent skills session goes to Sam Carlton', owners(/agent skills/i));
  check(some(/venue|room/i, /^Odalys Brandt \(volunteered\)$/), 'Venue ask stays with Odalys Brandt (volunteered)', owners(/venue|room/i));
  check(all(/sponsor/i, /^unassigned$/i), 'Sponsor ask is unassigned', owners(/sponsor/i));
  check(all(/Women\+ in Tech/i, /^unassigned$/i), 'Women+ in Tech contact is unassigned', owners(/Women\+ in Tech/i));
  const guessed = rows.filter((r) => /^(Jess Trippiedi|Valerie Feral|Tran Trinh)$/.test(r.owner)).map((r) => `row ${r.n}: ${r.owner}`);
  check(guessed.length === 0, 'Nobody known only as "a host" was given a task', guessed.join('; '));
}

console.log(failed === 0 ? '\nAll automatic checks passed.' : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
