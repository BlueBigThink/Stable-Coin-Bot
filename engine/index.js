const { 
    getPriceETH, 
    getTargetPrice, 
    getPairAddr,
    getDecimals,
    getBalanceOfPool
} = require('../api/index.js');

const { setDecimals, addDecimals } = require('../utils/utils');

async function test() {
    const priceETH = await getPriceETH();
    console.log({ETH_PRICE : priceETH});
    const targetPrice = await getTargetPrice();
    console.log({Price : targetPrice.result});
    const poolAddr = await getPairAddr(ETH_ADDR, USDT_ADDR);
    console.log(poolAddr);
    const balance = await getBalanceOfPool(ETH_ADDR, USDT_ADDR);
    let balETH = balance[ETH_ADDR];
    let balUSDT = balance[USDT_ADDR];
    const decETH = await getDecimals(ETH_ADDR);
    const decUSDT = await getDecimals(USDT_ADDR);
    balETH = addDecimals(balETH, decETH);
    balUSDT = addDecimals(balUSDT, decUSDT);
    console.log({ETH : balETH, USDT : balUSDT});
}

module.exports = {
    test
}