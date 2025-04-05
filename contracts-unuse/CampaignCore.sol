// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ICampaign.sol";
import "./CampaignVoting.sol";
import "./CampaignMilestones.sol";

// core: main contract , store campaign info and handle donations
contract CampaignCore is ICampaign {
    // Campaign core data
    uint256 public creationTime;
    address public owner;
    string public title;
    string public photoLink;
    string public descriptionLink;
    uint256 public raisedAmount;
    uint256 public targetRaisedAmount;
    uint256 public deadline;//time get refund if not completed
    Status public status;
    uint256 public tokenValue;// 1 token = 1000000000 wei
    mapping(address => uint256) public tokenPool;// how many tokens are given to each donor
    address[] public donors;// list of donors
    uint256 public totalToken;// total how much are given out
    
    // Milestone tracking
    uint256 public onMilestone;// current no.
    uint256 public milestoneCount;//total no.
    
    // References to other contracts
    CampaignVoting public votingContract;
    CampaignMilestones public milestonesContract;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyDonor() {
        require(tokenPool[msg.sender] > 0, "Only donors");
        _;
    }
    
    modifier campaignActive() {
        require(status == Status.Active, "Not active");
        _;
    }
    
    // Constructor
    constructor(
        address _owner,
        string memory _title,
        string memory _photoLink,
        string memory _descriptionLink,
        uint256 _targetAmount,
        uint256 _deadline,
        uint256 _milestoneCount
    ) {
        creationTime = block.timestamp;
        owner = _owner;
        title = _title;
        photoLink = _photoLink;
        descriptionLink = _descriptionLink;
        targetRaisedAmount = _targetAmount;
        deadline = _deadline;
        status = Status.Active;
        onMilestone = 0;
        tokenValue = 1000000000; // 1 tokens = 1000000000 wei
        milestoneCount = _milestoneCount;
    }
    
    // connect to voting and milestone contracts
    function setContracts(address _votingContract, address _milestonesContract) external {
        require(address(votingContract) == address(0), "Already set");
        require(address(milestonesContract) == address(0), "Already set");
        votingContract = CampaignVoting(_votingContract);
        milestonesContract = CampaignMilestones(_milestonesContract);
    }
    
    // Donation 
    function donate() public payable override campaignActive {
        require(msg.value > 0, "Air donation");
        require(block.timestamp < deadline, "Too late");
        
        // Check if any milestone voting can be calculated ,prevent update result by donation after voting deadline
        milestonesContract.calculateVotingResult(onMilestone);
        
        // Verify campaign still active
        require(status == Status.Active, "Not active");
        // add donor to list 
        if(tokenPool[msg.sender] == 0) {
            donors.push(msg.sender);
        }
        // Process donation
        uint256 tokensToAdd = msg.value / tokenValue;
        tokenPool[msg.sender] += tokensToAdd;
        totalToken += tokensToAdd;
        raisedAmount += msg.value;
        
        emit userDonated(msg.sender, address(this));
        
        // Update campaign status if needed
        updateStatus();
    }
    
    // Get campaign basic info
    function getInfo() external view override returns (
        address, string memory, string memory, string memory,
        uint256, uint256, uint256, Status, uint256, uint256
    ) {
        return (
            owner,
            title,
            photoLink,
            descriptionLink,
            raisedAmount,
            targetRaisedAmount,
            deadline,
            status,
            onMilestone,
            milestoneCount
        );
    }
    
    // Get token amount and value for a donor
    function getToken(address donorAddress) public view override returns (uint256 amount, uint256) {
        amount = tokenPool[donorAddress];
        return (amount, tokenValue);
    }
    
    // Request refund if campaign fails
    function requestRefund() external override onlyDonor {
        require(
            status == Status.Failed || 
            (block.timestamp > deadline && status != Status.Completed),
            "Not eligible"
        );
        
        uint256 tokenAmount = tokenPool[msg.sender];
        require(tokenAmount > 0, "No tokens");
        
        uint256 refundAmount = tokenAmount * tokenValue;
        tokenPool[msg.sender] = 0;
        
        payable(msg.sender).transfer(refundAmount);
        emit refund(msg.sender, address(this), onMilestone);
    }
    
    // Update campaign status
    function updateStatus() public returns (bool) {
        // Check if deadline passed without completion
        if (block.timestamp > deadline && status != Status.Completed) {
            status = Status.Failed;
            emit ICampaign.newStatus(address(this), status);
            return true;
        }
        
        // Check if all milestones are completed
        if (onMilestone >= milestoneCount) {
            status = Status.Completed;
            emit ICampaign.newStatus(address(this), status);
            return true;
        }
        
        return true;
    }
    
    // Move to next milestone - only by milestone contract
    function advanceToNextMilestone() external returns (bool) {
        require(
            msg.sender == address(milestonesContract),
            "Only milestone contract"
        );
        
        onMilestone += 1;
        emit moveToNextMilestone(address(this), onMilestone);
        updateStatus();
        return true;
    }
    
    // Update token value - only by milestone contract
    function updateTokenValue(uint256 newValue) external {
        require(
            msg.sender == address(milestonesContract),
            "Only milestone contract"
        );
        
        tokenValue = newValue;
    }
    
    // Set campaign status - only by milestone contract
    function setStatus(Status newStatus) external {
        require(
            msg.sender == address(milestonesContract),
            "Only milestone contract"
        );
        
        status = newStatus;
        emit ICampaign.newStatus(address(this), status);
    }
}
