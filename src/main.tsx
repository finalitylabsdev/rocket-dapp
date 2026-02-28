import { StrictMode, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.tsx';
import { getWalletAuthConfigIssues, hasCriticalConfigErrors } from './lib/startupConfig';
import './index.css';

const walletAuthConfigIssues = getWalletAuthConfigIssues();
const isCritical = hasCriticalConfigErrors();

type LoadedWalletShell = {
  Web3OnboardProvider: typeof import('@web3-onboard/react').Web3OnboardProvider;
  web3Onboard: typeof import('./lib/web3Onboard').web3Onboard;
};

function WalletShellLoader({ children }: { children: ReactNode }) {
  const [loadedWalletShell, setLoadedWalletShell] = useState<LoadedWalletShell | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void Promise.all([
      import('@web3-onboard/react'),
      import('./lib/web3Onboard'),
    ]).then(([walletReact, walletConfig]) => {
      if (!isActive) {
        return;
      }

      setLoadedWalletShell({
        Web3OnboardProvider: walletReact.Web3OnboardProvider,
        web3Onboard: walletConfig.web3Onboard,
      });
    }).catch((error) => {
      if (!isActive) {
        return;
      }

      const message = error instanceof Error && error.message
        ? error.message
        : 'Failed to load wallet interface.';

      console.error('Failed to load wallet interface:', error);
      setLoadError(message);
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (loadError) {
    return (
      <div
        className="mx-4 mt-4 px-4 py-3 font-mono text-sm"
        style={{
          background: '#3B0F0F',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          color: '#FCA5A5',
        }}
      >
        {`Wallet interface failed to load. ${loadError}`}
      </div>
    );
  }

  if (!loadedWalletShell) {
    return <div className="min-h-screen" style={{ background: 'var(--color-bg-base)' }} />;
  }

  const { Web3OnboardProvider, web3Onboard } = loadedWalletShell;

  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      {children}
    </Web3OnboardProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      {walletAuthConfigIssues.length > 0 && (
        <div
          className="mx-4 mt-4 px-4 py-3 font-mono text-sm"
          style={{
            background: isCritical ? '#3B0F0F' : '#26110A',
            border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.5)' : 'rgba(249, 115, 22, 0.45)'}`,
            color: isCritical ? '#FCA5A5' : '#FDBA74',
          }}
        >
          {isCritical
            ? `Entropy cannot start. ${walletAuthConfigIssues.join(' ')} Check .env and restart.`
            : `Wallet authentication is unavailable. ${walletAuthConfigIssues.join(' ')}`}
        </div>
      )}
      {!isCritical && (
        <WalletShellLoader>
          <App />
        </WalletShellLoader>
      )}
    </ThemeProvider>
  </StrictMode>
);
