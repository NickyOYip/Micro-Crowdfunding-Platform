// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CampaignCore.sol";
import "./CampaignVoting.sol";
import "./CampaignMilestones.sol";

//main campaign contract
contract CampaignFacade {
    CampaignCore public core;
    CampaignVoting public voting;
    CampaignMilestones public milestones;
    
    constructor(address _core, address _voting, address _milestones) {
        core = CampaignCore(_core);
        voting = CampaignVoting(_voting);
        milestones = CampaignMilestones(_milestones);
    }
    
    // from Core ----
    function donate() external payable {
        core.donate{value: msg.value}();
    }
    
    function getInfo() external view returns (
        address owner,
        string memory title,
        string memory photoLink,
        string memory descriptionLink,
        uint256 raisedAmount,
        uint256 targetRaisedAmount,
        uint256 deadline,
        ICampaign.Status status,
        uint256 onMilestone,
        uint256 milestoneCount
    ) {
        return core.getInfo();
    }
    
    function requestRefund() external {
        core.requestRefund();
    }
    
    // from Milestone -----
    function submitMilestoneProof(
        uint256 milestoneId,
        string memory title,
        string memory photoLink,
        string memory descriptionLink
    ) external {
        milestones.submitMilestoneProof(milestoneId, title, photoLink, descriptionLink);
    }
    
    function releaseFunds(uint256 milestoneId) external {
        milestones.releaseFunds(milestoneId);
    }
    
    // from Voting ----
    function requestVoting() external {
        voting.requestVoting();
    }
    
    function castVoteOnMilestone(bool approve) external {
        voting.castVoteOnMilestone(approve);
    }
    
    
    // Combine info
    struct MilestoneFullInfo {
        uint256 releaseRatio;
        ICampaign.Status status;
        string proposalTitle;
        string proposalPhotoLink;
        string proposalDescriptionLink;
        string proofTitle;
        string proofPhotoLink;
        string proofDescriptionLink;
        uint256 votingDeadline;
        ICampaign.VoteOption userVote;
        uint256 approveVotes;
        uint256 rejectVotes;
        uint256 notVoteYetVotes;
    }
    
    function getMilestoneFullInfo(uint256 milestoneId) external view returns (MilestoneFullInfo memory) {
        // Get milestone data
        (
            uint256 releaseRatio,
            ICampaign.Status status,
            CampaignMilestones.MilestoneInfo memory proposalInfo,
            CampaignMilestones.MilestoneInfo memory proofInfo
        ) = milestones.getMilestoneInfo(milestoneId);
        
        // Get voting data
        (
            uint256 deadline,
            ICampaign.VoteOption voterChoice,
            uint256 approveVotes,
            uint256 rejectVotes,
            uint256 notVoteYetVotes
        ) = voting.getVotingData(milestoneId, msg.sender);
        
        return MilestoneFullInfo({
            releaseRatio: releaseRatio,
            status: status,
            proposalTitle: proposalInfo.title,
            proposalPhotoLink: proposalInfo.photoLink,
            proposalDescriptionLink: proposalInfo.descriptionLink,
            proofTitle: proofInfo.title,
            proofPhotoLink: proofInfo.photoLink,
            proofDescriptionLink: proofInfo.descriptionLink,
            votingDeadline: deadline,
            userVote: voterChoice,
            approveVotes: approveVotes,
            rejectVotes: rejectVotes,
            notVoteYetVotes: notVoteYetVotes
        });
    }
}
