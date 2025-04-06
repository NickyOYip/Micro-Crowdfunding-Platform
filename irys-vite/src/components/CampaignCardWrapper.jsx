import { useState, useEffect } from 'react';
import CampaignCard from './CampaignCard';
import useCampaign from '../hooks/useCampaign';

const CampaignCardWrapper = ({ 
  address, 
  filter, 
  userAddress = null,
  isOwner = false,
  isDonor = false
}) => {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use the hook properly at the top level of a component
  const { getCampaignInfo, getUserTokens } = useCampaign(address);
  
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const info = await getCampaignInfo();
        
        // Calculate progress percentage
        const progress = parseFloat(info.raisedAmount) / parseFloat(info.targetRaisedAmount) * 100;
        
        // Get remaining time
        const now = new Date();
        const deadlineDate = new Date(info.deadline);
        
        // Calculate days left
        const diffTime = deadlineDate - now;
        const timeLeft = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
        
        // If userAddress is provided but isOwner/isDonor is not explicitly set,
        // detect ownership and donation status
        let ownerStatus = isOwner;
        let donorStatus = isDonor;
        
        if (userAddress && !isOwner) {
          ownerStatus = info.owner.toLowerCase() === userAddress.toLowerCase();
        }
        
        if (userAddress && !isDonor) {
          try {
            const tokenInfo = await getUserTokens(userAddress);
            donorStatus = tokenInfo.amount > 0;
          } catch (err) {
            console.error(`Error checking donations for campaign ${address}:`, err);
          }
        }
        
        setCampaign({
          address,
          ...info,
          progress: isNaN(progress) ? 0 : Math.min(progress, 100),
          timeLeft: timeLeft,
          deadlineFormatted: deadlineDate.toLocaleDateString(),
          isOwner: ownerStatus,
          isDonor: donorStatus
        });
        
      } catch (err) {
        console.error(`Error fetching campaign ${address}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaign();
  }, [address, getCampaignInfo, getUserTokens, userAddress, isOwner, isDonor]);

  // Handle filtering based on campaign status
  if (filter && campaign && campaign.status.toLowerCase() !== filter.toLowerCase() && filter !== 'all') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg p-4">
        <div className="h-48 bg-gray-700 animate-pulse mb-4 rounded"></div>
        <div className="h-4 bg-gray-700 animate-pulse w-3/4 mb-2 rounded"></div>
        <div className="h-2 bg-gray-700 animate-pulse w-full mb-4 rounded"></div>
        <div className="h-4 bg-gray-700 animate-pulse w-1/2 rounded"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg p-4">
        <p className="text-red-400">Error loading campaign</p>
        <p className="text-gray-500 text-sm mt-1 truncate">{address}</p>
        <p className="text-gray-500 text-sm mt-1">{error}</p>
      </div>
    );
  }
  
  return campaign ? <CampaignCard campaign={campaign} /> : null;
};

export default CampaignCardWrapper;
