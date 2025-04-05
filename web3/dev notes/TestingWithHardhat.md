# Testing Smart Contracts with Hardhat

## Setup

1. **Initialize the Test Environment**

If you haven't already set up testing in your project:

```bash
# Install test dependencies
npm install --save-dev @nomiclabs/hardhat-ethers ethers @nomiclabs/hardhat-waffle ethereum-waffle chai
```

2. **Configure Hardhat**

Make sure your `hardhat.config.js` file includes:

```javascript
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      // For local testing
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    artifacts: "./artifacts"
  },
};
```

## Writing Tests

Create a test directory and test files:

```bash
mkdir -p test
touch test/campaign-test.js
touch test/factory-test.js
```

### Example Test for CampaignFactory

```javascript
// test/factory-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CampaignFactory", function () {
  let CampaignFactory;
  let campaignFactory;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the factory contract
    campaignFactory = await CampaignFactory.deploy();
    await campaignFactory.deployed();
  });

  describe("Campaign Creation", function () {
    it("Should create a new campaign with correct parameters", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 60*60*24*7; // 1 week from now
      
      // Campaign parameters
      const title = "Test Campaign";
      const photoLink = "irys.xyz/test-photo";
      const descriptionLink = "irys.xyz/test-description";
      const targetAmount = ethers.utils.parseEther("10"); // 10 ETH
      const milestoneCount = 2;
      const milestoneAmounts = [50, 50]; // 50% each milestone
      const milestoneTitles = ["Milestone 1", "Milestone 2"];
      const milestonePhotoLinks = ["irys.xyz/m1-photo", "irys.xyz/m2-photo"];
      const milestoneDescLinks = ["irys.xyz/m1-desc", "irys.xyz/m2-desc"];
      
      // Create a new campaign
      const tx = await campaignFactory.createCampaign(
        addr1.address, // owner
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
      
      // Wait for the transaction
      await tx.wait();
      
      // Check if campaign was added to the campaigns array
      const campaigns = await campaignFactory.getCampaigns();
      expect(campaigns.length).to.equal(1);
      
      // Verify that event was emitted
      await expect(tx)
        .to.emit(campaignFactory, "campaignCreated")
        .withArgs(addr1.address, campaigns[0]);
    });

    it("Should revert if milestone arrays don't match in length", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 60*60*24*7;
      
      // Missing one milestone title
      await expect(
        campaignFactory.createCampaign(
          addr1.address,
          "Test Campaign",
          "irys.xyz/test-photo",
          "irys.xyz/test-desc",
          ethers.utils.parseEther("10"),
          deadline,
          2, // 2 milestones
          [50, 50],
          ["Only One Title"], // Should be 2 titles
          ["irys.xyz/m1-photo", "irys.xyz/m2-photo"],
          ["irys.xyz/m1-desc", "irys.xyz/m2-desc"]
        )
      ).to.be.revertedWith("Data missing");
    });
  });
});
```

### Example Test for Campaign

```javascript
// test/campaign-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Campaign", function () {
  let Campaign;
  let campaign;
  let factory;
  let owner;
  let donor1;
  let donor2;
  let campaignAddress;

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    Campaign = await ethers.getContractFactory("Campaign");
    const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    [owner, donor1, donor2] = await ethers.getSigners();
    
    // Deploy factory first
    factory = await CampaignFactory.deploy();
    await factory.deployed();
    
    // Create a new campaign through the factory
    const deadline = Math.floor(Date.now() / 1000) + 60*60*24*7; // 1 week from now
    const tx = await factory.createCampaign(
      owner.address,
      "Test Campaign",
      "irys.xyz/test-photo",
      "irys.xyz/test-description",
      ethers.utils.parseEther("10"), // 10 ETH
      deadline,
      2, // 2 milestones
      [60, 40], // 60% and 40% release ratio
      ["Milestone 1", "Milestone 2"],
      ["irys.xyz/m1-photo", "irys.xyz/m2-photo"],
      ["irys.xyz/m1-desc", "irys.xyz/m2-desc"]
    );
    
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === 'campaignCreated');
    campaignAddress = event.args.campaign;
    
    // Connect to the newly created campaign
    campaign = await ethers.getContractAt("Campaign", campaignAddress);
  });

  describe("Campaign Donation", function () {
    it("Should accept donations and update token balances", async function () {
      const donationAmount = ethers.utils.parseEther("1"); // 1 ETH
      
      // Donor1 donates
      await expect(campaign.connect(donor1).donate({ value: donationAmount }))
        .to.emit(campaign, "userDonated")
        .withArgs(donor1.address, campaignAddress);
        
      // Check campaign state after donation
      const info = await campaign.getInfo();
      expect(info.raisedAmount).to.equal(donationAmount);
      
      // Check donor's token balance
      const tokenInfo = await campaign.getToken(donor1.address);
      expect(tokenInfo.amount).to.equal(donationAmount.div(1000000000)); // token calculation
    });
    
    it("Should reject donations after deadline", async function () {
      // Increase time past the deadline
      await ethers.provider.send("evm_increaseTime", [60*60*24*8]); // 8 days
      await ethers.provider.send("evm_mine");
      
      // Try to donate after deadline
      await expect(
        campaign.connect(donor1).donate({ value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("Late donation X");
    });
  });

  describe("Milestone Management", function () {
    beforeEach(async function () {
      // Donor1 donates
      await campaign.connect(donor1).donate({ 
        value: ethers.utils.parseEther("5") 
      });
      
      // Submit proof for milestone 0
      await campaign.connect(owner).submitMilestoneProof(
        0, // First milestone
        "Proof Title",
        "irys.xyz/proof-photo",
        "irys.xyz/proof-desc"
      );
    });
    
    it("Should allow owner to request voting", async function () {
      await expect(campaign.connect(owner).requestVoting())
        .to.emit(campaign, "startVoting")
        .withArgs(owner.address, campaignAddress, 0);
        
      const milestone = await campaign.getMilestoneInfo(0);
      expect(milestone.votingDeadline).to.be.gt(0); // Voting deadline is set
    });
    
    it("Should allow donors to vote on milestones", async function () {
      // Start voting
      await campaign.connect(owner).requestVoting();
      
      // Donor1 votes to approve
      await expect(campaign.connect(donor1).castVoteOnMilestone(true))
        .to.emit(campaign, "voteOnMilestone")
        .withArgs(donor1.address, campaignAddress, 0);
      
      // Check donor's vote
      const milestone = await campaign.connect(donor1).getMilestoneInfo(0);
      expect(milestone.userVote).to.equal(0); // 0 = Approve
    });
    
    it("Should release funds when milestone is approved", async function () {
      // Start voting
      await campaign.connect(owner).requestVoting();
      
      // Donor votes to approve
      await campaign.connect(donor1).castVoteOnMilestone(true);
      
      // Advance time past voting deadline
      await ethers.provider.send("evm_increaseTime", [60*60*24*8]); // 8 days
      await ethers.provider.send("evm_mine");
      
      // Get voting result
      await campaign.getVotingResult(0);
      
      // Owner releases funds
      const beforeBalance = await ethers.provider.getBalance(owner.address);
      
      // Release funds for milestone 0
      await expect(campaign.connect(owner).releaseFunds(0))
        .to.emit(campaign, "moveToNextMilestone")
        .withArgs(campaignAddress, 1);
        
      const afterBalance = await ethers.provider.getBalance(owner.address);
      expect(afterBalance).to.be.gt(beforeBalance);
    });
  });
  
  describe("Refund Mechanism", function() {
    it("Should allow refunds if campaign fails", async function() {
      // Donor1 donates
      const donationAmount = ethers.utils.parseEther("1");
      await campaign.connect(donor1).donate({ value: donationAmount });
      
      // Advance time past the deadline
      await ethers.provider.send("evm_increaseTime", [60*60*24*8]); // 8 days
      await ethers.provider.send("evm_mine");
      
      // Balance before refund
      const beforeBalance = await ethers.provider.getBalance(donor1.address);
      
      // Request refund
      await campaign.connect(donor1).requestRefund();
      
      // Check balance after refund
      const afterBalance = await ethers.provider.getBalance(donor1.address);
      expect(afterBalance).to.be.gt(beforeBalance);
    });
  });
});
```

## Running Tests

Run your tests with the following command:

```bash
npx hardhat test
```

For a specific test file:

```bash
npx hardhat test test/factory-test.js
```

For verbose output:

```bash
npx hardhat test --verbose
```

## Test Coverage

You can also add test coverage analysis:

```bash
npm install --save-dev solidity-coverage
```

Add to your `hardhat.config.js`:

```javascript
require("solidity-coverage");
```

Run coverage analysis:

```bash
npx hardhat coverage
```

## Testing Tips

1. **Isolate Tests**: Each test should be independent of others
2. **Test Edge Cases**: Try to break your contracts with unexpected input
3. **Test State Changes**: Verify that contract state changes as expected
4. **Test Events**: Verify that events are emitted with correct arguments
5. **Test Reverts**: Verify that functions revert in expected conditions
6. **Gas Analysis**: Use `hardhat-gas-reporter` to analyze gas costs

## Common Test Scenarios

- Donation before/after deadline
- Milestone approval/rejection voting
- Fund release calculations 
- Token distribution and valuation
- Refund mechanisms
- Access control (only owner, only donor)
- Edge cases with milestone voting

## Debugging

Use `console.log` in your contracts (requires `hardhat-console`):

```solidity
import "hardhat/console.sol";

function calculateVotingResult() internal {
    console.log("Calculating voting result for milestone: %d", onMilestone);
    // Rest of the function...
}
```
