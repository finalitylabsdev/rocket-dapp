# App Overview

# Entropy Testnet — App Overview

> **Network:** Entropy Network (phi-net) · Permission‑less · Immutable · Proof‑of‑Infinity
> **Native Token:** Flux (previously referred to as ET — Entropy Token)
> **Stable‑Coin:** UVD (Universe Dollar)
> **Brand Voice:** Futuristic, playful, community‑centric

## Changelog

- 2026-02-26: Spec freeze v1 adopted. Canonical alignment reference: [07-spec-freeze-alignment-plan](./07-spec-freeze-alignment-plan.md).

## Deprecation Notice (Spec Freeze v1)

Legacy terms and signatures are deprecated:

- `ET` -> `Flux`
- `claimET()` -> `claimFlux()`
- `whitelist(amount)` -> `whitelist()` payable (`msg.value == 0.05 ether`)
- `Flux Exchange` is a legacy label; canonical brand name is `Entropy Exchange`

***

## How the Four Apps Connect

The Entropy Testnet is composed of **four distinct web applications** that form a single end‑to‑end player journey. Every app feeds into the next; together they create a closed‑loop economy backed by real ETH.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐     ┌─────────────────────────────┐
│  ENTROPY     │     │  FLUX        │     │  STAR VAULT          │     │  CELESTIAL ASSEMBLER        │
│  GATE        │────▶│  EXCHANGE    │────▶│  & NEBULA BIDS       │────▶│  QUANTUM LIFT‑OFF           │
│  (Bridge)    │     │  (DEX)       │     │  (Mystery Box +      │     │  & COSMIC JACKPOT           │
│              │     │              │     │   Auction)           │     │  (Builder + Launch +        │
│  Lock ETH    │     │  Swap tokens │     │  Buy parts, auction  │     │   Leaderboard)              │
│  Claim Flux  │     │  Add LP      │     │  rare drops          │     │  Build, launch, win ETH     │
└──────────────┘     └──────────────┘     └──────────────────────┘     └─────────────────────────────┘
```



| Step | From → To                                  | What the User Gets                                        |
| ---- | ------------------------------------------ | --------------------------------------------------------- |
| 1    | **Entropy Gate** → Wallet                  | Flux tokens (on‑ramp, start of journey)                   |
| 2    | **Flux Exchange** → Star Vault             | Swap Flux for UVD or acquire tokens to buy mystery boxes  |
| 3    | **Star Vault Boxes** → Nebula Bids         | Open loot crates for parts; submit rare drops for auction |
| 4    | **Nebula Bids** → Celestial Assembler      | Win or earn rocket parts via bidding                      |
| 5    | **Celestial Assembler** → Quantum Lift‑Off | Assemble rocket, launch mission                           |
| 6    | **Quantum Lift‑Off** → Cosmic Jackpot      | Earn Grav Score, rank up, win real ETH                    |

***

***

# APP 1 — Entropy Gate

### *The Bridge & Faucet*

**Tagline:** *"Your portal into the Entropy universe. Lock. Claim. Begin."***Colour Accent:** Deep Purple

***

## 1.1 Purpose

Entropy Gate is the **sole entry‑point** to the testnet. It serves two functions:

1. **Whitelist (one‑time)** — The user locks a small amount of real ETH, which funds the prize pool.
2. **Faucet (recurring)** — The user claims Flux tokens every 24 hours to interact with the rest of the platform.

All locked ETH is **permanently held** by the Bridge smart contract — it can only leave via the prize mechanism in Cosmic Jackpot (App 4).

***

## 1.2 Detailed Flow

| Step | Action             | Contract Call                 | Detail                                                                                                                                        |
| ---- | ------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Connect Wallet** | —                             | MetaMask / WalletConnect. UI detects phi-net testnet chain ID; warns if user is on the wrong chain.                                                     |
| 2    | **Whitelist**      | `bridge.whitelist()`          | User sends **0.05 ETH**. Contract maps address → `whitelisted = true`. ETH is locked forever.                                                 |
| 3    | **Wait 24 h**      | —                             | Countdown timer displayed in the UI.                                                                                                          |
| 4    | **Claim Flux**     | `bridge.claimFlux()`          | Contract checks `block.timestamp >= lastClaim + 86 400`. Mints **1 Flux** to the caller.                                                      |
| 5    | **Entropy Points** | Emitted as off‑chain XP event | Each claim also grants **Entropy Points (XP)** that unlock early‑access perks (e.g., one free Common mystery box after 7 consecutive claims). |
| 6    | **Repeat**         | —                             | User returns every 24 h to claim again.                                                                                                       |

***

## 1.3 Smart‑Contract Interface

```solidity
// Bridge.sol — immutable, no owner, no upgrade keys
function whitelist() external payable;          // Requires msg.value == 0.05 ether
function claimFlux() external;                  // Requires whitelisted[msg.sender] == true
function ethBalance() external view returns (uint256);
```

***

## 1.4 UX Specification

| Element                      | Detail                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| **Hero Section**             | "Welcome to Entropy Gate — Lock 0.05 ETH. Claim 1 Flux daily."                        |
| **Claim Button**             | Large, eye‑catching, disabled with countdown until next window.                       |
| **Progress Bar**             | Shows consecutive daily claims; milestones at 7 / 14 / 30 days unlock XP perks.       |
| **Live Counters**            | Total ETH locked in Bridge · Total Flux supply (minted / burned) · UVD pool reserves. |
| **Wallet Status**            | Badge: "Whitelisted ✓" or "Not Whitelisted".                                          |
| **Prize Pool Indicator**     | Real‑time display of claimable ETH prize pool (links to Cosmic Jackpot).              |
| **Link to Prize Withdrawal** | Sub‑page appears when `PrizeTrigger` event is emitted for the connected address.      |

***

## 1.5 Security

* Audited for re‑entrancy, integer overflow, and timestamp manipulation.
* Whitelist mapping is append‑only; no admin can revoke.
* `claimFlux()` uses `block.timestamp` checks — reverts on replay.
* Source code verified and open‑source on an Etherscan‑style explorer.

***

***

# APP 2 — Flux Exchange

### *The DEX*

**Tagline:** *"Trade at the speed of entropy. Low fees. Full transparency."***Colour Accent:** Teal

***

## 2.1 Purpose

Flux Exchange is a **Uniswap‑style constant‑product AMM** where users swap tokens, provide liquidity, and access stable‑currency (UVD) or volatile assets (BTC/ETH) using their Flux balance.

***

## 2.2 Pools

| Pool         | Base Asset | Quote Asset | Initial Liquidity                              |
| ------------ | ---------- | ----------- | ---------------------------------------------- |
| **Flux–BTC** | Flux       | Wrapped BTC | Seeded by testnet devs                         |
| **Flux–ETH** | Flux       | Wrapped ETH | Seeded with a small amount of ETH + Flux       |
| **Flux–UVD** | Flux       | UVD         | Uses UVD stable‑coin for stable‑swap liquidity |

***

## 2.3 Token Definitions

| Token    | Type            | Source                                                                                                                                                    |
| -------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Flux** | Native / ERC‑20 | Minted only via Entropy Gate `claimFlux()`.                                                                                                               |
| **wBTC** | Wrapped ERC‑20  | Wrapped BTC representation for testnet pair trading.                                                                                                      |
| **wETH** | Wrapped ERC‑20  | Wrapped ETH representation for testnet pair trading.                                                                                                      |
| **UVD**  | Stable‑coin     | Deterministic mint/redemption. 1 UVD ≈ 1 BTC in a Universe Reserve Basket (40% gold, 30% Swiss bank, 30% Singapore dollar). Weekly re‑indexed via oracle. |

### UVD Mechanics (Reference)

| Operation             | Formula                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mint**              | Deposit **x BTC** → receive `x · 10⁸ / sₜ` UVD                                                                                                              |
| **Redeem**            | Return **y UVD** → receive `y · sₜ / 10⁸` BTC                                                                                                               |
| **Collateralisation** | `Cₜ = Bₜ / (Mₜ · sₜ / 10⁸)` — enforced `Cₜ ≥ C_min > 1`                                                                                                     |
| **Weekly Re‑Index**   | Oracle supplies `P_BTC/URB(t)` → neutral rate `s_neutral(t) = 10⁸ / P_BTC/URB(t)`. Adjusted via growth share `g`, log‑change bound `k_max`, and `C_target`. |

***

## 2.4 Swap Formula (Constant Product)

```
amountOut = reserveOut × (amountIn × (1 − fee)) / (reserveIn + amountIn × (1 − fee))
```

Default fee: **0.30%** (configurable per pool at genesis, then immutable).

***

## 2.5 Liquidity Provision

| Action               | Contract Call                           | Detail                                                           |
| -------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| **Add Liquidity**    | `addLiquidity(amountFlux, amountToken)` | User deposits both sides of a pair. Receives LP tokens (ERC‑20). |
| **Remove Liquidity** | `removeLiquidity(lpAmount)`             | Burns LP tokens; returns underlying assets proportionally.       |

***

## 2.6 UX Specification

| Element                 | Detail                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **Quick Trade**         | One‑click swap with auto‑calculated slippage. "Flash Trade" mode for speculative plays. |
| **Live Price Chart**    | Real‑time candlestick chart per pool.                                                   |
| **Order Book / Depth**  | Live depth chart showing pool reserves.                                                 |
| **Slippage Slider**     | User‑adjustable tolerance (default 0.5%).                                               |
| **"Best Price" Button** | Auto‑sets slippage to optimal for the current pool state.                               |
| **Fee Breakdown**       | Transparent display: "Fee: 0.30% · You receive: X tokens". Highlight the low‑fee ethos. |
| **LP Dashboard**        | Shows user's LP positions, share of pool, accrued fees, and yield‑farming rewards.      |

***

## 2.7 Security

* Audited for front‑running, re‑entrancy, and price manipulation.
* No admin keys; pool state is immutable except via normal trading.
* Uses OpenZeppelin `SafeERC20` for all token transfers.

***

***

# APP 3 — Star Vault & Nebula Bids

### *Mystery Box + Auction*

**Tagline:** *"Crack open the cosmos. Bid on destiny."***Colour Accent:** Gold (Star Vault) · Violet (Nebula Bids)

This app has **two tabs / sub‑pages**: the Mystery Box marketplace and the Auction Hall.

***

## 3.1 Star Vault Boxes — Mystery Box

### 3.1.1 Rarity System

The testnet uses **8 rarity tiers**. Each tier has a distinct multiplier applied to the part's base attribute sum.

| Tier | Name          | Colour Badge | Rarity Multiplier | Approximate Drop Rate | Box Price (Flux) |
| ---- | ------------- | ------------ | ----------------- | --------------------- | ---------------- |
| 1    | **Common**    | Grey         | ×1.0              | \~35%                 | 10               |
| 2    | **Uncommon**  | Green        | ×1.25             | \~25%                 | 25               |
| 3    | **Rare**      | Blue         | ×1.6              | \~18%                 | 50               |
| 4    | **Epic**      | Purple       | ×2.0              | \~10%                 | 100              |
| 5    | **Legendary** | Orange       | ×2.5              | \~6%                  | 200              |
| 6    | **Mythic**    | Red          | ×3.2              | \~3.5%                | 350              |
| 7    | **Celestial** | Cyan         | ×4.0              | \~1.8%                | 500              |
| 8    | **Quantum**   | Prismatic    | ×5.0              | \~0.7%                | 750              |

### 3.1.2 Part Value Formula

Each mystery‑box drop produces one rocket part. The part belongs to one of the 8 rocket sections (see App 4) and has three section‑specific attributes, each scored **1–100**.

```
Part Value = (Attribute₁ + Attribute₂ + Attribute₃) × Rarity Multiplier
```

**Example:** A *Legendary* Core Engine with Heat Flux 72, Thrust Efficiency 88, Mass 31 →`(72 + 88 + 31) × 2.5 = 477.5 Part Value`

### 3.1.3 What's Inside a Box

Each box contains **exactly one NFT rocket part**. The part is randomly assigned:

* A **rocket section** (1 of 8 — Core Engine, Wing‑Plate, Fuel Cell, etc.).
* A **named variant** within that section (1 of 8 — e.g., "Pulse Engine", "Nova Thruster").
* A **rarity tier** (1 of 8 — Common through Quantum).
* **Three numeric attributes** (each 1–100), specific to the section.

### 3.1.4 Purchase & Open Flow

| Step | Action             | Detail                                                                                                                                            |
| ---- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Select Box**     | User picks a price tier. Higher‑priced boxes have better odds of rare drops.                                                                      |
| 2    | **Confirm & Pay**  | Transaction sends Flux to the Mystery Box contract.                                                                                               |
| 3    | **Mint Part**      | Contract mints a unique `partID`, assigns section, variant, rarity, and attributes.                                                               |
| 4    | **RNG**            | Attributes derived from `keccak256(abi.encodePacked(blockhash(block.number − 1), partID))`. Deterministic per block, unpredictable ahead of time. |
| 5    | **Open Animation** | Animated "cracking" sequence → reveals part image, rarity badge, attribute stats.                                                                 |
| 6    | **Inventory**      | Part stored in user's on‑chain inventory. Key attributes on‑chain; image/metadata on IPFS.                                                        |

### 3.1.5 UX Specification

| Element             | Detail                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Box Grid**        | Visual grid of 8 box tiers, each with its colour badge and price.                           |
| **Hover Preview**   | Shows drop‑rate breakdown and example parts for that tier.                                  |
| **Open Animation**  | 2–3 second "cracking" animation with particle effects matching the rarity colour.           |
| **Result Card**     | Displays: Part name · Section · Rarity badge · 3 attribute bars (1–100) · Part Value score. |
| **Inventory Panel** | Collapsible sidebar listing all owned parts, sortable by section / rarity / value.          |
| **Action Buttons**  | "View Stats" · "Send to Auction" (if eligible) · "Equip to Rocket" (links to App 4).        |

### 3.1.6 Security

* RNG uses `blockhash(block.number − 1)` — cannot be manipulated after the block is sealed (minor miner bias accepted for non‑critical randomness).
* Audited for integer overflows and re‑entrancy.
* No admin keys; minting logic is immutable.

***

## 3.2 Nebula Bids — Auction

### 3.2.1 Eligibility

Not every part can be auctioned. Only parts that exceed a **rarity threshold** qualify:

| Eligible Tiers                                         | Minimum Rarity     |
| ------------------------------------------------------ | ------------------ |
| Rare · Epic · Legendary · Mythic · Celestial · Quantum | **Rare** (Tier 3+) |

The contract maintains a mapping `partID => isEligible` based on the part's rarity at mint time.

### 3.2.2 Auction Cadence

* **New round every 4 hours**, triggered by `block.timestamp`.
* The contract maintains a queue of active auctions, each with a fixed 4‑hour window.
* The scheduler emits `AuctionStart(partID)` at each interval.

### 3.2.3 Submission & Bidding

| Step | Action                | Detail                                                                                              |
| ---- | --------------------- | --------------------------------------------------------------------------------------------------- |
| 1    | **Submit Item**       | Any wallet can submit one eligible part per round via "Submit Your Item" CTA.                       |
| 2    | **Auto‑Evaluation**   | The system evaluates all submissions and selects the **rarest + highest‑stat** item for auction.    |
| 3    | **Bidding Opens**     | All users can bid via `bid(partID, amountFlux)`.                                                    |
| 4    | **Minimum Increment** | Each new bid must exceed the current highest by at least **5%**.                                    |
| 5    | **Escrow**            | All bids are held in escrow (Flux locked in the contract). Outbid users are refunded automatically. |
| 6    | **Auction Ends**      | After 4 hours, the highest bidder wins. Contract transfers the part to the winner.                  |
| 7    | **Proceeds**          | All Flux proceeds go directly to the wallet that originally submitted the item.                     |

### 3.2.4 Events

```solidity
event AuctionStart(uint256 indexed partID, uint256 startTime);
event BidPlaced(uint256 indexed partID, address bidder, uint256 amount);
event AuctionEnded(uint256 indexed partID, address winner, uint256 finalPrice);
```

### 3.2.5 UX Specification

| Element                             | Detail                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| **Countdown Timer**                 | Large, prominent timer showing time remaining in the current auction round.                |
| **Submit Your Item CTA**            | Card‑style button showing user's eligible parts with a "Submit" action per part.           |
| **Active Auction Panel**            | Displays: Part image · Rarity badge · Attribute bars · Current highest bid · Bidder count. |
| **Bid Input**                       | Number field pre‑populated with minimum valid bid (current highest + 5%).                  |
| **Bid History**                     | Scrollable list of all bids for the active auction.                                        |
| **Leaderboard of Top Contributors** | Sidebar ranking wallets by total Flux earned from auction submissions.                     |
| **Post‑Auction Result**             | Modal: "Auction Complete — Winner: 0x… · Final Price: X Flux".                             |

### 3.2.6 Security

* No re‑entrancy on `bid()` or `finalizeAuction()`.
* Escrow refunds are pull‑based (outbid users call `withdrawBid()`), avoiding push‑payment vulnerabilities.
* No upgrade keys; auction logic is immutable.

***

***

# APP 4 — Celestial Assembler, Quantum Lift‑Off & Cosmic Jackpot

### *Rocket Builder + Launch + Leaderboard*

**Tagline:** *"Build. Launch. Dominate the cosmos."***Colour Accent:** Silver (Assembler) · Fiery Orange (Lift‑Off) · Neon Gold (Jackpot)

This app has **three tabs / sub‑pages**: the Rocket Builder, the Launch Pad, and the Leaderboard.

***

## 4.1 Celestial Assembler — Rocket Builder

### 4.1.1 The 8 Star‑Sections

Every rocket has **8 slots**, one per section. Each section has its own pool of **8 uniquely named parts** and **3 section‑specific attributes** (scale 1–100). Parts are NFTs acquired from Star Vault Boxes or Nebula Bids.

***

#### Section 1 — Core Engine

> *The heart of the ship. Determines raw lift‑off capability and thermal tolerance.*

| # | Part Name         | Attr 1: Heat Flux | Attr 2: Thrust Efficiency | Attr 3: Mass |
| - | ----------------- | ----------------- | ------------------------- | ------------ |
| 1 | Pulse Engine      | 1–100             | 1–100                     | 1–100        |
| 2 | Nova Thruster     | 1–100             | 1–100                     | 1–100        |
| 3 | Quantum Core      | 1–100             | 1–100                     | 1–100        |
| 4 | Radiant Combustor | 1–100             | 1–100                     | 1–100        |
| 5 | Stellar Pulse     | 1–100             | 1–100                     | 1–100        |
| 6 | Plasma Injector   | 1–100             | 1–100                     | 1–100        |
| 7 | Ion Driver        | 1–100             | 1–100                     | 1–100        |
| 8 | Hyper‑Drive       | 1–100             | 1–100                     | 1–100        |

| Attribute             | Meaning                                          | Optimal Direction |
| --------------------- | ------------------------------------------------ | ----------------- |
| **Heat Flux**         | Thermal stress tolerance of the core.            | Higher = better   |
| **Thrust Efficiency** | Lift‑off power output.                           | Higher = better   |
| **Mass**              | Weight penalty that reduces overall performance. | Lower = better    |

***

#### Section 2 — Wing‑Plates

> *Aerodynamic surfaces that govern flight stability and drag.*

| # | Part Name     | Attr 1: Aerodynamic Drag | Attr 2: Surface Area | Attr 3: Durability |
| - | ------------- | ------------------------ | -------------------- | ------------------ |
| 1 | Solar Wings   | 1–100                    | 1–100                | 1–100              |
| 2 | Nebula Fins   | 1–100                    | 1–100                | 1–100              |
| 3 | Aerogel Skins | 1–100                    | 1–100                | 1–100              |
| 4 | Comet Span    | 1–100                    | 1–100                | 1–100              |
| 5 | Meteor Brakes | 1–100                    | 1–100                | 1–100              |
| 6 | Photon Sails  | 1–100                    | 1–100                | 1–100              |
| 7 | Lumen Vents   | 1–100                    | 1–100                | 1–100              |
| 8 | Void Glides   | 1–100                    | 1–100                | 1–100              |

| Attribute            | Meaning                               | Optimal Direction |
| -------------------- | ------------------------------------- | ----------------- |
| **Aerodynamic Drag** | Smoother flight with lower values.    | Lower = better    |
| **Surface Area**     | Affects lift vs. drag trade‑off.      | Context‑dependent |
| **Durability**       | How long the wing lasts under stress. | Higher = better   |

***

#### Section 3 — Fuel Cells

> *Energy storage that determines range and weight efficiency.*

| # | Part Name         | Attr 1: Fuel Capacity | Attr 2: Energy Density | Attr 3: Weight |
| - | ----------------- | --------------------- | ---------------------- | -------------- |
| 1 | Nebula Tank       | 1–100                 | 1–100                  | 1–100          |
| 2 | Void Reservoir    | 1–100                 | 1–100                  | 1–100          |
| 3 | Star‑Fuel Cell    | 1–100                 | 1–100                  | 1–100          |
| 4 | Solar Cell Bank   | 1–100                 | 1–100                  | 1–100          |
| 5 | Photon Reactor    | 1–100                 | 1–100                  | 1–100          |
| 6 | Dark‑Matter Cell  | 1–100                 | 1–100                  | 1–100          |
| 7 | Cryo‑Fuel Capsule | 1–100                 | 1–100                  | 1–100          |
| 8 | Graviton Storage  | 1–100                 | 1–100                  | 1–100          |

| Attribute          | Meaning                            | Optimal Direction |
| ------------------ | ---------------------------------- | ----------------- |
| **Fuel Capacity**  | Maximum flight distance.           | Higher = better   |
| **Energy Density** | Energy per unit weight.            | Higher = better   |
| **Weight**         | Lighter cells improve performance. | Lower = better    |

***

#### Section 4 — Navigation Module

> *On‑board intelligence for course‑keeping and decision‑making.*

| # | Part Name         | Attr 1: Accuracy | Attr 2: Processing Power | Attr 3: Reliability |
| - | ----------------- | ---------------- | ------------------------ | ------------------- |
| 1 | Astro‑Gyro        | 1–100            | 1–100                    | 1–100               |
| 2 | Photon Navigator  | 1–100            | 1–100                    | 1–100               |
| 3 | Quantum GPS       | 1–100            | 1–100                    | 1–100               |
| 4 | Singularity Clock | 1–100            | 1–100                    | 1–100               |
| 5 | Eclipse Tracker   | 1–100            | 1–100                    | 1–100               |
| 6 | Stellar Atlas     | 1–100            | 1–100                    | 1–100               |
| 7 | Chrono‑Scope      | 1–100            | 1–100                    | 1–100               |
| 8 | Deep‑Space Comp   | 1–100            | 1–100                    | 1–100               |

| Attribute            | Meaning                                      | Optimal Direction |
| -------------------- | -------------------------------------------- | ----------------- |
| **Accuracy**         | Precision of course‑keeping.                 | Higher = better   |
| **Processing Power** | Speed of decision‑making.                    | Higher = better   |
| **Reliability**      | Resistance to failure in extreme conditions. | Higher = better   |

***

#### Section 5 — Payload Bay

> *Cargo management — determines what your rocket can carry and how securely.*

| # | Part Name         | Attr 1: Cargo Capacity | Attr 2: Securing Strength | Attr 3: Modularity |
| - | ----------------- | ---------------------- | ------------------------- | ------------------ |
| 1 | Cargo Nebula      | 1–100                  | 1–100                     | 1–100              |
| 2 | Quantum Cargo     | 1–100                  | 1–100                     | 1–100              |
| 3 | Stellar Freight   | 1–100                  | 1–100                     | 1–100              |
| 4 | Black‑Hole Bay    | 1–100                  | 1–100                     | 1–100              |
| 5 | Pulsar Module     | 1–100                  | 1–100                     | 1–100              |
| 6 | Interstellar Hold | 1–100                  | 1–100                     | 1–100              |
| 7 | Orbital Storage   | 1–100                  | 1–100                     | 1–100              |
| 8 | Modular Crate     | 1–100                  | 1–100                     | 1–100              |

| Attribute             | Meaning                             | Optimal Direction |
| --------------------- | ----------------------------------- | ----------------- |
| **Cargo Capacity**    | How much payload can be carried.    | Higher = better   |
| **Securing Strength** | Holds objects stable during launch. | Higher = better   |
| **Modularity**        | Flexibility to swap or upgrade.     | Higher = better   |

***

#### Section 6 — Thruster Array

> *Secondary propulsion — sustained thrust, fuel cycling, and failsafe systems.*

| # | Part Name          | Attr 1: Ion Output | Attr 2: Fuel Efficiency | Attr 3: Redundancy |
| - | ------------------ | ------------------ | ----------------------- | ------------------ |
| 1 | Ion Array          | 1–100              | 1–100                   | 1–100              |
| 2 | Hyper‑Ion Pack     | 1–100              | 1–100                   | 1–100              |
| 3 | Graviton Thrusters | 1–100              | 1–100                   | 1–100              |
| 4 | Pulsar Blades      | 1–100              | 1–100                   | 1–100              |
| 5 | Dark‑Matter Flail  | 1–100              | 1–100                   | 1–100              |
| 6 | Solar‑Blade Pack   | 1–100              | 1–100                   | 1–100              |
| 7 | Lumen Cluster      | 1–100              | 1–100                   | 1–100              |
| 8 | Void Engine        | 1–100              | 1–100                   | 1–100              |

| Attribute           | Meaning                      | Optimal Direction |
| ------------------- | ---------------------------- | ----------------- |
| **Ion Output**      | Thrust of ion‑thrusters.     | Higher = better   |
| **Fuel Efficiency** | Cycles per unit fuel.        | Higher = better   |
| **Redundancy**      | Number of backup subsystems. | Higher = better   |

***

#### Section 7 — Propulsion Cables

> *Power transmission network — the nervous system of the rocket.*

| # | Part Name     | Attr 1: Conductivity | Attr 2: Flexibility | Attr 3: Insulation |
| - | ------------- | -------------------- | ------------------- | ------------------ |
| 1 | Quantum Wire  | 1–100                | 1–100               | 1–100              |
| 2 | Star‑Fiber    | 1–100                | 1–100               | 1–100              |
| 3 | Lumen Conduct | 1–100                | 1–100               | 1–100              |
| 4 | Photon Cable  | 1–100                | 1–100               | 1–100              |
| 5 | Solar‑Weld    | 1–100                | 1–100               | 1–100              |
| 6 | Eclipse Rope  | 1–100                | 1–100               | 1–100              |
| 7 | Photon Thread | 1–100                | 1–100               | 1–100              |
| 8 | Dark‑Fiber    | 1–100                | 1–100               | 1–100              |

| Attribute        | Meaning                                  | Optimal Direction |
| ---------------- | ---------------------------------------- | ----------------- |
| **Conductivity** | Power‑transmission efficiency.           | Higher = better   |
| **Flexibility**  | Ability to bend without breaking.        | Higher = better   |
| **Insulation**   | Protection against temperature extremes. | Higher = better   |

***

#### Section 8 — Shielding

> *Defensive layer — protects the rocket from cosmic hazards.*

| # | Part Name            | Attr 1: Radiation Resistance | Attr 2: Impact Resistance | Attr 3: Weight |
| - | -------------------- | ---------------------------- | ------------------------- | -------------- |
| 1 | Event‑Horizon Shield | 1–100                        | 1–100                     | 1–100          |
| 2 | Radiation Mantle     | 1–100                        | 1–100                     | 1–100          |
| 3 | Impact Field         | 1–100                        | 1–100                     | 1–100          |
| 4 | Graviton Barrier     | 1–100                        | 1–100                     | 1–100          |
| 5 | Nebula Shell         | 1–100                        | 1–100                     | 1–100          |
| 6 | Photon Armor         | 1–100                        | 1–100                     | 1–100          |
| 7 | Singularity Plating  | 1–100                        | 1–100                     | 1–100          |
| 8 | Void Barrier         | 1–100                        | 1–100                     | 1–100          |

| Attribute                | Meaning                                      | Optimal Direction |
| ------------------------ | -------------------------------------------- | ----------------- |
| **Radiation Resistance** | Blocks harmful cosmic rays.                  | Higher = better   |
| **Impact Resistance**    | Protects against debris and micrometeoroids. | Higher = better   |
| **Weight**               | Lighter shields boost overall performance.   | Lower = better    |

***

### 4.1.2 Part Compatibility & Boosts

Each section slot **only accepts parts from its matching section**. Additionally:

* **Set Bonuses** — Equipping parts of the same rarity across multiple slots may unlock boosts (e.g., all‑Legendary = +10% Grav Score bonus).
* **Crafting** — Users can "craft" new parts by combining duplicate parts or staking Flux. Crafted parts inherit the highest attribute values from the inputs, with a small random bonus.

### 4.1.3 Assembly Flow

| Step | Action               | Detail                                                                                                |
| ---- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| 1    | **Open Inventory**   | User sees all owned parts sorted by section, rarity, and value.                                       |
| 2    | **Drag & Drop**      | Drag a part from inventory onto the matching rocket schematic slot.                                   |
| 3    | **Validation**       | Contract checks `ownerOf(partID) == msg.sender`. Assembly mapping `slotID => partID` stored on‑chain. |
| 4    | **Fill All 8 Slots** | "Launch" button appears only when all 8 slots are occupied.                                           |
| 5    | **Save Build**       | User can save the configuration without launching (allows swapping parts later).                      |

**Cost:** Assembly does **not** burn Flux — it only stores the configuration for the upcoming launch.

### 4.1.4 UX Specification

| Element               | Detail                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Rocket Schematic**  | Interactive 3‑D preview of the rocket with 8 labelled slots.                                                                      |
| **Drag & Drop**       | Intuitive drag from inventory panel to schematic slot; invalid drops bounce back.                                                 |
| **Stat Summary**      | Real‑time display of aggregate stats as parts are equipped: total attribute sum, estimated Grav Score range, rarity distribution. |
| **Save Build**        | Stores config on‑chain. "My Builds" page lists saved configurations.                                                              |
| **Export to Mission** | "Launch" button redirects to Quantum Lift‑Off with the active build loaded.                                                       |

***

## 4.2 Quantum Lift‑Off — Launch

### 4.2.1 Launch Parameters

| Parameter                | Source                                                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Time of Day**          | Current `block.timestamp`.                                                                                                                                      |
| **Environmental Factor** | `keccak256(abi.encodePacked(blockhash(block.number − 1), msg.sender, block.timestamp))` → pseudo‑random float \[0, 1]. Simulates weather and launch conditions. |
| **Fuel Cost**            | Small amount of Flux burned as "fuel" to initiate the launch.                                                                                                   |

### 4.2.2 Grav Score Calculation

The score metric is called **"Grav Score"** — it measures the distance‑to‑mass ratio: the more distance a mission covers with fewer resources, the higher the score.

```
Grav Score = Σ(all part attributes across 8 sections)
             × (0.5 × EnvironmentFactor)
             × (1 + RarityBonus)
             − EventPenalties
```

| Component              | Detail                                                             |
| ---------------------- | ------------------------------------------------------------------ |
| **Σ(part attributes)** | Sum of all 24 attribute values (3 per section × 8 sections).       |
| **EnvironmentFactor**  | Pseudo‑random float \[0, 1] derived from blockhash.                |
| **RarityBonus**        | Aggregate bonus based on equipped parts' rarity tiers.             |
| **EventPenalties**     | Score deductions from random events that occur during the mission. |

### 4.2.3 Random Events

During each launch, the **Entropy Signal** may trigger one or more random space events. Each event can destroy or damage a part, reducing the final Grav Score.

| Event             | Effect                                                            | Probability Source             |
| ----------------- | ----------------------------------------------------------------- | ------------------------------ |
| **Meteor Shower** | May destroy a part entirely, removing its attribute contribution. | Entropy Signal · blockhash RNG |
| **Solar Flare**   | Reduces electronic‑related attributes (Navigation, Propulsion).   | Entropy Signal · blockhash RNG |
| **Comet Impact**  | Structural damage to Wing‑Plates and Shielding.                   | Entropy Signal · blockhash RNG |
| **Nutrinoblast**  | Fuel Cell efficiency reduced; range penalty.                      | Entropy Signal · blockhash RNG |
| **Alien Probe**   | Random attribute buff OR debuff (unpredictable).                  | Entropy Signal · blockhash RNG |
| **Solar Storm**   | Broad‑spectrum damage; all sections take minor penalties.         | Entropy Signal · blockhash RNG |

All randomness is **entropy‑coupled** (derived from the weighted entropy `Eₜ` calculated across the four Flux‑driven modules) and deterministic per block.

### 4.2.4 Post‑Launch

* Emits `LaunchCompleted(rocketID, sender, gravScore)`.
* Grav Score automatically written to the Leaderboard contract.
* Launch is a **one‑time state‑change per rocket configuration** — cannot be replayed or manipulated after block confirmation.

### 4.2.5 UX Specification

| Element                      | Detail                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------- |
| **Mission Start Screen**     | Displays equipped rocket, estimated Grav Score range, fuel cost.                  |
| **Launch Animation**         | Real‑time takeoff sequence; random events appear as mid‑flight notifications.     |
| **Live Event Notifications** | "Meteor Shower detected — Wing‑Plate damaged!" style pop‑ups during animation.    |
| **Post‑Mission Stats Panel** | Modal showing: Final Grav Score · Events encountered · Part damage · Rank change. |
| **Retry Option**             | "Re‑Assemble & Retry" button returns user to Celestial Assembler.                 |

***

## 4.3 Cosmic Jackpot — Leaderboard & Prizes

### 4.3.1 Ranking Metrics

| Metric                       | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| **Highest Grav Score**       | Single best launch score for the address.       |
| **Cumulative Grav Score**    | Sum of all launch scores (total missions).      |
| **Most Successful Missions** | Count of launches per time window.              |
| **Highest Auction Proceeds** | Total Flux earned from Nebula Bids submissions. |

Primary ranking is by **Cumulative Grav Score**. The leaderboard updates after every launch.

### 4.3.2 Prize Structure

| Period | Winners            | Prize                                                                                                 |
| ------ | ------------------ | ----------------------------------------------------------------------------------------------------- |
| 24 h   | **Top 3** globally | **50% of the ETH locked** in the Bridge contract, transferred to their main‑net addresses (real ETH). |

Additionally, placement earns rarity‑specific NFT rewards:

| Place | NFT Reward                     |
| ----- | ------------------------------ |
| 1st   | Quantum rarity part (Tier 8)   |
| 2nd   | Celestial rarity part (Tier 7) |
| 3rd   | Mythic rarity part (Tier 6)    |

### 4.3.3 Prize Claim Flow

| Step | Action               | Detail                                                                                             |
| ---- | -------------------- | -------------------------------------------------------------------------------------------------- |
| 1    | **Rank achieved**    | User reaches top 3 after a launch.                                                                 |
| 2    | **Event emitted**    | System emits `PrizeTrigger(address winner)`.                                                       |
| 3    | **Prize Withdrawal** | User navigates to the Prize Withdrawal sub‑page and calls `withdrawPrize()` on the Prize Contract. |
| 4    | **ETH transferred**  | Contract sends locked ETH (minus the 0.05 ETH whitelist fee) to the winner's main‑net address.     |
| 5    | **On‑chain only**    | No external operator involved — the blockchain handles the entire transfer.                        |

### 4.3.4 UX Specification

| Element                     | Detail                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------ |
| **Live Leaderboard Table**  | Paginated, sorted by cumulative Grav Score. Filters: by rarity, part type, user.     |
| **Score Trajectory Graph**  | Line chart of the user's score over time.                                            |
| **Profile Links**           | Click any address to view their build history and parts.                             |
| **Prize Pool Display**      | Real‑time ETH balance in the Bridge contract; countdown to next distribution window. |
| **"Invite Friends" Button** | Referral mechanism — both referrer and invitee earn bonus Entropy Points.            |
| **Prize Claim CTA**         | Appears only when `PrizeTrigger` is emitted for the connected wallet.                |

### 4.3.5 Security

* Prize contract is read‑only after the 24‑hour lock period.
* Prize claims are time‑locked to the next launch event to prevent double‑claims.
* No admin overrides — all logic is deterministic and immutable.

***

***

# Cross‑App Reference

## Token Flow Summary

```
ETH (real)                      Flux                             UVD
───────────                     ────                             ───
User locks 0.05 ETH      ──▶   Claims 1 Flux / 24 h
                                     │
                                     ├──▶  Swap on Flux Exchange  ──▶  UVD (stable)
                                     ├──▶  Buy Mystery Box        ──▶  NFT Part
                                     ├──▶  Bid on Auction         ──▶  NFT Part
                                     └──▶  Fuel a Launch          ──▶  Grav Score
                                                                        │
Prize pool (locked ETH)  ◀──────────────────────────────────────────────┘
```

## Rarity Quick‑Reference

| Tier | Name      | Multiplier | Badge Colour | Auction Eligible | Prize Tier |
| ---- | --------- | ---------- | ------------ | ---------------- | ---------- |
| 1    | Common    | ×1.0       | Grey         | No               | —          |
| 2    | Uncommon  | ×1.25      | Green        | No               | —          |
| 3    | Rare      | ×1.6       | Blue         | Yes              | —          |
| 4    | Epic      | ×2.0       | Purple       | Yes              | —          |
| 5    | Legendary | ×2.5       | Orange       | Yes              | —          |
| 6    | Mythic    | ×3.2       | Red          | Yes              | 3rd place  |
| 7    | Celestial | ×4.0       | Cyan         | Yes              | 2nd place  |
| 8    | Quantum   | ×5.0       | Prismatic    | Yes              | 1st place  |

## Brand Summary

| App | Internal Name   | Brand Name              | Colour Accent | Primary CTA       |
| --- | --------------- | ----------------------- | ------------- | ----------------- |
| 1   | Bridge / Faucet | **Entropy Gate**        | Deep Purple   | "Claim Your Flux" |
| 2   | DEX             | **Flux Exchange**       | Teal          | "Start Trading"   |
| 3a  | Mystery Box     | **Star Vault Boxes**    | Gold          | "Open a Box"      |
| 3b  | Auction         | **Nebula Bids**         | Violet        | "Place Your Bid"  |
| 4a  | Rocket Builder  | **Celestial Assembler** | Silver        | "Start Building"  |
| 4b  | Launch          | **Quantum Lift‑Off**    | Fiery Orange  | "Launch Now"      |
| 4c  | Leaderboard     | **Cosmic Jackpot**      | Neon Gold     | "See Leaderboard" |

## Visual Identity

* **Background:** Star‑field with subtle parallax.
* **Accents:** Neon glows matching each app's colour accent.
* **Typography:** Futuristic sans‑serif.
* **Animations:** Particle effects on box opens, rocket launches, and prize claims.

***

*This document serves as the definitive app‑level specification for the Entropy Testnet. All smart contracts are immutable, open‑source, and deployed without admin keys — reflecting the core ethos of the Entropy Network.*
