import { useState, useEffect } from 'react';
import CampaignCard from './CampaignCard';
import useCampaign from '../hooks/useCampaign';

const CampaignCardWrapper = ({ address, filter }) => {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Properly use the useCampaign hook at the top level of the component
  const { getCampaignInfo } = useCampaign(address);
  
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const info = await getCampaignInfo();
        console.log(`Campaign ${address} deadline:`, info.deadline);
        
        // Calculate progress percentage
        const progress = parseFloat(info.raisedAmount) / parseFloat(info.targetRaisedAmount) * 100;
        
        // Get remaining time
        const now = new Date();
        const deadlineDate = new Date(info.deadline);
        console.log(`Now: ${now.toISOString()}, Deadline: ${deadlineDate.toISOString()}`);
        
        // Calculate days left
        const diffTime = deadlineDate - now;
        const timeLeft = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
        
        setCampaign({
          address,
          ...info,
          progress: isNaN(progress) ? 0 : Math.min(progress, 100),
          timeLeft: timeLeft,
          deadlineFormatted: deadlineDate.toLocaleDateString()
        });
      } catch (err) {
        console.error(`Error fetching campaign ${address}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaign();
  }, [address, getCampaignInfo]);

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

  // If we have campaign data and a filter is active, check if the campaign matches the filter
  if (campaign && filter !== 'all' && campaign.status && campaign.status.toLowerCase() !== filter.toLowerCase()) {
    return null; // Don't render this campaign if it doesn't match the filter
  }
  
  return campaign ? <CampaignCard campaign={campaign} /> : null;
};

export default CampaignCardWrapper;
