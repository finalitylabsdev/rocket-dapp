import { useMemo, useState } from 'react';
import { Filter, Package2 } from 'lucide-react';
import { useGameState } from '../../context/GameState';
import type { InventoryPart, InventorySortDir, InventorySortKey, RarityTier, RocketSection } from '../../types/domain';
import InventoryPartCard from './InventoryPartCard';
import { APP3_CONTROL_STYLE, APP3_INSET_STYLE, APP3_PANEL_STYLE, APP3_TEXT_MUTED_STYLE, APP3_TEXT_PRIMARY_STYLE, APP3_TEXT_SECONDARY_STYLE } from './ui';

interface InventoryPanelProps {
  onSendToAuction?: (part: InventoryPart) => void;
}

function compareValues(a: string | number, b: string | number, dir: InventorySortDir): number {
  const base = typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a).localeCompare(String(b));

  return dir === 'asc' ? base : base * -1;
}

export default function InventoryPanel({ onSendToAuction }: InventoryPanelProps) {
  const game = useGameState();
  const [sortKey, setSortKey] = useState<InventorySortKey>('value');
  const [sortDir, setSortDir] = useState<InventorySortDir>('desc');
  const [rarityFilter, setRarityFilter] = useState<RarityTier | 'all'>('all');
  const [sectionFilter, setSectionFilter] = useState<RocketSection | 'all'>('all');

  const sectionOptions = useMemo(
    () => Array.from(new Set(game.inventory.map((part) => part.slot))),
    [game.inventory],
  );

  const filteredInventory = useMemo(() => {
    const filtered = game.inventory.filter((part) => {
      const matchesRarity = rarityFilter === 'all' || part.rarity === rarityFilter;
      const matchesSection = sectionFilter === 'all' || part.slot === sectionFilter;
      return matchesRarity && matchesSection;
    });

    return filtered.sort((left, right) => {
      switch (sortKey) {
        case 'name':
          return compareValues(left.name, right.name, sortDir);
        case 'rarity':
          return compareValues(left.rarityTierId, right.rarityTierId, sortDir);
        case 'section':
          return compareValues(left.sectionName, right.sectionName, sortDir);
        case 'value':
        default:
          return compareValues(left.partValue, right.partValue, sortDir);
      }
    });
  }, [game.inventory, rarityFilter, sectionFilter, sortDir, sortKey]);

  return (
    <aside className="sticky top-24">
      <div style={APP3_PANEL_STYLE}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono font-black text-sm uppercase tracking-wider" style={APP3_TEXT_PRIMARY_STYLE}>
                My Inventory
              </p>
              <p className="text-[10px] mt-1 font-mono uppercase tracking-wider" style={APP3_TEXT_MUTED_STYLE}>
                {game.inventory.length} parts {game.isInventorySyncing ? '· refreshing' : ''}
              </p>
            </div>
            <div
              className="h-9 w-9 flex items-center justify-center"
              style={{ ...APP3_INSET_STYLE, color: '#F6C547' }}
            >
              <Package2 size={15} />
            </div>
          </div>
        </div>

        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
            <Filter size={12} />
            Filters
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as InventorySortKey)}
              className="px-2 py-2 text-[10px] font-mono uppercase tracking-wider"
              style={APP3_CONTROL_STYLE}
            >
              <option value="value">Value</option>
              <option value="rarity">Rarity</option>
              <option value="section">Section</option>
              <option value="name">Name</option>
            </select>
            <select
              value={sortDir}
              onChange={(event) => setSortDir(event.target.value as InventorySortDir)}
              className="px-2 py-2 text-[10px] font-mono uppercase tracking-wider"
              style={APP3_CONTROL_STYLE}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <select
              value={rarityFilter}
              onChange={(event) => setRarityFilter(event.target.value as RarityTier | 'all')}
              className="px-2 py-2 text-[10px] font-mono uppercase tracking-wider"
              style={APP3_CONTROL_STYLE}
            >
              <option value="all">All Rarities</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Epic">Epic</option>
              <option value="Legendary">Legendary</option>
              <option value="Mythic">Mythic</option>
              <option value="Celestial">Celestial</option>
              <option value="Quantum">Quantum</option>
            </select>
            <select
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value as RocketSection | 'all')}
              className="px-2 py-2 text-[10px] font-mono uppercase tracking-wider"
              style={APP3_CONTROL_STYLE}
            >
              <option value="all">All Sections</option>
              {sectionOptions.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {filteredInventory.length === 0 ? (
            <div className="p-4 text-center font-mono text-sm" style={{ ...APP3_INSET_STYLE, ...APP3_TEXT_MUTED_STYLE }}>
              Your hangar is empty. Open a Star Vault Box to get your first part.
            </div>
          ) : (
            filteredInventory.map((part) => (
              <InventoryPartCard
                key={part.id}
                part={part}
                onSendToAuction={onSendToAuction}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
