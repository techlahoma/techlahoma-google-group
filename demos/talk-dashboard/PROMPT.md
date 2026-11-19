# Prompts: Dashboard of this talk

- `Tease:` Halfway through the talk, hand the transcript so far to an AI agent and get a dashboard of the talk itself: how often Sam said "women" or "tech", and which themes the room asked for have come up.
- `Lede:` Prompt 0 connects the dashboard to Antigravity as an MCP server in one paste. Prompt 1 updates the page open in your browser in one tool call. The lazy ask and the brief show what happens when the AI builds its own.
- `Why it matters:` A model that counts by reading gets numbers wrong and sounds sure. A page that counts in code can show the lines behind every number.
- `Go deeper:` [README](README.md) · [how to check a run](TEST.md) · [themes and patterns](topics.json) · [practice transcript](sample/transcript-sample.txt)

Recommended model in Google Antigravity: Gemini 3.8 Flash. Low thinking is enough for Prompt 1. Use Medium or High for the brief.

## Prompt 0: clone, connect the local MCP server, and open the dashboard (one paste)

Paste this into Google Antigravity. It works in an empty project too, because step 1 clones this repository:

```text
Set up the "Talk dashboard" demo as a local MCP server for this app. Do the work yourself with your own terminal. Do not ask me to type commands. Do only these steps.

1. Find the file demos/talk-dashboard/mcp.ts. If this project does not have it, clone https://github.com/techlahoma/techlahoma-google-group.git into this project folder (reuse the techlahoma-google-group folder if it is already there; if it is there but has no demos/talk-dashboard folder, run `git pull` in it) and use the copy inside it. Note the file's absolute path.
2. Find the bun program: run `which bun` (Windows: `where bun`); if that finds nothing, check ~/.bun/bin/bun. If Bun is not installed, install it the official way from https://bun.sh, tell me what you installed, and find its absolute path.
3. Open the MCP config file ~/.gemini/config/mcp_config.json in my home folder. If it does not exist, create it containing {"mcpServers": {}}. Keep every server that is already in it.
4. Add this entry inside "mcpServers", using the two absolute paths from steps 1 and 2:
   "talk": { "command": "<absolute path to bun>", "args": ["<absolute path to demos/talk-dashboard/mcp.ts>"] }
5. Show me the finished file. Do not run the server yourself and do not change anything else.
6. Tell me to do one thing: open the MCP Servers list (Antigravity app: Customizations > Installed > MCP Servers; Antigravity IDE: the "…" menu in the agent panel > MCP Servers > Manage MCP Servers) and restart or refresh it so "talk" shows 7 tools. Tell me the dashboard will open in my browser by itself the first time you use a talk tool, and that I can also open http://127.0.0.1:4820 myself.
```

Then refresh the MCP server list as it asks. The dashboard opens in your browser by itself the first time the agent uses a talk tool, and the page says **Agent bridge connected**. Set `TALK_NO_OPEN=1` to stop the server opening a browser.

Claude Code or Codex, one line from the repository root:

```sh
claude mcp add talk -- "$(which bun)" "$(pwd)/demos/talk-dashboard/mcp.ts"
codex mcp add talk -- "$(which bun)" "$(pwd)/demos/talk-dashboard/mcp.ts"
```

## Prompt 1: update the dashboard from the transcript (fast)

In Granola, open the transcript panel for the note that is recording the talk and copy everything so far. Paste it into `demos/talk-dashboard/transcript.txt` and save. That file is ignored by Git, so a real transcript is never committed. Then paste:

```text
Use the "talk" MCP tools. The transcript so far is saved in demos/talk-dashboard/transcript.txt.

1. Call load_transcript_file once, with no arguments.
2. From that tool result only, tell me in four short lines: how many times I said "women", how many times I said "tech", how many of the "asked" themes have a count above zero, and which "asked" themes are still at zero.

Do not count anything yourself and do not read the transcript file yourself. No other commentary.
```

The agent does not repeat the transcript, so this takes one tool call. To practice, ask it to call `load_sample`.

If you would rather paste the transcript into the chat:

```text
Use the "talk" MCP tools. Call update_dashboard once with the transcript below, exactly as given. Then, from that tool result only, tell me in four short lines: how many times I said "women", how many times I said "tech", how many of the "asked" themes have a count above zero, and which "asked" themes are still at zero. Do not count anything yourself.

Transcript:
[paste the transcript so far]
```

A good live beat: add a word to watch, and open the lines behind a number.

```text
Use the "talk" MCP tools. Call add_watch_word with the word "dashboard", then call get_lines with the label "women". Tell me the new count for "dashboard" and read me the lines where I said "women".
```

## Prompt 2: the lazy ask

```text
Make me a dashboard of this talk from the transcript below. Save it as output/lazy-talk-dashboard.html in the folder I have open.

Transcript:
[paste the transcript so far]
```

Write down its "women" and "tech" numbers. Then check them against the dashboard.

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

## No server: the hosted page

Open <https://wit-demos.web.app/talk-dashboard/web/>, paste the transcript, and press **Update dashboard**. An agent with its own browser can do the same, but typing a long transcript into a page is slow:

```text
Use your browser for this. Open https://wit-demos.web.app/talk-dashboard/web/ and keep that tab visible.

1. Put the transcript below into the box labeled "Paste the transcript so far". Replace anything already in the box.
2. Press "Update dashboard" and wait until the status next to the buttons says "Counted".
3. Read the page and tell me: how many times I said "women", how many times I said "tech", how many themes are covered, and which themes still say "Not yet". Read the numbers from the page. Do not count anything yourself.

Transcript:
[paste the transcript so far]
```
