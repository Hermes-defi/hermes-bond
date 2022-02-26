const dev = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const CONTRACT = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82';
const _OlympusBondDepository = artifacts.require("TimeBondDepository");
const _ohm = artifacts.require("ERC20Token");
const _dai = artifacts.require("DAI");
const _treasure = artifacts.require("TimeTreasury");
module.exports = async function (deployer, network, accounts) {
    const bond = await _OlympusBondDepository.deployed();
    const ohm = await _ohm.deployed();
    const treasure = await _treasure.deployed();
    const amount = '10000000000000000000';
    const dai = await _dai.deployed();

    const valueOf = (await treasure.value_of(dai.address, amount));
    const terms = (await bond.terms());
    const fee = terms.fee.toString()/10000;
    const payout = (await bond.payoutFor(valueOf.toString()));
    const profit = (valueOf - payout) - fee

    console.log('valueOf', valueOf.toString()/1e9);
    console.log('payout', payout.toString()/1e9);
    console.log('fee', fee);
    console.log('profit', profit/1e9);

    try {
        await dai.mint(dev, amount);
        await dai.approve(bond.address, '0');
        await dai.approve(bond.address, amount);
        await bond.deposit(amount, '10050', dev);
    } catch (e) {
        console.log(e.toString());
        // console.log(e.data.txHash);
    }
    process.exit(0);
};
