# Check a run: Dashboard of this talk

- `Tease:` Three checks that take a minute.
- `Lede:` Compare the AI-built dashboard with the live page, which counts in code and shows the lines behind each number.
- `Why it matters:` The practice transcript has known answers, so a wrong number is easy to see.
- `Go deeper:` [Prompts](PROMPT.md) · [README](README.md)

## Known answers for the practice transcript

With `sample/transcript-sample.txt` the live page shows:

| Number | Value |
| --- | --- |
| "women" | 2 |
| "tech" | 2 |
| Themes covered | 5 of 9 |
| Words | 236 |
| Email | 3 |
| Meetings and follow-ups | 6 |
| Keeping data safe | 2 |

## The three checks

1. **One number by hand.** Search the transcript for "women" and count. It should match the dashboard.
2. **Change the input.** Add a line that says "women in tech" and update. "women" and "tech" should each go up by one, and nothing else should change.
3. **Open the lines.** Click a number. Every line listed should contain the word, and no line that contains it should be missing.

A dashboard from the lazy prompt often fails check 2: its numbers were typed into the page, so they do not move.
