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
  });

  describe("Campaign Creation", function () {
    it("Should create a new campaign with correct parameters", async function () {
      // Set deadline far in the future to avoid timing issues
      const deadline = Math.floor(Date.now() / 1000) + 60*60*24*30; // 30 days from now
      
      // Campaign parameters
      const title = "Test Campaign";
      const photoLink = "irys.xyz/test-photo";
      const descriptionLink = "irys.xyz/test-description";
      const targetAmount = ethers.parseUnits("10", "ether"); // 10 ETH - use parseUnits instead of parseEther
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
      const deadline = Math.floor(Date.now() / 1000) + 60*60*24*30; // 30 days
      
      // Missing one milestone title
      await expect(
        campaignFactory.createCampaign(
          addr1.address,
          "Test Campaign",
          "irys.xyz/test-photo",
          "irys.xyz/test-desc",
          ethers.parseUnits("10", "ether"),
          deadline,
          2, // 2 milestones
          [50, 50],
          ["Only One Title"], // Should be 2 titles
          ["irys.xyz/m1-photo", "irys.xyz/m2-photo"],
          ["irys.xyz/m1-desc", "irys.xyz/m2-desc"]
        )
      ).to.be.revertedWith("Data missing");
    });
    
    it("Should revert if milestone release ratios don't sum to 100%", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 60*60*24*30; // 30 days
      
      // Release ratios sum to 90, not 100
      await expect(
        campaignFactory.createCampaign(
          addr1.address,
          "Test Campaign",
          "irys.xyz/test-photo",
          "irys.xyz/test-desc",
          ethers.parseUnits("10", "ether"),
          deadline,
          2,
          [40, 50], // Should sum to 100
          ["Milestone 1", "Milestone 2"],
          ["irys.xyz/m1-photo", "irys.xyz/m2-photo"],
          ["irys.xyz/m1-desc", "irys.xyz/m2-desc"]
        )
      ).to.be.revertedWith("Total release ratio != 100");
    });
  });

  describe("Campaign Tracking", function () {
    it("Should correctly track multiple campaigns", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 60*60*24*30; // 30 days
      
      // Create first campaign
      await campaignFactory.createCampaign(
        addr1.address,
        "First Campaign",
        "irys.xyz/photo1",
        "irys.xyz/desc1",
        ethers.parseUnits("5", "ether"),
        deadline,
        1,
        [100],
        ["Single Milestone"],
        ["irys.xyz/m-photo"],
        ["irys.xyz/m-desc"]
      );
      
      // Create second campaign
      await campaignFactory.createCampaign(
        addr2.address,
        "Second Campaign",
        "irys.xyz/photo2",
        "irys.xyz/desc2",
        ethers.parseUnits("10", "ether"),
        deadline,
        2,
        [50, 50],
        ["M1", "M2"],
        ["irys.xyz/m1-photo", "irys.xyz/m2-photo"],
        ["irys.xyz/m1-desc", "irys.xyz/m2-desc"]
      );
      
      // Get all campaigns
      const campaigns = await campaignFactory.getCampaigns();
      expect(campaigns.length).to.equal(2);
      
      // Check campaign addresses are different
      expect(campaigns[0]).to.not.equal(campaigns[1]);
      
      // Connect to first campaign and verify its owner
      const Campaign = await ethers.getContractFactory("Campaign");
      const firstCampaign = Campaign.attach(campaigns[0]);
      expect(await firstCampaign.owner()).to.equal(addr1.address);
      
      // Connect to second campaign and verify its owner
      const secondCampaign = Campaign.attach(campaigns[1]);
      expect(await secondCampaign.owner()).to.equal(addr2.address);
    });
  });
});
