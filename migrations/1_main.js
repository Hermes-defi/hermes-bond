require('dotenv').config();
// truffle migrate --f 1 --to 1 --network one_testnet
// truffle migrate --f 1 --to 1 --network one_mainnet
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
    const dev = accounts[0];
    green('main account: ' + dev);

    green('DAI:  start');
    let DAI_Contract;
    let DAI = process.env.DAI; // movr
    if (network == 'dev' || network.indexOf('test') != -1) {
        await deployer.deploy(_DAI, '1');
        DAI_Contract = await _DAI.deployed();
        DAI = DAI_Contract.address;
        yellow('mint 100k to dev');
        const CEM = web3.utils.toWei('100200');
        await DAI_Contract.mint(dev, CEM);
    } else if (network == 'ftm') {
        DAI = '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e'; // ftm
        DAI_Contract = await _DAI.at(DAI);
    } else {
        DAI_Contract = await _DAI.at(DAI);
    }
    yellow('DAI:  end');

    green('ERC20Token: start');
    let ERC20Token;
    if (!process.env.TOKEN || network == 'dev' || network.indexOf('test') != -1) {
        await deployer.deploy(_ERC20Token);
        ERC20Token = await _ERC20Token.deployed();
    } else {
        ERC20Token = await _ERC20Token.at(process.env.TOKEN);
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
    const treasure = await _HermesTreasury.deployed();
    yellow('HermesTreasury: end');

    // what's the asset to be added as bond? like mim, dai etc?
    const PRINCIPAL = DAI;

    const vestingTerm = '216000'; // 2.5h
    const minimumPrice = '2500';
    const maxPayout = '1000'; // 0.25%
    const controlVariable = '50',
        fee = '10000',
        maxDebt = '1000000000000000', initialDebt = '0';

    green('HermesBondDepository:  start');
    const ZERO = '0x0000000000000000000000000000000000000000';
    await deployer.deploy(_HermesBondDepository,
        ERC20Token.address, PRINCIPAL, treasure.address, treasure.address, ZERO);
    const bond = await _HermesBondDepository.deployed();
    yellow('HermesBondDepository: end');


    green('initializeBondTerms');
    await bond.initializeBondTerms(
        controlVariable,
        minimumPrice,
        maxPayout,
        fee,
        maxDebt,
        vestingTerm);

    green('toggle 0 dev');
    await treasure.queue('0', dev);
    await treasure.toggle('0', dev, ZERO);

    green('toggle 4 dev');
    await treasure.queue('4', dev);
    await treasure.toggle('4', dev, ZERO);

    green('toggle 0 bond');
    await treasure.queue('0', bond.address);
    await treasure.toggle('0', bond.address, ZERO);

    green('allow treasure to mint');
    await ERC20Token.setVault(treasure.address, true);

};

