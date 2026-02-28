import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Web3OnboardProvider } from '@web3-onboard/react';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.tsx';
import { getWalletAuthConfigIssues, hasCriticalConfigErrors } from './lib/startupConfig';
import { web3Onboard } from './lib/web3Onboard';
import './index.css';

const walletAuthConfigIssues = getWalletAuthConfigIssues();
const isCritical = hasCriticalConfigErrors();

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
        <Web3OnboardProvider web3Onboard={web3Onboard}>
          <App />
        </Web3OnboardProvider>
      )}
    </ThemeProvider>
  </StrictMode>
);
