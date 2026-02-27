import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Web3OnboardProvider } from '@web3-onboard/react';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.tsx';
import { web3Onboard } from './lib/web3Onboard';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Web3OnboardProvider web3Onboard={web3Onboard}>
        <App />
      </Web3OnboardProvider>
    </ThemeProvider>
  </StrictMode>
);
