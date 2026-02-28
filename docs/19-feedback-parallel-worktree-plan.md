# Feedback Parallel Worktree Plan

## Stub 2 Status: Implemented In `wt_nav_refactor`

This worktree completed the home, gate, and wallet navigation refactor that was scoped as the independent app-shell branch.

### Matters Solved In This Worktree

- Added dedicated `#gate` and `#wallet` routes in the app hash router.
- Created a dedicated gate page and moved the existing ETH lock / FLUX claim experience out of the home hero into a shared `EntropyGatePanel`, reusing the existing logic instead of duplicating it.
- Created a dedicated wallet page that lists `FLUX`, `wETH`, `wBTC`, and `UVD`.
- Wired live `FLUX` balance to `GameState.fluxBalance`.
- Marked `wETH`, `wBTC`, and `UVD` as explicit scaffolded / pending rows because this branch does not add fake balance backends.
- Reduced the home hero so it acts as overview / funnel content instead of embedding the gate card.
- Removed the embedded Entropy Gate card from home and reduced the hero headline size.
- Updated the shell header on desktop and mobile to remove `DOCS` and `JACKPOT` from the home header.
- Preserved leaderboard access through normal navigation and footer links.
- Replaced the old FLUX pill in the header with a labeled wallet entry that routes to `#wallet`.
- Updated the Entropy Gate banner so non-home pages route to `#gate` instead of returning to home.
- Updated quick actions and footer links so Entropy Gate points to the dedicated gate page.

### Additional Engineering Cleanup Completed Here

- Split the Web3 onboarding bootstrap more cleanly so `web3Onboard.ts` is no longer both statically and dynamically imported.
- Moved shared onboarding constants / modal-close behavior into a lightweight helper module to support cleaner code-splitting.
- Reduced the original oversized vendor bundle problem significantly, though one entry chunk still remains slightly above Vite's default chunk warning threshold.

### Remaining Manual Follow-Up

- Final copy and visual hierarchy review for the new gate and wallet pages.
- Cross-device browser QA for the new `#gate` and `#wallet` flows.
- Optional follow-up bundling pass if the remaining `index` chunk warning should be eliminated entirely.
