import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import EntropyGateBanner from './components/EntropyGateBanner';
import { GameStateProvider } from './context/GameState';
import { EthLockStateProvider } from './context/EthLockState';
import { WalletProvider } from './hooks/useWallet';
import ShellNav from './components/ShellNav';
import Hero from './components/Hero';
import QuickActions from './components/QuickActions';
import Footer from './components/Footer';
import AppToaster from './components/AppToaster';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import StarField from './components/brand/StarField';
import ComingSoon from './components/ComingSoon';
import {
  DEX_ENABLED,
  STAR_VAULT_ENABLED,
  NEBULA_BIDS_ENABLED,
  ROCKET_LAB_ENABLED,
} from './config/flags';

const DexPage = lazy(() => import('./pages/DexPage'));
const GatePage = lazy(() => import('./pages/GatePage'));
const MysteryPage = lazy(() => import('./pages/MysteryPage'));
const RocketLabPage = lazy(() => import('./pages/RocketLabPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));

export type Page = 'home' | 'gate' | 'wallet' | 'dex' | 'mystery' | 'lab' | 'leaderboard';

const VALID_PAGES = new Set<Page>(['home', 'gate', 'wallet', 'dex', 'mystery', 'lab', 'leaderboard']);

function PageFallback() {
  return <div className="min-h-screen bg-bg-base" />;
}

function getPageBoundaryLabel(page: Page): string {
  if (page === 'gate') return 'Entropy Gate';
  if (page === 'wallet') return 'Wallet';
  if (page === 'dex') return 'Entropy Exchange';
  if (page === 'mystery') return 'Star Vault & Nebula Bids';
  if (page === 'lab') return 'Rocket Lab';
  if (page === 'leaderboard') return 'Leaderboard';
  return 'Home';
}

function pageFromHash(): Page {
  const hash = window.location.hash.replace('#', '') as Page;
  return VALID_PAGES.has(hash) ? hash : 'home';
}

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash);

  const navigate = useCallback((p: Page) => {
    window.location.hash = p === 'home' ? '' : p;
    setPage(p);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const pageContent = (() => {
    if (page === 'gate') {
      return (
        <GatePage
          onOpenDex={() => navigate('dex')}
          onOpenWallet={() => navigate('wallet')}
        />
      );
    }

    if (page === 'wallet') {
      return <WalletPage />;
    }

    if (page === 'dex') {
      return DEX_ENABLED
        ? <DexPage />
        : <ComingSoon title="Entropy Exchange" subtitle="The decentralized exchange is not yet available." />;
    }

    if (page === 'mystery') {
      return STAR_VAULT_ENABLED || NEBULA_BIDS_ENABLED
        ? <MysteryPage />
        : <ComingSoon title="Star Vault & Nebula Bids" subtitle="Mystery boxes and auctions are not yet available." />;
    }

    if (page === 'lab') {
      return ROCKET_LAB_ENABLED
        ? <RocketLabPage />
        : <ComingSoon title="Rocket Lab" subtitle="Rocket building and launches are not yet available." />;
    }

    if (page === 'leaderboard') {
      return <LeaderboardPage />;
    }

    return (
      <>
        <Hero
          onOpenDex={() => navigate('dex')}
          onOpenGate={() => navigate('gate')}
          onOpenWallet={() => navigate('wallet')}
        />
        <QuickActions
          onOpenGate={() => navigate('gate')}
          onOpenDex={() => navigate('dex')}
          onOpenMystery={() => navigate('mystery')}
          onOpenLab={() => navigate('lab')}
          onOpenLeaderboard={() => navigate('leaderboard')}
        />
      </>
    );
  })();

  return (
    <WalletProvider>
      <EthLockStateProvider>
        <GameStateProvider>
          <AppToaster />
          <div className="min-h-screen font-inter" style={{ background: 'var(--color-bg-base)' }}>
            {page === 'home' && <StarField />}
            <div className="relative z-10">
              <ShellNav page={page} onNavigate={navigate} />
              <EntropyGateBanner
                isHome={page === 'home'}
                isGate={page === 'gate'}
                onNavigateGate={page === 'home' || page === 'gate' ? undefined : () => navigate('gate')}
              />
              <main className="pt-12">
                <Suspense fallback={<PageFallback />}>
                  <RouteErrorBoundary
                    onNavigateHome={page === 'home' ? undefined : () => navigate('home')}
                    resetKey={page}
                    sectionLabel={getPageBoundaryLabel(page)}
                  >
                    {pageContent}
                  </RouteErrorBoundary>
                </Suspense>
              </main>
              {page === 'home' && <Footer onNavigate={navigate} />}
            </div>
          </div>
        </GameStateProvider>
      </EthLockStateProvider>
    </WalletProvider>
  );
}
