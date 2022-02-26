// what's the asset to be added as bond? like mim, dai etc?
const PRINCIPAL = '0x130966628846bfd36ff31a822705796e8cb8c18d';

// vesting terms are in blocks (2 seconds each)
const vestingTerm = '216000'; // 2.5h

// the bond price, ie: 2500 is $25.00
const minimumPrice = '2500';

// the % to be paid in bods in 4 decimals, 2500 is 0.25%
const maxPayout = '2500'; // 0.25%







// to add new bond:
// truffle migrate --f 8 --to 8 --network avax

// few seconds later, execute this command to verify contract:
// truffle run verify TimeBondDepository --network avax
















const
  controlVariable = '5',
  fee = '10000',
  maxDebt = '1000000000000000', initialDebt = '0';

const _ERC20Token = artifacts.require("ERC20Token");
const _StakingHelper = artifacts.require("StakingHelper");
const _TimeTreasury = artifacts.require("TimeTreasury");
const _TimeTreasury = artifacts.require("TimeTreasury");
const _TimeBondDepository = artifacts.require("TimeBondDepository");
const _RedeemHelper = artifacts.require("RedeemHelper");

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


  green('PRINCIPAL: ' + PRINCIPAL);
  const ZERO = '0x0000000000000000000000000000000000000000';
  let ERC20Token;
  if (!process.env.DEPLOY_USE_TOKEN) {
    ERC20Token = await _ERC20Token.deployed();
  } else {
    ERC20Token = await _ERC20Token.at(process.env.DEPLOY_USE_TOKEN);
  }
  const StakingHelper = await _StakingHelper.deployed();
  const TimeTreasury = await _TimeTreasury.deployed();

  yellow('create bond contract...');
  await deployer.deploy(_TimeBondDepository, ERC20Token.address, PRINCIPAL, TimeTreasury.address, TimeTreasury.address, ZERO);
  const TimeBondDepository = await _TimeBondDepository.deployed();

  yellow('initializeBondTerms...');
  await TimeBondDepository.initializeBondTerms(controlVariable, vestingTerm, minimumPrice, maxPayout, fee, maxDebt, initialDebt);
  yellow('setStaking...');
  await TimeBondDepository.setStaking(StakingHelper.address, true);

  yellow('add bond contract to redeem helper...');
  const RedeemHelper = await _RedeemHelper.deployed();
  await RedeemHelper.addBondContract(TimeBondDepository.address);

  yellow('add liquidity token...');
  await TimeTreasury.queue('2', PRINCIPAL)
  await TimeTreasury.toggle('2', PRINCIPAL, ZERO)

  yellow('set treasure permissions...');
  await TimeTreasury.queue('0', TimeBondDepository.address)
  await TimeTreasury.toggle('0', TimeBondDepository.address, ZERO)
  await TimeTreasury.queue('4', TimeBondDepository.address)
  await TimeTreasury.toggle('4', TimeBondDepository.address, ZERO)

  yellow('done.');
};

