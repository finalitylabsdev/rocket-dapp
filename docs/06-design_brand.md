# Design & Brand Bible

> **Audience:** Vision, Design & Branding Teams
> **Purpose:** Definitive reference for every visual, interactive, and experiential decision across the four Entropy apps
> **Design Philosophy:** *"Apple meets the cosmos — ruthlessly clean, impossibly fun."*

## Changelog

- 2026-02-26: Spec freeze v1 adopted. Canonical alignment reference: [07-spec-freeze-alignment-plan](./07-spec-freeze-alignment-plan.md).

## Deprecation Notice (Spec Freeze v1)

Legacy terms may still appear from older iterations. Treat them as deprecated aliases:

- `ET` -> `Flux`
- `claimET()` -> `claimFlux()`
- `whitelist(amount)` -> `whitelist()` payable (`msg.value == 0.05 ether`)
- `Flux Exchange` is a legacy label; canonical brand name is `Entropy Exchange`

***

# Part I — Brand Foundation

***

## 1. Brand Identity

### 1.1 Brand Essence

Entropy is not a typical crypto testnet. It's a **game dressed as a financial platform, and a financial platform dressed as a game**. Every pixel should feel like it belongs in a premium space simulator that also happens to let you trade tokens, collect NFTs, and win real money.

The brand sits at the intersection of three values:

```
         PRECISION                    WONDER                    PLAY
     ┌───────────────┐          ┌──────────────┐         ┌──────────────┐
     │ Clean layouts  │          │ Cosmic depth  │         │ Gamified     │
     │ Sharp type     │    ×     │ Unexpected    │    ×    │ Rewarding    │
     │ Confident      │          │ Beautiful     │         │ Addictive    │
     │ white space    │          │ moments of awe│         │ Celebratory  │
     └───────────────┘          └──────────────┘         └──────────────┘
```

**One‑liner:** *"If Apple designed a space trading game on the blockchain."*

### 1.2 Brand Personality

| Trait          | What It Means in Practice                                   | What It Doesn't Mean                          |
| -------------- | ----------------------------------------------------------- | --------------------------------------------- |
| **Confident**  | Sparse copy, bold claims, no hedging.                       | Arrogant, condescending, hype‑bro.            |
| **Playful**    | Micro‑animations, Easter eggs, celebratory moments.         | Childish, cluttered, "meme‑coin" energy.      |
| **Mysterious** | Dark UI, reveals, progressive disclosure.                   | Confusing, hidden info, poor onboarding.      |
| **Premium**    | Generous whitespace, refined typography, considered motion. | Sterile, cold, unapproachable.                |
| **Communal**   | Leaderboards, invite flows, shared moments.                 | Social‑media‑like, noisy, notification‑heavy. |

### 1.3 The φ Symbol

The Entropy token uses the **φ symbol** (phi / "O‑with‑I") as its icon. This is the single most important brand mark.

**Usage rules:**

* Always displayed as a custom‑drawn glyph, not a font character.
* Appears in the token balance HUD, transaction confirmations, price tags, and the favicon.
* In motion contexts, the φ has a subtle, slow rotation (0.01 rpm) — barely perceptible, always alive.
* Colour: inherits the contextual accent colour of whatever app it sits inside (purple in Entropy Gate, teal in Entropy Exchange, etc.).

### 1.4 Voice & Tone

| Context          | Tone                 | Example                                                                     |
| ---------------- | -------------------- | --------------------------------------------------------------------------- |
| **Onboarding**   | Warm, inviting       | "Welcome to the Entropy universe. Your journey starts with a single φ."     |
| **Transactions** | Crisp, factual       | "Swap confirmed. 12 φ → 0.003 ETH."                                         |
| **Celebrations** | Bold, electric       | "LEGENDARY DROP. You just pulled a Hyper‑Drive."                            |
| **Errors**       | Calm, helpful        | "Transaction didn't go through. Check your balance and try again."          |
| **Leaderboard**  | Competitive, charged | "You're 47 points from the top 3. One more launch could change everything." |

**Copy rules:**

* Sentences, not paragraphs. Every word earns its place.
* Never say "please" in CTAs. Say what happens: "Claim φ", "Launch Now", "Open Box."
* Numbers are always formatted with the φ symbol inline: "φ 250", not "250 Entropy tokens."
* Avoid exclamation marks except in celebration modals.

***

## 2. Visual System

### 2.1 Colour Palette

The palette is built on a **deep‑space base** with **neon accent pops** — one signature accent per app.

#### Base Colours (Global)

| Token          | Hex       | Usage                                              |
| -------------- | --------- | -------------------------------------------------- |
| `--void`       | `#06080F` | Primary background. The "space" behind everything. |
| `--void-mid`   | `#0C1018` | Card backgrounds, elevated surfaces.               |
| `--void-light` | `#141A26` | Hover states, secondary panels.                    |
| `--dust`       | `#1E2636` | Borders, dividers, subtle separators.              |
| `--nebula`     | `#2A3348` | Inactive / disabled states.                        |
| `--star`       | `#E8ECF4` | Primary text.                                      |
| `--star-dim`   | `#8A94A8` | Secondary text, captions, labels.                  |
| `--star-faint` | `#4A5468` | Tertiary text, placeholders.                       |

#### App Accent Colours

| App                     | Accent Name   | Hex       | Glow Hex (20% opacity) | Usage                              |
| ----------------------- | ------------- | --------- | ---------------------- | ---------------------------------- |
| **Entropy Gate**        | `--gate`      | `#8B5CF6` | `#8B5CF633`            | CTAs, progress bars, XP badges.    |
| **Entropy Exchange**    | `--exchange`  | `#06D6A0` | `#06D6A033`            | Price tickers, swap confirmations. |
| **Star Vault Boxes**    | `--vault`     | `#F6C547` | `#F6C54733`            | Box outlines, rarity highlights.   |
| **Nebula Bids**         | `--bids`      | `#A855F7` | `#A855F733`            | Bid indicators, auction timers.    |
| **Celestial Assembler** | `--assembler` | `#94A3B8` | `#94A3B833`            | Slot outlines, stat bars.          |
| **Quantum Lift‑Off**    | `--liftoff`   | `#F97316` | `#F9731633`            | Launch button, event alerts.       |
| **Cosmic Jackpot**      | `--jackpot`   | `#FACC15` | `#FACC1533`            | Rankings, prize displays.          |

#### Rarity Colours

| Tier      | Hex       | Glow Treatment                                                  |
| --------- | --------- | --------------------------------------------------------------- |
| Common    | `#6B7280` | No glow. Flat badge.                                            |
| Uncommon  | `#22C55E` | Faint green glow on hover only.                                 |
| Rare      | `#3B82F6` | Soft blue outer glow, always on.                                |
| Epic      | `#8B5CF6` | Purple glow with subtle pulse (2s ease‑in‑out loop).            |
| Legendary | `#F59E0B` | Orange glow with shimmer (diagonal light sweep every 4s).       |
| Mythic    | `#EF4444` | Red glow with particle embers drifting upward (canvas overlay). |
| Celestial | `#06B6D4` | Cyan glow with aurora wave effect (CSS gradient animation).     |
| Quantum   | Prismatic | Full‑spectrum shifting gradient. Animated border. Unmistakable. |

> **Rule:** Rarity colours override app accent colours wherever a part or box is displayed. The rarity is always the loudest signal.

### 2.2 Typography

The type system pairs a **display face** for headings and impact moments with a **workhorse face** for body text and UI.

| Role        | Font                                             | Weight Range | Usage                                                                 |
| ----------- | ------------------------------------------------ | ------------ | --------------------------------------------------------------------- |
| **Display** | **Geist Mono** (or equivalent monospace display) | 500–800      | Headlines, modal titles, score displays, countdown timers, φ amounts. |
| **Body**    | **Satoshi** (by Fontshare, free)                 | 400–700      | Paragraphs, labels, buttons, navigation, form inputs.                 |
| **Data**    | **Geist Mono**                                   | 400          | Token amounts, wallet addresses, stat numbers, table cells.           |

**Type scale (desktop):**

| Token     | Size | Weight | Line Height | Usage                            |
| --------- | ---- | ------ | ----------- | -------------------------------- |
| `--h-xl`  | 56px | 800    | 1.05        | Hero headlines only.             |
| `--h-lg`  | 36px | 700    | 1.1         | Section titles.                  |
| `--h-md`  | 24px | 600    | 1.2         | Card titles, modal headers.      |
| `--h-sm`  | 18px | 600    | 1.3         | Sub‑headings, tab labels.        |
| `--body`  | 15px | 400    | 1.6         | Default body text.               |
| `--small` | 13px | 400    | 1.5         | Captions, timestamps, footnotes. |
| `--micro` | 11px | 500    | 1.4         | Badges, tooltips, status pills.  |

**Rules:**

* Headlines are always **uppercase tracked +0.05em** for display weight.
* Body text is always **sentence case**.
* Token amounts always use Geist Mono, never the body font.
* No underlines except on true hyperlinks.

### 2.3 Spacing & Layout

**Grid:** 12‑column, max‑width 1280px, 24px gutters. Cards and panels live on an **8px base unit** system.

| Token   | Value | Usage                                         |
| ------- | ----- | --------------------------------------------- |
| `--s-1` | 4px   | Inline spacing, icon‑to‑label gap.            |
| `--s-2` | 8px   | Tight padding inside badges and pills.        |
| `--s-3` | 16px  | Standard card padding, input padding.         |
| `--s-4` | 24px  | Section gaps, card‑to‑card margins.           |
| `--s-5` | 32px  | Major section dividers.                       |
| `--s-6` | 48px  | Page section spacing.                         |
| `--s-7` | 64px  | Hero sections, above‑the‑fold breathing room. |
| `--s-8` | 96px  | Page top/bottom margins.                      |

**Whitespace philosophy:** When in doubt, add more space. The cosmic theme should feel **vast**, not cramped. Density is reserved for data tables and inventory grids; everywhere else, let the void breathe.

### 2.4 Elevation & Surfaces

All surfaces live in front of `--void`. Depth is communicated through **background lightness steps** and **subtle borders**, not heavy shadows.

| Level | Background     | Border              | Usage                                   |
| ----- | -------------- | ------------------- | --------------------------------------- |
| 0     | `--void`       | None                | Page background.                        |
| 1     | `--void-mid`   | 1px `--dust`        | Primary cards, panels, navigation bar.  |
| 2     | `--void-light` | 1px `--dust`        | Modals, dropdown menus, popovers.       |
| 3     | `--void-light` | 1px accent (at 30%) | Active/selected states, focused inputs. |

**Corner radii:**

* Cards and modals: `16px`.
* Buttons: `12px`.
* Badges and pills: `full` (pill shape).
* Inputs: `10px`.

**Glassmorphism (used sparingly):**

* Navigation bar and wallet HUD use `backdrop-filter: blur(24px)` over the star‑field background.
* Opacity: 70% of `--void-mid`.
* Reserved only for persistent chrome (nav, HUD). Never on content cards.

### 2.5 Iconography

| Category          | Style                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **UI Icons**      | 1.5px stroke, 20×20 default, rounded caps. Lucide‑style. Consistent with body font weight.                |
| **Section Icons** | Custom illustrated icons for each of the 8 rocket sections. Detailed linework, single accent colour fill. |
| **Rarity Icons**  | Gem/crystal shapes that correspond to each tier. Animated at Mythic+ (ember, aurora, prismatic).          |
| **Event Icons**   | Circular badges with a pictogram for each random event (meteor, solar flare, comet, etc.).                |

### 2.6 Background & Atmosphere

The entire platform sits on a **living star‑field** — not a static image, but a subtly animated particle canvas.

**Star‑field spec:**

* 200–400 small white dots (1–2px) with randomised opacity (0.3–1.0).
* Gentle parallax on mouse move (desktop) or gyroscope (mobile): stars shift ±10px.
* 3–5 larger "nebula patches" — soft radial gradients in muted accent colours — slowly drifting (0.5px/s).
* Performance: rendered in a single `<canvas>` at 30fps, behind all UI. Falls back to a static hi‑res image on low‑power devices.

**Page transitions:** Each app has a signature nebula colour that fades in when navigating to that section, tinting the star‑field. Entropy Gate = purple haze, Entropy Exchange = teal haze, etc.

***

## 3. Motion & Interaction Design

### 3.1 Motion Principles

| Principle          | Meaning                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------- |
| **Purposeful**     | Every animation communicates something: a state change, a reward, a spatial relationship.   |
| **Fast then slow** | Entrances are snappy (150–250ms ease‑out). Exits are gentle (200–300ms ease‑in).            |
| **Celebrate wins** | Reward moments (box opens, launches, rank‑ups) get extra motion budget — up to 2–3 seconds. |
| **Never blocking** | Animations never prevent the user from taking the next action. Skippable if tapped.         |

### 3.2 Easing Curves

| Token             | Curve                               | Usage                             |
| ----------------- | ----------------------------------- | --------------------------------- |
| `--ease-default`  | `cubic-bezier(0.25, 0.1, 0.25, 1)`  | Most transitions.                 |
| `--ease-bounce`   | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Reward popups, score reveals.     |
| `--ease-dramatic` | `cubic-bezier(0.7, 0, 0.3, 1)`      | Page transitions, modal overlays. |

### 3.3 Signature Animations

| Animation           | Trigger                            | Duration | Description                                                                                                                                                                               |
| ------------------- | ---------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **φ Pulse**         | Token balance changes              | 600ms    | The φ icon scales to 1.15×, emits a ring of the app's accent colour that expands and fades, then settles back to 1×.                                                                      |
| **Card Entrance**   | Page load / tab switch             | 300ms    | Cards stagger in from below (translateY: 20px → 0) with 50ms delay per card. Opacity 0 → 1.                                                                                               |
| **Box Crack**       | Mystery box "Open" tap             | 2500ms   | Box shakes subtly (100ms), a light seam appears down the centre, the two halves split apart with a burst of particles in the rarity colour. The revealed part card floats up from behind. |
| **Rarity Reveal**   | Part card appears after box open   | 800ms    | Background flash in the rarity colour (200ms), badge slides in from top, attribute bars fill left‑to‑right sequentially (200ms each).                                                     |
| **Bid Placed**      | Successful bid submission          | 400ms    | Amount number counts up from previous bid to new bid (odometer style). Green checkmark fades in.                                                                                          |
| **Auction Tick**    | Every second during active auction | —        | Countdown digits flip (split‑flap / mechanical clock style). Last 60 seconds: digits turn `--liftoff` orange and pulse gently.                                                            |
| **Drag Snap**       | Part dragged onto rocket slot      | 250ms    | Part card shrinks to fit the slot with a magnetic snap effect. Slot border flashes the part's rarity colour once.                                                                         |
| **Launch Sequence** | "Launch" button pressed            | 3000ms+  | Full‑screen takeover. Rocket rumbles, thrust flame ignites from bottom, camera pulls back as rocket ascends. Stars streak. Random events appear as mid‑flight interstitial cards.         |
| **Score Reveal**    | Post‑launch                        | 1200ms   | Screen goes momentarily dark. Grav Score counts up from 0 in large Geist Mono type with `--ease-bounce`. If top 3, confetti + gold flash.                                                 |
| **Rank Change**     | Leaderboard update                 | 500ms    | Row slides up or down to its new position. If the user enters top 3, the row gets a golden glow border.                                                                                   |

### 3.4 Haptics (Mobile)

| Event                 | Pattern              |
| --------------------- | -------------------- |
| **CTA tap**           | Light impact.        |
| **Box open**          | Medium impact.       |
| **Rarity Legendary+** | Heavy impact + buzz. |
| **Launch ignition**   | Long ramp‑up buzz.   |
| **Score reveal**      | Success pattern.     |

***

***

# Part II — App‑by‑App Design Specification

***

## APP 1 — Entropy Gate

### *Bridge & Faucet*

**Accent:** `--gate` · `#8B5CF6` (Deep Purple)**Mood:** Arrival. Portal. Initiation.

***

### Screen: Landing / Welcome

**Layout:** Full‑viewport hero, no scroll required for core action.

```
┌──────────────────────────────────────────────────────────────────┐
│  [Nav Bar — glass, persistent across all apps]                   │
│   Logo (φ mark + "ENTROPY")    Tabs: Gate Exchange Vault ...     │
│   ─────────────────────────────────────── [Wallet: 0x...] [φ 0] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│              ┌──────────────────────────────┐                    │
│              │                              │                    │
│              │     YOUR JOURNEY BEGINS      │                    │
│              │     WITH A SINGLE φ          │                    │
│              │                              │                    │
│              │   ┌────────────────────┐     │                    │
│              │   │   CLAIM  φ  1      │     │  ← Large pill      │
│              │   └────────────────────┘     │    button, purple   │
│              │                              │    glow on hover    │
│              │   Next claim in: 23:41:07    │                    │
│              │                              │                    │
│              └──────────────────────────────┘                    │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ ETH Locked  │  │ φ Supply    │  │ Prize Pool  │              │
│  │   42.5 ETH  │  │   8,402 φ   │  │  21.25 ETH  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌──────────────────────────────────────────┐                    │
│  │  ENTROPY POINTS (XP)                     │                    │
│  │  ████████████░░░░░░░░  Day 5 / 7         │                    │
│  │  Milestone: Free Common Box at Day 7     │                    │
│  └──────────────────────────────────────────┘                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Interaction details:**

* **Before whitelist:** The Claim button is replaced by a "Lock 0.05 ETH to Enter" button with a lock icon. Pressing it opens a slim confirmation drawer (not a modal — keeps context visible). After confirmation, the drawer closes and the Claim button fades in with the φ Pulse animation.
* **Claim available:** Button is fully saturated `--gate` purple with a soft outer glow pulsing slowly (3s loop). One tap → φ Pulse animation → balance updates.
* **Claim on cooldown:** Button desaturates to `--nebula`. Countdown runs in Geist Mono. A thin ring around the button fills clockwise over 24 hours (like a radial progress indicator).
* **XP Progress Bar:** Segmented bar (7 segments for a weekly streak). Filled segments glow `--gate`. Unfilled are `--dust`. Milestone marker shows a tiny mystery‑box icon at day 7.
* **Live Counters:** Three stat cards at the bottom, each with a monospaced number that ticks up in real time (odometer style) when new whitelists occur.

***

## APP 2 — Entropy Exchange

### *The DEX*

**Accent:** `--exchange` · `#06D6A0` (Electric Teal)**Mood:** Speed. Clarity. Precision.

***

### Screen: Swap Interface

**Layout:** Two‑panel — swap card (left, 60%) and market info (right, 40%).

```
┌─────────────────────────────────────┬────────────────────────────┐
│                                     │                            │
│  SWAP                               │  φ / ETH                   │
│                                     │  ┌──────────────────────┐  │
│  ┌───────────────────────────────┐  │  │  Price Chart          │  │
│  │  From                         │  │  │  (candlestick,        │  │
│  │  ┌──────┐  ┌───────────────┐  │  │  │   dark bg, teal line) │  │
│  │  │ φ  ▾ │  │         12.00 │  │  │  │                       │  │
│  │  └──────┘  └───────────────┘  │  │  └──────────────────────┘  │
│  │  Balance: φ 47                │  │                            │
│  │                               │  │  Pool Depth               │
│  │         ⇅  (swap direction)   │  │  ┌──────────────────────┐  │
│  │                               │  │  │  (area chart, teal    │  │
│  │  To                           │  │  │   fill, dark bg)      │  │
│  │  ┌──────┐  ┌───────────────┐  │  │  │                       │  │
│  │  │ETH ▾ │  │     ~0.0031   │  │  │  └──────────────────────┘  │
│  │  └──────┘  └───────────────┘  │  │                            │
│  │  Rate: 1 φ = 0.00026 ETH     │  │  Pool Stats               │
│  │                               │  │  Liquidity: φ 24,000      │
│  │  ┌───────────────────────┐    │  │  24h Volume: φ 3,841      │
│  │  │      SWAP NOW         │    │  │  Fee: 0.30%               │
│  │  └───────────────────────┘    │  │                            │
│  │                               │  │                            │
│  │  Slippage: 0.5% [Adjust]     │  │                            │
│  │  Fee: 0.036 φ                 │  │                            │
│  └───────────────────────────────┘  │                            │
│                                     │                            │
│  [Add Liquidity]  [My LP Positions] │                            │
│                                     │                            │
└─────────────────────────────────────┴────────────────────────────┘
```

**Interaction details:**

* **Token selector dropdown:** Dark popover with token icon + name + balance. φ, BTC, ETH, UVD. Each row shows a mini‑sparkline of 24h price action.
* **Amount input:** Monospaced, large (24px). Auto‑calculates "To" field as user types. Debounced 300ms.
* **Swap direction toggle:** The ⇅ icon rotates 180° on click (300ms). From and To fields cross‑fade swap.
* **"Swap Now" button:** Full‑width, `--exchange` teal. On hover: glow intensifies. On click: button text changes to a spinning loader → "Confirming…" → checkmark + "Swapped!" (teal flash).
* **Slippage adjuster:** Tap "Adjust" to reveal a slim slider with preset pills (0.1%, 0.5%, 1.0%, Custom).
* **Fee display:** Always visible, never hidden. Transparency is brand‑critical.
* **Price chart:** Dark canvas with a single teal line. No grid clutter. Time range toggles: 1H · 24H · 7D · 30D. Crosshair on hover showing exact price + time.
* **Flash Trade mode:** Toggle in the top‑right of the swap card. When active, the card border shifts to a pulsing teal, inputs auto‑fill with "Best Price" slippage, and the CTA changes to "FLASH SWAP" with a lightning‑bolt icon.

***

### Screen: Liquidity Provider Dashboard

* **My Positions table:** Each row shows pool name, LP token balance, share %, accrued fees, and a "Withdraw" button.
* **Add Liquidity flow:** Two‑token input card (same style as swap), "Supply" CTA → confirmation drawer → success animation (two token icons merge into an LP token icon).
* **Yield farming:** If active, a banner at the top of the LP dashboard shows APY with a small flame icon. "Stake LP" CTA in accent teal.

***

## APP 3 — Star Vault & Nebula Bids

### *Mystery Box + Auction*

**Accent:** `--vault` Gold (Mystery Box) · `--bids` Violet (Auction)**Mood:** Thrill. Chance. Discovery.

***

### Screen: Star Vault — Mystery Box Store

**Layout:** Full‑width grid of 8 box tiers, 4 per row (desktop), scrollable on mobile.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  STAR VAULT                                     [My Inventory ▸] │
│  Crack open the cosmos.                                          │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │          │  │          │  │          │  │          │        │
│  │ COMMON   │  │ UNCOMMON │  │  RARE    │  │  EPIC    │        │
│  │   ░░░    │  │   ░░░    │  │   ░░░    │  │   ░░░    │        │
│  │          │  │          │  │          │  │          │        │
│  │  φ 10    │  │  φ 25    │  │  φ 50    │  │  φ 100   │        │
│  │ [BUY]    │  │ [BUY]    │  │ [BUY]    │  │ [BUY]    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │          │  │          │  │          │  │ ✦✦✦✦✦✦  │        │
│  │LEGENDARY │  │ MYTHIC   │  │CELESTIAL │  │ QUANTUM  │        │
│  │   ░░░    │  │   ░░░    │  │   ░░░    │  │   ░░░    │        │
│  │          │  │          │  │          │  │          │        │
│  │  φ 200   │  │  φ 350   │  │  φ 500   │  │  φ 750   │        │
│  │ [BUY]    │  │ [BUY]    │  │ [BUY]    │  │ [BUY]    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Box card details:**

Each box card is a 3D object that tilts slightly on mouse move (perspective transform, ±5°). The box illustration sits centred, rendered as a custom 3D‑ish icon per tier:

| Tier      | Box Appearance                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------ |
| Common    | Simple grey cube, matte finish. No animation.                                                    |
| Uncommon  | Grey‑green cube, faint inner glow.                                                               |
| Rare      | Blue metallic cube, soft outer glow on hover.                                                    |
| Epic      | Purple crystal box, slow pulse glow (2s).                                                        |
| Legendary | Gold ornate box with engraved lines, shimmer sweep animation (4s).                               |
| Mythic    | Red molten box with ember particles floating upward from corners.                                |
| Celestial | Cyan translucent box with aurora wave flowing across its surface.                                |
| Quantum   | Prismatic shifting box — colours cycle through the full spectrum. Animated border. Unmistakable. |

**Hover state:** Card lifts 4px (translateY), border brightens to rarity colour. A tooltip appears showing drop‑rate breakdown for that tier.

**Purchase flow:**

1. Tap "BUY" → Confirmation drawer slides up: "Open a \[Tier] Star Vault Box for φ \[Price]?" + \[Confirm] / \[Cancel].
2. Confirm → Transaction submits. Button becomes a loader.
3. Success → The purchased box appears centred on screen (full‑screen overlay, `--void` at 90% opacity behind).
4. "OPEN" button appears below the box, pulsing in the tier's rarity colour.
5. Tap "OPEN" → **Box Crack animation** (see Section 3.3).
6. Part card floats up from behind the split box halves → **Rarity Reveal animation**.
7. Result card shows: Part name, section icon, rarity badge, three attribute bars (animated fill), Part Value score.
8. Below the card: \[EQUIP TO ROCKET] · \[SEND TO AUCTION] · \[VIEW IN INVENTORY].

### Screen: Inventory Panel

Accessible via "My Inventory" in the Star Vault header, or as a persistent sidebar on desktop.

**Layout:** Grid of part cards (4 columns desktop, 2 mobile). Each card shows:

* Part illustration (from IPFS).
* Section icon (top‑left corner).
* Rarity badge pill (top‑right corner), coloured per tier.
* Three mini attribute bars below the illustration.
* Part Value score in Geist Mono at the bottom.

**Sorting & Filtering:**

* **Sort by:** Value (default) · Rarity · Section · Date acquired.
* **Filter by:** Section (8 toggles with section icons) · Rarity (8 colour‑coded toggles).
* Filters are sticky pills at the top of the inventory panel, horizontally scrollable on mobile.

**Actions per card:**

* Tap card → Expanded detail view (modal): full stat breakdown with attribute meanings, rarity multiplier shown, "Equip" / "Auction" / "Craft" buttons.
* Long‑press / right‑click → Quick‑action menu: Equip · Auction · Compare.

***

### Screen: Nebula Bids — Auction Hall

**Layout:** Split — Active auction (left, 65%) + Sidebar (right, 35%).

```
┌──────────────────────────────────────┬───────────────────────────┐
│                                      │                           │
│  NEBULA BIDS                         │  SUBMIT YOUR ITEM         │
│                                      │  ┌─────────────────────┐  │
│  ┌────────────────────────────────┐  │  │ [Your eligible parts │  │
│  │                                │  │  │  appear here as      │  │
│  │   ┌──────────────────────┐     │  │  │  cards with          │  │
│  │   │                      │     │  │  │  "Submit" buttons]   │  │
│  │   │   LEGENDARY          │     │  │  └─────────────────────┘  │
│  │   │   NOVA THRUSTER      │     │  │                           │
│  │   │   Core Engine         │     │  │  TOP CONTRIBUTORS        │
│  │   │                      │     │  │  1. 0xA3… — φ 4,200      │
│  │   │   Heat Flux: ████ 72 │     │  │  2. 0x7F… — φ 3,180      │
│  │   │   Thrust:    ████ 88 │     │  │  3. 0xD1… — φ 1,940      │
│  │   │   Mass:      ██   31 │     │  │                           │
│  │   └──────────────────────┘     │  │                           │
│  │                                │  │                           │
│  │   Current Bid: φ 340           │  │                           │
│  │   Bids: 12                     │  │                           │
│  │   Ends in:  01:23:47           │  │                           │
│  │                                │  │                           │
│  │   ┌──────────────┐ ┌────────┐  │  │                           │
│  │   │  φ  357      │ │  BID   │  │  │                           │
│  │   └──────────────┘ └────────┘  │  │                           │
│  │                                │  │                           │
│  │   Bid History                  │  │                           │
│  │   0xF2… — φ 340 — 4m ago      │  │                           │
│  │   0xA3… — φ 310 — 11m ago     │  │                           │
│  │   0x7F… — φ 280 — 22m ago     │  │                           │
│  └────────────────────────────────┘  │                           │
│                                      │                           │
└──────────────────────────────────────┴───────────────────────────┘
```

**Interaction details:**

* **Countdown timer:** Large, mechanical split‑flap digits (see Section 3.3 — Auction Tick). Centred above the auction panel. Last 60 seconds: digits turn orange, a faint siren‑style radial pulse appears on the panel border.
* **Bid input:** Pre‑filled with the minimum valid bid (current highest + 5%). User can type a higher amount. "BID" button in `--bids` violet.
* **Outbid notification:** If user is outbid while viewing the page, a toast slides in from the top‑right: "You've been outbid! New highest: φ X" with a \[Re‑bid] shortcut button.
* **Auction end:** Full‑screen modal overlay: "AUCTION COMPLETE" → Winner address revealed → Final price odometer → Part card animation → "Part transferred to \[winner]."
* **No active auction:** If between rounds, show a "Next auction in: HH:MM:SS" countdown with a preview of submitted items (blurred, to build suspense).

***

## APP 4 — Celestial Assembler, Quantum Lift‑Off & Cosmic Jackpot

### *Builder + Launch + Leaderboard*

**Accents:** `--assembler` Silver · `--liftoff` Fiery Orange · `--jackpot` Neon Gold**Mood:** Craft. Adrenaline. Glory.

***

### Screen: Celestial Assembler — Rocket Builder

**Layout:** Two‑panel — Rocket schematic (left, 55%) + Inventory drawer (right, 45%).

```
┌──────────────────────────────────┬───────────────────────────────┐
│                                  │                               │
│  CELESTIAL ASSEMBLER             │  YOUR PARTS                   │
│                                  │  [Sort ▾]  [Filter ▾]        │
│      ┌──────────────────┐        │                               │
│      │    SHIELDING      │  ← 8  │  ┌─────┐ ┌─────┐ ┌─────┐    │
│      ├──────────────────┤        │  │ ░░░ │ │ ░░░ │ │ ░░░ │    │
│      │   NAV MODULE      │  ← 4  │  │Rare │ │Epic │ │Comm│    │
│      ├──────────────────┤        │  └─────┘ └─────┘ └─────┘    │
│      │   PAYLOAD BAY     │  ← 5  │                               │
│      ├──────────────────┤        │  ┌─────┐ ┌─────┐ ┌─────┐    │
│      │   WING‑PLATES     │  ← 2  │  │ ░░░ │ │ ░░░ │ │ ░░░ │    │
│      ├──────────────────┤        │  │Lgnd │ │Myth│ │Rare │    │
│      │   PROP. CABLES    │  ← 7  │  └─────┘ └─────┘ └─────┘    │
│      ├──────────────────┤        │                               │
│      │   FUEL CELLS      │  ← 3  │       ... scrollable ...     │
│      ├──────────────────┤        │                               │
│      │   THRUSTER ARRAY  │  ← 6  │                               │
│      ├──────────────────┤        │  ──────────────────────────── │
│      │   CORE ENGINE     │  ← 1  │  STATS PREVIEW               │
│      └──────────────────┘        │  Total Attributes: 1,247     │
│                                  │  Est. Grav Score: 480–720     │
│   ┌─────────────────────────┐    │  Rarity Bonus: +18%           │
│   │  🔒 Fill all 8 slots    │    │                               │
│   │     to unlock LAUNCH    │    │                               │
│   └─────────────────────────┘    │                               │
│                                  │                               │
└──────────────────────────────────┴───────────────────────────────┘
```

**Rocket schematic details:**

* The rocket is rendered as a **stylised vertical cross‑section** — not photorealistic, but a clean, technical blueprint aesthetic with thin white lines on `--void`.
* Each of the 8 slots is a labelled region of the blueprint. Empty slots have a dashed border and a "+" icon.
* When a part is equipped, the slot fills with the part's rarity colour as a subtle background wash, and the part name appears inside.
* The schematic subtly pulses with life as slots are filled — a dim glow travels up the rocket outline, brighter with more parts equipped.

**Drag and drop:**

* Parts from the inventory panel can be dragged onto the schematic. Only matching sections accept drops (invalid drops bounce back with a gentle shake animation).
* On valid drop: **Drag Snap** animation (250ms) → slot border flashes rarity colour → stats panel updates in real time.
* On slot already occupied: "Replace \[Current Part] with \[New Part]?" tooltip appears. Confirm = old part returns to inventory with a slide animation.

**Stats Preview panel (bottom‑right):**

* **Total Attributes:** Sum of all 24 attribute values across equipped parts.
* **Estimated Grav Score:** Range based on the attribute total × possible environment factor range.
* **Rarity Bonus:** Percentage bonus from aggregate rarity. If a set bonus applies, a special "SET BONUS ACTIVE" badge appears with a sparkle animation.

**Launch button:**

* Locked (greyed, with lock icon) until all 8 slots are filled.
* Once unlocked: Large pill button, `--liftoff` orange, pulsing glow, text reads "LAUNCH →".
* On hover: Rocket schematic shakes subtly, as if engines are warming up.

***

### Screen: Quantum Lift‑Off — Launch Mission

**Layout:** Full‑screen cinematic experience. Minimal chrome.

**Pre‑launch state:**

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                         QUANTUM LIFT‑OFF                         │
│                                                                  │
│                    ┌───────────────────────┐                     │
│                    │                       │                     │
│                    │    [Rocket preview     │                     │
│                    │     assembled, idle,   │                     │
│                    │     on launch pad]     │                     │
│                    │                       │                     │
│                    └───────────────────────┘                     │
│                                                                  │
│              Est. Grav Score: 480–720                             │
│              Fuel Cost: φ 2                                      │
│              Random Events: Active                               │
│                                                                  │
│                    ┌───────────────────┐                         │
│                    │   IGNITE  🔥      │   ← Orange, massive     │
│                    └───────────────────┘                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Launch sequence (after "IGNITE"):**

1. **T‑minus countdown** (3… 2… 1…) — large Geist Mono numerals, each with a camera shake.
2. **Ignition** — Flame particles burst from the rocket base. Deep rumble haptic on mobile.
3. **Ascent** — Camera zooms out. Star streaks fill the background. The rocket moves upward.
4. **Random events** — Mid‑flight, event cards slide in from the right:
   * Each card: Event icon + name + short description + damage/buff indicator.
   * Card appears for 2 seconds, then slides out. Damaged parts flash red briefly on the rocket.
   * Events stack as a timeline on the left edge of the screen.

&#x20;  \| Event            | Icon           | Card Colour | Effect Indicator                          |

&#x20;  \| ---------------- | -------------- | ----------- | ----------------------------------------- |

&#x20;  \| Meteor Shower    | ☄️ rock cluster | Red         | "Wing‑Plate damaged — Durability −40"     |

&#x20;  \| Solar Flare      | ☀️ burst        | Orange      | "Nav Module interference — Accuracy −25"  |

&#x20;  \| Comet Impact     | 💫 streak      | Deep red    | "Shielding cracked — Impact Resist. −50"  |

&#x20;  \| Nutrinoblast     | ⚛️ wave        | Purple      | "Fuel Cell leak — Capacity −30"           |

&#x20;  \| Alien Probe      | 👁 signal       | Cyan        | "Unknown scan — random buff or debuff"    |

&#x20;  \| Solar Storm      | 🌊 wave        | Yellow      | "All systems stressed — all stats −10"    |

1. **Mission end** — Rocket reaches final position. Screen dims to black.

**Post‑launch — Score Reveal:**

* Full‑screen dark overlay.
* "GRAV SCORE" label fades in (Geist Mono, `--star-dim`).
* Score counts up from 0 to final value in large type (48px+), using `--ease-bounce` (see Section 3.3).
* Below the score: Event summary (icons of events encountered) + Part damage report.
* **If top 3:** Confetti burst, golden light flash, text: "YOU'RE IN THE TOP 3" with a link to Cosmic Jackpot.
* **If not top 3:** "Current rank: #47. 12 points from #46." with a \[RE‑ASSEMBLE & RETRY] button.

***

### Screen: Cosmic Jackpot — Leaderboard

**Layout:** Single‑column, centred table with contextual panels.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  COSMIC JACKPOT                              [Invite Friends 🔗] │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  PRIZE POOL            │  YOUR RANK        │  NEXT DIST │    │
│  │  21.25 ETH             │  #14              │  06:41:22  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  #   Address     Grav Score   Missions   Reward          │    │
│  │  ─────────────────────────────────────────────────────── │    │
│  │  🥇  0xA3…      2,847        12         10.63 ETH       │    │
│  │  🥈  0x7F…      2,741        9          5.31 ETH        │    │
│  │  🥉  0xD1…      2,698        11         5.31 ETH        │    │
│  │  ─────────────────────────────────────────────────────── │    │
│  │  4   0xB2…      2,510        8                          │    │
│  │  5   0x9E…      2,488        7                          │    │
│  │  …                                                       │    │
│  │  14  0x[YOU]    1,892        4          ← highlighted    │    │
│  │  …                                                       │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  YOUR SCORE TRAJECTORY                                    │    │
│  │  [Line chart — score over time, --jackpot gold line]     │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────┐                                          │
│  │  CLAIM PRIZE  🏆   │  ← Only appears when eligible           │
│  └────────────────────┘                                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Leaderboard table details:**

* Top 3 rows have a golden glow border and are visually separated from the rest.
* The user's own row is always highlighted with a subtle `--jackpot` left border, regardless of position. If not visible in the current page, a "Jump to my rank" pill appears.
* Rows animate position changes (slide up/down) when ranks shift.
* Each address is clickable → profile modal showing their build history, part collection, and mission log.

**Prize pool display:**

* Large monospaced ETH amount, ticking up in real time as new users whitelist.
* Split indicator showing distribution: "Top 1: 50% · Top 2: 25% · Top 3: 25%" (or whatever the final split is).

**Score trajectory chart:**

* Dark background, `--jackpot` gold line.
* Dots at each launch event. Hover shows: date, Grav Score, rank at that time.
* If the user's line is trending up, a small "🔥 Streak" badge appears.

**Prize claim:**

* The "CLAIM PRIZE" button appears **only** when `PrizeTrigger` has been emitted for the connected wallet.
* It's the most visually dramatic button on the entire platform: full‑width, `--jackpot` gold, heavy glow, slow pulse, trophy icon.
* On tap: Confirmation drawer → "Withdraw X ETH to your main‑net address?" → Confirm → Full‑screen celebration animation (confetti, star burst, large "CONGRATULATIONS" in display type) → ETH balance updates.

***

***

# Part III — Global Components & Patterns

***

## Navigation

**Type:** Persistent top bar, glassmorphic, 64px tall.

| Left                    | Centre                                                   | Right                                  |
| ----------------------- | -------------------------------------------------------- | -------------------------------------- |
| φ logo mark + "ENTROPY" | Tab pills: Gate · Exchange · Vault · Assembler · Jackpot | Wallet address (truncated) + φ balance |

* Active tab: filled pill in the current app's accent colour.
* Inactive tabs: transparent, `--star-dim` text. On hover: text brightens to `--star`.
* Mobile: Bottom tab bar with icons only. Labels on active tab.

***

## Wallet HUD

**Position:** Top‑right, persistent.

Displays:

* Truncated address (0xA3…7F) with a copy icon.
* φ balance (animated on change).
* Network badge ("ɸ-net Testnet") — green dot if connected, red dot if wrong network.

On tap: Dropdown showing full address, ETH balance, UVD balance, "Disconnect" option.

***

## Toast Notifications

**Position:** Top‑right stack, max 3 visible.

| Type        | Left Icon   | Border Colour | Auto‑dismiss |
| ----------- | ----------- | ------------- | ------------ |
| Success     | ✓ checkmark | `--exchange`  | 4s           |
| Info        | ℹ circle    | `--star-dim`  | 5s           |
| Warning     | ⚠ triangle  | `--vault`     | 6s           |
| Error       | ✕ cross     | `#EF4444`     | Manual       |
| Celebration | ✦ star      | `--jackpot`   | 6s           |

***

## Confirmation Drawer

All critical actions (whitelist, swap, buy box, bid, launch) use a **bottom drawer**, not a centred modal. This keeps context visible behind a translucent overlay.

| Element        | Spec                                                      |
| -------------- | --------------------------------------------------------- |
| **Height**     | Auto, max 40vh.                                           |
| **Background** | `--void-mid` at 95% opacity, 24px border‑radius top.      |
| **Content**    | Action summary + cost breakdown + \[Confirm] + \[Cancel]. |
| **Animation**  | Slides up from bottom, 250ms `--ease-default`.            |
| **Dismissal**  | Tap outside, tap Cancel, or swipe down.                   |

***

## Loading & Empty States

| State                   | Treatment                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Page loading**        | Skeleton screens with `--dust` shimmer bars. Never a full‑screen spinner.                                                                                                      |
| **No data**             | Illustrated empty state with φ‑themed artwork + clear CTA. E.g., empty inventory: "Your hangar is empty. Open a Star Vault Box to get your first part." + \[Go to Star Vault]. |
| **Transaction pending** | Inline loader (pulsing dots in accent colour) replacing the CTA button text. "Confirming…"                                                                                     |
| **Error**               | Red‑bordered toast with plain‑language explanation + retry action.                                                                                                             |
| **Catalog degraded**    | Star Vault must render an explicit degraded metadata panel when `box_tiers` reads fail or return empty. Never let the grid silently disappear. Box purchases pause until the live catalog recovers. |

***

## App 3 Metadata Asset Fallback

Star Vault and inventory visuals resolve in a strict order so the product can stay metadata-driven without hiding degraded states:

1. Use the runtime asset URL from catalog / RPC payloads when one exists.
2. If no URL is available yet, render a deterministic local visual recipe keyed by stable metadata (`box_tiers.id`, `section_key`, or explicit asset key).
3. If the key cannot be resolved, render an explicit compatibility fallback and label it as degraded, rather than pretending the normal path succeeded.

Rarity badges follow the same rule: if rarity config is unavailable, they revert to launch-default tier styling, not a neutral loading badge.

***

## Responsive Breakpoints

| Breakpoint | Width    | Layout Changes                                                         |
| ---------- | -------- | ---------------------------------------------------------------------- |
| Desktop    | ≥1024px  | Full multi‑panel layouts, side‑by‑side panels, hover interactions.     |
| Tablet     | 768–1023 | Panels stack, inventory becomes a bottom sheet, charts shrink.         |
| Mobile     | <768px   | Single‑column, bottom tab bar, drawers replace modals, swipe gestures. |

***

## Accessibility

| Area                | Requirement                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Colour contrast** | All text meets WCAG AA (4.5:1 for body, 3:1 for large text). Rarity badge colours tested against `--void-mid`.                 |
| **Focus states**    | Visible focus ring (2px `--star`, 2px offset) on all interactive elements.                                                     |
| **Screen readers**  | ARIA labels on all icon‑only buttons, rarity badges, and stat bars.                                                            |
| **Reduced motion**  | `prefers-reduced-motion` disables star‑field animation, box crack, launch sequence. Replaces with simple fades.                |
| **Keyboard nav**    | Full tab‑order through all interactive elements. Drag‑and‑drop has a keyboard alternative (select part → press Enter on slot). |

***

***

# Part IV — Quick‑Start Onboarding Flow

A guided 7‑step onboarding that overlays the real UI (spotlight + tooltip pattern, not a separate tutorial screen).

| Step | Spotlight Target         | Tooltip Copy                                                                  | Action Required                                |
| ---- | ------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| 1    | Wallet connect button    | "First, connect your wallet to the Entropy network."                          | Connect wallet.                                |
| 2    | Whitelist button         | "Lock 0.05 ETH to enter the testnet. This funds the prize pool."              | Complete whitelist.                            |
| 3    | Claim button             | "Claim your first φ. Come back every 24h for more."                           | Claim φ.                                       |
| 4    | Exchange tab             | "Head to the Exchange to swap φ for other tokens, or hold and keep claiming." | Navigate to Exchange.                          |
| 5    | Star Vault tab           | "Ready for some loot? Buy a mystery box and inspect the live catalog-backed crate before you open it." | Navigate to Vault.                             |
| 6    | Assembler tab            | "Once you have parts, build your rocket here."                                | Navigate to Assembler.                         |
| 7    | Launch button (disabled) | "Fill all 8 slots, then launch. Aim for the top 3 to win real ETH."           | Dismiss (button locked until parts collected). |

After completion, a "Tour Complete" toast with confetti appears. The user can replay the tour from Settings.

If Star Vault catalog reads are degraded during onboarding, the overlay should acknowledge the degraded metadata banner and direct the user to retry, rather than skipping the vault state or showing placeholder-only boxes.

***

***

# Part V — Emotional Design Map

Every app has a **peak emotional moment** that the design should amplify above all else.

| App                 | Peak Moment                     | Emotional Target | Design Investment                                                      |
| ------------------- | ------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| Entropy Gate        | First φ claim                   | Belonging        | φ Pulse animation + warm welcome toast + XP bar filling first segment. |
| Entropy Exchange    | First profitable swap           | Competence       | Green flash on positive P\&L + balance animation.                      |
| Star Vault Boxes    | Legendary+ box open             | Astonishment     | Maximum animation budget: Box Crack + Rarity Reveal + heavy haptic.    |
| Nebula Bids         | Winning an auction              | Triumph          | Full‑screen "YOU WON" modal + part flies into inventory.               |
| Celestial Assembler | Filling the final slot          | Anticipation     | Rocket schematic fully glows + rumble + Launch button ignites.         |
| Quantum Lift‑Off    | Score reveal (especially top 3) | Euphoria         | Confetti + golden flash + score counter + rank leap animation.         |
| Cosmic Jackpot      | Claiming the ETH prize          | Validation       | The single most celebratory animation in the entire platform.          |

***

*This document is the living reference for all design and brand decisions across the Entropy Testnet. Every screen, every animation, every word should pass one test: "Does this feel like the most premium space‑trading game anyone's ever seen on a blockchain?" If the answer is anything less than an immediate yes — refine it until it is.*

# Entropy Testnet — Design & Brand Bible

> **Audience:** Vision, Design & Branding Teams
> **Purpose:** Definitive reference for every visual, interactive, and experiential decision across the four Entropy apps
> **Design Philosophy:***"Apple meets the cosmos — ruthlessly clean, impossibly fun."*

***

***

# Part I — Brand Foundation

***

## 1. Brand Identity

### 1.1 Brand Essence

Entropy is not a typical crypto testnet. It's a **game dressed as a financial platform, and a financial platform dressed as a game**. Every pixel should feel like it belongs in a premium space simulator that also happens to let you trade tokens, collect NFTs, and win real money.

The brand sits at the intersection of three values:

```
         PRECISION                    WONDER                    PLAY
     ┌───────────────┐          ┌──────────────┐         ┌──────────────┐
     │ Clean layouts  │          │ Cosmic depth  │         │ Gamified     │
     │ Sharp type     │    ×     │ Unexpected    │    ×    │ Rewarding    │
     │ Confident      │          │ Beautiful     │         │ Addictive    │
     │ white space    │          │ moments of awe│         │ Celebratory  │
     └───────────────┘          └──────────────┘         └──────────────┘

```

**One‑liner:***"If Apple designed a space trading game on the blockchain."*

### 1.2 Brand Personality

| Trait          | What It Means in Practice                                   | What It Doesn't Mean                          |
| -------------- | ----------------------------------------------------------- | --------------------------------------------- |
| **Confident**  | Sparse copy, bold claims, no hedging.                       | Arrogant, condescending, hype‑bro.            |
| **Playful**    | Micro‑animations, Easter eggs, celebratory moments.         | Childish, cluttered, "meme‑coin" energy.      |
| **Mysterious** | Dark UI, reveals, progressive disclosure.                   | Confusing, hidden info, poor onboarding.      |
| **Premium**    | Generous whitespace, refined typography, considered motion. | Sterile, cold, unapproachable.                |
| **Communal**   | Leaderboards, invite flows, shared moments.                 | Social‑media‑like, noisy, notification‑heavy. |

### 1.3 The φ Symbol

The Entropy token uses the **φ symbol** (phi / "O‑with‑I") as its icon. This is the single most important brand mark.

**Usage rules:**

* Always displayed as a custom‑drawn glyph, not a font character.
* Appears in the token balance HUD, transaction confirmations, price tags, and the favicon.
* In motion contexts, the φ has a subtle, slow rotation (0.01 rpm) — barely perceptible, always alive.
* Colour: inherits the contextual accent colour of whatever app it sits inside (purple in Entropy Gate, teal in Entropy Exchange, etc.).

### 1.4 Voice & Tone

| Context          | Tone                 | Example                                                                     |
| ---------------- | -------------------- | --------------------------------------------------------------------------- |
| **Onboarding**   | Warm, inviting       | "Welcome to the Entropy universe. Your journey starts with a single φ."     |
| **Transactions** | Crisp, factual       | "Swap confirmed. 12 φ → 0.003 ETH."                                         |
| **Celebrations** | Bold, electric       | "LEGENDARY DROP. You just pulled a Hyper‑Drive."                            |
| **Errors**       | Calm, helpful        | "Transaction didn't go through. Check your balance and try again."          |
| **Leaderboard**  | Competitive, charged | "You're 47 points from the top 3. One more launch could change everything." |

**Copy rules:**

* Sentences, not paragraphs. Every word earns its place.
* Never say "please" in CTAs. Say what happens: "Claim φ", "Launch Now", "Open Box."
* Numbers are always formatted with the φ symbol inline: "φ 250", not "250 Entropy tokens."
* Avoid exclamation marks except in celebration modals.

***

## 2. Visual System

### 2.1 Colour Palette

The palette is built on a **deep‑space base** with **neon accent pops** — one signature accent per app.

#### Base Colours (Global)

| Token          | Hex       | Usage                                              |
| -------------- | --------- | -------------------------------------------------- |
| `--void`       | `#06080F` | Primary background. The "space" behind everything. |
| `--void-mid`   | `#0C1018` | Card backgrounds, elevated surfaces.               |
| `--void-light` | `#141A26` | Hover states, secondary panels.                    |
| `--dust`       | `#1E2636` | Borders, dividers, subtle separators.              |
| `--nebula`     | `#2A3348` | Inactive / disabled states.                        |
| `--star`       | `#E8ECF4` | Primary text.                                      |
| `--star-dim`   | `#8A94A8` | Secondary text, captions, labels.                  |
| `--star-faint` | `#4A5468` | Tertiary text, placeholders.                       |

#### App Accent Colours

| App                     | Accent Name   | Hex       | Glow Hex (20% opacity) | Usage                              |
| ----------------------- | ------------- | --------- | ---------------------- | ---------------------------------- |
| **Entropy Gate**        | `--gate`      | `#8B5CF6` | `#8B5CF633`            | CTAs, progress bars, XP badges.    |
| **Entropy Exchange**    | `--exchange`  | `#06D6A0` | `#06D6A033`            | Price tickers, swap confirmations. |
| **Star Vault Boxes**    | `--vault`     | `#F6C547` | `#F6C54733`            | Box outlines, rarity highlights.   |
| **Nebula Bids**         | `--bids`      | `#A855F7` | `#A855F733`            | Bid indicators, auction timers.    |
| **Celestial Assembler** | `--assembler` | `#94A3B8` | `#94A3B833`            | Slot outlines, stat bars.          |
| **Quantum Lift‑Off**    | `--liftoff`   | `#F97316` | `#F9731633`            | Launch button, event alerts.       |
| **Cosmic Jackpot**      | `--jackpot`   | `#FACC15` | `#FACC1533`            | Rankings, prize displays.          |

#### Rarity Colours

| Tier      | Hex       | Glow Treatment                                                  |
| --------- | --------- | --------------------------------------------------------------- |
| Common    | `#6B7280` | No glow. Flat badge.                                            |
| Uncommon  | `#22C55E` | Faint green glow on hover only.                                 |
| Rare      | `#3B82F6` | Soft blue outer glow, always on.                                |
| Epic      | `#8B5CF6` | Purple glow with subtle pulse (2s ease‑in‑out loop).            |
| Legendary | `#F59E0B` | Orange glow with shimmer (diagonal light sweep every 4s).       |
| Mythic    | `#EF4444` | Red glow with particle embers drifting upward (canvas overlay). |
| Celestial | `#06B6D4` | Cyan glow with aurora wave effect (CSS gradient animation).     |
| Quantum   | Prismatic | Full‑spectrum shifting gradient. Animated border. Unmistakable. |

> **Rule:** Rarity colours override app accent colours wherever a part or box is displayed. The rarity is always the loudest signal.

### 2.2 Typography

The type system pairs a **display face** for headings and impact moments with a **workhorse face** for body text and UI.

| Role        | Font                                             | Weight Range | Usage                                                                 |
| ----------- | ------------------------------------------------ | ------------ | --------------------------------------------------------------------- |
| **Display** | **Geist Mono** (or equivalent monospace display) | 500–800      | Headlines, modal titles, score displays, countdown timers, φ amounts. |
| **Body**    | **Satoshi** (by Fontshare, free)                 | 400–700      | Paragraphs, labels, buttons, navigation, form inputs.                 |
| **Data**    | **Geist Mono**                                   | 400          | Token amounts, wallet addresses, stat numbers, table cells.           |

**Type scale (desktop):**

| Token     | Size | Weight | Line Height | Usage                            |
| --------- | ---- | ------ | ----------- | -------------------------------- |
| `--h-xl`  | 56px | 800    | 1.05        | Hero headlines only.             |
| `--h-lg`  | 36px | 700    | 1.1         | Section titles.                  |
| `--h-md`  | 24px | 600    | 1.2         | Card titles, modal headers.      |
| `--h-sm`  | 18px | 600    | 1.3         | Sub‑headings, tab labels.        |
| `--body`  | 15px | 400    | 1.6         | Default body text.               |
| `--small` | 13px | 400    | 1.5         | Captions, timestamps, footnotes. |
| `--micro` | 11px | 500    | 1.4         | Badges, tooltips, status pills.  |

**Rules:**

* Headlines are always **uppercase tracked +0.05em** for display weight.
* Body text is always **sentence case**.
* Token amounts always use Geist Mono, never the body font.
* No underlines except on true hyperlinks.

### 2.3 Spacing & Layout

**Grid:** 12‑column, max‑width 1280px, 24px gutters. Cards and panels live on an **8px base unit** system.

| Token   | Value | Usage                                         |
| ------- | ----- | --------------------------------------------- |
| `--s-1` | 4px   | Inline spacing, icon‑to‑label gap.            |
| `--s-2` | 8px   | Tight padding inside badges and pills.        |
| `--s-3` | 16px  | Standard card padding, input padding.         |
| `--s-4` | 24px  | Section gaps, card‑to‑card margins.           |
| `--s-5` | 32px  | Major section dividers.                       |
| `--s-6` | 48px  | Page section spacing.                         |
| `--s-7` | 64px  | Hero sections, above‑the‑fold breathing room. |
| `--s-8` | 96px  | Page top/bottom margins.                      |

**Whitespace philosophy:** When in doubt, add more space. The cosmic theme should feel **vast**, not cramped. Density is reserved for data tables and inventory grids; everywhere else, let the void breathe.

### 2.4 Elevation & Surfaces

All surfaces live in front of `--void`. Depth is communicated through **background lightness steps** and **subtle borders**, not heavy shadows.

| Level | Background     | Border              | Usage                                   |
| ----- | -------------- | ------------------- | --------------------------------------- |
| 0     | `--void`       | None                | Page background.                        |
| 1     | `--void-mid`   | 1px `--dust`        | Primary cards, panels, navigation bar.  |
| 2     | `--void-light` | 1px `--dust`        | Modals, dropdown menus, popovers.       |
| 3     | `--void-light` | 1px accent (at 30%) | Active/selected states, focused inputs. |

**Corner radii:**

* Cards and modals: `16px`.
* Buttons: `12px`.
* Badges and pills: `full` (pill shape).
* Inputs: `10px`.

**Glassmorphism (used sparingly):**

* Navigation bar and wallet HUD use `backdrop-filter: blur(24px)` over the star‑field background.
* Opacity: 70% of `--void-mid`.
* Reserved only for persistent chrome (nav, HUD). Never on content cards.

### 2.5 Iconography

| Category          | Style                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **UI Icons**      | 1.5px stroke, 20×20 default, rounded caps. Lucide‑style. Consistent with body font weight.                |
| **Section Icons** | Custom illustrated icons for each of the 8 rocket sections. Detailed linework, single accent colour fill. |
| **Rarity Icons**  | Gem/crystal shapes that correspond to each tier. Animated at Mythic+ (ember, aurora, prismatic).          |
| **Event Icons**   | Circular badges with a pictogram for each random event (meteor, solar flare, comet, etc.).                |

### 2.6 Background & Atmosphere

The entire platform sits on a **living star‑field** — not a static image, but a subtly animated particle canvas.

**Star‑field spec:**

* 200–400 small white dots (1–2px) with randomised opacity (0.3–1.0).
* Gentle parallax on mouse move (desktop) or gyroscope (mobile): stars shift ±10px.
* 3–5 larger "nebula patches" — soft radial gradients in muted accent colours — slowly drifting (0.5px/s).
* Performance: rendered in a single `<canvas>` at 30fps, behind all UI. Falls back to a static hi‑res image on low‑power devices.

**Page transitions:** Each app has a signature nebula colour that fades in when navigating to that section, tinting the star‑field. Entropy Gate = purple haze, Entropy Exchange = teal haze, etc.

***

## 3. Motion & Interaction Design

### 3.1 Motion Principles

| Principle          | Meaning                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------- |
| **Purposeful**     | Every animation communicates something: a state change, a reward, a spatial relationship.   |
| **Fast then slow** | Entrances are snappy (150–250ms ease‑out). Exits are gentle (200–300ms ease‑in).            |
| **Celebrate wins** | Reward moments (box opens, launches, rank‑ups) get extra motion budget — up to 2–3 seconds. |
| **Never blocking** | Animations never prevent the user from taking the next action. Skippable if tapped.         |

### 3.2 Easing Curves

| Token             | Curve                               | Usage                             |
| ----------------- | ----------------------------------- | --------------------------------- |
| `--ease-default`  | `cubic-bezier(0.25, 0.1, 0.25, 1)`  | Most transitions.                 |
| `--ease-bounce`   | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Reward popups, score reveals.     |
| `--ease-dramatic` | `cubic-bezier(0.7, 0, 0.3, 1)`      | Page transitions, modal overlays. |

### 3.3 Signature Animations

| Animation           | Trigger                            | Duration | Description                                                                                                                                                                               |
| ------------------- | ---------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **φ Pulse**         | Token balance changes              | 600ms    | The φ icon scales to 1.15×, emits a ring of the app's accent colour that expands and fades, then settles back to 1×.                                                                      |
| **Card Entrance**   | Page load / tab switch             | 300ms    | Cards stagger in from below (translateY: 20px → 0) with 50ms delay per card. Opacity 0 → 1.                                                                                               |
| **Box Crack**       | Mystery box "Open" tap             | 2500ms   | Box shakes subtly (100ms), a light seam appears down the centre, the two halves split apart with a burst of particles in the rarity colour. The revealed part card floats up from behind. |
| **Rarity Reveal**   | Part card appears after box open   | 800ms    | Background flash in the rarity colour (200ms), badge slides in from top, attribute bars fill left‑to‑right sequentially (200ms each).                                                     |
| **Bid Placed**      | Successful bid submission          | 400ms    | Amount number counts up from previous bid to new bid (odometer style). Green checkmark fades in.                                                                                          |
| **Auction Tick**    | Every second during active auction | —        | Countdown digits flip (split‑flap / mechanical clock style). Last 60 seconds: digits turn `--liftoff` orange and pulse gently.                                                            |
| **Drag Snap**       | Part dragged onto rocket slot      | 250ms    | Part card shrinks to fit the slot with a magnetic snap effect. Slot border flashes the part's rarity colour once.                                                                         |
| **Launch Sequence** | "Launch" button pressed            | 3000ms+  | Full‑screen takeover. Rocket rumbles, thrust flame ignites from bottom, camera pulls back as rocket ascends. Stars streak. Random events appear as mid‑flight interstitial cards.         |
| **Score Reveal**    | Post‑launch                        | 1200ms   | Screen goes momentarily dark. Grav Score counts up from 0 in large Geist Mono type with `--ease-bounce`. If top 3, confetti + gold flash.                                                 |
| **Rank Change**     | Leaderboard update                 | 500ms    | Row slides up or down to its new position. If the user enters top 3, the row gets a golden glow border.                                                                                   |

### 3.4 Haptics (Mobile)

| Event                 | Pattern              |
| --------------------- | -------------------- |
| **CTA tap**           | Light impact.        |
| **Box open**          | Medium impact.       |
| **Rarity Legendary+** | Heavy impact + buzz. |
| **Launch ignition**   | Long ramp‑up buzz.   |
| **Score reveal**      | Success pattern.     |

***

***

# Part II — App‑by‑App Design Specification

***

## APP 1 — Entropy Gate

### *Bridge & Faucet*

**Accent:**`--gate` · `#8B5CF6` (Deep Purple)
**Mood:** Arrival. Portal. Initiation.

***

### Screen: Landing / Welcome

**Layout:** Full‑viewport hero, no scroll required for core action.

```
┌──────────────────────────────────────────────────────────────────┐
│  [Nav Bar — glass, persistent across all apps]                   │
│   Logo (φ mark + "ENTROPY")    Tabs: Gate Exchange Vault ...     │
│   ─────────────────────────────────────── [Wallet: 0x...] [φ 0] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│              ┌──────────────────────────────┐                    │
│              │                              │                    │
│              │     YOUR JOURNEY BEGINS      │                    │
│              │     WITH A SINGLE φ          │                    │
│              │                              │                    │
│              │   ┌────────────────────┐     │                    │
│              │   │   CLAIM  φ  1      │     │  ← Large pill      │
│              │   └────────────────────┘     │    button, purple   │
│              │                              │    glow on hover    │
│              │   Next claim in: 23:41:07    │                    │
│              │                              │                    │
│              └──────────────────────────────┘                    │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ ETH Locked  │  │ φ Supply    │  │ Prize Pool  │              │
│  │   42.5 ETH  │  │   8,402 φ   │  │  21.25 ETH  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌──────────────────────────────────────────┐                    │
│  │  ENTROPY POINTS (XP)                     │                    │
│  │  ████████████░░░░░░░░  Day 5 / 7         │                    │
│  │  Milestone: Free Common Box at Day 7     │                    │
│  └──────────────────────────────────────────┘                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

```

**Interaction details:**

* **Before whitelist:** The Claim button is replaced by a "Lock 0.05 ETH to Enter" button with a lock icon. Pressing it opens a slim confirmation drawer (not a modal — keeps context visible). After confirmation, the drawer closes and the Claim button fades in with the φ Pulse animation.
* **Claim available:** Button is fully saturated `--gate` purple with a soft outer glow pulsing slowly (3s loop). One tap → φ Pulse animation → balance updates.
* **Claim on cooldown:** Button desaturates to `--nebula`. Countdown runs in Geist Mono. A thin ring around the button fills clockwise over 24 hours (like a radial progress indicator).
* **XP Progress Bar:** Segmented bar (7 segments for a weekly streak). Filled segments glow `--gate`. Unfilled are `--dust`. Milestone marker shows a tiny mystery‑box icon at day 7.
* **Live Counters:** Three stat cards at the bottom, each with a monospaced number that ticks up in real time (odometer style) when new whitelists occur.

***

## APP 2 — Entropy Exchange

### *The DEX*

**Accent:**`--exchange` · `#06D6A0` (Electric Teal)
**Mood:** Speed. Clarity. Precision.

***

### Screen: Swap Interface

**Layout:** Two‑panel — swap card (left, 60%) and market info (right, 40%).

```
┌─────────────────────────────────────┬────────────────────────────┐
│                                     │                            │
│  SWAP                               │  φ / ETH                   │
│                                     │  ┌──────────────────────┐  │
│  ┌───────────────────────────────┐  │  │  Price Chart          │  │
│  │  From                         │  │  │  (candlestick,        │  │
│  │  ┌──────┐  ┌───────────────┐  │  │  │   dark bg, teal line) │  │
│  │  │ φ  ▾ │  │         12.00 │  │  │  │                       │  │
│  │  └──────┘  └───────────────┘  │  │  └──────────────────────┘  │
│  │  Balance: φ 47                │  │                            │
│  │                               │  │  Pool Depth               │
│  │         ⇅  (swap direction)   │  │  ┌──────────────────────┐  │
│  │                               │  │  │  (area chart, teal    │  │
│  │  To                           │  │  │   fill, dark bg)      │  │
│  │  ┌──────┐  ┌───────────────┐  │  │  │                       │  │
│  │  │ETH ▾ │  │     ~0.0031   │  │  │  └──────────────────────┘  │
│  │  └──────┘  └───────────────┘  │  │                            │
│  │  Rate: 1 φ = 0.00026 ETH     │  │  Pool Stats               │
│  │                               │  │  Liquidity: φ 24,000      │
│  │  ┌───────────────────────┐    │  │  24h Volume: φ 3,841      │
│  │  │      SWAP NOW         │    │  │  Fee: 0.30%               │
│  │  └───────────────────────┘    │  │                            │
│  │                               │  │                            │
│  │  Slippage: 0.5% [Adjust]     │  │                            │
│  │  Fee: 0.036 φ                 │  │                            │
│  └───────────────────────────────┘  │                            │
│                                     │                            │
│  [Add Liquidity]  [My LP Positions] │                            │
│                                     │                            │
└─────────────────────────────────────┴────────────────────────────┘

```

**Interaction details:**

* **Token selector dropdown:** Dark popover with token icon + name + balance. φ, BTC, ETH, UVD. Each row shows a mini‑sparkline of 24h price action.
* **Amount input:** Monospaced, large (24px). Auto‑calculates "To" field as user types. Debounced 300ms.
* **Swap direction toggle:** The ⇅ icon rotates 180° on click (300ms). From and To fields cross‑fade swap.
* **"Swap Now" button:** Full‑width, `--exchange` teal. On hover: glow intensifies. On click: button text changes to a spinning loader → "Confirming…" → checkmark + "Swapped!" (teal flash).
* **Slippage adjuster:** Tap "Adjust" to reveal a slim slider with preset pills (0.1%, 0.5%, 1.0%, Custom).
* **Fee display:** Always visible, never hidden. Transparency is brand‑critical.
* **Price chart:** Dark canvas with a single teal line. No grid clutter. Time range toggles: 1H · 24H · 7D · 30D. Crosshair on hover showing exact price + time.
* **Flash Trade mode:** Toggle in the top‑right of the swap card. When active, the card border shifts to a pulsing teal, inputs auto‑fill with "Best Price" slippage, and the CTA changes to "FLASH SWAP" with a lightning‑bolt icon.

***

### Screen: Liquidity Provider Dashboard

* **My Positions table:** Each row shows pool name, LP token balance, share %, accrued fees, and a "Withdraw" button.
* **Add Liquidity flow:** Two‑token input card (same style as swap), "Supply" CTA → confirmation drawer → success animation (two token icons merge into an LP token icon).
* **Yield farming:** If active, a banner at the top of the LP dashboard shows APY with a small flame icon. "Stake LP" CTA in accent teal.

***

## APP 3 — Star Vault & Nebula Bids

### *Mystery Box + Auction*

**Accent:**`--vault` Gold (Mystery Box) · `--bids` Violet (Auction)
**Mood:** Thrill. Chance. Discovery.

***

### Screen: Star Vault — Mystery Box Store

**Layout:** Full‑width grid of 8 box tiers, 4 per row (desktop), scrollable on mobile.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  STAR VAULT                                     [My Inventory ▸] │
│  Crack open the cosmos.                                          │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │          │  │          │  │          │  │          │        │
│  │ COMMON   │  │ UNCOMMON │  │  RARE    │  │  EPIC    │        │
│  │   ░░░    │  │   ░░░    │  │   ░░░    │  │   ░░░    │        │
│  │          │  │          │  │          │  │          │        │
│  │  φ 10    │  │  φ 25    │  │  φ 50    │  │  φ 100   │        │
│  │ [BUY]    │  │ [BUY]    │  │ [BUY]    │  │ [BUY]    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │          │  │          │  │          │  │ ✦✦✦✦✦✦  │        │
│  │LEGENDARY │  │ MYTHIC   │  │CELESTIAL │  │ QUANTUM  │        │
│  │   ░░░    │  │   ░░░    │  │   ░░░    │  │   ░░░    │        │
│  │          │  │          │  │          │  │          │        │
│  │  φ 200   │  │  φ 350   │  │  φ 500   │  │  φ 750   │        │
│  │ [BUY]    │  │ [BUY]    │  │ [BUY]    │  │ [BUY]    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

```

**Box card details:**

Each box card is a 3D object that tilts slightly on mouse move (perspective transform, ±5°). The box illustration sits centred, rendered as a custom 3D‑ish icon per tier:

| Tier      | Box Appearance                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------ |
| Common    | Simple grey cube, matte finish. No animation.                                                    |
| Uncommon  | Grey‑green cube, faint inner glow.                                                               |
| Rare      | Blue metallic cube, soft outer glow on hover.                                                    |
| Epic      | Purple crystal box, slow pulse glow (2s).                                                        |
| Legendary | Gold ornate box with engraved lines, shimmer sweep animation (4s).                               |
| Mythic    | Red molten box with ember particles floating upward from corners.                                |
| Celestial | Cyan translucent box with aurora wave flowing across its surface.                                |
| Quantum   | Prismatic shifting box — colours cycle through the full spectrum. Animated border. Unmistakable. |

**Hover state:** Card lifts 4px (translateY), border brightens to rarity colour. A tooltip appears showing drop‑rate breakdown for that tier.

**Purchase flow:**

1. Tap "BUY" → Confirmation drawer slides up: "Open a \[Tier] Star Vault Box for φ \[Price]?" + \[Confirm] / \[Cancel].
2. Confirm → Transaction submits. Button becomes a loader.
3. Success → The purchased box appears centred on screen (full‑screen overlay, `--void` at 90% opacity behind).
4. "OPEN" button appears below the box, pulsing in the tier's rarity colour.
5. Tap "OPEN" → **Box Crack animation** (see Section 3.3).
6. Part card floats up from behind the split box halves → **Rarity Reveal animation**.
7. Result card shows: Part name, section icon, rarity badge, three attribute bars (animated fill), Part Value score.
8. Below the card: \[EQUIP TO ROCKET] · \[SEND TO AUCTION] · \[VIEW IN INVENTORY].

### Screen: Inventory Panel

Accessible via "My Inventory" in the Star Vault header, or as a persistent sidebar on desktop.

**Layout:** Grid of part cards (4 columns desktop, 2 mobile). Each card shows:

* Part illustration (from IPFS).
* Section icon (top‑left corner).
* Rarity badge pill (top‑right corner), coloured per tier.
* Three mini attribute bars below the illustration.
* Part Value score in Geist Mono at the bottom.

**Sorting & Filtering:**

* **Sort by:** Value (default) · Rarity · Section · Date acquired.
* **Filter by:** Section (8 toggles with section icons) · Rarity (8 colour‑coded toggles).
* Filters are sticky pills at the top of the inventory panel, horizontally scrollable on mobile.

**Actions per card:**

* Tap card → Expanded detail view (modal): full stat breakdown with attribute meanings, rarity multiplier shown, "Equip" / "Auction" / "Craft" buttons.
* Long‑press / right‑click → Quick‑action menu: Equip · Auction · Compare.

***

### Screen: Nebula Bids — Auction Hall

**Layout:** Split — Active auction (left, 65%) + Sidebar (right, 35%).

```
┌──────────────────────────────────────┬───────────────────────────┐
│                                      │                           │
│  NEBULA BIDS                         │  SUBMIT YOUR ITEM         │
│                                      │  ┌─────────────────────┐  │
│  ┌────────────────────────────────┐  │  │ [Your eligible parts │  │
│  │                                │  │  │  appear here as      │  │
│  │   ┌──────────────────────┐     │  │  │  cards with          │  │
│  │   │                      │     │  │  │  "Submit" buttons]   │  │
│  │   │   LEGENDARY          │     │  │  └─────────────────────┘  │
│  │   │   NOVA THRUSTER      │     │  │                           │
│  │   │   Core Engine         │     │  │  TOP CONTRIBUTORS        │
│  │   │                      │     │  │  1. 0xA3… — φ 4,200      │
│  │   │   Heat Flux: ████ 72 │     │  │  2. 0x7F… — φ 3,180      │
│  │   │   Thrust:    ████ 88 │     │  │  3. 0xD1… — φ 1,940      │
│  │   │   Mass:      ██   31 │     │  │                           │
│  │   └──────────────────────┘     │  │                           │
│  │                                │  │                           │
│  │   Current Bid: φ 340           │  │                           │
│  │   Bids: 12                     │  │                           │
│  │   Ends in:  01:23:47           │  │                           │
│  │                                │  │                           │
│  │   ┌──────────────┐ ┌────────┐  │  │                           │
│  │   │  φ  357      │ │  BID   │  │  │                           │
│  │   └──────────────┘ └────────┘  │  │                           │
│  │                                │  │                           │
│  │   Bid History                  │  │                           │
│  │   0xF2… — φ 340 — 4m ago      │  │                           │
│  │   0xA3… — φ 310 — 11m ago     │  │                           │
│  │   0x7F… — φ 280 — 22m ago     │  │                           │
│  └────────────────────────────────┘  │                           │
│                                      │                           │
└──────────────────────────────────────┴───────────────────────────┘

```

**Interaction details:**

* **Countdown timer:** Large, mechanical split‑flap digits (see Section 3.3 — Auction Tick). Centred above the auction panel. Last 60 seconds: digits turn orange, a faint siren‑style radial pulse appears on the panel border.
* **Bid input:** Pre‑filled with the minimum valid bid (current highest + 5%). User can type a higher amount. "BID" button in `--bids` violet.
* **Outbid notification:** If user is outbid while viewing the page, a toast slides in from the top‑right: "You've been outbid! New highest: φ X" with a \[Re‑bid] shortcut button.
* **Auction end:** Full‑screen modal overlay: "AUCTION COMPLETE" → Winner address revealed → Final price odometer → Part card animation → "Part transferred to \[winner]."
* **No active auction:** If between rounds, show a "Next auction in: HH:MM:SS" countdown with a preview of submitted items (blurred, to build suspense).

***

## APP 4 — Celestial Assembler, Quantum Lift‑Off & Cosmic Jackpot

### *Builder + Launch + Leaderboard*

**Accents:**`--assembler` Silver · `--liftoff` Fiery Orange · `--jackpot` Neon Gold
**Mood:** Craft. Adrenaline. Glory.

***

### Screen: Celestial Assembler — Rocket Builder

**Layout:** Two‑panel — Rocket schematic (left, 55%) + Inventory drawer (right, 45%).

```
┌──────────────────────────────────┬───────────────────────────────┐
│                                  │                               │
│  CELESTIAL ASSEMBLER             │  YOUR PARTS                   │
│                                  │  [Sort ▾]  [Filter ▾]        │
│      ┌──────────────────┐        │                               │
│      │    SHIELDING      │  ← 8  │  ┌─────┐ ┌─────┐ ┌─────┐    │
│      ├──────────────────┤        │  │ ░░░ │ │ ░░░ │ │ ░░░ │    │
│      │   NAV MODULE      │  ← 4  │  │Rare │ │Epic │ │Comm│    │
│      ├──────────────────┤        │  └─────┘ └─────┘ └─────┘    │
│      │   PAYLOAD BAY     │  ← 5  │                               │
│      ├──────────────────┤        │  ┌─────┐ ┌─────┐ ┌─────┐    │
│      │   WING‑PLATES     │  ← 2  │  │ ░░░ │ │ ░░░ │ │ ░░░ │    │
│      ├──────────────────┤        │  │Lgnd │ │Myth│ │Rare │    │
│      │   PROP. CABLES    │  ← 7  │  └─────┘ └─────┘ └─────┘    │
│      ├──────────────────┤        │                               │
│      │   FUEL CELLS      │  ← 3  │       ... scrollable ...     │
│      ├──────────────────┤        │                               │
│      │   THRUSTER ARRAY  │  ← 6  │                               │
│      ├──────────────────┤        │  ──────────────────────────── │
│      │   CORE ENGINE     │  ← 1  │  STATS PREVIEW               │
│      └──────────────────┘        │  Total Attributes: 1,247     │
│                                  │  Est. Grav Score: 480–720     │
│   ┌─────────────────────────┐    │  Rarity Bonus: +18%           │
│   │  🔒 Fill all 8 slots    │    │                               │
│   │     to unlock LAUNCH    │    │                               │
│   └─────────────────────────┘    │                               │
│                                  │                               │
└──────────────────────────────────┴───────────────────────────────┘

```

**Rocket schematic details:**

* The rocket is rendered as a **stylised vertical cross‑section** — not photorealistic, but a clean, technical blueprint aesthetic with thin white lines on `--void`.
* Each of the 8 slots is a labelled region of the blueprint. Empty slots have a dashed border and a "+" icon.
* When a part is equipped, the slot fills with the part's rarity colour as a subtle background wash, and the part name appears inside.
* The schematic subtly pulses with life as slots are filled — a dim glow travels up the rocket outline, brighter with more parts equipped.

**Drag and drop:**

* Parts from the inventory panel can be dragged onto the schematic. Only matching sections accept drops (invalid drops bounce back with a gentle shake animation).
* On valid drop: **Drag Snap** animation (250ms) → slot border flashes rarity colour → stats panel updates in real time.
* On slot already occupied: "Replace \[Current Part] with \[New Part]?" tooltip appears. Confirm = old part returns to inventory with a slide animation.

**Stats Preview panel (bottom‑right):**

* **Total Attributes:** Sum of all 24 attribute values across equipped parts.
* **Estimated Grav Score:** Range based on the attribute total × possible environment factor range.
* **Rarity Bonus:** Percentage bonus from aggregate rarity. If a set bonus applies, a special "SET BONUS ACTIVE" badge appears with a sparkle animation.

**Launch button:**

* Locked (greyed, with lock icon) until all 8 slots are filled.
* Once unlocked: Large pill button, `--liftoff` orange, pulsing glow, text reads "LAUNCH →".
* On hover: Rocket schematic shakes subtly, as if engines are warming up.

***

### Screen: Quantum Lift‑Off — Launch Mission

**Layout:** Full‑screen cinematic experience. Minimal chrome.

**Pre‑launch state:**

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                         QUANTUM LIFT‑OFF                         │
│                                                                  │
│                    ┌───────────────────────┐                     │
│                    │                       │                     │
│                    │    [Rocket preview     │                     │
│                    │     assembled, idle,   │                     │
│                    │     on launch pad]     │                     │
│                    │                       │                     │
│                    └───────────────────────┘                     │
│                                                                  │
│              Est. Grav Score: 480–720                             │
│              Fuel Cost: φ 2                                      │
│              Random Events: Active                               │
│                                                                  │
│                    ┌───────────────────┐                         │
│                    │   IGNITE  🔥      │   ← Orange, massive     │
│                    └───────────────────┘                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

```

**Launch sequence (after "IGNITE"):**

1. **T‑minus countdown** (3… 2… 1…) — large Geist Mono numerals, each with a camera shake.
2. **Ignition** — Flame particles burst from the rocket base. Deep rumble haptic on mobile.
3. **Ascent** — Camera zooms out. Star streaks fill the background. The rocket moves upward.
4. **Random events** — Mid‑flight, event cards slide in from the right:
   * Each card: Event icon + name + short description + damage/buff indicator.
   * Card appears for 2 seconds, then slides out. Damaged parts flash red briefly on the rocket.
   * Events stack as a timeline on the left edge of the screen.
