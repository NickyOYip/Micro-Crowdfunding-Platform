const fs = require('fs');
const path = require('path');

// Delete Lock.js test if exists
const lockTestPath = path.join(__dirname, '../test/Lock.js');
if (fs.existsSync(lockTestPath)) {
  console.log('Removing default Lock.js test...');
  fs.unlinkSync(lockTestPath);
}

// Delete Lock.sol contract if exists
const lockContractPath = path.join(__dirname, '../contracts/Lock.sol');
if (fs.existsSync(lockContractPath)) {
  console.log('Removing default Lock.sol contract...');
  fs.unlinkSync(lockContractPath);
}

console.log('Cleanup completed. Run your tests with "npx hardhat test"');
