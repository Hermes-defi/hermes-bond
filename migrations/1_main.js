require('dotenv').config();
// truffle migrate --f 1 --to 1
// truffle run verify ERC20Token MEMOries TimeStaking --network avax
const _ERC20Token = artifacts.require("ERC20Token");
const _DAI = artifacts.require("DAI");
const _HermesTreasury = artifacts.require("HermesTreasury");
const _HermesBondDepository = artifacts.require("HermesBondDepository");

const chalk = require('chalk');
const yellow = function () {
    console.log(chalk.yellowBright(...arguments))
}
const magenta = function () {
    console.log(chalk.magenta(...arguments))
}
const cyan = function () {
    console.log(chalk.cyan(...arguments))
}
const red = function () {
    console.log(chalk.red(...arguments))
}
const blue = function () {
    console.log(chalk.blue(...arguments))
}
const green = function () {
    console.log(chalk.green(...arguments))
}


module.exports = async function (deployer, network, accounts) {

    green('main account: ' + accounts);

    green('DAI:  start');
    let DAI_Contract;
    let DAI = process.env.BOND; // movr
    if (network == 'dev' || network.indexOf('test') != -1) {
        await deployer.deploy(_DAI, '1');
        DAI_Contract = await _DAI.deployed();
        DAI = DAI_Contract.address;
        const CEM = web3.utils.toWei('100');
        await DAI_Contract.mint(accounts[0], CEM);
    } else if (network == 'ftm') {
        DAI = '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e'; // ftm
        DAI_Contract = await _DAI.at(DAI);
    } else {
        DAI_Contract = await _DAI.at(DAI);
    }
    yellow('DAI:  end');

    green('ERC20Token: start');
    let ERC20Token;
    if (!process.env.DEPLOY_USE_TOKEN || network == 'dev' || network.indexOf('test') != -1) {
        await deployer.deploy(_ERC20Token);
        ERC20Token = await _ERC20Token.deployed();
    } else {
        ERC20Token = await _ERC20Token.at(process.env.DEPLOY_USE_TOKEN);
    }
    yellow('ERC20Token: end');

    green('HermesTreasury: start');
    const blocksNeededForQueue = 0; // timelock
    const hourlyLimitAmounts = '1000000000000000000000000000';
    await deployer.deploy(_HermesTreasury,
        ERC20Token.address,
        DAI,
        blocksNeededForQueue,
        hourlyLimitAmounts);
    const HermesTreasury = await _HermesTreasury.deployed();
    yellow('HermesTreasury: end');

    // what's the asset to be added as bond? like mim, dai etc?
    const PRINCIPAL = DAI;

    const vestingTerm = '216000'; // 2.5h
    const minimumPrice = '2500';
    const maxPayout = '2500'; // 0.25%
    const controlVariable = '5',
        fee = '10000',
        maxDebt = '1000000000000000', initialDebt = '0';

    green('HermesBondDepository:  start');
    const ZERO = '0x0000000000000000000000000000000000000000';
    await deployer.deploy(_HermesBondDepository,
        ERC20Token.address, PRINCIPAL, HermesTreasury.address, HermesTreasury.address, ZERO);
    const bond = await _HermesBondDepository.deployed();
    yellow('HermesBondDepository: end');

};

