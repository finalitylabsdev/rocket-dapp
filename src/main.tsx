import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Web3OnboardProvider } from '@web3-onboard/react';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.tsx';
import { getWalletAuthConfigIssues } from './lib/startupConfig';
import { web3Onboard } from './lib/web3Onboard';
import './index.css';

const walletAuthConfigIssues = getWalletAuthConfigIssues();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      {walletAuthConfigIssues.length > 0 && (
        <div
          className="mx-4 mt-4 px-4 py-3 font-mono text-sm"
          style={{
            background: '#26110A',
            border: '1px solid rgba(249, 115, 22, 0.45)',
            color: '#FDBA74',
          }}
        >
          Wallet authentication is unavailable. {walletAuthConfigIssues.join(' ')}
        </div>
      )}
      <Web3OnboardProvider web3Onboard={web3Onboard}>
        <App />
      </Web3OnboardProvider>
    </ThemeProvider>
  </StrictMode>
);
