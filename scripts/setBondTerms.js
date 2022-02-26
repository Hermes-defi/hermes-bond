const CONTRACT = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82';
const _OlympusBondDepository = artifacts.require("TimeBondDepository");
let bond;
module.exports = async function (deployer, network, accounts) {
  bond = await _OlympusBondDepository.deployed();
  // bond = await _OlympusBondDepository.at(CONTRACT);
  await dumpInfo('BEFORE');
  await bond.setBondTerms ( 0, 129601 ); // VESTING
  await bond.setBondTerms ( 1, 10 ); // PAYOUT
  await bond.setBondTerms ( 2, 0 ); // FEE
  await bond.setBondTerms ( 4, 1000 ); // MINPRICE
  await dumpInfo('AFTER');
  process.exit(0);
};
async function dumpInfo(title){
  let r = await bond.terms();
  const vestingTerm = r.vestingTerm.toString();
  const maxPayout = r.maxPayout.toString();
  console.log(title,' vestingTerm=('+vestingTerm+')' )
  console.log(title,' maxPayout='+maxPayout/1000+'% ('+maxPayout+')' )
}

