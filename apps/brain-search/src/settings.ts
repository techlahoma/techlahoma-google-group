/**
 * Per-viewer settings kept in localStorage. Every read and write is wrapped:
 * storage can be blocked (private windows, strict settings) and the page must
 * still work with defaults.
 */
export interface Settings {
  /** Text of the editable logo. */
  logo: string;
  /** First name, used by the "search yourself" Easter egg. */
  name: string;
  instant: boolean;
  showScores: boolean;
  location: string;
}

export const DEFAULT_LOGO = 'Google';
export const MAX_LOGO = 20;

export const DEFAULT_SETTINGS: Settings = {
  logo: DEFAULT_LOGO,
  name: '',
  instant: true,
  showScores: false,
  location: '',
};

const KEY = 'brain-search:settings:v2';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadSettings(storage: StorageLike | null): Settings {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return {...DEFAULT_SETTINGS};
    const saved = JSON.parse(raw) as Partial<Settings>;
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

/** One line, at most MAX_LOGO characters; empty falls back to the default. */
export function cleanLogo(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, MAX_LOGO);
  return clean || DEFAULT_LOGO;
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
