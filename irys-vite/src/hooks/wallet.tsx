import { useState } from "react";
import { ethers } from "ethers";
import { WebUploader } from "@irys/web-upload";
import { WebEthereum } from "@irys/web-upload-ethereum";
import { EthersV6Adapter } from "@irys/web-upload-ethereum-ethers-v6";


function Wallet() {
  const [walletStatus, setWalletStatus] = useState("Not connected");
  const [irysStatus, setIrysStatus] = useState("Not connected");

  const connectWallet = async () => {
    console.log("connect wallet");

    if (typeof window.ethereum === 'undefined') {
      console.error("No Ethereum provider found. Please install MetaMask or another wallet.");
      setWalletStatus("No Ethereum provider found. Please install MetaMask or another wallet.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletStatus(`Connected: ${address}`);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setWalletStatus("Error connecting to wallet");
    }
  };

  const connectIrys = async () => {
    if (typeof window.ethereum === 'undefined') {
      console.error("No Ethereum provider found. Please install MetaMask or another wallet.");
      setIrysStatus("No Ethereum provider found. Please install MetaMask or another wallet.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const irysUploader = await WebUploader(WebEthereum).withAdapter(EthersV6Adapter(provider));
      setIrysStatus(`Connected to Irys: ${irysUploader.address}`);
    } catch (error) {
      console.error("Error connecting to Irys:", error);
      setIrysStatus("Error connecting to Irys");
    }
  };

  return (
    <div>
      <button onClick={connectWallet}>Connect Wallet</button>
      <p>{walletStatus}</p>
      <button onClick={connectIrys}>Connect Irys</button>
      <p>{irysStatus}</p>
    </div>
  );
}

export { Wallet };