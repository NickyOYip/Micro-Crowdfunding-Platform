import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../provider/walletProvider';

const Login = () => {
  const navigate = useNavigate();
  const { walletStatus, irysStatus, connectWallet, changeReason } = useContext(WalletContext);
  const [walletAddress, setWalletAddress] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Extract wallet address and network when connected
  useEffect(() => {
    if (walletStatus.startsWith('Connected:')) {
      setIsConnected(true);
      
      // Extract wallet address and network from status string
      const statusParts = walletStatus.split(', Network: ');
      if (statusParts.length === 2) {
        const addressPart = statusParts[0].replace('Connected: ', '');
        setWalletAddress(addressPart);
        setNetworkName(statusParts[1]);
      }
    } else {
      setIsConnected(false);
    }
  }, [walletStatus]);
  
  const handleConnect = async () => {
    await connectWallet();
  };
  
  const handleConfirm = () => {
    navigate('/home');
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <h1 className="text-white text-4xl font-bold mb-8">Welcome To D-Micro Crowdfunding Platform</h1>
      
      {/* Show notification if user was redirected due to account or network change */}
      {changeReason && (
        <div className="mb-6 px-4 py-3 bg-yellow-700 text-yellow-100 rounded-md">
          <p className="font-medium">⚠️ {changeReason} detected! Please reconnect your wallet.</p>
        </div>
      )}
      
      {!isConnected ? (
        <button 
          onClick={handleConnect}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors mb-4"
        >
          Sign in with Browser Wallet
        </button>
      ) : (
        <button 
          onClick={handleConfirm}
          className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors mb-4"
        >
          Confirm & Continue
        </button>
      )}
      
      {/* Status Bar */}
      <div className={`mt-6 p-4 rounded-lg ${isConnected ? 'bg-gray-800' : 'bg-gray-900'} w-11/12 max-w-lg`}>
        <h2 className="text-white text-xl font-semibold mb-3">Connection Status</h2>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Provider:</span>
            <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
              {isConnected ? 'MetaMask' : 'Not Connected'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Address:</span>
            <span className={`text-green-400 ${isConnected ? '' : 'opacity-50'}`}>
              {walletAddress || 'Not Connected'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Network:</span>
            <span className={`text-green-400 ${isConnected ? '' : 'opacity-50'}`}>
              {networkName || 'Not Connected'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Irys Status:</span>
            <span className={irysStatus.startsWith('Connected') ? 'text-green-400' : 'text-yellow-400'}>
              {irysStatus.startsWith('Connected') ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>
      </div>
      
      {isConnected && (
        <div className="mt-4 text-green-400">
          Ready to start using the platform! Click "Confirm & Continue" to proceed.
        </div>
      )}
    </div>
  );
};

export default Login;