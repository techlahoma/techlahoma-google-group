# Google AI Studio demo: build the search page from a prompt

- `Tease:` Show Brain Search being generated live in Google AI Studio's Build mode.
- `Lede:` Build mode turns a prompt into a working web app. Paste the prompt below; the app it makes searches a brain you upload or paste in the browser.
- `Why it matters:` It's the no-install path for the workshop's second demo surface, and it shows the same idea built a different way.
- `Go deeper:` [AI Studio Build mode docs](https://aistudio.google.com/docs/aistudio-build-mode), [setup for every app](SETUP.md), [surface research](../../docs/research/brain-search-ai-surfaces-2026-11-18.md).

## Honest limits (checked 2026-11-18)

- Build mode **cannot read a folder on your computer**. The generated app
  can let you pick or drop your brain's `.md` files in the browser.
- Build mode can **import from GitHub** and sync both ways with a repo, so you
  can also point it at this repository. Its docs don't mention system
  instructions, `AGENTS.md` or skills for Build mode.
- Files you load into the generated app stay in that browser tab unless the
  app sends them to the Gemini API. The prompt below keeps search local and only
  sends the top matching notes to Gemini when you press "Ask Gemini".
- This is a demo, not your daily brain: notes you add in the app are not saved
  back to your brain unless you download them.

## Copy this prompt into Build mode

```text
Build a single-page web app called "Brain Search": a personal search engine over a folder of Markdown notes (a "brain").

Data
- The user loads notes by choosing a folder or several .md files, dropping them on the page, or pasting one note into a text box. Keep everything in memory in the browser. Include a "Load example brain" button that loads three short example notes you write yourself, clearly labeled "sample".
- Each note may start with a YAML frontmatter block between --- lines with title, tags (list), source (list of URLs) and updated (date). Parse it. Use the first # heading or the file name when there is no title. Skip index.md and AGENTS.md.

Search
- Split notes into chunks by ## heading. Build a BM25 keyword index over title + tags + chunk text (k1 = 1.2, b = 0.75), entirely in the browser.
- One large, centered search box on a plain page with an original simple logo (not Google's colors or logo). Results show title, a snippet with matched words highlighted, tags as chips, the note path, and source links. Clicking a result shows the rendered note with safe HTML (escape everything; allow only http, https and relative links).
- If there are no results or only weak ones (fewer than half the query words found), show a row of buttons: "Ask Gemini", "ChatGPT", "Claude". "Ask Gemini" calls the Gemini API with the question and the top 5 matching chunks and shows the answer with the note paths it used. "ChatGPT" and "Claude" copy a prompt ("Search my brain and answer: <query>. Cite note paths. Capture anything new as a note.") to the clipboard, then open https://chatgpt.com/?q=<encoded prompt> or https://claude.ai/new?q=<encoded prompt> in a new tab. Show a short message saying the prompt was copied.
- Add a "New note" button that drafts a note in the frontmatter format and lets the user download it as a .md file.

Quality
- Works on a phone (390 px wide) and with a keyboard; visible focus; labels on every input.
- Never send notes anywhere except the Gemini call the user starts with "Ask Gemini".
```

## Demo script (3 minutes)

1. Open [AI Studio](https://aistudio.google.com/), choose **Build**, paste the prompt, run it.
2. In the generated app, press **Load example brain**, search for a word from a note.
3. Load the real starter brain: download `apps/brain-search/brain` from this repo
   (or use **Import from GitHub**) and drop the `.md` files in.
4. Search for something that isn't there (for example `best pizza in Tulsa`) to show
   the AI buttons.

If Build mode output differs from the prompt, ask it in chat to fix the specific
gap, for example "Results must show source links".
