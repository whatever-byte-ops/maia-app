import type { Annotation, ReaderSettings, ThemePreset, Work } from '../types';
import { getSupabaseClient } from './supabase';
import { isAnnotationArray, isWorkArray } from './appStorage';

export interface SyncableLibraryState {
  works: Work[];
  annotations: Annotation[];
  currentTheme: ThemePreset;
  readerSettings: ReaderSettings;
}

export interface LibrarySyncResult {
  state: SyncableLibraryState;
  updatedAt: string;
  addedWorks: number;
  addedAnnotations: number;
}

function getStorageErrorMessage(error: { code?: string; message: string }, action: string): string {
  const missingTable = error.code === 'PGRST205'
    || error.code === '42P01'
    || (error.message.includes('user_library_state')
      && (error.message.includes('does not exist') || error.message.includes('schema cache')));
  if (missingTable) {
    return 'Cloud storage is not set up yet. In Supabase SQL Editor, run supabase/migrations/20261030000000_user_library_state.sql.';
  }
  return `${action}: ${error.message}`;
}

function isCloudLibraryPayload(value: unknown): value is Pick<SyncableLibraryState, 'works' | 'annotations'> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return isWorkArray(record.works) && isAnnotationArray(record.annotations);
}

function isEmptyCloudPayload(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).length === 0;
}

function mergeById<T extends { id: string }>(localItems: T[], cloudItems: T[]): T[] {
  const merged = new Map<string, T>();
  for (const item of cloudItems) merged.set(item.id, item);
  for (const item of localItems) merged.set(item.id, item);
  return [...merged.values()];
}

export async function syncLibraryState(localState: SyncableLibraryState): Promise<LibrarySyncResult> {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured for this app.');

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`Unable to verify the signed-in account: ${userError.message}`);
  if (!userResult.user) throw new Error('Sign in before syncing your library.');

  const { data: cloudRow, error: readError } = await supabase
    .from('user_library_state')
    .select('payload')
    .eq('user_id', userResult.user.id)
    .maybeSingle();
  if (readError) throw new Error(getStorageErrorMessage(readError, 'Unable to read the cloud library'));

  let cloudState: Pick<SyncableLibraryState, 'works' | 'annotations'> | null = null;
  if (cloudRow?.payload && isCloudLibraryPayload(cloudRow.payload)) {
    cloudState = cloudRow.payload;
  } else if (cloudRow?.payload && !isEmptyCloudPayload(cloudRow.payload)) {
    throw new Error('The saved cloud library has an unexpected format. No data was changed.');
  }

  const works = mergeById(localState.works, cloudState?.works ?? []);
  const annotations = mergeById(localState.annotations, cloudState?.annotations ?? []);
  const state: SyncableLibraryState = {
    works,
    annotations,
    currentTheme: localState.currentTheme,
    readerSettings: localState.readerSettings
  };
  const updatedAt = new Date().toISOString();

  const { error: writeError } = await supabase
    .from('user_library_state')
    .upsert({
      user_id: userResult.user.id,
      payload: state,
      updated_at: updatedAt
    }, { onConflict: 'user_id' });
  if (writeError) throw new Error(getStorageErrorMessage(writeError, 'Unable to save the merged library to the cloud'));

  return {
    state,
    updatedAt,
    addedWorks: works.length - localState.works.length,
    addedAnnotations: annotations.length - localState.annotations.length
  };
}
