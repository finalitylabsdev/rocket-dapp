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

  const { error } = await supabase.rpc(rpcName, {
    p_wallet_address: walletAddress,
    p_client_timestamp: new Date().toISOString(),
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });

  if (error) {
    console.error(`Failed to record ${rpcName} event:`, error.message);
  }
}
