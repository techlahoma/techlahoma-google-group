# Agent memories: seed your own AI brain

- `Tease:` Give an AI agent a memory in about 30 seconds, then watch a brand-new chat remember what you taught it.
- `Lede:` One pasted prompt copies a small starter "brain" and fills it with seven short, cited notes about tonight's event, the groups behind it, and a made-up attendee's team and weekly report. A second prompt, in a new conversation, answers a question only the brain can answer. A third saves one sentence as a new memory.
- `Why it matters:` Every chat starts from zero, so you re-explain your job each time. A folder of plain notes fixes that, works with any AI app, and stays yours.
- `Go deeper:` [Prompts and presenter script](PROMPT.md) · [Recall questions](questions.md) · [How to check a run](TEST.md) · [Reference output](expected/) · [The finale: Brain Search](../../apps/brain-search/PROMPT.md)

Workshop demo for "Actual Productivity with AI" (Google Developer Group Tulsa × Women+ in Technology of Tulsa, with Techlahoma), November 19, 2026. The idea comes from Lauren Tan's [Brainmaxxing](https://github.com/poteto/brainmaxxing): a folder of Markdown notes that an agent reads when it starts and writes to when it learns something.

## Try it in 5 minutes

1. Open this repository in Google Antigravity, or any agent app that can read and write files. The cheapest model works (Gemini Flash, Low).
2. Paste **Prompt A** from [PROMPT.md](PROMPT.md). A new `brain/` folder appears with seven notes.
3. Start a **new conversation** and paste **Prompt B**. It answers from the brain and names the notes it used.
4. Paste **Prompt C**. One sentence becomes a memory, and the note changes on screen.

If a live run goes wrong, [`expected/`](expected/) holds a finished run to show instead.

## What is in the folder

| Folder or file | What it is |
|---|---|
| `starter/` | The empty brain: one page of rules (`AGENTS.md`), an index with headings, and one example note |
| `sources/` | What the agent reads to fill the brain: real public facts with links, plus fictional notes from "Jessica" |
| `brain/` | Made by Prompt A. Not saved to the repository |
| `questions.md` | Three questions to ask the brain, with the answers to expect |
| `check.ts` | A small checker for a finished run. See [TEST.md](TEST.md) |
| `expected/` | A finished run: the brain, a recall answer, and the brain after a captured memory |

## What to look for

- **Read first, then answer.** In the new conversation, the agent opens `AGENTS.md` and `index.md` before it says anything. That habit is the whole memory.
- **Every line has a source.** Each fact ends with a link or `(source: ...)`. If the agent can't cite it, it doesn't write it.
- **Two notes, one answer.** Prompt B's answer joins a private fact (who on the team wants a mentor) with a public one (which group offers mentorship).
- **Update, not duplicate.** Prompt C changes the existing note and says what the old fact was. It does not make a second note.

## What is real and what is made up

- **Real:** the event, GDG Tulsa, Women+ in Tech of Tulsa, Techlahoma and Gitwit. Each fact was copied, with its source link, from the workshop's seed brain. The brain says nothing about real people beyond what those public pages list.
- **Fictional sample data for the workshop:** Jessica Marlowe, Larkspur Supply Co. and her teammates. Their notes are marked `sample: true`.

## Make your own

Use **Prompt D** in [PROMPT.md](PROMPT.md). It asks you five questions and writes your first notes. Keep the folder private: on your computer, in a private GitHub repo, or in your own Drive. Leave out passwords, health and money details, and other people's contact details.

Then go to the finale, [Brain Search](../../apps/brain-search/PROMPT.md). It grows the same kind of brain from your real files and meetings and puts a search page on top that runs only on your computer.
