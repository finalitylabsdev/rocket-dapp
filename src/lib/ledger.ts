import { supabase } from './supabase';

export interface WalletAuthEventResult {
  ok: boolean;
  message: string | null;
  cause: string | null;
}

export async function recordWalletConnect(walletAddress: string): Promise<WalletAuthEventResult> {
  return recordWalletAuthEvent('record_wallet_connect', walletAddress);
}

export async function recordWalletDisconnect(walletAddress: string): Promise<WalletAuthEventResult> {
  return recordWalletAuthEvent('record_wallet_disconnect', walletAddress);
}

async function recordWalletAuthEvent(
  rpcName: 'record_wallet_connect' | 'record_wallet_disconnect',
  walletAddress: string,
): Promise<WalletAuthEventResult> {
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  if (!normalizedWalletAddress) {
    return {
      ok: false,
      message: buildLedgerFailureMessage(rpcName),
      cause: 'Wallet activity log skipped because the wallet address was invalid.',
    };
  }

  if (!supabase) {
    return {
      ok: false,
      message: buildLedgerFailureMessage(rpcName),
      cause: 'Wallet activity log is unavailable because Supabase is not configured.',
    };
  }

  const rpcPayload = {
    p_wallet_address: normalizedWalletAddress,
    p_client_timestamp: new Date().toISOString(),
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  };

  let { error } = await supabase.rpc(rpcName, rpcPayload);

  // Backward compatibility for projects that still expose the older 5-arg RPC signature.
  if (error && isMissingRpcSignature(error.message)) {
    const legacyPayload = {
      ...rpcPayload,
      p_browser_id: null,
      p_state: {},
    };

    ({ error } = await supabase.rpc(rpcName, legacyPayload));
  }

  if (error) {
    return {
      ok: false,
      message: buildLedgerFailureMessage(rpcName),
      cause: error.message,
    };
  }

  return {
    ok: true,
    message: null,
    cause: null,
  };
}

function isMissingRpcSignature(message: string | undefined): boolean {
  if (!message) {
    return false;
  }

  return (
    message.includes('Could not find the function public.record_wallet_') &&
    message.includes('in the schema cache')
  );
}

function normalizeWalletAddress(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

function buildLedgerFailureMessage(
  rpcName: 'record_wallet_connect' | 'record_wallet_disconnect',
): string {
  return rpcName === 'record_wallet_connect'
    ? 'Wallet connected, but the activity log could not be recorded.'
    : 'Wallet disconnected, but the activity log could not be recorded.';
}
