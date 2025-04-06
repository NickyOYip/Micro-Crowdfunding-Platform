require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true, // Add this line to enable IR-based compilation
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      mining: {
        auto: true,
        interval: 0
      }
    },
    sepolia: {
      url: SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
      chainId: 11155111,
    },
  },
  mocha: {
    timeout: 40000
  }
};
