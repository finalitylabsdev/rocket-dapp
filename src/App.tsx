import { useState, useEffect, useCallback } from 'react';
import { GameStateProvider } from './context/GameState';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QuickActions from './components/QuickActions';
import Footer from './components/Footer';
import DexPage from './pages/DexPage';
import MysteryPage from './pages/MysteryPage';
import RocketLabPage from './pages/RocketLabPage';
import LeaderboardPage from './pages/LeaderboardPage';
import StarField from './components/brand/StarField';

export type Page = 'home' | 'dex' | 'mystery' | 'lab' | 'leaderboard';

const VALID_PAGES = new Set<Page>(['home', 'dex', 'mystery', 'lab', 'leaderboard']);

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
    <GameStateProvider>
      {page === 'dex' ? (
        <DexPage onBack={() => navigate('home')} />
      ) : page === 'mystery' ? (
        <MysteryPage onBack={() => navigate('home')} />
      ) : page === 'lab' ? (
        <RocketLabPage onBack={() => navigate('home')} />
      ) : page === 'leaderboard' ? (
        <LeaderboardPage onBack={() => navigate('home')} />
      ) : (
        <div className="min-h-screen font-inter" style={{ background: '#06080F' }}>
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
  );
}
