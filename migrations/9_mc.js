const MasterChef = artifacts.require("MasterChef");
// truffle migrate --f 9 --to 9 --network ftm_testnet
module.exports = async function  (deployer, network, accounts) {
  const token = '0x5d600AB61b6F99c2c01A4277246E7dCE2390A1f2';
  const tokenPerBlock = '10000000000000000';
  const startBlock = '1';
  await deployer.deploy(MasterChef, token, tokenPerBlock, startBlock);
};
