import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import '@mysten/dapp-kit/dist/index.css';
import './index.css';
import App from './App';
import { WalletContextProvider } from './contexts/WalletContext';
import { RoleContextProvider } from './contexts/RoleContext';

const networks = {
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
  devnet: { url: getFullnodeUrl('devnet') },
};

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={import.meta.env.VITE_SUI_NETWORK || 'testnet'}>
        <WalletProvider autoConnect>
          <WalletContextProvider>
            <RoleContextProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </RoleContextProvider>
          </WalletContextProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
