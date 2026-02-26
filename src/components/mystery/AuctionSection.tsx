import { useState, useEffect } from 'react';
import { Clock, TrendingUp, ChevronUp, Zap, Trophy, Users } from 'lucide-react';

interface AuctionItem {
  id: string;
  name: string;
  category: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  currentBid: number;
  minIncrement: number;
  bidCount: number;
  topBidder: string;
  endsAt: number;
  description: string;
  svgColor: string;
  svgAccent: string;
}

const now = Date.now();

const AUCTION_ITEMS: AuctionItem[] = [
  {
    id: 'quantum-engine',
    name: 'Quantum Engine Mk.II',
    category: 'Propulsion',
    rarity: 'Legendary',
    currentBid: 2400,
    minIncrement: 50,
    bidCount: 24,
    topBidder: '0x1a2b…9f8e',
    endsAt: now + 1 * 60 * 60 * 1000 + 23 * 60 * 1000,
    description: 'Generates 3× thrust with 40% less Flux consumption. Max efficiency at altitude.',
    svgColor: '#1A1A1A',
    svgAccent: '#FFFFFF',
  },
  {
    id: 'titanium-nose',
    name: 'Titanium Nose Cone',
    category: 'Aerodynamics',
    rarity: 'Epic',
    currentBid: 890,
    minIncrement: 20,
    bidCount: 11,
    topBidder: '0x7c3d…2a1b',
    endsAt: now + 3 * 60 * 60 * 1000 + 45 * 60 * 1000,
    description: 'Reduces drag by 62%. Essential for high-orbit launch configurations.',
    svgColor: '#141414',
    svgAccent: '#C0C8D4',
  },
  {
    id: 'plasma-thruster',
    name: 'Plasma Thruster Array',
    category: 'Propulsion',
    rarity: 'Legendary',
    currentBid: 4100,
    minIncrement: 100,
    bidCount: 38,
    topBidder: '0x9e0f…5b4c',
    endsAt: now + 12 * 60 * 1000 + 33 * 1000,
    description: 'Four-nozzle array. Used only on orbital-class rockets. Extremely rare drop.',
    svgColor: '#1E1A14',
    svgAccent: '#F0E8C0',
  },
  {
    id: 'carbon-hull',
    name: 'Carbon Fiber Hull',
    category: 'Structure',
    rarity: 'Rare',
    currentBid: 320,
    minIncrement: 10,
    bidCount: 7,
    topBidder: '0x4f5a…6c7d',
    endsAt: now + 6 * 60 * 60 * 1000 + 2 * 60 * 1000,
    description: 'Lightweight hull with 8× standard structural strength. Compatible with all tiers.',
    svgColor: '#181818',
    svgAccent: '#909090',
  },
];

const RARITY_STYLE: Record<string, { color: string; bg: string }> = {
  Common:    { color: '#909090', bg: 'rgba(144,144,144,0.1)' },
  Rare:      { color: '#C0C8D4', bg: 'rgba(192,200,212,0.1)' },
  Epic:      { color: '#D4C0F0', bg: 'rgba(180,160,220,0.1)' },
  Legendary: { color: '#F0E8C0', bg: 'rgba(240,232,192,0.1)' },
};

function RocketPartSVG({ item }: { item: AuctionItem }) {
  const { svgColor, svgAccent, category } = item;

  if (category === 'Propulsion') {
    return (
      <svg viewBox="0 0 80 80" className="w-full h-full">
        <rect x="10" y="10" width="60" height="60" rx="16" fill={svgColor} stroke={svgAccent} strokeWidth="1" strokeOpacity="0.3" />
        <ellipse cx="40" cy="30" rx="12" ry="16" fill={svgAccent} fillOpacity="0.15" stroke={svgAccent} strokeWidth="1" strokeOpacity="0.4" />
        <rect x="28" y="46" width="24" height="14" rx="4" fill={svgAccent} fillOpacity="0.1" stroke={svgAccent} strokeWidth="0.8" strokeOpacity="0.3" />
        <ellipse cx="40" cy="60" rx="14" ry="5" fill={svgAccent} fillOpacity="0.25" />
        <ellipse cx="40" cy="62" rx="8" ry="4" fill={svgAccent} fillOpacity="0.4" />
        <circle cx="40" cy="30" r="5" fill={svgAccent} fillOpacity="0.5" />
        <line x1="20" y1="54" x2="26" y2="60" stroke={svgAccent} strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
        <line x1="60" y1="54" x2="54" y2="60" stroke={svgAccent} strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (category === 'Aerodynamics') {
    return (
      <svg viewBox="0 0 80 80" className="w-full h-full">
        <rect x="10" y="10" width="60" height="60" rx="16" fill={svgColor} stroke={svgAccent} strokeWidth="1" strokeOpacity="0.3" />
        <path d="M40 15 L52 55 L40 50 L28 55 Z" fill={svgAccent} fillOpacity="0.2" stroke={svgAccent} strokeWidth="1" strokeOpacity="0.5" />
        <path d="M40 22 L48 50 L40 46 L32 50 Z" fill={svgAccent} fillOpacity="0.15" />
        <line x1="40" y1="15" x2="40" y2="55" stroke={svgAccent} strokeWidth="1" strokeOpacity="0.3" />
        <ellipse cx="40" cy="55" rx="12" ry="4" fill={svgAccent} fillOpacity="0.15" />
      </svg>
    );
  }
  if (category === 'Structure') {
    return (
      <svg viewBox="0 0 80 80" className="w-full h-full">
        <rect x="10" y="10" width="60" height="60" rx="16" fill={svgColor} stroke={svgAccent} strokeWidth="1" strokeOpacity="0.3" />
        <rect x="28" y="22" width="24" height="36" rx="6" fill={svgAccent} fillOpacity="0.12" stroke={svgAccent} strokeWidth="1" strokeOpacity="0.4" />
        {[28,34,40,46].map((y) => (
          <line key={y} x1="32" y1={y} x2="48" y2={y} stroke={svgAccent} strokeWidth="0.8" strokeOpacity="0.25" />
        ))}
        <rect x="22" y="32" width="8" height="16" rx="3" fill={svgAccent} fillOpacity="0.1" stroke={svgAccent} strokeWidth="0.8" strokeOpacity="0.3" />
        <rect x="50" y="32" width="8" height="16" rx="3" fill={svgAccent} fillOpacity="0.1" stroke={svgAccent} strokeWidth="0.8" strokeOpacity="0.3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="10" y="10" width="60" height="60" rx="16" fill={svgColor} stroke={svgAccent} strokeWidth="1" strokeOpacity="0.3" />
      <circle cx="40" cy="40" r="18" fill={svgAccent} fillOpacity="0.1" stroke={svgAccent} strokeWidth="1" strokeOpacity="0.4" />
      <circle cx="40" cy="40" r="10" fill={svgAccent} fillOpacity="0.2" />
      <circle cx="40" cy="40" r="4" fill={svgAccent} fillOpacity="0.6" />
    </svg>
  );
}

function useCountdown(endsAt: number) {
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, endsAt - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining < 15 * 60 * 1000;
  const isDone = remaining === 0;

  return {
    display: isDone ? 'Ended' : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
    isUrgent,
    isDone,
  };
}

function AuctionCard({ item }: { item: AuctionItem }) {
  const [bidAmount, setBidAmount] = useState('');
  const [bidState, setBidState] = useState<'idle' | 'placing' | 'placed'>('idle');
  const [currentBid, setCurrentBid] = useState(item.currentBid);
  const { display, isUrgent, isDone } = useCountdown(item.endsAt);
  const rarity = RARITY_STYLE[item.rarity];
  const minBid = currentBid + item.minIncrement;

  const handleBid = () => {
    const amount = parseFloat(bidAmount);
    if (!amount || amount < minBid) return;
    setBidState('placing');
    setTimeout(() => {
      setCurrentBid(amount);
      setBidState('placed');
      setBidAmount('');
      setTimeout(() => setBidState('idle'), 2500);
    }, 900);
  };

  return (
    <div className={`relative rounded-3xl bg-bg-card border overflow-hidden shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover ${
      isUrgent && !isDone ? 'border-zinc-500' : 'border-border-subtle'
    }`}>
      {isUrgent && !isDone && (
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'shimmer 2s linear infinite' }} />
      )}

      <div className="p-5">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-border-default flex-shrink-0 overflow-hidden p-1">
            <RocketPartSVG item={item} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-poppins font-bold text-white text-base leading-tight">{item.name}</h3>
              <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{ color: rarity.color, background: rarity.bg, borderColor: `${rarity.color}40` }}>
                {item.rarity}
              </span>
            </div>
            <p className="text-xs text-zinc-600 mb-2">{item.category} · {item.description.slice(0, 52)}…</p>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Users size={11} className="text-zinc-600" />
                <span className="text-xs text-zinc-500">{item.bidCount} bids</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={11} className="text-zinc-600" />
                <span className="text-xs text-zinc-500">{item.topBidder}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 border border-border-subtle rounded-2xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Current Bid</p>
            <div className="flex items-center gap-1.5">
              <ChevronUp size={14} className="text-dot-green flex-shrink-0" />
              <p className="font-poppins font-black text-white text-lg leading-none">{currentBid.toLocaleString()}</p>
              <span className="text-xs text-zinc-500 font-medium">ET</span>
            </div>
          </div>
          <div className={`border rounded-2xl p-3 ${isUrgent && !isDone ? 'bg-zinc-800/80 border-zinc-600' : 'bg-zinc-900 border-border-subtle'}`}>
            <p className="text-xs text-zinc-500 mb-1">Time Left</p>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className={isUrgent && !isDone ? 'text-zinc-300 animate-pulse' : 'text-zinc-600'} />
              <p className={`font-poppins font-bold text-base leading-none tabular-nums ${
                isDone ? 'text-zinc-600' : isUrgent ? 'text-white' : 'text-zinc-200'
              }`}>{display}</p>
            </div>
          </div>
        </div>

        {!isDone && (
          <div className="mt-3 flex gap-2">
            <div className="flex-1 bg-zinc-900 border border-border-default rounded-2xl px-3 py-2.5 flex items-center gap-2 focus-within:border-border-strong transition-colors">
              <Zap size={12} className="text-zinc-600 flex-shrink-0" />
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Min ${minBid}`}
                className="flex-1 bg-transparent text-white text-sm font-poppins font-semibold placeholder:text-zinc-700 focus:outline-none min-w-0"
              />
              <span className="text-xs text-zinc-600 flex-shrink-0">ET</span>
            </div>

            <button
              onClick={handleBid}
              disabled={bidState !== 'idle' || !bidAmount || parseFloat(bidAmount) < minBid}
              className="px-5 rounded-2xl font-poppins font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 relative overflow-hidden"
              style={{
                background: bidState === 'placed'
                  ? 'rgba(74,222,128,0.15)'
                  : bidAmount && parseFloat(bidAmount) >= minBid && bidState === 'idle'
                  ? 'linear-gradient(135deg, #ffffff, #e0e0e0)'
                  : '#1c1c1c',
                color: bidState === 'placed'
                  ? '#4ADE80'
                  : bidAmount && parseFloat(bidAmount) >= minBid && bidState === 'idle'
                  ? '#000'
                  : '#555',
                border: bidState === 'placed' ? '1px solid rgba(74,222,128,0.3)' : '1px solid transparent',
                boxShadow: bidAmount && parseFloat(bidAmount) >= minBid && bidState === 'idle'
                  ? '0 0 20px rgba(255,255,255,0.12)'
                  : 'none',
              }}
            >
              {bidState === 'placing' ? (
                <span className="animate-pulse">…</span>
              ) : bidState === 'placed' ? (
                'Bid ✓'
              ) : (
                'Bid'
              )}
            </button>
          </div>
        )}

        {isDone && (
          <div className="mt-3 text-center py-2.5 rounded-2xl border border-border-subtle">
            <p className="text-sm text-zinc-600 font-medium">Auction ended · Winner: {item.topBidder}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuctionSection() {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="tag mb-2 inline-flex">Nebula Bids · Live Auctions</span>
          <h2 className="section-title">Bid on Rare NFT Parts</h2>
          <p className="text-zinc-500 text-sm mt-2 max-w-sm">
            Rare-and-above rocket parts up for grabs every 4 hours. Bid Flux — outbid by 5% or lose your spot.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <div className="glow-dot" />
            <span>{AUCTION_ITEMS.length} active auctions</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-border-default rounded-2xl px-3 py-2">
            <Trophy size={13} className="text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-300">Season 1</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {AUCTION_ITEMS.map((item) => (
          <AuctionCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
