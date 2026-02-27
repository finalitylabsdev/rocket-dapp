import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EthLockStatus = 'pending' | 'sent' | 'verifying' | 'error' | 'confirmed';

interface VerificationInput {
  walletAddress: string;
  txHash: string;
}

interface SubmissionRow {
  id: number;
  wallet_address: string;
  auth_user_id: string;
  tx_hash: string | null;
  chain_id: number | null;
  from_address: string | null;
  to_address: string | null;
  amount_wei: string | null;
  status: EthLockStatus;
  verification_attempts: number | null;
}

interface RuntimeConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  ethRpcUrl: string;
  lockRecipient: string;
  lockAmountWei: bigint;
  minConfirmations: number;
  pollAttempts: number;
  pollIntervalMs: number;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalizeAddress(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

function normalizeTxHash(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return /^0x[0-9a-f]{64}$/.test(normalized) ? normalized : null;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveBigInt(value: string | undefined, fallback: bigint): bigint {
  if (!value) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    return fallback;
  }

  const parsed = BigInt(value);
  return parsed > 0n ? parsed : fallback;
}

function parseHexBigInt(value: unknown, field: string): bigint {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]+$/.test(value)) {
    throw new Error(`Missing or invalid ${field}.`);
  }

  return BigInt(value);
}

function toSafeNumber(value: bigint, field: string): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${field} exceeds safe integer range.`);
  }

  return Number(value);
}

function parseAmountWei(value: unknown): bigint | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = BigInt(value);
  return parsed > 0n ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function resolveConfig(): RuntimeConfig {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const ethRpcUrl = Deno.env.get('ETH_RPC_URL');

  if (!supabaseUrl || !supabaseServiceRoleKey || !ethRpcUrl) {
    throw new Error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ETH_RPC_URL.');
  }

  const lockRecipient = normalizeAddress(Deno.env.get('ETH_LOCK_RECIPIENT'));
  if (!lockRecipient) {
    throw new Error('ETH_LOCK_RECIPIENT must be a valid 0x address.');
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    ethRpcUrl,
    lockRecipient,
    lockAmountWei: parsePositiveBigInt(Deno.env.get('ETH_LOCK_AMOUNT_WEI'), 1_000_000_000_000_000n),
    minConfirmations: parsePositiveInt(Deno.env.get('ETH_LOCK_MIN_CONFIRMATIONS'), 1),
    pollAttempts: parsePositiveInt(Deno.env.get('ETH_LOCK_VERIFY_POLL_ATTEMPTS'), 8),
    pollIntervalMs: parsePositiveInt(Deno.env.get('ETH_LOCK_VERIFY_POLL_INTERVAL_MS'), 3_000),
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function ethRpcRequest(rpcUrl: string, method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(`ETH RPC request failed (${response.status}) for ${method}.`);
  }

  if (!isRecord(payload)) {
    throw new Error(`Invalid ETH RPC response for ${method}.`);
  }

  if (payload.error) {
    const rpcError = isRecord(payload.error) && typeof payload.error.message === 'string'
      ? payload.error.message
      : 'unknown RPC error';
    throw new Error(`ETH RPC ${method} failed: ${rpcError}`);
  }

  return payload.result ?? null;
}

function extractInput(raw: unknown): VerificationInput {
  if (!isRecord(raw)) {
    throw new Error('Request body must be a JSON object.');
  }

  const directWallet = normalizeAddress(raw.walletAddress);
  const directHash = normalizeTxHash(raw.txHash);
  if (directWallet && directHash) {
    return {
      walletAddress: directWallet,
      txHash: directHash,
    };
  }

  if (isRecord(raw.record)) {
    const webhookWallet = normalizeAddress(raw.record.wallet_address);
    const webhookHash = normalizeTxHash(raw.record.tx_hash);
    if (webhookWallet && webhookHash) {
      return {
        walletAddress: webhookWallet,
        txHash: webhookHash,
      };
    }
  }

  throw new Error('walletAddress and txHash are required.');
}

async function logEvent(
  admin: ReturnType<typeof createClient>,
  row: SubmissionRow,
  eventName: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin
    .from('app_logs')
    .insert({
      event_name: eventName,
      wallet_address: row.wallet_address,
      auth_user_id: row.auth_user_id,
      payload,
      client_timestamp: new Date().toISOString(),
      user_agent: 'verify-eth-lock-edge-function',
    });

  if (error) {
    console.error('Failed to write app_logs entry:', error.message);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  let config: RuntimeConfig;
  try {
    config = resolveConfig();
  } catch (configError) {
    const message = configError instanceof Error ? configError.message : 'Invalid runtime configuration.';
    return jsonResponse({ error: message }, 500);
  }

  let input: VerificationInput;
  try {
    const body = await req.json();
    input = extractInput(body);
  } catch (bodyError) {
    const message = bodyError instanceof Error ? bodyError.message : 'Invalid request body.';
    return jsonResponse({ error: message }, 400);
  }

  const admin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);

  const { data: submissionRaw, error: submissionError } = await admin
    .from('eth_lock_submissions')
    .select('id, wallet_address, auth_user_id, tx_hash, chain_id, from_address, to_address, amount_wei, status, verification_attempts')
    .eq('wallet_address', input.walletAddress)
    .maybeSingle();

  if (submissionError) {
    return jsonResponse({ error: submissionError.message }, 500);
  }

  if (!submissionRaw) {
    return jsonResponse({ error: 'ETH lock submission not found for wallet.' }, 404);
  }

  const submission = submissionRaw as SubmissionRow;

  if (submission.tx_hash && submission.tx_hash !== input.txHash) {
    return jsonResponse({
      error: 'Wallet submission tx hash does not match the requested tx hash.',
    }, 409);
  }

  if (submission.status === 'confirmed') {
    return jsonResponse({
      status: 'confirmed',
      message: 'ETH lock already confirmed.',
    });
  }

  const verificationAttempts = (submission.verification_attempts ?? 0) + 1;
  const nowIso = new Date().toISOString();

  const { error: markVerifyingError } = await admin
    .from('eth_lock_submissions')
    .update({
      status: 'verifying',
      last_error: null,
      verifying_started_at: nowIso,
      verification_attempts: verificationAttempts,
      updated_at: nowIso,
    })
    .eq('id', submission.id);

  if (markVerifyingError) {
    return jsonResponse({ error: markVerifyingError.message }, 500);
  }

  let txResult: unknown = null;
  let receiptResult: unknown = null;

  for (let attempt = 0; attempt < config.pollAttempts; attempt += 1) {
    txResult = await ethRpcRequest(config.ethRpcUrl, 'eth_getTransactionByHash', [input.txHash]);
    receiptResult = await ethRpcRequest(config.ethRpcUrl, 'eth_getTransactionReceipt', [input.txHash]);

    if (isRecord(receiptResult)) {
      break;
    }

    if (attempt < config.pollAttempts - 1) {
      await sleep(config.pollIntervalMs);
    }
  }

  if (!isRecord(receiptResult)) {
    await admin
      .from('eth_lock_submissions')
      .update({
        status: 'verifying',
        last_error: 'Transaction pending confirmation.',
        receipt: {
          transaction: isRecord(txResult) ? txResult : null,
          receipt: null,
          checks: {
            min_confirmations: config.minConfirmations,
            confirmations: 0,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission.id);

    return jsonResponse({
      status: 'verifying',
      message: 'Transaction is pending confirmation.',
    }, 202);
  }

  try {
    if (!isRecord(txResult)) {
      throw new Error('Transaction details are unavailable.');
    }

    const txHash = normalizeTxHash(txResult.hash);
    const txFrom = normalizeAddress(txResult.from);
    const txTo = normalizeAddress(txResult.to);
    const txValueWei = parseHexBigInt(txResult.value, 'transaction value');

    if (!txHash || txHash !== input.txHash) {
      throw new Error('Transaction hash mismatch.');
    }

    const expectedFrom = normalizeAddress(submission.from_address) ?? input.walletAddress;
    if (!txFrom || txFrom !== expectedFrom) {
      throw new Error('Transaction sender does not match the wallet lock submission.');
    }

    if (!txTo || txTo !== config.lockRecipient) {
      throw new Error('Transaction recipient does not match ETH_LOCK_RECIPIENT.');
    }

    const expectedAmountWei = parseAmountWei(submission.amount_wei) ?? config.lockAmountWei;
    if (txValueWei !== expectedAmountWei || txValueWei !== config.lockAmountWei) {
      throw new Error('Transaction amount does not match required ETH lock amount.');
    }

    const receiptStatus = parseHexBigInt(receiptResult.status, 'receipt status');
    if (receiptStatus !== 1n) {
      throw new Error('Transaction reverted on-chain.');
    }

    const receiptBlockNumber = parseHexBigInt(receiptResult.blockNumber, 'receipt block number');
    const latestBlockRaw = await ethRpcRequest(config.ethRpcUrl, 'eth_blockNumber', []);
    const latestBlockNumber = parseHexBigInt(latestBlockRaw, 'latest block number');
    const confirmationsBigInt = latestBlockNumber >= receiptBlockNumber
      ? (latestBlockNumber - receiptBlockNumber + 1n)
      : 0n;
    const confirmations = toSafeNumber(confirmationsBigInt, 'Confirmations');

    if (confirmations < config.minConfirmations) {
      await admin
        .from('eth_lock_submissions')
        .update({
          status: 'verifying',
          block_number: toSafeNumber(receiptBlockNumber, 'Block number'),
          last_error: `Waiting for confirmations (${confirmations}/${config.minConfirmations}).`,
          receipt: {
            transaction: txResult,
            receipt: receiptResult,
            checks: {
              min_confirmations: config.minConfirmations,
              confirmations,
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      return jsonResponse({
        status: 'verifying',
        message: `Waiting for confirmations (${confirmations}/${config.minConfirmations}).`,
        confirmations,
      }, 202);
    }

    const confirmTime = new Date().toISOString();

    const { error: confirmError } = await admin
      .from('eth_lock_submissions')
      .update({
        status: 'confirmed',
        block_number: toSafeNumber(receiptBlockNumber, 'Block number'),
        from_address: txFrom,
        to_address: txTo,
        amount_wei: txValueWei.toString(),
        receipt: {
          transaction: txResult,
          receipt: receiptResult,
          checks: {
            min_confirmations: config.minConfirmations,
            confirmations,
          },
          verified_at: confirmTime,
        },
        last_error: null,
        confirmed_at: confirmTime,
        updated_at: confirmTime,
      })
      .eq('id', submission.id);

    if (confirmError) {
      throw new Error(confirmError.message);
    }

    await logEvent(admin, submission, 'eth_lock_confirmed', {
      submission_id: submission.id,
      tx_hash: input.txHash,
      confirmations,
      min_confirmations: config.minConfirmations,
      block_number: toSafeNumber(receiptBlockNumber, 'Block number'),
      amount_wei: txValueWei.toString(),
      to: txTo,
    });

    return jsonResponse({
      status: 'confirmed',
      message: 'ETH lock transaction confirmed and verified.',
      confirmations,
    });
  } catch (verifyError) {
    const errorMessage = verifyError instanceof Error ? verifyError.message : 'ETH lock verification failed.';
    const errorTime = new Date().toISOString();

    await admin
      .from('eth_lock_submissions')
      .update({
        status: 'error',
        last_error: errorMessage,
        receipt: {
          transaction: isRecord(txResult) ? txResult : null,
          receipt: isRecord(receiptResult) ? receiptResult : null,
          checks: {
            min_confirmations: config.minConfirmations,
          },
          failed_at: errorTime,
        },
        updated_at: errorTime,
      })
      .eq('id', submission.id);

    await logEvent(admin, submission, 'eth_lock_error', {
      submission_id: submission.id,
      tx_hash: input.txHash,
      error: errorMessage,
    });

    return jsonResponse({
      status: 'error',
      error: errorMessage,
    }, 422);
  }
});
