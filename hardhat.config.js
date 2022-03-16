require("@nomiclabs/hardhat-waffle");
require('dotenv').config({ path: '.env' });

module.exports = {
  solidity: "0.7.5",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    localhost: {
      url: 'http://localhost:8545',
    },
    one: {
      url: 'https://rpc.hermesdefi.io',
      accounts: [`${process.env.PRIVATE_KEY}`]
    },
  },
};
