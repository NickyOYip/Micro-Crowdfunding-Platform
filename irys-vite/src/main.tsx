import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App.jsx";
import './index.css';
import WalletProvider from './provider/walletProvider.tsx'
import DataProvider from './provider/dataProvider.tsx'


const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(

  <DataProvider>
    <WalletProvider>
      <Router>
        <App />
      </Router>
    </WalletProvider>
  </DataProvider>

  );