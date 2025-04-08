import { createContext, useState } from 'react';


export const DataContext = createContext();



const DataProvider = ({ children }) => {
  // Initialize the global state
  const [data, setData] = useState({

    //wallet instance
    ethProvider: null, // ethers.BrowserProvider instance
    irysUploader: null, // Irys uploader instance
    

    //fetch by contract
    userContractAddress: null, 
    

    //network setting
    factoryAddress: '0xA70B3168a2Fe9403664B61D98e637c3F0de348a6', // Factory contract address on testnet
    // Store for campaign data
    campaigns: [], // Array of campaign addresses
    campaignDetails: {}, // Address -> details mapping
    
    // Add other global state variables here
  });


  const updateData = (newData) => {
    setData((prevData) => ({ ...prevData, ...newData }));
  };

  return (
  
    <DataContext.Provider value={{ data, updateData }}>
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
