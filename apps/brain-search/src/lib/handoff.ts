/**
 * "Ask an AI" handoff: build one prompt and the URL each app opens with.
 * Prefill URLs checked 2026-11-14: ChatGPT `?q=` and Claude `/new?q=`.
 * Gemini has no documented prompt parameter, and Antigravity is a desktop app
 * with no documented deep link, so both rely on the clipboard.
 */

export type HandoffTarget = 'antigravity' | 'gemini' | 'chatgpt' | 'claude';

export interface Handoff {
  id: HandoffTarget;
  label: string;
  /** URL to open after copying, or null when the user pastes into a desktop app. */
  url: string | null;
  /** True when the URL itself carries the prompt. */
  prefilled: boolean;
  /** What the UI tells the user after the prompt is copied. */
  hint: string;
}

export const DEFAULT_LOCATION = 'apps/brain-search/brain';

export function buildPrompt(query: string, location: string): string {
  const where = location.trim() || DEFAULT_LOCATION;
  return [
    `Search my brain at ${where} and answer: ${query.trim()}`,
    '',
    "Follow the brain's AGENTS.md. Recall first: read index.md, search the notes, and cite the note paths you used. " +
      'If the brain does not have the answer, say so, then answer from other sources and cite them. ' +
      'Capture anything new and durable as a note (one topic per file, with title, tags, source URLs and updated date), ' +
      'update index.md, and never duplicate an existing note.',
  ].join('\n');
}

export function handoffs(prompt: string): Handoff[] {
  const encoded = encodeURIComponent(prompt);
  return [
    {
      id: 'antigravity',
      label: 'Antigravity',
      url: null,
      prefilled: false,
      hint: 'Prompt copied. Open Antigravity and paste it into the Agent panel.',
    },
    {
      id: 'gemini',
      label: 'Gemini',
      url: 'https://gemini.google.com/app',
      prefilled: false,
      hint: 'Prompt copied. Gemini is opening: paste it into the chat box.',
    },
    {
      id: 'chatgpt',
      label: 'ChatGPT',
      url: `https://chatgpt.com/?q=${encoded}`,
      prefilled: true,
      hint: 'Prompt copied and ChatGPT is opening with it filled in.',
    },
    {
      id: 'claude',
      label: 'Claude',
      url: `https://claude.ai/new?q=${encoded}`,
      prefilled: true,
      hint: 'Prompt copied and Claude is opening with it filled in.',
    },
  ];
}
