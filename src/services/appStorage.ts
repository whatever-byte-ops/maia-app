import type { Annotation, ReaderSettings, ThemePreset, Work } from '../types';

const STORAGE_KEY = 'ao3-reading-companion-state-v2';

export interface PersistedAppState {
  works: Work[];
  annotations: Annotation[];
  activeTab: 'home' | 'reading' | 'notebook' | 'settings';
  libraryInitialFilter: string;
  currentTheme: ThemePreset;
  readerSettings: ReaderSettings;
}

export interface StorageResult<T> {
  value: T | null;
  error: string | null;
  legacyStorageKey?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isWorkArray(value: unknown): value is Work[] {
  return Array.isArray(value) && value.every((work) => {
    if (!isRecord(work)) return false;
    return typeof work.id === 'string'
      && typeof work.title === 'string'
      && typeof work.author === 'string'
      && Array.isArray(work.chapters)
      && work.chapters.every((chapter) =>
        isRecord(chapter)
        && typeof chapter.id === 'string'
        && typeof chapter.title === 'string'
        && Array.isArray(chapter.content)
        && chapter.content.every((paragraph) => typeof paragraph === 'string')
      )
      && isStringArray(work.tags)
      && isStringArray(work.fandoms)
      && isStringArray(work.pairings)
      && isStringArray(work.characters);
  });
}

export function isAnnotationArray(value: unknown): value is Annotation[] {
  return Array.isArray(value) && value.every((annotation) =>
    isRecord(annotation)
    && typeof annotation.id === 'string'
    && typeof annotation.workId === 'string'
    && typeof annotation.selectedText === 'string'
    && typeof annotation.note === 'string'
    && isStringArray(annotation.tags)
  );
}

function isAppStateCandidate(value: unknown): value is Partial<PersistedAppState> {
  return isRecord(value)
    && isWorkArray(value.works)
    && isAnnotationArray(value.annotations)
    && isRecord(value.readerSettings)
    && typeof value.currentTheme === 'string';
}

export function loadAppState(): StorageResult<Partial<PersistedAppState>> {
  if (typeof window === 'undefined') return { value: null, error: null };

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (!isRecord(parsed)) {
        return { value: null, error: 'Saved app data is invalid. The saved data was left untouched.' };
      }

      if ((parsed.works !== undefined && !isWorkArray(parsed.works))
        || (parsed.annotations !== undefined && !isAnnotationArray(parsed.annotations))) {
        return { value: null, error: 'Saved library data is invalid. The saved data was left untouched.' };
      }
      return { value: parsed as Partial<PersistedAppState>, error: null };
    }

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || key === STORAGE_KEY) continue;

      const candidate = window.localStorage.getItem(key);
      if (!candidate) continue;
      try {
        const parsed: unknown = JSON.parse(candidate);
        if (isAppStateCandidate(parsed)) {
          return { value: parsed, error: null, legacyStorageKey: key };
        }
      } catch {
        continue;
      }
    }

    return { value: null, error: null };
  } catch {
    return { value: null, error: 'Saved app data could not be read. The saved data was left untouched.' };
  }
}

export function saveAppState(state: PersistedAppState, legacyStorageKey?: string): string | null {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (legacyStorageKey && legacyStorageKey !== STORAGE_KEY) {
      window.localStorage.removeItem(legacyStorageKey);
    }
    return null;
  } catch {
    return 'Changes could not be saved to this device. Storage may be full or unavailable.';
  }
}
