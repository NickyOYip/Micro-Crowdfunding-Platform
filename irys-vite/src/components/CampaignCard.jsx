import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Status badges with appropriate colors
const StatusBadge = ({ status }) => {
  let bgColor = '';
  let textColor = '';

  switch (status?.toLowerCase()) {
    case 'active':
      bgColor = 'bg-green-500';
      textColor = 'text-green-100';
      break;
    case 'completed':
      bgColor = 'bg-blue-500';
      textColor = 'text-blue-100';
      break;
    case 'failed':
      bgColor = 'bg-red-500';
      textColor = 'text-red-100';
      break;
    default:
      bgColor = 'bg-gray-500';
      textColor = 'text-gray-100';
  }

  return (
    <span className={`${bgColor} ${textColor} text-xs font-medium py-1 px-2 rounded-full`}>
      {status || 'Unknown'}
    </span>
  );
};

// Utility function to truncate Ethereum addresses
const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const CampaignCard = ({ campaign }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Load image from Irys
  useEffect(() => {
    // Fetch image from Irys using the transaction ID
    if (campaign.photoLink) {
      // Irys gateway URL
      const irysGateway = 'https://gateway.irys.xyz/';
      setImageUrl(`${irysGateway}${campaign.photoLink}`);
      setLoading(false);
    } else {
      // Use placeholder if no image
      setImageUrl('https://placehold.co/400x200/333/FFF?text=No+Image');
      setLoading(false);
    }
  }, [campaign.photoLink]);

  // Function to copy address to clipboard
  const copyToClipboard = (e, text) => {
    e.preventDefault(); // Stop the link navigation
    e.stopPropagation(); // Prevent event bubbling
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <Link to={`/campaign/${campaign.address}`} className="block">
      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
        {/* Campaign Image */}
        <div className="relative h-48 overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 bg-gray-700 animate-pulse"></div>
          ) : (
            <img 
              src={imageUrl} 
              alt={campaign.title} 
              className="w-full h-full object-cover"
              onError={() => setImageUrl('https://placehold.co/400x200/333/FFF?text=Image+Error')}
            />
          )}
          <div className="absolute top-2 right-2">
            <StatusBadge status={campaign.status} />
          </div>
          
          {/* Owner/Donor Badge */}
          {(campaign.isOwner || campaign.isDonor) && (
            <div className="absolute bottom-2 right-2">
              {campaign.isOwner && (
                <span className="bg-purple-600 text-purple-100 text-xs font-medium py-1 px-2 rounded-full mr-1">
                  Owner
                </span>
              )}
              {campaign.isDonor && (
                <span className="bg-yellow-600 text-yellow-100 text-xs font-medium py-1 px-2 rounded-full">
                  Backer
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Campaign Content */}
        <div className="p-4">
          <h3 className="text-white font-bold text-lg mb-1 truncate">{campaign.title}</h3>
          
          {/* Owner Address - with copy button */}
          <div 
            className="flex items-center text-xs text-gray-400 mb-3 bg-gray-700 rounded-full px-2 py-1 cursor-pointer hover:bg-gray-600 transition-colors"
            onClick={(e) => copyToClipboard(e, campaign.owner)}
            title="Click to copy address"
          >
            <span className="bg-gray-600 rounded-full h-5 w-5 flex items-center justify-center mr-2">👤</span>
            <span className="font-mono">{truncateAddress(campaign.owner)}</span>
            <span className="ml-auto mr-1">
              {!copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-700 rounded-full mt-2 mb-4">
            <div 
              className={`h-full rounded-full ${campaign.progress >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
              style={{ width: `${campaign.progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-400">Raised</span>
            <span className="text-white">{campaign.raisedAmount} / {campaign.targetRaisedAmount} ETH</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Deadline</span>
            <span className="text-white">{campaign.deadlineFormatted}</span>
          </div>
          
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Time left</span>
            <span className="text-white">
              {campaign.timeLeft > 0 
                ? `${campaign.timeLeft} days` 
                : 'Ended'}
            </span>
          </div>
          
          {/* Milestone progress */}
          {campaign.milestoneCount > 0 && (
            <div className="mt-4 text-sm text-gray-400 flex justify-between">
              <span>Progress</span>
              <span>Milestone {Number(campaign.onMilestone) + 1} of {campaign.milestoneCount}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CampaignCard;