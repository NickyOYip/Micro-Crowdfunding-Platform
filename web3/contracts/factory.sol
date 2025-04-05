// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./campaign.sol";

contract CampaignFactory {
    //all campaign addresses
    address[] public campaigns;
    
    // Event when a new campaign created
    event campaignCreated(address indexed owner, address indexed campaign);

    // returns all campaign addresses
    function getCampaigns() public view returns (address[] memory) {
        return campaigns;
    }
    
    /**
     * @dev Creates a new campaign and stores its address
     * @param owner Address of the campaign owner
     * @param title Campaign title
     * @param photoLink Link to the campaign photo (Irys tx)
     * @param descriptionLink Link to the campaign description (Irys tx)
     * @param targetAmount Total funding goal
     * @param deadline Campaign deadline timestamp
     * @param milestoneCount Number of milestones
     * @param milestoneAmounts Array of amounts to release per milestone
     * @param milestoneTitles Array of titles for each milestone
     * @param milestonePhotoLinks Array of photo links for each milestone
     * @param milestoneDescLinks Array of description links for each milestone
     * @return Address of the newly created campaign
     */
    function createCampaign(
        address owner, 
        string memory title,
        string memory photoLink,
        string memory descriptionLink,
        uint256 targetAmount,
        uint256 deadline,
        uint256 milestoneCount,
        uint256[] memory milestoneAmounts,
        string[] memory milestoneTitles,
        string[] memory milestonePhotoLinks,
        string[] memory milestoneDescLinks
    ) public returns (address) {
        require(milestoneCount == milestoneAmounts.length, "Data missing");
        require(milestoneCount == milestoneTitles.length, "Data missing");
        require(milestoneCount == milestonePhotoLinks.length, "Data missing");
        require(milestoneCount == milestoneDescLinks.length, "Data missing");
        
        Campaign newCampaign = new Campaign(
            owner,
            title,
            photoLink,
            descriptionLink,
            targetAmount,
            deadline,
            milestoneCount,
            milestoneAmounts,
            milestoneTitles,
            milestonePhotoLinks,
            milestoneDescLinks
        );
        
        address campaignAddress = address(newCampaign);
        campaigns.push(campaignAddress);
        
        emit campaignCreated(owner, campaignAddress);
        return campaignAddress;
    }
    

}
