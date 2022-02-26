require('dotenv').config();
// truffle migrate --f 4 --to 4 --network avax
// truffle run verify TimeBondDepository --network avax
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
const _DAO = artifacts.require("DAO");

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

  green('MIM:  start');
  let MIM_Contract;
  let MIM = process.env.DEPLOY_BOND_PRINCIPAL; // movr
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

  await Distributor.distribute();

  const DAO = await _DAO.deployed();

  await deployer.deploy(_TimeBondDepository,
      ERC20Token.address,
      MIM,
      TimeTreasury.address,
      DAO.address,
      ZERO);

  const controlVariable = '40',
        vestingTerm = process.env.DEPLOY_BOND_VESTING_TERM,
        minimumPrice = process.env.DEPLOY_BOND_PRICE,
        maxPayout = process.env.DEPLOY_REWARD_PCT,
        fee = process.env.DEPLOY_BOND_FEE,
        maxDebt = process.env.DEPLOY_BOND_MAX_DEBIT;
  const TimeBondDepository = await _TimeBondDepository.deployed();
  await TimeBondDepository.initializeBondTerms(
      controlVariable,
      minimumPrice,
      maxPayout,
      fee,
      maxDebt,
      vestingTerm
  );
  await TimeBondDepository.setStaking(StakingHelper.address, true);

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

