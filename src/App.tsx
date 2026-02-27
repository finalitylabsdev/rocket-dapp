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
import StarField from './components/brand/StarField';

const DexPage = lazy(() => import('./pages/DexPage'));
const MysteryPage = lazy(() => import('./pages/MysteryPage'));
const RocketLabPage = lazy(() => import('./pages/RocketLabPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));

export type Page = 'home' | 'dex' | 'mystery' | 'lab' | 'leaderboard';

const VALID_PAGES = new Set<Page>(['home', 'dex', 'mystery', 'lab', 'leaderboard']);

function PageFallback() {
  return <div className="min-h-screen bg-bg-base" />;
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
                onNavigateHome={() => navigate('home')}
              />
              <main className="pt-12">
                <Suspense fallback={<PageFallback />}>
                  {page === 'dex' ? (
                    <DexPage />
                  ) : page === 'mystery' ? (
                    <MysteryPage />
                  ) : page === 'lab' ? (
                    <RocketLabPage />
                  ) : page === 'leaderboard' ? (
                    <LeaderboardPage />
                  ) : (
                    <>
                      <Hero onOpenDex={() => navigate('dex')} />
                      <QuickActions onOpenDex={() => navigate('dex')} onOpenMystery={() => navigate('mystery')} onOpenLab={() => navigate('lab')} onOpenLeaderboard={() => navigate('leaderboard')} />
                    </>
                  )}
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
