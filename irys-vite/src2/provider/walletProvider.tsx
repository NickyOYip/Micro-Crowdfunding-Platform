import { useState, useContext, createContext } from "react";
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


  const connectWallet = async () => {
    console.log("start connect to ETH wallet");

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


  return (
    <WalletContext.Provider value={{ walletStatus, irysStatus, connectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export default WalletProvider;