import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { GameStateProvider } from './context/GameState';
import { WalletProvider } from './hooks/useWallet';
import Navbar from './components/Navbar';
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
  }, []);

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <WalletProvider>
      <GameStateProvider>
        <AppToaster />
        {page === 'dex' ? (
          <Suspense fallback={<PageFallback />}>
            <DexPage onBack={() => navigate('home')} />
          </Suspense>
        ) : page === 'mystery' ? (
          <Suspense fallback={<PageFallback />}>
            <MysteryPage onBack={() => navigate('home')} />
          </Suspense>
        ) : page === 'lab' ? (
          <Suspense fallback={<PageFallback />}>
            <RocketLabPage onBack={() => navigate('home')} />
          </Suspense>
        ) : page === 'leaderboard' ? (
          <Suspense fallback={<PageFallback />}>
            <LeaderboardPage onBack={() => navigate('home')} />
          </Suspense>
        ) : (
          <div className="min-h-screen font-inter" style={{ background: 'var(--color-bg-base)' }}>
            <StarField />
            <div className="relative z-10">
              <Navbar onNavigate={navigate} />
              <main>
                <Hero onOpenDex={() => navigate('dex')} />
                <QuickActions onOpenDex={() => navigate('dex')} onOpenMystery={() => navigate('mystery')} onOpenLab={() => navigate('lab')} onOpenLeaderboard={() => navigate('leaderboard')} />
              </main>
              <Footer />
            </div>
          </div>
        )}
      </GameStateProvider>
    </WalletProvider>
  );
}
