const {
    getPriceETH,
    getDecimals,
    getPriceByETH,
    getTargetPrice,
    buyToken,
    sellToken
} = require('./tokenPrice');
const {
    getPairAddr,
    getBalanceOfPool
} = require('./getBalanceOfPool');
module.exports = {
    getPriceETH,
    getDecimals,
    getPriceByETH,
    getTargetPrice,
    buyToken,
    sellToken,

    getPairAddr,
    getBalanceOfPool
}
