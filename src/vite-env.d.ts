/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SPEC_WHITELIST_ETH?: string;
  readonly VITE_ETH_LOCK_RECIPIENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Eip1193RequestArguments {
  method: string;
  params?: unknown[] | object;
}

interface Eip1193Provider {
  request(args: Eip1193RequestArguments): Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

interface Window {
  ethereum?: Eip1193Provider;
}

declare const __APP_VERSION__: string;
