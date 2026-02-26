import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Trophy, TrendingUp, TrendingDown, Minus, RefreshCw, Users, Flame, Award } from 'lucide-react';
import { supabase, type LeaderboardEntry } from '../lib/supabase';

interface LeaderboardPageProps {
  onBack: () => void;
}

const RANK_TIERS: Record<number, { label: string; color: string; border: string; bg: string }> = {
  1: { label: '1ST', color: '#f59e0b', border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.06)' },
  2: { label: '2ND', color: '#94a3b8', border: 'rgba(148,163,184,0.3)', bg: 'rgba(148,163,184,0.05)' },
  3: { label: '3RD', color: '#cd7c2f', border: 'rgba(205,124,47,0.3)', bg: 'rgba(205,124,47,0.05)' },
};

function RankBadge({ rank }: { rank: number }) {
  const tier = RANK_TIERS[rank];
  if (tier) {
    return (
      <div
        className="w-9 h-9 flex items-center justify-center text-xs font-mono font-black flex-shrink-0"
        style={{ background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color }}
      >
        {tier.label}
      </div>
    );
  }
  return (
    <div className="w-9 h-9 bg-zinc-900 border border-border-default flex items-center justify-center flex-shrink-0">
      <span className="font-mono font-black text-sm text-zinc-400">{rank}</span>
    </div>
  );
}

function MovementArrow({ current, prev }: { current: number; prev: number }) {
  const delta = prev - current;
  if (delta === 0 || prev === 0) {
    return (
      <div className="flex items-center gap-0.5 w-10">
        <Minus size={12} className="text-zinc-700" />
      </div>
    );
  }
  const up = delta > 0;
  return (
    <div className={`flex items-center gap-0.5 w-10 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      <span className="text-[11px] font-mono font-bold">{Math.abs(delta)}</span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border-subtle">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-zinc-900 animate-pulse" style={{ width: `${40 + Math.random() * 50}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function LeaderboardPage({ onBack }: LeaderboardPageProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLeaderboard = async (showRefreshing = false) => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    if (showRefreshing) setRefreshing(true);
    const { data } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('season', 1)
      .order('rank', { ascending: true })
      .limit(20);

    if (data) {
      setEntries(data as LeaderboardEntry[]);
      setLastUpdated(new Date());
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const totals = entries.reduce(
    (acc, e) => ({
      rockets: acc.rockets + e.rockets_launched,
      burned: acc.burned + Number(e.et_burned),
      eth: acc.eth + Number(e.eth_earned),
    }),
    { rockets: 0, burned: 0, eth: 0 }
  );

  const ethPrizePool = (totals.eth * 0.5).toFixed(3);

  return (
    <div className="min-h-screen bg-bg-base relative overflow-hidden">

      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-base/95 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 bg-zinc-900 border border-border-default group-hover:border-border-strong flex items-center justify-center transition-all">
                  <ArrowLeft size={15} className="text-zinc-400 group-hover:text-white" />
                </div>
                <span className="text-sm font-mono font-medium hidden sm:inline uppercase tracking-wider">Back</span>
              </button>
              <div className="h-5 w-px bg-border-default" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-dot-green flex items-center justify-center">
                  <Trophy size={15} className="text-black" />
                </div>
                <div>
                  <span className="font-mono font-bold text-white text-base leading-none uppercase tracking-wider">Cosmic Jackpot</span>
                  <div className="text-[10px] font-mono font-medium text-zinc-500 leading-none mt-0.5 uppercase tracking-wider">Season 1 · Rankings</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-border-subtle px-3 py-2">
                <div className="glow-dot" />
                <span className="text-xs font-mono font-semibold text-zinc-300 uppercase">Live</span>
              </div>
              <button className="btn-primary text-sm py-2.5 px-5">
                <Zap size={13} />
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-10">
            <div className="flex justify-center mb-3">
              <span className="tag">
                <Trophy size={11} />
                Season 1
              </span>
            </div>
            <h1 className="font-mono font-black text-3xl md:text-5xl lg:text-6xl text-white mb-3 leading-[1.08] uppercase tracking-wider">
              Cosmic Jackpot
            </h1>
            <p className="text-zinc-400 text-lg font-mono">
              Compete by Grav Score. Win real ETH daily.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: <Trophy size={14} className="text-amber-400" />, label: 'Daily ETH Prize', value: loading ? '…' : `${ethPrizePool} ETH`, sub: '50% of locked pool' },
              { icon: <Users size={14} className="text-blue-400" />, label: 'Players', value: entries.length.toString(), sub: 'Season 1 active' },
              { icon: <Zap size={14} className="text-dot-green" />, label: 'Missions Launched', value: loading ? '…' : totals.rockets.toLocaleString(), sub: 'Total Quantum Lift-Offs' },
              { icon: <Flame size={14} className="text-orange-400" />, label: 'Flux Burned', value: loading ? '…' : `${(totals.burned / 1000).toFixed(1)}k`, sub: 'Fuel consumed' },
            ].map((stat) => (
              <div key={stat.label} className="bg-bg-card border border-border-subtle p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-zinc-900 border border-border-default flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="font-mono font-black text-white text-xl">{stat.value}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-bg-card border border-border-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award size={16} className="text-zinc-400" />
                <span className="font-mono font-bold text-white text-sm uppercase tracking-wider">Season Rankings</span>
                <span className="tag text-[11px]">Grav Score · Top 20</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600 font-mono hidden sm:block">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => fetchLeaderboard(true)}
                  disabled={refreshing}
                  className="w-8 h-8 bg-zinc-900 border border-border-default flex items-center justify-center hover:border-border-strong transition-all active:scale-90"
                >
                  <RefreshCw
                    size={13}
                    className={`text-zinc-400 ${refreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {[
                      { label: 'Rank', w: 'w-20' },
                      { label: 'Move', w: 'w-16' },
                      { label: 'Wallet Address', w: '' },
                      { label: 'Missions', w: 'text-right' },
                      { label: 'Flux Burned', w: 'text-right' },
                      { label: 'ETH Earned', w: 'text-right' },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className={`px-4 py-3 text-left text-[11px] font-mono font-semibold text-zinc-600 uppercase tracking-widest ${col.w}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
                  ) : (
                    entries.map((entry) => {
                      const tier = RANK_TIERS[entry.rank];
                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-border-subtle last:border-0 transition-colors duration-200 hover:bg-zinc-900/40"
                          style={{
                            background: tier ? tier.bg : undefined,
                            boxShadow: tier ? `inset 0 0 0 1px ${tier.border}` : undefined,
                          }}
                        >
                          <td className="px-4 py-3.5">
                            <RankBadge rank={entry.rank} />
                          </td>
                          <td className="px-4 py-3.5">
                            <MovementArrow current={entry.rank} prev={entry.prev_rank} />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-[11px] font-mono font-black"
                                style={tier
                                  ? { background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color }
                                  : { background: '#141414', border: '1px solid #252525', color: '#606060' }
                                }
                              >
                                {entry.wallet_address.slice(0, 2).toUpperCase()}
                              </div>
                              <span
                                className="font-mono text-sm"
                                style={{ color: tier ? tier.color : '#a1a1aa' }}
                              >
                                {entry.wallet_address}
                              </span>
                              {tier && (
                                <span
                                  className="text-[10px] font-mono font-bold px-1.5 py-0.5"
                                  style={{ color: tier.color, background: tier.bg, border: `1px solid ${tier.border}` }}
                                >
                                  {tier.label}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-mono font-bold text-white text-sm">
                                {entry.rockets_launched.toLocaleString()}
                              </span>
                              <Zap size={11} className="text-zinc-600" />
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-mono font-bold text-white text-sm">
                                {Number(entry.et_burned).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                              <span className="text-[11px] text-zinc-600 font-mono">FLUX</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span
                              className="font-mono font-bold text-sm"
                              style={tier ? { color: tier.color } : { color: '#d4d4d8' }}
                            >
                              {Number(entry.eth_earned).toFixed(4)} ETH
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-border-subtle bg-bg-surface flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-zinc-600 font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2" style={{ background: '#f59e0b' }} />
                  Gold — 1st
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2" style={{ background: '#94a3b8' }} />
                  Silver — 2nd
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2" style={{ background: '#cd7c2f' }} />
                  Bronze — 3rd
                </div>
              </div>
              <span className="text-xs text-zinc-600 font-mono">Ranked by cumulative Grav Score</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { place: '1ST PLACE', prize: 'ETH + Quantum NFT', rank: '1ST', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)' },
              { place: '2ND PLACE', prize: 'ETH + Celestial NFT', rank: '2ND', color: '#94a3b8', bg: 'rgba(148,163,184,0.05)', border: 'rgba(148,163,184,0.2)' },
              { place: '3RD PLACE', prize: 'ETH + Mythic NFT', rank: '3RD', color: '#cd7c2f', bg: 'rgba(205,124,47,0.05)', border: 'rgba(205,124,47,0.2)' },
            ].map((p) => (
              <div
                key={p.place}
                className="p-5 flex items-center gap-4"
                style={{ background: p.bg, border: `1px solid ${p.border}` }}
              >
                <span className="text-2xl font-mono font-black" style={{ color: p.color }}>{p.rank}</span>
                <div>
                  <p className="text-xs text-zinc-500 font-mono mb-0.5 uppercase tracking-wider">{p.place} Prize</p>
                  <p className="font-mono font-black text-xl leading-tight uppercase tracking-wider" style={{ color: p.color }}>{p.prize}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
