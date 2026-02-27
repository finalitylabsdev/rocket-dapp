import { useState } from 'react';
import { ArrowLeft, Gift, Gavel, Moon, Sun, Zap } from 'lucide-react';
import VaultTab from '../components/mystery/VaultTab';
import BidsTab from '../components/mystery/BidsTab';
import InventoryPanel from '../components/mystery/InventoryPanel';
import { APP3_INSET_STYLE, formatFluxValue } from '../components/mystery/ui';
import { useGameState } from '../context/GameState';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../hooks/useWallet';
import type { InventoryPart } from '../types/domain';
import PhiSymbol from '../components/brand/PhiSymbol';

interface MysteryPageProps {
  onBack: () => void;
}

export default function MysteryPage({ onBack }: MysteryPageProps) {
  const { fluxBalance } = useGameState();
  const wallet = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'vault' | 'bids'>('vault');
  const [preferredAuctionPartId, setPreferredAuctionPartId] = useState<string | null>(null);

  const handleSendToAuction = (part: InventoryPart) => {
    setPreferredAuctionPartId(part.id);
    setActiveTab('bids');
  };

  return (
    <div className="min-h-screen bg-bg-base relative">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-base/95 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors group"
              >
                <div className="w-8 h-8 bg-bg-card border border-border-default group-hover:border-border-strong flex items-center justify-center transition-all">
                  <ArrowLeft size={15} className="text-text-secondary group-hover:text-text-primary" />
                </div>
                <span className="text-sm font-mono font-medium hidden sm:inline">BACK</span>
              </button>
              <div className="h-5 w-px bg-border-default" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-dot-green flex items-center justify-center">
                  <Zap size={16} className="text-black" fill="black" />
                </div>
                <div>
                  <span className="font-mono font-bold text-text-primary text-base leading-none uppercase tracking-wider">Star Vault &amp; Nebula Bids</span>
                  <div className="text-[10px] font-mono font-medium text-text-muted leading-none mt-0.5 uppercase tracking-wider">App 3 · ɸ-net Testnet</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2" style={APP3_INSET_STYLE}>
                <PhiSymbol size={14} color="var(--color-text-primary)" />
                <span className="text-xs font-mono font-bold text-text-primary">
                  {formatFluxValue(fluxBalance)}
                </span>
                <span className="text-xs font-mono text-text-muted">FLUX</span>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              {wallet.isConnected ? (
                <div className="hidden sm:flex items-center gap-2 bg-bg-card border border-border-subtle px-3 py-2">
                  <div className="glow-dot" />
                  <span className="text-xs font-mono font-semibold text-text-primary">{wallet.displayAddress}</span>
                </div>
              ) : (
                <button
                  onClick={() => void wallet.connect()}
                  disabled={wallet.isConnecting}
                  className="btn-primary text-sm py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={13} />
                  {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <span className="tag">
                <Gift size={11} />
                Crack open the cosmos. Bid on destiny.
              </span>
            </div>
            <h1 className="font-mono font-black text-3xl md:text-5xl lg:text-6xl text-text-primary mb-4 leading-[1.08] uppercase tracking-wider">
              Star Vault &amp; Nebula Bids
            </h1>
            <p className="text-text-secondary text-lg font-mono">
              Server-backed rewards, live auctions, and one shared inventory cache.
            </p>
          </div>

          <div className="mb-6 flex gap-0 border border-border-subtle overflow-hidden">
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono font-semibold text-sm transition-all duration-200 ${
                activeTab === 'vault' ? '' : 'text-text-secondary hover:text-text-primary'
              }`}
              style={activeTab === 'vault'
                ? { background: 'rgba(246,197,71,0.08)', color: '#F6C547', borderBottom: '2px solid #F6C547' }
                : undefined}
            >
              <Gift size={14} />
              STAR VAULT
            </button>
            <button
              onClick={() => setActiveTab('bids')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono font-semibold text-sm transition-all duration-200 ${
                activeTab === 'bids' ? '' : 'text-text-secondary hover:text-text-primary'
              }`}
              style={activeTab === 'bids'
                ? { background: 'rgba(168,85,247,0.08)', color: '#A855F7', borderBottom: '2px solid #A855F7' }
                : undefined}
            >
              <Gavel size={14} />
              NEBULA BIDS
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <div>
              {activeTab === 'vault' ? (
                <VaultTab />
              ) : (
                <BidsTab
                  preferredPartId={preferredAuctionPartId}
                  onPreferredPartHandled={() => setPreferredAuctionPartId(null)}
                />
              )}
            </div>

            <InventoryPanel onSendToAuction={handleSendToAuction} />
          </div>
        </div>
      </div>
    </div>
  );
}
