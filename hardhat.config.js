require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true //to enable contracts interaction in /backend/scripts/deploy.js
    },
    localhost: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      allowUnlimitedContractSize: true //to enable contracts interaction in /backend/scripts/deploy.js
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/e7upsRO2achX0qfwAe0fJd-V9F8lRpg5`,
      accounts: [`fcc3f0b0e8a622b50ff969c4f4f12f572c77b1b03429441df3b9c2617d126470`],
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/e7upsRO2achX0qfwAe0fJd-V9F8lRpg5`,
      accounts: [`YOUR_PRIVATE_KEY`],
    },
  },
  solidity: "0.8.4",
};
