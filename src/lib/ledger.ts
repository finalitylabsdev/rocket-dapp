import { supabase } from './supabase';

const BROWSER_ID_STORAGE_KEY = 'phinet-browser-id';
const GAME_STATE_STORAGE_KEY = 'phinet-game-state';

function fallbackUuid(): string {
  const part = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `${part()}${part()}-${part()}-${part()}-${part()}-${part()}${part()}${part()}`;
}

function getOrCreateBrowserId(): string | null {
  try {
    const existing = localStorage.getItem(BROWSER_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const created =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : fallbackUuid();

    localStorage.setItem(BROWSER_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}

function readStateSnapshot(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(GAME_STATE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore malformed local state and continue with an empty snapshot.
  }

  return {};
}

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

  const browserId = getOrCreateBrowserId();
  if (!browserId) {
    return;
  }

  const { error } = await supabase.rpc(rpcName, {
    p_browser_id: browserId,
    p_wallet_address: walletAddress,
    p_state: readStateSnapshot(),
    p_client_timestamp: new Date().toISOString(),
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });

  if (error) {
    console.error(`Failed to record ${rpcName} event:`, error.message);
  }
}
