import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { DataContext } from '../provider/dataProvider';
import { WalletContext } from '../provider/walletProvider';
import useCampaign from '../hooks/useCampaign';
import { getIrysUrl, fetchIrysText, uploadFile, uploadText } from '../utils/irysUtils';
import { ethers } from 'ethers';

// Helper function to truncate Ethereum addresses
const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Helper to format dates nicely
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const CampaignDetail = () => {
  const { campaignAddress } = useParams();
  const { data } = useContext(DataContext);
  const { walletStatus, connectWallet } = useContext(WalletContext);
  const { ethProvider } = data;

  // Campaign data states
  const [campaign, setCampaign] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [userTokens, setUserTokens] = useState({ amount: 0, tokenValue: 0 });
  const [isOwner, setIsOwner] = useState(false);
  const [isDonor, setIsDonor] = useState(false);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [donationAmount, setDonationAmount] = useState('');
  const [donating, setDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [success, setSuccess] = useState('');

  // Content states
  const [campaignImageUrl, setCampaignImageUrl] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [milestoneContents, setMilestoneContents] = useState({});
  const [milestoneImageUrls, setMilestoneImageUrls] = useState({});
  const [proofData, setProofData] = useState({ 
    title: '', 
    description: '',
    image: null,
    photoLink: '',
    descriptionLink: ''
  });
  const [submittingProof, setSubmittingProof] = useState(false);
  const [showProofForm, setShowProofForm] = useState(false);

  // Add new states for voting process
  const [isVoting, setIsVoting] = useState(false);
  const [votingType, setVotingType] = useState(null); // 'approve' or 'reject'

  // Use the custom hook for campaign interactions
  const campaignHook = useCampaign(campaignAddress);

  // Load campaign data
  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!ethProvider || !campaignAddress) {
        setLoading(false);
        return;
      }

      try {
        // We don't use setLoading(true) here as it causes a UI flashing bug
        
        // Get campaign info
        const campaignInfo = await campaignHook.getCampaignInfo();
        setCampaign(campaignInfo);

        // Get milestone info
        const milestonesInfo = await campaignHook.getAllMilestones();
        setMilestones(milestonesInfo);
        
        // Check if current user is the owner
        const signer = await ethProvider.getSigner();
        const userAddress = await signer.getAddress();
        setIsOwner(userAddress.toLowerCase() === campaignInfo.owner.toLowerCase());
        
        // Check if user has tokens (donated)
        const tokens = await campaignHook.getUserTokens(userAddress);
        setUserTokens(tokens);
        setIsDonor(tokens.amount > 0);
        
        // Fetch campaign content
        await fetchCampaignContent(campaignInfo);
        
        // Fetch milestone content
        await fetchMilestoneContent(milestonesInfo);
        
      } catch (err) {
        console.error("Error fetching campaign data:", err);
        setError(`Error loading campaign: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [ethProvider, campaignAddress, campaignHook]);

  // Fetch campaign content
  const fetchCampaignContent = async (campaignInfo) => {
    try {
      // Set campaign image URL
      setCampaignImageUrl(getIrysUrl(campaignInfo.photoLink));
      
      // Fetch campaign description
      if (campaignInfo.descriptionLink) {
        const descText = await fetchIrysText(campaignInfo.descriptionLink);
        setCampaignDescription(descText);
      }
    } catch (err) {
      console.error("Error fetching campaign content:", err);
    }
  };

  // Fetch milestone content
  const fetchMilestoneContent = async (milestonesInfo) => {
    try {
      const contents = {};
      const imageUrls = {};
      
      for (const [index, milestone] of milestonesInfo.entries()) {
        // Proposal description
        if (milestone.proposalInfo.descriptionLink) {
          const text = await fetchIrysText(milestone.proposalInfo.descriptionLink);
          contents[`proposal-${index}`] = text || 'No description available';
        }
        
        // Proposal image
        if (milestone.proposalInfo.photoLink) {
          imageUrls[`proposal-${index}`] = getIrysUrl(milestone.proposalInfo.photoLink);
        }
        
        // Proof description
        if (milestone.proofInfo.descriptionLink) {
          const text = await fetchIrysText(milestone.proofInfo.descriptionLink);
          contents[`proof-${index}`] = text || 'No proof description available';
        }
        
        // Proof image
        if (milestone.proofInfo.photoLink) {
          imageUrls[`proof-${index}`] = getIrysUrl(milestone.proofInfo.photoLink);
        }
      }
      
      setMilestoneContents(contents);
      setMilestoneImageUrls(imageUrls);
      
    } catch (err) {
      console.error("Error fetching milestone content:", err);
    }
  };

  // Handle donation submission
  const handleDonate = async (e) => {
    e.preventDefault();
    
    if (!ethProvider || !campaignAddress || !donationAmount) {
      return;
    }

    try {
      setDonating(true);
      setError(null);
      
      await campaignHook.donate(donationAmount);
      
      // Update user tokens
      const signer = await ethProvider.getSigner();
      const userAddress = await signer.getAddress();
      const tokens = await campaignHook.getUserTokens(userAddress);
      
      setUserTokens(tokens);
      setIsDonor(tokens.amount > 0);
      setDonationSuccess(true);
      setDonationAmount('');
      
      // Refresh campaign data
      const campaignInfo = await campaignHook.getCampaignInfo();
      setCampaign(campaignInfo);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setDonationSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error("Error donating:", err);
      setError(`Failed to donate: ${err.message}`);
    } finally {
      setDonating(false);
    }
  };

  const copyAddressToClipboard = () => {
    if (campaign?.owner) {
      navigator.clipboard.writeText(campaign.owner);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const voteOnMilestone = async (approve) => {
    if (!ethProvider || !campaignAddress) return;

    try {
      setIsVoting(true);
      setVotingType(approve ? 'approve' : 'reject');
      setError(null);
      
      await campaignHook.castVote(approve);
      
      // Refresh milestones
      const milestonesInfo = await campaignHook.getAllMilestones();
      setMilestones(milestonesInfo);
      
      setSuccess(`Vote submitted successfully! Your vote: ${approve ? 'Approve' : 'Reject'}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error voting:", err);
      setError(`Failed to vote: ${err.message}`);
    } finally {
      setIsVoting(false);
      setVotingType(null);
    }
  };

  const requestVoting = async () => {
    if (!ethProvider || !campaignAddress || !isOwner) return;

    try {
      setLoading(true);
      await campaignHook.requestVoting();
      
      // Refresh milestones
      const milestonesInfo = await campaignHook.getAllMilestones();
      setMilestones(milestonesInfo);
    } catch (err) {
      console.error("Error requesting voting:", err);
      setError(`Failed to request voting: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const releaseFunds = async (milestoneId) => {
    if (!ethProvider || !campaignAddress || !isOwner) return;

    try {
      setLoading(true);
      await campaignHook.releaseFunds(milestoneId);
      
      // Refresh campaign and milestones
      const campaignInfo = await campaignHook.getCampaignInfo();
      setCampaign(campaignInfo);
      const milestonesInfo = await campaignHook.getAllMilestones();
      setMilestones(milestonesInfo);
    } catch (err) {
      console.error("Error releasing funds:", err);
      setError(`Failed to release funds: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const requestRefund = async () => {
    if (!ethProvider || !campaignAddress || !isDonor) return;

    try {
      setLoading(true);
      await campaignHook.requestRefund();
      
      // Update user tokens
      const signer = await ethProvider.getSigner();
      const userAddress = await signer.getAddress();
      const tokens = await campaignHook.getUserTokens(userAddress);
      
      setUserTokens(tokens);
      setIsDonor(tokens.amount > 0);
      
      // Refresh campaign
      const campaignInfo = await campaignHook.getCampaignInfo();
      setCampaign(campaignInfo);
    } catch (err) {
      console.error("Error requesting refund:", err);
      setError(`Failed to request refund: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle proof file change
  const handleProofFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProofData({ ...proofData, image: file });
  };

  // Submit proof with Irys upload
  const submitProofWithUpload = async (milestoneId) => {
    if (!ethProvider || !campaignAddress || !isOwner) return;
    
    try {
      setSubmittingProof(true);
      setError(null);
      
      // Check if we have access to the Irys uploader
      if (!data.irysUploader) {
        throw new Error('Irys uploader not initialized. Please reconnect your wallet.');
      }
      
      setSuccess('Preparing to upload proof...');
      
      // Upload proof image to Irys if provided
      let photoLink = '';
      if (proofData.image) {
        setSuccess('Uploading proof image...');
        const receipt = await uploadFile(data.irysUploader, proofData.image);
        photoLink = receipt.id;
        console.log('Image uploaded with ID:', photoLink);
      }
      
      // Upload proof description to Irys
      setSuccess('Uploading proof description...');
      const descReceipt = await uploadText(data.irysUploader, proofData.description);
      const descriptionLink = descReceipt.id;
      console.log('Description uploaded with ID:', descriptionLink);
      
      // Submit proof to contract
      setSuccess('Submitting proof to blockchain...');
      await campaignHook.submitMilestoneProof(
        milestoneId,
        proofData.title,
        photoLink,
        descriptionLink
      );
      
      // Refresh milestone data
      const milestonesInfo = await campaignHook.getAllMilestones();
      setMilestones(milestonesInfo);
      await fetchMilestoneContent(milestonesInfo);
      
      // Reset form
      setProofData({ 
        title: '', 
        description: '',
        image: null,
        photoLink: '',
        descriptionLink: ''
      });
      setShowProofForm(false);
      
      setSuccess('Milestone proof submitted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error submitting proof:', err);
      setError(`Failed to submit proof: ${err.message}`);
    } finally {
      setSubmittingProof(false);
    }
  };

  // Calculate progress percentage
  const progressPercentage = campaign ? 
    Math.min((parseFloat(campaign.raisedAmount) / parseFloat(campaign.targetRaisedAmount)) * 100, 100) : 0;

  // Calculate days left
  const daysLeft = campaign ? 
    Math.max(0, Math.floor((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  // Milestone section with photos
  const renderMilestones = () => (
    <div className="space-y-6">
      {milestones.map((milestone, index) => (
        <div 
          key={index} 
          className={`bg-gray-700 p-6 rounded-lg ${index === campaign.onMilestone ? 'border-2 border-blue-500' : ''}`}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold flex items-center">
              {index === campaign.onMilestone && (
                <span className="mr-2 text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 000 16zm3.707-9.293a1 1 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              Milestone {index + 1}: {milestone.proposalInfo.title}
            </h3>
            <div className="flex items-center">
              <span className="text-sm mr-2">{milestone.releaseRatio}%</span>
              <div className={`text-xs font-medium py-1 px-2 rounded-full 
                ${milestone.status === 'Active' ? 'bg-yellow-500 text-yellow-100' : 
                 milestone.status === 'Completed' ? 'bg-green-500 text-green-100' : 
                 'bg-red-500 text-red-100'}`}
              >
                {milestone.status}
              </div>
            </div>
          </div>
          {/* Display milestone proposal image if available */}
          {milestoneImageUrls[`proposal-${index}`] && (
            <div className="mt-4 mb-4">
              <img 
                src={milestoneImageUrls[`proposal-${index}`]} 
                alt={`Milestone ${index + 1} visual`}
                className="rounded-lg max-h-64 mx-auto"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          {/* Display milestone description */}
          <div className="mt-4 text-gray-300">
            <div className="whitespace-pre-wrap">
              {milestoneContents[`proposal-${index}`] || 'No description available'}
            </div>
          </div>
          {/* Voting section */}
          {milestone.votingDeadline && (
            <div className="mt-6 bg-gray-800 p-4 rounded-lg">
              <h4 className="font-bold mb-2">Milestone Voting</h4>
              
              {new Date(milestone.votingDeadline) > new Date() ? (
                // Active voting
                <div>
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Voting ends: {formatDate(milestone.votingDeadline)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-sm text-gray-400">Approve</div>
                      <div className="font-bold">{milestone.approveVotes}</div>
                    </div>
                    <div className="bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-sm text-gray-400">Reject</div>
                      <div className="font-bold">{milestone.rejectVotes}</div>
                    </div>
                    <div className="bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-sm text-gray-400">Not Voted</div>
                      <div className="font-bold">{milestone.notVoteYetVotes}</div>
                    </div>
                  </div>
                  {isDonor && index === campaign.onMilestone && (
                    <div className="flex mt-4 space-x-2">
                      <button 
                        id="approve-vote-btn"
                        name="approve-vote"
                        onClick={() => voteOnMilestone(true)}
                        className="flex-1 bg-green-600 hover:bg-green-700 py-2 px-4 rounded flex items-center justify-center"
                        disabled={isVoting}
                      >
                        {isVoting && votingType === 'approve' ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 08-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 04 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Approving...
                          </>
                        ) : "Approve"}
                      </button>
                      <button 
                        id="reject-vote-btn"
                        name="reject-vote"
                        onClick={() => voteOnMilestone(false)}
                        className="flex-1 bg-red-600 hover:bg-red-700 py-2 px-4 rounded flex items-center justify-center"
                        disabled={isVoting}
                      >
                        {isVoting && votingType === 'reject' ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 08-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 04 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Rejecting...
                          </>
                        ) : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Voting ended
                <div className="text-center">
                  <div className="text-gray-400">
                    Voting has ended
                    {milestone.status === 'Completed' && (
                      <span className="text-green-400 block mt-1">
                        This milestone was approved!
                      </span>
                    )}
                    {milestone.status === 'Failed' && (
                      <span className="text-red-400 block mt-1">
                        This milestone was rejected.
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-sm text-gray-400">Approve</div>
                      <div className="font-bold">{milestone.approveVotes}</div>
                    </div>
                    <div className="bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-sm text-gray-400">Reject</div>
                      <div className="font-bold">{milestone.rejectVotes}</div>
                    </div>
                    <div className="bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-sm text-gray-400">Not Voted</div>
                      <div className="font-bold">{milestone.notVoteYetVotes}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Proof section */}
          {milestone.proofInfo.title && (
            <div className="mt-6 bg-gray-800 p-4 rounded-lg">
              <h4 className="font-bold mb-2">Milestone Proof</h4>
              <div className="text-gray-300">
                <div className="font-bold">{milestone.proofInfo.title}</div>
                {/* Display proof image if available */}
                {milestoneImageUrls[`proof-${index}`] && (
                  <div className="mt-3 mb-3">
                    <img 
                      src={milestoneImageUrls[`proof-${index}`]} 
                      alt="Proof visual"
                      className="rounded-lg max-h-64 mx-auto"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="whitespace-pre-wrap mt-2">
                  {milestoneContents[`proof-${index}`] || 'No proof description available'}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Rest of the component rendering logic follows...
  if (!ethProvider) {
    return (
      <div className="ml-64 p-8 text-white">
        <div className="bg-gray-800 p-8 rounded-xl max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Campaign Details</h1>
          <div className="bg-yellow-800/30 text-yellow-100 p-6 rounded-lg text-center">
            <p className="mb-4">Please connect your wallet to view campaign details</p>
            <button 
              id="connect-wallet-btn"
              name="connect-wallet"
              onClick={connectWallet}
              className="bg-yellow-700 hover:bg-yellow-600 py-2 px-4 rounded"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ml-64 p-8 text-white">
        <div className="bg-gray-800 p-8 rounded-xl max-w-5xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading campaign details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-64 p-8 text-white">
        <div className="bg-gray-800 p-8 rounded-xl max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Campaign Details</h1>
          <div className="bg-red-900/30 text-red-100 p-6 rounded-lg">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-700 hover:bg-red-600 py-2 px-4 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="ml-64 p-8 text-white">
        <div className="bg-gray-800 p-8 rounded-xl max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Campaign Not Found</h1>
          <p className="text-gray-400">
            The campaign you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 p-8 text-white">
      <div className="bg-gray-800 p-8 rounded-xl max-w-5xl mx-auto">
        
        {/* Campaign header */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Campaign image */}
          <div className="md:w-1/3">
            <div className="rounded-lg overflow-hidden bg-gray-700 h-64">
              {campaignImageUrl ? (
                <img 
                  src={campaignImageUrl} 
                  alt={campaign.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x400/333/FFF?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No image available
                </div>
              )}
            </div>
          </div>
          {/* Campaign details */}
          <div className="md:w-2/3">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">{campaign.title}</h1>
              <span className={`text-xs font-medium py-1 px-2 rounded-full 
                ${campaign.status === 'Active' ? 'bg-green-500 text-green-100' : 
                 campaign.status === 'Completed' ? 'bg-blue-500 text-blue-100' : 
                 'bg-red-500 text-red-100'}`}
              >
                {campaign.status}
              </span>
            </div>
            {/* Add campaign address display */}
            <div className="bg-gray-700/50 rounded-lg px-3 py-2 mb-3 text-sm flex items-center justify-between">
              <span className="text-gray-300">Campaign Address:</span>
              <div className="flex items-center">
                <span className="font-mono text-gray-200">{truncateAddress(campaignAddress)}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(campaignAddress);
                    setCopiedAddress(true);
                    setTimeout(() => setCopiedAddress(false), 2000);
                  }}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  {copiedAddress ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 00 002-2V5a2 2 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {/* Owner info with copy button */}
            <div 
              onClick={copyAddressToClipboard}
              className="bg-gray-700 rounded-full px-3 py-1 text-sm flex items-center w-fit mb-4 cursor-pointer hover:bg-gray-600"
              title={campaign.owner}
            >
              <span className="mr-2">👤</span>
              <span className="font-mono">{truncateAddress(campaign.owner)}</span>
              <span className="ml-2">
                {!copiedAddress ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 01-2-2V6a2 2 012-2h8a2 2 012 2v2m-6 12h8a2 2 002-2v-8a2 2 00-2-2h-8a2 2 00-2 2v8a2 2 002 2z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </div>
            {/* Campaign stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Raised</div>
                <div className="text-xl font-bold">{campaign.raisedAmount} / {campaign.targetRaisedAmount} ETH</div>
                <div className="w-full h-2 bg-gray-600 rounded-full mt-2">
                  <div 
                    className={`h-full rounded-full ${progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Time Left</div>
                <div className="text-xl font-bold">
                  {daysLeft > 0 ? `${daysLeft} days` : 'Ended'}
                </div>
                <div className="text-sm text-gray-400 mt-2">Ends: {formatDate(campaign.deadline)}</div>
              </div>
            </div>
            {/* Milestone progress */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between">
                <div className="text-sm text-gray-400">Milestone Progress</div>
                <div className="text-sm">{campaign.onMilestone + 1} of {campaign.milestoneCount}</div>
              </div>
              <div className="w-full h-2 bg-gray-600 rounded-full mt-2">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${((campaign.onMilestone) / campaign.milestoneCount) * 100}%` }}
                ></div>
              </div>
            </div>
            {/* User actions */}
            <div className="mt-6">
              {campaign.status === 'Active' && !isOwner && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Support this campaign</h3>
                  <form onSubmit={handleDonate} className="flex items-center">
                    <input 
                      id="donation-amount"
                      name="donation-amount"
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="ETH amount"
                      className="bg-gray-800 p-2 rounded-lg flex-grow"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      disabled={donating}
                      required
                    />
                    <button 
                      id="donate-btn"
                      name="donate"
                      type="submit"
                      className="ml-2 bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg disabled:opacity-50"
                      disabled={donating}
                    >
                      {donating ? 'Processing...' : 'Donate'}
                    </button>
                  </form>
                  {donationSuccess && (
                    <div className="mt-2 text-green-400">
                      Thank you for your donation!
                    </div>
                  )}
                  {isDonor && (
                    <div className="mt-2 text-sm text-gray-400">
                      You have {userTokens.amount} tokens in this campaign
                    </div>
                  )}
                </div>
              )}
              {isDonor && campaign.status === 'Failed' && (
                <div className="mt-4">
                  <button
                    id="refund-btn"
                    name="refund"
                    onClick={requestRefund}
                    className="bg-red-600 hover:bg-red-700 py-2 px-4 rounded-lg"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Request Refund'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Navigation tabs */}
        <div className="flex border-b border-gray-700 mt-8">
          <button
            id="details-tab"
            name="details-tab"
            className={`py-2 px-4 ${activeTab === 'details' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            id="milestones-tab"
            name="milestones-tab"
            className={`py-2 px-4 ${activeTab === 'milestones' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('milestones')}
          >
            Milestones
          </button>
          {isOwner && (
            <button
              id="manage-tab"
              name="manage-tab"
              className={`py-2 px-4 ${activeTab === 'manage' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('manage')}
            >
              Manage
            </button>
          )}
        </div>
        {/* Tab content */}
        <div className="mt-6">
          {/* Details tab */}
          {activeTab === 'details' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Campaign Description</h2>
              <div className="bg-gray-700 p-6 rounded-lg">
                <div className="whitespace-pre-wrap">
                  {campaignDescription || 'No description available.'}
                </div>
              </div>
              {/* Additional details, updates, etc */}
              {isDonor && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-2">Your Contribution</h3>
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Tokens</div>
                        <div className="text-xl font-bold">{userTokens.amount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Token Value</div>
                        <div className="text-xl font-bold">{ethers.formatUnits(userTokens.tokenValue.toString(), 'gwei')} ETH</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Milestones tab */}
          {activeTab === 'milestones' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Project Milestones</h2>
              {renderMilestones()}
            </div>
          )}
          {/* Owner management tab */}
          {activeTab === 'manage' && isOwner && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Manage Campaign</h2>
              
              {campaign.status === 'Active' && (
                <div className="space-y-6">
                  {/* Current milestone management */}
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-2">
                      Current Milestone: {milestones[campaign.onMilestone]?.proposalInfo.title || 'Loading...'}
                    </h3>
                    {milestones[campaign.onMilestone]?.status === 'Completed' ? (
                      <div>
                        <div className="bg-green-600/20 p-4 rounded-lg mb-4">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 000-16 8 8 000 16zm3.707-9.293a1 1 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>This milestone has been approved!</span>
                          </div>
                        </div>
                        <button
                          id="release-funds-btn"
                          name="release-funds"
                          onClick={() => releaseFunds(campaign.onMilestone)}
                          className="bg-green-600 hover:bg-green-700 py-2 px-4 rounded"
                          disabled={loading}
                        >
                          Release Funds ({milestones[campaign.onMilestone]?.releaseRatio}%)
                        </button>
                      </div>
                    ) : milestones[campaign.onMilestone]?.status === 'Failed' ? (
                      <div className="bg-red-600/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 100-16 8 8 000 16zM8.707 7.293a1 1 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 101.414 1.414L10 11.414l1.293 1.293a1 1 001.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span>This milestone was rejected by donors.</span>
                        </div>
                      </div>
                    ) : milestones[campaign.onMilestone]?.votingDeadline ? (
                      <div>
                        <div className="bg-blue-600/20 p-4 rounded-lg">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 10.5a1.5 1.5 113 0v6a1.5 1.5 01-3 0v-6zM6 10.333v5.43a2 2 001.106 1.79l.05.025A4 4 008.943 18h5.416a2 2 001.962-1.608l1.2-6A2 2 0015.56 8H12V4a2 2 00-2-2 1 1 00-1 1v.667a4 4 01-.8 2.4L6.8 7.933a4 4 00-.8 2.4z" />
                            </svg>
                            <span>Voting is in progress until {formatDate(milestones[campaign.onMilestone].votingDeadline)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* If no proof submitted yet */}
                        {!milestones[campaign.onMilestone]?.proofInfo.title ? (
                          <div>
                            <p className="mb-4 text-gray-300">
                              Submit proof of completion for this milestone to initiate voting.
                            </p>
                            
                            {!showProofForm ? (
                              <button
                                id="show-proof-form-btn"
                                name="show-proof-form"
                                onClick={() => setShowProofForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded"
                              >
                                Submit Proof of Completion
                              </button>
                            ) : (
                              <div className="bg-gray-800 p-4 rounded-lg mt-4">
                                <h4 className="text-lg font-semibold mb-4">Submit Milestone Proof</h4>
                                
                                <div className="space-y-4">
                                  <div>
                                    <label htmlFor="proof-title" className="block mb-1 text-sm">Title *</label>
                                    <input
                                      id="proof-title"
                                      name="proof-title"
                                      type="text"
                                      className="w-full bg-gray-700 p-2 rounded border border-gray-600"
                                      placeholder="Brief title for your proof"
                                      value={proofData.title}
                                      onChange={(e) => setProofData({...proofData, title: e.target.value})}
                                      disabled={submittingProof}
                                      required
                                    />
                                  </div>
                                  
                                  <div>
                                    <label htmlFor="proof-description" className="block mb-1 text-sm">Description *</label>
                                    <textarea
                                      id="proof-description"
                                      name="proof-description"
                                      className="w-full bg-gray-700 p-2 rounded border border-gray-600 h-24"
                                      placeholder="Describe how you completed this milestone"
                                      value={proofData.description}
                                      onChange={(e) => setProofData({...proofData, description: e.target.value})}
                                      disabled={submittingProof}
                                      required
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block mb-1 text-sm">Proof Image (Optional)</label>
                                    <div className="bg-gray-700 p-3 rounded-lg border border-dashed border-gray-500">
                                      <input
                                        id="proof-image"
                                        name="proof-image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProofFileChange}
                                        className="hidden"
                                        disabled={submittingProof}
                                      />
                                      <label 
                                        htmlFor="proof-image" 
                                        className="cursor-pointer text-gray-400 flex items-center justify-center h-20"
                                      >
                                        {proofData.image ? (
                                          <div className="flex items-center">
                                            <span className="mr-2">{proofData.image.name}</span>
                                            <img 
                                              src={URL.createObjectURL(proofData.image)} 
                                              alt="Preview" 
                                              className="h-16 w-auto" 
                                            />
                                          </div>
                                        ) : (
                                          <div className="text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 012.828 0L16 16m-2-2l1.586-1.586a2 2 012.828 0L20 14m-6-6h.01M6 20h12a2 2 002-2V6a2 2 00-2-2H6a2 2 00-2 2v12a2 2 002 2z" />
                                            </svg>
                                            <span>Upload Image</span>
                                          </div>
                                        )}
                                      </label>
                                    </div>
                                  </div>
                                  
                                  <div className="flex space-x-3">
                                    <button
                                      type="button"
                                      onClick={() => setShowProofForm(false)}
                                      className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 px-4 rounded"
                                      disabled={submittingProof}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => submitProofWithUpload(campaign.onMilestone)}
                                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded flex items-center justify-center"
                                      disabled={submittingProof || !proofData.title || !proofData.description}
                                    >
                                      {submittingProof ? (
                                        <>
                                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 08-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 04 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                          Submitting...
                                        </>
                                      ) : (
                                        'Submit Proof'
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="mb-4 text-gray-300">
                              Proof submitted. Start the voting process when you're ready.
                            </p>
                            <button
                              id="start-voting-btn"
                              name="start-voting"
                              onClick={requestVoting}
                              className="bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded"
                              disabled={loading}
                            >
                              Start Voting Process
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Campaign statistics */}
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Campaign Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Creation Date</div>
                        <div className="font-bold">{formatDate(new Date(campaign.creationTime))}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Total Donors</div>
                        <div className="font-bold">Not available</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* If campaign not active */}
              {campaign.status !== 'Active' && (
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">Campaign Status: {campaign.status}</h3>
                  <p className="text-gray-300">
                    {campaign.status === 'Completed' ? (
                      "This campaign has been successfully completed. No further actions are required."
                    ) : (
                      "This campaign has failed or has been cancelled. No further actions are available."
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {success && (
        <div className="bg-green-800/30 text-green-100 p-4 mb-4 rounded-lg absolute top-4 right-4 max-w-xs">
          {success}
        </div>
      )}
    </div>
  );
};

export default CampaignDetail;
