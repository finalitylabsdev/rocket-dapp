# System Overview

# Entropy Testnet — System Overview

> **Version:** 1.0
> **Network:** Entropy Network (E-Net | φ-Net)
> **Chain Type:** Permission‑less, immutable, proof‑of‑Infinity

## Changelog

- 2026-02-26: Spec freeze v1 adopted. Canonical alignment reference: [07-spec-freeze-alignment-plan](./07-spec-freeze-alignment-plan.md).

## Deprecation Notice (Spec Freeze v1)

Legacy terms may still appear in this document. Treat them as deprecated aliases:

- `ET` -> `Flux`
- `claimET()` -> `claimFlux()`
- `whitelist(amount)` -> `whitelist()` payable (`msg.value == 0.05 ether`)

***

## Table of Contents

1. [Executive Summary](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#1-executive-summary)
2. [Core Economic Engine — UVD Stable‑Coin](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#2-core-economic-engine--uvd-stable-coin)
3. [Bridge / Whitelist & Faucet](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#3-bridge--whitelist--faucet)
4. [DEX (Uniswap‑Style Exchange)](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#4-dex-uniswap-style-exchange)
5. [Mystery‑Box & Auction Module](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#5-mystery-box--auction-module)
6. [Rocket Builder & Launch](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#6-rocket-builder--launch)
7. [Rocket Ship Parts & Attributes](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#7-rocket-ship-parts--attributes)
8. [Leaderboard & Prize Withdrawal](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#8-leaderboard--prize-withdrawal)
9. [Entropy‑Core & System‑Level Mechanics](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#9-entropy-core--system-level-mechanics)
10. [Security Summary](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#10-security-summary)
11. [UI / Frontend Guidelines](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#11-ui--frontend-guidelines)
12. [Deployment & Operational Flow](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#12-deployment--operational-flow)
13. [Technical Documentation Checklist](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#13-technical-documentation-checklist)

***

## 1. Executive Summary

The Entropy Testnet runs on the **Entropy Network (E-Net | φ-Net)** core — a permission‑less, immutable, proof‑of‑Infinity‑based chain that exposes a stable‑coin protocol (UVD) and a set of on‑chain applications. The core is governed by **deterministic rules only**: there are no upgrade keys, no governance votes, and no admin privileges. The testnet mirrors the exact same constraints as the eventual main‑net design.

The testnet delivers four distinct on‑chain experiences that work together:

1. **Bridge / Faucet** — Users lock 0.05 ETH to whitelist themselves and claim 1 entropy token (ET) every 24 hours.
2. **DEX** — A constant‑product AMM for swapping ET with BTC, ETH, and UVD.
3. **Mystery‑Box & Auction** — Players purchase mystery boxes to receive randomised rocket parts, then auction rare parts for ET.
4. **Rocket Builder & Launch** — Users assemble rockets from collected parts and launch them for a "distance to mass" score.

A global **Leaderboard** tracks cumulative scores, and the top performers win **real ETH** redistributed from the locked Bridge contract — giving real‑world incentives to validate the economic model.

***

## 2. Core Economic Engine — UVD Stable‑Coin

UVD is the testnet's stable‑coin, pegged to a diversified "Universe Reserve Basket" (URB).

### 2.1 Backing

1 UVD ≈ 1 BTC in a universe reserve basket composed of:

* **40%** Gold
* **30%** Swiss bank deposits
* **30%** Singapore dollar

### 2.2 Minting & Redemption

| Operation      | Formula                                              | Description                       |
| -------------- | ---------------------------------------------------- | --------------------------------- |
| **Minting**    | User deposits **x BTC** → mints `x · 10⁸ / sₜ` UVD   | `sₜ` is the current satoshi‑rate. |
| **Redemption** | User returns **y UVD** → receives `y · sₜ / 10⁸` BTC | Inverse of the mint operation.    |

### 2.3 Collateralisation

The protocol enforces a minimum collateralisation ratio at all times:

```
Cₜ = Bₜ / (Mₜ · sₜ / 10⁸)        where Cₜ ≥ C_min > 1

```

* `Bₜ` = total BTC reserves at time *t*
* `Mₜ` = total UVD supply at time *t*

### 2.4 Weekly Re‑Index

An oracle supplies `P_BTC/URB(t)` → neutral satoshi‑rate `s_neutral(t) = 10⁸ / P_BTC/URB(t)`. The rate `sₜ` is adjusted each week using a growth share `g`, a log‑change bound `k_max`, and the target ratio `C_target`. This mechanism limits inflation and deflation per week, keeping UVD stable against the URB.

### 2.5 Key Properties

* The UVD contract exposes a public variable `sₜ` updated on every redemption/mint.
* All other contracts (DEX, Auction, etc.) read `sₜ` in a **read‑only** fashion.
* Only the UVD contract itself can update `sₜ`; it is immutable from the perspective of every other module.

***

## 3. Bridge / Whitelist & Faucet

The Bridge is the single entry‑point to the testnet ecosystem.

### 3.1 How It Works

| Step | Action        | Detail                                                                                                |
| ---- | ------------- | ----------------------------------------------------------------------------------------------------- |
| 1    | **Whitelist** | User calls `bridge.whitelist(amount)` and sends **0.05 ETH**. The contract locks the ETH permanently. |
| 2    | **ET Claim**  | After whitelisting, the user may call `claimET()` once per 24 hours to receive **1 ET**.              |
| 3    | **Use of ET** | ET is the native token for all testnet apps (DEX, Auction, Rocket Builder).                           |

### 3.2 User Flow

```
Connect Wallet → View Locked ETH → Press "Whitelist" (auto‑submits 0.05 ETH)
→ Confirm Transaction → Wait 24 h → Press "Claim ET" → Receive 1 ET

```

### 3.3 Technical Details

* **No admin/upgrade keys.** Whitelist is a stateful mapping of addresses → `whitelisted` flag.
* **Claim function** checks `block.timestamp >= lastClaim + 24 hours`.
* Source code is verified and open‑source.
* Audited for re‑entrancy, integer overflow, and timestamp manipulation.

### 3.4 UX Considerations

* Display a countdown timer until the next claim window.
* Show the total ETH locked in the Bridge contract.
* Provide a link to the Prize Withdrawal page once the prize contract is triggered.

***

## 4. DEX (Uniswap‑Style Exchange)

### 4.1 Available Pools

| Pool       | Description                               |
| ---------- | ----------------------------------------- |
| **ET–BTC** | Initial liquidity seeded by testnet devs. |
| **ET–ETH** | Seeded with a small amount of ETH + ET.   |
| **ET–UVD** | Uses the UVD stable‑coin for liquidity.   |

### 4.2 Token Economics

* **ET** — Base token; minted only via the Bridge.
* **BTC** — Wrapped BTC token used in pairs.
* **ETH** — Wrapped ETH token.
* **UVD** — Stable‑coin with deterministic mint/redemption; pool balances used for price calculations.

### 4.3 Swap Mechanics (Constant Product AMM)

```
amountOut = reserveOut × (amountIn × (1 − fee)) / (reserveIn + amountIn × (1 − fee))

```

### 4.4 Liquidity Provision

* Users add liquidity via `addLiquidity(amountET, amountToken)`.
* In return they receive **LP tokens** (ERC‑20 compliant).
* Removing liquidity burns LP tokens and returns underlying assets.

### 4.5 UI Considerations

* Real‑time price chart per pool.
* Slippage tolerance slider.
* Transaction fee display (e.g., 0.30%).
* "Best Price" button that auto‑sets slippage to the current pool state.

### 4.6 Security

* Audited for front‑running, re‑entrancy, and price manipulation.
* No admin keys; pool state is immutable except via normal trading.

***

## 5. Mystery‑Box & Auction Module

### 5.1 Mystery‑Box

Players purchase mystery boxes with ET to receive randomised rocket parts.

**Part Structure:**

* **8 distinct rocket sections** (see [Section 7](https://claude.ai/chat/b4a5af5c-9ff2-403f-988c-210dff2ba632#7-rocket-ship-parts--attributes) for details).
* **8 rarity tiers** (Common → Legendary).
* Each part has **3 numeric attributes** (scale 1–100).
* **Part value** = `(Attribute₁ + Attribute₂ + Attribute₃) × RarityMultiplier`.

**Purchase Flow:**

1. Select "Buy Box."
2. Confirm cost in ET (price varies by tier, e.g., Common = 10 ET, Legendary = 500 ET).
3. Contract mints a unique `partID` and assigns attributes.
4. Part metadata stored off‑chain (IPFS); key attributes stored on‑chain for auditability.

**Opening a Box:**

1. After purchase, user selects "Open Box."
2. Randomness derived from `keccak256(abi.encodePacked(blockhash(block.number − 1), partID))`.
3. Result is deterministic for the block but unpredictable ahead of time.
4. Revealed part is stored in the user's inventory.

**UX:** Animated "opening" sequence with loading spinner → display part image, rarity badge, and attribute stats → option to "View Part Stats" before deciding to auction.

**Security:** RNG uses blockhash to avoid manipulation (subject to minor miner bias, acceptable for non‑critical randomness). Audited for integer overflows and re‑entrancy.

### 5.2 Auction

Rare parts can be listed for auction, allowing players to trade high‑value components for ET.

**Eligibility:** Only parts exceeding a rarity threshold (e.g., Rare, Epic, Legendary) may be auctioned. Tracked via a mapping `partID => isEligible`.

**Auction Cadence:** Auctions start every **4 hours** (using block timestamps). The contract maintains a queue of active auctions, each with a fixed 4‑hour window.

**Bid Process:**

1. User selects a part and submits a bid via `bid(partID, amountET)`.
2. Bid must exceed the current highest by a minimum increment (e.g., 5%).
3. All bids are held in escrow (ET locked).
4. When the 4‑hour window closes, the highest bidder wins; the contract transfers the part to the winner and distributes all ET proceeds.

**Events:**`AuctionStart(partID)` at interval start; `AuctionEnded(partID, winner, amountET)` at close.

**Security:** No re‑entrancy on `bid()` or `finalizeAuction()`. No upgrade keys; contract logic is immutable.

***

## 6. Rocket Builder & Launch

### 6.1 Builder

Users assemble a rocket from their collected parts.

* **Inventory view:** Parts displayed by rarity and attributes, categorised by the rocket section they fit (Engine, Fuel Cell, Wing‑Plate, etc.).
* **Assembly UI:** Drag‑and‑drop interface with a rocket schematic showing **8 slots**. Each slot only accepts parts matching its category.
* **Validation:** On each placement, the contract checks `ownerOf(partID) == msg.sender`. The assembly mapping `slotID => partID` is stored on‑chain.
* **Cost:** Assembly does **not** burn ET; it only stores the configuration for the upcoming launch.
* **Launch button** appears once all 8 slots are filled.

### 6.2 Launch

Once assembled, the rocket is launched via a deterministic smart‑contract simulation.

**Launch Parameters:**

* **Time of Day** — current `block.timestamp`.
* **Environmental Factor** — randomness from `keccak256(abi.encodePacked(blockhash(block.number − 1), msg.sender, block.timestamp))`, simulating weather and launch conditions.

**Score Calculation:**

```
Rocket Score = Σ(part attributes) × (0.5 × EnvironmentFactor) × (1 + RarityBonus)

```

* `EnvironmentFactor` is a pseudo‑random float in the range \[0, 1].
* Score is stored in `launchScores[msg.sender]`.

**Random Events:** Meteor showers (probability derived from the Entropy Signal) may destroy a part mid‑flight, reducing the final score.

**Post‑Launch:**

* Emits `LaunchCompleted(rocketID, sender, score)`.
* Score is automatically added to the Leaderboard.

**UX:** Real‑time launch animation → score displayed in a "Result" modal → option to "Retry Launch" by re‑assembling.

**Security:** Launch is a one‑time state‑change per rocket configuration; cannot be manipulated after block confirmation. No admin overrides.

***

## 7. Rocket Ship Parts & Attributes

Each rocket has **8 sections**. Each section has **8 unique named parts** and **3 attributes** scored on a 1–100 scale. Below is the full catalog.

### 7.1 Core Engine

| # | Part Name         | Attributes                           |
| - | ----------------- | ------------------------------------ |
| 1 | Pulse Engine      | Heat Flux · Thrust Efficiency · Mass |
| 2 | Nova Thruster     | Heat Flux · Thrust Efficiency · Mass |
| 3 | Quantum Core      | Heat Flux · Thrust Efficiency · Mass |
| 4 | Radiant Combustor | Heat Flux · Thrust Efficiency · Mass |
| 5 | Stellar Pulse     | Heat Flux · Thrust Efficiency · Mass |
| 6 | Plasma Injector   | Heat Flux · Thrust Efficiency · Mass |
| 7 | Ion Driver        | Heat Flux · Thrust Efficiency · Mass |
| 8 | Hyper‑Drive       | Heat Flux · Thrust Efficiency · Mass |

* **Heat Flux** — thermal stress tolerance of the core.
* **Thrust Efficiency** — lift‑off power output.
* **Mass** — weight penalty that reduces overall performance.

### 7.2 Wing‑Plate

| # | Part Name     | Attributes                                   |
| - | ------------- | -------------------------------------------- |
| 1 | Solar Wings   | Aerodynamic Drag · Surface Area · Durability |
| 2 | Nebula Fins   | Aerodynamic Drag · Surface Area · Durability |
| 3 | Aerogel Skins | Aerodynamic Drag · Surface Area · Durability |
| 4 | Comet Span    | Aerodynamic Drag · Surface Area · Durability |
| 5 | Meteor Brakes | Aerodynamic Drag · Surface Area · Durability |
| 6 | Photon Sails  | Aerodynamic Drag · Surface Area · Durability |
| 7 | Lumen Vents   | Aerodynamic Drag · Surface Area · Durability |
| 8 | Void Glides   | Aerodynamic Drag · Surface Area · Durability |

* **Aerodynamic Drag** — smoother flight with lower values.
* **Surface Area** — affects lift vs. drag trade‑off.
* **Durability** — how long the wing lasts under stress.

### 7.3 Fuel Cell

| # | Part Name         | Attributes                              |
| - | ----------------- | --------------------------------------- |
| 1 | Nebula Tank       | Fuel Capacity · Energy Density · Weight |
| 2 | Void Reservoir    | Fuel Capacity · Energy Density · Weight |
| 3 | Star‑Fuel Cell    | Fuel Capacity · Energy Density · Weight |
| 4 | Solar Cell Bank   | Fuel Capacity · Energy Density · Weight |
| 5 | Photon Reactor    | Fuel Capacity · Energy Density · Weight |
| 6 | Dark‑Matter Cell  | Fuel Capacity · Energy Density · Weight |
| 7 | Cryo‑Fuel Capsule | Fuel Capacity · Energy Density · Weight |
| 8 | Graviton Storage  | Fuel Capacity · Energy Density · Weight |

* **Fuel Capacity** — maximum flight distance.
* **Energy Density** — energy per unit weight.
* **Weight** — lighter cells improve performance.

### 7.4 Navigation Module

| # | Part Name         | Attributes                                |
| - | ----------------- | ----------------------------------------- |
| 1 | Astro‑Gyro        | Accuracy · Processing Power · Reliability |
| 2 | Photon Navigator  | Accuracy · Processing Power · Reliability |
| 3 | Quantum GPS       | Accuracy · Processing Power · Reliability |
| 4 | Singularity Clock | Accuracy · Processing Power · Reliability |
| 5 | Eclipse Tracker   | Accuracy · Processing Power · Reliability |
| 6 | Stellar Atlas     | Accuracy · Processing Power · Reliability |
| 7 | Chrono‑Scope      | Accuracy · Processing Power · Reliability |
| 8 | Deep‑Space Comp   | Accuracy · Processing Power · Reliability |

* **Accuracy** — precision of course‑keeping.
* **Processing Power** — speed of decision‑making.
* **Reliability** — chance of failure in extreme conditions.

### 7.5 Payload Bay

| # | Part Name         | Attributes                                      |
| - | ----------------- | ----------------------------------------------- |
| 1 | Cargo Nebula      | Cargo Capacity · Securing Strength · Modularity |
| 2 | Quantum Cargo     | Cargo Capacity · Securing Strength · Modularity |
| 3 | Stellar Freight   | Cargo Capacity · Securing Strength · Modularity |
| 4 | Black‑Hole Bay    | Cargo Capacity · Securing Strength · Modularity |
| 5 | Pulsar Module     | Cargo Capacity · Securing Strength · Modularity |
| 6 | Interstellar Hold | Cargo Capacity · Securing Strength · Modularity |
| 7 | Orbital Storage   | Cargo Capacity · Securing Strength · Modularity |
| 8 | Modular Crate     | Cargo Capacity · Securing Strength · Modularity |

* **Cargo Capacity** — how much payload can be carried.
* **Securing Strength** — holds objects during launch.
* **Modularity** — flexibility to swap or upgrade.

### 7.6 Thruster Array

| # | Part Name          | Attributes                                |
| - | ------------------ | ----------------------------------------- |
| 1 | Ion Array          | Ion Output · Fuel Efficiency · Redundancy |
| 2 | Hyper‑Ion Pack     | Ion Output · Fuel Efficiency · Redundancy |
| 3 | Graviton Thrusters | Ion Output · Fuel Efficiency · Redundancy |
| 4 | Pulsar Blades      | Ion Output · Fuel Efficiency · Redundancy |
| 5 | Dark‑Matter Flail  | Ion Output · Fuel Efficiency · Redundancy |
| 6 | Solar‑Blade Pack   | Ion Output · Fuel Efficiency · Redundancy |
| 7 | Lumen Cluster      | Ion Output · Fuel Efficiency · Redundancy |
| 8 | Void Engine        | Ion Output · Fuel Efficiency · Redundancy |

* **Ion Output** — thrust of ion‑thrusters.
* **Fuel Efficiency** — cycles per unit fuel.
* **Redundancy** — number of backup subsystems.

### 7.7 Propulsion Cable

| # | Part Name     | Attributes                              |
| - | ------------- | --------------------------------------- |
| 1 | Quantum Wire  | Conductivity · Flexibility · Insulation |
| 2 | Star‑Fiber    | Conductivity · Flexibility · Insulation |
| 3 | Lumen Conduct | Conductivity · Flexibility · Insulation |
| 4 | Photon Cable  | Conductivity · Flexibility · Insulation |
| 5 | Solar‑Weld    | Conductivity · Flexibility · Insulation |
| 6 | Eclipse Rope  | Conductivity · Flexibility · Insulation |
| 7 | Photon Thread | Conductivity · Flexibility · Insulation |
| 8 | Dark‑Fiber    | Conductivity · Flexibility · Insulation |

* **Conductivity** — power‑transmission efficiency.
* **Flexibility** — ability to bend without breaking.
* **Insulation** — protection against temperature extremes.

### 7.8 Shielding

| # | Part Name            | Attributes                                        |
| - | -------------------- | ------------------------------------------------- |
| 1 | Event‑Horizon Shield | Radiation Resistance · Impact Resistance · Weight |
| 2 | Radiation Mantle     | Radiation Resistance · Impact Resistance · Weight |
| 3 | Impact Field         | Radiation Resistance · Impact Resistance · Weight |
| 4 | Graviton Barrier     | Radiation Resistance · Impact Resistance · Weight |
| 5 | Nebula Shell         | Radiation Resistance · Impact Resistance · Weight |
| 6 | Photon Armor         | Radiation Resistance · Impact Resistance · Weight |
| 7 | Singularity Plating  | Radiation Resistance · Impact Resistance · Weight |
| 8 | Void Barrier         | Radiation Resistance · Impact Resistance · Weight |

* **Radiation Resistance** — blocks harmful cosmic rays.
* **Impact Resistance** — protects against debris and micrometeoroids.
* **Weight** — lighter shields boost performance.

> **Note:** The original source documents label both "Thruster Array" and "Propulsion Cable" as section 6️⃣. This overview treats them as distinct sections (7.6 and 7.7 respectively) to maintain the full count of 8 rocket sections matching the 8 assembly slots.

***

## 8. Leaderboard & Prize Withdrawal

### 8.1 Leaderboard

| Metric               | Description                              |
| -------------------- | ---------------------------------------- |
| **Total Score**      | Sum of all launch scores for an address. |
| **Current Rank**     | Determined by `rankOf(address)`.         |
| **Last Launch Time** | Timestamp of most recent launch.         |
| **Ranked Parts**     | Highlights parts that won auctions.      |

**Display:** Paginated table sorted by score, with filters by rarity, part type, and user. Includes a graph of score trajectory over time. The leaderboard updates after every launch.

### 8.2 Prize Mechanics

| Period | Prize                                                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 24 h   | Top 3 global winners receive **50% of the ETH locked** in the Bridge contract, transferred to their main‑net address (real ETH). |

**How it works:**

1. The Bridge contract tracks total ETH locked (0.05 ETH per whitelist).
2. When a user reaches **rank 1** after a launch, the system emits a `PrizeTrigger(address winner)` event.
3. The winner navigates to the **Prize Withdrawal Page** and calls `withdrawPrize()` on the Prize Contract.
4. The contract transfers the locked ETH (minus the 0.05 ETH fee) to the winner's main‑net address.
5. This is the **only** path for ETH to leave the testnet — executed entirely on‑chain without any external operator.

**Security:** Prize contract is read‑only after the 24‑hour lock period. Prize claims are time‑locked to the next launch event to prevent double‑claims.

***

## 9. Entropy‑Core & System‑Level Mechanics

These mechanics operate across all modules and pages.

### 9.1 Entropy Signal

The testnet contract calculates a weighted entropy `Eₜ` from the four ET‑driven modules. This signal determines stochastic elements (e.g., meteor showers during launch) and is fixed at genesis. Randomness is entropy‑coupled to emulate unpredictable real‑world events.

### 9.2 Module Neutrality

The DEX, Auction, and Rocket Builder are sovereign modules sitting on the Entropy substrate. They operate independently in scope but **do not alter** the core monetary logic (UVD minting, redemption, collateralisation).

### 9.3 Deterministic Index (`sₜ`)

The UVD contract's public `sₜ` variable is the single source of truth for stable‑coin pricing. All other contracts reference it read‑only.

### 9.4 No Upgrade Keys

Every contract (Bridge, DEX, Mystery‑Box, Auction, Builder, Launch, Leaderboard) is deployed with **no**`owner()` or `admin()` variables. All `onlyOwner` modifiers are removed. State changes occur only via `public` functions or standard ERC‑20 logic.

### 9.5 Timestamp‑Based Rules

All time‑dependent actions (claim windows, auction intervals, leaderboard updates) use `block.timestamp` with strict checks:

```
require(block.timestamp >= lastAction + interval);

```

This protects against replay attacks and ensures fair play.

### 9.6 Locked ETH

The 0.05 ETH locked during whitelist is immutable after the first block. It is never spendable — the Bridge contract only allows ET minting from claims. ETH only leaves via the prize withdrawal mechanism.

### 9.7 ET Supply

* **Minted** only via `Bridge.claimET()`.
* **Burned** when users trade on the DEX (normal ERC‑20 burning) or when parts are auctioned (winner receives all ET).
* Total supply is transparent on‑chain.

***

## 10. Security Summary

| Rule                      | Enforcement                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **No Admin/Upgrade Keys** | Every contract compiled without `owner()` modifiers; state changes only via `public` functions or ERC‑20 logic.                    |
| **Immutable ETH Lock**    | Bridge locks 0.05 ETH per whitelist; ETH cannot be withdrawn until a prize claim, controlled by the chain.                         |
| **Timestamp Checks**      | All time‑dependent actions check `block.timestamp` against stored timestamps; errors revert the transaction.                       |
| **Blockhash RNG**         | Random values (`EnvironmentFactor`, part RNG) use `blockhash(block.number − 1)` — cannot be manipulated after the block is sealed. |
| **Re‑Entrancy Guards**    | OpenZeppelin `ReentrancyGuard` applied to DEX swaps, auction bids, and auction finalization.                                       |
| **ERC‑20 Safety**         | OpenZeppelin ERC‑20 implementations with `SafeERC20`.                                                                              |
| **Gas Safety**            | All user‑initiated actions require gas; UI warns if gas price is abnormally high.                                                  |

***

## 11. UI / Frontend Guidelines

### 11.1 Landing Page

The first touch‑point for every visitor:

* **Brief Intro:** "Welcome to the E-Net | φ-Net Testnet — a deterministic, immutable playground where you can earn real ETH, trade stable‑coins, and build rockets."
* **Quick‑Start Buttons:** Whitelisting / Faucet, Open DEX, Play Mystery‑Box / Auction, Launch Rocket, Leaderboard.
* **System Status (live counters):** Total ETH locked in Bridge, total ET supply (minted/burned), UVD pool reserves and `sₜ` index.
* **Wallet Prompt:** "Connect Wallet" (MetaMask, WalletConnect, etc.).

### 11.2 Technical Implementation

| Item                          | Detail                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Wallet Integration**        | Use web3‑modal or ethers.js; detect E-Net \| φ-Net testnet chain ID; warn if wrong chain.                          |
| **Gas Estimation & Slippage** | Real‑time gas fee estimator + slippage slider for DEX trades.                                             |
| **Real‑Time Event Listeners** | Listen for `AuctionEnded`, `LaunchCompleted`, `AuctionStart` events via `provider.on()`.                  |
| **Data Persistence**          | Store UI state (countdown timers, last claim timestamps) in `localStorage` to survive page refreshes.     |
| **IPFS Integration**          | Render part images and rocket schematics from IPFS hashes in part metadata. Use Pinata or Infura gateway. |
| **Responsive Design**         | Component library (e.g., Chakra‑UI, Tailwind) adapting to mobile and desktop with collapsible menus.      |
| **Accessibility**             | Colour‑contrast for rarity badges, ARIA labels for icons, keyboard navigation for all buttons.            |
| **Testing**                   | Deploy to a private testnet (Goerli, Sepolia) or local Ganache; automated tests with Hardhat or Truffle.  |

***

## 12. Deployment & Operational Flow

### 12.1 Contract Deployment Order

Contracts must be deployed **in this exact order** to satisfy inter‑contract dependencies:

1. **UVD** — Stable‑coin with `sₜ` index.
2. **Bridge** — Whitelist and ET mint.
3. **DEX** — ET–BTC, ET–ETH, ET–UVD pools with initial liquidity.
4. **Mystery‑Box & Auction** — Part catalog and auction scheduler.
5. **Rocket Builder & Launch** — Part‑assembly contract and score calculator.
6. **Leaderboard & Prize Distributor** — Score tracking and prize distribution, tied to Bridge ETH balance.

### 12.2 Post‑Deployment

* Verify each contract's bytecode on the network explorer (Etherscan‑style).
* Publish source code as open‑source to reflect the immutable nature of E-Net | φ-Net.

### 12.3 Security Audits

Separate audits required for each module:

* Bridge (whitelist, claim)
* DEX (swap, liquidity)
* Mystery‑Box (RNG)
* Auction (scheduler, escrow)
* Builder/Launch (score algorithm)
* Leaderboard (rank calculation)

### 12.4 Operational Checks

Periodically confirm:

* `Bridge.ethBalance()` equals the sum of all locked ETH (minus 0.05 ETH per whitelist).
* `UVD.reserve()` matches the contract's pool reserves.
* `Leaderboard.ranks()` reflects the latest `AuctionEnded` events.

### 12.5 Prize Trigger

When a user reaches rank 1 after a launch, the system emits `PrizeTrigger(address winner)`. The Prize Withdrawal Page listens for this event; the winner calls `withdrawPrize()` on the Prize Contract to receive the locked ETH (minus the 0.05 ETH fee).

***

## 13. Technical Documentation Checklist

| # | Item                      | Description                                                           |
| - | ------------------------- | --------------------------------------------------------------------- |
| 1 | Smart‑Contract Interfaces | ABI files for Bridge, DEX, Auction, RocketBuilder.                    |
| 2 | Whitelist & Faucet        | `whitelist(uint256 amount)`; `claimET()`.                             |
| 3 | AMM Liquidity Pools       | `ET-BTC`, `ET-ETH`, `ET-UVD`.                                         |
| 4 | Mystery‑Box Logic         | Random generator based on block hash.                                 |
| 5 | Auction Scheduler         | 4‑hour cadence, rarity‑based eligibility.                             |
| 6 | Rocket Simulator          | Distance formula, meteor‑shower probability table.                    |
| 7 | Leaderboard               | Persistent global list, reward distributor.                           |
| 8 | Security Audits           | All modules must pass full audit before deployment (no upgrade keys). |

***

*This document consolidates the Executive Summary, App‑Level Overview, and Rocket Ship Attributes into a single reference. All contracts should be verified on an Etherscan‑style explorer, and source code must remain open‑source to reflect the immutable nature of Entropy Network.*
