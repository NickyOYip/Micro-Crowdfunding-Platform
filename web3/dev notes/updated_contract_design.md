# **📝Updated Smart Contract Structure - Micro Crowdfunding Platform**

## **🏗️ Contract Breakdown**

### **1️⃣ Factory Contract (Central Data Hub)**

**📂 Purpose:**

- Stores and manages **all campaigns addresses**.
- Allows users to **create new campaigns** with detailed milestone information.
- Tracks the **owner** of each campaign.

### **🗄️ Variables**

| Name | Type | Description |
| --- | --- | --- |
| `campaigns`  | `address[]` | Stores all campaign contract addresses |

### **🔹 Functions-Factory**

| Function Name | Purpose | Return Type | Event |
| --- | --- | --- | --- |
| `createCampaign(owner, title, photoLink, descriptionLink, targetAmount, deadline, milestoneCount, milestoneAmounts, milestoneTitles, milestonePhotoLinks, milestoneDescLinks)`  | Deploys a **new Campaign Contract** with full milestone details | `address` (new campaign contract address) | `campaignCreated(address indexed owner, address indexed campaign)` |
| `getCampaigns()` | Returns all campaign addresses | `address[]` | / |

---

### **2️⃣ Campaign Contract (Handles Fundraising & Milestones)**

**📂 Purpose:**

- Accepts **donations** and **tracks fundraising goals**.
- Releases funds **gradually based on milestone completion**.
- Allows **donors to vote** on milestone completion.
- Manages **token-based voting weight** for donors.
- Provides **transparent milestone information** and voting results.

### **🗄️ Campaign Variables**

| Name | Type | Description |
| --- | --- | --- |
| `creationTime` | `uint256` | Timestamp when the campaign was created |
| `owner` | `address` | The **creator** of the campaign |
| `title` | `string` | Campaign title |
| `photoLink` | `string` | Link to campaign photo (Irys transaction) |
| `descriptionLink` | `string` | Link to campaign description (Irys transaction) |
| `raisedAmount` | `uint256` | Total funds collected in wei |
| `targetRaisedAmount` | `uint256` | Total funding goal in wei |
| `deadline` | `uint256` | Campaign deadline, after which refunds may be available |
| `status` | `enum { Active, Completed, Failed }` | Campaign status |
| `tokenValue` | `uint256` | Wei value of each token (1 token = 1000000000 wei initially) |
| `tokenPool` | `mapping(address => uint256)` | Maps donors to their token amounts (voting weight) |
| `totalToken` | `uint256` | Total tokens issued across all donors |
| `onMilestone` | `uint256` | Current active milestone index |
| `milestoneCount` | `uint256` | Total number of milestones |
| `milestones` | `mapping(uint256 => Milestone)` | Maps milestone IDs to their data |

### **🗄️ Milestone Structure**

| Name | Type | Description |
| --- | --- | --- |
| `releaseRatio` | `uint256` | Percentage (out of 100) of funds to release for this milestone |
| `status` | `enum { Active, Completed, Failed }` | Current milestone status |
| `proposalInfo` | `MilestoneInfo` | Initial milestone description and details |
| `proofInfo` | `MilestoneInfo` | Proof submitted for milestone completion |
| `votingRecords` | `mapping(address => VoteOption)` | Records each donor's vote on this milestone |
| `votingDeadline` | `uint256` | Deadline for voting on this milestone |
| `votingResult` | `mapping(VoteOption => uint256)` | Tallies votes by type |

### **🗄️ MilestoneInfo Structure**

| Name | Type | Description |
| --- | --- | --- |
| `title` | `string` | Title of the milestone or proof |
| `photoLink` | `string` | Link to supporting photo (Irys transaction) |
| `descriptionLink` | `string` | Link to detailed description (Irys transaction) |

### **🔹 Functions-Campaign Information**

| Function Name | Purpose | Return Type |
| --- | --- | --- |
| `getInfo()` | Returns general campaign information | `CampaignInfo` structure |
| `getMilestoneInfo(milestoneId)` | Returns detailed information about a specific milestone | `MilestoneInfoForReturn` structure |
| `getAllMilestones()` | Returns information about all milestones | `MilestoneInfoForReturn[]` array |
| `getToken(donorAddress)` | Returns token amount and value for a donor | `(uint256 amount, uint256 value)` |

### **🔹 Functions-Funding Operations**

| Function Name | Purpose | Return Type | Event |
| --- | --- | --- | --- |
| `donate()` | Allows users to donate ETH to the campaign and receive voting tokens | void | `userDonated(address indexed user, address indexed campaign)` |
| `releaseFunds(milestoneId)` | Releases funds for completed milestone | void | `releaseFundsToOwner(address indexed owner, address indexed campaign, uint256 milestoneId, uint256 amount)` |
| `requestRefund()` | Allows donors to withdraw funds if campaign fails | void | `refund(address indexed donor, address indexed campaign, uint256 milestoneId)` |

### **🔹 Functions-Milestone Management**

| Function Name | Purpose | Return Type | Event |
| --- | --- | --- | --- |
| `submitMilestoneProof(milestoneId, title, photoLink, descriptionLink)` | Submits proof of milestone completion | void | `milestoneProofSubmited(address indexed owner, address indexed campaign, uint256 milestoneId)` |
| `requestVoting()` | Starts voting period for current milestone | void | `startVoting(address indexed owner, address indexed campaign, uint256 milestoneId)` |

### **🔹 Functions-Voting System**

| Function Name | Purpose | Return Type | Event |
| --- | --- | --- | --- |
| `castVoteOnMilestone(approve)` | Allows donors to vote on current milestone | void | `voteOnMilestone(address indexed user, address indexed campaign, uint256 milestoneId)` |
| `getVotingResult(milestoneId)` | Returns voting results after deadline | `(uint256 approveVotes, uint256 rejectVotes, uint256 notVoteYetVotes)` | `votingResult(address indexed campaign, uint256 milestoneId, uint256 approveVotes, uint256 rejectVotes, uint256 NotVoteYetVotes)` |
| `calculateVotingResult()` | Internal function to calculate and update voting results | void | `newMilestoneStatus(address indexed campaign, uint256 milestoneId, Status status)` |

### **🔹 Status Management**

| Function Name | Purpose | Return Type | Event |
| --- | --- | --- | --- |
| `updateStatus()` | Internal function that updates campaign status | void | `newStatus(address indexed campaign, Status status)` |

## **🔄 Key Contract Interactions**

1. **Campaign Creation Flow**:
   - Factory contract creates new Campaign instance with milestone details
   - Campaign initializes with Active status and first milestone active

2. **Donation Flow**:
   - User sends ETH via `donate()` function
   - Campaign issues tokens based on current token value
   - Tokens determine donor's voting weight

3. **Milestone Completion Flow**:
   - Campaign owner submits proof via `submitMilestoneProof()`
   - Owner requests voting via `requestVoting()`
   - Donors vote with `castVoteOnMilestone()`
   - After voting deadline, `calculateVotingResult()` determines outcome
   - If approved, owner can release funds via `releaseFunds()`

4. **Campaign Conclusion**:
   - Campaign completes when all milestones are completed
   - Campaign fails if deadline passes without completion or any milestone fails
   - Donors can request refunds if campaign fails

## **⚠️ Security Considerations**

1. **Token Value Adjustment**:
   - Token value decreases after each milestone to incentivize early donors
   - Tokens are non-transferable and only used for voting

2. **Voting System**:
   - Voting weight is proportional to donation amount
   - Milestone approval requires more approve votes than reject+abstain combined

3. **Fund Management**:
   - Funds are released incrementally based on milestone completion
   - Refunds available if campaign fails
