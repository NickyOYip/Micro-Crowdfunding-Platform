// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ICampaign.sol";
import "./CampaignCore.sol";

/**
 * @title CampaignVoting
 * @dev Handles voting functionality for milestones
 */
contract CampaignVoting {
    // Reference to core contract
    CampaignCore public coreContract;
    
    // Voting data structures
    struct VotingData {
        mapping(address => ICampaign.VoteOption) votingRecords;
        uint256 votingDeadline;
        mapping(ICampaign.VoteOption => uint256) votingResult;
    }
    
    // Voting storage by milestone ID
    mapping(uint256 => VotingData) public votingData;
    
    // Events
    event startVoting(address indexed owner, address indexed campaign, uint256 milestoneId);
    event voteOnMilestone(address indexed user, address indexed campaign, uint256 milestoneId);
    event votingResult(address indexed campaign, uint256 milestoneId, uint256 approveVotes, uint256 rejectVotes, uint256 NotVoteYetVotes);
    
    // Constructor
    constructor(address _coreContract) {
        coreContract = CampaignCore(_coreContract);
    }
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == coreContract.owner(), "Only owner");
        _;
    }
    
    modifier onlyDonor() {
        (uint256 tokens,) = coreContract.getToken(msg.sender);
        require(tokens > 0, "Only donors");
        _;
    }
    
    modifier campaignActive() {
        require(coreContract.status() == ICampaign.Status.Active, "Not active");
        _;
    }
    
    // Request voting for the current milestone
    function requestVoting() external onlyOwner campaignActive {
        uint256 milestoneId = coreContract.onMilestone();
        
        // Check if proof exists (delegated to milestone contract)
        require(checkProofExists(milestoneId), "Need proof first");
        require(votingData[milestoneId].votingDeadline == 0, "Already started");
        
        votingData[milestoneId].votingDeadline = block.timestamp + 7 days;
        emit startVoting(coreContract.owner(), address(coreContract), milestoneId);
    }
    
    // Check if proof exists for milestone
    function checkProofExists(uint256 /* milestoneId */) internal pure returns (bool) {
        // This would need to be implemented to check with the milestone contract
        // For this example, we're using a placeholder
        return true;
    }
    
    // Vote on the current milestone
    function castVoteOnMilestone(bool approve) external onlyDonor campaignActive {
        uint256 milestoneId = coreContract.onMilestone();
        require(votingData[milestoneId].votingDeadline > 0, "Not started");
        require(block.timestamp < votingData[milestoneId].votingDeadline, "Too late");
        
        ICampaign.VoteOption vote = approve ? 
            ICampaign.VoteOption.Approve : 
            ICampaign.VoteOption.Reject;
            
        votingData[milestoneId].votingRecords[msg.sender] = vote;
        emit voteOnMilestone(msg.sender, address(coreContract), milestoneId);
    }
    
    // Calculate voting results
    function calculateVotingResult(uint256 milestoneId) external view returns (
        uint256 approveVotes,
        uint256 rejectVotes, 
        uint256 notVoteYetVotes,
        bool isCompleted,
        bool isFailed
    ) {
        VotingData storage voting = votingData[milestoneId];
        
        if (voting.votingDeadline == 0 || block.timestamp < voting.votingDeadline) {
            return (0, 0, 0, false, false);
        }
        
        // Calculate votes
        approveVotes = voting.votingResult[ICampaign.VoteOption.Approve];
        rejectVotes = voting.votingResult[ICampaign.VoteOption.Reject];
        notVoteYetVotes = voting.votingResult[ICampaign.VoteOption.NotVoteYet];
        
        // Calculate result
        isCompleted = approveVotes > (rejectVotes + notVoteYetVotes);
        isFailed = !isCompleted;
        
        return (approveVotes, rejectVotes, notVoteYetVotes, isCompleted, isFailed);
    }
    
    // Get voting status info
    function getVotingData(uint256 milestoneId, address voter) external view returns (
        uint256 deadline,
        ICampaign.VoteOption voterChoice,
        uint256 approveVotes,
        uint256 rejectVotes,
        uint256 notVoteYetVotes
    ) {
        VotingData storage voting = votingData[milestoneId];
        return (
            voting.votingDeadline,
            voting.votingRecords[voter],
            voting.votingResult[ICampaign.VoteOption.Approve],
            voting.votingResult[ICampaign.VoteOption.Reject],
            voting.votingResult[ICampaign.VoteOption.NotVoteYet]
        );
    }
}
