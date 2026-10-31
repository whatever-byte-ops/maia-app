declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const MAX_HTML_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const ALLOWED_HOSTS = new Set(['archiveofourown.org', 'www.archiveofourown.org', 'web.archive.org']);

interface ImportTarget {
  fetchUrl: string;
  sourceUrl: string;
  sourceType: 'Live AO3' | 'Wayback Machine';
  snapshotDate?: string;
  originalUrl?: string;
  timestamp?: string;
}

class RemoteHttpError extends Error {
  constructor(readonly status: number) {
    super(`The remote site returned HTTP ${status}.`);
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function normalizeAo3Url(url: URL, allowInsecureOriginal = false, includeFullWork = true): URL {
  const validProtocol = url.protocol === 'https:' || (allowInsecureOriginal && url.protocol === 'http:');
  if (!validProtocol || !['archiveofourown.org', 'www.archiveofourown.org'].includes(url.hostname)) {
    throw new Error('Use an HTTPS AO3 work or chapter URL.');
  }
  if (!/^\/(?:works|chapters)\/\d+(?:\/chapters\/\d+)?\/?$/.test(url.pathname)) {
    throw new Error('Only AO3 work and chapter URLs are supported.');
  }
  const normalized = new URL(`${url.protocol}//archiveofourown.org${url.pathname}${url.search}`);
  if (includeFullWork && /^\/works\/\d+\/?$/.test(normalized.pathname)) normalized.searchParams.set('view_full_work', 'true');
  return normalized;
}

function parseTarget(input: string): ImportTarget {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Enter a complete AO3 or Wayback Machine URL.');
  }

  if (url.hostname === 'web.archive.org') {
    if (url.protocol !== 'https:' || !url.pathname.startsWith('/web/')) {
      throw new Error('Use an HTTPS Wayback snapshot URL.');
    }
    const snapshotMatch = url.pathname.match(/^\/web\/(\d{4,14})(?:[a-z_]+)?\/(https?:\/\/.+)$/i);
    if (!snapshotMatch) {
      throw new Error('The Wayback URL must include a dated AO3 snapshot.');
    }
    const original = normalizeAo3Url(new URL(snapshotMatch[2]), true, false);
    const snapshotDate = snapshotMatch[1].length >= 8
      ? `${snapshotMatch[1].slice(0, 4)}-${snapshotMatch[1].slice(4, 6)}-${snapshotMatch[1].slice(6, 8)}`
      : undefined;
    return {
      fetchUrl: `https://web.archive.org/web/${snapshotMatch[1]}id_/${original.href}`,
      sourceUrl: `https://archiveofourown.org${original.pathname}`,
      sourceType: 'Wayback Machine',
      originalUrl: original.href,
      timestamp: snapshotMatch[1],
      ...(snapshotDate ? { snapshotDate } : {})
    };
  }

  const original = normalizeAo3Url(url);
  return {
    fetchUrl: original.href,
    sourceUrl: `https://archiveofourown.org${original.pathname}`,
    sourceType: 'Live AO3'
  };
}

async function fetchHtml(url: string): Promise<string> {
  let currentUrl = new URL(url);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    if (currentUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(currentUrl.hostname)) {
      throw new Error('The import URL redirected to an unsupported host.');
    }
    const response = await fetch(currentUrl, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
      redirect: 'manual',
      signal: AbortSignal.timeout(20000)
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location || redirects === MAX_REDIRECTS) throw new Error('The remote site redirected too many times.');
      currentUrl = new URL(location, currentUrl);
      continue;
    }
    if (!response.ok) throw new RemoteHttpError(response.status);
    if (!response.headers.get('content-type')?.toLowerCase().includes('html')) {
      throw new Error('The requested page did not return HTML.');
    }

    const declaredLength = Number(response.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_HTML_BYTES) throw new Error('This work page is larger than the 8 MB import limit.');
    if (!response.body) throw new Error('The remote site returned an empty response.');

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_HTML_BYTES) {
        await reader.cancel();
        throw new Error('This work page is larger than the 8 MB import limit.');
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder().decode(bytes);
  }
  throw new Error('The remote site redirected too many times.');
}

async function findClosestWaybackSnapshot(originalUrl: string, timestamp: string): Promise<ImportTarget> {
  const availabilityUrl = new URL('https://archive.org/wayback/available');
  availabilityUrl.searchParams.set('url', originalUrl);
  availabilityUrl.searchParams.set('timestamp', timestamp);
  const response = await fetch(availabilityUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Wayback snapshot lookup returned HTTP ${response.status}.`);

  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !('archived_snapshots' in result)) {
    throw new Error('Wayback did not return snapshot information for this work.');
  }
  const snapshots = result.archived_snapshots;
  if (!snapshots || typeof snapshots !== 'object' || !('closest' in snapshots)) {
    throw new Error('No Wayback snapshot is available for this AO3 page.');
  }
  const closest = snapshots.closest;
  if (!closest || typeof closest !== 'object' || !('available' in closest) || closest.available !== true
    || !('url' in closest) || typeof closest.url !== 'string') {
    throw new Error('No Wayback snapshot is available for this AO3 page.');
  }

  const snapshotUrl = new URL(closest.url);
  if (snapshotUrl.protocol !== 'https:' || snapshotUrl.hostname !== 'web.archive.org') {
    throw new Error('Wayback returned an unsupported snapshot address.');
  }
  const snapshotTarget = parseTarget(snapshotUrl.href);
  if (snapshotTarget.sourceType !== 'Wayback Machine' || snapshotTarget.sourceUrl !== `https://archiveofourown.org${new URL(originalUrl).pathname}`) {
    throw new Error('Wayback returned a snapshot for a different page.');
  }
  return snapshotTarget;
}

async function fetchWaybackHtml(target: ImportTarget): Promise<{ html: string; snapshotDate?: string }> {
  try {
    return { html: await fetchHtml(target.fetchUrl), ...(target.snapshotDate ? { snapshotDate: target.snapshotDate } : {}) };
  } catch (error) {
    if (!(error instanceof RemoteHttpError) || error.status !== 404 || !target.originalUrl || !target.timestamp) throw error;
  }

  const replayUrl = `https://web.archive.org/web/${target.timestamp}/${target.originalUrl}`;
  try {
    return { html: await fetchHtml(replayUrl), ...(target.snapshotDate ? { snapshotDate: target.snapshotDate } : {}) };
  } catch (error) {
    if (!(error instanceof RemoteHttpError) || error.status !== 404) throw error;
  }

  const closest = await findClosestWaybackSnapshot(target.originalUrl, target.timestamp);
  return {
    html: await fetchHtml(closest.fetchUrl),
    ...(closest.snapshotDate ? { snapshotDate: closest.snapshotDate } : {})
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Use POST for work imports.' }, 405);

  try {
    const requestText = await request.text();
    if (requestText.length > 4096) {
      return jsonResponse({ error: 'Import requests must be smaller than 4 KB.' }, 400);
    }
    const body: unknown = JSON.parse(requestText);
    if (!body || typeof body !== 'object' || !('url' in body) || typeof body.url !== 'string' || body.url.length > 2048) {
      return jsonResponse({ error: 'Provide one AO3 or Wayback URL under 2048 characters.' }, 400);
    }
    const target = parseTarget(body.url);
    const result = target.sourceType === 'Wayback Machine'
      ? await fetchWaybackHtml(target)
      : { html: await fetchHtml(target.fetchUrl) };
    return jsonResponse({
      html: result.html,
      sourceUrl: target.sourceUrl,
      sourceType: target.sourceType,
      ...(result.snapshotDate ? { snapshotDate: result.snapshotDate } : {})
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Work import failed.';
    const status = /URL|HTTPS|supported|dated|provide|characters|complete/i.test(message) ? 400 : 502;
    return jsonResponse({ error: message }, status);
  }
});
