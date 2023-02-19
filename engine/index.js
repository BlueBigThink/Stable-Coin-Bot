require('dotenv-safe').config();
const DIFF = process.env.DIFF;

const { 
    getPriceETH, 
    getPriceByETH,
    getTargetPrice, 
    getPairAddr,
    getDecimals,
    getBalanceOfPool,
    buyToken,
    sellToken,
    getAmountsOut,
    getAmountsIn,
    balanceOfEth,
    balanceOfToken,
    isAmountEth,
    isAmountToken,

} = require('../api/index.js');

const { rmDecimals, addDecimals } = require('../utils/utils');

async function test() {
    // console.log(await getPairAddr(ETH_ADDR, TOKEN_ADDR));
    // console.log(await getPairAddr(ETH_ADDR, USDT_ADDR));
    // console.log(await balanceOfToken(TOKEN_ADDR, PUBLIC_KEY));
    // console.log(await balanceOfEth(PUBLIC_KEY));
    // console.log(await isAmountToken(TOKEN_ADDR, PUBLIC_KEY, 296764));
    // console.log(await isAmountEth(PUBLIC_KEY, 2));
    // console.log(await getDecimals(TOKEN_ADDR));
    // console.log(await getPriceETH());
    // console.log("getBalanceOfPool", await getBalanceOfPool(ETH_ADDR, TOKEN_ADDR));
    // console.log("getAmountsOut", await getAmountsOut(0.1, ETH_ADDR, TOKEN_ADDR));
    // console.log("getAmountsIn", await getAmountsIn(0.1, ETH_ADDR, TOKEN_ADDR));

    // buyToken(0.05);
    sellToken(0.1);
}

async function startBot() {
    bot();
}

async function bot() {
    const status = await calcCoinMarkCap();
    console.log(status);
    const diffPrice = status.TAR_PRICE - status.CUR_PRICE;
    if(Math.abs(diffPrice) >= DIFF){
        const amounETH = Math.abs(diffPrice) * status.BALANCE / status.ETH_PRICE;
        if(diffPrice > 0) {
            console.log("Price down");
            //Buy token by ETH
            buyToken(amounETH);
        } else {
            console.log("Price up");
            //Sell token by ETH
            sellToken(amounETH);
        }
    }
    setTimeout(bot, 5000);
}

async function calcCoinMarkCap() {
    const priceETH = await getPriceETH();
    const targetPrice = await getTargetPrice();
    // const poolAddr = await getPairAddr(ETH_ADDR, USDT_ADDR);
    const TokenAddr = USDT_ADDR;
    let curPrice = await getPriceByETH(1, TokenAddr);
    curPrice *= priceETH;
    const balance = await getBalanceOfPool(ETH_ADDR, TokenAddr);
    let balToken = balance[TokenAddr];
    const decToken = await getDecimals(TokenAddr);
    balToken = addDecimals(balToken, decToken);
    return {
        ETH_PRICE   :   priceETH,
        TAR_PRICE   :   targetPrice.result,
        CUR_PRICE   :   curPrice,
        BALANCE     :   balToken,
    }
}

module.exports = {
    test,
    startBot
}