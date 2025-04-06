const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying CampaignFactory contract...");

  // Deploy the CampaignFactory contract
  const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
  const factory = await CampaignFactory.deploy();

  await factory.waitForDeployment();
  
  const address = await factory.getAddress();
  console.log(`CampaignFactory deployed to: ${address}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });