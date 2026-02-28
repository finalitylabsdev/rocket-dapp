const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabasePublicKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
const rawSiweUri = import.meta.env.VITE_SIWE_URI;
const rawEthLockRecipient = import.meta.env.VITE_ETH_LOCK_RECIPIENT;

function computeWalletAuthConfigIssues(): string[] {
  const issues: string[] = [];

  if (typeof rawSupabaseUrl !== 'string' || rawSupabaseUrl.trim().length === 0) {
    issues.push('VITE_SUPABASE_URL is missing.');
  } else {
    try {
      new URL(rawSupabaseUrl);
    } catch {
      issues.push('VITE_SUPABASE_URL must be a valid URL.');
    }
  }

  if (typeof rawSupabasePublicKey !== 'string' || rawSupabasePublicKey.trim().length === 0) {
    issues.push('Set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.');
  }

  if (typeof rawSiweUri === 'string' && rawSiweUri.trim().length > 0) {
    try {
      new URL(rawSiweUri);
    } catch {
      issues.push('VITE_SIWE_URI must be a valid URL when provided.');
    }
  }

  if (typeof rawEthLockRecipient === 'string' && rawEthLockRecipient.trim().length > 0) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(rawEthLockRecipient.trim())) {
      issues.push('VITE_ETH_LOCK_RECIPIENT must be a valid 0x address when provided.');
    }
  }

  return issues;
}

const walletAuthConfigIssues = computeWalletAuthConfigIssues();

export function getWalletAuthConfigIssues(): string[] {
  return [...walletAuthConfigIssues];
}

export function getWalletAuthConfigErrorMessage(): string | null {
  if (walletAuthConfigIssues.length === 0) {
    return null;
  }

  return `Wallet authentication is unavailable. ${walletAuthConfigIssues.join(' ')}`;
}

/**
 * Returns true if any critical env vars are missing or invalid.
 * Critical = the app cannot function at all without them.
 */
export function hasCriticalConfigErrors(): boolean {
  return walletAuthConfigIssues.some(
    (issue) => issue.includes('VITE_SUPABASE_URL') || issue.includes('VITE_SUPABASE_PUBLISHABLE_KEY') || issue.includes('VITE_SUPABASE_ANON_KEY'),
  );
}
