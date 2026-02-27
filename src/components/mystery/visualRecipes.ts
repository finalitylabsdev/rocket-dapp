import type { AssetReference, RocketSection } from '../../types/domain';

interface BoxVisualRecipe {
  monogram: string;
  shellGradient: string;
  shellBorder: string;
  shellGlow: string;
  latticeGradient: string;
  orbitScale: number;
  sparkles: { top: string; left: string; size: number; opacity: number }[];
}

interface SectionVisualRecipe {
  shortLabel: string;
  accent: string;
  panelGradient: string;
  traceSegments: { from: [number, number]; to: [number, number] }[];
  nodes: { x: number; y: number; r: number }[];
}

interface ResolvedCatalogAsset {
  key: string | null;
  url: string | null;
  alt: string | null;
}

const BOX_VISUAL_RECIPES: Record<string, BoxVisualRecipe> = {
  common: {
    monogram: 'VC',
    shellGradient: 'linear-gradient(155deg, rgba(107,114,128,0.28), rgba(17,24,39,0.94))',
    shellBorder: 'rgba(148,163,184,0.38)',
    shellGlow: 'rgba(148,163,184,0.18)',
    latticeGradient: 'linear-gradient(120deg, rgba(255,255,255,0.12), rgba(107,114,128,0.05), rgba(255,255,255,0.08))',
    orbitScale: 1,
    sparkles: [
      { top: '18%', left: '24%', size: 4, opacity: 0.45 },
      { top: '30%', left: '73%', size: 5, opacity: 0.35 },
      { top: '72%', left: '32%', size: 3, opacity: 0.5 },
    ],
  },
  uncommon: {
    monogram: 'SC',
    shellGradient: 'linear-gradient(155deg, rgba(34,197,94,0.26), rgba(3,24,18,0.94))',
    shellBorder: 'rgba(74,222,128,0.4)',
    shellGlow: 'rgba(34,197,94,0.2)',
    latticeGradient: 'linear-gradient(120deg, rgba(134,239,172,0.16), rgba(34,197,94,0.06), rgba(240,253,244,0.1))',
    orbitScale: 1.05,
    sparkles: [
      { top: '14%', left: '62%', size: 4, opacity: 0.45 },
      { top: '38%', left: '20%', size: 5, opacity: 0.4 },
      { top: '70%', left: '68%', size: 4, opacity: 0.55 },
    ],
  },
  rare: {
    monogram: 'SV',
    shellGradient: 'linear-gradient(155deg, rgba(59,130,246,0.3), rgba(10,18,36,0.95))',
    shellBorder: 'rgba(96,165,250,0.45)',
    shellGlow: 'rgba(59,130,246,0.24)',
    latticeGradient: 'linear-gradient(120deg, rgba(147,197,253,0.16), rgba(59,130,246,0.05), rgba(219,234,254,0.12))',
    orbitScale: 1.08,
    sparkles: [
      { top: '16%', left: '28%', size: 4, opacity: 0.5 },
      { top: '28%', left: '74%', size: 5, opacity: 0.42 },
      { top: '68%', left: '56%', size: 4, opacity: 0.58 },
    ],
  },
  epic: {
    monogram: 'AC',
    shellGradient: 'linear-gradient(155deg, rgba(139,92,246,0.3), rgba(22,14,42,0.95))',
    shellBorder: 'rgba(167,139,250,0.46)',
    shellGlow: 'rgba(139,92,246,0.26)',
    latticeGradient: 'linear-gradient(120deg, rgba(196,181,253,0.18), rgba(139,92,246,0.06), rgba(243,232,255,0.12))',
    orbitScale: 1.1,
    sparkles: [
      { top: '18%', left: '56%', size: 4, opacity: 0.5 },
      { top: '36%', left: '18%', size: 5, opacity: 0.44 },
      { top: '74%', left: '42%', size: 4, opacity: 0.55 },
    ],
  },
  legendary: {
    monogram: 'SO',
    shellGradient: 'linear-gradient(155deg, rgba(245,158,11,0.34), rgba(28,14,2,0.96))',
    shellBorder: 'rgba(251,191,36,0.5)',
    shellGlow: 'rgba(245,158,11,0.28)',
    latticeGradient: 'linear-gradient(120deg, rgba(253,230,138,0.18), rgba(245,158,11,0.07), rgba(254,249,195,0.14))',
    orbitScale: 1.14,
    sparkles: [
      { top: '16%', left: '30%', size: 5, opacity: 0.55 },
      { top: '28%', left: '68%', size: 4, opacity: 0.48 },
      { top: '72%', left: '58%', size: 5, opacity: 0.62 },
    ],
  },
  mythic: {
    monogram: 'NR',
    shellGradient: 'linear-gradient(155deg, rgba(239,68,68,0.34), rgba(39,8,8,0.96))',
    shellBorder: 'rgba(248,113,113,0.5)',
    shellGlow: 'rgba(239,68,68,0.3)',
    latticeGradient: 'linear-gradient(120deg, rgba(252,165,165,0.18), rgba(239,68,68,0.07), rgba(254,226,226,0.12))',
    orbitScale: 1.18,
    sparkles: [
      { top: '14%', left: '62%', size: 5, opacity: 0.54 },
      { top: '42%', left: '20%', size: 4, opacity: 0.45 },
      { top: '74%', left: '66%', size: 5, opacity: 0.6 },
    ],
  },
  celestial: {
    monogram: 'AA',
    shellGradient: 'linear-gradient(155deg, rgba(6,182,212,0.34), rgba(7,21,34,0.96))',
    shellBorder: 'rgba(34,211,238,0.5)',
    shellGlow: 'rgba(6,182,212,0.32)',
    latticeGradient: 'linear-gradient(120deg, rgba(103,232,249,0.18), rgba(6,182,212,0.07), rgba(236,254,255,0.12))',
    orbitScale: 1.22,
    sparkles: [
      { top: '16%', left: '26%', size: 4, opacity: 0.5 },
      { top: '26%', left: '72%', size: 5, opacity: 0.48 },
      { top: '70%', left: '48%', size: 6, opacity: 0.62 },
    ],
  },
  quantum: {
    monogram: 'PS',
    shellGradient: 'linear-gradient(155deg, rgba(232,236,244,0.32), rgba(18,19,32,0.97))',
    shellBorder: 'rgba(232,236,244,0.56)',
    shellGlow: 'rgba(232,236,244,0.34)',
    latticeGradient: 'linear-gradient(120deg, rgba(34,197,94,0.14), rgba(59,130,246,0.1), rgba(245,158,11,0.14), rgba(232,236,244,0.12))',
    orbitScale: 1.28,
    sparkles: [
      { top: '14%', left: '24%', size: 5, opacity: 0.6 },
      { top: '24%', left: '74%', size: 5, opacity: 0.52 },
      { top: '70%', left: '32%', size: 6, opacity: 0.58 },
      { top: '76%', left: '68%', size: 4, opacity: 0.5 },
    ],
  },
};

const SECTION_VISUAL_RECIPES: Record<RocketSection, SectionVisualRecipe> = {
  coreEngine: {
    shortLabel: 'CE',
    accent: '#F97316',
    panelGradient: 'linear-gradient(150deg, rgba(249,115,22,0.2), rgba(17,24,39,0.92))',
    traceSegments: [
      { from: [6, 26], to: [22, 14] },
      { from: [22, 14], to: [38, 26] },
      { from: [22, 14], to: [22, 38] },
    ],
    nodes: [
      { x: 6, y: 26, r: 2 },
      { x: 22, y: 14, r: 2.5 },
      { x: 38, y: 26, r: 2 },
      { x: 22, y: 38, r: 2 },
    ],
  },
  wingPlate: {
    shortLabel: 'WP',
    accent: '#06B6D4',
    panelGradient: 'linear-gradient(150deg, rgba(6,182,212,0.18), rgba(17,24,39,0.92))',
    traceSegments: [
      { from: [6, 30], to: [18, 18] },
      { from: [18, 18], to: [38, 12] },
      { from: [18, 18], to: [34, 34] },
    ],
    nodes: [
      { x: 6, y: 30, r: 2 },
      { x: 18, y: 18, r: 2.4 },
      { x: 38, y: 12, r: 2 },
      { x: 34, y: 34, r: 2 },
    ],
  },
  fuelCell: {
    shortLabel: 'FC',
    accent: '#22C55E',
    panelGradient: 'linear-gradient(150deg, rgba(34,197,94,0.18), rgba(17,24,39,0.92))',
    traceSegments: [
      { from: [10, 10], to: [10, 34] },
      { from: [10, 22], to: [34, 22] },
      { from: [34, 22], to: [34, 36] },
    ],
    nodes: [
      { x: 10, y: 10, r: 2 },
      { x: 10, y: 34, r: 2 },
      { x: 34, y: 22, r: 2.4 },
      { x: 34, y: 36, r: 2 },
    ],
  },
  navigationModule: {
    shortLabel: 'NM',
    accent: '#3B82F6',
    panelGradient: 'linear-gradient(150deg, rgba(59,130,246,0.18), rgba(17,24,39,0.92))',
    traceSegments: [
      { from: [8, 14], to: [22, 8] },
      { from: [22, 8], to: [36, 14] },
      { from: [22, 8], to: [22, 36] },
      { from: [8, 30], to: [22, 36] },
      { from: [36, 30], to: [22, 36] },
    ],
    nodes: [
      { x: 8, y: 14, r: 2 },
      { x: 22, y: 8, r: 2.4 },
      { x: 36, y: 14, r: 2 },
      { x: 8, y: 30, r: 2 },
      { x: 36, y: 30, r: 2 },
      { x: 22, y: 36, r: 2.2 },
    ],
  },
  payloadBay: {
    shortLabel: 'PB',
    accent: '#EAB308',
    panelGradient: 'linear-gradient(150deg, rgba(234,179,8,0.2), rgba(17,24,39,0.92))',
    traceSegments: [
      { from: [8, 12], to: [36, 12] },
      { from: [8, 12], to: [8, 34] },
      { from: [36, 12], to: [36, 34] },
      { from: [8, 34], to: [36, 34] },
    ],
    nodes: [
      { x: 8, y: 12, r: 2 },
      { x: 36, y: 12, r: 2 },
      { x: 8, y: 34, r: 2 },
      { x: 36, y: 34, r: 2 },
      { x: 22, y: 23, r: 2.4 },
    ],
  },
  thrusterArray: {
    shortLabel: 'TA',
    accent: '#A855F7',
    panelGradient: 'linear-gradient(150deg, rgba(168,85,247,0.2), rgba(17,24,39,0.92))',
    traceSegments: [
      { from: [8, 10], to: [8, 36] },
      { from: [22, 10], to: [22, 36] },
      { from: [36, 10], to: [36, 36] },
      { from: [8, 23], to: [36, 23] },
    ],
    nodes: [
      { x: 8, y: 10, r: 2 },
      { x: 8, y: 36, r: 2 },
      { x: 22, y: 10, r: 2.2 },
      { x: 22, y: 36, r: 2.2 },
      { x: 36, y: 10, r: 2 },
      { x: 36, y: 36, r: 2 },
    ],
  },
  propulsionCables: {
    shortLabel: 'PC',
    accent: '#8B5CF6',
    panelGradient: 'linear-gradient(150deg, rgba(139,92,246,0.18), rgba(17,24,39,0.92))',
    traceSegments: [
      { from: [8, 12], to: [18, 20] },
      { from: [18, 20], to: [10, 32] },
      { from: [18, 20], to: [30, 12] },
      { from: [30, 12], to: [38, 26] },
      { from: [38, 26], to: [26, 36] },
    ],
    nodes: [
      { x: 8, y: 12, r: 2 },
      { x: 18, y: 20, r: 2.4 },
      { x: 10, y: 32, r: 2 },
      { x: 30, y: 12, r: 2 },
      { x: 38, y: 26, r: 2.2 },
      { x: 26, y: 36, r: 2 },
    ],
  },
  shielding: {
    shortLabel: 'SH',
    accent: '#14B8A6',
    panelGradient: 'linear-gradient(150deg, rgba(20,184,166,0.18), rgba(17,24,39,0.92))',
    traceSegments: [
      { from: [22, 8], to: [10, 16] },
      { from: [10, 16], to: [12, 34] },
      { from: [22, 40], to: [12, 34] },
      { from: [22, 8], to: [34, 16] },
      { from: [34, 16], to: [32, 34] },
      { from: [22, 40], to: [32, 34] },
    ],
    nodes: [
      { x: 22, y: 8, r: 2.2 },
      { x: 10, y: 16, r: 2 },
      { x: 12, y: 34, r: 2 },
      { x: 22, y: 40, r: 2.2 },
      { x: 34, y: 16, r: 2 },
      { x: 32, y: 34, r: 2 },
    ],
  },
};

function normalizeVisualKey(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function resolveCatalogAsset(asset?: AssetReference | null, fallbackKey?: string | null): ResolvedCatalogAsset {
  const key = normalizeVisualKey(asset?.key ?? fallbackKey)?.toLowerCase() ?? null;
  const url = normalizeVisualKey(asset?.url);
  const alt = normalizeVisualKey(asset?.alt);

  return { key, url, alt };
}

export function getBoxVisualRecipe(asset?: AssetReference | null, fallbackKey?: string | null) {
  const resolved = resolveCatalogAsset(asset, fallbackKey);
  const recipe = resolved.key ? BOX_VISUAL_RECIPES[resolved.key] ?? null : null;

  return {
    ...resolved,
    recipe,
    usesExplicitFallback: !resolved.url && !recipe,
  };
}

export function getSectionVisualRecipe(asset?: AssetReference | null, fallbackKey?: string | null) {
  const resolved = resolveCatalogAsset(asset, fallbackKey);
  const recipe = resolved.key ? SECTION_VISUAL_RECIPES[resolved.key as RocketSection] ?? null : null;

  return {
    ...resolved,
    recipe,
    usesExplicitFallback: !resolved.url && !recipe,
  };
}
