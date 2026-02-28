import { useEffect, useState } from 'react';
import { Zap, Trophy, TrendingUp, TrendingDown, Minus, RefreshCw, Users, Flame, Award } from 'lucide-react';
import { supabase, type LeaderboardEntry } from '../lib/supabase';

type DataMode = 'snapshot' | 'legacy' | 'unavailable';

interface DisplayEntry {
  id: string;
  walletAddress: string;
  metricValue: number;
  fluxBurned: number;
  ethValue: number;
  rank: number;
  prevRank: number;
}

interface ViewSummary {
  prizeEth: number;
  players: number;
  metricTotal: number;
  fluxBurned: number;
  playerSubtext: string;
}

interface SnapshotEntry {
  id: string;
  walletAddress: string;
  activityEvents: number;
  fluxBurned: number;
  ethLocked: number;
  cumulativeGravScore: number;
  launchCount: number;
  rank: number;
  prevRank: number;
}

interface SnapshotPayload {
  generatedAt: Date | null;
  summary: {
    dailyEthPrize: number;
    activePlayers: number;
    knownWallets: number;
    activityEvents: number;
    fluxBurned: number;
    totalGravScore: number;
    totalLaunches: number;
  };
  entries: SnapshotEntry[];
}

const HEARTBEAT_CHANNEL = 'cosmic-jackpot-live';
const HEARTBEAT_TABLE = 'cosmic_jackpot_updates';
const REFRESH_INTERVAL_MS = 20000;

const RANK_TIERS: Record<number, { label: string; color: string; border: string; bg: string }> = {
  1: { label: '1ST', color: '#f59e0b', border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.06)' },
  2: { label: '2ND', color: '#94a3b8', border: 'rgba(148,163,184,0.3)', bg: 'rgba(148,163,184,0.05)' },
  3: { label: '3RD', color: '#cd7c2f', border: 'rgba(205,124,47,0.3)', bg: 'rgba(205,124,47,0.05)' },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function asDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseSnapshotPayload(value: unknown): SnapshotPayload | null {
  if (!isRecord(value) || !isRecord(value.summary) || !Array.isArray(value.entries)) {
    return null;
  }

  const dailyEthPrize = asFiniteNumber(value.summary.daily_eth_prize);
  const activePlayers = asFiniteNumber(value.summary.active_players);
  const knownWallets = asFiniteNumber(value.summary.known_wallets);
  const activityEvents = asFiniteNumber(value.summary.activity_events);
  const fluxBurned = asFiniteNumber(value.summary.flux_burned);
  const totalGravScore = asFiniteNumber(value.summary.total_grav_score) ?? 0;
  const totalLaunches = asFiniteNumber(value.summary.total_launches) ?? 0;

  if (
    dailyEthPrize === null
    || activePlayers === null
    || knownWallets === null
    || activityEvents === null
    || fluxBurned === null
  ) {
    return null;
  }

  const entries = value.entries
    .map((entry): SnapshotEntry | null => {
      if (!isRecord(entry)) {
        return null;
      }

      const id = typeof entry.id === 'string' ? entry.id : null;
      const walletAddress = typeof entry.wallet_address === 'string' ? entry.wallet_address : null;
      const rank = asFiniteNumber(entry.rank);
      const prevRank = asFiniteNumber(entry.prev_rank);
      const activityValue = asFiniteNumber(entry.activity_events);
      const burnedValue = asFiniteNumber(entry.flux_burned);
      const lockedValue = asFiniteNumber(entry.eth_locked);
      const gravScoreValue = asFiniteNumber(entry.cumulative_grav_score) ?? 0;
      const launchCountValue = asFiniteNumber(entry.launch_count) ?? 0;

      if (
        !id
        || !walletAddress
        || rank === null
        || prevRank === null
        || activityValue === null
        || burnedValue === null
        || lockedValue === null
      ) {
        return null;
      }

      return {
        id,
        walletAddress,
        activityEvents: activityValue,
        fluxBurned: burnedValue,
        ethLocked: lockedValue,
        cumulativeGravScore: gravScoreValue,
        launchCount: launchCountValue,
        rank,
        prevRank,
      };
    })
    .filter((entry): entry is SnapshotEntry => entry !== null);

  return {
    generatedAt: asDate(value.generated_at),
    summary: {
      dailyEthPrize,
      activePlayers,
      knownWallets,
      activityEvents,
      fluxBurned,
      totalGravScore,
      totalLaunches,
    },
    entries,
  };
}

function toLegacyDisplayEntries(rows: LeaderboardEntry[]): DisplayEntry[] {
  return rows.map((entry) => ({
    id: entry.id,
    walletAddress: entry.wallet_address,
    metricValue: entry.rockets_launched,
    fluxBurned: Number(entry.et_burned),
    ethValue: Number(entry.eth_earned),
    rank: entry.rank,
    prevRank: entry.prev_rank,
  }));
}

function toLegacySummary(rows: LeaderboardEntry[]): ViewSummary {
  const totals = rows.reduce(
    (acc, entry) => ({
      metric: acc.metric + entry.rockets_launched,
      flux: acc.flux + Number(entry.et_burned),
      eth: acc.eth + Number(entry.eth_earned),
    }),
    { metric: 0, flux: 0, eth: 0 }
  );

  return {
    prizeEth: totals.eth * 0.5,
    players: rows.length,
    metricTotal: totals.metric,
    fluxBurned: totals.flux,
    playerSubtext: 'Season 1 active',
  };
}

function toSnapshotDisplayEntries(rows: SnapshotEntry[]): DisplayEntry[] {
  return rows.map((entry) => ({
    id: entry.id,
    walletAddress: entry.walletAddress,
    metricValue: entry.cumulativeGravScore,
    fluxBurned: entry.fluxBurned,
    ethValue: entry.ethLocked,
    rank: entry.rank,
    prevRank: entry.prevRank,
  }));
}

function formatFluxCardValue(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return Math.round(value).toLocaleString();
}

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
    <div className="w-9 h-9 bg-bg-inset border border-border-default flex items-center justify-center flex-shrink-0">
      <span className="font-mono font-black text-sm text-text-secondary">{rank}</span>
    </div>
  );
}

function MovementArrow({ current, prev }: { current: number; prev: number }) {
  const delta = prev - current;
  if (delta === 0 || prev === 0) {
    return (
      <div className="flex items-center gap-0.5 w-10">
        <Minus size={12} className="text-text-faint" />
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
          <div className="h-4 bg-bg-inset animate-pulse" style={{ width: `${40 + Math.random() * 50}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [summary, setSummary] = useState<ViewSummary | null>(null);
  const [mode, setMode] = useState<DataMode>('legacy');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLeaderboard = async (showRefreshing = false) => {
    if (!supabase) {
      setMode('unavailable');
      setEntries([]);
      setSummary(null);
      setStatusMessage('Supabase is not configured for this build.');
      setLastUpdated(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showRefreshing) {
      setRefreshing(true);
    }

    let snapshotErrorMessage: string | null = null;

    try {
      const snapshotResponse = await supabase.rpc('get_cosmic_jackpot_snapshot');
      if (snapshotResponse.error) {
        snapshotErrorMessage = snapshotResponse.error.message;
      } else {
        const snapshot = parseSnapshotPayload(snapshotResponse.data);
        if (snapshot) {
          setEntries(toSnapshotDisplayEntries(snapshot.entries));
          setSummary({
            prizeEth: snapshot.summary.dailyEthPrize,
            players: snapshot.summary.activePlayers,
            metricTotal: snapshot.summary.totalGravScore,
            fluxBurned: snapshot.summary.fluxBurned,
            playerSubtext: `${snapshot.summary.activePlayers} active wallets · ${snapshot.summary.totalLaunches} launches`,
          });
          setMode('snapshot');
          setStatusMessage(null);
          setLastUpdated(snapshot.generatedAt ?? new Date());
          setLoading(false);
          setRefreshing(false);
          return;
        }

        snapshotErrorMessage = 'Malformed payload from get_cosmic_jackpot_snapshot().';
      }

      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('season', 1)
        .order('rank', { ascending: true })
        .limit(20);

      if (error) {
        setMode('unavailable');
        setEntries([]);
        setSummary(null);
        setStatusMessage(
          snapshotErrorMessage
            ? `Live snapshot unavailable (${snapshotErrorMessage}). Legacy leaderboard fallback also failed (${error.message}).`
            : `Leaderboard unavailable: ${error.message}.`
        );
        setLastUpdated(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const rows = (data ?? []) as LeaderboardEntry[];
      setEntries(toLegacyDisplayEntries(rows));
      setSummary(toLegacySummary(rows));
      setMode('legacy');
      setStatusMessage(
        snapshotErrorMessage
          ? `Using the legacy leaderboard table because the live snapshot RPC is not available here (${snapshotErrorMessage}).`
          : rows.length === 0
            ? 'The legacy leaderboard table is available but currently empty.'
            : null
      );
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchLeaderboard();

    const client = supabase;

    if (!client) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchLeaderboard();
    }, REFRESH_INTERVAL_MS);

    const channel = client
      .channel(HEARTBEAT_CHANNEL)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: HEARTBEAT_TABLE },
        () => {
          void fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      window.clearInterval(intervalId);
      void client.removeChannel(channel);
    };
  }, []);

  const metricCardLabel = mode === 'snapshot' ? 'Cumulative GravScore' : 'Missions Launched';
  const metricCardSubtext = mode === 'snapshot' ? 'Sum of all launch scores' : 'Total Quantum Lift-Offs';
  const metricColumnLabel = mode === 'snapshot' ? 'GravScore' : 'Missions';
  const ethColumnLabel = mode === 'snapshot' ? 'ETH Locked' : 'ETH Earned';
  const rankingTag = mode === 'snapshot' ? 'GravScore · Top 20' : 'Grav Score · Top 20';
  const rankingFooter = 'Ranked by cumulative GravScore';

  const cardValues = {
    prize: loading ? '...' : summary ? `${summary.prizeEth.toFixed(3)} ETH` : 'N/A',
    players: loading ? '...' : summary ? summary.players.toString() : 'N/A',
    metric: loading ? '...' : summary ? summary.metricTotal.toLocaleString() : 'N/A',
    flux: loading ? '...' : summary ? formatFluxCardValue(summary.fluxBurned) : 'N/A',
  };

  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10 pt-20 md:pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-10">
            <div className="flex justify-center mb-3">
              <span className="tag">
                <Trophy size={11} />
                Season 1
              </span>
            </div>
            <h1 className="font-mono font-black text-3xl md:text-5xl lg:text-6xl text-text-primary mb-3 leading-[1.08] uppercase tracking-wider">
              Cosmic Jackpot
            </h1>
            <p className="text-text-secondary text-lg font-mono">
              Compete by Grav Score. Win real ETH daily.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: <Trophy size={14} className="text-amber-400" />, label: 'Daily ETH Prize', value: cardValues.prize, sub: '50% of locked pool' },
              { icon: <Users size={14} className="text-blue-400" />, label: 'Players', value: cardValues.players, sub: summary?.playerSubtext ?? 'Waiting for sync' },
              { icon: <Zap size={14} className="text-dot-green" />, label: metricCardLabel, value: cardValues.metric, sub: metricCardSubtext },
              { icon: <Flame size={14} className="text-orange-400" />, label: 'Flux Burned', value: cardValues.flux, sub: 'Fuel consumed' },
            ].map((stat) => (
              <div key={stat.label} className="bg-bg-card border border-border-subtle p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-bg-inset border border-border-default flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <span className="text-xs text-text-muted font-mono uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="font-mono font-black text-text-primary text-xl">{stat.value}</p>
                <p className="text-[11px] text-text-muted mt-0.5 font-mono">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-bg-card border border-border-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award size={16} className="text-text-secondary" />
                <span className="font-mono font-bold text-text-primary text-sm uppercase tracking-wider">Season Rankings</span>
                <span className="tag text-[11px]">{rankingTag}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted font-mono hidden sm:block">
                  {lastUpdated
                    ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Waiting for data'}
                </span>
                <button
                  onClick={() => void fetchLeaderboard(true)}
                  disabled={refreshing}
                  className="w-8 h-8 bg-bg-inset border border-border-default flex items-center justify-center hover:border-border-strong transition-all active:scale-90"
                >
                  <RefreshCw
                    size={13}
                    className={`text-text-secondary ${refreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className="px-6 py-3 border-b border-border-subtle bg-bg-surface">
                <p className="text-xs text-text-muted font-mono">{statusMessage}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {[
                      { label: 'Rank', w: 'w-20' },
                      { label: 'Move', w: 'w-16' },
                      { label: 'Wallet Address', w: '' },
                      { label: metricColumnLabel, w: 'text-right' },
                      { label: 'Flux Burned', w: 'text-right' },
                      { label: ethColumnLabel, w: 'text-right' },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className={`px-4 py-3 text-left text-[11px] font-mono font-semibold text-text-muted uppercase tracking-widest ${col.w}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm font-mono text-text-muted">
                        {mode === 'unavailable'
                          ? 'The jackpot feed is currently unavailable.'
                          : 'No qualifying activity has been recorded yet.'}
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => {
                      const tier = RANK_TIERS[entry.rank];
                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-border-subtle last:border-0 transition-colors duration-200 hover:bg-bg-card-hover/40"
                          style={{
                            background: tier ? tier.bg : undefined,
                            boxShadow: tier ? `inset 0 0 0 1px ${tier.border}` : undefined,
                          }}
                        >
                          <td className="px-4 py-3.5">
                            <RankBadge rank={entry.rank} />
                          </td>
                          <td className="px-4 py-3.5">
                            <MovementArrow current={entry.rank} prev={entry.prevRank} />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-[11px] font-mono font-black"
                                style={tier
                                  ? { background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color }
                                  : { background: 'var(--color-bg-inset)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }
                                }
                              >
                                {entry.walletAddress.slice(0, 2).toUpperCase()}
                              </div>
                              <span
                                className="font-mono text-sm"
                                style={{ color: tier ? tier.color : 'var(--color-text-secondary)' }}
                              >
                                {entry.walletAddress}
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
                              <span className="font-mono font-bold text-text-primary text-sm">
                                {entry.metricValue.toLocaleString()}
                              </span>
                              <Zap size={11} className="text-text-muted" />
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-mono font-bold text-text-primary text-sm">
                                {entry.fluxBurned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                              <span className="text-[11px] text-text-muted font-mono">FLUX</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span
                              className="font-mono font-bold text-sm"
                              style={tier ? { color: tier.color } : { color: 'var(--color-text-primary)' }}
                            >
                              {entry.ethValue.toFixed(4)} ETH
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
              <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2" style={{ background: '#f59e0b' }} />
                  Gold - 1st
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2" style={{ background: '#94a3b8' }} />
                  Silver - 2nd
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2" style={{ background: '#cd7c2f' }} />
                  Bronze - 3rd
                </div>
              </div>
              <span className="text-xs text-text-muted font-mono">{rankingFooter}</span>
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
                  <p className="text-xs text-text-muted font-mono mb-0.5 uppercase tracking-wider">{p.place} Prize</p>
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
