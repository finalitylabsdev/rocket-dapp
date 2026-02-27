import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { GameStateProvider } from './context/GameState';
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
      <GameStateProvider>
        <AppToaster />
        <div className="min-h-screen font-inter app-shell-root">
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
            <div
              className="absolute -top-32 left-[8%] h-72 w-72 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(184,255,85,0.12) 0%, rgba(184,255,85,0) 68%)' }}
            />
            <div
              className="absolute top-12 right-[10%] h-80 w-80 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(245,95,217,0.12) 0%, rgba(245,95,217,0) 68%)' }}
            />
            <div
              className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.08) 0%, rgba(96,165,250,0) 70%)' }}
            />
          </div>
          {page === 'home' && <StarField />}
          <div className="relative z-10">
            <ShellNav page={page} onNavigate={navigate} />
            <main>
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
    </WalletProvider>
  );
}
