import { useContext, useState, useRef, useEffect } from 'react';
import { DataContext } from "../provider/dataProvider";
import { WalletContext } from "../provider/walletProvider";
import * as IrysActions from "../hooks/irysHook/irysAction";

function TestIrysActionPage() {
  const { data } = useContext(DataContext);
  const { walletStatus, irysStatus, connectWallet } = useContext(WalletContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Input states
  const [fundAmount, setFundAmount] = useState<string>("0.01");
  const [bytesAmount, setBytesAmount] = useState<number>(1024); // 1KB default
  const [resultMessage, setResultMessage] = useState<string>("");
  
  // Result states
  const [balance, setBalance] = useState<string>("");
  const [uploadId, setUploadId] = useState<string>("");
  const [fundTx, setFundTx] = useState<string>("");
  const [priceEstimate, setPriceEstimate] = useState<string>("");
  const [irysAddress, setIrysAddress] = useState<string>("");
  
  // Check if connected to Irys
  const isConnected = data.irysUploader !== null;
  
  // Auto-fetch balance when connected
  useEffect(() => {
    if (isConnected) {
      handleCheckBalance();
    }
  }, [isConnected]);
  
  // Handle file upload
  const handleUpload = async () => {
    if (!isConnected) {
      setResultMessage("Please connect your wallet first");
      return;
    }
    
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setResultMessage("Please select a file");
      return;
    }
    const file = files[0];
    const fileSizeMB = file.size / (1024 * 1024);
    console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);
    try {
      setResultMessage("Uploading...");
      const receipt = await IrysActions.uploadData(data.irysUploader, files[0]);
      setUploadId(receipt.id);
      setResultMessage(`Upload successful!`);
      
      // Refresh balance after upload
      handleCheckBalance();
    } catch (error) {
      setResultMessage(`Upload failed: ${error.message}`);
    }
  };
  
  // Check balance
  const handleCheckBalance = async () => {
    if (!isConnected) {
      setResultMessage("Please connect your wallet first");
      return;
    }
    
    try {
      setResultMessage("Checking balance...");
      const balance = await IrysActions.checkBalance(data.irysUploader);
      setBalance(balance.toString());
      setResultMessage(`Balance checked successfully`);
    } catch (error) {
      setResultMessage(`Failed to check balance: ${error.message}`);
    }
  };
  
  // Fund account
  const handleFundAccount = async () => {
    if (!isConnected) {
      setResultMessage("Please connect your wallet first");
      return;
    }
    
    try {
      setResultMessage(`Funding account with ${fundAmount}...`);
      const fundTx = await IrysActions.fundAccount(data.irysUploader, fundAmount);
      setFundTx(JSON.stringify(fundTx, null, 2));
      setResultMessage(`Funding successful!`);
      
      // Refresh balance after funding
      handleCheckBalance();
    } catch (error) {
      setResultMessage(`Funding failed: ${error.message}`);
    }
  };
  
  // Get price estimation
  const handleGetPrice = async () => {
    if (!isConnected) {
      setResultMessage("Please connect your wallet first");
      return;
    }
    
    try {
      setResultMessage(`Getting price for ${bytesAmount} bytes...`);
      const price = await IrysActions.getPrice(data.irysUploader, bytesAmount);
      setPriceEstimate(price.toString());
      setResultMessage(`Price estimation retrieved`);
    } catch (error) {
      setResultMessage(`Failed to get price: ${error.message}`);
    }
  };
  
  // Get address
  const handleGetAddress = () => {
    if (!isConnected) {
      setResultMessage("Please connect your wallet first");
      return;
    }
    
    try {
      const address = IrysActions.getAddress(data.irysUploader);
      setIrysAddress(address);
      setResultMessage(`Address retrieved successfully`);
    } catch (error) {
      setResultMessage(`Failed to get address: ${error.message}`);
    }
  };

  return (
    <div className="test-irys-container" style={{margin: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px'}}>
      <h2>Test Irys Actions</h2>
      
      {!isConnected && (
        <div className="connection-section" style={{marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px'}}>
          <p>You need to connect your wallet first</p>
          <button onClick={connectWallet}>Connect Wallet</button>
        </div>
      )}
      
      <div className="status-section" style={{marginBottom: '20px'}}>
        <p><strong>Wallet Status:</strong> {walletStatus}</p>
        <p><strong>Irys Status:</strong> {irysStatus}</p>
        {balance && <p><strong>Current Balance:</strong> {balance}</p>}
        {irysAddress && <p><strong>Irys Address:</strong> {irysAddress}</p>}
      </div>
      
      <div className="actions-section" style={{display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px'}}>
        <div className="action-group" style={{flex: '1 1 300px', padding: '15px', border: '1px solid #eee', borderRadius: '4px'}}>
          <h3>Upload File</h3>
          <input 
            type="file" 
            ref={fileInputRef} 
            disabled={!isConnected} 
            style={{marginBottom: '10px'}}
          />
          <button onClick={handleUpload} disabled={!isConnected} style={{padding: '8px 16px'}}>
            Upload File
          </button>
          {uploadId && (
            <div style={{marginTop: '10px'}}>
              <p><strong>Transaction ID:</strong></p>
              <div style={{wordBreak: 'break-all', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
                {uploadId}
              </div>
            </div>
          )}
        </div>
        
        <div className="action-group" style={{flex: '1 1 300px', padding: '15px', border: '1px solid #eee', borderRadius: '4px'}}>
          <h3>Check Balance</h3>
          <button onClick={handleCheckBalance} disabled={!isConnected} style={{padding: '8px 16px'}}>
            Check Balance
          </button>
          {balance && (
            <div style={{marginTop: '10px'}}>
              <p><strong>Balance:</strong> {balance}</p>
            </div>
          )}
        </div>
        
        <div className="action-group" style={{flex: '1 1 300px', padding: '15px', border: '1px solid #eee', borderRadius: '4px'}}>
          <h3>Fund Account</h3>
          <div style={{marginBottom: '10px'}}>
            <input 
              type="text" 
              value={fundAmount} 
              onChange={(e) => setFundAmount(e.target.value)} 
              disabled={!isConnected} 
              placeholder="Amount (e.g., 0.01)" 
              style={{marginRight: '10px', padding: '8px'}}
            />
            <button onClick={handleFundAccount} disabled={!isConnected} style={{padding: '8px 16px'}}>
              Fund Account
            </button>
          </div>
          {fundTx && (
            <div style={{marginTop: '10px'}}>
              <p><strong>Funding Transaction:</strong></p>
              <pre style={{overflow: 'auto', maxHeight: '150px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
                {fundTx}
              </pre>
            </div>
          )}
        </div>
        
        <div className="action-group" style={{flex: '1 1 300px', padding: '15px', border: '1px solid #eee', borderRadius: '4px'}}>
          <h3>Get Price Estimation</h3>
          <div style={{marginBottom: '10px'}}>
            <input 
              type="number" 
              value={bytesAmount} 
              onChange={(e) => setBytesAmount(parseInt(e.target.value))} 
              disabled={!isConnected} 
              placeholder="Bytes (e.g., 1024)" 
              style={{marginRight: '10px', padding: '8px'}}
            />
            <button onClick={handleGetPrice} disabled={!isConnected} style={{padding: '8px 16px'}}>
              Get Price
            </button>
          </div>
          {priceEstimate && (
            <div style={{marginTop: '10px'}}>
              <p><strong>Price for {bytesAmount} bytes:</strong> {priceEstimate}</p>
            </div>
          )}
        </div>
        
        <div className="action-group" style={{flex: '1 1 300px', padding: '15px', border: '1px solid #eee', borderRadius: '4px'}}>
          <h3>Get Address</h3>
          <button onClick={handleGetAddress} disabled={!isConnected} style={{padding: '8px 16px'}}>
            Get Address
          </button>
          {irysAddress && (
            <div style={{marginTop: '10px'}}>
              <p><strong>Your Irys Address:</strong></p>
              <div style={{wordBreak: 'break-all', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
                {irysAddress}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="result-section" style={{padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px'}}>
        <h3>Operation Status:</h3>
        <p style={{color: resultMessage.includes('failed') ? 'red' : 'green'}}>{resultMessage}</p>
      </div>
    </div>
  );
}

export { TestIrysActionPage };