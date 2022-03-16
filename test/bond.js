const web3 = require('web3');
const {accounts, contract} = require('@openzeppelin/test-environment');
const {BN, expectRevert, time, expectEvent, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');

const chalk = require('chalk');

function toWei(v){
  return web3.utils.toWei(v);
}
function fromWei(v){
  return web3.utils.fromWei(v);
}
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
let dev, user;

const DAI =  contract.fromArtifact("DAI");
const ERC20Token =  contract.fromArtifact("ERC20Token");
const HermesTreasury =  contract.fromArtifact("HermesTreasury");
const HermesBondDepository =  contract.fromArtifact("HermesBondDepository");
const ZERO = '0x0000000000000000000000000000000000000000';

let dai, token, treasure, bond;
describe("Main", function () {
  beforeEach(async function () {
    this.timeout(140000);
    dev = accounts[0];
    user = accounts[1];

  });
  describe('HermesBondDepository', function () {
    it('deposit & claim', async function () {
      this.timeout(140000);
      dai = await DAI.new("1", {from: dev});
      await dai.mint(dev, toWei('100100'));
      await dai.mint(user, toWei('200'));

      token = await ERC20Token.new({from: dev});

      const blocksNeededForQueue = 0; // timelock
      const hourlyLimitAmounts = '1000000000000000000000000000';
      treasure = await HermesTreasury.new(
          token.address,
          dai.address,
          blocksNeededForQueue,
          hourlyLimitAmounts, {from: dev});

      await treasure.queue('0', dev, {from: dev});
      await treasure.toggle('0', dev, ZERO, {from: dev});

      await treasure.queue('4', dev, {from: dev});
      await treasure.toggle('4', dev, ZERO, {from: dev});

      bond = await HermesBondDepository.new(
          token.address,
          dai.address,
          treasure.address,
          treasure.address, ZERO, {from: dev});

      await treasure.queue('0', bond.address, {from: dev});
      await treasure.toggle('0', bond.address, ZERO, {from: dev});

      await token.setVault(treasure.address, true, {from: dev});

      const vestingTerm = '216000'; // 2.5h
      const minimumPrice = '2500';
      const maxPayout = '1000'; // 0.25%
      const controlVariable = '40',
          fee = '10000',
          maxDebt = '1000000000000000', initialDebt = '0';

      await bond.initializeBondTerms(
          controlVariable,
          minimumPrice,
          maxPayout,
          fee,
          maxDebt,
          vestingTerm, {from: dev});


      const depoistReserve = toWei('100000');
      const depoistBond = toWei('100');

      const isReserveToken = await treasure.isReserveToken(dai.address);
      console.log('isReserveToken', isReserveToken)
      const isReserveDepositor = await treasure.isReserveDepositor(dev);
      console.log('isReserveDepositor', isReserveDepositor)

      await dai.approve(treasure.address, depoistReserve, {from: dev});
      await treasure.deposit(depoistReserve, dai.address, '0', {from: dev});

      await dai.approve(bond.address, depoistBond, {from: dev});
      await bond.deposit(depoistBond, minimumPrice, dev, {from: dev});

    })
  });
});
