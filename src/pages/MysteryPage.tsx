import { useState } from 'react';
import { Gift, Gavel } from 'lucide-react';
import VaultTab from '../components/mystery/VaultTab';
import BidsTab from '../components/mystery/BidsTab';
import InventoryPanel from '../components/mystery/InventoryPanel';
import type { InventoryPart } from '../types/domain';
import { STAR_VAULT_ENABLED, NEBULA_BIDS_ENABLED } from '../config/flags';

export default function MysteryPage() {
  const [activeTab, setActiveTab] = useState<'vault' | 'bids'>(STAR_VAULT_ENABLED ? 'vault' : 'bids');
  const [preferredAuctionPartId, setPreferredAuctionPartId] = useState<string | null>(null);

  const handleSendToAuction = (part: InventoryPart) => {
    setPreferredAuctionPartId(part.id);
    setActiveTab('bids');
  };

  return (
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
            onClick={() => STAR_VAULT_ENABLED && setActiveTab('vault')}
            disabled={!STAR_VAULT_ENABLED}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono font-semibold text-sm transition-all duration-200 ${
              !STAR_VAULT_ENABLED
                ? 'text-text-muted cursor-not-allowed opacity-50'
                : activeTab === 'vault' ? '' : 'text-text-secondary hover:text-text-primary'
            }`}
            style={STAR_VAULT_ENABLED && activeTab === 'vault'
              ? { background: 'rgba(246,197,71,0.08)', color: '#F6C547', borderBottom: '2px solid #F6C547' }
              : undefined}
          >
            <Gift size={14} />
            STAR VAULT
          </button>
          <button
            onClick={() => NEBULA_BIDS_ENABLED && setActiveTab('bids')}
            disabled={!NEBULA_BIDS_ENABLED}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono font-semibold text-sm transition-all duration-200 ${
              !NEBULA_BIDS_ENABLED
                ? 'text-text-muted cursor-not-allowed opacity-50'
                : activeTab === 'bids' ? '' : 'text-text-secondary hover:text-text-primary'
            }`}
            style={NEBULA_BIDS_ENABLED && activeTab === 'bids'
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
  );
}
