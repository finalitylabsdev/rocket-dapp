# UI/UX Interface Designer

# Entropy Testnet — UI/UX Interface Design Brief

> **Role:** Interface Designer (UI/UX)**Scope:** Every screen, layout, component, interaction, flow, and responsive behaviour across all four Entropy web apps**You will receive:** Visual assets (icons, illustrations, part artwork, box renders, animations) from the Asset Designer — your job is to define *where* they go, *how* they behave, and *what the user experiences*

***

***

# 1. What Is This Project?

## 1.1 The Product

Entropy is a **blockchain‑based testnet platform** where users earn tokens, trade them, collect NFT rocket parts, build rockets, and launch them for a score. Top scorers win **real ETH** (real money). Think of it as a premium space‑trading game layered on top of a crypto financial platform.

The platform is split into **four web apps** that form a linear journey:

```
APP 1              APP 2              APP 3                    APP 4
Entropy Gate  →  Entropy Exchange  →  Star Vault &        →  Celestial Assembler,
(Bridge/Faucet)  (DEX/Trading)       Nebula Bids             Quantum Lift‑Off &
                                     (Mystery Box + Auction)  Cosmic Jackpot
                                                              (Builder + Launch + Leaderboard)
```

All four apps share a single navigation bar and wallet connection. A user can move freely between them.

## 1.2 The User Journey

Here's what a user does, start to finish:

1. **Connects their crypto wallet** (MetaMask or similar).
2. **Locks 0.05 ETH** in Entropy Gate to join the testnet (one‑time).
3. **Claims 1 φ (Entropy token) every 24 hours** from the faucet.
4. **Swaps tokens** on Entropy Exchange (φ for BTC, ETH, or UVD stable‑coin).
5. **Buys mystery boxes** in Star Vault with φ to get random NFT rocket parts.
6. **Auctions rare parts** in Nebula Bids to earn more φ.
7. **Assembles a rocket** from 8 parts in the Celestial Assembler.
8. **Launches the rocket** in Quantum Lift‑Off — faces random space events — gets a "Grav Score."
9. **Climbs the leaderboard** in Cosmic Jackpot — top 3 win real ETH.

## 1.3 Key Terminology

| Term           | Meaning                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **φ (phi)**    | The Entropy token. The platform's currency. Symbol: φ. Displayed as "φ 25" (symbol before number).  |
| **UVD**        | A stable‑coin (like a dollar equivalent) tradeable on the exchange.                                 |
| **ETH**        | Ethereum — real cryptocurrency. Users lock it to join; winners receive it as a prize.               |
| **BTC**        | Bitcoin — tradeable on the exchange (wrapped/testnet version).                                      |
| **Grav Score** | The score from a rocket launch. Stands for "distance to mass" ratio. Higher = better.               |
| **Rarity**     | Every part has a rarity tier (1–8). Higher = more powerful and more valuable.                       |
| **Part**       | An NFT rocket component. Belongs to one of 8 rocket sections. Has 3 numeric stats.                  |
| **Section**    | One of the 8 areas of a rocket (engine, wings, fuel, etc.). Each rocket needs one part per section. |
| **Whitelist**  | The one‑time process of locking ETH to join the testnet.                                            |
| **LP Token**   | Liquidity Provider token — received when adding liquidity to the exchange.                          |
| **XP**         | Entropy Points — earned from daily claims. Unlock perks like free mystery boxes.                    |

## 1.4 Design Philosophy

**"Apple meets the cosmos — ruthlessly clean, impossibly fun."**

Three pillars:

| Pillar        | What It Means for Your Work                                                      |
| ------------- | -------------------------------------------------------------------------------- |
| **Precision** | Generous whitespace, strict alignment, consistent spacing, confident typography. |
| **Wonder**    | Dark cosmic backgrounds, neon accents, moments of visual surprise and awe.       |
| **Play**      | Gamified interactions, celebratory animations, rewarding micro‑feedback.         |

The UI should feel like a **premium app**, not a typical crypto dashboard. No visual clutter. No "DeFi chaos." Every element earns its place on the screen.

***

***

# 2. Design System Spec

These are the rules that govern every screen you design. Consistency here = a polished product.

## 2.1 Colour System

### Base Palette (used everywhere)

| Token          | Hex       | Role                                    |
| -------------- | --------- | --------------------------------------- |
| `--void`       | `#06080F` | Primary background. "The space."        |
| `--void-mid`   | `#0C1018` | Card and panel backgrounds.             |
| `--void-light` | `#141A26` | Hover states, secondary panels, modals. |
| `--dust`       | `#1E2636` | Borders, dividers, subtle separators.   |
| `--nebula`     | `#2A3348` | Disabled/inactive states.               |
| `--star`       | `#E8ECF4` | Primary text.                           |
| `--star-dim`   | `#8A94A8` | Secondary text, labels, captions.       |
| `--star-faint` | `#4A5468` | Placeholder text, tertiary info.        |

### App Accent Colours (one per app/sub‑app)

| App / Sub‑App       | Token         | Hex       | Where It Appears                             |
| ------------------- | ------------- | --------- | -------------------------------------------- |
| Entropy Gate        | `--gate`      | `#8B5CF6` | Claim button, XP bar, progress indicators.   |
| Entropy Exchange    | `--exchange`  | `#06D6A0` | Swap button, price charts, LP indicators.    |
| Star Vault Boxes    | `--vault`     | `#F6C547` | Box outlines, buy buttons, store highlights. |
| Nebula Bids         | `--bids`      | `#A855F7` | Bid buttons, auction timer, bid indicators.  |
| Celestial Assembler | `--assembler` | `#94A3B8` | Slot borders, stat bars, build UI.           |
| Quantum Lift‑Off    | `--liftoff`   | `#F97316` | Launch button, event alerts, fire effects.   |
| Cosmic Jackpot      | `--jackpot`   | `#FACC15` | Rankings, prize display, claim button.       |

### Rarity Colours (override accent colours wherever a part or box is shown)

| Tier      | Hex       | Visual Treatment                                          |
| --------- | --------- | --------------------------------------------------------- |
| Common    | `#6B7280` | Flat badge, no glow.                                      |
| Uncommon  | `#22C55E` | Faint green glow on hover.                                |
| Rare      | `#3B82F6` | Soft blue outer glow, always on.                          |
| Epic      | `#8B5CF6` | Purple glow with subtle pulse (2s loop).                  |
| Legendary | `#F59E0B` | Orange glow + diagonal shimmer sweep (4s loop).           |
| Mythic    | `#EF4444` | Red glow + floating ember particles.                      |
| Celestial | `#06B6D4` | Cyan glow + aurora wave effect.                           |
| Quantum   | Prismatic | Full‑spectrum shifting gradient. Animated rainbow border. |

**Rule:** Rarity colour is always the loudest signal. It overrides the app accent colour wherever parts are displayed.

## 2.2 Typography

| Role        | Font                | Weights | Usage                                                       |
| ----------- | ------------------- | ------- | ----------------------------------------------------------- |
| **Display** | Geist Mono          | 500–800 | Headlines, score displays, countdowns, φ amounts.           |
| **Body**    | Satoshi (Fontshare) | 400–700 | Paragraphs, labels, buttons, nav, forms.                    |
| **Data**    | Geist Mono          | 400     | Token amounts, wallet addresses, stat numbers, table cells. |

### Type Scale (Desktop)

| Token     | Size | Weight | Line Height | Use Case                         |
| --------- | ---- | ------ | ----------- | -------------------------------- |
| `--h-xl`  | 56px | 800    | 1.05        | Hero headlines only.             |
| `--h-lg`  | 36px | 700    | 1.1         | Section titles.                  |
| `--h-md`  | 24px | 600    | 1.2         | Card titles, modal headers.      |
| `--h-sm`  | 18px | 600    | 1.3         | Sub‑headings, tab labels.        |
| `--body`  | 15px | 400    | 1.6         | Default body text.               |
| `--small` | 13px | 400    | 1.5         | Captions, timestamps, footnotes. |
| `--micro` | 11px | 500    | 1.4         | Badges, tooltips, status pills.  |

### Rules

* Headlines: **UPPERCASE**, letter‑spacing +0.05em.
* Body: Sentence case.
* Token amounts: Always Geist Mono, never body font. Format: `φ 250`.
* No underlines except true hyperlinks.

## 2.3 Spacing (8px Base)

| Token   | Value | Usage                               |
| ------- | ----- | ----------------------------------- |
| `--s-1` | 4px   | Icon‑to‑label gaps.                 |
| `--s-2` | 8px   | Badge/pill internal padding.        |
| `--s-3` | 16px  | Card padding, input padding.        |
| `--s-4` | 24px  | Card‑to‑card margins, section gaps. |
| `--s-5` | 32px  | Major section dividers.             |
| `--s-6` | 48px  | Page section spacing.               |
| `--s-7` | 64px  | Hero breathing room.                |
| `--s-8` | 96px  | Page top/bottom margins.            |

**Philosophy:** When in doubt, add more space. The cosmic theme is vast, not cramped.

## 2.4 Grid

* **12 columns**, max‑width **1280px**, **24px gutters**.
* Centre‑aligned on the page.

## 2.5 Elevation & Surfaces

| Level | Background     | Border           | Usage                        |
| ----- | -------------- | ---------------- | ---------------------------- |
| 0     | `--void`       | None             | Page background.             |
| 1     | `--void-mid`   | 1px `--dust`     | Cards, panels, nav bar.      |
| 2     | `--void-light` | 1px `--dust`     | Modals, dropdowns, popovers. |
| 3     | `--void-light` | 1px accent (30%) | Active/focused states.       |

### Corner Radii

| Element        | Radius |
| -------------- | ------ |
| Cards & modals | 16px   |
| Buttons        | 12px   |
| Badges & pills | Full   |
| Inputs         | 10px   |

### Glassmorphism (used sparingly)

* **Where:** Nav bar + wallet HUD only.
* **Spec:** `backdrop-filter: blur(24px)`, 70% opacity `--void-mid`.
* **Never** on content cards.

## 2.6 Background

The entire platform sits on a **living star‑field** canvas (you will receive this from the asset designer as an animated component). Each app tints the star‑field with its accent colour as a soft nebula haze that fades in on navigation.

***

***

# 3. Global Components

These components appear on every page. Design them once, reuse everywhere.

## 3.1 Navigation Bar

**Position:** Fixed top, 64px tall, glassmorphic, full‑width.

| Left Side                    | Centre                                                   | Right Side                 |
| ---------------------------- | -------------------------------------------------------- | -------------------------- |
| φ logo mark + "ENTROPY" text | Tab pills: Gate · Exchange · Vault · Assembler · Jackpot | Wallet address + φ balance |

**States:**

* Active tab: Filled pill in current app's accent colour, white text.
* Inactive tab: Transparent, `--star-dim` text. Hover → `--star` text.
* Mobile: Converts to a **bottom tab bar** with icons only, label appears on active tab only.

## 3.2 Wallet HUD

**Position:** Top‑right, inside nav bar.

**Contents:**

* Truncated address: `0xA3…7F` + copy‑to‑clipboard icon.
* φ balance: Animated φ Pulse on change (scale to 1.15×, ring pulse, settle).
* Network badge: "E‑Net Testnet" — green dot if connected, red dot if wrong chain.

**Tap to expand:** Dropdown showing full address, ETH balance, UVD balance, "Disconnect Wallet" option.

## 3.3 Confirmation Drawer

**Used for:** Every critical action (whitelist, swap, buy box, bid, launch).

| Property      | Spec                                                             |
| ------------- | ---------------------------------------------------------------- |
| Type          | Bottom drawer (NOT a centred modal) — keeps context visible.     |
| Height        | Auto, max 40vh.                                                  |
| Background    | `--void-mid` at 95% opacity.                                     |
| Border radius | 24px top corners.                                                |
| Content       | Action summary + cost breakdown + \[Confirm] button + \[Cancel]. |
| Entrance      | Slides up from bottom, 250ms.                                    |
| Dismissal     | Tap outside, tap Cancel, or swipe down.                          |
| Overlay       | `--void` at 50% opacity behind the drawer.                       |

## 3.4 Toast Notifications

**Position:** Top‑right, stacked, max 3 visible.

| Type        | Icon        | Left Border Colour | Auto‑Dismiss |
| ----------- | ----------- | ------------------ | ------------ |
| Success     | ✓ checkmark | `--exchange`       | 4s           |
| Info        | ℹ circle    | `--star-dim`       | 5s           |
| Warning     | ⚠ triangle  | `--vault`          | 6s           |
| Error       | ✕ cross     | `#EF4444`          | Manual only  |
| Celebration | ✦ star      | `--jackpot`        | 6s           |

**Spec:** `--void-mid` background, 1px `--dust` border, left coloured accent strip (4px). Slide in from right, 250ms.

## 3.5 Buttons

### Primary (CTA)

| Property   | Spec                                                    |
| ---------- | ------------------------------------------------------- |
| Background | Current app's accent colour.                            |
| Text       | White, Satoshi 600, 15px.                               |
| Padding    | 12px 24px.                                              |
| Radius     | 12px.                                                   |
| Hover      | Glow intensifies (box-shadow at 40% opacity of accent). |
| Active     | Scale to 0.97×.                                         |
| Disabled   | `--nebula` background, `--star-faint` text, no glow.    |
| Loading    | Text replaced with pulsing dots in white.               |

### Secondary

Same as primary but: transparent background, 1px accent border, accent‑coloured text. Hover: fills with accent at 10% opacity.

### Ghost

Text‑only, no border. `--star-dim` text. Hover: underline.

## 3.6 Input Fields

| Property    | Spec                                                |
| ----------- | --------------------------------------------------- |
| Background  | `--void-mid`.                                       |
| Border      | 1px `--dust`. Focus: 1px accent.                    |
| Text        | `--star`, Geist Mono for numeric, Satoshi for text. |
| Padding     | 12px 16px.                                          |
| Radius      | 10px.                                               |
| Placeholder | `--star-faint`.                                     |
| Label       | `--star-dim`, `--small` size, 4px above input.      |

## 3.7 Stat Bar (Attribute Display)

A horizontal progress bar used to display a part's attribute value (1–100).

| Property    | Spec                                                          |
| ----------- | ------------------------------------------------------------- |
| Track       | `--dust` background, 6px height, full radius.                 |
| Fill        | Rarity colour of the part, left‑to‑right.                     |
| Label left  | Attribute name, `--small`, `--star-dim`.                      |
| Label right | Numeric value, `--small`, Geist Mono, `--star`.               |
| Animation   | Fill animates from 0 to value on appearance (400ms ease‑out). |

## 3.8 Part Card (Reusable Component)

Used in: Inventory, box reveal, auction display, builder inventory, leaderboard profiles.

```
┌──────────────────────┐
│  [Section Icon]  RARE│  ← Rarity badge pill, top‑right
│                      │
│   [Part Illustration]│  ← From asset designer (IPFS)
│                      │
│  Nova Thruster       │  ← Part name, --h-sm
│  Core Engine         │  ← Section name, --small, --star-dim
│                      │
│  Heat Flux    ████ 72│  ← Stat bar
│  Thrust Eff.  ████ 88│  ← Stat bar
│  Mass         ██   31│  ← Stat bar
│                      │
│  Value: 477.5        │  ← Geist Mono, --star-dim
└──────────────────────┘
```

**Card size:** 240px wide (desktop), 160px (mobile). Height adapts to content.**Background:** `--void-mid`, 1px `--dust` border, 16px radius.**Hover:** Lifts 4px (translateY), border brightens to rarity colour.**Rarity badge:** Pill shape, rarity colour background, white text, positioned top‑right with 8px offset.

## 3.9 Loading & Empty States

| State                   | Treatment                                                                     |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Page loading**        | Skeleton screens: `--dust` shimmer bars matching content layout. No spinners. |
| **Empty state**         | Illustrated artwork (from asset designer) + explanation + clear CTA.          |
| **Transaction pending** | Button text replaced with pulsing dots + "Confirming…"                        |
| **Error state**         | Red‑bordered toast with plain‑language message + retry button.                |

***

***

# 4. App Screens — Detailed Specs

## APP 1 — Entropy Gate (Bridge & Faucet)

**Accent:** `--gate` purple (`#8B5CF6`)**Tabs/Pages:** Single page.

***

### Screen 1.1: Main Page

**Layout:** Full‑viewport hero. No scroll required for core action.

**Zones (top to bottom):**

| Zone              | Content                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Hero (centre)** | Headline: "YOUR JOURNEY BEGINS WITH A SINGLE φ" (`--h-xl`). Claim button below.          |
| **Claim Button**  | Large pill, `--gate` purple, centred. See states below.                                  |
| **Countdown**     | Below button: "Next claim in: 23:41:07" (Geist Mono, `--star-dim`).                      |
| **Stats Row**     | Three stat cards in a row: "ETH Locked" · "φ Supply" · "Prize Pool." Monospaced numbers. |
| **XP Progress**   | Bar showing daily claim streak (7 segments). Milestone marker at day 7 (free box).       |

**Claim Button States:**

| State               | Appearance                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Not whitelisted** | Text: "Lock 0.05 ETH to Enter" with lock icon. Purple outline (secondary button style). Tap opens confirmation drawer.   |
| **Claim available** | Text: "CLAIM φ 1". Full purple fill, soft outer glow pulsing (3s loop). Tap triggers φ Pulse animation + balance update. |
| **On cooldown**     | Text: "CLAIMED ✓". Desaturated `--nebula`. Radial progress ring around button filling over 24h. Countdown below.         |

**Stat Cards:**

* `--void-mid` background, 1px `--dust` border.
* Label: `--small`, `--star-dim`.
* Value: `--h-md`, Geist Mono, `--star`.
* Values tick up live (odometer‑style) when new whitelists occur.

**XP Progress Bar:**

* 7 segments (for weekly streak). Filled segments: `--gate` purple. Unfilled: `--dust`.
* Milestone icon (tiny mystery box) at position 7.
* Below bar: "Day 5 of 7 — Free Common Box at Day 7" (`--small`, `--star-dim`).

***

## APP 2 — Entropy Exchange (DEX)

**Accent:** `--exchange` teal (`#06D6A0`)**Tabs/Pages:** Swap (default) · Liquidity.

***

### Screen 2.1: Swap Interface

**Layout:** Two‑panel. Swap card (left, 60%) + Market info (right, 40%). On mobile: single column, swap card on top, market info below as a collapsible section.

#### Left Panel — Swap Card

| Element                   | Spec                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Title**                 | "SWAP" (`--h-md`).                                                                                                            |
| **"From" input group**    | Token selector dropdown (left) + amount input (right).                                                                        |
| **Token selector**        | Pill button showing token icon + ticker (e.g., "φ ▾"). Tap opens dropdown with: icon, name, balance, 24h sparkline per token. |
| **Amount input**          | Geist Mono, 24px, right‑aligned. Below: "Balance: φ 47" as clickable "MAX" shortcut.                                          |
| **Swap direction toggle** | ⇅ icon between From and To. Tap: rotates 180° (300ms), fields swap.                                                           |
| **"To" input group**      | Same layout. Amount auto‑calculates (300ms debounce).                                                                         |
| **Rate display**          | "1 φ = 0.00026 ETH" (`--small`, `--star-dim`).                                                                                |
| **Swap button**           | Full‑width primary CTA: "SWAP NOW". Teal.                                                                                     |
| **Details row**           | Below button: "Slippage: 0.5% \[Adjust]" + "Fee: 0.036 φ". Always visible.                                                    |
| **Slippage adjuster**     | Tap "Adjust" → slim panel with preset pills (0.1%, 0.5%, 1.0%, Custom input).                                                 |

**Swap button flow:**

1. Tap → text becomes "Confirming…" with loader.
2. Success → text becomes "Swapped ✓" (teal flash, 1.5s) → reverts to "SWAP NOW."
3. Failure → error toast.

#### Right Panel — Market Info

| Element              | Spec                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------- |
| **Price chart**      | Dark canvas, single teal line. Time toggles: 1H · 24H · 7D · 30D. Crosshair on hover. |
| **Pool depth chart** | Area chart, teal fill, same dark background.                                          |
| **Pool stats**       | Liquidity · 24h Volume · Fee — three rows, monospaced values.                         |

#### Flash Trade Mode

Toggle in top‑right of swap card. When active:

* Card border pulses teal.
* Inputs auto‑fill "Best Price" slippage.
* CTA changes to "FLASH SWAP" with lightning‑bolt icon.

***

### Screen 2.2: Liquidity Tab

**Layout:** Single panel, same max‑width as swap card.

**Content:**

| Section                  | Detail                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------- |
| **"Add Liquidity" card** | Two‑token input (same style as swap card). "Supply" CTA. Confirmation drawer.      |
| **"My Positions" table** | Pool name · LP balance · Pool share % · Accrued fees · \[Withdraw] button per row. |
| **Yield farming banner** | If active: top banner showing APY + flame icon + "Stake LP" CTA.                   |

***

## APP 3 — Star Vault & Nebula Bids (Mystery Box + Auction)

**Two tabs** at the top of this app: **Star Vault** (default) · **Nebula Bids**.

***

### Screen 3.1: Star Vault — Mystery Box Store

**Accent:** `--vault` gold (`#F6C547`)**Layout:** Full‑width grid, 4 columns desktop, 2 columns mobile.

**Header:** "STAR VAULT" (`--h-lg`) + "Crack open the cosmos." (`--body`, `--star-dim`) + \[My Inventory →] link (top‑right).

#### Box Grid

8 box cards (one per rarity tier), in two rows of 4.

**Per box card:**

| Element        | Spec                                                                                   |
| -------------- | -------------------------------------------------------------------------------------- |
| **Box image**  | Centred illustration (from asset designer). See asset brief for tier‑specific designs. |
| **Tier label** | Rarity name, `--h-sm`, rarity colour.                                                  |
| **Price**      | "φ \[price]", Geist Mono.                                                              |
| **BUY button** | Primary CTA, `--vault` gold.                                                           |
| **Hover**      | Card lifts 4px. Tooltip appears: drop‑rate breakdown for that tier.                    |
| **3D tilt**    | Card tilts ±5° on mouse move (perspective transform).                                  |

**Box prices:**

| Tier      | Price |
| --------- | ----- |
| Common    | φ 10  |
| Uncommon  | φ 25  |
| Rare      | φ 50  |
| Epic      | φ 100 |
| Legendary | φ 200 |
| Mythic    | φ 350 |
| Celestial | φ 500 |
| Quantum   | φ 750 |

**Purchase → Open flow:**

| Step | What Happens on Screen                                                                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Tap "BUY" → Confirmation drawer: "Open a \[Tier] Star Vault Box for φ \[Price]?" + \[Confirm] / \[Cancel].                                             |
| 2    | Confirm → Button becomes loader → Transaction submits.                                                                                                 |
| 3    | Success → Full‑screen overlay (`--void` at 90% opacity). Purchased box appears centred.                                                                |
| 4    | "OPEN" button appears below the box, pulsing in rarity colour.                                                                                         |
| 5    | Tap "OPEN" → **Box Crack animation** plays (2.5s — from asset designer).                                                                               |
| 6    | Part card floats up from behind split box → **Rarity Reveal animation** (800ms — background flash, badge slides in, attribute bars fill sequentially). |
| 7    | Result card displayed: Part name, section icon, rarity badge, 3 stat bars, Part Value.                                                                 |
| 8    | Below card: \[EQUIP TO ROCKET] · \[SEND TO AUCTION] · \[VIEW IN INVENTORY].                                                                            |

***

### Screen 3.2: Inventory Panel

**Access:** "My Inventory →" link in Star Vault header, OR persistent sidebar on desktop.

**Layout:** Grid of Part Cards (see Component 3.8). 4 columns desktop, 2 mobile.

**Sorting & Filtering:**

* **Sort:** Value (default) · Rarity · Section · Date acquired.
* **Filter:** Section (8 icon toggles) · Rarity (8 colour‑coded toggles).
* Filters displayed as sticky horizontal pill bar at top, scrollable on mobile.

**Card interactions:**

* Tap → Expanded detail modal: full stat breakdown with attribute meanings, rarity multiplier, "Equip" / "Auction" / "Craft" buttons.
* Long‑press (mobile) or right‑click (desktop) → Quick‑action menu.

***

### Screen 3.3: Nebula Bids — Auction Hall

**Accent:** `--bids` violet (`#A855F7`)**Layout:** Split — Active auction (left, 65%) + Sidebar (right, 35%). On mobile: stacked.

#### Left Panel — Active Auction

| Element                 | Spec                                                                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Countdown timer**     | Large, mechanical split‑flap digits (asset designer provides animation). Centred above auction panel. Last 60s: digits turn `--liftoff` orange + faint siren pulse on panel border. |
| **Auctioned part**      | Large Part Card (expanded view): illustration, rarity badge, section icon, 3 stat bars, Part Value.                                                                                 |
| **Current bid display** | "Current Bid: φ 340" (Geist Mono, `--h-md`).                                                                                                                                        |
| **Bid count**           | "Bids: 12" (`--small`, `--star-dim`).                                                                                                                                               |
| **Bid input**           | Number field, pre‑filled with minimum valid bid (current highest + 5%). Geist Mono.                                                                                                 |
| **BID button**          | Primary CTA, `--bids` violet. Next to input field.                                                                                                                                  |
| **Bid history**         | Scrollable list below: address · amount · time ago. Most recent on top.                                                                                                             |

**Outbid notification:** If the user is outbid while on this page, a toast slides in: "You've been outbid! New highest: φ X" + \[Re‑bid] button.

**Auction end:** Full‑screen modal: "AUCTION COMPLETE" → winner address → final price (odometer) → part card → "Part transferred to \[winner]."

**Between rounds:** "Next auction in: HH:MM:SS" countdown + blurred preview of submitted items (builds suspense).

#### Right Sidebar

| Section                    | Content                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------ |
| **Submit Your Item**       | User's eligible parts (Rare+) displayed as mini cards with "Submit" button per card. |
| **Eligibility note**       | "Only Rare or higher parts can be submitted." (`--small`, `--star-dim`).             |
| **Top Contributors board** | Ranked list of wallets by total φ earned from auction submissions.                   |

***

## APP 4 — Celestial Assembler, Quantum Lift‑Off & Cosmic Jackpot

**Three tabs:** **Assembler** (default) · **Lift‑Off** · **Jackpot**.

***

### Screen 4.1: Celestial Assembler — Rocket Builder

**Accent:** `--assembler` silver (`#94A3B8`)**Layout:** Two‑panel. Rocket schematic (left, 55%) + Inventory drawer (right, 45%). Mobile: schematic on top (collapsible), inventory below.

#### Left Panel — Rocket Schematic

A **stylised vertical cross‑section** of the rocket — clean technical blueprint aesthetic. Thin white lines on `--void`. **Not** photorealistic.

**8 labelled slots** stacked vertically (top to bottom):

| Position | Slot Name         | Section # |
| -------- | ----------------- | --------- |
| Top      | Shielding         | 8         |
| 2        | Navigation Module | 4         |
| 3        | Payload Bay       | 5         |
| 4        | Wing‑Plates       | 2         |
| 5        | Propulsion Cables | 7         |
| 6        | Fuel Cells        | 3         |
| 7        | Thruster Array    | 6         |
| Bottom   | Core Engine       | 1         |

**Empty slot:** Dashed border, "+" icon, section name in `--star-faint`.**Filled slot:** Background wash in part's rarity colour (low opacity). Part name displayed. Slot border: solid, rarity colour.

**Glow effect:** As more slots are filled, a dim light travels up the rocket outline, growing brighter. When all 8 are filled, the entire outline pulses gently.

**Drag and drop:**

* Drag a part from right panel → valid slot highlights with a green pulse → drop → Drag Snap animation (250ms, magnetic snap, rarity flash).
* Invalid drop target: slot shakes briefly, part returns to inventory.
* Slot already occupied: tooltip "Replace \[Current] with \[New]?" → confirm to swap (old part animates back to inventory).

#### Right Panel — Inventory + Stats

**Top section:** Part grid (same as Screen 3.2 Inventory but filtered to unequipped parts). Sort/filter controls.

**Bottom section — Stats Preview:**

| Metric               | Spec                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| **Total Attributes** | Sum of all 24 attribute values. Geist Mono, `--h-md`.                  |
| **Est. Grav Score**  | Range (e.g., "480–720"). Updates live as parts are equipped.           |
| **Rarity Bonus**     | Percentage. If set bonus active: "SET BONUS ACTIVE ✦" badge + sparkle. |
| **Slots Filled**     | "5 / 8" with mini progress bar.                                        |

#### Launch Button

* **Locked:** Bottom of schematic panel. Grey, lock icon, "Fill all 8 slots to unlock LAUNCH."
* **Unlocked:** Large pill, `--liftoff` orange, pulsing glow. Text: "LAUNCH →". Hover: rocket schematic shakes subtly.
* Tap → Navigates to Lift‑Off tab with the active build loaded.

***

### Screen 4.2: Quantum Lift‑Off — Launch Mission

**Accent:** `--liftoff` orange (`#F97316`)**Layout:** Full‑screen cinematic. Minimal persistent chrome (nav bar fades to 30% opacity during animation).

#### Pre‑Launch State

| Element             | Spec                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| **Title**           | "QUANTUM LIFT‑OFF" (`--h-lg`), centred.                                |
| **Rocket preview**  | Assembled rocket (from asset designer), idle on a launch pad. Centred. |
| **Est. Grav Score** | Range from builder. Below rocket.                                      |
| **Fuel cost**       | "Fuel: φ 2" (`--small`).                                               |
| **IGNITE button**   | Massive pill, `--liftoff` orange, fire emoji icon, heavy glow.         |

#### Launch Sequence (After IGNITE)

| Phase         | Duration | What You Need to Design                                                                                              |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| **Countdown** | 3s       | "3… 2… 1…" — large Geist Mono numerals, each with screen shake.                                                      |
| **Ignition**  | 1s       | Flame particles from rocket base (from asset designer). Screen rumble.                                               |
| **Ascent**    | 3–5s     | Camera zooms out, star streaks fill background, rocket ascends.                                                      |
| **Events**    | Varies   | Event cards slide in from right (see table below). Damaged parts flash red on rocket. Event timeline stacks on left. |
| **Arrival**   | 1s       | Rocket reaches final position. Screen dims to black.                                                                 |

**Event Card Layout:**

```
┌───────────────────────────────┐
│  ☄️  METEOR SHOWER            │
│                               │
│  Wing‑Plate damaged           │
│  Durability −40               │
│                               │
│  [Red accent stripe on left]  │
└───────────────────────────────┘
```

Event cards: 300px wide, `--void-mid` background, rarity left stripe in event colour, 2s visible then slide out right.

**Random event types:**

| Event         | Icon | Card Accent | Effect Description                             |
| ------------- | ---- | ----------- | ---------------------------------------------- |
| Meteor Shower | ☄️   | Red         | Part destroyed — attributes removed.           |
| Solar Flare   | ☀️   | Orange      | Electronics affected — Nav/Prop stats reduced. |
| Comet Impact  | 💫   | Deep Red    | Structural damage — Wings/Shielding hit.       |
| Nutrinoblast  | ⚛️   | Purple      | Fuel leak — Fuel Cell efficiency reduced.      |
| Alien Probe   | 👁   | Cyan        | Unpredictable — random buff OR debuff.         |
| Solar Storm   | 🌊   | Yellow      | All systems stressed — small penalty to all.   |

#### Post‑Launch — Score Reveal

| Element              | Spec                                                                             |
| -------------------- | -------------------------------------------------------------------------------- |
| **Overlay**          | Full‑screen `--void` at 95% opacity.                                             |
| **Label**            | "GRAV SCORE" in `--star-dim`, Geist Mono, centred.                               |
| **Score counter**    | Counts from 0 to final value, 48px+, Geist Mono, `--ease-bounce` (1.2s).         |
| **Event summary**    | Row of event icons encountered. Below: part damage report.                       |
| **Top 3 result**     | Confetti burst + golden flash + "YOU'RE IN THE TOP 3" + \[Go to Cosmic Jackpot]. |
| **Non‑top‑3 result** | "Current rank: #47. 12 points from #46." + \[RE‑ASSEMBLE & RETRY] button.        |

***

### Screen 4.3: Cosmic Jackpot — Leaderboard

**Accent:** `--jackpot` gold (`#FACC15`)**Layout:** Single column, centred, max‑width 960px.

#### Top Stats Bar

Three stat cards in a row:

| Card        | Content                                    |
| ----------- | ------------------------------------------ |
| Prize Pool  | Total ETH locked in Bridge. Live‑ticking.  |
| Your Rank   | Current position (e.g., "#14").            |
| Next Payout | Countdown to next 24h distribution window. |

#### Leaderboard Table

| Column         | Spec                                        |
| -------------- | ------------------------------------------- |
| **Rank**       | #, with medal emoji for top 3 (🥇🥈🥉).     |
| **Address**    | Truncated, clickable (opens profile modal). |
| **Grav Score** | Cumulative. Geist Mono.                     |
| **Missions**   | Count of total launches.                    |
| **Reward**     | ETH amount for top 3 only.                  |

**Table behaviours:**

* Top 3 rows: golden glow border, visually separated from the rest.
* User's own row: highlighted with subtle `--jackpot` left border, always visible. If off‑screen: "Jump to my rank" floating pill.
* Rank changes: rows slide up/down to new position with animation.
* Paginated: 25 per page.

**Filters:** By rarity · By part type · By user (search).

#### Score Trajectory Chart

Below the table. Dark background, `--jackpot` gold line. Dots at each launch event. Hover shows: date, score, rank at that time.

#### Prize Claim CTA

* **Invisible** unless `PrizeTrigger` event emitted for connected wallet.
* When visible: Full‑width pill, `--jackpot` gold, heavy glow, slow pulse, trophy icon. Text: "CLAIM PRIZE 🏆".
* Tap → Confirmation drawer: "Withdraw X ETH to your main‑net address?" → Confirm → Full‑screen celebration (confetti, star burst, "CONGRATULATIONS" in `--h-xl`).

#### Invite Friends

"Invite Friends 🔗" button in header area. Tap → shareable referral link + message. Both referrer and invitee earn bonus XP.

***

***

# 5. Motion & Interaction Reference

Every animation you implement should follow these rules.

## 5.1 Principles

1. **Purposeful** — Every animation communicates a state change, reward, or spatial relationship.
2. **Fast then slow** — Entrances: 150–250ms ease‑out. Exits: 200–300ms ease‑in.
3. **Celebrate wins** — Reward moments get extra motion budget (up to 2–3 seconds).
4. **Never blocking** — Animations never prevent the next action. Skippable on tap.

## 5.2 Easing Curves

| Token             | Curve                               | Usage                         |
| ----------------- | ----------------------------------- | ----------------------------- |
| `--ease-default`  | `cubic-bezier(0.25, 0.1, 0.25, 1)`  | Most transitions.             |
| `--ease-bounce`   | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Reward popups, score reveals. |
| `--ease-dramatic` | `cubic-bezier(0.7, 0, 0.3, 1)`      | Page transitions, modals.     |

## 5.3 Animation Catalogue

| Name                | Trigger                      | Duration | What Happens                                                                                 |
| ------------------- | ---------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| **φ Pulse**         | Token balance changes        | 600ms    | φ icon scales to 1.15×, accent ring expands and fades, settles to 1×.                        |
| **Card Entrance**   | Page load / tab switch       | 300ms    | Cards stagger up (translateY: 20→0, opacity: 0→1), 50ms delay per card.                      |
| **Box Crack**       | "OPEN" on mystery box        | 2500ms   | Shake → seam → split halves → particle burst in rarity colour → part card rises from behind. |
| **Rarity Reveal**   | Part card appears after open | 800ms    | Background flash → badge slides in from top → stat bars fill left‑to‑right sequentially.     |
| **Bid Placed**      | Successful bid               | 400ms    | Amount odometer counts up. Green check fades in.                                             |
| **Auction Tick**    | Every second during auction  | —        | Split‑flap digit animation. Last 60s: orange + gentle pulse.                                 |
| **Drag Snap**       | Part dropped on valid slot   | 250ms    | Card shrinks to slot size with magnetic snap. Slot border flashes rarity colour.             |
| **Launch Sequence** | "IGNITE" pressed             | 3s+      | Countdown → flame → ascent → events → dim to black. Full‑screen.                             |
| **Score Reveal**    | Post‑launch                  | 1200ms   | Dark overlay → score counts up from 0 with bounce easing. Top 3 = confetti.                  |
| **Rank Change**     | Leaderboard updates          | 500ms    | Row slides to new position. Top 3 entry = golden glow border.                                |

## 5.4 Haptics (Mobile)

| Event             | Pattern              |
| ----------------- | -------------------- |
| CTA tap           | Light impact.        |
| Box open          | Medium impact.       |
| Rarity Legendary+ | Heavy impact + buzz. |
| Launch ignition   | Long ramp‑up buzz.   |
| Score reveal      | Success pattern.     |

***

***

# 6. Responsive Design

## 6.1 Breakpoints

| Name    | Width      | Key Changes                                                            |
| ------- | ---------- | ---------------------------------------------------------------------- |
| Desktop | ≥1024px    | Full multi‑panel layouts, hover interactions, side panels.             |
| Tablet  | 768–1023px | Panels stack, inventory becomes bottom sheet, charts reduce size.      |
| Mobile  | <768px     | Single column, bottom tab bar, drawers replace modals, swipe gestures. |

## 6.2 Mobile‑Specific Patterns

| Pattern                  | Detail                                                               |
| ------------------------ | -------------------------------------------------------------------- |
| **Nav**                  | Bottom tab bar with icons only. Active tab shows label.              |
| **Panels**               | Stack vertically. Secondary panels become collapsible accordions.    |
| **Inventory**            | Full‑screen bottom sheet, swipeable.                                 |
| **Charts**               | Horizontal‑scrollable, default to 24H view.                          |
| **Rocket schematic**     | Horizontal layout or pinch‑to‑zoom. Parts drag‑and‑drop still works. |
| **Launch sequence**      | Same full‑screen experience. Event cards are smaller (240px).        |
| **Confirmation drawers** | Same bottom drawer pattern. Consistent.                              |

***

***

# 7. Accessibility

| Requirement             | Spec                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| **Colour contrast**     | All text meets WCAG AA: 4.5:1 body, 3:1 large text. Test rarity badges vs `--void-mid`.                |
| **Focus states**        | 2px `--star` focus ring, 2px offset, on all interactive elements.                                      |
| **Screen readers**      | ARIA labels on icon‑only buttons, rarity badges ("Legendary"), stat bars ("Heat Flux: 72 out of 100"). |
| **Reduced motion**      | `prefers-reduced-motion` disables star‑field, box crack, launch sequence. Replace with simple fades.   |
| **Keyboard navigation** | Full tab order. Drag‑and‑drop alternative: select part → Enter on target slot.                         |
| **Touch targets**       | Minimum 44×44px on mobile.                                                                             |

***

***

# 8. Onboarding Flow

A 7‑step guided tour using a spotlight + tooltip pattern overlaying the real UI.

| Step | Spotlight Target       | Tooltip Text                                                     | User Action         |
| ---- | ---------------------- | ---------------------------------------------------------------- | ------------------- |
| 1    | Wallet connect button  | "First, connect your wallet to the Entropy network."             | Connect wallet.     |
| 2    | Whitelist button       | "Lock 0.05 ETH to enter the testnet. This funds the prize pool." | Complete whitelist. |
| 3    | Claim button           | "Claim your first φ. Come back every 24h for more."              | Claim φ.            |
| 4    | Exchange tab           | "Swap φ for other tokens here, or hold and keep claiming."       | Navigate.           |
| 5    | Star Vault tab         | "Buy a mystery box and see what part you get."                   | Navigate.           |
| 6    | Assembler tab          | "Once you have parts, build your rocket here."                   | Navigate.           |
| 7    | Launch button (locked) | "Fill all 8 slots, then launch. Top 3 win real ETH."             | Dismiss.            |

**Completion:** "Tour Complete ✦" celebration toast with confetti. Replayable from Settings.

**Skip:** "Skip tour" link visible at every step. Dismisses immediately.

***

*End of UI/UX Interface Brief. All visual assets (illustrations, icons, box renders, part artwork, animations, star‑field) will be delivered by the Asset Designer per their separate brief.*

[](https://affine.finality.dev/workspace/b9f6e46f-1db2-4f5d-be59-e20414a5f573/MSYQ7NAGT55gLQtapKKah)
