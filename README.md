# Micro-Crowdfunding Platform

A decentralized milestone-based crowdfunding platform built with Ethereum smart contracts, React, and Irys (for decentralized storage).

![Platform Screenshot](./screenshots/platform-screenshot.png)

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Frontend Setup](#frontend-setup)
- [Usage Guide](#usage-guide)
- [Key Design Elements](#key-design-elements)
- [Development Notes](#development-notes)

## Features

- **Milestone-based Funding**: Funds are released to creators only after milestone completion is approved
- **Decentralized Storage**: Campaign descriptions and proof submissions stored on Irys network
- **Token-weighted Governance**: Donors receive tokens proportional to their contribution
- **Transparent Voting**: Donors vote on milestone completion with token-weighted voting
- **Refund Mechanism**: Automatic refunds if campaigns fail or milestones are rejected

## Architecture

The platform consists of two main components:

1. **Smart Contracts (Ethereum/Solidity)**
   - `CampaignFactory`: Creates and tracks campaign contracts
   - `Campaign`: Handles donations, milestone management, and voting

2. **Frontend (React/Vite)**
   - Connects to Ethereum via browser wallets (MetaMask)
   - Uploads content to Irys decentralized storage
   - Provides intuitive UI for campaign creation, donation, and governance

## Prerequisites

- Node.js v16+ and npm
- MetaMask or compatible Ethereum wallet
- Hardhat for local blockchain development
- Access to Ethereum testnet (Sepolia recommended) or mainnet
- Basic knowledge of React and Ethereum

## Environment Setup

### 1. Clone the repository

```bash
git clone https://github.com/NickyOYip/Micro-Crowdfunding-Platform.git
cd Micro-Crowdfunding-Platform
```

### 2. Smart Contract Environment

Create a `.env` file in the `web3` directory:

`.env.example`is for your reference

Edit the `.env` file with your credentials:

```
PRIVATE_KEY=your_ethereum_private_key
SEPOLIA_RPC_URL=your_sepolia_rpc_url
```

Install dependencies:

```bash
npm install
```

### 3. Frontend Environment

the `irys-vite` directory:

Install dependencies:

```bash
npm install
```

## Smart Contract Deployment

### Testnet Deployment

Deploy to Sepolia testnet:

```bash
cd web3
npx hardhat run scripts/deploy.js --network sepolia
```

Take note of the contract address output and update `factoryAddress:` in your frontend `irys-vite\src\provider\dataProvider.tsx` file.

```bash
import { createContext, useState } from 'react';

/**
 * @title DataContext
 * @notice Provides a context for the data store
 */
export const DataContext = createContext();



const DataProvider = ({ children }) => {
  // Initialize the global state
  const [data, setData] = useState({

    //wallet instance
    ethProvider: null, // ethers.BrowserProvider instance
    irysUploader: null, // Irys uploader instance
    

    //fetch by contract
    userContractAddress: null, 
    

    //network setting
    factoryAddress: '0xd7e62df6F0DE61f1a47D3b0004dF8Faf15d41Bfe', // Factory contract address on testnet
    // Store for campaign data
    campaigns: [], // Array of campaign addresses
    campaignDetails: {}, // Address -> details mapping
    
    // Add other global state variables here
  });

  /**
   * @notice Updates the global state
   * @param {Object} newData - New data to update the context with.
   * @dev This function is used to update global data like account, network, etc.
   */
  const updateData = (newData) => {
    setData((prevData) => ({ ...prevData, ...newData }));
  };

  return (
    /**
     * @title DataContext.Provider
     * @notice Provides the global state and update function to the children components
     */
    <DataContext.Provider value={{ data, updateData }}>
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;

```

### Verify Contracts (Optional)

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Frontend Setup

### Development Mode

Run the development server:

```bash
cd irys-vite
npm run dev
```

The application will be available at `http://localhost:5173/`

## Usage Guide

1. **Connect Wallet**: Connect your MetaMask or compatible wallet ****suggested metamask ver. : 12.13.0 --other version may have error in contract validation
2. **Explore Campaigns**: Browse active campaigns on the home page
3. **Create Campaign**: 
   - Set campaign details and funding goal
   - Define milestones with release ratios (must total 100%)
   - Upload campaign images and descriptions
4. **Donate to Campaigns**: Support campaigns with ETH
5. **Campaign Owner Functions**:
   - Submit proof of milestone completion
   - Request voting on milestones
   - Release funds after approval
6. **Donor Functions**:
   - Vote on milestone completion
   - Request refund if campaign fails

## Key Design Elements

### Milestone-based Funding

Campaigns are divided into milestones, each with:
- Description and objectives
- Percentage of funds to be released
- Proof submission requirements
- Voting mechanism for approval

### Token Economics

- Donors receive governance tokens proportional to their contribution
- Token value is fixed at creation (1 token = 1000000000 wei initially)
- Token value decreases as milestones are completed, incentivizing early supporters
- Tokens determine voting weight in milestone approval votes

### Voting Mechanism

- Campaign owners submit proof of milestone completion
- Owners request voting to start a 7-day voting period
- Donors vote to approve or reject milestone completion
- Votes are weighted by token holdings
- Milestone is approved if approve votes > reject + abstain votes

### Security Features

- Owner and donor access controls
- Deadline enforcement for campaigns and voting
- Status tracking for campaigns and milestones
- Refund mechanisms for failed campaigns

## Development Notes

- Smart contracts are written in Solidity ^0.8.19
- Frontend uses React 19 with Vite
- Styling with TailwindCSS
- File storage via Irys decentralized network
- Web3 connection via Ethers.js v6

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.