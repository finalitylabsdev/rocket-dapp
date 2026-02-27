# Reown AppKit Customization Handles

Status: Active implementation guide  
Date: 2026-02-27  
Audience: LLMs and engineers making focused wallet UX changes without reopening the old custom selector path.

## 1. Purpose

This app now uses Reown AppKit as the only wallet connection modal.

The shell buttons are still custom UI, but wallet selection, no-wallet fallback, install prompts, and wallet discovery come from Reown.  
Do not reintroduce browser wallet discovery, custom wallet lists, or a manual injected-wallet picker.

Current modal policy in this branch:

1. Ethereum mainnet only.
2. Wallet-only connection flow.
3. No email login.
4. No social login.
5. Curated wallet allowlist only.

## 2. Source of Truth Files

Use these files in this order:

1. `src/lib/reownAppKit.ts`
   - Owns Reown initialization, supported networks, metadata, and modal bootstrap.
2. `src/hooks/useWallet.ts`
   - Owns connect/disconnect behavior, Supabase session reconciliation, and stale-session recovery.
3. `src/lib/web3Auth.ts`
   - Owns SIWE signing and Supabase web3 session exchange for the already-connected Reown wallet.
4. `src/components/ShellNav.tsx`
   - Owns the shared shell connect button presentation.
5. `src/components/Hero.tsx`
   - Owns the home-page connect CTA presentation.

If a change affects wallet behavior, it should usually start in one of the first three files.

## 3. Safe Customization Handles

### 3.1 Reown Project Setup

Environment:

- `.env`
  - `VITE_REOWN_PROJECT_ID`

Rules:

1. Keep the Reown project ID in env, not hardcoded in TypeScript.
2. If the project ID changes, update `.env` only.
3. If env is missing, the app should fail clearly, not silently fall back to a custom selector.

### 3.2 Supported Networks and Default Chain

File:

- `src/lib/reownAppKit.ts`

Primary handles:

1. `networks`
2. `defaultNetwork`
3. `allowUnsupportedChain`

Use this file to:

1. Add or remove supported EVM networks.
2. Change the default chain shown by the modal.
3. Tighten unsupported-chain behavior.

Do not add a second network source elsewhere in the app.

Current branch setting:

1. `networks: [mainnet]`
2. `defaultNetwork: mainnet`
3. `allowUnsupportedChain: false`

### 3.3 Reown Branding and Modal Metadata

File:

- `src/lib/reownAppKit.ts`

Primary handles:

1. `metadata.name`
2. `metadata.description`
3. `metadata.url`
4. `metadata.icons`

Use this file to:

1. Change the app name shown in wallet clients.
2. Change the description shown during connection.
3. Change the canonical app URL used by wallet clients.
4. Swap the icon used by the modal and wallet handoff.

Keep metadata aligned with the deployed environment and brand docs.

### 3.4 Curated Wallet Allowlist

File:

- `src/lib/reownAppKit.ts`

Primary handles:

1. `includeWalletIds`
2. `featuredWalletIds`
3. `features.allWallets`
4. `features.connectorTypeOrder`
5. `enableEIP6963`

Current branch setting:

1. The modal is restricted to this allowlist:
   - MetaMask
   - Trust Wallet
   - Binance Wallet
   - OKX Wallet
   - Backpack
   - Phantom
2. The same curated list is also used as `featuredWalletIds` for the first-screen wallet cards.
3. `features.allWallets` is disabled.
4. `features.connectorTypeOrder` is set to `['featured']`.
5. `enableEIP6963` stays enabled so supported injected wallets still match cleanly.
6. The generic `WalletConnect` QR connector is disabled so the modal stays wallet-list driven.

Use this file to:

1. Reorder the curated list.
2. Swap one supported wallet for another.
3. Keep a deliberate allowlist instead of exposing the full WalletGuide catalog.

Do not:

1. Add a second wallet list elsewhere.
2. Turn on `allWallets` unless product explicitly wants the full catalog back.
3. Drop Backpack or Phantom accidentally when editing the list.

### 3.5 Connect Method Controls

File:

- `src/lib/reownAppKit.ts`

Primary handles:

1. `features.email`
2. `features.socials`
3. `features.connectMethodsOrder`

Current branch setting:

1. `email: false`
2. `socials: false`
3. `connectMethodsOrder: ['wallet']`

Use this file to:

1. Keep the modal wallet-only.
2. Re-enable email or social only if product direction changes.

Do not re-enable email/social as a side effect of unrelated wallet UI changes.

### 3.6 Connect Button UX

Files:

- `src/components/ShellNav.tsx`
- `src/components/Hero.tsx`
- `src/hooks/useWallet.ts`

Use these files to:

1. Change button labels, placement, or CTA copy.
2. Change when the app calls `wallet.connect()`.
3. Change loading and error messaging around connection.

Do not move wallet-selection logic into the components.  
Components should trigger `wallet.connect()` and render status only.

### 3.7 Session Reconciliation

Files:

- `src/hooks/useWallet.ts`
- `src/lib/web3Auth.ts`

Current behavior:

1. Reown provides the active wallet/provider state.
2. The app signs in to Supabase using the connected Reown wallet.
3. If the provider disconnects, switches accounts, or no longer matches the authenticated Supabase wallet, the stale session is cleared and the user is prompted to reconnect.

Safe changes here:

1. Refine user-facing error copy.
2. Refine when reconnect prompts appear.
3. Improve telemetry around connect/disconnect events.

Unsafe changes here:

1. Bypassing `signInWithConnectedEthereumWallet()`.
2. Keeping a stale Supabase session after wallet mismatch.
3. Adding a second wallet state machine outside `useWallet`.

### 3.8 SIWE and Auth Exchange

File:

- `src/lib/web3Auth.ts`

Primary handles:

1. `SIWE_STATEMENT`
2. `getConfiguredSiweUri()`
3. `getConfiguredSiweDomain()`
4. `signInWithConnectedEthereumWallet()`

Use this file to:

1. Adjust the SIWE statement text.
2. Override SIWE domain/URI behavior via env.
3. Keep the wallet-auth flow pinned to the currently connected Reown provider.

Do not replace this with a second direct wallet prompt.

## 4. Guardrails

These are branch-level rules and should be preserved unless product direction changes explicitly:

1. Reown/AppKit is the only wallet selection modal.
2. `useWallet()` is the only client-side source of wallet session state.
3. `web3Auth.ts` must authenticate the currently connected Reown wallet, not discover new wallets on its own.
4. Shell and hero components may change presentation, but not wallet-provider logic.
5. ETH lock and other privileged actions must read the already-connected wallet context; they must not open their own wallet picker.
6. Do not change Supabase backend verification behavior in wallet-UX-only passes.

## 5. Common Change Recipes

### 5.1 Change the Default Wallet Onboarding Feel

Edit:

1. `src/lib/reownAppKit.ts` for modal configuration.
2. `src/components/ShellNav.tsx` and `src/components/Hero.tsx` for copy.

Do not:

1. Rebuild a custom provider chooser.
2. Add manual `window.ethereum` probing.

### 5.2 Add or Remove Supported Chains

Edit:

1. The Reown `networks` array in `src/lib/reownAppKit.ts`.
2. Any chain-specific copy if needed.

Then verify:

1. Connect flow still opens.
2. Account switching still clears stale Supabase sessions correctly.
3. ETH lock flows still show the right reconnect guidance if the wallet state no longer matches auth.

### 5.3 Change Connect Error Copy

Edit:

1. `src/hooks/useWallet.ts` for user-facing connect/disconnect/session mismatch errors.
2. `src/lib/web3Auth.ts` for SIWE/auth-specific failures.

Keep:

1. Errors explicit.
2. Reconnect guidance short and actionable.

## 6. What Not To Reintroduce

Do not add any of the following back into the client:

1. A custom injected-wallet picker modal.
2. EIP-6963 provider discovery logic in app code.
3. A `window.ethereum` fallback flow that bypasses Reown.
4. Multiple independent copies of connected wallet state.

## 7. Acceptance Check For Future Changes

A wallet customization change is acceptable only if all of the following remain true:

1. Clicking connect opens Reown AppKit.
2. Users without an installed wallet still get Reown's built-in onboarding/install path.
3. Switching accounts or disconnecting clears stale authenticated shell state.
4. Privileged flows reuse the connected wallet instead of rediscovering providers.
5. No old custom wallet selector code path is reintroduced.
