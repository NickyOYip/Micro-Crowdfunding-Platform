// This file provides helper functions for campaign-related operations in tests

const { ethers } = require("hardhat");

/**
 * Creates a standard campaign for testing
 * @param {Contract} factory - The campaign factory contract
 * @param {Object} details - Campaign details
 * @param {Address} owner - Campaign owner address
 * @returns {Promise<Contract>} Campaign contract instance
 */
async function createStandardCampaign(factory, details, owner) {
  // Set default values
  const defaultDetails = {
    title: "Test Campaign",
    photoLink: "ipfs://photo-hash",
    descriptionLink: "ipfs://description-hash",
    targetAmount: ethers.utils.parseEther("10"),
    deadline: Math.floor(Date.now() / 1000) + 30 * 86400, // 30 days from now
    milestoneCount: 3,
    milestoneReleaseRatios: [30, 30, 40], // 30%, 30%, 40% = 100%
    milestoneTitles: ["Milestone 1", "Milestone 2", "Milestone 3"],
    milestonePhotoLinks: ["ipfs://m1-photo", "ipfs://m2-photo", "ipfs://m3-photo"],
    milestoneDescLinks: ["ipfs://m1-desc", "ipfs://m2-desc", "ipfs://m3-desc"]
  };

  // Override with provided details
  const campaignDetails = { ...defaultDetails, ...details };

  // Create campaign
  const tx = await factory.createCampaign(
    owner,
    campaignDetails.title,
    campaignDetails.photoLink,
    campaignDetails.descriptionLink,
    campaignDetails.targetAmount,
    campaignDetails.deadline,
    campaignDetails.milestoneCount,
    campaignDetails.milestoneReleaseRatios,
    campaignDetails.milestoneTitles,
    campaignDetails.milestonePhotoLinks,
    campaignDetails.milestoneDescLinks
  );

  // Get campaign address from event
  const receipt = await tx.wait();
  const event = receipt.events.find(event => event.event === 'campaignCreated');
  const campaignAddress = event.args.campaign;

  // Attach to campaign contract
  const Campaign = await ethers.getContractFactory("Campaign");
  return await Campaign.attach(campaignAddress);
}

/**
 * Completes a milestone (submits proof, starts voting, votes approve, and releases funds)
 * @param {Contract} campaign - The campaign contract
 * @param {number} milestoneId - The milestone ID to complete
 * @param {Address} owner - Campaign owner address
 * @param {Address} approver - Address that will vote to approve
 */
async function completeMilestone(campaign, milestoneId, owner, approver) {
  // Submit proof
  await campaign.connect(owner).submitMilestoneProof(
    milestoneId,
    "Completion Proof",
    "ipfs://proof-photo",
    "ipfs://proof-description"
  );

  // Request voting
  await campaign.connect(owner).requestVoting();

  // Approve milestone
  await campaign.connect(approver).castVoteOnMilestone(true);

  // Fast-forward past voting deadline
  const milestone = await campaign.getMilestoneInfo(milestoneId);
  await ethers.provider.send("evm_setNextBlockTimestamp", [milestone.votingDeadline.toNumber() + 1]);
  await ethers.provider.send("evm_mine");

  // Calculate voting result
  await campaign.getVotingResult(milestoneId);

  // Release funds
  await campaign.connect(owner).releaseFunds(milestoneId);
}

module.exports = {
  createStandardCampaign,
  completeMilestone
};
