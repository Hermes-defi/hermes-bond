const _wMEMO = artifacts.require("wMEMO");
const _MEMOries = artifacts.require("MEMOries");
const _ERC20Token = artifacts.require("ERC20Token");
const toEther = function(v){ return v.toString()>0 ? v.toString()/1e9 : 0 }
module.exports = async function (callback) {
    try {
        const dev = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
        const wmemo = await _wMEMO.deployed();
        const memories = await _MEMOries.deployed();
        const time = await _ERC20Token.deployed();
        const balanceOfDevOnWMEMO = await wmemo.balanceOf(dev);
        const balanceOfDevOnMemories = await memories.balanceOf(dev);
        const balanceOfDevOnTime = await time.balanceOf(dev);
        console.log('- wMEMO balanceOfDev', toEther(balanceOfDevOnWMEMO) )
        console.log('- MEMOries balanceOfDev', toEther(balanceOfDevOnMemories) )
        console.log('- TIME balanceOfDev', toEther(balanceOfDevOnTime) )
    } catch (e) {
        console.log(e.toString());
    }
    process.exit(0);
};
