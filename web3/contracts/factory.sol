// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CampaignCore.sol";
import "./CampaignVoting.sol";
import "./CampaignMilestones.sol";

contract CampaignFactory {
    // Array of deployed campaign addresses (facade)
    address[] public campaigns;
    
    // Event new campaign created
    event campaignCreated(address indexed owner, address indexed campaign);

    // get all campaign addresses
    function getCampaigns() public view returns (address[] memory) {
        return campaigns;
    }
    
    // deploy contract set
    function createCampaign(
        address owner, 
        string memory title,
        string memory photoLink,
        string memory descriptionLink,
        uint256 targetAmount,
        uint256 deadline,
        uint256 milestoneCount,
        uint256[] memory milestoneReleaseRatios,
        string[] memory milestoneTitles,
        string[] memory milestonePhotoLinks,
        string[] memory milestoneDescLinks
    ) public returns (address) {
        // firm data is matching
        require(milestoneCount > 0 , "no mile");
        require(milestoneCount == milestoneReleaseRatios.length, "Bad data");
        require(milestoneCount == milestoneTitles.length, "Bad data");
        require(milestoneCount == milestonePhotoLinks.length, "Bad data");
        require(milestoneCount == milestoneDescLinks.length, "Bad data");
        
        // Deploy core 
        CampaignCore coreContract = new CampaignCore(
            owner,
            title,
            photoLink,
            descriptionLink,
            targetAmount,
            deadline,
            milestoneCount
        );
        
        // Deploy voting 
        CampaignVoting votingContract = new CampaignVoting(address(coreContract));
        
        // Deploy milestone 
        CampaignMilestones milestonesContract = new CampaignMilestones(
            address(coreContract),
            address(votingContract),
            milestoneCount,
            milestoneReleaseRatios,
            milestoneTitles,
            milestonePhotoLinks,
            milestoneDescLinks
        );
        
        // Link contracts 
        coreContract.setContracts(address(votingContract), address(milestonesContract));
        
        // Add campaign to list (core)
        campaigns.push(address(coreContract));
        
        emit campaignCreated(owner, address(coreContract));
        return address(coreContract);
    }
}
