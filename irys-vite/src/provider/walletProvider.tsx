import { useState, useContext, createContext, useEffect } from "react";
import { ethers } from "ethers";
import { WebUploader } from "@irys/web-upload";
import { WebEthereum } from "@irys/web-upload-ethereum";
import { EthersV6Adapter } from "@irys/web-upload-ethereum-ethers-v6";
import { DataContext } from "./dataProvider";

export const WalletContext = createContext();

function WalletProvider({children}) {
  const { data, updateData } = useContext(DataContext);
  const [walletStatus, setWalletStatus] = useState("Not connected");
  const [irysStatus, setIrysStatus] = useState("Not connected");
  const [changeReason, setChangeReason] = useState("");

  // Set up listeners for account and network changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      // When account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log("Account changed to:", accounts[0]);
        setChangeReason("Account changed");
        logout();
      });

      // When network changes
      window.ethereum.on('chainChanged', (chainId) => {
        console.log("Network changed to:", chainId);
        setChangeReason("Network changed");
        logout();
      });

      // Cleanup listeners when component unmounts
      return () => {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      };
    }
  }, []);

  const connectWallet = async () => {
    console.log("start connect to ETH wallet");
    setChangeReason(""); // Clear any previous change reasons

    if (typeof window.ethereum === 'undefined') {
      console.error("No Ethereum provider found. Please install MetaMask or another wallet.");
      setWalletStatus("No Ethereum provider found. Please install MetaMask or another wallet.");
      return;
    }

    try {
      // connect to wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletStatus(`Connected: ${address}, Network: ${network.name}`);
      // update context with provider 
      updateData({ ethProvider: provider });
      console.log("ETH provider updated in context:", provider);
      // connect to Irys
      const irysUploader = await WebUploader(WebEthereum).withAdapter(EthersV6Adapter(provider)).devnet();
      setIrysStatus(`Connected to Irys: ${irysUploader.address}`);
      // update context with Irys uploader
      updateData({ irysUploader: irysUploader });
      console.log("Irys uploader updated in context:", irysUploader);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setWalletStatus("Error connecting to wallet");
    }
  };

  const logout = () => {
    setWalletStatus("Not connected");
    setIrysStatus("Not connected");
    updateData({ ethProvider: null, irysUploader: null });
    console.log("Wallet disconnected");
  };

  return (
    <WalletContext.Provider value={{ 
      walletStatus, 
      irysStatus, 
      connectWallet, 
      logout,
      changeReason
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export default WalletProvider;