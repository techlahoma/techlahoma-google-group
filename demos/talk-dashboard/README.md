# Dashboard of this talk

- `Tease:` A dashboard built from the talk's own transcript, part-way through the talk.
- `Lede:` Paste the transcript so far into the live page and it counts, in code, how often Sam said "women" and "tech", a few other words to watch, and which of the themes the room asked for have been covered. Click any number to see the lines behind it.
- `Why it matters:` Dashboards and weekly reports were among the things people asked to hand off. The risk with an AI-built dashboard is a wrong number on a good-looking page, so this one shows its work.
- `Go deeper:` [Prompts](PROMPT.md) · [How to check a run](TEST.md) · [Live page](https://wit-demos.web.app/talk-dashboard/web/)

## What is in the folder

| Path | What it is |
| --- | --- |
| `web/index.html` | The live dashboard. One file, no libraries. The transcript stays in the browser. |
| `mcp.ts` | A local MCP server (Bun, no packages). It gives an agent seven tools and passes each call to the dashboard open in your browser. |
| `topics.json` | Words to watch, the themes the room asked for, and their worries, each with a pattern. |
| `sample/transcript-sample.txt` | A made-up practice transcript. It is not the real talk. |
| `PROMPT.md` | The three prompts. |
| `TEST.md` | The checks. |

## How the agent drives it

```text
Antigravity / Claude Code / Codex
        │  MCP over stdio
        ▼
  bun mcp.ts ── serves web/ on http://127.0.0.1:4820
        │  WebSocket
        ▼
  the open page ── recounts, redraws, answers
```

Tools: `update_dashboard`, `load_transcript_file`, `add_to_transcript`, `get_dashboard`, `get_lines`, `add_watch_word`, `load_sample`. If no page is open when a tool is called, the server opens it. The server listens on 127.0.0.1 only and makes no outbound requests.

## Where the themes come from

`topics.json` groups the registration answers from Luma and Eventbrite into themes and stores only how many people named each one. No individual answer, name, or question is in this folder.

## How it counts

- Whole words, upper or lower case.
- "women" also counts "woman". "tech" does not count "technology".
- Time stamps like `[18:10:02]` and speaker labels like `Microphone:` are removed before counting.
- A theme is covered once any of its words has been said. That means it was mentioned, not that it was explained well.

## Safe by default

The page makes no network requests except loading `topics.json` and the sample from this site. A real transcript can include what audience members said aloud, so paste it only on your own machine and do not publish it.
