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
    factoryAddress: '0x193bC2D42d8245E1E5bffAe9E1Ec47Fa19935DF9', // Factory contract address on testnet
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
