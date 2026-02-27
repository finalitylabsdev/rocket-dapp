import { useState } from 'react';
import { Gift, Gavel } from 'lucide-react';
import VaultTab from '../components/mystery/VaultTab';
import BidsTab from '../components/mystery/BidsTab';
import InventoryPanel from '../components/mystery/InventoryPanel';
import type { InventoryPart } from '../types/domain';

export default function MysteryPage() {
  const [activeTab, setActiveTab] = useState<'vault' | 'bids'>('vault');
  const [preferredAuctionPartId, setPreferredAuctionPartId] = useState<string | null>(null);

  const handleSendToAuction = (part: InventoryPart) => {
    setPreferredAuctionPartId(part.id);
    setActiveTab('bids');
  };

  return (
    <div className="relative z-10 pt-24 md:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <span className="tag">
              <Gift size={11} />
              Crack open the cosmos. Bid on destiny.
            </span>
          </div>
          <h1 className="font-mono font-black text-3xl md:text-5xl lg:text-6xl text-text-primary mb-4 leading-[1.02] tracking-tight">
            Star Vault &amp; Nebula Bids
          </h1>
          <p className="text-text-secondary text-lg font-mono">
            Server-backed rewards, live auctions, and one shared inventory cache.
          </p>
        </div>

        <div className="app-window p-4 sm:p-5">
        <div className="mb-6 flex gap-2 app-panel-muted p-2">
          <button
            onClick={() => setActiveTab('vault')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono font-semibold text-sm transition-all duration-200 rounded-lg ${
              activeTab === 'vault' ? '' : 'text-text-secondary hover:text-text-primary'
            }`}
            style={activeTab === 'vault'
              ? { background: 'rgba(255,201,94,0.14)', color: 'var(--color-accent-gold)', boxShadow: 'var(--surface-gloss)' }
              : undefined}
          >
            <Gift size={14} />
            Star Vault
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono font-semibold text-sm transition-all duration-200 rounded-lg ${
              activeTab === 'bids' ? '' : 'text-text-secondary hover:text-text-primary'
            }`}
            style={activeTab === 'bids'
              ? { background: 'rgba(245,95,217,0.14)', color: 'var(--color-accent-pink)', boxShadow: 'var(--surface-gloss)' }
              : undefined}
          >
            <Gavel size={14} />
            Nebula Bids
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
