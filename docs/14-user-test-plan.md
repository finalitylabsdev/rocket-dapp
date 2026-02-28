# User Test Plan

> Version: 1.0.0
> Date: 2026-02-27
> Scope reference: `LAUNCH_PLAN.md`, `SCOPE.md`

This is the end-to-end manual test plan for the Entropy platform. It covers the full user journey from wallet setup through leaderboard placement. Each section should be tested in order — later sections depend on state established by earlier ones.

---

## Prerequisites

Before starting, confirm the following:

- [ ] You have a browser with MetaMask (or another EIP-6963-compatible wallet) installed
- [ ] Your wallet has a funded Ethereum mainnet account (minimum 0.002 ETH for lock + gas)
- [ ] The app is accessible at the deployment URL
- [ ] You are on Ethereum mainnet (chain ID 1)
- [ ] Browser DevTools console is open for observing errors

---

## 1. Wallet Connection

### 1.1 Initial Connection
- [ ] Land on the Home page — Hero section is visible with a "Connect Wallet" button
- [ ] Click "Connect Wallet"
- [ ] If multiple wallet providers are detected, a wallet picker modal appears — select your wallet
- [ ] Wallet prompts you to approve the connection (`eth_requestAccounts`)
- [ ] A SIWE (Sign-In With Ethereum) message appears for signing — confirm the statement reads "Sign in to Entropy Network."
- [ ] Sign the message
- [ ] The Hero updates to show your truncated wallet address (first 6 + last 4 characters)
- [ ] FLUX balance displays in the shell nav header (should be 0 for a fresh wallet)

### 1.2 Session Persistence
- [ ] Refresh the page — wallet remains connected without re-signing
- [ ] Close the tab and reopen the app — session restores automatically

### 1.3 Disconnect
- [ ] Click the wallet address / disconnect button in the nav
- [ ] Wallet disconnects — Hero returns to "Connect Wallet" state
- [ ] Reconnect to continue testing

---

## 2. ETH Lock

### 2.1 Lock Submission
- [ ] After connecting, the Hero shows an ETH lock prompt (e.g. "Lock ETH" button)
- [ ] Click the lock button
- [ ] MetaMask opens a transaction confirmation for the configured lock amount (default: 0.001 ETH) sent to the lock recipient address
- [ ] Confirm the transaction in MetaMask
- [ ] The UI transitions to a "SENT" or "VERIFYING" status badge on the Hero
- [ ] Within ~30 seconds, the status updates to "LOCKED" / "CONFIRMED" as the Edge Function verifies the on-chain receipt

### 2.2 Lock Status Display
- [ ] The Hero badge clearly shows the current lock state (LOCKED / PENDING / SENT / VERIFYING / ERROR)
- [ ] After confirmation, the lock badge persists across page refreshes
- [ ] The lock badge persists across wallet disconnect/reconnect

### 2.3 Error Recovery
- [ ] If the transaction is rejected in MetaMask, the UI returns to the unlocked state without errors
- [ ] If verification fails (edge case), an ERROR state is shown and retry is available

---

## 3. FLUX Faucet Claims

### 3.1 First Claim
- [ ] After ETH lock is confirmed, a "Claim FLUX" button appears on the Home page
- [ ] Click "Claim FLUX"
- [ ] MetaMask prompts a message signature (not a transaction) for the faucet claim
- [ ] Sign the message
- [ ] FLUX balance updates in the nav header (should show the daily claim amount, default: 1 FLUX)
- [ ] If a whitelist bonus is configured (dev default: 300 FLUX), balance reflects the bonus on first claim

### 3.2 Cooldown Enforcement
- [ ] After claiming, the button shows a countdown timer (default: 24 hours, dev fast economy: 5 seconds)
- [ ] Attempting to claim again during cooldown is blocked by the UI
- [ ] After the cooldown expires, the claim button re-enables

### 3.3 Claim Persistence
- [ ] Refresh the page — FLUX balance remains accurate
- [ ] Disconnect and reconnect — FLUX balance is fetched from the server, not local state

---

## 4. Navigation and Shell

### 4.1 Persistent Shell
- [ ] The top navigation bar is visible on every page (Home, DEX, Star Vault, Rocket Lab, Leaderboard)
- [ ] The nav bar shows: app logo/brand, FLUX balance, wallet address, and navigation links
- [ ] On mobile viewports, the nav collapses into a hamburger menu

### 4.2 Page Routing
- [ ] Click each navigation link and confirm it loads the correct page:
  - [ ] Home (`#` or root)
  - [ ] Entropy Exchange / DEX (`#dex`)
  - [ ] Star Vault / Nebula Bids (`#mystery`)
  - [ ] Rocket Lab (`#lab`)
  - [ ] Cosmic Jackpot / Leaderboard (`#leaderboard`)
- [ ] Browser back/forward buttons navigate between pages correctly
- [ ] Direct URL entry (e.g. appending `#mystery`) loads the correct page

### 4.3 Journey Cues
- [ ] On the Home page, after ETH lock, a journey cue suggests claiming FLUX
- [ ] After having FLUX and no inventory, a journey cue suggests opening a Star Vault box
- [ ] Journey cues are dismissible with the X button
- [ ] Dismissed cues do not reappear during the same session

### 4.4 Quick Actions
- [ ] The Home page shows quick action cards/buttons linking to each app section
- [ ] Each quick action navigates to the correct page

---

## 5. Star Vault — Mystery Boxes

### 5.1 Catalog Display
- [ ] Navigate to Star Vault (`#mystery`, Vault tab)
- [ ] Box tiers are displayed with names, prices (in FLUX), and rarity information
- [ ] Box tiers range from Common (cheapest) to Quantum (most expensive)
- [ ] Each box shows its price clearly

### 5.2 Box Purchase and Opening
- [ ] Select a box tier you can afford with your current FLUX balance
- [ ] Click to open/purchase the box
- [ ] FLUX balance decreases by the box price immediately
- [ ] A part reveal occurs showing the earned part with:
  - [ ] Section name (e.g. "Core Engine", "Wing Plate")
  - [ ] Rarity tier with appropriate color/styling
  - [ ] Power score
- [ ] The part appears in your inventory

### 5.3 Insufficient Balance
- [ ] Attempt to open a box that costs more FLUX than you have
- [ ] The UI prevents the purchase (button disabled or error message shown)
- [ ] No FLUX is deducted

### 5.4 Inventory Display
- [ ] After opening boxes, the inventory section shows all earned parts
- [ ] Each part displays: section, rarity, power score, source (`mystery_box`)
- [ ] Parts persist across page refreshes
- [ ] Parts persist across wallet disconnect/reconnect

### 5.5 Multiple Box Opens
- [ ] Open several boxes across different tiers
- [ ] Confirm that higher-tier boxes tend to produce higher-rarity parts
- [ ] All parts accumulate in inventory correctly

---

## 6. Nebula Bids — Auctions

> Nebula Bids requires the auction scheduler (`auction-tick`) to be running in production. If no auction round is active, some of these tests may not be possible. Check with the operator.

### 6.1 Auction Round Visibility
- [ ] Navigate to the Nebula Bids tab (`#mystery`, Bids tab)
- [ ] Current auction round status is displayed (accepting submissions, bidding, or no active round)
- [ ] Round timer / phase indicator is visible

### 6.2 Part Submission
- [ ] During the "accepting submissions" phase (first 30 minutes of a round):
  - [ ] Identify a part in your inventory with rarity Rare (tier 3) or higher
  - [ ] The part shows a "Submit to Auction" option
  - [ ] Submit the part
  - [ ] The part is marked as locked in your inventory
  - [ ] Confirmation of submission is shown
- [ ] Parts below Rare tier cannot be submitted (option not available or disabled)
- [ ] Already-locked or equipped parts cannot be submitted

### 6.3 Bidding
- [ ] During the "bidding" phase:
  - [ ] The active auction part is displayed with its details (section, rarity, power)
  - [ ] Current highest bid and minimum next bid (5% increment) are shown
  - [ ] Enter a bid amount at or above the minimum
  - [ ] Place the bid
  - [ ] FLUX is immediately escrowed (balance decreases)
  - [ ] Your bid appears in the bid list
- [ ] Placing a bid below the minimum increment is rejected
- [ ] Placing a bid with insufficient FLUX is rejected

### 6.4 Outbid and Refund
- [ ] If another user outbids you, your escrowed FLUX is refunded
- [ ] FLUX balance updates to reflect the refund
- [ ] You can place a new, higher bid

### 6.5 Round Finalization
- [ ] When the round ends:
  - [ ] If you are the highest bidder: the part transfers to your inventory with source `auction_win`
  - [ ] If you are the seller: FLUX proceeds are credited to your balance
  - [ ] If you are a non-winning bidder: your escrowed FLUX is refunded
- [ ] A new round begins automatically (if the scheduler is running)

### 6.6 Realtime Updates
- [ ] Bid list updates in real time without manual refresh
- [ ] Round phase transitions update in real time
- [ ] FLUX balance updates reflect escrow/refund changes without page reload

---

## 7. Rocket Lab — Building and Launching

### 7.1 Inventory Adapter
- [ ] Navigate to Rocket Lab (`#lab`)
- [ ] The 8-slot rocket assembly view is displayed with sections:
  - [ ] Core Engine
  - [ ] Wing Plate
  - [ ] Fuel Cell
  - [ ] Navigation Module
  - [ ] Payload Bay
  - [ ] Thruster Array
  - [ ] Propulsion Cables
  - [ ] Shielding
- [ ] Your canonical inventory parts from Star Vault / Nebula Bids are available for equipping

### 7.2 Equipping Parts
- [ ] Select a part from your inventory
- [ ] Assign it to its matching section slot
- [ ] The slot updates to show the equipped part
- [ ] The part is marked as equipped in inventory (cannot be submitted to auction while equipped)
- [ ] Equip parts into as many of the 8 slots as your inventory allows

### 7.3 Launch Simulation
- [ ] With all 8 slots filled, the "LAUNCH ROCKET" button becomes available
- [ ] Click "LAUNCH ROCKET"
- [ ] A launch animation / sequence plays
- [ ] A Grav Score result is displayed based on:
  - [ ] Part power scores
  - [ ] Rarity multipliers
  - [ ] Compatibility bonuses
- [ ] The launch is recorded in local history

### 7.4 Launch History
- [ ] After launching, the most recent launch appears in the history panel
- [ ] Up to 5 recent launches are displayed with score, timestamp, and notes
- [ ] "BEST LOCAL GS" (Grav Score) is highlighted
- [ ] History persists across page refreshes (stored in localStorage)

### 7.5 Local-Only Boundary
- [ ] Confirm that launching does NOT deduct FLUX or alter server inventory
- [ ] Rocket Lab is labeled as local simulation
- [ ] No ledger entries are created for launch actions

---

## 8. Cosmic Jackpot — Leaderboard

### 8.1 Leaderboard Display
- [ ] Navigate to Cosmic Jackpot / Leaderboard (`#leaderboard`)
- [ ] A ranking table is displayed showing up to top 20 entries
- [ ] Columns visible: Rank, Move (rank change), Wallet Address, Missions, Flux Burned, ETH Earned
- [ ] Top 3 positions have tier badges (Gold, Silver, Bronze)

### 8.2 Stats Cards
- [ ] Summary stat cards are displayed at the top:
  - [ ] Daily ETH Prize pool
  - [ ] Active players count
  - [ ] Total missions launched
  - [ ] Total Flux burned

### 8.3 Leaderboard Refresh
- [ ] Click the refresh button
- [ ] Data reloads with a spinner indicator
- [ ] "Last updated" timestamp reflects the refresh

### 8.4 Your Ranking
- [ ] If your wallet appears on the leaderboard, verify:
  - [ ] Wallet address matches yours (truncated format)
  - [ ] Mission count reflects your launches
  - [ ] Rank position is reasonable given your activity

---

## 9. Feature Flag Gating

> These tests are for operators validating staged rollout. Set flags via `VITE_FLAG_*` environment variables.

### 9.1 Individual Flag Disable
- [ ] Set `VITE_FLAG_STAR_VAULT_ENABLED=false` — Star Vault tab is hidden or shows "Coming Soon"
- [ ] Set `VITE_FLAG_NEBULA_BIDS_ENABLED=false` — Bids tab is hidden or shows "Coming Soon"
- [ ] Set `VITE_FLAG_ROCKET_LAB_ENABLED=false` — Rocket Lab page is disabled
- [ ] Set `VITE_FLAG_DEX_ENABLED=false` — Entropy Exchange page is disabled
- [ ] Set `VITE_FLAG_FAUCET_ENABLED=false` — Faucet claim button is hidden

### 9.2 Progressive Enable
- [ ] Start with all flags `false`
- [ ] Enable flags one at a time in order: Faucet → Star Vault → Nebula Bids → DEX → Rocket Lab
- [ ] Each newly enabled feature becomes functional without breaking previously enabled features

---

## 10. Cross-Cutting Concerns

### 10.1 Error States and Degraded Mode
- [ ] With network disconnected, the app shows appropriate loading/error states
- [ ] Supabase realtime reconnects automatically when connectivity resumes
- [ ] Failed RPC calls show user-facing error messages (not raw errors)

### 10.2 Concurrent Operations
- [ ] Claim FLUX and open a mystery box in rapid succession — both complete correctly
- [ ] Place an auction bid while a faucet claim is processing — no race conditions

### 10.3 Wallet Switching
- [ ] Disconnect wallet A and connect wallet B
- [ ] All displayed state (FLUX, inventory, lock status) reflects wallet B, not wallet A
- [ ] No state leakage between wallets

### 10.4 Responsive Layout
- [ ] Test on desktop (1440px+ width) — full layout with side-by-side panels
- [ ] Test on tablet (768px width) — layout adapts without horizontal overflow
- [ ] Test on mobile (375px width) — hamburger nav, stacked layout, touch targets are usable

### 10.5 Idempotency
- [ ] Double-click a faucet claim button rapidly — only one claim is processed
- [ ] Double-click a box open button — only one box is opened and one FLUX debit occurs
- [ ] Double-click a bid placement — only one bid is recorded and one escrow charged

---

## End-to-End Journey Summary

The complete happy path from start to leaderboard:

1. **Connect** your Ethereum wallet via MetaMask
2. **Lock ETH** through the Hero section on the Home page
3. **Claim FLUX** daily from the faucet after lock confirmation
4. **Open mystery boxes** in Star Vault to earn rocket parts
5. **Submit** a Rare+ part to a Nebula Bids auction round
6. **Bid** on auction parts to acquire higher-quality pieces
7. **Equip** parts into all 8 Rocket Lab slots
8. **Launch** your rocket to generate a Grav Score
9. **Check** the Cosmic Jackpot leaderboard for your ranking
