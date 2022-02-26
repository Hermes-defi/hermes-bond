const _treasure = artifacts.require("TimeTreasury");
const _dai = artifacts.require("DAI");
const _ohm = artifacts.require("ERC20Token");
const dev = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

module.exports = async function (deployer, network, accounts) {
    const treasure = await _treasure.deployed();
    const ohm = await _ohm.deployed();
    const dai = await _dai.deployed();
    try {
        const amount = '100000000000000000000000'; // 10k
        // await ohm.burn('100000000000000');
        await dai.mint(dev, amount);
        await dai.approve(treasure.address, '0');
        await dai.approve(treasure.address, amount);
        const isReserveToken = await treasure.isReserveToken(dai.address);
        const isReserveDepositor = await treasure.isReserveDepositor(dev);
        console.log('isReserveToken', isReserveToken);
        console.log('isReserveDepositor', isReserveDepositor);
        if( isReserveToken && isReserveDepositor ){

            const ohmBalanceOfDev1 = await ohm.balanceOf(dev);
            const daiBalanceOfDev1 = await dai.balanceOf(treasure.address);
            await treasure.deposit(amount, dai.address, '0');
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
