const dev = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const _ohm = artifacts.require("ERC20Token");
const _treasure = artifacts.require("TimeTreasury");
const _StakingHelper = artifacts.require("StakingHelper");
module.exports = async function (deployer, network, accounts) {
    const stake = await _StakingHelper.deployed();
    const ohm = await _ohm.deployed();
    const treasure = await _treasure.deployed();

    const totalReserves = (await treasure.totalReserves()).toString();
    const totalSupply = (await ohm.totalSupply()).toString();
    const excess = totalReserves - totalSupply;

    console.log('totalReserves', totalReserves );
    console.log('totalSupply  ', totalSupply );
    console.log('excess  ', excess );
    if( excess <= 0 ){
        console.log('ERROR RESERVE < SUPPLY');
        process.exit(0);
    }

    const excessReserves = await treasure.excessReserves();
    console.log('excessReserves', excessReserves.toString() );

    const amount = '1000000000';
    await ohm.approve(stake.address, '0');
    await ohm.approve(stake.address, amount);
    try {
        await stake.stake(amount, dev);
    } catch (e) {
        console.log(e.toString());
        console.log("tenderly export "+e.data.txHash);
    }
    process.exit(0);
};
