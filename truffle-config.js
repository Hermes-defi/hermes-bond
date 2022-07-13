require('dotenv').config();
const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require('fs');
const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  networks: {
    dev: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    tenderly: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*",
      gasPrice: 0
    },
    ftm: {
      provider: () => new HDWalletProvider(
          {
            privateKeys: [PRIVATE_KEY],
            providerOrUrl: `wss://speedy-nodes-nyc.moralis.io/${process.env.MORALIS}/fantom/mainnet/ws`,
            addressIndex: 0
          }),
      network_id: 1,
      networkCheckTimeout: 1000000,
      confirmations: 3,
      timeoutBlocks: 50000,
      websocket: true,
      skipDryRun: true
    },
    ftm_testnet: {
      provider: () => new HDWalletProvider(
          {
            privateKeys: [PRIVATE_KEY],
            providerOrUrl: `https://rpc.testnet.fantom.network`,
            addressIndex: 0
          }),
      network_id: 4002,
      networkCheckTimeout: 1000000,
      confirmations: 3,
      timeoutBlocks: 50000,
      websocket: true,
      skipDryRun: true
    },
    avax: {
      provider: () => new HDWalletProvider(
          {
            privateKeys: [PRIVATE_KEY],
            providerOrUrl: `wss://speedy-nodes-nyc.moralis.io/${process.env.MORALIS}/avalanche/mainnet/ws`,
            addressIndex: 0
          }),
      network_id: 1,
      networkCheckTimeout: 1000000,
      confirmations: 3,
      timeoutBlocks: 50000,
      websocket: true,
      skipDryRun: true
    },
    bsc_testnet: {
      provider: () => new HDWalletProvider(
          {
            privateKeys: [PRIVATE_KEY],
            providerOrUrl: `wss://speedy-nodes-nyc.moralis.io/${process.env.MORALIS}/bsc/testnet/ws`,
            addressIndex: 0
          }),
      network_id: 97,
      networkCheckTimeout: 1000000,
      confirmations: 3,
      timeoutBlocks: 50000,
      websocket: true,
      skipDryRun: true
    },
    bsc: {
      provider: () => new HDWalletProvider(
          {
            privateKeys: [PRIVATE_KEY],
            providerOrUrl: `wss://speedy-nodes-nyc.moralis.io/${process.env.MORALIS}/bsc/mainnet/ws`,
            addressIndex: 0
          }),
      network_id: 56,
      networkCheckTimeout: 1000000,
      confirmations: 3,
      timeoutBlocks: 50000,
      websocket: true,
      skipDryRun: true
    },
    one_testnet: {
      provider: () => new HDWalletProvider(
          {
            privateKeys: [PRIVATE_KEY],
            providerOrUrl: `https://api.s0.b.hmny.io`,
            addressIndex: 0
          }),
      network_id: 1666700000,
      networkCheckTimeout: 1000000,
      confirmations: 3,
      timeoutBlocks: 50000,
      websocket: true,
      skipDryRun: true
    },
    one_mainnet: {
      provider: () => new HDWalletProvider(
          {
            privateKeys: [PRIVATE_KEY],
            providerOrUrl: `https://rpc.hermesdefi.io/`,
            addressIndex: 0
          }),
      network_id: 1666600000,
      networkCheckTimeout: 1000000,
      confirmations: 3,
      timeoutBlocks: 50000,
      websocket: true,
      skipDryRun: true
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.7.5",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    snowtrace: process.env.SNOWTRACE_API_KEY,
    bscscan: process.env.BSCSCAN_API_KEY
  },
    mocha: {
        enableTimeouts: false,
        before_timeout: 120000
    }

};
