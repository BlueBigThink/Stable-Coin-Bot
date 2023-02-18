const fs = require('fs')
const Web3 = require('web3');

const web3 = new Web3(RPC_URL);
const { rmDecimals, addDecimals } = require('../utils/utils');
const { getDecimals } = require('./tokenPrice');

let uniswapABI = JSON.parse(fs.readFileSync('abi/uniswapV2.json','utf-8'));
let uniswapFactABI = JSON.parse(fs.readFileSync('abi/uniswapV2Fact.json','utf-8'));
let uniswapPairABI = JSON.parse(fs.readFileSync('abi/uniswapV2Pair.json','utf-8'));
let tokenAbi = JSON.parse(fs.readFileSync('abi/erc20.json','utf-8'));

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

async function balanceOfToken(tokenAddr, ownerAddr) {
    let tokenRouter = await new web3.eth.Contract( tokenAbi, tokenAddr );
    let balance = await tokenRouter.methods.balanceOf(ownerAddr).call();
    return balance;
}

async function balanceOfEth(ownerAddr){
    let balanceWei = await web3.eth.getBalance(ownerAddr); //Will give value in.
    let balanceEth = Web3.utils.fromWei(balanceWei, 'ether');
    return {
        wei : balanceWei,
        eth : balanceEth
    }
}

async function getAmountsOut(amountIn, addrIn, addrOut) {
    const outDecimal = await getDecimals(addrOut);
    const inDecimal = await getDecimals(addrIn);
    amountIn = rmDecimals(amountIn, inDecimal);
    // amountIn = web3.utils.toWei(amountIn.toString(), "ether");
    let amountOut;
    try {
        let router = await new web3.eth.Contract( uniswapABI, UNISWAP_ADDR );
        amountOut = await router.methods.getAmountsOut(amountIn, [addrIn, addrOut]).call();
        amountOut = addDecimals(amountOut[1], outDecimal);
    } catch (error) {
        console.log(error);
    }
    if(!amountOut) return 0;
    return amountOut;
}

async function getAmountsIn(amountOut, addrIn, addrOut) {
    const outDecimal = await getDecimals(addrOut);
    const inDecimal = await getDecimals(addrIn);
    amountOut = rmDecimals(amountOut, outDecimal);
    let amountIn;
    try {
        let router = await new web3.eth.Contract( uniswapABI, UNISWAP_ADDR );
        amountIn = await router.methods.getAmountsIn(amountOut, [addrOut, addrIn]).call();
        amountIn = addDecimals(amountIn[0], inDecimal);
    } catch (error) {}
    
    if(!amountIn) return 0;
    return amountIn;
}

module.exports = {
    getPairAddr,
    getBalanceOfPool,
    balanceOfEth,
    balanceOfToken,
    getAmountsIn,
    getAmountsOut
}
