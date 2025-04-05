// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ICampaign.sol";
import "./CampaignCore.sol";
import "./CampaignMilestones.sol";

//Voting contract
contract CampaignVoting {
    // connect to core contract
    CampaignCore public coreContract;
    CampaignMilestones public milestonesContract;
    
    // Voting data structures
    struct VotingData {
        mapping(address => ICampaign.VoteOption) votingRecords;
        address[] donor;
        uint256 votingDeadline;
        mapping(ICampaign.VoteOption => uint256) votingResult;
    }
    
    // Voting storage each milestone 
    mapping(uint256 => VotingData) public votingData;
    
    // Event
    event startVoting(address indexed owner, address indexed campaign, uint256 milestoneId);
    event voteOnMilestone(address indexed user, address indexed campaign, uint256 milestoneId);
    event votingResult(address indexed campaign, uint256 milestoneId, uint256 approveVotes, uint256 rejectVotes, uint256 NotVoteYetVotes);
    
    // Constructor
    constructor(address _coreContract) {
        coreContract = CampaignCore(_coreContract);
    }
    
    // Add setter for milestones contract
    function setMilestonesContract(address _milestonesContract) external {
        require(address(milestonesContract) == address(0), "Already set");
        require(msg.sender == address(coreContract), "Only core can set");
        milestonesContract = CampaignMilestones(_milestonesContract);
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
        
        // Check if proof exists ( milestone contract)
        require(checkProofExists(milestoneId), "Need proof first");
        require(votingData[milestoneId].votingDeadline == 0, "Already started");
        
        votingData[milestoneId].votingDeadline = block.timestamp + 7 days;
        emit startVoting(coreContract.owner(), address(coreContract), milestoneId);
    }
    
    // Check if proof exists for milestone - now properly implemented
    function checkProofExists(uint256 milestoneId) internal view returns (bool) {
        require(address(milestonesContract) != address(0), "Milestones not set");
        return milestonesContract.hasProof(milestoneId);
    }
    
    // Vote on the current milestone: donor can update their vote before voting deadline
    // If donor has not voted yet, it will be counted as NotVoteYet
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
    
    // get vote 
    function getVote(uint256 milestoneId) external view returns (
        uint256 approveVotes,
        uint256 rejectVotes, 
        uint256 notVoteYetVotes
    ) {
        // Check if voting is completed and calculate results
        uint voteRecode = votingData[milestoneId].votingResult[ICampaign.VoteOption.NotVoteYet] +
            votingData[milestoneId].votingResult[ICampaign.VoteOption.Approve] +
            votingData[milestoneId].votingResult[ICampaign.VoteOption.Reject];
        require(msg.sender == address(milestonesContract), "Only milestones can call");
        require(voteRecode == 0, "already calculated");
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
