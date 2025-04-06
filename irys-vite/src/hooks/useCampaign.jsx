import { useContext, useCallback } from 'react';
import { ethers } from 'ethers';
import { DataContext } from '../provider/dataProvider';

// ABI for the Campaign contract (partial - covering main functions)
const campaignAbi = [
  // Campaign info
  "function getInfo() view returns (tuple(address owner, string title, string photoLink, string descriptionLink, uint256 raisedAmount, uint256 targetRaisedAmount, uint256 deadline, uint8 status, uint256 onMilestone, uint256 milestoneCount))",
  "function getMilestoneInfo(uint256 milestoneId) view returns (tuple(uint256 releaseRatio, uint8 status, tuple(string title, string photoLink, string descriptionLink) proposalInfo, tuple(string title, string photoLink, string descriptionLink) proofInfo, uint256 votingDeadline, uint256 approveVotes, uint256 rejectVotes, uint256 notVoteYetVotes, uint8 userVote))",
  "function getAllMilestones() view returns (tuple(uint256 releaseRatio, uint8 status, tuple(string title, string photoLink, string descriptionLink) proposalInfo, tuple(string title, string photoLink, string descriptionLink) proofInfo, uint256 votingDeadline, uint256 approveVotes, uint256 rejectVotes, uint256 notVoteYetVotes, uint8 userVote)[])",
  
  // Actions
  "function donate() payable",
  "function submitMilestoneProof(uint256 milestoneId, string _title, string _photoLink, string _descriptionLink)",
  "function requestVoting()",
  "function castVoteOnMilestone(bool approve)",
  "function getVotingResult(uint256 milestoneId) returns (uint256 approveVotes, uint256 rejectVotes, uint256 notVoteYetVotes)",
  "function getToken(address donorAddress) view returns (uint256 amount, uint256)",
  "function releaseFunds(uint256 milestoneId)",
  "function requestRefund()",
  
  // Events
  "event userDonated(address indexed user, address indexed campaign)",
  "event refund(address indexed donor, address indexed campaign, uint256 milestoneId)",
  "event newStatus(address indexed campaign, uint8 status)",
  "event newMilestoneStatus(address indexed campaign, uint256 milestoneId, uint8 status)",
  "event moveToNextMilestone(address indexed campaign, uint256 milestoneId)",
  "event milestoneProofSubmited(address indexed owner, address indexed campaign, uint256 milestoneId)",
  "event startVoting(address indexed owner, address indexed campaign, uint256 milestoneId)",
  "event voteOnMilestone(address indexed user, address indexed campaign, uint256 milestoneId)",
  "event votingResult(address indexed campaign, uint256 milestoneId, uint256 approveVotes, uint256 rejectVotes, uint256 NotVoteYetVotes)",
  "event releaseFundsToOwner(address indexed owner, address indexed campaign, uint256 milestoneId, uint256 amount)"
];

// Status enum mapping
const statusMap = ["Active", "Completed", "Failed"];
const voteOptionMap = ["Approve", "Reject", "NotVoteYet"];

/**
 * Hook for interacting with a specific Campaign contract
 * @param {string} campaignAddress - Address of the campaign contract
 */
const useCampaign = (campaignAddress) => {
  const { data } = useContext(DataContext);
  const { ethProvider } = data;

  /**
   * Get the campaign contract instance
   */
  const getCampaignContract = useCallback(() => {
    if (!ethProvider) throw new Error("Ethereum provider not connected");
    if (!campaignAddress) throw new Error("Campaign address not provided");
    return new ethers.Contract(campaignAddress, campaignAbi, ethProvider);
  }, [ethProvider, campaignAddress]);

  /**
   * Get a signer campaign contract (for transactions)
   */
  const getSignerContract = useCallback(async () => {
    if (!ethProvider) throw new Error("Ethereum provider not connected");
    if (!campaignAddress) throw new Error("Campaign address not provided");
    const signer = await ethProvider.getSigner();
    return new ethers.Contract(campaignAddress, campaignAbi, signer);
  }, [ethProvider, campaignAddress]);

  /**
   * Format campaign info from blockchain format
   */
  const formatCampaignInfo = useCallback((info) => {
    return {
      owner: info.owner,
      title: info.title,
      photoLink: info.photoLink,
      descriptionLink: info.descriptionLink,
      raisedAmount: ethers.formatEther(info.raisedAmount),
      targetRaisedAmount: ethers.formatEther(info.targetRaisedAmount),
      deadline: new Date(Number(info.deadline) * 1000),
      status: statusMap[info.status],
      onMilestone: Number(info.onMilestone),
      milestoneCount: Number(info.milestoneCount)
    };
  }, []);

  /**
   * Format milestone info from blockchain format
   */
  const formatMilestoneInfo = useCallback((info) => {
    return {
      releaseRatio: Number(info.releaseRatio),
      status: statusMap[info.status],
      proposalInfo: {
        title: info.proposalInfo.title,
        photoLink: info.proposalInfo.photoLink,
        descriptionLink: info.proposalInfo.descriptionLink
      },
      proofInfo: {
        title: info.proofInfo.title,
        photoLink: info.proofInfo.photoLink,
        descriptionLink: info.proofInfo.descriptionLink
      },
      votingDeadline: Number(info.votingDeadline) > 0 ? new Date(Number(info.votingDeadline) * 1000) : null,
      approveVotes: Number(info.approveVotes),
      rejectVotes: Number(info.rejectVotes),
      notVoteYetVotes: Number(info.notVoteYetVotes),
      userVote: voteOptionMap[info.userVote]
    };
  }, []);

  /**
   * Get campaign info
   */
  const getCampaignInfo = useCallback(async () => {
    try {
      const contract = getCampaignContract();
      const info = await contract.getInfo();
      return formatCampaignInfo(info);
    } catch (error) {
      console.error("Error getting campaign info:", error);
      throw error;
    }
  }, [getCampaignContract, formatCampaignInfo]);

  /**
   * Get info for a specific milestone
   */
  const getMilestoneInfo = useCallback(async (milestoneId) => {
    try {
      const contract = getCampaignContract();
      const info = await contract.getMilestoneInfo(milestoneId);
      return formatMilestoneInfo(info);
    } catch (error) {
      console.error(`Error getting milestone ${milestoneId} info:`, error);
      throw error;
    }
  }, [getCampaignContract, formatMilestoneInfo]);

  /**
   * Get all milestones info
   */
  const getAllMilestones = useCallback(async () => {
    try {
      const contract = getCampaignContract();
      const milestones = await contract.getAllMilestones();
      return milestones.map(formatMilestoneInfo);
    } catch (error) {
      console.error("Error getting all milestones:", error);
      throw error;
    }
  }, [getCampaignContract, formatMilestoneInfo]);

  /**
   * Donate to the campaign
   */
  const donate = useCallback(async (amount) => {
    try {
      const contract = await getSignerContract();
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await contract.donate({ value: amountWei });
      return await tx.wait();
    } catch (error) {
      console.error("Error donating to campaign:", error);
      throw error;
    }
  }, [getSignerContract]);

  /**
   * Submit proof for a milestone
   */
  const submitMilestoneProof = useCallback(async (milestoneId, title, photoLink, descriptionLink) => {
    try {
      const contract = await getSignerContract();
      const tx = await contract.submitMilestoneProof(milestoneId, title, photoLink, descriptionLink);
      return await tx.wait();
    } catch (error) {
      console.error("Error submitting milestone proof:", error);
      throw error;
    }
  }, [getSignerContract]);

  /**
   * Request voting for the current milestone
   */
  const requestVoting = useCallback(async () => {
    try {
      const contract = await getSignerContract();
      const tx = await contract.requestVoting();
      return await tx.wait();
    } catch (error) {
      console.error("Error requesting voting:", error);
      throw error;
    }
  }, [getSignerContract]);

  /**
   * Cast vote on current milestone
   */
  const castVote = useCallback(async (approve) => {
    try {
      const contract = await getSignerContract();
      const tx = await contract.castVoteOnMilestone(approve);
      return await tx.wait();
    } catch (error) {
      console.error("Error casting vote:", error);
      throw error;
    }
  }, [getSignerContract]);

  /**
   * Get voting results for a milestone
   */
  const getVotingResult = useCallback(async (milestoneId) => {
    try {
      const contract = await getSignerContract();
      const result = await contract.getVotingResult(milestoneId);
      return {
        approveVotes: Number(result.approveVotes),
        rejectVotes: Number(result.rejectVotes),
        notVoteYetVotes: Number(result.notVoteYetVotes)
      };
    } catch (error) {
      console.error("Error getting voting result:", error);
      throw error;
    }
  }, [getSignerContract]);

  /**
   * Get user's token amount for this campaign
   */
  const getUserTokens = useCallback(async (userAddress) => {
    try {
      const contract = getCampaignContract();
      const result = await contract.getToken(userAddress);
      return {
        amount: Number(result[0]),
        tokenValue: Number(result[1])
      };
    } catch (error) {
      console.error("Error getting user tokens:", error);
      throw error;
    }
  }, [getCampaignContract]);

  /**
   * Release funds for a completed milestone (owner only)
   */
  const releaseFunds = useCallback(async (milestoneId) => {
    try {
      const contract = await getSignerContract();
      const tx = await contract.releaseFunds(milestoneId);
      return await tx.wait();
    } catch (error) {
      console.error("Error releasing funds:", error);
      throw error;
    }
  }, [getSignerContract]);

  /**
   * Request refund (if campaign failed)
   */
  const requestRefund = useCallback(async () => {
    try {
      const contract = await getSignerContract();
      const tx = await contract.requestRefund();
      return await tx.wait();
    } catch (error) {
      console.error("Error requesting refund:", error);
      throw error;
    }
  }, [getSignerContract]);

  /**
   * Set up event listeners for campaign events
   */
  const listenToEvents = useCallback((eventName, callback) => {
    try {
      const contract = getCampaignContract();
      const filter = contract.filters[eventName]();
      
      contract.on(filter, (...args) => {
        const event = args[args.length - 1];
        callback(...args.slice(0, -1), event);
      });
      
      return () => {
        contract.off(filter);
      };
    } catch (error) {
      console.error(`Error setting up ${eventName} listener:`, error);
      throw error;
    }
  }, [getCampaignContract]);

  return {
    getCampaignInfo,
    getMilestoneInfo,
    getAllMilestones,
    donate,
    submitMilestoneProof,
    requestVoting,
    castVote,
    getVotingResult,
    getUserTokens,
    releaseFunds,
    requestRefund,
    listenToEvents
  };
};

export default useCampaign;
