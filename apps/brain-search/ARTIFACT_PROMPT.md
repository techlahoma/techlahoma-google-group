# No-install version: build the search page as a chat artifact

- `Tease:` Get a working Brain Search inside ChatGPT or Claude, no install needed.
- `Lede:` Paste the prompt into Claude (artifacts) or ChatGPT (canvas), then paste or upload your notes.
- `Why it matters:` Some attendees can't run Bun or Antigravity; they can still see and use the idea.
- `Go deeper:` The full local app is in this folder's [README](README.md). Setup for each app is in [SETUP.md](SETUP.md).

## Copy this prompt

```text
Make an interactive artifact (Claude) or canvas app (ChatGPT) called "Brain Search": a personal search page over my Markdown notes.

- I'll paste or upload notes. Each may start with --- frontmatter (title, tags, source URLs, updated). If I give you none, use three short sample notes you invent and label clearly as "sample".
- Embed my notes as data in the page. Build a BM25 keyword index in the page (no network calls, no external libraries other than ones this artifact environment allows).
- Show one centered search box with an original, simple look (no Google logo or colors). Results show title, a highlighted snippet, tags, path and source links; clicking opens the note, rendered safely (escape HTML).
- When a search has no or weak results, show buttons "ChatGPT", "Claude" and "Gemini" that copy this prompt to the clipboard and open the app in a new tab: "Search my brain and answer: <query>. Cite note paths; capture anything new as a note." ChatGPT opens https://chatgpt.com/?q=<encoded>, Claude opens https://claude.ai/new?q=<encoded>, Gemini opens https://gemini.google.com/app (paste there). If the sandbox blocks the clipboard or new tabs, show the prompt in a box to copy by hand.
- Works at phone width and with a keyboard.

My notes:
[paste notes here, or say "use samples"]
```

## Limits

- The artifact only knows the notes you paste or upload into that chat. It
  can't read your folder or see later changes.
- Artifact and canvas sandboxes may block the clipboard, new tabs or network
  access; the prompt asks for a manual-copy fallback.
- Notes you paste are sent to that AI provider. Don't paste anything private
  you wouldn't put in a chat.
