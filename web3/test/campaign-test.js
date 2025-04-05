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
  let startTime;
  let deadline;

  beforeEach(async function () {
    // Reset the blockchain time at the start of each test with the current time
    // Add 10 seconds to avoid timestamp collision with previous tests
    startTime = Math.floor(Date.now() / 1000) + 10;
    
    // Get signers first to avoid timestamp conflicts
    [owner, donor1, donor2] = await ethers.getSigners();
    
    // Set the time and mine a block
    await ethers.provider.send("evm_setNextBlockTimestamp", [startTime]);
    await ethers.provider.send("evm_mine");
    
    // Set deadline to 60 days from startTime
    deadline = startTime + 60*60*24*60; // 60 days from now

    // Get the ContractFactory
    Campaign = await ethers.getContractFactory("Campaign");
    const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    
    // Deploy factory
    factory = await CampaignFactory.deploy();
    
    // Create a new campaign through the factory
    const tx = await factory.createCampaign(
      owner.address,
      "Test Campaign",
      "irys.xyz/test-photo",
      "irys.xyz/test-description",
      ethers.parseUnits("10", "ether"), // 10 ETH target
      deadline,
      2, // 2 milestones
      [60, 40], // 60% and 40% release ratio
      ["Milestone 1", "Milestone 2"],
      ["irys.xyz/m1-photo", "irys.xyz/m2-photo"],
      ["irys.xyz/m1-desc", "irys.xyz/m2-desc"]
    );
    
    const receipt = await tx.wait();
    
    // Fix for ethers.js v6: Use logs and parse events manually
    // Look for the campaignCreated event in the logs
    const abi = ["event campaignCreated(address indexed owner, address indexed campaign)"];
    const iface = new ethers.Interface(abi);
    
    // Find the log that matches our event
    const log = receipt.logs.find(log => {
      try {
        const parsed = iface.parseLog(log);
        return parsed.name === 'campaignCreated';
      } catch (e) {
        return false;
      }
    });
    
    // Parse the log to get the event data
    const parsedLog = iface.parseLog(log);
    campaignAddress = parsedLog.args.campaign;
    
    // Connect to the newly created campaign
    campaign = await ethers.getContractAt("Campaign", campaignAddress);
  });

  describe("Campaign Donation", function () {
    it("Should accept donations and update token balances", async function () {
      const donationAmount = ethers.parseUnits("1", "ether"); // 1 ETH
      
      // Donor1 donates
      await expect(campaign.connect(donor1).donate({ value: donationAmount }))
        .to.emit(campaign, "userDonated")
        .withArgs(donor1.address, campaignAddress);
        
      // Check campaign state after donation
      const info = await campaign.getInfo();
      expect(info.raisedAmount).to.equal(donationAmount);
      
      // Check donor's token balance - Fix for ethers v6
      const tokenInfo = await campaign.getToken(donor1.address);
      
      // In ethers v6, we need to use BigInt for numeric comparisons
      const expectedTokens = BigInt(donationAmount) / BigInt(1000000000);
      expect(tokenInfo.amount).to.equal(expectedTokens);
    });
    
    it("Should reject donations after deadline", async function () {
      // Get the actual deadline from the contract
      const info = await campaign.getInfo();
      const deadline = info.deadline;
      
      // Increase time to exactly past the deadline
      await ethers.provider.send("evm_setNextBlockTimestamp", [Number(deadline) + 1]);
      await ethers.provider.send("evm_mine");
      
      // Try to donate after deadline
      await expect(
        campaign.connect(donor1).donate({ value: ethers.parseUnits("1", "ether") })
      ).to.be.revertedWith("Late donation X");
    });
  });

  describe("Milestone Management", function () {
    beforeEach(async function () {
      // Explicitly set the time to be well before deadline
      // Add a small increment to avoid timestamp collision
      const currentTestTime = startTime + 100;
      await ethers.provider.send("evm_setNextBlockTimestamp", [currentTestTime]);
      await ethers.provider.send("evm_mine");
      
      // Verify we're before deadline
      const info = await campaign.getInfo();
      expect(Number(info.deadline)).to.be.gt(currentTestTime);
      
      // Donor1 donates
      await campaign.connect(donor1).donate({ 
        value: ethers.parseUnits("5", "ether") 
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
    
    it("Should calculate voting results correctly", async function () {
      // Start voting
      await campaign.connect(owner).requestVoting();
      
      // Donor1 votes to approve (has 5 ETH worth of tokens)
      await campaign.connect(donor1).castVoteOnMilestone(true);
      
      // Advance time past voting deadline
      await ethers.provider.send("evm_increaseTime", [60*60*24*8]); // 8 days
      await ethers.provider.send("evm_mine");
      
      // Get voting result
      const [approveVotes, rejectVotes, notVoteYetVotes] = await campaign.getVotingResult(0);
      
      // With only approving votes, milestone should be approved
      expect(approveVotes).to.be.gt(0);
      expect(rejectVotes).to.equal(0);
      expect(notVoteYetVotes).to.equal(0);
    });
    
    it("Should release funds when milestone is approved", async function () {
      // Start voting
      await campaign.connect(owner).requestVoting();
      
      // Donor votes to approve
      await campaign.connect(donor1).castVoteOnMilestone(true);
      
      // Advance time past voting deadline
      await ethers.provider.send("evm_increaseTime", [60*60*24*8]); // 8 days
      await ethers.provider.send("evm_mine");
      
      // Get voting result to update milestone status
      await campaign.getVotingResult(0);
      
      // Owner releases funds
      const beforeBalance = await ethers.provider.getBalance(owner.address);
      
      // Release funds for milestone 0
      await expect(campaign.connect(owner).releaseFunds(0))
        .to.emit(campaign, "moveToNextMilestone")
        .withArgs(campaignAddress, 1);
        
      const afterBalance = await ethers.provider.getBalance(owner.address);
      expect(afterBalance).to.be.gt(beforeBalance);
      
      // Check that we've moved to the next milestone
      const info = await campaign.getInfo();
      expect(info.onMilestone).to.equal(1);
      
      // Token value should have decreased
      const tokenInfo = await campaign.getToken(donor1.address);
      expect(tokenInfo[1]).to.be.lt(1000000000); // Less than initial value
    });
  });
  
  describe("Refund Mechanism", function() {
    it("Should allow refunds if campaign fails due to deadline", async function() {
      // Set time to be well before deadline - add more time to avoid collision
      const donationTime = startTime + 200;
      await ethers.provider.send("evm_setNextBlockTimestamp", [donationTime]);
      await ethers.provider.send("evm_mine");
      
      // Get the current info
      const info = await campaign.getInfo();
      expect(Number(info.deadline)).to.be.gt(donationTime);
      
      // Donor1 donates
      const donationAmount = ethers.parseUnits("1", "ether");
      await campaign.connect(donor1).donate({ value: donationAmount });
      
      // Advance time past the deadline (exact deadline + 1 second)
      await ethers.provider.send("evm_setNextBlockTimestamp", [Number(info.deadline) + 1]);
      await ethers.provider.send("evm_mine");
      
      // Balance before refund
      const beforeBalance = await ethers.provider.getBalance(donor1.address);
      
      // Request refund
      await campaign.connect(donor1).requestRefund();
      
      // Check balance after refund
      const afterBalance = await ethers.provider.getBalance(donor1.address);
      expect(afterBalance).to.be.gt(beforeBalance);
      
      // Check token balance is now 0
      const tokenInfo = await campaign.getToken(donor1.address);
      expect(tokenInfo.amount).to.equal(0);
    });
    
    it("Should allow refunds if milestone is rejected", async function() {
      // Set time to be well before deadline - add even more time to avoid collision
      const donationTime = startTime + 300;
      await ethers.provider.send("evm_setNextBlockTimestamp", [donationTime]);
      await ethers.provider.send("evm_mine");
      
      // Ensure we're well before deadline
      const campaignInfo = await campaign.getInfo();
      expect(Number(campaignInfo.deadline)).to.be.gt(donationTime);
      
      // Donors donate
      await campaign.connect(donor1).donate({ value: ethers.parseUnits("2", "ether") });
      await campaign.connect(donor2).donate({ value: ethers.parseUnits("5", "ether") });
      
      // Submit proof and start voting
      await campaign.connect(owner).submitMilestoneProof(
        0, "Proof", "irys.xyz/photo", "irys.xyz/desc"
      );
      await campaign.connect(owner).requestVoting();
      
      // Donor1 approves but donor2 rejects (donor2 has more voting power)
      await campaign.connect(donor1).castVoteOnMilestone(true);
      await campaign.connect(donor2).castVoteOnMilestone(false);
      
      // Get current voting deadline
      const milestoneInfo = await campaign.getMilestoneInfo(0);
      const votingDeadline = Number(milestoneInfo.votingDeadline);
      
      // Advance time past voting deadline (exact deadline + 1 second)
      await ethers.provider.send("evm_setNextBlockTimestamp", [votingDeadline + 1]);
      await ethers.provider.send("evm_mine");
      
      // Get voting result to update milestone status
      await campaign.getVotingResult(0);
      
      // Campaign should be failed now
      const statusInfo = await campaign.getInfo();
      expect(statusInfo.status).to.equal(2); // 2 = Failed
      
      // Request refund
      const beforeBalance = await ethers.provider.getBalance(donor1.address);
      await campaign.connect(donor1).requestRefund();
      const afterBalance = await ethers.provider.getBalance(donor1.address);
      
      // Should have received refund
      expect(afterBalance).to.be.gt(beforeBalance);
    });
  });
});
