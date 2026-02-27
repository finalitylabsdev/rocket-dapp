const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabasePublicKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
const rawSiweUri = import.meta.env.VITE_SIWE_URI;

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
