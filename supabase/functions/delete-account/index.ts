declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): void;
  env: { get(name: string): string | undefined };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function hasUserId(value: unknown): value is { id: string } {
  return Boolean(value && typeof value === 'object' && 'id' in value && typeof value.id === 'string');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return jsonResponse({ error: 'Sign in to delete your account.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Account deletion is not configured on the server.' }, 500);
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: authorization
    }
  });
  if (!userResponse.ok) return jsonResponse({ error: 'Your session is invalid or expired. Sign in again.' }, 401);
  const userData: unknown = await userResponse.json();
  if (!hasUserId(userData)) return jsonResponse({ error: 'Your session is invalid or expired. Sign in again.' }, 401);

  const deletionResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userData.id)}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  });
  if (!deletionResponse.ok) {
    return jsonResponse({ error: 'The account could not be deleted. Please try again later.' }, 500);
  }

  return jsonResponse({ success: true });
});
