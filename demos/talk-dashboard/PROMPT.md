# Prompts: Dashboard of this talk

- `Tease:` Halfway through the talk, paste the transcript so far and get a dashboard of the talk itself: how often Sam said "women" or "tech", and which themes the room asked for have come up.
- `Lede:` Prompt 1 fills in the hosted dashboard and needs nothing installed. Prompt 2 is the lazy ask. Prompt 3 is the brief that makes the AI count with code. Then you check the AI's numbers against the hosted page.
- `Why it matters:` A model that counts by reading gets numbers wrong and sounds sure. A page that counts in code can show the lines behind every number.
- `Go deeper:` [README](README.md) · [how to check a run](TEST.md) · [themes and patterns](topics.json) · [practice transcript](sample/transcript-sample.txt)

Recommended model in Google Antigravity: Gemini 3.8 Flash. Low thinking is enough for Prompt 1. Use Medium or High for Prompt 3.

Get the transcript: in Granola, open the transcript panel for the note that is recording the talk and copy everything so far. To practice, use `sample/transcript-sample.txt`.

## Prompt 1: fill in the live dashboard (nothing to install)

```text
Use your browser for this. Open https://wit-demos.web.app/talk-dashboard/web/ and keep that tab visible.

1. Put the transcript below into the box labeled "Paste the transcript so far". Replace anything already in the box.
2. Press "Update dashboard" and wait until the status next to the buttons says "Counted".
3. Read the page and tell me: how many times I said "women", how many times I said "tech", how many themes are covered, and which themes still say "Not yet". Read the numbers from the page. Do not count anything yourself.

Transcript:
[paste the transcript so far]
```

You can also skip the agent: open the page, paste, press **Update dashboard**.

## Prompt 2: the lazy ask

```text
Make me a dashboard of this talk from the transcript below. Save it as output/lazy-talk-dashboard.html in the folder I have open.

Transcript:
[paste the transcript so far]
```

Write down its "women" and "tech" numbers. Then check them against the live dashboard.

## Prompt 3: the brief

```text
Build a one-page dashboard of a talk from its transcript. Work only in the folder I have open. Do not install anything and do not send the transcript anywhere.

1. Save the transcript below, exactly as given, to output/transcript.txt.
2. Read https://wit-demos.web.app/talk-dashboard/topics.json. It lists the words to watch ("watch"), the themes the audience asked for ("asked"), and their worries ("worries"). Each entry has a label and a regular-expression "pattern". "people" is how many people asked.
3. Write output/talk-dashboard.html as one self-contained file: no libraries, no network requests. Put the transcript text and the topics JSON inside the file, and compute every number with JavaScript when the page opens. Never type a count into the HTML yourself.
4. Counting rules, in code: split the transcript into lines; remove a leading time stamp like [18:10:02] and a leading speaker label like "Microphone:" from each line; count regex matches with the "gi" flags (use "g" only when an entry has "caseSensitive": true).
5. The page shows, in this order: big numbers for "women", "tech", themes covered (for example "5 of 9"), and total words; a table of the asked-for themes with people, times said, and "Covered" or "Not yet"; the same table for worries; the watch words with counts. Clicking any number lists the transcript lines that matched.
6. Open the file in your browser. Then reply with only: the "women" count, the "tech" count, themes covered, and the path to the file.

Transcript:
[paste the transcript so far]
```

Check it with [TEST.md](TEST.md).
