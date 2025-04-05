// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ICampaign.sol";
import "./CampaignCore.sol";
import "./CampaignVoting.sol";

/**
 * @title CampaignMilestones
 * @dev Handles milestone management, proofs, and fund releases
 */
contract CampaignMilestones {
    // References to other contracts
    CampaignCore public coreContract;
    CampaignVoting public votingContract;
    
    // Milestone info struct
    struct MilestoneInfo {
        string title;
        string photoLink;
        string descriptionLink;
    }
    
    // Milestone struct
    struct Milestone {
        uint256 releaseRatio;
        ICampaign.Status status;
        MilestoneInfo proposalInfo;
        MilestoneInfo proofInfo;
    }
    
    // Milestones by ID
    mapping(uint256 => Milestone) public milestones;
    
    // Events
    event milestoneProofSubmited(address indexed owner, address indexed campaign, uint256 milestoneId);
    event releaseFundsToOwner(address indexed owner, address indexed campaign, uint256 milestoneId, uint256 amount);
    
    // Constructor
    constructor(
        address _coreContract,
        address _votingContract,
        uint256 milestoneCount,
        uint256[] memory milestoneReleaseRatios,
        string[] memory milestoneTitles,
        string[] memory milestonePhotoLinks,
        string[] memory milestoneDescLinks
    ) {
        coreContract = CampaignCore(_coreContract);
        votingContract = CampaignVoting(_votingContract);
        
        // Initialize milestones
        uint256 totalReleaseRatio = 0;
        for (uint256 i = 0; i < milestoneCount; i++) {
            Milestone storage m = milestones[i];
            m.releaseRatio = milestoneReleaseRatios[i];
            m.status = ICampaign.Status.Active;
            
            m.proposalInfo.title = milestoneTitles[i];
            m.proposalInfo.photoLink = milestonePhotoLinks[i];
            m.proposalInfo.descriptionLink = milestoneDescLinks[i];
            
            totalReleaseRatio += milestoneReleaseRatios[i];
        }
        
        require(totalReleaseRatio == 100, "Bad ratios");
    }
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == coreContract.owner(), "Only owner");
        _;
    }
    
    modifier campaignActive() {
        require(coreContract.status() == ICampaign.Status.Active, "Not active");
        _;
    }
    
    // Submit proof for milestone completion
    function submitMilestoneProof(
        uint256 milestoneId,
        string memory _title,
        string memory _photoLink,
        string memory _descriptionLink
    ) external onlyOwner campaignActive {
        require(milestones[milestoneId].status == ICampaign.Status.Active, "Not active");
        
        milestones[milestoneId].proofInfo.title = _title;
        milestones[milestoneId].proofInfo.photoLink = _photoLink;
        milestones[milestoneId].proofInfo.descriptionLink = _descriptionLink;
        
        emit milestoneProofSubmited(coreContract.owner(), address(coreContract), milestoneId);
    }
    
    // Check if proof exists for milestone
    function hasProof(uint256 milestoneId) public view returns (bool) {
        return bytes(milestones[milestoneId].proofInfo.photoLink).length > 0;
    }
    
    // Calculate voting result for milestone
    function calculateVotingResult(uint256 milestoneId) external {
        // Get voting results from voting contract
        (
            uint256 approveVotes,
            uint256 rejectVotes,
            uint256 notVoteYetVotes,
            bool isCompleted,
            bool isFailed
        ) = votingContract.calculateVotingResult(milestoneId);
        
        // If no votes tallied yet, return
        if (approveVotes + rejectVotes + notVoteYetVotes == 0) return;
        
        // Update milestone status based on voting result
        if (isCompleted) {
            milestones[milestoneId].status = ICampaign.Status.Completed;
        } else if (isFailed) {
            milestones[milestoneId].status = ICampaign.Status.Failed;
            coreContract.setStatus(ICampaign.Status.Failed);
            // Add explicit interface reference for any events being emitted
        }
    }
    
    // Release funds for completed milestone
    function releaseFunds(uint256 milestoneId) external onlyOwner {
        require(milestones[milestoneId].status == ICampaign.Status.Completed, "Not completed");
        require(milestoneId == coreContract.onMilestone(), "Wrong milestone");
        
        uint256 releaseRatio = milestones[milestoneId].releaseRatio;
        uint256 amountToRelease = (coreContract.targetRaisedAmount() * releaseRatio) / 100;
        
        // Update token value for future milestones
        if (milestoneId < coreContract.milestoneCount() - 1) {
            // Calculate new token value with 20% reduction
            uint256 newTokenValue = coreContract.tokenValue() * 4 / 5;
            coreContract.updateTokenValue(newTokenValue);
        }
        
        // Advance to next milestone
        coreContract.advanceToNextMilestone();
        
        // Transfer funds to owner
        address payable ownerPayable = payable(coreContract.owner());
        ownerPayable.transfer(amountToRelease);
        
        emit releaseFundsToOwner(
            coreContract.owner(), 
            address(coreContract), 
            milestoneId, 
            amountToRelease
        );
    }
    
    // Get milestone information
    function getMilestoneInfo(uint256 milestoneId) external view returns (
        uint256 releaseRatio,
        ICampaign.Status status,
        MilestoneInfo memory proposalInfo,
        MilestoneInfo memory proofInfo
    ) {
        Milestone storage milestone = milestones[milestoneId];
        return (
            milestone.releaseRatio,
            milestone.status,
            milestone.proposalInfo,
            milestone.proofInfo
        );
    }
}
