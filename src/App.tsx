import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SystemStatus from './components/SystemStatus';
import QuickActions from './components/QuickActions';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import DexPage from './pages/DexPage';
import MysteryPage from './pages/MysteryPage';
import RocketLabPage from './pages/RocketLabPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AssemblerPage from './pages/AssemblerPage';
import StarField from './components/brand/StarField';

export type Page = 'home' | 'dex' | 'mystery' | 'lab' | 'leaderboard' | 'assembler';

export default function App() {
  const [page, setPage] = useState<Page>('home');

  if (page === 'dex') {
    return <DexPage onBack={() => setPage('home')} />;
  }

  if (page === 'mystery') {
    return <MysteryPage onBack={() => setPage('home')} />;
  }

  if (page === 'lab') {
    return <RocketLabPage onBack={() => setPage('home')} />;
  }

  if (page === 'leaderboard') {
    return <LeaderboardPage onBack={() => setPage('home')} />;
  }

  if (page === 'assembler') {
    return <AssemblerPage onBack={() => setPage('home')} />;
  }

  return (
    <div className="min-h-screen font-inter" style={{ background: '#06080F' }}>
      <StarField />
      <div className="relative z-10">
        <Navbar onNavigate={setPage} />
        <main>
          <Hero onOpenDex={() => setPage('dex')} />
          <SystemStatus />
          <QuickActions onOpenDex={() => setPage('dex')} onOpenMystery={() => setPage('mystery')} onOpenLab={() => setPage('lab')} onOpenLeaderboard={() => setPage('leaderboard')} onOpenAssembler={() => setPage('assembler')} />
          <HowItWorks />
        </main>
        <Footer />
      </div>
    </div>
  );
}
