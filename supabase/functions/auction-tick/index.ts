import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MS = 30_000;
let lastInvocationAt = 0;

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

function assertRateLimit(): void {
  const now = Date.now();
  if (now - lastInvocationAt < RATE_LIMIT_MS) {
    throw new Error('Rate limit exceeded.');
  }
  lastInvocationAt = now;
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
    assertRateLimit();

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: roundsToTransition, error: transitionQueryError } = await admin
      .from('auction_rounds')
      .select('id')
      .eq('status', 'accepting_submissions')
      .lte('submission_ends_at', new Date().toISOString())
      .order('submission_ends_at', { ascending: true });

    if (transitionQueryError) {
      throw new Error(transitionQueryError.message);
    }

    const transitioned: unknown[] = [];
    for (const round of roundsToTransition ?? []) {
      const { data, error } = await admin.rpc('transition_auction_to_bidding', {
        p_round_id: round.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      transitioned.push(data);
    }

    const { data: roundsToFinalize, error: finalizeQueryError } = await admin
      .from('auction_rounds')
      .select('id')
      .eq('status', 'bidding')
      .lte('ends_at', new Date().toISOString())
      .order('ends_at', { ascending: true });

    if (finalizeQueryError) {
      throw new Error(finalizeQueryError.message);
    }

    const finalized: unknown[] = [];
    for (const round of roundsToFinalize ?? []) {
      const { data, error } = await admin.rpc('finalize_auction', {
        p_round_id: round.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      finalized.push(data);
    }

    const { data: started, error: startError } = await admin.rpc('start_auction_round');
    if (startError) {
      throw new Error(startError.message);
    }

    return jsonResponse({
      status: 'ok',
      transitioned,
      finalized,
      started,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auction tick failed.';
    const status =
      message === 'Rate limit exceeded.' ? 429 :
      message.includes('authorization') || message.includes('Invalid authorization') ? 401 :
      500;

    return jsonResponse({ error: message }, status);
  }
});
