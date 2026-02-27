/*
  # Add explicit deny-all RLS policies for internal tables

  ## Summary
  - Adds explicit deny-all client policies for internal-only tables that should not be queried directly
  - Clears Security Advisor `RLS Enabled No Policy` findings without exposing new access
  - Uses defensive existence checks because some environments may have already dropped legacy tables
*/

DO $$
BEGIN
  IF to_regclass('public.app_logs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Deny direct client access" ON public.app_logs';
    EXECUTE 'CREATE POLICY "Deny direct client access" ON public.app_logs AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
  END IF;

  IF to_regclass('public.app_state_ledger') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Deny direct client access" ON public.app_state_ledger';
    EXECUTE 'CREATE POLICY "Deny direct client access" ON public.app_state_ledger AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
  END IF;

  IF to_regclass('public.browser_profiles') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Deny direct client access" ON public.browser_profiles';
    EXECUTE 'CREATE POLICY "Deny direct client access" ON public.browser_profiles AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
  END IF;

  IF to_regclass('public.browser_wallets') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Deny direct client access" ON public.browser_wallets';
    EXECUTE 'CREATE POLICY "Deny direct client access" ON public.browser_wallets AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
  END IF;

  IF to_regclass('public.wallet_registry') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Deny direct client access" ON public.wallet_registry';
    EXECUTE 'CREATE POLICY "Deny direct client access" ON public.wallet_registry AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)';
  END IF;
END;
$$;
