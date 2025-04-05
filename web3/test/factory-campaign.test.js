const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Micro-Crowdfunding Platform", function () {
  // Variables used across tests
  let CampaignFactory;
  let factory;
  let Campaign;
  let campaignAddress;
  let campaign;

  // Accounts
  let owner;
  let donor1;
  let donor2;
  let donor3;

  // Campaign details
  const title = "Test Campaign";
  const photoLink = "ipfs://photo-hash";
  const descriptionLink = "ipfs://description-hash";
  let targetAmount;
  const SECONDS_IN_DAY = 86400;
  let deadline;
  
  // Milestone details
  const milestoneCount = 3;
  const milestoneReleaseRatios = [30, 40, 30]; // 30%, 40%, 30% = 100%
  const milestoneTitles = ["Milestone 1", "Milestone 2", "Milestone 3"];
  const milestonePhotoLinks = ["ipfs://milestone1-photo", "ipfs://milestone2-photo", "ipfs://milestone3-photo"];
  const milestoneDescLinks = ["ipfs://milestone1-desc", "ipfs://milestone2-desc", "ipfs://milestone3-desc"];
  
  // Proof details for milestone completion
  const proofTitle = "Completion Proof";
  const proofPhotoLink = "ipfs://proof-photo";
  const proofDescriptionLink = "ipfs://proof-description";

  beforeEach(async function () {
    console.log("Setting up test environment...");
    // Get signers
    [owner, donor1, donor2, donor3] = await ethers.getSigners();
    
    targetAmount = ethers.parseEther("10"); // 10 ETH
    
    // Set deadline 30 days from now
    const latestBlock = await ethers.provider.getBlock("latest");
    deadline = latestBlock.timestamp + (30 * SECONDS_IN_DAY);
    
    // Deploy factory contract
    CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    factory = await CampaignFactory.deploy();
    const factoryAddress = await factory.getAddress();
    console.log(`Factory deployed at: ${factoryAddress}`);
    
    // Create a new campaign
    const tx = await factory.createCampaign(
      owner.address,
      title,
      photoLink,
      descriptionLink,
      targetAmount,
      deadline,
      milestoneCount,
      milestoneReleaseRatios,
      milestoneTitles,
      milestonePhotoLinks,
      milestoneDescLinks
    );
    
    const receipt = await tx.wait();
    console.log(`Campaign creation transaction mined in block ${receipt.blockNumber}`);
    
    const logDescription = receipt.logs
      .map(log => {
        try {
          return factory.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
        } catch (e) {
          return null;
        }
      })
      .find(desc => desc && desc.name === 'campaignCreated');
    
    if (!logDescription) {
      console.error("Campaign created event not found in logs");
      throw new Error("Campaign created event not found");
    }
    
    campaignAddress = logDescription.args[1]; // args[1] should be the campaign address
    console.log(`New campaign created at: ${campaignAddress}`);
    
    // Get campaign contract instance
    Campaign = await ethers.getContractFactory("Campaign");
    campaign = Campaign.attach(campaignAddress);
  });

  describe("Factory Contract", function () {
    it("Should deploy successfully", async function () {
      const factoryAddress = await factory.getAddress();
      console.log(`Testing factory at: ${factoryAddress}`);
      expect(factoryAddress).to.be.a('string');
      expect(factoryAddress).to.match(/^0x[0-9a-fA-F]{40}$/);
    });
    
    it("Should create a new campaign", async function () {
      expect(campaignAddress).to.be.properAddress;
      
      // Check campaign is in the factory's list
      const campaigns = await factory.getCampaigns();
      expect(campaigns).to.include(campaignAddress);
    });
    
    it("Should create multiple campaigns", async function() {
      // Create a second campaign
      await factory.createCampaign(
        owner.address,
        "Second Campaign",
        photoLink,
        descriptionLink,
        targetAmount,
        deadline,
        milestoneCount,
        milestoneReleaseRatios,
        milestoneTitles,
        milestonePhotoLinks,
        milestoneDescLinks
      );
      
      const campaigns = await factory.getCampaigns();
      expect(campaigns.length).to.equal(2);
    });
  });

  describe("Campaign Contract", function() {
    it("Should initialize campaign correctly", async function () {
      // Check basic campaign info
      const info = await campaign.getInfo();
      expect(info.owner).to.equal(owner.address);
      expect(info.title).to.equal(title);
      expect(info.photoLink).to.equal(photoLink);
      expect(info.descriptionLink).to.equal(descriptionLink);
      expect(info.targetRaisedAmount).to.equal(targetAmount);
      expect(info.deadline).to.equal(deadline);
      expect(info.status).to.equal(0); // Status.Active
      expect(info.onMilestone).to.equal(0);
      expect(info.milestoneCount).to.equal(milestoneCount);
    });
    
    it("Should retrieve milestone information", async function() {
      // Check first milestone info
      const milestone0 = await campaign.getMilestoneInfo(0);
      expect(milestone0.releaseRatio).to.equal(30);
      expect(milestone0.proposalInfo.title).to.equal("Milestone 1");
      
      // Check all milestones
      const allMilestones = await campaign.getAllMilestones();
      expect(allMilestones.length).to.equal(milestoneCount);
    });
  });

  describe("Donation Flow", function() {
    it("Should accept donations and issue tokens", async function() {
      // Donate 1 ETH from donor1
      const donationAmount = ethers.parseEther("1");
      await campaign.connect(donor1).donate({ value: donationAmount });
      
      // Check campaign raised amount
      const info = await campaign.getInfo();
      expect(info.raisedAmount).to.equal(donationAmount);
      
      // Check donor token balance
      const tokenInfo = await campaign.getToken(donor1.address);
      expect(tokenInfo[0]).to.be.gt(0); // Should have some tokens
    });
    
    it("Should reject donations after deadline", async function() {
      // Move time forward past deadline
      await time.increaseTo(deadline + 1);
      
      // Try to donate
      const donationAmount = ethers.parseEther("1");
      await expect(
        campaign.connect(donor1).donate({ value: donationAmount })
      ).to.be.revertedWith("Late donation X");
    });
  });

  describe("Milestone Management", function() {
    beforeEach(async function() {
      // Donate 5 ETH from multiple donors
      await campaign.connect(donor1).donate({ value: ethers.parseEther("2") });
      await campaign.connect(donor2).donate({ value: ethers.parseEther("1.5") });
      await campaign.connect(donor3).donate({ value: ethers.parseEther("1.5") });
    });
    
    it("Should submit milestone proof", async function() {
      await campaign.connect(owner).submitMilestoneProof(
        0, // First milestone
        proofTitle,
        proofPhotoLink,
        proofDescriptionLink
      );
      
      const milestone = await campaign.getMilestoneInfo(0);
      expect(milestone.proofInfo.title).to.equal(proofTitle);
      expect(milestone.proofInfo.photoLink).to.equal(proofPhotoLink);
      expect(milestone.proofInfo.descriptionLink).to.equal(proofDescriptionLink);
    });
    
    it("Should request voting with proof", async function() {
      // Submit proof first
      await campaign.connect(owner).submitMilestoneProof(
        0,
        proofTitle,
        proofPhotoLink,
        proofDescriptionLink
      );
      
      // Request voting
      await campaign.connect(owner).requestVoting();
      
      const milestone = await campaign.getMilestoneInfo(0);
      expect(milestone.votingDeadline).to.be.gt(0);
    });
    
    it("Should not allow voting request without proof", async function() {
      await expect(
        campaign.connect(owner).requestVoting()
      ).to.be.revertedWith("Proof must be submitted first");
    });
    
    it("Should allow donors to vote", async function() {
      // Setup voting
      await campaign.connect(owner).submitMilestoneProof(0, proofTitle, proofPhotoLink, proofDescriptionLink);
      await campaign.connect(owner).requestVoting();
      
      // Donors vote
      await campaign.connect(donor1).castVoteOnMilestone(true); // Approve
      await campaign.connect(donor2).castVoteOnMilestone(true); // Approve
      await campaign.connect(donor3).castVoteOnMilestone(false); // Reject
      
      // Check voting status
      const milestone = await campaign.getMilestoneInfo(0);
      expect(milestone.userVote).to.equal(0); // Should be NotVoteYet for current user (owner)
    });
  });

  describe("Fund Release and Campaign Completion", function() {
    beforeEach(async function() {
      // Donate enough to fully fund the campaign
      await campaign.connect(donor1).donate({ value: ethers.parseEther("10") });
      
      // Complete first milestone
      await campaign.connect(owner).submitMilestoneProof(0, proofTitle, proofPhotoLink, proofDescriptionLink);
      await campaign.connect(owner).requestVoting();
      await campaign.connect(donor1).castVoteOnMilestone(true);
      
      // Fast-forward past voting deadline
      const milestone = await campaign.getMilestoneInfo(0);
      await time.increaseTo(milestone.votingDeadline.toNumber() + 1);
      
      // Calculate voting result
      await campaign.getVotingResult(0);
    });
    
    it("Should release funds for completed milestone", async function() {
      // Check owner's balance before
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      // Release funds
      await campaign.connect(owner).releaseFunds(0);
      
      // Check owner's balance after
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter.sub(balanceBefore)).to.be.gt(0);
      
      // Check campaign status
      const info = await campaign.getInfo();
      expect(info.onMilestone).to.equal(1); // Should move to next milestone
    });
    
    it("Should complete campaign when all milestones are released", async function() {
      // Complete all milestones sequentially
      for (let i = 0; i < milestoneCount; i++) {
        if (i > 0) {
          await campaign.connect(owner).submitMilestoneProof(i, proofTitle, proofPhotoLink, proofDescriptionLink);
          await campaign.connect(owner).requestVoting();
          await campaign.connect(donor1).castVoteOnMilestone(true);
          
          // Fast-forward past voting deadline
          const milestone = await campaign.getMilestoneInfo(i);
          await time.increaseTo(milestone.votingDeadline.toNumber() + 1);
          
          // Calculate voting result
          await campaign.getVotingResult(i);
        }
        
        await campaign.connect(owner).releaseFunds(i);
      }
      
      // Check campaign is completed
      const info = await campaign.getInfo();
      expect(info.status).to.equal(1); // Status.Completed
    });
  });

  describe("Campaign Failure and Refunds", function() {
    beforeEach(async function() {
      // Donate from multiple donors
      await campaign.connect(donor1).donate({ value: ethers.parseEther("2") });
      await campaign.connect(donor2).donate({ value: ethers.parseEther("1") });
    });
    
    it("Should allow refunds if deadline passes without completion", async function() {
      // Fast-forward past campaign deadline
      await time.increaseTo(deadline + 1);
      
      // Check donor1 balance before refund
      const balanceBefore = await ethers.provider.getBalance(donor1.address);
      
      // Request refund
      await campaign.connect(donor1).requestRefund();
      
      // Check donor1 balance after refund
      const balanceAfter = await ethers.provider.getBalance(donor1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
    
    it("Should allow refunds if milestone fails", async function() {
      // Make milestone fail through voting
      await campaign.connect(owner).submitMilestoneProof(0, proofTitle, proofPhotoLink, proofDescriptionLink);
      await campaign.connect(owner).requestVoting();
      
      // Both donors vote reject
      await campaign.connect(donor1).castVoteOnMilestone(false);
      await campaign.connect(donor2).castVoteOnMilestone(false);
      
      // Fast-forward past voting deadline
      const milestone = await campaign.getMilestoneInfo(0);
      await time.increaseTo(milestone.votingDeadline.toNumber() + 1);
      
      // Calculate voting result
      await campaign.getVotingResult(0);
      
      // Campaign should be in failed state now
      const info = await campaign.getInfo();
      expect(info.status).to.equal(2); // Status.Failed
      
      // Donors should be able to refund
      await campaign.connect(donor1).requestRefund();
      await campaign.connect(donor2).requestRefund();
    });
  });
});
