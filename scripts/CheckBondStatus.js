const _treasure = artifacts.require("TimeTreasury");
const _bond = artifacts.require("TimeBondDepository");
const _dai = artifacts.require("DAI");
const _ohm = artifacts.require("ERC20Token");

module.exports = async function (callback) {
    try {
        const dev = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
        const treasure = await _treasure.deployed();
        const bond = await _bond.deployed();
        const dai = await _dai.deployed();
        const ohm = await _ohm.deployed();
        const ohmBalanceOfDev = await ohm.balanceOf(dev);
        console.log('ohmBalanceOfDev', ohmBalanceOfDev.toString()/1e9)
        /* await ohm.setVault(dev);
        await ohm.mint(dev, "10000000000");
        await ohm.setVault(treasure.address); */

        let isReserveDepositor = (await treasure.isReserveDepositor(bond.address));
        let isLiquidityDepositor = (await treasure.isLiquidityDepositor(bond.address));
        console.log('BEFORE: isReserveDepositor', isReserveDepositor);
        console.log('BEFORE: isLiquidityDepositor', isLiquidityDepositor);

        let terms = (await bond.terms());
        console.log("-controlVariable", terms.controlVariable.toString());
        console.log("-vestingTerm", terms.vestingTerm.toString());
        console.log("-minimumPrice", terms.minimumPrice.toString());
        console.log("-bondPrice", (await bond.bondPrice()).toString() );
        console.log("-maxPayout", terms.maxPayout.toString());
        console.log("-fee", terms.fee.toString());
        console.log("-maxDebt", terms.maxDebt.toString()/1e18);
        console.log("-bondPriceInUSD", (await bond.bondPriceInUSD()).toString()/1e18 );
        console.log("-debtRatio", (await bond.debtRatio()).toString() );
        console.log("-standardizedDebtRatio", (await bond.standardizedDebtRatio()).toString() );
        console.log("-currentDebt", (await bond.currentDebt()).toString() );
        console.log("-debtDecay", (await bond.debtDecay()).toString() );
        console.log("-percentVestedFor", (await bond.percentVestedFor(dev)).toString() );
        console.log("-pendingPayoutFor", (await bond.pendingPayoutFor(dev)).toString() );

        const allowance = await dai.allowance(dev, bond.address);
        if (allowance == 0) {
            console.log('allowance', allowance.toString());
            await dai.approve(bond.address, "999999999999999999999999999999999");
        }

        const mint = await dai.balanceOf(dev);
        console.log('DAI balanceOf', mint.toString()/1e18);
        const ohmBalance = await ohm.balanceOf(dev);
        // ohm.burn(ohmBalance);
        // ohm.burn(ohmBalance);
        console.log('OHM balanceOf', ohmBalance.toString()/1e9);

        // const price = (await bond.bondPrice()).toString();
        // const amount = "1000000000000000000";
        // await bond.deposit(amount, price, dev);
        const bondInfo = await bond.bondInfo(dev);
        console.log("bondInfo.payout", bondInfo.payout.toString());
        console.log("bondInfo.vesting", bondInfo.vesting.toString());
        console.log("bondInfo.pricePaid", bondInfo.pricePaid.toString());
        console.log("bondInfo.lastTime", bondInfo.lastTime.toString());

    } catch (e) {
        console.log(e.toString());
    }
    process.exit(0);
};
