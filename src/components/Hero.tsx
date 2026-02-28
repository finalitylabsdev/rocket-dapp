import { ChevronRight, Gavel, Trophy } from 'lucide-react';
import {
  FAUCET_ENABLED,
  STAR_VAULT_ENABLED,
  NEBULA_BIDS_ENABLED,
  ROCKET_LAB_ENABLED,
} from '../config/flags';
import LaunchCountdown from './LaunchCountdown';

/* ── Color palettes per card ── */
const gateColor = { accent: '#4ADE80', bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.25)', glow: 'rgba(74,222,128,0.12)' };
const vaultColor = { accent: '#F6C547', bg: 'rgba(246,197,71,0.06)', border: 'rgba(246,197,71,0.25)', glow: 'rgba(246,197,71,0.12)' };
const labColor = { accent: '#38BDF8', bg: 'rgba(56,189,248,0.06)', border: 'rgba(56,189,248,0.25)', glow: 'rgba(56,189,248,0.12)' };

/* ── Arrow connector flush between cards ── */
function StepArrow({ fromColor, toColor }: { fromColor: string; toColor: string }) {
  const gradId = `arr-${fromColor.slice(1)}-${toColor.slice(1)}`;
  return (
    <>
      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-center -mx-[1px] relative z-10" style={{ width: 56 }}>
        <svg width="56" height="36" viewBox="0 0 56 36" fill="none" className="block w-full">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={fromColor} />
              <stop offset="100%" stopColor={toColor} />
            </linearGradient>
          </defs>
          <polygon
            points="0,14 36,14 36,4 56,18 36,32 36,22 0,22"
            fill={`url(#${gradId})`}
            fillOpacity="0.18"
          />
        </svg>
      </div>
      {/* Mobile: vertical */}
      <div className="flex md:hidden justify-center -my-[1px] relative z-10" style={{ height: 56 }}>
        <svg width="36" height="56" viewBox="0 0 36 56" fill="none" className="block">
          <defs>
            <linearGradient id={`${gradId}-v`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fromColor} />
              <stop offset="100%" stopColor={toColor} />
            </linearGradient>
          </defs>
          <polygon
            points="14,0 14,36 4,36 18,56 32,36 22,36 22,0"
            fill={`url(#${gradId}-v)`}
            fillOpacity="0.18"
          />
        </svg>
      </div>
    </>
  );
}


interface HeroProps {
  onOpenGate: () => void;
  onOpenMystery: () => void;
  onOpenBids: () => void;
  onOpenLab: () => void;
  onOpenLeaderboard: () => void;
}

export default function Hero({ onOpenGate, onOpenMystery, onOpenBids, onOpenLab, onOpenLeaderboard }: HeroProps) {
  const gateEnabled = FAUCET_ENABLED;
  const vaultEnabled = STAR_VAULT_ENABLED || NEBULA_BIDS_ENABLED;
  const labEnabled = ROCKET_LAB_ENABLED;

  return (
    <section className="relative flex flex-col overflow-hidden pt-20">
      <LaunchCountdown />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center">
        <div className="w-full py-14 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-12 animate-slide-up">

            <div className="space-y-4">
              <h1 className="font-display font-normal text-3xl sm:text-4xl text-text-primary leading-[1] tracking-tight" style={{ letterSpacing: '-0.025em' }}>
                Explore{' '}
                <span className="text-text-primary">Entropy Network</span>
              </h1>
              <p className="font-mono font-normal text-[11px] text-text-muted tracking-[0.14em] uppercase">
                Deterministic. Immutable. Gamified.
              </p>
            </div>

            <div className="max-w-2xl mx-auto mb-8">
              <p className="font-mono text-sm text-text-secondary leading-relaxed">
                The future needs infrastructure that doesn't break under stress.
                So we are building it and turned testing it into a game.
                Design your rocket, race to Mars, and push our testnet to its limits.
              </p>
            </div>

            {/* ── Step cards with arrows ── */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-0 text-left items-stretch">

              {/* ─ Step 1: Entropy Gate ─ */}
              <div
                className={`group relative border overflow-hidden transition-all duration-300 ${
                  gateEnabled ? 'cursor-pointer' : 'opacity-45 grayscale-[0.6] cursor-default'
                }`}
                style={{
                  background: gateEnabled ? gateColor.bg : undefined,
                  borderColor: gateColor.border,
                  boxShadow: gateEnabled ? `0 0 24px ${gateColor.glow}` : undefined,
                }}
                onClick={gateEnabled ? onOpenGate : undefined}
              >
                <div className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 flex items-center justify-center shrink-0 font-mono font-black text-lg"
                      style={{ background: gateColor.accent, color: '#06080F' }}
                    >
                      1
                    </div>
                    <div>
                      <h3 className="font-mono font-bold text-base leading-tight uppercase tracking-wider" style={{ color: gateColor.accent }}>
                        Gate
                      </h3>
                      <p className="text-xs font-mono font-semibold text-text-secondary mt-0.5">
                        Get Φ
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-text-muted leading-relaxed flex-1 mb-4">
                    Cross over into the light side.
                  </p>

                  <div
                    className="w-full border font-mono font-semibold text-sm py-2.5 flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all duration-200"
                    style={{ borderColor: gateColor.accent, color: gateColor.accent }}
                  >
                    Enter Network
                    <ChevronRight size={13} />
                  </div>
                </div>
              </div>

              <StepArrow fromColor={gateColor.accent} toColor={vaultColor.accent} />

              {/* ─ Step 2: Star Vault ─ */}
              <div
                className={`group relative border overflow-hidden transition-all duration-300 ${
                  vaultEnabled ? 'cursor-pointer' : 'opacity-45 grayscale-[0.6] cursor-default'
                }`}
                style={{
                  background: vaultEnabled ? vaultColor.bg : undefined,
                  borderColor: vaultColor.border,
                  boxShadow: vaultEnabled ? `0 0 24px ${vaultColor.glow}` : undefined,
                }}
                onClick={vaultEnabled ? onOpenMystery : undefined}
              >
                <div className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 flex items-center justify-center shrink-0 font-mono font-black text-lg"
                      style={{ background: vaultColor.accent, color: '#06080F' }}
                    >
                      2
                    </div>
                    <div>
                      <h3 className="font-mono font-bold text-base leading-tight uppercase tracking-wider" style={{ color: vaultColor.accent }}>
                        Vault
                      </h3>
                      <p className="text-xs font-mono font-semibold text-text-secondary mt-0.5">
                        Collect Parts
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-text-muted leading-relaxed flex-1 mb-4">
                    Open mystery boxes and discover rare models.
                  </p>

                  <div
                    className="w-full border font-mono font-semibold text-sm py-2.5 flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all duration-200"
                    style={{ borderColor: vaultColor.accent, color: vaultColor.accent }}
                  >
                    {vaultEnabled ? 'Open a Box' : 'Coming Soon'}
                    {vaultEnabled && <ChevronRight size={13} />}
                  </div>
                </div>
              </div>

              <StepArrow fromColor={vaultColor.accent} toColor={labColor.accent} />

              {/* ─ Step 3: Rocket Lab ─ */}
              <div
                className={`group relative border overflow-hidden transition-all duration-300 ${
                  labEnabled ? 'cursor-pointer' : 'opacity-45 grayscale-[0.6] cursor-default'
                }`}
                style={{
                  background: labEnabled ? labColor.bg : undefined,
                  borderColor: labColor.border,
                  boxShadow: labEnabled ? `0 0 24px ${labColor.glow}` : undefined,
                }}
                onClick={labEnabled ? onOpenLab : undefined}
              >
                <div className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 flex items-center justify-center shrink-0 font-mono font-black text-lg"
                      style={{ background: labColor.accent, color: '#06080F' }}
                    >
                      3
                    </div>
                    <div>
                      <h3 className="font-mono font-bold text-base leading-tight uppercase tracking-wider" style={{ color: labColor.accent }}>
                        Lab
                      </h3>
                      <p className="text-xs font-mono font-semibold text-text-secondary mt-0.5">
                        Build Rocket
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-text-muted leading-relaxed flex-1 mb-4">
                    Assemble the rocket and compete for Mars.
                  </p>

                  <div
                    className="w-full border font-mono font-semibold text-sm py-2.5 flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all duration-200"
                    style={{ borderColor: labColor.accent, color: labColor.accent }}
                  >
                    {labEnabled ? 'Start Building' : 'Coming Soon'}
                    {labEnabled && <ChevronRight size={13} />}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Feature titles (glow on hover only) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={onOpenBids}
                className="group flex items-center justify-center gap-3 border p-5 transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(192,132,252,0.2)]"
                style={{
                  background: 'rgba(192,132,252,0.03)',
                  borderColor: 'rgba(192,132,252,0.15)',
                }}
              >
                <Gavel size={20} className="text-[#C084FC]/70 group-hover:text-[#C084FC] transition-colors duration-300" />
                <span className="font-mono font-bold text-base uppercase tracking-wider text-[#C084FC]/70 group-hover:text-[#C084FC] transition-colors duration-300">
                  Parts Auction
                </span>
              </button>

              <button
                onClick={onOpenLeaderboard}
                className="group flex items-center justify-center gap-3 border p-5 transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(251,146,60,0.2)]"
                style={{
                  background: 'rgba(251,146,60,0.03)',
                  borderColor: 'rgba(251,146,60,0.15)',
                }}
              >
                <Trophy size={20} className="text-[#FB923C]/70 group-hover:text-[#FB923C] transition-colors duration-300" />
                <span className="font-mono font-bold text-base uppercase tracking-wider text-[#FB923C]/70 group-hover:text-[#FB923C] transition-colors duration-300">
                  Cosmic Jackpot
                </span>
              </button>
            </div>

            <div className="max-w-2xl mx-auto text-left mt-8">
              <blockquote className="border-l-2 border-border-default pl-5">
                <p className="font-mono text-sm text-text-secondary leading-relaxed">
                  Progress begins as a spark in the eyes. A moment where curiosity turns into movement and imagination demands structure. This game is playful on the surface, but beneath it runs real infrastructure built to carry far more than rockets.
                </p>
                <p className="font-mono text-sm text-text-secondary leading-relaxed mt-3">
                  And this is only the first visible step. Entropy is part of a much larger architecture that will unfold in time. If that spark resonates with you, join the community and help shape what comes next.
                </p>
              </blockquote>
              <p className="pl-5 font-mono text-sm text-text-muted mt-6">
                — The Entropy Team
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
