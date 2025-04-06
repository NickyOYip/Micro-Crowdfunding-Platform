import { useContext, useCallback } from 'react';
import { ethers } from 'ethers';
import { DataContext } from '../provider/dataProvider';

// ABI for the Factory contract
const factoryAbi = [
  "function getCampaigns() view returns (address[])",
  "function createCampaign(address owner, string title, string photoLink, string descriptionLink, uint256 targetAmount, uint256 deadline, uint256 milestoneCount, uint256[] milestoneAmounts, string[] milestoneTitles, string[] milestonePhotoLinks, string[] milestoneDescLinks) returns (address)",
  "event campaignCreated(address indexed owner, address indexed campaign)"
];

/**
 * Hook for interacting with the CampaignFactory contract
 */
const useFactory = () => {
  const { data } = useContext(DataContext);
  const { ethProvider, factoryAddress } = data;

  /**
   * Get the factory contract instance
   */
  const getFactoryContract = useCallback(() => {
    if (!ethProvider) throw new Error("Ethereum provider not connected");
    return new ethers.Contract(factoryAddress, factoryAbi, ethProvider);
  }, [ethProvider, factoryAddress]);

  /**
   * Get all campaigns created by the factory
   */
  const getCampaigns = useCallback(async () => {
    try {
      const contract = getFactoryContract();
      const campaigns = await contract.getCampaigns();
      return campaigns;
    } catch (error) {
      console.error("Error getting campaigns:", error);
      throw error;
    }
  }, [getFactoryContract]);

  /**
   * Create a new campaign
   */
  const createCampaign = useCallback(async ({
    title,
    photoLink,
    descriptionLink,
    targetAmount,
    deadline,
    milestones
  }) => {
    try {
      if (!ethProvider) throw new Error("Ethereum provider not connected");
      
      const signer = await ethProvider.getSigner();
      const owner = await signer.getAddress();
      
      const contract = new ethers.Contract(factoryAddress, factoryAbi, signer);
      
      const milestoneAmounts = milestones.map(m => m.releaseRatio);
      const milestoneTitles = milestones.map(m => m.title);
      const milestonePhotoLinks = milestones.map(m => m.photoLink);
      const milestoneDescLinks = milestones.map(m => m.descriptionLink);
      
      // Convert deadline to timestamp if it's a Date object
      const deadlineTimestamp = deadline instanceof Date 
        ? Math.floor(deadline.getTime() / 1000) 
        : deadline;
      
      // Convert target amount to wei
      const targetAmountWei = ethers.parseEther(targetAmount.toString());
      
      const tx = await contract.createCampaign(
        owner,
        title,
        photoLink,
        descriptionLink,
        targetAmountWei,
        deadlineTimestamp,
        milestones.length,
        milestoneAmounts,
        milestoneTitles,
        milestonePhotoLinks,
        milestoneDescLinks
      );
      
      const receipt = await tx.wait();
      
      // Find the campaignCreated event in the receipt logs
      const event = receipt.logs
        .map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(event => event && event.name === 'campaignCreated');
      
      if (!event) throw new Error("Couldn't find campaignCreated event");
      
      // Return the campaign address
      return event.args.campaign;
    } catch (error) {
      console.error("Error creating campaign:", error);
      throw error;
    }
  }, [ethProvider, factoryAddress]);

  /**
   * Listen for new campaign creation events
   */
  const listenToCampaignCreation = useCallback((callback) => {
    try {
      const contract = getFactoryContract();
      const filter = contract.filters.campaignCreated();
      
      const listener = (owner, campaign, event) => {
        callback({
          owner,
          campaign,
          transactionHash: event.log.transactionHash
        });
      };
      
      contract.on(filter, listener);
      
      // Return unsubscribe function
      return () => {
        contract.off(filter, listener);
      };
    } catch (error) {
      console.error("Error setting up campaign creation listener:", error);
      throw error;
    }
  }, [getFactoryContract]);

  return {
    getCampaigns,
    createCampaign,
    listenToCampaignCreation,
    factoryAddress
  };
};

export default useFactory;
