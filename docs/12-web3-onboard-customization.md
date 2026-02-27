# Web3-Onboard Customization Handles

Status: Active implementation guide  
Date: 2026-02-27  
Audience: LLMs and engineers making focused wallet UX changes without reopening the old custom selector path.

## 1. Purpose

This app now uses Web3-Onboard as the only wallet connection modal.

The shell buttons are still custom UI, but wallet selection, no-wallet fallback, install prompts, and injected-wallet discovery come from Web3-Onboard.  
Do not reintroduce browser wallet discovery, custom wallet lists in the app shell, or a manual injected-wallet picker.

Current modal policy in this branch:

1. Ethereum mainnet only.
2. Wallet-only connection flow.
3. Injected wallets only.
4. Curated wallet list only.
5. No account center or Web3-Onboard toast UI layered over the app shell.

## 2. Source of Truth Files

Use these files in this order:

1. `src/lib/web3Onboard.ts`
   - Owns Web3-Onboard initialization, supported chains, wallet curation, install messaging, and modal behavior.
2. `src/hooks/useWallet.ts`
   - Owns connect/disconnect behavior, Supabase session reconciliation, and stale-session recovery.
3. `src/lib/web3Auth.ts`
   - Owns SIWE signing and Supabase web3 session exchange for the already-connected wallet provider.
4. `src/components/ShellNav.tsx`
   - Owns the shared shell connect button presentation.
5. `src/components/Hero.tsx`
   - Owns the home-page connect CTA presentation.

If a change affects wallet behavior, it should usually start in one of the first three files.

## 3. Safe Customization Handles

### 3.1 RPC and Mainnet Setup

Environment:

- `.env`
  - `VITE_MAINNET_RPC_URL`

Rules:

1. Keep the RPC URL in env, not hardcoded in components.
2. If the RPC provider changes, update `.env` first.
3. The app may keep a sane public-RPC fallback in `src/lib/web3Onboard.ts`, but production should still set the env explicitly.

### 3.2 Supported Networks

File:

- `src/lib/web3Onboard.ts`

Primary handles:

1. `WEB3_ONBOARD_MAINNET_CHAIN_ID`
2. `chains`
3. `WEB3_ONBOARD_MAINNET_CHAIN_DECIMAL`

Current branch setting:

1. One supported chain only: Ethereum mainnet (`0x1` / `1`).
2. `useWallet.ts` attempts to switch the connected wallet back to mainnet before SIWE auth.

Use this file to:

1. Add or remove supported EVM networks.
2. Change the default RPC or block explorer metadata.
3. Keep the chain constants synchronized with `useWallet.ts`.

Do not define chain ids in multiple places.

### 3.3 Branding and Wallet Metadata

File:

- `src/lib/web3Onboard.ts`

Primary handles:

1. `appMetadata.name`
2. `appMetadata.icon`
3. `appMetadata.description`
4. `appMetadata.recommendedInjectedWallets`

Use this file to:

1. Change the app name shown by wallet clients.
2. Change the icon or description shown during connection.
3. Control which wallets are recommended when no injected wallet is detected.

Keep metadata aligned with the deployed environment and brand docs.

### 3.4 Curated Wallet List

File:

- `src/lib/web3Onboard.ts`

Primary handles:

1. `curatedWalletOrder`
2. `displayedUnavailableWallets`
3. `displayUnavailable`
4. `sort`
5. `filter`
6. `custom`

Current branch setting:

1. The modal is restricted to this curated list:
   - MetaMask
   - Trust Wallet
   - Binance Smart Wallet
   - OKX Wallet
   - Phantom
   - Backpack
2. Wallets outside that list are filtered out of the visible modal ordering.
3. Unavailable wallets from that same curated list still appear with install guidance.
4. Backpack is added as a custom injected wallet entry so it remains first-class even when browser detection is inconsistent.

Use this file to:

1. Reorder the curated list.
2. Swap one supported wallet for another.
3. Change which unavailable wallets are shown with install/download prompts.
4. Tune the custom Backpack definition if browser providers change shape.

Do not:

1. Add a second wallet list elsewhere.
2. Restore generic detected-wallet rows in the shell UI.
3. Drop Backpack or Phantom accidentally when editing the list.

### 3.5 No-Wallet Installed UX

File:

- `src/lib/web3Onboard.ts`

Primary handles:

1. `appMetadata.recommendedInjectedWallets`
2. `connect.iDontHaveAWalletLink`
3. `connect.wheresMyWalletLink`
4. `walletUnavailableMessage`

Current branch behavior:

1. If no supported wallet is installed, Web3-Onboard still shows curated unavailable wallets.
2. Each unavailable wallet can render a direct install/download hint.
3. The generic "I don't have a wallet" and "Where's my wallet?" helper links are controlled centrally here.

Use this file to:

1. Improve install messaging.
2. Point users to a better wallet-education page.
3. Change the recommended install targets.

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

1. Web3-Onboard provides the active wallet/provider state.
2. The app signs in to Supabase using the connected provider that Web3-Onboard already selected.
3. If the provider disconnects, switches accounts, or no longer matches the authenticated Supabase wallet, the stale session is cleared and the user is prompted to reconnect.

Safe changes here:

1. Refine user-facing error copy.
2. Refine when reconnect prompts appear.
3. Improve telemetry around connect/disconnect events.

Unsafe changes here:

1. Bypassing `signInWithConnectedEthereumWallet()`.
2. Keeping a stale Supabase session after wallet mismatch.
3. Adding a second wallet state machine outside `useWallet()`.
4. Letting another flow rediscover providers independently of Web3-Onboard.

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
3. Keep the wallet-auth flow pinned to the currently connected provider.

Do not replace this with a second direct wallet prompt.

## 4. Guardrails

These are branch-level rules and should be preserved unless product direction changes explicitly:

1. Web3-Onboard is the only wallet selection modal.
2. `useWallet()` is the only client-side source of wallet session state.
3. `web3Auth.ts` must authenticate the currently connected wallet, not discover new wallets on its own.
4. Shell and hero components may change presentation, but not wallet-provider logic.
5. ETH lock and other privileged actions must read the already-connected wallet context; they must not open their own wallet picker.
6. Do not change Supabase backend verification behavior in wallet-UX-only passes.

## 5. Common Change Recipes

### 5.1 Change the Wallet Ordering

Edit:

1. `curatedWalletOrder` in `src/lib/web3Onboard.ts`.
2. `displayedUnavailableWallets` in `src/lib/web3Onboard.ts` if install prompts should match.

Then verify:

1. Clicking connect still opens Web3-Onboard.
2. Only the intended wallets are visible.
3. Unavailable wallets still show install guidance.

### 5.2 Add or Remove Supported Chains

Edit:

1. The `chains` array in `src/lib/web3Onboard.ts`.
2. The mainnet constants used by `useWallet.ts`.
3. Any chain-specific copy if needed.

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
2. Manual `window.ethereum` discovery outside `src/lib/web3Onboard.ts`.
3. A second wallet auth flow that bypasses Web3-Onboard.
4. Multiple independent copies of connected wallet state.

## 7. Acceptance Check For Future Changes

A wallet customization change is acceptable only if all of the following remain true:

1. Clicking connect opens Web3-Onboard.
2. Users without an installed wallet still get built-in onboarding/install guidance.
3. Switching accounts or disconnecting clears stale authenticated shell state.
4. Privileged flows reuse the connected wallet instead of rediscovering providers.
5. No old custom wallet selector code path is reintroduced.
