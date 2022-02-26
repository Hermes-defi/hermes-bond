require('dotenv').config();
// truffle migrate --f 6 --to 6 --network avax
const _ERC20Token = artifacts.require("ERC20Token");
const _MEMOries = artifacts.require("MEMOries");
const _TimeStaking = artifacts.require("TimeStaking");
const _StakingHelper = artifacts.require("StakingHelper");
const _TimeTreasury = artifacts.require("TimeTreasury");
const _MIM = artifacts.require("DAI");
const _StakingWarmup = artifacts.require("StakingWarmup");
const _TimeBondingCalculator = artifacts.require("TimeBondingCalculator");
const _TimeBondDepository = artifacts.require("TimeBondDepository");
const _Distributor = artifacts.require("Distributor");


const chalk = require('chalk');
let _yellowBright = chalk.yellowBright;
let _magenta = chalk.magenta;
let _cyan = chalk.cyan;
let _yellow = chalk.yellow;
let _red = chalk.red;
let _blue = chalk.blue;
let _green = chalk.green;

function yellow() {
  console.log(_yellow(...arguments));
}

function red() {
  console.log(_red(...arguments));
}

function green() {
  console.log(_green(...arguments));
}

function blue() {
  console.log(_blue(...arguments));
}

function cyan() {
  console.log(_cyan(...arguments));
}

function magenta() {
  console.log(_magenta(...arguments));
}


module.exports = async function (deployer, network, accounts) {

  green('main account: '+accounts);

  const ZERO = '0x0000000000000000000000000000000000000000';

  green('MIM: start');
  let MIM_Contract;
  let MIM = process.env.BOND; // movr
  if (network == 'dev' || network.indexOf('test') != -1) {
    MIM_Contract = await _MIM.deployed();
    MIM = MIM_Contract.address;
  } else if (network == 'ftm') {
    MIM = '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e'; // ftm
  }
  let ERC20Token;
  if( ! process.env.DEPLOY_USE_TOKEN || network == 'dev' || network.indexOf('test') != -1 ){
    ERC20Token = await _ERC20Token.deployed();
  }else{
    ERC20Token = await _ERC20Token.at(process.env.DEPLOY_USE_TOKEN);
  }
  const MEMOries = await _MEMOries.deployed();
  const TimeStaking = await _TimeStaking.deployed();
  const StakingHelper = await _StakingHelper.deployed();
  const TimeTreasury = await _TimeTreasury.deployed();
  const StakingWarmup = await _StakingWarmup.deployed();

  const TimeBondingCalculator = await _TimeBondingCalculator.deployed();
  const Distributor = await _Distributor.deployed();

  const TimeBondDepository = await _TimeBondDepository.deployed();

  green('allow eth bond to mint (mintRewards)');
  // await TimeTreasury.queue('8', EthBondDepository.address)
  // await TimeTreasury.toggle('8', EthBondDepository.address, ZERO)
  // await TimeTreasury.queue('4', EthBondDepository.address)
  // await TimeTreasury.toggle('4', EthBondDepository.address, ZERO)

  green('TimeTreasury Distributor');
  await Distributor.addRecipient(TimeStaking.address, '5000')
  await TimeTreasury.queue('8', Distributor.address)
  await TimeTreasury.toggle('8', Distributor.address, ZERO)


  green('TimeTreasury sOHM');
  await TimeTreasury.queue('9', MEMOries.address)
  await TimeTreasury.toggle('9', MEMOries.address, ZERO)

  magenta("CONTRACTS")
  green("- MIM: " + MIM);
  green("- ERC20Token: " + ERC20Token.address);
  green("- MEMOries: " + MEMOries.address);
  green("- TimeStaking: " + TimeStaking.address);
  green("- StakingHelper: " + StakingHelper.address);
  green("- TimeTreasury: " + TimeTreasury.address);
  green("- StakingWarmup: " + StakingWarmup.address);
  green("- TimeTreasury: " + TimeTreasury.address);
  green("- TimeBondingCalculator: " + TimeBondingCalculator.address);
  green("- Distributor: " + Distributor.address);
  green("- TimeBondDepository: " + TimeBondDepository.address);

};

