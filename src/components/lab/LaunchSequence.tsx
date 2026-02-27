import { useEffect, useRef, useState } from 'react';
import type { RocketModelId } from './RocketModels';
import { FlaskConical } from 'lucide-react';

interface LaunchResult {
  score: number;
  bonus: string;
  multiplier: string;
}

interface LaunchSequenceProps {
  model: RocketModelId;
  result: LaunchResult | null;
  power: number;
  onDismiss: () => void;
}

const PHASE_DURATIONS = {
  countdown:  2200,
  liftoff:    1800,
  atmosphere: 2000,
  space:      3000,
  mars:       3000,
  result:     999999,
};

const PHASES = ['countdown', 'liftoff', 'atmosphere', 'space', 'mars', 'result'] as const;
type Phase = typeof PHASES[number];

function Stars({ count = 200, streaking = false }: { count?: number; streaking?: boolean }) {
  const stars = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: 0.4 + Math.random() * 1.8,
      opacity: 0.15 + Math.random() * 0.85,
      twinkle: 2 + Math.random() * 5,
    }))
  );
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
      {stars.current.map((s, i) => (
        <circle
          key={i}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={streaking ? s.r * 0.6 : s.r}
          fill="white"
          opacity={s.opacity}
          style={{ animation: `twinkle ${s.twinkle}s ease-in-out infinite alternate` }}
        />
      ))}
    </svg>
  );
}

function MarsBody({ size, glowIntensity }: { size: number; glowIntensity: number }) {
  const r = size / 2;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      style={{
        filter: `drop-shadow(0 0 ${glowIntensity * 40}px rgba(232,96,76,${0.2 + glowIntensity * 0.5}))`,
        transition: 'filter 1.5s ease',
      }}
    >
      <defs>
        <radialGradient id="mars-body-dyn" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#E8A87C" />
          <stop offset="30%" stopColor="#C0522A" />
          <stop offset="70%" stopColor="#8B2500" />
          <stop offset="100%" stopColor="#4A1000" />
        </radialGradient>
        <radialGradient id="mars-atm-dyn" cx="50%" cy="50%" r="52%">
          <stop offset="85%" stopColor="transparent" />
          <stop offset="95%" stopColor="#E8604C" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#E8604C" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="mars-cap-dyn" cx="50%" cy="10%" r="30%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r * 1.18} fill="#E8604C" fillOpacity="0.07" style={{ filter: 'blur(10px)' }} />
      <circle cx={cx} cy={cy} r={r} fill="url(#mars-body-dyn)" />
      <circle cx={cx} cy={cy} r={r} fill="url(#mars-atm-dyn)" />
      <ellipse cx={cx} cy={cy * 0.38} rx={r * 0.48} ry={r * 0.2} fill="url(#mars-cap-dyn)" />
      <ellipse cx={cx * 0.75} cy={cy * 0.87} rx={r * 0.31} ry={r * 0.14} fill="#6B2010" fillOpacity="0.5" transform={`rotate(-20 ${cx * 0.75} ${cy * 0.87})`} />
      <ellipse cx={cx * 1.19} cy={cy * 1.12} rx={r * 0.24} ry={r * 0.1} fill="#6B2010" fillOpacity="0.4" transform={`rotate(15 ${cx * 1.19} ${cy * 1.12})`} />
      <ellipse cx={cx * 0.94} cy={cy * 1.31} rx={r * 0.38} ry={r * 0.12} fill="#9B3520" fillOpacity="0.35" transform={`rotate(-5 ${cx * 0.94} ${cy * 1.31})`} />
      <ellipse cx={cx * 0.56} cy={cy * 1.12} rx={r * 0.17} ry={r * 0.08} fill="#5A1808" fillOpacity="0.45" transform={`rotate(-30 ${cx * 0.56} ${cy * 1.12})`} />
    </svg>
  );
}

function EarthBackground() {
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
      <svg width="500" height="260" viewBox="0 0 500 260" fill="none">
        <defs>
          <radialGradient id="earth-grad" cx="45%" cy="20%" r="70%">
            <stop offset="0%" stopColor="#4A9EE8" />
            <stop offset="40%" stopColor="#1A6EC0" />
            <stop offset="100%" stopColor="#0A2A60" />
          </radialGradient>
          <radialGradient id="earth-atm" cx="50%" cy="50%" r="52%">
            <stop offset="80%" stopColor="transparent" />
            <stop offset="92%" stopColor="#4ABAFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4ABAFF" stopOpacity="0.5" />
          </radialGradient>
        </defs>
        <ellipse cx="250" cy="290" rx="260" ry="260" fill="url(#earth-grad)" />
        <ellipse cx="250" cy="290" rx="260" ry="260" fill="url(#earth-atm)" />
        <ellipse cx="200" cy="252" rx="40" ry="18" fill="#3A8830" fillOpacity="0.6" transform="rotate(-20 200 252)" />
        <ellipse cx="300" cy="265" rx="32" ry="14" fill="#3A8830" fillOpacity="0.5" />
        <ellipse cx="232" cy="278" rx="24" ry="9" fill="white" fillOpacity="0.14" transform="rotate(10 232 278)" />
        <ellipse cx="275" cy="246" rx="18" ry="7" fill="white" fillOpacity="0.1" />
      </svg>
    </div>
  );
}

function RocketSvg({
  model,
  scale = 1,
  glow = false,
}: {
  model: RocketModelId;
  scale?: number;
  glow?: boolean;
}) {
  const color = model === 'heavy' ? '#F59E0B' : model === 'scout' ? '#06D6A0' : '#94A3B8';
  const w = model === 'heavy' ? 56 : model === 'scout' ? 36 : 48;
  const h = 140;

  return (
    <svg
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      style={{ filter: glow ? `drop-shadow(0 0 14px ${color}99)` : undefined }}
    >
      <defs>
        <radialGradient id={`r-body-${model}`} cx="30%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#4a5068" />
          <stop offset="100%" stopColor="#1a1f2a" />
        </radialGradient>
        <radialGradient id={`r-flame-${model}`} cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#ffd04a" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#ff6b1a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      {model === 'standard' && (
        <>
          <path d={`M${w/2} 2 C${w/2} 2 ${w/2-9} 14 ${w/2-9} 26 L${w/2+9} 26 C${w/2+9} 14 ${w/2} 2 ${w/2} 2 Z`}
            fill={`url(#r-body-${model})`} stroke="#383838" strokeWidth="0.8" />
          <rect x={w/2-11} y="24" width="22" height="14" rx="2" fill={`url(#r-body-${model})`} stroke="#383838" strokeWidth="0.8" />
          <rect x={w/2-11} y="36" width="22" height="32" rx="2" fill={`url(#r-body-${model})`} stroke="#303030" strokeWidth="0.8" />
          <path d={`M${w/2-11} 68 L${w/2-16} 90 L${w/2-12} 88 L${w/2} 94 L${w/2+12} 88 L${w/2+16} 90 L${w/2+11} 68 Z`}
            fill={`url(#r-body-${model})`} stroke="#404040" strokeWidth="0.8" />
          <path d={`M${w/2-11} 55 L${w/2-22} 76 L${w/2-18} 77 L${w/2-11} 64 Z`} fill={`url(#r-body-${model})`} />
          <path d={`M${w/2+11} 55 L${w/2+22} 76 L${w/2+18} 77 L${w/2+11} 64 Z`} fill={`url(#r-body-${model})`} />
          <circle cx={w/2} cy="34" r="3.5" fill={color} fillOpacity="0.7" />
        </>
      )}

      {model === 'heavy' && (
        <>
          <path d={`M${w/2} 2 C${w/2} 2 ${w/2-11} 14 ${w/2-11} 28 L${w/2+11} 28 C${w/2+11} 14 ${w/2} 2 ${w/2} 2 Z`}
            fill={`url(#r-body-${model})`} stroke="#4a4a30" strokeWidth="1" />
          <rect x={w/2-14} y="26" width="28" height="18" rx="3" fill={`url(#r-body-${model})`} stroke="#4a4a30" strokeWidth="1" />
          <rect x={w/2-14} y="42" width="28" height="36" rx="3" fill={`url(#r-body-${model})`} stroke="#3a3a28" strokeWidth="1" />
          <path d={`M${w/2-14} 76 L${w/2-20} 100 L${w/2-14} 97 L${w/2} 104 L${w/2+14} 97 L${w/2+20} 100 L${w/2+14} 76 Z`}
            fill={`url(#r-body-${model})`} stroke="#4a4a30" strokeWidth="1" />
          <path d={`M${w/2-14} 60 L${w/2-26} 84 L${w/2-20} 86 L${w/2-14} 72 Z`} fill={`url(#r-body-${model})`} />
          <path d={`M${w/2+14} 60 L${w/2+26} 84 L${w/2+20} 86 L${w/2+14} 72 Z`} fill={`url(#r-body-${model})`} />
          <circle cx={w/2} cy="38" r="5" fill={color} fillOpacity="0.6" />
        </>
      )}

      {model === 'scout' && (
        <>
          <path d={`M${w/2} 2 C${w/2} 2 ${w/2-7} 12 ${w/2-7} 24 L${w/2+7} 24 C${w/2+7} 12 ${w/2} 2 ${w/2} 2 Z`}
            fill={`url(#r-body-${model})`} stroke="#1a4a44" strokeWidth="0.8" />
          <rect x={w/2-8} y="22" width="16" height="12" rx="2" fill={`url(#r-body-${model})`} stroke="#1a4a44" strokeWidth="0.8" />
          <rect x={w/2-8} y="32" width="16" height="26" rx="2" fill={`url(#r-body-${model})`} stroke="#1a3a35" strokeWidth="0.8" />
          <path d={`M${w/2-8} 56 L${w/2-12} 76 L${w/2-9} 74 L${w/2} 80 L${w/2+9} 74 L${w/2+12} 76 L${w/2+8} 56 Z`}
            fill={`url(#r-body-${model})`} stroke="#1a4a44" strokeWidth="0.8" />
          <path d={`M${w/2-8} 46 L${w/2-18} 64 L${w/2-13} 65 L${w/2-8} 56 Z`} fill={`url(#r-body-${model})`} />
          <path d={`M${w/2+8} 46 L${w/2+18} 64 L${w/2+13} 65 L${w/2+8} 56 Z`} fill={`url(#r-body-${model})`} />
          <circle cx={w/2} cy="30" r="3" fill={color} fillOpacity="0.8" />
        </>
      )}

      <path
        d={`M${w/2-10} ${h-45} Q${w/2-6} ${h-35} ${w/2-4} ${h-28} Q${w/2} ${h-20} ${w/2+4} ${h-28} Q${w/2+6} ${h-35} ${w/2+10} ${h-45} Z`}
        fill={`url(#r-flame-${model})`}
        style={{ animation: 'thrustPulse 0.22s ease-in-out infinite', transformOrigin: 'top center' }}
      />
      <ellipse cx={w/2} cy={h-22} rx="5" ry="2.5" fill={color} fillOpacity="0.3" style={{ filter: 'blur(3px)' }} />
    </svg>
  );
}

function CountdownOverlay({ count }: { count: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
      <div
        className="font-black leading-none mb-4"
        style={{
          fontSize: '22vw',
          color: 'white',
          fontFamily: 'monospace',
          textShadow: '0 0 80px rgba(255,255,255,0.35)',
          opacity: count > 0 ? 1 : 0,
          transition: 'opacity 0.12s',
          letterSpacing: '-0.05em',
        }}
      >
        {count > 0 ? count : 'GO'}
      </div>
      <div
        className="text-sm tracking-widest font-bold"
        style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}
      >
        {count > 0 ? 'T MINUS' : 'IGNITION SEQUENCE START'}
      </div>
    </div>
  );
}

function PowerMeter({ power }: { power: number }) {
  const label =
    power >= 80 ? 'FULL THRUST' :
    power >= 55 ? 'HIGH THRUST' :
    power >= 35 ? 'MID THRUST' :
    'LOW THRUST';

  const barColor =
    power >= 75 ? '#4ADE80' :
    power >= 50 ? '#FACC15' :
    power >= 30 ? '#F97316' :
    '#EF4444';

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 "
      style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
    >
      <span className="text-[10px] font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
        POWER
      </span>
      <div className="w-28 h-2  overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full  transition-all duration-1000"
          style={{
            width: `${power}%`,
            background: `linear-gradient(90deg, ${barColor}88 0%, ${barColor} 100%)`,
            boxShadow: `0 0 6px ${barColor}80`,
          }}
        />
      </div>
      <span className="text-[10px] font-bold tracking-widest" style={{ color: barColor, fontFamily: 'monospace' }}>
        {label}
      </span>
    </div>
  );
}

function LandingDustCloud({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute pointer-events-none" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute "
          style={{
            width: `${14 + i * 8}px`,
            height: `${8 + i * 4}px`,
            background: `rgba(200, 100, 60, ${0.18 - i * 0.014})`,
            bottom: `${i * 3}px`,
            left: `${-40 + (i % 2 === 0 ? -1 : 1) * (12 + i * 14)}px`,
            filter: 'blur(6px)',
            animation: `dustSpread ${0.6 + i * 0.1}s ease-out both`,
            animationDelay: `${i * 0.04}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function LaunchSequence(props: LaunchSequenceProps) {
  const { model, result, power, onDismiss } = props;
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [showResultCard, setShowResultCard] = useState(false);
  const [showLandingDust, setShowLandingDust] = useState(false);
  const [showLandedRocket, setShowLandedRocket] = useState(false);
  const [landingComplete, setLandingComplete] = useState(false);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const modelColor = model === 'heavy' ? '#F59E0B' : model === 'scout' ? '#06D6A0' : '#94A3B8';
  const clampedPower = Math.max(5, Math.min(100, power));
  const isFullPower = clampedPower >= 75;

  const marsDisplaySize = isFullPower ? 340 : clampedPower >= 50 ? 220 : clampedPower >= 25 ? 140 : 90;

  useEffect(() => {
    const cdInterval = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) { clearInterval(cdInterval); return 0; }
        return n - 1;
      });
    }, 700);

    phaseTimer.current = setTimeout(() => {
      setPhase('liftoff');
      setTimeout(() => {
        setPhase('atmosphere');
        setTimeout(() => {
          setPhase('space');
          setTimeout(() => {
            setPhase('mars');
            setTimeout(() => {
              setPhase('result');
              if (isFullPower) {
                setShowLandedRocket(true);
                setTimeout(() => {
                  setShowLandingDust(true);
                  setTimeout(() => setShowLandingDust(false), 2200);
                }, 2600);
                setTimeout(() => setLandingComplete(true), 3400);
              }
              setTimeout(() => setShowResultCard(true), 800);
            }, PHASE_DURATIONS.mars);
          }, PHASE_DURATIONS.space);
        }, PHASE_DURATIONS.atmosphere);
      }, PHASE_DURATIONS.liftoff);
    }, PHASE_DURATIONS.countdown);

    return () => {
      clearInterval(cdInterval);
      if (phaseTimer.current) clearTimeout(phaseTimer.current);
    };
  }, []);

  const bgGradient = () => {
    if (phase === 'countdown' || phase === 'liftoff') {
      return 'linear-gradient(to top, #FF8C42 0%, #FF4500 8%, #1A0A00 28%, #06080F 65%)';
    }
    if (phase === 'atmosphere') {
      return 'linear-gradient(to top, #0A1628 0%, #0D2040 18%, #06080F 60%)';
    }
    if (phase === 'mars') {
      return 'linear-gradient(160deg, #06080F 0%, #1A0500 60%, #06080F 100%)';
    }
    if (phase === 'result' && isFullPower) {
      return 'linear-gradient(160deg, #1A0800 0%, #2A0C00 40%, #1A0500 100%)';
    }
    return 'linear-gradient(to top, #06080F 0%, #06080F 100%)';
  };

  const phaseLabel = () => {
    if (phase === 'countdown') return 'LAUNCH SEQUENCE INITIATED';
    if (phase === 'liftoff') return 'MAIN ENGINE IGNITION';
    if (phase === 'atmosphere') return 'MAX Q — PASSING THROUGH ATMOSPHERE';
    if (phase === 'space') return 'STAGE SEPARATION — DEEP SPACE TRANSIT';
    if (phase === 'mars') return isFullPower ? 'MARS DESCENT INITIATED' : 'APPROACHING MARS SYSTEM';
    return isFullPower ? 'MARS LANDING SUCCESSFUL' : 'DEEP SPACE MISSION COMPLETE';
  };

  const rocketScale = (phase === 'space' || phase === 'mars' || phase === 'result') ? 0.65 : 1;

  const rocketBottom = () => {
    if (phase === 'countdown' || phase === 'liftoff') return '20%';
    if (phase === 'atmosphere') return '38%';
    if (phase === 'space') return '54%';
    if (phase === 'mars') {
      if (isFullPower) return '78%';
      if (clampedPower >= 50) return '66%';
      if (clampedPower >= 25) return '60%';
      return '56%';
    }
    if (phase === 'result') {
      if (isFullPower) return '80%';
      if (clampedPower >= 50) return '64%';
      if (clampedPower >= 25) return '58%';
      return '54%';
    }
    return '54%';
  };

  const rocketLeft = () => {
    if (phase === 'countdown' || phase === 'liftoff') return '50%';
    if (phase === 'atmosphere') return '50%';
    if (phase === 'space') return '50%';
    if (phase === 'mars') {
      if (isFullPower) return '28%';
      if (clampedPower >= 50) return '35%';
      return '50%';
    }
    if (phase === 'result') {
      if (isFullPower) return '28%';
      if (clampedPower >= 50) return '35%';
      return '50%';
    }
    return '50%';
  };

  const rocketRotate = () => {
    if (phase === 'mars') {
      if (isFullPower) return '-35deg';
      if (clampedPower >= 50) return '-20deg';
      return '0deg';
    }
    if (phase === 'result') {
      if (isFullPower) return '-35deg';
      if (clampedPower >= 50) return '-20deg';
      return '0deg';
    }
    return '0deg';
  };

  const rocketOpacity = () => {
    if (isFullPower && phase === 'result') return 0;
    return 1;
  };

  const marsTop = () => {
    if (phase === 'countdown') return '16%';
    if (phase === 'liftoff') return '15%';
    if (phase === 'atmosphere') return '14%';
    if (phase === 'space') return '12%';
    if (phase === 'mars' || phase === 'result') {
      if (isFullPower) return '-15%';
      if (clampedPower >= 50) return '0%';
      if (clampedPower >= 25) return '8%';
      return '12%';
    }
    return '12%';
  };

  const marsLeft = () => {
    if (phase === 'countdown') return '68%';
    if (phase === 'liftoff') return '70%';
    if (phase === 'atmosphere') return '72%';
    if (phase === 'space') return '74%';
    if (phase === 'mars' || phase === 'result') {
      if (isFullPower) return '58%';
      if (clampedPower >= 50) return '62%';
      if (clampedPower >= 25) return '65%';
      return '68%';
    }
    return '72%';
  };

  const marsSize = () => {
    if (phase === 'countdown') return 18;
    if (phase === 'liftoff') return 22;
    if (phase === 'atmosphere') return 30;
    if (phase === 'space') return 44;
    if (phase === 'mars' || phase === 'result') return marsDisplaySize;
    return 22;
  };

  const marsGlowIntensity = (phase === 'mars' || phase === 'result') ? clampedPower / 100 : 0.12;
  const showMars = true;

  const showRocket = true;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: bgGradient(), transition: 'background 1.8s ease' }}
    >
      <style>{`
        @keyframes twinkle {
          from { opacity: 0.15; }
          to   { opacity: 1; }
        }
        @keyframes thrustPulse {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50%       { transform: scaleY(1.5) scaleX(0.75); }
        }
        @keyframes streakFly {
          0%   { transform: translateX(0) scaleX(1); opacity: 0.5; }
          100% { transform: translateX(-130vw) scaleX(0.05); opacity: 0; }
        }
        @keyframes resultSlideUp {
          from { opacity: 0; transform: translateY(70px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nebulaFloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.07; }
          50%       { transform: translate(22px, -28px) scale(1.12); opacity: 0.13; }
        }
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(180px) rotate(720deg); opacity: 0; }
        }
        @keyframes marsOrbit {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes launchpadGround {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
        @keyframes engineFlicker {
          0%, 100% { opacity: 1; transform: scaleX(1); }
          33%       { opacity: 0.85; transform: scaleX(1.1); }
          66%       { opacity: 0.9; transform: scaleX(0.95); }
        }
        @keyframes dustSpread {
          0%   { transform: scaleX(0.2) scaleY(0.4); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: scaleX(1) scaleY(1); opacity: 0; }
        }
        @keyframes landedRocketBob {
          0%, 100% { transform: translateX(-50%) translateY(0px) rotate(0deg); }
          50%       { transform: translateX(-50%) translateY(-5px) rotate(0.4deg); }
        }
        @keyframes landingDescent {
          0%   { transform: translateX(-50%) translateY(-420px) rotate(-2deg); opacity: 0; }
          6%   { opacity: 1; }
          30%  { transform: translateX(-50%) translateY(-280px) rotate(-1deg); animation-timing-function: ease-in; }
          55%  { transform: translateX(-50%) translateY(-90px) rotate(0deg); animation-timing-function: cubic-bezier(0.0,0.0,0.2,1); }
          70%  { transform: translateX(-50%) translateY(-28px) rotate(0deg); animation-timing-function: cubic-bezier(0.34,1.56,0.64,1); }
          80%  { transform: translateX(-50%) translateY(10px) rotate(0deg); }
          87%  { transform: translateX(-50%) translateY(-6px) rotate(0deg); }
          92%  { transform: translateX(-50%) translateY(3px) rotate(0deg); }
          96%  { transform: translateX(-50%) translateY(-2px) rotate(0deg); }
          100% { transform: translateX(-50%) translateY(0px) rotate(0deg); }
        }
        @keyframes thrusterFire {
          0%, 100% { opacity: 1; transform: translateX(-50%) scaleY(1) scaleX(1); }
          30%       { opacity: 0.8; transform: translateX(-50%) scaleY(1.8) scaleX(0.65); }
          60%       { opacity: 0.95; transform: translateX(-50%) scaleY(0.9) scaleX(1.2); }
        }
        @keyframes thrusterFadeOut {
          0%   { opacity: 1; transform: translateX(-50%) scaleY(1.2) scaleX(0.8); }
          100% { opacity: 0; transform: translateX(-50%) scaleY(0.1) scaleX(0.4); }
        }
        @keyframes thrusterHalo {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.45; }
          50%       { transform: translateX(-50%) scale(1.35); opacity: 0.22; }
        }
        @keyframes marsGlowPulse {
          0%, 100% { filter: drop-shadow(0 0 60px rgba(232,96,76,0.5)); }
          50%       { filter: drop-shadow(0 0 100px rgba(232,96,76,0.8)); }
        }
      `}</style>

      {(phase === 'space' || phase === 'mars' || phase === 'result') && <Stars count={240} />}

      {(phase === 'atmosphere' || phase === 'space') && (
        <>
          <div className="absolute w-80 h-80 "
            style={{
              background: 'radial-gradient(circle, rgba(80,140,255,0.1) 0%, transparent 70%)',
              top: '8%', left: '3%',
              animation: 'nebulaFloat 14s ease-in-out infinite',
            }}
          />
          <div className="absolute w-56 h-56 "
            style={{
              background: 'radial-gradient(circle, rgba(60,200,160,0.06) 0%, transparent 70%)',
              top: '45%', right: '6%',
              animation: 'nebulaFloat 20s ease-in-out infinite reverse',
            }}
          />
        </>
      )}

      {(phase === 'space' || phase === 'mars' || phase === 'result') && (
        <>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute h-px"
              style={{
                width: `${50 + i * 22}px`,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.7), transparent)',
                top: `${8 + i * 9}%`,
                right: `${-90 - i * 18}px`,
                animation: `streakFly ${1.0 + i * 0.25}s linear ${i * 0.18}s infinite`,
              }}
            />
          ))}
        </>
      )}

      {(phase === 'countdown' || phase === 'liftoff') && (
        <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 h-20"
            style={{ background: '#1a0d00', animation: 'launchpadGround 2s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-3 "
            style={{ background: '#2a1800', border: '1px solid #3a2200' }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-28"
            style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(255,100,20,0.55) 0%, transparent 72%)' }}
          />
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 "
              style={{
                width: `${6 + i * 5}px`,
                height: `${6 + i * 5}px`,
                background: i % 2 === 0 ? '#FF8C42' : '#FFCC44',
                opacity: 0.35 + Math.random() * 0.3,
                left: `${12 + i * 11}%`,
                transform: 'translateX(-50%)',
                filter: 'blur(5px)',
                animation: `engineFlicker ${0.2 + i * 0.08}s ease-in-out ${i * 0.04}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {(phase === 'liftoff' || phase === 'atmosphere') && <EarthBackground />}

      {showMars && (
        <div
          className="absolute"
          style={{
            top: marsTop(),
            left: marsLeft(),
            transition: 'top 2.8s cubic-bezier(0.25,0.46,0.45,0.94), left 2.8s cubic-bezier(0.25,0.46,0.45,0.94)',
            animation: phase === 'space' ? 'marsOrbit 6s ease-in-out infinite' : undefined,
          }}
        >
          <div
            style={{
              width: marsSize(),
              height: marsSize(),
              transition: 'width 2.8s cubic-bezier(0.25,0.46,0.45,0.94), height 2.8s cubic-bezier(0.25,0.46,0.45,0.94)',
              animation: phase === 'result' && isFullPower ? 'marsGlowPulse 3s ease-in-out infinite' : undefined,
            }}
          >
            <MarsBody size={marsSize()} glowIntensity={marsGlowIntensity} />
          </div>

          {(phase === 'result' && isFullPower) && (
            <LandingDustCloud visible={showLandingDust} />
          )}

          {(phase === 'mars' || phase === 'result') && (
            <div
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.2em] whitespace-nowrap"
              style={{ color: '#E8604C', opacity: 0.65, fontFamily: 'monospace' }}
            >
              MARS
            </div>
          )}
        </div>
      )}

      {showRocket && (
        <div
          className="absolute"
          style={{
            left: rocketLeft(),
            bottom: rocketBottom(),
            transform: `translateX(-50%) rotate(${rocketRotate()})`,
            opacity: rocketOpacity(),
            transition: 'bottom 2.8s cubic-bezier(0.25,0.46,0.45,0.94), left 2.8s cubic-bezier(0.25,0.46,0.45,0.94), transform 2s ease, opacity 0.6s ease',
          }}
        >
          <RocketSvg model={model} scale={rocketScale} glow={phase !== 'countdown'} />
        </div>
      )}

      {isFullPower && phase === 'result' && (
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ pointerEvents: 'none' }}
        >
          <svg width="100%" height="130" viewBox="0 0 800 130" preserveAspectRatio="none" fill="none">
            <defs>
              <radialGradient id="mars-ground-grad" cx="62%" cy="0%" r="80%">
                <stop offset="0%" stopColor="#8B2500" />
                <stop offset="60%" stopColor="#5A1200" />
                <stop offset="100%" stopColor="#2A0800" />
              </radialGradient>
            </defs>
            <ellipse cx="496" cy="130" rx="520" ry="95" fill="url(#mars-ground-grad)" />
            <ellipse cx="340" cy="118" rx="70" ry="15" fill="#6B2010" fillOpacity="0.4" transform="rotate(-3 340 118)" />
            <ellipse cx="620" cy="122" rx="55" ry="12" fill="#6B2010" fillOpacity="0.35" transform="rotate(2 620 122)" />
            <ellipse cx="496" cy="130" rx="520" ry="95" fill="#E8604C" fillOpacity="0.05" />
          </svg>
        </div>
      )}

      {showLandedRocket && (
        <div
          className="absolute"
          style={{
            left: '62%',
            bottom: '9%',
            animation: landingComplete
              ? 'landedRocketBob 4s ease-in-out infinite'
              : 'landingDescent 3.2s ease-out forwards',
            transformOrigin: 'bottom center',
          }}
        >
          {!landingComplete && (
            <>
              <div
                className="absolute bottom-0"
                style={{
                  left: '50%',
                  width: 54,
                  height: 54,
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(255,160,40,0.55) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(8px)',
                  animation: 'thrusterHalo 0.18s ease-in-out infinite',
                  transform: 'translateX(-50%) translateY(60%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                className="absolute bottom-0"
                style={{
                  left: '50%',
                  width: 18,
                  height: 50,
                  transform: 'translateX(-50%) translateY(100%) scaleY(-1)',
                  background: 'radial-gradient(ellipse at 50% 0%, #FFF5AA 0%, #FFBB33 30%, #FF5500 75%, transparent 100%)',
                  borderRadius: '40% 40% 50% 50%',
                  filter: 'blur(2px)',
                  animation: 'thrusterFire 0.12s ease-in-out infinite',
                  opacity: 0.95,
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
          <RocketSvg model={model} scale={0.65} glow />
          <LandingDustCloud visible={showLandingDust} />
        </div>
      )}

      {phase === 'countdown' && <CountdownOverlay count={countdown} />}

      <div
        className="absolute top-6 left-0 right-0 flex flex-col items-center gap-2.5 px-4"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="px-4 py-1.5  text-xs font-bold tracking-widest"
          style={{
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'monospace',
            backdropFilter: 'blur(10px)',
          }}
        >
          {phaseLabel()}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          {PHASES.filter((p) => p !== 'result').map((p) => (
            <div
              key={p}
              className=" transition-all duration-500"
              style={{
                width: phase === p ? '22px' : '6px',
                height: '6px',
                background: phase === p ? modelColor : 'rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </div>

        {(phase === 'space' || phase === 'mars') && (
          <PowerMeter power={clampedPower} />
        )}
      </div>

      {phase === 'space' && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="px-5 py-2  text-xs font-bold tracking-wider"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'monospace',
              backdropFilter: 'blur(8px)',
            }}
          >
            {clampedPower >= 75
              ? 'FULL THRUST — MARS LANDING TRAJECTORY LOCKED'
              : clampedPower >= 50
              ? 'HIGH THRUST — MARS ORBIT POSSIBLE'
              : clampedPower >= 25
              ? 'PARTIAL THRUST — MARS FLYBY'
              : 'LOW THRUST — DEEP ORBIT ONLY'}
          </div>
        </div>
      )}

      {showResultCard && result && (
        <div
          className="absolute inset-0 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="relative  p-8 max-w-sm w-full text-center overflow-hidden"
            style={{
              background: '#0C1018',
              border: `1px solid ${modelColor}44`,
              boxShadow: `0 0 80px ${modelColor}1a`,
              animation: 'resultSlideUp 0.65s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(22)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 "
                  style={{
                    left: `${3 + i * 4.4}%`,
                    top: '-8px',
                    background: ['#F97316', '#FACC15', '#4ADE80', modelColor][i % 4],
                    animation: `confetti-fall ${0.6 + Math.random() * 0.9}s ease-in ${i * 0.045}s both`,
                  }}
                />
              ))}
            </div>

            <div
              className="w-16 h-16  flex items-center justify-center mx-auto mb-4"
              style={{ background: `${modelColor}18`, border: `1px solid ${modelColor}44` }}
            >
              <FlaskConical size={28} style={{ color: modelColor }} />
            </div>

            <p className="font-mono text-[11px] font-bold mb-1 tracking-widest" style={{ color: '#4A5468' }}>
              {isFullPower ? 'LOCAL SIMULATION COMPLETE' : 'COMPATIBILITY SIMULATION COMPLETE'}
            </p>
            <p className="font-data font-black text-5xl mb-1" style={{ color: '#E8ECF4' }}>
              +{result.score}
              <span className="text-2xl ml-2" style={{ color: '#4A5468' }}>GS</span>
            </p>
            <p className="text-sm mb-1" style={{ color: '#4A5468' }}>{result.multiplier}× local Grav Score multiplier</p>

            <div
              className="inline-flex items-center gap-1.5  px-3 py-1 mb-4 text-xs font-bold"
              style={{ background: `${modelColor}12`, border: `1px solid ${modelColor}30`, color: modelColor }}
            >
              <div className="w-1.5 h-1.5 " style={{ background: modelColor }} />
              {clampedPower}% simulated thrust
            </div>

            <div className=" p-3 mb-6" style={{ background: '#06080F', border: '1px solid #1E2636' }}>
              <p className="text-xs mb-1" style={{ color: '#4A5468' }}>Simulation Event</p>
              <p className="font-mono font-bold text-sm" style={{ color: '#E8ECF4' }}>{result.bonus}</p>
            </div>

            <button
              onClick={onDismiss}
              className="w-full py-3.5  font-mono font-bold text-sm transition-all active:scale-95"
              style={{
                background: modelColor,
                color: '#06080F',
                boxShadow: `0 0 28px ${modelColor}44`,
                letterSpacing: '0.06em',
              }}
            >
              Close Local Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
