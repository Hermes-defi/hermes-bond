require('dotenv').config();
// truffle migrate --f 2 --to 2 --network avax
// truffle run verify StakingHelper TimeTreasury StakingWarmup --network avax
// if StakingWarmup fail to verify, do it manually
const _ERC20Token = artifacts.require("ERC20Token");
const _MEMOries = artifacts.require("MEMOries");
const _TimeStaking = artifacts.require("TimeStaking");
const _StakingHelper = artifacts.require("StakingHelper");
const _TimeTreasury = artifacts.require("TimeTreasury");
const _MIM = artifacts.require("DAI");
const _StakingWarmup = artifacts.require("StakingWarmup");

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

    green('main account: ' + accounts);

    green('MIM:  start');
    let MIM_Contract;
    let MIM = process.env.BOND; // movr
    if (network == 'dev' || network.indexOf('test') != -1) {
        MIM_Contract = await _MIM.deployed();
        MIM = MIM_Contract.address;
    } else if (network == 'ftm') {
        MIM = '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e'; // ftm
        MIM_Contract = await _MIM.at(MIM);
    } else {
        MIM_Contract = await _MIM.at(MIM);
    }
    let ERC20Token;
    if (!process.env.DEPLOY_USE_TOKEN || network == 'dev' || network.indexOf('test') != -1) {
        ERC20Token = await _ERC20Token.deployed();
    } else {
        ERC20Token = await _ERC20Token.at(process.env.DEPLOY_USE_TOKEN);
    }
    const MEMOries = await _MEMOries.deployed();
    const TimeStaking = await _TimeStaking.deployed();

    green('StakingHelper: start');
    await deployer.deploy(_StakingHelper,
        TimeStaking.address,
        ERC20Token.address);
    const StakingHelper = await _StakingHelper.deployed();
    yellow('StakingHelper: end');

    green('TimeTreasury: start');
    const blocksNeededForQueue = 0; // timelock
    const hourlyLimitAmounts = '1000000000000000000000000000';
    await deployer.deploy(_TimeTreasury,
        ERC20Token.address,
        MIM,
        blocksNeededForQueue,
        hourlyLimitAmounts);
    const TimeTreasury = await _TimeTreasury.deployed();
    yellow('TimeTreasury: end');

    green('StakingWarmup: start');
    await deployer.deploy(_StakingWarmup, TimeStaking.address, MEMOries.address);
    const StakingWarmup = await _StakingWarmup.deployed();
    yellow('StakingWarmup: end');

    magenta("CONTRACTS")
    green("- MIM: " + MIM);
    green("- ERC20Token: " + ERC20Token.address);
    green("- MEMOries: " + MEMOries.address);
    green("- TimeStaking: " + TimeStaking.address);
    green("- StakingHelper: " + StakingHelper.address);
    green("- TimeTreasury: " + TimeTreasury.address);
    green("- StakingWarmup: " + StakingWarmup.address);

};

