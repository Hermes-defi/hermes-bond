const _treasure = artifacts.require("HermesTreasury");
const _dai = artifacts.require("DAI");
const _ohm = artifacts.require("ERC20Token");
const dev = "0x78B3Ec25D285F7a9EcA8Da8eb6b20Be4d5D70E84";
// truffle exec scripts\depositToTreasure.js --network bsc_testnet
module.exports = async function (deployer, network, accounts) {
    const treasure = await _treasure.deployed();
    const ohm = await _ohm.deployed();
    const dai = await _dai.deployed();
    /*
    try {
        const amount = '100000000000000000000000'; // 10k
        // await ohm.burn('100000000000000');
        console.log('mint '+amount+' to '+dev)
        await dai.mint(dev, amount);
        console.log('approve')
        await dai.approve(treasure.address, '0');
        await dai.approve(treasure.address, amount);
        const isReserveToken = await treasure.isReserveToken(dai.address);
        const isReserveDepositor = await treasure.isReserveDepositor(dev);
        console.log('isReserveToken', isReserveToken);
        console.log('isReserveDepositor', isReserveDepositor);
        if( isReserveToken && isReserveDepositor ){

            const ohmBalanceOfDev1 = await ohm.balanceOf(dev);
            const daiBalanceOfDev1 = await dai.balanceOf(treasure.address);
            const tx = await treasure.deposit(amount, dai.address, '0');
            console.log(tx);
            const ohmBalanceOfDev2 = await ohm.balanceOf(dev);
            const daiBalanceOfDev2 = await dai.balanceOf(treasure.address);
            const totalReserves = await treasure.totalReserves();
            console.log('totalReserves', totalReserves.toString()/1e9);
            console.log('ohmBalanceOfDev before', ohmBalanceOfDev1.toString()/1e9);
            console.log('ohmBalanceOfDev after', ohmBalanceOfDev2.toString()/1e9);
            console.log('daiBalanceOfTreasure before', daiBalanceOfDev1.toString()/1e18);
            console.log('daiBalanceOfTreasure after', daiBalanceOfDev2.toString()/1e18);
        }else{
            console.log('err in permission');
        }
    }catch(e){
        console.log(e.toString());
    }
*/
    const totalReserves = (await treasure.totalReserves()).toString();
    const totalSupply = (await ohm.totalSupply()).toString();
    const excess = totalReserves - totalSupply;
    // const excessReserves = await treasure.excessReserves();
    console.log('totalReserves', totalReserves );
    console.log('totalSupply  ', totalSupply );
    console.log('excess  ', excess );
    if( excess <= 0 ){
        console.log('ERROR RESERVE < SUPPLY');
    }

    process.exit(0);
};
