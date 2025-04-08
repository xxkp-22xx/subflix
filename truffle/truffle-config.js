const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
console.log("PRIVATE_KEY:", PRIVATE_KEY ? "[OK]" : "[MISSING]");
console.log("ALCHEMY_API_KEY:", ALCHEMY_API_KEY ? "[OK]" : "[MISSING]");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Ganache local network
    },
    sepolia: {
      provider: () =>
      new HDWalletProvider(
        [PRIVATE_KEY], // pass as array
        `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      ),
      network_id: 11155111, // Sepolia testnet
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },

  mocha: {},

  compilers: {
    solc: {
      version: "0.8.1",
    },
  },
};
