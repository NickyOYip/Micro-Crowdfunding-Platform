# Micro-Crowdfunding Platform Technical Documentation

## System Overview

The Micro-Crowdfunding Platform is a decentralized application built on Ethereum that enables milestone-based crowdfunding campaigns. It features:

- Campaign creation with multiple milestones
- Milestone-based fund release
- Token-weighted voting for milestone approvals
- Transparent proof submission and verification
- Refund mechanisms for failed campaigns

## System Architecture

The platform consists of two smart contracts:

1. **CampaignFactory** - Creates and tracks new campaigns
2. **Campaign** - Individual campaign logic including donations, milestone management, and voting

## Workflow

```
┌─────────────────┐     ┌─────────────────────────┐     ┌──────────────────────┐
│                 │     │                         │     │                      │
│ Campaign        │────▶│ Donation Period         │────▶│ Milestone Execution  │
│ Creation        │     │ (Until deadline)        │     │ (For each milestone) │
│                 │     │                         │     │                      │
└─────────────────┘     └─────────────────────────┘     └──────────┬───────────┘
                                                                   │
┌─────────────────┐     ┌─────────────────────────┐     ┌──────────▼───────────┐
│                 │     │                         │     │                      │
│ Campaign        │◀────│ Success: All Milestones │◀────│ Milestone Proof &    │
│ Completion      │     │ Completed               │     │ Voting               │
│                 │     │                         │     │                      │
└─────────────────┘     └─────────────────────────┘     └──────────────────────┘
                                     ▲                             │
                                     │                             ▼
                              ┌──────┴──────┐     ┌──────────────────────────┐
                              │             │     │                          │
                              │ Refund      │◀────│ Failure: Milestone       │
                              │ Process     │     │ Rejected or Deadline     │
                              │             │     │ Passed                   │
                              └─────────────┘     └──────────────────────────┘
```

## Contract Functions and Events

### CampaignFactory Contract

#### Functions

**getCampaigns()**
- Input: None
- Output: `address[]` - Array of all campaign addresses
- Description: Returns all created campaign addresses

**createCampaign(...)**
- Input:
  - `owner` - Campaign owner address
  - `title` - Campaign title
  - `photoLink` - IPFS/Irys transaction ID for campaign image
  - `descriptionLink` - IPFS/Irys transaction ID for campaign description
  - `targetAmount` - Funding goal in wei
  - `deadline` - Campaign end timestamp
  - `milestoneCount` - Number of milestones
  - `milestoneAmounts` - Array of release ratios for each milestone (must sum to 100)
  - `milestoneTitles` - Array of milestone titles
  - `milestonePhotoLinks` - Array of milestone image links
  - `milestoneDescLinks` - Array of milestone description links
- Output: `address` - Address of the newly created campaign
- Events: `campaignCreated(owner, campaign address)`

### Campaign Contract

#### Key States

- **Campaign Status**: `Active`, `Completed`, or `Failed`
- **Milestone Status**: `Active`, `Completed`, or `Failed`
- **Token Value**: Initially `1000000000 wei` per token, decreases as milestones complete
- **Current Milestone**: Tracks which milestone is active (increments after completion)

#### Functions

**donate()**
- Input: ETH (via msg.value)
- Output: None
- Events: `userDonated(donor, campaign address)`
- Description: Accepts donations, calculates tokens, and updates campaign state
- Math: `tokensToAdd = msg.value / tokenValue`

**getInfo()**
- Input: None
- Output: Campaign details (CampaignInfo struct)
- Description: Returns general campaign information

**getMilestoneInfo(milestoneId)**
- Input: `milestoneId` - The milestone index
- Output: Milestone details (MilestoneInfoForReturn struct)
- Description: Returns detailed information about a specific milestone

**getAllMilestones()**
- Input: None
- Output: Array of all milestone details
- Description: Returns details for all milestones

**submitMilestoneProof(milestoneId, title, photoLink, descriptionLink)**
- Input:
  - `milestoneId` - The milestone index
  - `title` - Proof title
  - `photoLink` - IPFS/Irys transaction ID for proof image
  - `descriptionLink` - IPFS/Irys transaction ID for proof description
- Output: None
- Events: `milestoneProofSubmited(owner, campaign address, milestoneId)`
- Description: Owner submits proof of milestone completion

**requestVoting()**
- Input: None
- Output: None
- Events: `startVoting(owner, campaign address, milestoneId)`
- Description: Owner initiates voting for current milestone
- Sets: `votingDeadline = block.timestamp + 7 days`

**castVoteOnMilestone(approve)**
- Input: `approve` - Boolean (true for approve, false for reject)
- Output: None
- Events: `voteOnMilestone(voter, campaign address, milestoneId)`
- Description: Donors vote on milestone completion

**calculateVotingResult()**
- Input: None (internal function)
- Description: Calculates voting results based on token weights
- Logic: Milestone approved if `approveVotes > (rejectVotes + notVoteYetVotes)`

**getVotingResult(milestoneId)**
- Input: `milestoneId` - The milestone index
- Output: `(approveVotes, rejectVotes, notVoteYetVotes)` - Vote tallies
- Events: `votingResult(campaign address, milestoneId, approveVotes, rejectVotes, notVoteYetVotes)`
- Description: Returns and emits final vote counts after voting period ends

**getToken(donorAddress)**
- Input: `donorAddress` - Address to check
- Output: `(amount, tokenValue)` - Tokens held and current token value
- Description: Returns a donor's token balance and the current token value

**releaseFunds(milestoneId)**
- Input: `milestoneId` - The milestone index
- Output: None
- Events:
  - `moveToNextMilestone(campaign address, nextMilestoneId)`
  - `releaseFundsToOwner(owner, campaign address, milestoneId, amount)`
- Description: Releases milestone funds to owner and moves to next milestone
- Math: `tokenValue = tokenValue - (1000000000*(releaseRatio/100))`

**requestRefund()**
- Input: None
- Output: None
- Events: `refund(donor, campaign address, milestoneId)`
- Description: Allows donors to request refunds for failed campaigns
- Math: `refundAmount = tokenAmount * tokenValue`

## Token Economics

### Token Value Calculation

1. Initial token value = 1000000000 wei per token
2. When a donor contributes: `tokensReceived = contribution / tokenValue`
3. As milestones complete, token value decreases:
   - `tokenValue = tokenValue - (1000000000*(releaseRatio/100))`
4. Refund amount = `tokens * currentTokenValue`

### Voting Mechanism

- Each token represents one vote
- Voting weight is proportional to tokens held
- Voting options: `Approve`, `Reject`, `NotVoteYet`
- Milestone approved if: `approveVotes > (rejectVotes + notVoteYetVotes)`
- Voting period: 7 days after voting request

## Campaign Lifecycle

1. **Creation**: Owner defines campaign details and milestones
2. **Donation**: Users donate ETH and receive tokens based on token value
3. **Milestone Execution**:
   - Owner submits proof of milestone completion
   - Owner requests voting
   - Donors vote to approve/reject milestone completion
   - Voting results calculated after deadline
   - If approved, funds are released to owner proportional to milestone ratio
   - Token value decreases, campaign moves to next milestone
4. **Completion/Failure**:
   - Campaign completes when all milestones are approved
   - Campaign fails if:
     - Any milestone is rejected
     - Deadline passes without reaching target amount
   - Donors can request refunds for failed campaigns

## Security Features

- Modifier restrictions ensure appropriate function access
- Deadline enforcement prevents late donations
- Voting deadlines ensure timely milestone progression
- Token-weighted voting prevents centralized control
- Status tracking prevents improper fund release

## Function Conditions

### Campaign Contract Function Conditions

#### donate()
- **Modifiers**: `campaignActive`
- **Requirements**:
  - `msg.value > 0` - Donation amount must be positive
  - `block.timestamp < deadline` - Donation must be made before the deadline
  - After `calculateVotingResult()`, campaign status must still be `Active`
- **Effects**:
  - Updates token balance: `tokenPool[msg.sender] += tokensToAdd`
  - Increases total tokens: `totalToken += tokensToAdd`
  - Increases raised amount: `raisedAmount += msg.value`
  - Updates campaign status through `updateStatus()`

#### getMilestoneInfo(milestoneId)
- **Requirements**:
  - `milestoneId < milestoneCount` - Milestone must exist

#### submitMilestoneProof(milestoneId, title, photoLink, descriptionLink)
- **Modifiers**: `onlyOwner`, `campaignActive`
- **Requirements**:
  - `milestones[milestoneId].status == Status.Active` - Milestone must be active
- **Effects**:
  - Updates milestone's proof information

#### requestVoting()
- **Modifiers**: `onlyOwner`, `campaignActive`
- **Requirements**:
  - `bytes(milestones[onMilestone].proofInfo.photoLink).length > 0` - Proof must be submitted first
  - `milestones[onMilestone].votingDeadline == 0` - Voting must not have started already
- **Effects**:
  - Sets voting deadline to `block.timestamp + 7 days`

#### castVoteOnMilestone(approve)
- **Modifiers**: `onlyDonor`, `campaignActive`
- **Requirements**:
  - `milestones[milestoneId].votingDeadline > 0` - Voting must have started
  - `block.timestamp < milestones[milestoneId].votingDeadline` - Must vote before deadline
- **Effects**:
  - Records the user's vote (can update vote before deadline)

#### calculateVotingResult()
- **Internal function**
- **Trigger Conditions**:
  - Milestone voting deadline has passed
  - Milestone is still in active status
- **Logic**:
  - Sets `NotVoteYet` votes initially to total token supply
  - Iterates through all tokens to calculate votes in each category
  - Reduces `NotVoteYet` count for each voter accounted for
  - Milestone approved if: `Approve > (Reject + NotVoteYet)`
  - Updates milestone status to either `Completed` or `Failed`
  - Updates campaign status through `updateStatus()`

#### getVotingResult(milestoneId)
- **Requirements**:
  - `milestones[milestoneId].votingDeadline > 0` - Voting must have started
  - `block.timestamp >= milestones[milestoneId].votingDeadline` - Voting period must have ended
- **Effects**:
  - Calls `calculateVotingResult()` to ensure results are up to date
  - Returns and emits the voting results

#### releaseFunds(milestoneId)
- **Modifiers**: `onlyOwner`
- **Requirements**:
  - `milestones[milestoneId].status == Status.Active` - Milestone must be active
  - `milestoneId == onMilestone` - Can only release funds for current milestone
- **Effects**:
  - Decreases token value for remaining milestones
  - Increments `onMilestone`
  - Updates campaign status through `updateStatus()`
  - Transfers funds to owner based on milestone's release ratio

#### requestRefund()
- **Modifiers**: `onlyDonor`
- **Requirements**:
  - Campaign status is `Failed` OR (deadline has passed AND status is not `Completed`)
  - `tokenAmount > 0` - User must have tokens to refund
- **Effects**:
  - Sets user's token balance to 0
  - Transfers refund amount to user: `tokenAmount * tokenValue`

#### updateStatus()
- **Internal function**
- **Condition 1**: If `block.timestamp > deadline && status != Status.Completed`
  - Sets campaign status to `Failed`
- **Condition 2**: If `onMilestone >= milestoneCount`
  - Sets campaign status to `Completed`

### CampaignFactory Contract Function Conditions

#### createCampaign(...)
- **Requirements**:
  - All milestone arrays must have the same length as `milestoneCount`
  - Inside Campaign constructor:
    - `milestoneCount > 0` - Must have at least one milestone
    - `totalReleaseRatio == 100` - Release ratios must sum to 100%
- **Effects**:
  - Creates and returns a new Campaign contract instance
  - Adds the new campaign address to the campaigns array
