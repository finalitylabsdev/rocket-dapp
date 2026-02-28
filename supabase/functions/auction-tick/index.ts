import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function extractBearerToken(req: Request): string {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing authorization header.');
  }

  const [scheme, token] = authHeader.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new Error('Authorization header must be Bearer <token>.');
  }

  return token;
}

function assertAuthorized(req: Request, allowedTokens: string[]): void {
  const token = extractBearerToken(req);

  if (!allowedTokens.includes(token)) {
    throw new Error('Invalid authorization token.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function resolveConfig() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const serviceRoleFallback = Deno.env.get('AUCTION_TICK_SERVICE_ROLE_FALLBACK');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.');
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    serviceRoleFallback,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabaseUrl, serviceRoleKey, serviceRoleFallback } = resolveConfig();
    const allowedTokens = [serviceRoleKey];

    if (serviceRoleFallback) {
      allowedTokens.push(serviceRoleFallback);
    }

    assertAuthorized(req, allowedTokens);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await admin.rpc('run_auction_tick');
    if (error) {
      throw new Error(error.message);
    }

    const payload = isRecord(data) ? data : null;
    if (payload?.status === 'busy') {
      return jsonResponse({ error: 'Auction tick is already running.' }, 429);
    }

    return jsonResponse({
      status: typeof payload?.status === 'string' ? payload.status : 'ok',
      transitioned: Array.isArray(payload?.transitioned) ? payload.transitioned : [],
      finalized: Array.isArray(payload?.finalized) ? payload.finalized : [],
      started: payload?.started ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auction tick failed.';
    const status =
      message.includes('authorization') || message.includes('Invalid authorization') ? 401 :
      500;

    return jsonResponse({ error: message }, status);
  }
});
