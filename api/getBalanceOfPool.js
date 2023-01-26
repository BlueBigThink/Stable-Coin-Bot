const fs = require('fs')
const Web3 = require('web3');

const web3 = new Web3(RPC_URL);
const { setDecimals, addDecimals } = require('../utils/utils');
let uniswapFactABI = JSON.parse(fs.readFileSync('abi/uniswapV2Fact.json','utf-8'));
let uniswapPairABI = JSON.parse(fs.readFileSync('abi/uniswapV2Pair.json','utf-8'));

async function getPairAddr(token0, token1) {
    let factory = await new web3.eth.Contract( uniswapFactABI, UNISWAP_FACT );
    return await factory.methods.getPair(token0, token1).call();
}

async function getBalanceOfPool(token0, token1) {
    const poolAddr = await getPairAddr(token0, token1);
    let pair = await new web3.eth.Contract( uniswapPairABI, poolAddr );
    const tokenA = await pair.methods.token0().call();
    const tokenB = await pair.methods.token1().call();
    const reserves = await pair.methods.getReserves().call();
    // console.log(reserves[0], reserves[1]);
    return { [tokenA] : reserves['0'], [tokenB] : reserves['1'] }
}

module.exports = {
    getPairAddr,
    getBalanceOfPool
}
