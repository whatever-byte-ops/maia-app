import type { Work } from '../types';
import { getSupabaseClient } from './supabase';
import { parseAo3Html } from './htmlImport';

interface RemoteImportResponse {
  html: string;
  sourceUrl: string;
  sourceType: 'Live AO3' | 'Wayback Machine';
  snapshotDate?: string;
}

export async function importAo3Url(input: string): Promise<Work> {
  let sourceUrl: URL;
  try {
    sourceUrl = new URL(input.trim());
  } catch {
    throw new Error('Enter a complete AO3 or Wayback Machine URL.');
  }

  const supabase = await getSupabaseClient();
  if (!supabase) {
    throw new Error('URL import needs your Supabase project configuration. Local HTML and EPUB imports do not.');
  }

  const { data, error } = await supabase.functions.invoke<RemoteImportResponse>('import-work', {
    body: { url: sourceUrl.href }
  });
  if (error) {
    let detail = error.message;
    const errorContext = 'context' in error ? error.context : null;
    if (errorContext instanceof Response) {
      if (errorContext.status === 401) {
        detail = 'Sign in to import AO3 or Wayback URLs.';
      } else if (errorContext.status === 404) {
        detail = 'Deploy the Supabase import-work function, then try again.';
      } else {
        const responseText = await errorContext.text();
        if (responseText) {
          try {
            const responseBody: unknown = JSON.parse(responseText);
            if (responseBody && typeof responseBody === 'object' && 'error' in responseBody && typeof responseBody.error === 'string') {
              detail = responseBody.error;
            } else {
              detail = `Import service returned HTTP ${errorContext.status}.`;
            }
          } catch {
            detail = `Import service returned HTTP ${errorContext.status}.`;
          }
        }
      }
    }
    throw new Error(`Could not import this work. ${detail}`);
  }
  if (!data || typeof data.html !== 'string' || typeof data.sourceUrl !== 'string') {
    throw new Error('The import service returned an invalid response.');
  }

  const work = parseAo3Html(data.html, {
    sourceUrl: data.sourceUrl,
    sourceType: data.sourceType,
    snapshotDate: data.snapshotDate
  });
  return work;
}
