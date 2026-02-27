import { supabase } from './supabase';

export async function recordWalletConnect(walletAddress: string): Promise<void> {
  await recordWalletAuthEvent('record_wallet_connect', walletAddress);
}

export async function recordWalletDisconnect(walletAddress: string): Promise<void> {
  await recordWalletAuthEvent('record_wallet_disconnect', walletAddress);
}

async function recordWalletAuthEvent(
  rpcName: 'record_wallet_connect' | 'record_wallet_disconnect',
  walletAddress: string,
): Promise<void> {
  if (!supabase) {
    return;
  }

  const rpcPayload = {
    p_wallet_address: walletAddress,
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
    console.error(`Failed to record ${rpcName} event:`, error.message);
  }
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
