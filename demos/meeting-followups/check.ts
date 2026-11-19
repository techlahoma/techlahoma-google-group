// Checks a run of the meeting follow-ups demo against the bundled sample.
// No packages. Run from anywhere:
//   bun demos/meeting-followups/check.ts            (checks output/)
//   bun demos/meeting-followups/check.ts expected   (checks the reference output)
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const here = import.meta.dir;
const outDir = join(here, process.argv[2] ?? 'output');
const sampleDir = join(here, 'sample');

let failed = 0;
function check(ok: boolean, label: string, detail = ''): void {
  if (!ok) failed += 1;
  console.log(`${ok ? '✅' : '❌'} ${label}${!ok && detail ? `\n     ${detail}` : ''}`);
}
function read(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}
// Lowercase, straighten quotes, and reduce everything else to single spaces,
// so a quote still matches when only punctuation or spacing differs.
function plain(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9']+/g, ' ')
    .trim();
}

const sources: Record<string, string[]> = {
  '01-pantry-dinner-actions.md': ['01-pantry-dinner-transcript.md'],
  '02-fernbrook-call-actions.md': ['02-fernbrook-call-notes.md'],
  '03-portal-status-actions.md': ['03-portal-status-notes.md', 'followup-message.md'],
};
const emails = ['01-pantry-dinner-email.md', '02-fernbrook-call-email.md', '03-portal-status-email.md'];
const people = read(join(sampleDir, 'people.md'));
const names = [...people.matchAll(/^\| ([A-Z][^|]+?) \|/gm)]
  .map(match => match[1])
  .filter(name => name !== 'Name');
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const datePattern = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Nov|Dec) (\d{1,2})\b/g;

console.log(`Checking ${outDir}\n`);

// 1. Files exist.
for (const file of [...Object.keys(sources), ...emails.map(name => `emails/${name}`), 'dana-this-week.md']) {
  check(existsSync(join(outDir, file)), `exists: ${file}`);
}

// 2. Every action row has an owner, a date, and a quote that is really in the sample.
const rowsByFile: Record<string, string[]> = {};
for (const [file, sourceFiles] of Object.entries(sources)) {
  const text = read(join(outDir, file));
  const source = plain(sourceFiles.map(name => read(join(sampleDir, name))).join('\n'));
  const rows = text.split('\n').filter(line => /^[├└]── \d+\. /.test(line));
  rowsByFile[file] = rows;
  check(rows.length >= 4, `${file}: has at least 4 action rows`, `found ${rows.length}`);

  const receiptPart = text.split(/^## Where each line came from/m)[1]?.split(/^## /m)[0] ?? '';
  const receipts = new Map<string, string>();
  for (const line of receiptPart.split('\n')) {
    const match = line.match(/^(\d+)\. (.*)$/);
    if (match) receipts.set(match[1], match[2]);
  }

  for (const row of rows) {
    const number = row.match(/── (\d+)\./)?.[1] ?? '?';
    const short = row.slice(0, 70);
    const hasOwner = row.includes('OWNER UNCLEAR') || names.some(name => row.includes(`${name}:`));
    check(hasOwner, `${file} row ${number}: owner is a person from the sample, or OWNER UNCLEAR`, short);
    const dates = [...row.matchAll(datePattern)];
    check(dates.length > 0 || row.includes('DATE UNCLEAR'), `${file} row ${number}: has a date, or DATE UNCLEAR`, short);
    for (const [whole, day, month, dayOfMonth] of dates) {
      const real = dayNames[new Date(2026, month === 'Nov' ? 10 : 11, Number(dayOfMonth)).getDay()];
      check(real === day, `${file} row ${number}: ${whole} is the right weekday`, `that date is a ${real}`);
    }
    const quotes = [...(receipts.get(number) ?? '').matchAll(/["“]([^"“”]+)["”]/g)].map(match => match[1]);
    const real = quotes.filter(quote => plain(quote).split(' ').length >= 3);
    const missing = real.filter(quote => !source.includes(plain(quote)));
    check(
      real.length > 0 && missing.length === 0,
      `${file} row ${number}: quote is word for word in ${sourceFiles.join(' or ')}`,
      real.length === 0 ? 'no quote of 3+ words found for this row' : `not in the sample: "${missing[0]}"`,
    );
  }
}

// 3. Traps in the sample: nothing guessed, nothing invented, the correction wins.
const row = (file: string, word: RegExp): string => rowsByFile[file]?.find(line => word.test(line)) ?? '';
const pantry = '01-pantry-dinner-actions.md';
const fernbrook = '02-fernbrook-call-actions.md';
const portal = '03-portal-status-actions.md';

check(/OWNER UNCLEAR/.test(row(pantry, /church/i)), 'meeting 1: "call the church" is OWNER UNCLEAR', row(pantry, /church/i) || 'no row mentions the church');
check(/DATE UNCLEAR/.test(row(pantry, /church/i)), 'meeting 1: "call the church" is DATE UNCLEAR');
check(/OWNER UNCLEAR/.test(row(pantry, /centerpiece/i)), 'meeting 1: centerpiece pickup is OWNER UNCLEAR', row(pantry, /centerpiece/i) || 'no row mentions centerpieces');
check(/DATE UNCLEAR/.test(row(pantry, /sign-?up/i)), 'meeting 1: sign-up form is DATE UNCLEAR ("soon")', row(pantry, /sign-?up/i) || 'no row mentions the sign-up form');
check(!rowsByFile[pantry]?.some(line => /auction|card reader|kids/i.test(line)), 'meeting 1: no action row for the auction, card reader, or kids table');

check(/Dana Whitfield:.*Thu Nov 19/.test(row(fernbrook, /quote/i)), 'meeting 2: Dana sends the quote by Thu Nov 19', row(fernbrook, /quote/i) || 'no row mentions the quote');
check(/OWNER UNCLEAR/.test(row(fernbrook, /sample/i)), 'meeting 2: cardstock samples are OWNER UNCLEAR', row(fernbrook, /sample/i) || 'no row mentions samples');
check(/DATE UNCLEAR/.test(row(fernbrook, /follow[- ]?up call/i)), 'meeting 2: follow-up call is DATE UNCLEAR', row(fernbrook, /follow[- ]?up call/i) || 'no row mentions the follow-up call');
check(/DATE UNCLEAR/.test(row(fernbrook, /logo|address/i)), 'meeting 2: "early next week" stays DATE UNCLEAR');
const fernbrookEmail = read(join(outDir, 'emails', emails[1]));
check(!/(10|ten)[- ]day/i.test(fernbrookEmail), 'meeting 2 email: does not mention the 10 day turnaround');
check(/\?/.test(fernbrookEmail), 'meeting 2 email: asks at least one question');

const announce = row(portal, /announcement/i);
check(/Tue Dec 1\b/.test(announce) && /was[^)]*Nov 20/.test(announce), 'meeting 3: announcement is Tue Dec 1 (was Fri Nov 20)', announce || 'no row mentions the announcement');
const payment = row(portal, /payment/i);
check(/Wed Dec 2\b/.test(payment), 'meeting 3: payment testing is Wed Dec 2', payment || 'no row mentions payment testing');
check(/Mon Nov 23/.test(row(portal, /guide/i)), 'meeting 3: how-to guide stays Mon Nov 23');
check(/Thu Dec 3/.test(row(portal, /training/i)), 'meeting 3: training is Thu Dec 3', row(portal, /training/i) || 'no row mentions training');
const phone = row(portal, /phone/i);
check(/Marcus Dellinger:/.test(phone) && /DATE UNCLEAR/.test(phone), 'meeting 3: phone testing is Marcus, DATE UNCLEAR', phone || 'no row mentions phone testing');
const portalText = read(join(outDir, portal));
const decisions = portalText.split(/^## Decisions/m)[1]?.split(/^## /m)[0] ?? '';
check(/Dec(ember)? 7/.test(decisions), 'meeting 3: the decision says launch is December 7', decisions.trim().slice(0, 120));
const portalEmail = read(join(outDir, 'emails', emails[2]));
check(/Dec(ember)? 7/.test(portalEmail) && /Dec(ember)? 1\b/.test(portalEmail), 'meeting 3 email: gives the December 7 launch and the December 1 announcement');

// 4. Dana's week.
const week = read(join(outDir, 'dana-this-week.md'));
const dueNow = week.split(/Due this week/)[1]?.split(/Coming later/)[0] ?? '';
const later = week.split(/Coming later/)[1]?.split(/No date yet/)[0] ?? '';
check(/Glenn|banner/i.test(dueNow) && /quote/i.test(dueNow) && /proof|program/i.test(dueNow), "Dana's week: banner ask, Fernbrook quote, and program proof are due this week", dueNow.trim());
check(!/announcement/i.test(dueNow), "Dana's week: the launch announcement is NOT due this week");
check(/announcement/i.test(later) && /Dec 1\b/.test(later), "Dana's week: the launch announcement is under Coming later, Tue Dec 1", later.trim());
check(/FAQ/i.test(week.split(/No date yet/)[1] ?? ''), "Dana's week: FAQ update is listed with no date");

// 5. Drafts only, and no invented addresses.
const allOutput = [week, ...Object.keys(sources).map(name => read(join(outDir, name)))];
const emailDir = join(outDir, 'emails');
for (const name of existsSync(emailDir) ? readdirSync(emailDir) : []) {
  const text = read(join(emailDir, name));
  allOutput.push(text);
  check(/Draft\. Not sent\./.test(text), `emails/${name}: says "Draft. Not sent."`);
  const words = text.split(/\n\n/).slice(2).join(' ').split(/\s+/).filter(Boolean).length;
  check(words <= 230, `emails/${name}: body is short`, `${words} words`);
}
const addresses = [...new Set(allOutput.join('\n').match(/[\w.+-]+@[\w.-]+\.\w+/g) ?? [])];
const strangers = addresses.filter(address => !people.includes(address));
check(strangers.length === 0, 'every email address comes from sample/people.md', strangers.join(', '));

console.log(failed === 0 ? '\n🎉 All automatic checks passed. Now do the reading checks in TEST.md.' : `\n⚠️  ${failed} check(s) failed. See TEST.md.`);
process.exit(failed === 0 ? 0 : 1);
