# 17 - Pre-Launch Issues & Remediation Plan (Verified Pass)

This pass recalibrates the original audit against the current codebase. The earlier draft contained several valid findings, but it also included a few false positives and several claims that overstated the impact. Those items have been rewritten or deprioritized rather than removed so the issue numbers remain stable.

---

## P0 - Critical (Fix Before Launch)

### 1. Broken Rate Limiter in `auction-tick` Edge Function

`supabase/functions/auction-tick/index.ts:9,43-49`

The rate limit uses a module-level `let lastInvocationAt` value. That state only exists inside a single warm runtime and is not shared across concurrent Edge Function instances, so it does not provide a real cross-instance throttle.

**Fix:** Replace the in-memory guard with a DB-level advisory lock, serialized RPC, or a shared KV/Redis-backed timestamp check.

- [ ] Replace the in-memory rate limit with a shared lock or shared timestamp gate
- [ ] Add an integration test proving concurrent invocations are serialized

---

### 2. No Debouncing on Supabase Realtime Subscriptions

`src/hooks/useAuctions.ts:49-88`

`useAuctions()` subscribes to three realtime tables (`auction_rounds`, `auction_submissions`, `auction_bids`). Every matching event calls `refresh()`, and each refresh executes both `getActiveAuction()` and `getAuctionHistory()` via `Promise.all()`. A burst of events can therefore fan out into a burst of redundant reads.

**Fix:** Debounce or coalesce refreshes (for example, a 250-500 ms trailing window), or suppress overlapping in-flight refreshes.

- [ ] Wrap `refresh()` in a debounce or coalescing gate
- [ ] Ensure single events still update promptly
- [ ] Avoid overlapping refreshes while a fetch is already in flight

---

### 4. Weak Randomness Fallback for Nonces and Idempotency Keys

`src/lib/web3Auth.ts:78`, `src/lib/starVault.ts:337`, `src/lib/flux.ts:124`

These paths fall back to `Math.random()` when Web Crypto helpers are unavailable. That fallback is weaker and predictable compared with cryptographic randomness. In modern browsers the fallback path should rarely execute, but it is still the wrong failure mode for auth- and replay-sensitive values.

**Fix:** Remove the `Math.random()` fallback. If secure randomness is unavailable, fail closed.

- [ ] Remove the `Math.random()` fallback in `web3Auth.ts`
- [ ] Replace the fallback in `starVault.ts:createIdempotencyKey` with `crypto.randomUUID()` or throw
- [ ] Replace the fallback in `flux.ts` nonce generation with `crypto.randomUUID()` or throw

---

### 8. Nested `setTimeout()` Chains in LaunchSequence Leak on Unmount

`src/components/lab/LaunchSequence.tsx:319-355`

The animation sequence uses nested `setTimeout()` calls. Cleanup only clears the outer tracked timer and the countdown interval. Once the outer timer fires, inner timers are no longer tracked and can still run after unmount, causing state updates on an unmounted component.

**Fix:** Refactor to a single managed timer/state machine, or track all timer IDs and clear all of them on cleanup.

- [ ] Replace nested timers with a single managed sequence or explicit timer registry
- [ ] Verify unmount cleanup cancels every pending callback

---

## P1 - High (Fix Before Launch, After P0)

### 5. Shared Utility Duplication Across Core Lib Files

There is meaningful duplication across `nebulaBids.ts`, `starVault.ts`, `flux.ts`, `web3Auth.ts`, and config modules. The original draft overstated a few exact matches, but the underlying maintenance risk is real.

Notable duplication still worth cleaning up:

| Function / Type | Copies | Files |
|---|---|---|
| `assertSupabaseConfigured()` | 3 | nebulaBids, starVault, flux |
| `toNumber()` | 3 | nebulaBids, starVault, flux |
| `normalizeFluxBalance()` | 2 | nebulaBids, starVault |
| `FluxBalancePayload` | 2 | nebulaBids, starVault |
| `isRarityTier()` | 2 | nebulaBids, starVault |
| `readBooleanEnv()` | 2 | config/spec, config/flags |
| EIP-1193 provider guards | 3 | web3Auth, web3Onboard, useWallet |

**Fix:** Extract genuinely shared logic into common utilities, then converge call sites gradually.

- [ ] Create a shared utility module for common numeric / Supabase guard helpers
- [ ] Consolidate `normalizeFluxBalance` and `FluxBalancePayload`
- [ ] Unify the EIP-1193 provider guard shape across wallet-related code
- [ ] Deduplicate `readBooleanEnv`

---

### 6. Unvalidated External API Response (CoinGecko)

`src/hooks/usePrices.ts:40`

The CoinGecko response is cast directly to `PriceData` with no runtime validation. If the payload shape changes or contains bad values, downstream UI may render bad numbers, `undefined`, or fail while reading nested fields.

**Fix:** Validate the response shape before storing it.

- [ ] Add runtime validation for the expected CoinGecko response
- [ ] Fall back to a safe error state when validation fails

---

### 7. No Explicit JWT Expiration Check in Verifier Token Helper

`src/lib/ethLock.ts:206-222`

`getVerifierAuthToken()` returns `data.session?.access_token` without explicitly checking `expires_at`. Supabase may refresh sessions internally, so this is not proven broken today, but the helper currently assumes freshness instead of asserting it.

**Fix:** Make token freshness explicit rather than implicit.

- [ ] Check `expires_at` before returning the token
- [ ] Refresh or reject when the session is expired or near expiry

---

### 12. Insufficient Bid Input Validation

`src/components/mystery/BidInput.tsx:20-25`

`BidInput` only checks that the parsed number is finite and at least `minBid`. It does not enforce a maximum cap, and `step="0.01"` is only a browser hint, not real validation, so users can still submit over-precise or extremely large values.

**Fix:** Enforce validation in code, not just in input attributes.

- [ ] Add a maximum bid cap
- [ ] Enforce two-decimal precision in `handleSubmit`
- [ ] Show a specific validation error for out-of-range or over-precise values

---

### 14. Floating-Point Precision in Bid Math

`src/lib/nebulaBids.ts:324-331`

`computeMinNextBid()` uses floating-point math and then rounds with `Math.round(x * 100) / 100`. This can mis-round edge cases by a cent because of IEEE 754 behavior.

**Fix:** Move the calculation to integer cents (preferred) or a decimal helper.

- [ ] Rewrite the minimum-bid calculation using integer-cent math
- [ ] Add tests for half-cent boundary cases

---

### 17. Silent Ledger Failures

`src/lib/ledger.ts:38-40`

Ledger write failures are logged to `console.error` and then swallowed. Callers cannot tell that the record failed, so auth/connect flows continue as if the write succeeded.

**Fix:** Surface failure to the caller, or return an explicit status that callers can handle.

- [ ] Return a success/failure result from ledger writes or rethrow
- [ ] Decide whether connect/disconnect UX should warn when the ledger write fails
- [ ] Add address validation at the ledger boundary as defense in depth

---

### 22. No Startup Environment Validation

`src/lib/web3Auth.ts:404-415`

Missing env vars are mostly discovered lazily when the affected feature is used. That delays failure until a user action instead of failing clearly during app startup.

**Fix:** Validate required environment at boot and fail loudly in development.

- [ ] Add startup validation for required Supabase / auth configuration
- [ ] Emit clear error messages for missing or malformed env vars

---

### 25. No Catalog Caching

`src/lib/starVault.ts:295-329`

`fetchCatalog()` runs three queries and full normalization on every `useBoxTiers` mount. The catalog changes infrequently, so this creates unnecessary repeated reads.

**Fix:** Cache catalog results client-side with a simple TTL or shared module cache.

- [ ] Add a shared in-memory cache for catalog data
- [ ] Optionally persist cached catalog data with a short TTL
- [ ] Invalidate or bypass the cache on known admin/config changes

---

## P2 - Medium (Fix Around Launch)

### 9. Unused or Internal-Only Exports

Some of the originally flagged exports do appear unused by the rest of the app, but `AUCTION_SCHEDULER_ENABLED` is referenced internally inside `flags.ts` while building `featureFlags`, so it is not literally dead code.

Likely cleanup candidates:

| Export | File | Status |
|---|---|---|
| `RARITY_MULTIPLIER` | `src/config/spec.ts:54` | No current consumers |
| `RARITY_BOX_PRICE_FLUX` | `src/config/spec.ts:65` | No current consumers |
| `SPEC_FREEZE_VERSION` | `src/config/spec.ts:3` | No current consumers |
| `useFeatureFlags()` | `src/config/flags.ts:34-36` | No current consumers |

**Fix:** Remove, document, or keep intentionally with comments if they are reserved for near-term use.

- [ ] Confirm there is no planned near-term usage
- [ ] Remove unused exports or annotate intentional placeholders

---

### 10. Initial Auction Result Is Intentionally Suppressed on First History Load

`src/components/mystery/BidsTab.tsx:32-55`

This was previously described as stale mount state. That was incorrect. The actual behavior is that the first populated `history[0]` is intentionally skipped by `hasCompletedInitialLoad`, so the UI does not surface the most recent completed round until a newer round arrives.

This is a UX decision/quirk, not a correctness bug.

**Fix:** Clarify the intended behavior and adjust only if the product expectation is different.

- [ ] Decide whether the first loaded completed round should be surfaced immediately
- [ ] If yes, derive or sync `latestResult` from `history[0]` on initial load without auto-reopening the modal

---

### 11. No Explicit Realtime Connection Status Handling

`src/hooks/useAuctions.ts`, `src/context/GameState.tsx`

The app does not expose connection-loss state or explicit retry/backoff behavior at the application layer for these subscriptions. Supabase may reconnect internally, so the system is not proven permanently stale, but the UI currently gives no visibility into degraded realtime state.

**Fix:** Handle subscription status transitions explicitly.

- [ ] Add subscription status/error handling around realtime setup
- [ ] Surface a lightweight UI indicator when realtime is disconnected or retrying
- [ ] Decide whether to manually back off and resubscribe after terminal errors

---

### 13. RocketLab localStorage Write Is Not Guarded

`src/pages/RocketLabPage.tsx:121`

The `loadRocketLabState()` read path is already wrapped in `try/catch`, so the original crash claim was incorrect. The remaining risk here is the unguarded `localStorage.setItem()` in the persistence effect, which can still throw in private browsing or storage-restricted environments.

**Fix:** Guard the write path the same way the read path is guarded.

- [ ] Wrap the `localStorage.setItem()` effect in `try/catch`
- [ ] Fail silently or log a non-fatal warning when persistence is unavailable

---

### 18. Per-Instance `useCountdown` Intervals

`src/hooks/useCountdown.ts:38-49`

Each `useCountdown()` instance creates its own `setInterval(1000)`. That is structurally less efficient than a shared global tick, but the earlier "50+ active intervals" framing was overstated for the current UI, which mounts only a small number of countdowns today.

**Fix:** Only prioritize this if countdown usage expands.

- [ ] Keep under observation for now
- [ ] Move to a shared ticker if countdown usage scales up materially

---

### 20. Missing React Error Boundaries

There is no app-level React error boundary around major route sections. That is still worth addressing, but note the limitation: error boundaries help with render/lifecycle exceptions, not arbitrary async effect failures.

**Fix:** Add targeted boundaries around the highest-risk route sections and use them for render-time fallback UI.

- [ ] Add an error boundary around key route/page containers
- [ ] Pair boundaries with local error states in async hooks where needed

---

### 21. `innerHTML` Usage in Web3 Onboard

`src/lib/web3Onboard.ts:461,471`

This is low risk today because the SVG is hardcoded, but the pattern is still fragile and easy to misuse later if the inserted markup ever becomes dynamic.

**Fix:** Replace `innerHTML` with DOM APIs where practical.

- [ ] Replace `innerHTML` assignments with `appendChild`, `replaceChildren`, or a static template helper

---

### 23. Remaining localStorage Access Without Error Handling

`src/lib/web3Onboard.ts:39`, `src/context/ThemeContext.tsx:16,23,32,42`, `src/pages/RocketLabPage.tsx:121`

The earlier draft overstated this by saying there was no guarded access anywhere. `RocketLabPage` already protects its read/parse path. The broader issue still stands in other locations: several reads and writes assume `localStorage` is always available.

**Fix:** Standardize safe storage access helpers.

- [ ] Add a small safe-storage wrapper for `getItem`, `setItem`, and `removeItem`
- [ ] Replace direct `localStorage` calls in theme, wallet, and RocketLab persistence code

---

### 24. Duplicate Map Lookups in Box Tier Normalization

`src/lib/starVault.ts:222-234`

`normalizeBoxTierRow()` performs the same `rarityLookup.get(id)` path more than once for the same row. This is a micro-optimization, not a high-impact problem, but it is an easy cleanup.

**Fix:** Cache the lookup result in a local variable.

- [ ] Store the `Map.get()` result once per row and reuse it

---

## P3 - Low (Post-Launch Cleanup / Deprioritized Findings)

### 3. Clarify Boolean Guard Grouping in Auction Normalization

`src/lib/nebulaBids.ts:193`

The previous draft called this an operator-precedence bug. That was incorrect. The expression already evaluates correctly because `&&` binds tighter than `||`.

This is still worth clarifying because the current guard is hard to read at a glance.

**Fix:** Add parentheses for readability only.

- [ ] Add explicit parentheses around the `round_id` type guard to make intent obvious
- [ ] Add tests if this validator changes further

---

### 15. StarField Performance Claim Was Overstated

`src/components/brand/StarField.tsx:121-186`

The original draft claimed a radial gradient was created for every particle on every frame. That is not what the code does. The current implementation creates a background glow gradient once per frame, outside the particle loop.

This should not be treated as a launch blocker. The more realistic cleanup is to reduce incidental allocations elsewhere, such as static inline polygon arrays in `PartIllustrations.tsx`.

**Fix:** Treat as low-priority cleanup and profile before changing animation code.

- [ ] Leave `StarField` alone unless profiling shows real jank
- [ ] Hoist obviously static render-time arrays in `PartIllustrations.tsx` if desired

---

### 16. `useMemo` Is Not Justified for the Cited Small Reductions

The original draft suggested adding `useMemo` around several small `.reduce()` computations. For the currently referenced sites, the data sets are tiny and bounded, so there is no clear evidence of a measurable win.

This should not be prioritized as a performance fix.

**Fix:** Only add memoization if profiling shows a real render hotspot or the data size grows.

- [ ] Remove this from the launch checklist
- [ ] Revisit only if render profiling identifies the relevant code paths

---

### 19. Missing UI Pagination for Auction History

`src/lib/nebulaBids.ts:302-321`

The original draft described auction history as unbounded. That was inaccurate. The current fetch is already bounded by the default `limit = 20`.

What is actually missing is a UI or API path for browsing older records beyond the initial page.

**Fix:** Add pagination only if the product needs deeper history visibility.

- [ ] Add cursor- or offset-based UI pagination if users need to browse older rounds
- [ ] Keep the default bounded fetch for the main dashboard view
