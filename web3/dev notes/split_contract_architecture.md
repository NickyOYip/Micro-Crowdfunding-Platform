# Split Contract Architecture - Micro Crowdfunding Platform

## Overview

The Micro Crowdfunding Platform has been refactored into a split contract architecture to optimize gas costs, improve modularity, and stay within Ethereum's contract size limits. This document explains the new architecture, component interactions, and key features.

## Contract Architecture

![Contract Architecture Diagram](https://i.imgur.com/placeholder.png)

### Components

1. **Factory Contract**: Creates and deploys the component contracts
2. **ICampaign Interface**: Defines shared events and functions
3. **CampaignCore**: Handles basic information and funding logic
4. **CampaignVoting**: Manages voting mechanisms
5. **CampaignMilestones**: Handles milestone proof submission and fund release
6. **CampaignFacade** (optional): Simplifies interaction with the three main contracts

## Contract Details

### 1. ICampaign Interface

The interface establishes a contract for the core functionality:

```solidity
interface ICampaign {
    enum Status { Active, Completed, Failed }
    enum VoteOption { Approve, Reject, NotVoteYet }
    
    // Events definitions
    event userDonated(address indexed user, address indexed campaign);
    event refund(address indexed donor, address indexed campaign, uint256 milestoneId);
    event newStatus(address indexed campaign, Status status);
    // ... other events
    
    // Core functions
    function getInfo() external view returns (...);
    function donate() external payable;
    function requestRefund() external;
    function getToken(address donorAddress) external view returns (uint256 amount, uint256 value);
}
```

### 2. CampaignCore Contract

The core contract maintains essential campaign data and handles donation logic:

```solidity
contract CampaignCore is ICampaign {
    // Campaign state variables
    uint256 public creationTime;
    address public owner;
    string public title;
    // ... other variables
    
    // Contract references
    CampaignVoting public votingContract;
    CampaignMilestones public milestonesContract;
    
    // Functions
    function donate() public payable override campaignActive { ... }
    function requestRefund() external override onlyDonor { ... }
    function advanceToNextMilestone() external returns (bool) { ... }
    // ... other functions
}
```

### 3. CampaignVoting Contract

Handles voting logic for milestone approval:

```solidity
contract CampaignVoting {
    CampaignCore public coreContract;
    
    struct VotingData {
        mapping(address => ICampaign.VoteOption) votingRecords;
        uint256 votingDeadline;
        mapping(ICampaign.VoteOption => uint256) votingResult;
    }
    
    mapping(uint256 => VotingData) public votingData;
    
    // Functions
    function requestVoting() external onlyOwner campaignActive { ... }
    function castVoteOnMilestone(bool approve) external onlyDonor campaignActive { ... }
    function calculateVotingResult(uint256 milestoneId) external view returns (...) { ... }
    // ... other functions
}
```

### 4. CampaignMilestones Contract

Manages milestone data, proof submission, and fund release:

```solidity
contract CampaignMilestones {
    CampaignCore public coreContract;
    CampaignVoting public votingContract;
    
    struct MilestoneInfo { ... }
    struct Milestone { ... }
    
    mapping(uint256 => Milestone) public milestones;
    
    // Functions
    function submitMilestoneProof(...) external onlyOwner campaignActive { ... }
    function calculateVotingResult(uint256 milestoneId) external { ... }
    function releaseFunds(uint256 milestoneId) external onlyOwner { ... }
    // ... other functions
}
```

### 5. CampaignFactory Contract

Creates and links together the component contracts:

```solidity
contract CampaignFactory {
    address[] public campaigns;
    
    function createCampaign(...) public returns (address) {
        // Deploy the component contracts
        CampaignCore coreContract = new CampaignCore(...);
        CampaignVoting votingContract = new CampaignVoting(...);
        CampaignMilestones milestonesContract = new CampaignMilestones(...);
        
        // Link the contracts
        coreContract.setContracts(address(votingContract), address(milestonesContract));
        
        // Record and return the campaign address
        address campaignAddress = address(coreContract);
        campaigns.push(campaignAddress);
        emit campaignCreated(owner, campaignAddress);
        return campaignAddress;
    }
}
```

### 6. CampaignFacade Contract (Optional)

Provides a simplified interface for frontend interaction:

```solidity
contract CampaignFacade {
    CampaignCore public core;
    CampaignVoting public voting;
    CampaignMilestones public milestones;
    
    // Simplified interaction functions
    function donate() external payable { ... }
    function submitMilestoneProof(...) external { ... }
    function requestVoting() external { ... }
    function castVoteOnMilestone(bool approve) external { ... }
    
    // Combined data access
    function getMilestoneFullInfo(uint256 milestoneId) external view returns (...) { ... }
}
```

## Contract Interactions

1. **Campaign Creation Flow**:
   - Factory deploys Core, Voting, and Milestones contracts
   - Factory links the contracts together via `setContracts()`
   - Factory returns the Core contract address as the campaign address

2. **Donation Flow**:
   - User sends ETH to Core contract's `donate()` function
   - Core contract issues tokens to track voting rights
   - Core notifies Milestones contract to check pending voting results

3. **Milestone Submission Flow**:
   - Campaign owner submits proof to Milestones contract
   - Owner requests voting through Voting contract
   - Donors cast votes through Voting contract
   - After voting deadline, results are calculated and status updated
   - If approved, owner can release funds through Milestones contract

4. **Fund Release Flow**:
   - Milestones contract verifies milestone status and updates token value
   - Milestones contract notifies Core to advance to next milestone
   - Milestones contract transfers funds to campaign owner

## Benefits of Split Architecture

1. **Reduced Contract Size**: Each contract stays under Ethereum's size limits
2. **Modular Design**: Components can be upgraded independently
3. **Separation of Concerns**: Each contract has a specific responsibility
4. **Gas Optimization**: Only required functionality is included in each transaction
5. **Maintainability**: Easier to audit, test, and extend

## Deployment Guidelines

1. Deploy `CampaignFactory` contract
2. Call `createCampaign()` with campaign and milestone details
3. Interact with the campaign using either:
   - Direct interaction with component contracts
   - Through a `CampaignFacade` contract (recommended for frontend integration)

## Security Considerations

1. **Contract Linkage**: Only the factory can set contract references
2. **Access Control**: Functions properly restrict access based on roles
3. **Reentrancy Protection**: State changes happen before external calls
4. **Token Economics**: Token value adjusts after each milestone to incentivize early backers

## Frontend Integration

For frontend interaction, there are two approaches:

1. **Direct Component Access**: Interact with each component contract separately
2. **Facade Pattern**: Deploy and use the CampaignFacade contract for simplified interaction

The Facade approach is recommended for most applications as it simplifies transaction handling and data retrieval.
