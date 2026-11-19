/**
 * Per-viewer settings kept in localStorage. Every read and write is wrapped:
 * storage can be blocked (private windows, strict settings) and the page must
 * still work with defaults.
 */
export interface Settings {
  /** Custom logo text; '' means the default (a pun on the owner's name). */
  logo: string;
  /** First name, used by the "search yourself" Easter egg. */
  name: string;
  instant: boolean;
  showScores: boolean;
  location: string;
}

export const MAX_LOGO = 20;

export const DEFAULT_SETTINGS: Settings = {
  logo: '',
  name: '',
  instant: true,
  showScores: false,
  location: '',
};

const KEY = 'brain-search:settings:v3';
/** Round 3 stored the logo as 'Google' by default; keep only real renames. */
const OLD_KEY = 'brain-search:settings:v2';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadSettings(storage: StorageLike | null): Settings {
  try {
    const raw = storage?.getItem(KEY);
    const old = raw ? null : storage?.getItem(OLD_KEY);
    if (!raw && !old) return {...DEFAULT_SETTINGS};
    const saved = JSON.parse(raw ?? old ?? '{}') as Partial<Settings>;
    if (!raw && saved.logo === 'Google') saved.logo = '';
    return {
      logo: cleanLogo(typeof saved.logo === 'string' ? saved.logo : ''),
      name: typeof saved.name === 'string' ? saved.name : '',
      instant: saved.instant !== false,
      showScores: saved.showScores === true,
      location: typeof saved.location === 'string' ? saved.location : '',
    };
  } catch {
    return {...DEFAULT_SETTINGS};
  }
}

/** One line, at most MAX_LOGO characters ('' means use the default). */
export function cleanLogo(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_LOGO);
}

export function saveSettings(
  storage: StorageLike | null,
  settings: Settings,
): void {
  try {
    storage?.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Blocked storage: settings last for this page view only.
  }
}

/** `window.localStorage`, or null when even touching it throws. */
export function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
