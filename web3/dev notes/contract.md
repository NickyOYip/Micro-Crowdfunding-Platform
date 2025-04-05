# **📝Smart Contract Structure - Micro Crowdfunding Platform**

## **🏗️ Contract Breakdown**

### **1️⃣ Factory Contract (Central Data Hub)**

**📂 Purpose:**

- Stores and manages **all campaigns and user contracts**.
- Allows users to **create new campaigns**.
- Tracks the **status and owner** of each campaign.

### **🗄️ Variables**

| Name | Type | Description |
| --- | --- | --- |
| `campaigns`  | `address[]` | Stores campaign and is it end |

### **🔹 Functions-Factory**

| Function Name | Purpose | Return Type | event   |
| --- | --- | --- | --- |
| `createCampaign(userAddr, campaignConstructor)`  | Deploys a **new Campaign Contract** | `address` (new campaign contract address) | `campaignCreated(Addr indexed owner, Addr indexed campaign)` |
| `getCampaigns()` | Returns all campaign addresses | `address[]` | / |

---

### **2️⃣ Campaign Contract (Handles Fundraising & Milestones)**

**📂 Purpose:**

- Accepts **donations** and **tracks fundraising goals**.
- Releases funds **gradually based on milestones**.
- Allows **donors to vote** before funds are released.
- **Owner can request an early milestone vote or refund**.
- for funding

### **🗄️ Variables**

| Name | Type | Description |
| --- | --- | --- |
| `creationTime` | `time` | The time start the campaign |
| `owner` | `address` | The **creator** of the campaign |
| `Title` | `uint` | Total funding goal |
| `PhotoLink` | `string` | Tx of Irys |
| `DescriptionLink` | `string` | Tx of Irys |
| `raisedAmount` | `uint` | Total funds collected now |
| `targetRaisedAmount` | `uint` | The amount needed to move to the next milestone |
| `deadline` | `uint` | after deadline the all remaining donation will return  |
| `status` | `enum { Active, Completed, Failed }` | if all Milestone Completed → Completed 
if one Milestone Failed → Failed  |
| `milestones` | `mapping(uint => Milestone)` | Stores milestones |
| `onMilestone` | `uint` | working on which stage |
| `tokenValue` | `uint` | 1000Token=1ETH ,after `releaseFund` of  milestone , token value will decrease: total 5 , release 1 , token value from 0.001 → 0.0008 ETH  |
| `tokenPool` | `mapping(address => uint)` | mark the token donor have, it also is the voting weight |
| `totalToken` | `uint` | mark the total token  |

## **`Milestone`Struct (Tracks Proof & Status)**

**📂 Purpose:**

- Stores key **proof and funding details** for each milestone.
- Ensures **funds are only released when proof is accepted**.

### **🗄️ Variables**

| Name | Type | Description |
| --- | --- | --- |
| `amountToRelease` | `uint` | Amount released upon approval |
| `status` | `enum { Active, Completed, Failed }` | Milestone state(user donation will Evenly split in the milestone are active if the  **Campaign is active**) |
| `proposalInfo` | `MilestoneInfo`  | Milestone title |
| `proofInfo` | `MilestoneInfo`  | Link to **visual proof** of completion |
| `votingRecords` | `mapping(address => vote{ Approve, Reject, NotVoteYet })` | Tracks whether a donor has **already voted** |
| `votingDeadline` |  `uint` | After this time  |
| `votingResult` | `mapping(vote{ Approve, Reject, NotVoteYet } => totalWeightedVote )` | Result of the voting  |

### **`MilestoneInfo`Struct (Tracks Proof & Status)**

### **🗄️ Variables**

| Name | Type | Description |
| --- | --- | --- |
| `title` | `string` | Milestone title |
| `photoLink` | `string` | Tx of Irys |
| `descriptionLink` | `string` | Tx of Irys |

### **🔹 Functions-Campaign**

| Function Name | Purpose | Return Type | Event |
| --- | --- | --- | --- |
| `donate(amount)` | Allows users to donate ETH to the campaign , will store as token | `TxID` | `userDonated(Addr indexed user, Addr indexed campaign, TxID)` |
| `getInfo()` | get all info of this **Campaign**  | `CampaignInfo` (struct containing all details) | / |
| `requestRefund(userAddress)` | Allows donors to **withdraw funds** if the campaign fails | `TxID` | `refund(Addr indexed donor, Addr indexed campaign, MilestoneID, TxID)` |
| `updateStatus()` | internal use | `bool` (success or failure) | `newStatus(Addr indexed campaign )` |

### **🔹 Functions-Milestone**

| Function Name | Purpose | Return Type | Event |
| --- | --- | --- | --- |
| `submitMilestoneProof(milestoneId, title, photoLink, descriptionLink)` | Submits proof only for active milestone  | `bool` (success or failure) | `milestoneProofSubmited(Addr indexed campaign, Addr indexed campaign)` |
| `requestVoting()` | request to start voting for `onMilestone` | `bool` (success or failure) | `startVoting(Addr indexed owner, Addr indexed donor, Addr indexed campaign, MilestoneID)` |
| `updateStatus(milestoneId)` | internal use | `bool` (success or failure) | `newStatus(Addr indexed campaign, milestoneId)` |

### **🔹 Functions-Voting**

| Function Name | Purpose | Return Type | Event |
| --- | --- | --- | --- |
| `voteOnMilestone(approve)` | Donors vote on whether the milestone is valid  for `onMilestone` | `bool` (success or failure) | `voteOnMilestone(Addr indexed user, Addr indexed campaign, MilestoneID)` |
| `getVotingResult(milestoneId)` | get the result after `votingDeadline` | `votingResult` | when first time call `votingResult(Addr indexed campaign, MilestoneID, votingResult)` |

### **🔹 Functions-Funding**

| Function Name | Purpose | Return Type | Event |
| --- | --- | --- | --- |
| `getToken(donorAddress)` | for donor to check how many  | `uint amount, uint ratio` | / |
| `releaseFunds(milestoneId)` | Releases funds if milestone is approved  | `TxID` | `releaseFundsToOwner(Addr indexed owner, Addr indexed campaign, MilestoneID, amount)` |
| `requestRefund(donorAddress)` | Allows donors to **withdraw funds** if the campaign fails | `TxID` | `refund(Addr indexed donor, Addr indexed campaign, MilestoneID, amount)` |