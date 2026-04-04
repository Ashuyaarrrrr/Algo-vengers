require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },

  networks: {
    // Local Hardhat node — run `npm run node` first, then `npm run deploy:local`
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // Hardhat in-process network (used automatically during `hardhat test`)
    hardhat: {
      chainId: 31337,
    },

    // Future: uncomment and fill in .env to deploy to testnets
    // polygon_amoy: {
    //   url: process.env.POLYGON_AMOY_RPC_URL || "",
    //   accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    //   chainId: 80002,
    // },
  },

  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },

  // Etherscan / Polygonscan verification (optional — fill in .env later)
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};
