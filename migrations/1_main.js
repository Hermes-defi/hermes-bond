require('dotenv').config();
// truffle migrate --f 1 --to 1 --network avax
// truffle run verify ERC20Token MEMOries TimeStaking --network avax
const _ERC20Token = artifacts.require("ERC20Token");
const _MEMOries = artifacts.require("MEMOries");
const _wMEMO = artifacts.require("wMEMO");
const _TimeStaking = artifacts.require("TimeStaking");
const _MIM = artifacts.require("DAI");

const chalk = require('chalk');
const yellow = function() { console.log(chalk.yellowBright(...arguments)) }
const magenta = function() { console.log(chalk.magenta(...arguments)) }
const cyan = function() { console.log(chalk.cyan(...arguments)) }
const red = function() { console.log(chalk.red(...arguments)) }
const blue = function() { console.log(chalk.blue(...arguments)) }
const green = function() { console.log(chalk.green(...arguments)) }


module.exports = async function (deployer, network, accounts) {

  green('main account: '+accounts);

  const epochLength = process.env.DEPLOY_EPOCH;
  const firstEpochNumber = process.env.DEPLOY_FIRST_EPOCH_FIRST;
  const firstEpochBlock = process.env.DEPLOY_FIRST_EPOCH_BLOCK;

  green('MIM:  start');
  let MIM_Contract;
  let MIM = process.env.BOND; // movr
  if (network == 'dev' || network.indexOf('test') != -1) {
    await deployer.deploy(_MIM, '1337');
    MIM_Contract = await _MIM.deployed();
    MIM = MIM_Contract.address;
    const CEM = web3.utils.toWei('100');
    await MIM_Contract.mint(accounts[0], CEM);
  } else if (network == 'ftm') {
    MIM = '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e'; // ftm
    MIM_Contract = await _MIM.at(MIM);
  } else {
    MIM_Contract = await _MIM.at(MIM);
  }
  yellow('MIM:  end');

  green('ERC20Token: start');
  let ERC20Token;
  if( ! process.env.DEPLOY_USE_TOKEN || network == 'dev' || network.indexOf('test') != -1 ){
    await deployer.deploy(_ERC20Token);
    ERC20Token = await _ERC20Token.deployed();

    100000000000000

  }else{
    ERC20Token = await _ERC20Token.at(process.env.DEPLOY_USE_TOKEN);
  }
  yellow('ERC20Token: end');

  green('MEMOries: start');
  await deployer.deploy(_MEMOries);
  const MEMOries = await _MEMOries.deployed();
  yellow('MEMOries: end');

  green('wMEMO: start');
  await deployer.deploy(_wMEMO, MEMOries.address);
  const wMEMO = await _wMEMO.deployed();
  yellow('wMEMO: end');

  green('TimeStaking: start');
  await deployer.deploy(_TimeStaking,
    ERC20Token.address,
    MEMOries.address,
    epochLength,
    firstEpochNumber,
    firstEpochBlock);
  const TimeStaking = await _TimeStaking.deployed();
  yellow('TimeStaking: end');

  magenta("CONTRACTS")
  green("- MIM: " + MIM);
  green("- ERC20Token: " + ERC20Token.address);
  green("- MEMOries: " + MEMOries.address);
  green("- wMEMO: " + wMEMO.address);
  green("- TimeStaking: " + TimeStaking.address);

};

