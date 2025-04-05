// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// interface for all Campaign contracts
interface ICampaign {
    enum Status { Active, Completed, Failed }
    enum VoteOption { Approve, Reject, NotVoteYet }
    
    // Event
    event userDonated(address indexed user, address indexed campaign);
    event refund(address indexed donor, address indexed campaign, uint256 milestoneId);
    event newStatus(address indexed campaign, Status status);
    event newMilestoneStatus(address indexed campaign, uint256 milestoneId, Status status);
    event moveToNextMilestone(address indexed campaign, uint256 milestoneId);
    
    // Core campaign info
    function getInfo() external view returns (
        address owner,
        string memory title,
        string memory photoLink,
        string memory descriptionLink,
        uint256 raisedAmount,
        uint256 targetRaisedAmount,
        uint256 deadline,
        Status status,
        uint256 onMilestone,
        uint256 milestoneCount
    );
    
    // Funding 
    function donate() external payable;
    function requestRefund() external;
    
    // Token 
    function getToken(address donorAddress) external view returns (uint256 amount, uint256 value);
}
