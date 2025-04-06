import { createContext, useState } from 'react';
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
    

    //network setting
    factoryAddress: '0x8C4d5D16a71Fc61eaE1289366467f19237d47660',
    // Store for campaign data
    campaigns: [], // Array of campaign addresses
    campaignDetails: {}, // Address -> details mapping
    
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
