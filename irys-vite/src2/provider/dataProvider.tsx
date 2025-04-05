import { createContext, useState } from 'react';
import { UserProfile } from './dataModel';
/**
 * @title DataContext
 * @notice Provides a context for the data store
 */
export const DataContext = createContext();



const DataProvider = ({ children }) => {
  // Initialize the global state
  const [data, setData] = useState({

    //wallet instance
    ethProvider: null, // ethers.BrowserProvider instance
    irysUploader: null, // Irys uploader instance
    

    //fetch by contract
    userContractAddress: null, 
    userProfile: new UserProfile({ owner: '', certificatesList: [], certifiedCertificates: [], history: [] }),

    //network setting
    factoryAddress: '0x8C4d5D16a71Fc61eaE1289366467f19237d47660',

    forcedNetwork: 'localGanache',// Change to 'ethereumMainnet' or 'sepolia' or 'localGanache' for testing

    networkOptions: {
      ethereumMainnet: {
        chainId: '0x1', // 1 in hexadecimal
        chainName: 'Ethereum Mainnet',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'], // Replace with your Infura Project ID
        blockExplorerUrls: ['https://etherscan.io'],
      },
      sepolia: {
        chainId: '0x10F3F', // 11155111 in hexadecimal
        chainName: 'Sepolia Testnet',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/demo'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      },      
      localGanache: {
        chainId: '0x539', // 1337 in hexadecimal
        chainName: 'Local Ganache',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['http://127.0.0.1:7545'],
        blockExplorerUrls: [], // Typically, no block explorer for local development
      },
    },
    
    // Add other global state variables here
  });

  /**
   * @notice Updates the global state
   * @param {Object} newData - New data to update the context with.
   * @dev This function is used to update global data like account, network, etc.
   */
  const updateData = (newData) => {
    setData((prevData) => ({ ...prevData, ...newData }));
  };

  return (
    /**
     * @title DataContext.Provider
     * @notice Provides the global state and update function to the children components
     */
    <DataContext.Provider value={{ data, updateData }}>
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
