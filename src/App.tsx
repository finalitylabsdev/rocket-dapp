import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Gift } from 'lucide-react';
import { GameStateProvider, useGameState } from './context/GameState';
import { WalletProvider } from './hooks/useWallet';
import ShellNav from './components/ShellNav';
import Hero from './components/Hero';
import QuickActions from './components/QuickActions';
import JourneyCue from './components/JourneyCue';
import WelcomeBanner from './components/WelcomeBanner';
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

function HomeContent({ navigate }: { navigate: (p: Page) => void }) {
  const game = useGameState();
  const showFluxCue = game.fluxBalance > 0 && game.inventory.length === 0;

  return (
    <>
      <WelcomeBanner />
      <Hero onOpenDex={() => navigate('dex')} />
      {showFluxCue && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-4">
          <JourneyCue
            icon={<Gift size={16} />}
            message={`You have ${game.fluxBalance} FLUX! Open a Star Vault box to earn rocket parts.`}
            actionLabel="Open Star Vault"
            onAction={() => navigate('mystery')}
            tone="gold"
          />
        </div>
      )}
      <QuickActions onOpenDex={() => navigate('dex')} onOpenMystery={() => navigate('mystery')} onOpenLab={() => navigate('lab')} onOpenLeaderboard={() => navigate('leaderboard')} />
    </>
  );
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
        <div className="min-h-screen font-inter" style={{ background: 'var(--color-bg-base)' }}>
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
                  <HomeContent navigate={navigate} />
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
