require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("solidity-coverage");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  gasReporter: {
    enabled: true,
    currency: 'CHF',
    gasPrice: 21
  },
  networks: {
    testnet: {
      url: process.env.URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {
      mining: {
        auto: false,
        interval: 5000
      },
      blockGasLimit: 0x1fffffffffffff,
      gasPrice: 12000000,
      allowUnlimitedContractSize: true,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12"
      },
      {
        version: "0.6.6"
      },
      {
        version: "0.7.3"
      },
      {
        version: "0.8.4"
      }
    ],
		settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  } 
};
