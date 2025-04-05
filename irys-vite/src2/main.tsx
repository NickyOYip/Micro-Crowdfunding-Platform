import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DataProvider from './provider/dataProvider.tsx'
import WalletProvider from './provider/walletProvider.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </DataProvider>
  </StrictMode>,
)
