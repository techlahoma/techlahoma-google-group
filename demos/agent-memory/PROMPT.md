# Prompts: agent memories

- `Tease:` Four short prompts give an AI agent a memory, prove it reads it, and teach it something new while you watch.
- `Lede:` Prompt A builds a small "brain" of cited Markdown notes from a source pack. Prompt B, in a new conversation, answers a question only the brain can answer. Prompt C saves one sentence as a memory. Prompt D starts your own.
- `Why it matters:` A chat forgets you when you close it. A folder of notes doesn't, and any AI app can read it.
- `Go deeper:` [What this demo is](README.md) · [Recall questions](questions.md) · [How to check a run](TEST.md) · [Reference output](expected/) · [Presenter script](#presenter-script-about-4-minutes)

Open this repository in Google Antigravity (or any agent app that can read and write files). The cheapest model is enough: Gemini Flash, Low. If you opened only the `demos/agent-memory` folder, delete `demos/agent-memory/` from every path.

## Prompt A: seed the brain

```text
Build me a memory ("brain") that you can read and write. Work only inside demos/agent-memory/. Do not open expected/ or questions.md. Today is 2026-11-19.

1. Copy the starter in one command: cp -R demos/agent-memory/starter demos/agent-memory/brain
2. Read these 4 files at the same time: demos/agent-memory/brain/AGENTS.md, demos/agent-memory/brain/notes/brainmaxxing.md, demos/agent-memory/sources/public-facts.md, demos/agent-memory/sources/jessica-notes.md
3. Write these 7 notes inside demos/agent-memory/brain/, in the note format from AGENTS.md. Write all 7 in one batch, not one at a time:
   events/actual-productivity-with-ai-2026-11-19.md
   orgs/gdg-tulsa.md
   orgs/women-plus-in-tech-tulsa.md
   orgs/techlahoma.md
   orgs/gitwit.md
   work/my-team.md
   work/weekly-open-orders-report.md
4. Use only facts from the 2 source files, sorted into the note they belong to. Every fact line ends with its source. Add nothing you know from elsewhere. The two work/ notes come from jessica-notes.md: give them sample: true and end each fact with (source: Jessica's notes, sample).
5. In the same batch, rewrite demos/agent-memory/brain/index.md so every note has a link under its heading.
6. Do not read the files back. Reply with the list of files you wrote.
```

## Prompt B: prove it remembers (paste in a NEW conversation)

```text
Answer from my brain in demos/agent-memory/brain/. Use nothing else you know.

1. First read demos/agent-memory/brain/AGENTS.md and demos/agent-memory/brain/index.md.
2. Open only the notes the index points to for this question.
3. Answer in 3 sentences or fewer. After each fact, put the note path in parentheses, like (orgs/gitwit.md). If the brain doesn't say, say so.

Question: Someone on my team is looking for a mentor. Who is it, and which of tonight's host groups offers mentorship?
```

More questions, with the answers to expect, are in [questions.md](questions.md).

## Prompt C: capture a new memory

Replace the first sentence with anything said in the room.

```text
Remember that Dolores moved my Weekly Open Orders Report deadline from Friday at 3 PM to Thursday at noon.

Follow the Capture rule in demos/agent-memory/brain/AGENTS.md: search the brain first, update the existing note if there is one, cite it as said by the user on 2026-11-19, and tell me which files changed.
```

## Prompt D: start your own brain

Paste this into an agent app that can write files (Antigravity, Gemini CLI, Codex, Claude Code). It asks before it reads or uploads anything.

```text
Start a private memory ("brain") for me, a folder of Markdown notes that you read before answering and write to when you learn something.

1. Ask me where it should live: a folder on this computer (for example ~/Brain), a new PRIVATE GitHub repo, or a Google Drive folder. Never make it public.
2. Copy the starter from https://github.com/techlahoma/techlahoma-google-group/tree/main/demos/agent-memory/starter into it: AGENTS.md, index.md and notes/brainmaxxing.md. Read AGENTS.md and follow it from now on.
3. Ask me 5 questions, one at a time: my role, my team, one task I repeat every week, the groups I belong to, and one thing I keep having to re-explain to AI.
4. Show me the list of notes you plan to write (5 to 8, one topic each) and wait for my yes.
5. Write them in the brain's note format. Every fact ends with its source: (source: said by the user, today's date) or a link I gave you. Never invent facts, and write nothing about other people beyond what I told you. Leave out passwords, health and money details, and other people's contact details.
6. Update index.md, then tell me which files you wrote.
7. Before any upload, push or sync, show me the plan and wait for my yes.
```

No file access (a browser chat on a work account)? Paste the starter's [AGENTS.md](starter/AGENTS.md) into the chat, answer the same 5 questions, and ask it to reply with each note as text so you can save it yourself.

**Next step, the finale:** [apps/brain-search/PROMPT.md](../../apps/brain-search/PROMPT.md) grows this same kind of brain from your real files and meetings and puts a search page on top of it that runs only on your computer.

## Presenter script (about 4 minutes)

Before you start: delete `demos/agent-memory/brain/` if it exists, set the model to Gemini Flash, Low, and have `starter/` and `sources/` visible in the file tree. Prompt A runs one terminal command (`cp -R`) and writes 8 files, so either let the agent run commands and accept edits without asking, or be ready to click Accept twice.

| Time | Do | Say | Point at |
|---|---|---|---|
| 0:00 | Open `sources/public-facts.md`, then `sources/jessica-notes.md` | "Every chat starts from zero. This is what I wish it already knew: tonight's event, the groups behind it, and Jessica's team and weekly report. Jessica is made up. The event facts are real." | The `Source:` links, and the FICTIONAL line |
| 0:30 | Open `starter/AGENTS.md` | "This one page is the whole trick. Read before you answer. Write down what you learn. Cite it. The idea is Lauren Tan's Brainmaxxing." | "The loop" section |
| 0:50 | Paste **Prompt A**. While it runs, watch the file tree | "One paste. It copies the starter and writes seven notes, one topic each." | New `brain/` folders appearing |
| 1:30 | Open `brain/orgs/women-plus-in-tech-tulsa.md`, then `brain/index.md` | "Every line ends with where it came from. If it can't cite it, it doesn't write it." | A `([source](...))` at the end of a line |
| 2:00 | Start a **new conversation**. Paste **Prompt B** | "New chat. It has never seen those sources. Watch what it opens first." | It reading `AGENTS.md` and `index.md`, then the note paths in its answer |
| 2:40 | Paste **Prompt C** (or type your own "Remember that ..." from the room) | "Now I teach it something. One sentence." | The changed line in `brain/work/weekly-open-orders-report.md` |
| 3:10 | New conversation. Paste Prompt B with question 1 from `questions.md` | "A brand-new chat already knows the deadline moved to Thursday." | "Thursday at noon" and the cited path |
| 3:40 | Show Prompt D | "Yours takes five questions. Keep it private. And in the finale we put a search page on top of this." | The link to `apps/brain-search/PROMPT.md` |

**Fallback.** If Prompt A stalls or writes something odd, open `expected/brain/` and say "here is one I ran earlier". For recall, paste Prompt B with `demos/agent-memory/expected/brain/` in place of `demos/agent-memory/brain/`, or show `expected/recall-answer.md`. For capture, show `expected/brain-after-capture/work/weekly-open-orders-report.md` beside `expected/brain/work/weekly-open-orders-report.md`.

**If someone in the room offers a real fact** ("remember that our next meetup is ..."), type it word for word. The brain's rule is to write only what was said and cite it as said in the room.
