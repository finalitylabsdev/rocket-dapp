import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';
import type { AuctionRound, AuctionHistoryEntry } from '../../types/domain';
import {
  APP3_INSET_STYLE,
  APP3_PANEL_STYLE,
  APP3_TEXT_MUTED_STYLE,
  APP3_TEXT_PRIMARY_STYLE,
  APP3_TEXT_SECONDARY_STYLE,
  formatFluxValue,
} from './ui';

interface AuctionOpsPanelProps {
  activeAuction: AuctionRound | null;
  history: AuctionHistoryEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}

type RoundHealth = 'active' | 'overdue' | 'idle';

function classifyRoundHealth(round: AuctionRound | null): RoundHealth {
  if (!round) return 'idle';
  const endsAt = new Date(round.endsAt).getTime();
  if (endsAt <= Date.now()) return 'overdue';
  return 'active';
}

function HealthIndicator({ health }: { health: RoundHealth }) {
  if (health === 'active') {
    return <CheckCircle size={14} style={{ color: '#4ADE80' }} />;
  }
  if (health === 'overdue') {
    return <AlertTriangle size={14} style={{ color: '#FBBF24' }} />;
  }
  return <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />;
}

function healthLabel(health: RoundHealth): string {
  if (health === 'active') return 'Healthy';
  if (health === 'overdue') return 'Overdue — awaiting scheduler';
  return 'Idle — no active round';
}

function healthColor(health: RoundHealth): string {
  if (health === 'active') return '#4ADE80';
  if (health === 'overdue') return '#FBBF24';
  return 'var(--color-text-muted)';
}

function PhaseTimeline({ round }: { round: AuctionRound }) {
  const submissionCountdown = useCountdown(round.submissionEndsAt);
  const biddingCountdown = useCountdown(round.endsAt);

  const phases = [
    {
      label: 'Submissions',
      active: round.status === 'accepting_submissions',
      done: round.status !== 'accepting_submissions',
      countdown: submissionCountdown,
    },
    {
      label: 'Bidding',
      active: round.status === 'bidding',
      done: round.status === 'completed' || round.status === 'no_submissions',
      countdown: biddingCountdown,
    },
    {
      label: 'Settlement',
      active: round.status === 'finalizing',
      done: round.status === 'completed' || round.status === 'no_submissions',
      countdown: null,
    },
  ];

  return (
    <div className="space-y-1.5">
      {phases.map((phase) => (
        <div key={phase.label} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: phase.active ? '#A855F7' : phase.done ? '#4ADE80' : 'var(--color-text-muted)',
              boxShadow: phase.active ? '0 0 6px rgba(168,85,247,0.5)' : 'none',
            }}
          />
          <span
            className="text-[10px] font-mono uppercase tracking-wider flex-1"
            style={{ color: phase.active ? '#C084FC' : 'var(--color-text-secondary)' }}
          >
            {phase.label}
          </span>
          {phase.active && phase.countdown && (
            <span className="text-[10px] font-mono tabular-nums" style={APP3_TEXT_PRIMARY_STYLE}>
              {phase.countdown.formatted}
            </span>
          )}
          {phase.done && (
            <CheckCircle size={10} style={{ color: '#4ADE80' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function RoundStats({ round }: { round: AuctionRound }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="p-2 text-center" style={APP3_INSET_STYLE}>
        <p className="font-mono font-bold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
          {round.bidCount}
        </p>
        <p className="text-[9px] font-mono uppercase" style={APP3_TEXT_MUTED_STYLE}>Bids</p>
      </div>
      <div className="p-2 text-center" style={APP3_INSET_STYLE}>
        <p className="font-mono font-bold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
          {formatFluxValue(round.currentHighestBid)}
        </p>
        <p className="text-[9px] font-mono uppercase" style={APP3_TEXT_MUTED_STYLE}>Top Bid</p>
      </div>
      <div className="p-2 text-center" style={APP3_INSET_STYLE}>
        <p className="font-mono font-bold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
          {round.part ? '1' : '0'}
        </p>
        <p className="text-[9px] font-mono uppercase" style={APP3_TEXT_MUTED_STYLE}>Selected</p>
      </div>
    </div>
  );
}

function RecentRoundsSummary({ history }: { history: AuctionHistoryEntry[] }) {
  if (history.length === 0) {
    return null;
  }

  const completed = history.filter((h) => h.status === 'completed');
  const empty = history.filter((h) => h.status === 'no_submissions');
  const totalVolume = completed.reduce((sum, h) => sum + h.finalPrice, 0);
  const avgPrice = completed.length > 0 ? totalVolume / completed.length : 0;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
        Recent Activity ({history.length} rounds)
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="font-mono font-bold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
            {completed.length}/{history.length}
          </p>
          <p className="text-[9px] font-mono uppercase" style={APP3_TEXT_MUTED_STYLE}>Settled</p>
        </div>
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="font-mono font-bold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
            {empty.length}
          </p>
          <p className="text-[9px] font-mono uppercase" style={APP3_TEXT_MUTED_STYLE}>Empty</p>
        </div>
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="font-mono font-bold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
            {formatFluxValue(totalVolume)}
          </p>
          <p className="text-[9px] font-mono uppercase" style={APP3_TEXT_MUTED_STYLE}>Volume</p>
        </div>
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="font-mono font-bold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
            {formatFluxValue(avgPrice)}
          </p>
          <p className="text-[9px] font-mono uppercase" style={APP3_TEXT_MUTED_STYLE}>Avg Price</p>
        </div>
      </div>
    </div>
  );
}

export default function AuctionOpsPanel({ activeAuction, history, isLoading, onRefresh }: AuctionOpsPanelProps) {
  const health = classifyRoundHealth(activeAuction);

  return (
    <div className="p-4 space-y-4" style={APP3_PANEL_STYLE}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: '#C084FC' }} />
          <p className="font-mono font-black text-sm uppercase tracking-wider" style={APP3_TEXT_PRIMARY_STYLE}>
            Ops
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-2 py-1 text-[9px] font-mono font-semibold uppercase tracking-wider"
          style={{ ...APP3_INSET_STYLE, color: '#C084FC', opacity: isLoading ? 0.5 : 1 }}
        >
          {isLoading ? '...' : 'Sync'}
        </button>
      </div>

      {/* Scheduler health */}
      <div className="flex items-center gap-2 p-2" style={APP3_INSET_STYLE}>
        <HealthIndicator health={health} />
        <span className="text-[10px] font-mono" style={{ color: healthColor(health) }}>
          {healthLabel(health)}
        </span>
      </div>

      {/* Active round phase timeline */}
      {activeAuction && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
            Round #{activeAuction.roundId} Lifecycle
          </p>
          <PhaseTimeline round={activeAuction} />
          <RoundStats round={activeAuction} />
        </div>
      )}

      {/* Recent rounds summary */}
      <RecentRoundsSummary history={history} />
    </div>
  );
}
