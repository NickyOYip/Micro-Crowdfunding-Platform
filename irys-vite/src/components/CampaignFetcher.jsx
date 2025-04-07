import { useState, useEffect } from 'react';
import useCampaign from '../hooks/useCampaign';
import CampaignCard from './CampaignCard';

const CampaignFetcher = ({ address }) => {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use the campaign hook
  const campaignHook = useCampaign(address);
  
  // Fetch campaign data
  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        const info = await campaignHook.getCampaignInfo();
        
        // Calculate progress percentage
        const progress = parseFloat(info.raisedAmount) / parseFloat(info.targetRaisedAmount) * 100;
        
        // Get remaining time
        const now = new Date();
        const deadlineDate = new Date(info.deadline);
        const timeLeft = deadlineDate > now ? 
          Math.floor((deadlineDate - now) / (1000 * 60 * 60 * 24)) : 
          0;
        
        setCampaign({
          address,
          ...info,
          progress: Math.min(progress, 100),
          timeLeft: timeLeft
        });
        
        setError(null);
      } catch (err) {
        console.error(`Error fetching campaign ${address}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaignData();
  }, [address, campaignHook]);
  
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
      </div>
    );
  }
  
  return campaign ? <CampaignCard campaign={campaign} /> : null;
};

export default CampaignFetcher;
