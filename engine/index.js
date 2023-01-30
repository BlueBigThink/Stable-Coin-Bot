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
    sellToken
} = require('../api/index.js');

const { rmDecimals, addDecimals } = require('../utils/utils');

async function test() {
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