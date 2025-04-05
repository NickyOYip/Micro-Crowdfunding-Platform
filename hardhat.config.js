require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      viaIR: false,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      mining: {
        auto: true,
        interval: 0
      },
      allowBlocksWithSameTimestamp: true // Allow blocks with same timestamp
    }
  },
  paths: {
    sources: "./web3/contracts",
    tests: "./web3/test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
