const {
    getPriceETH,
    getDecimals,
    getPriceByETH,
    getTargetPrice,
} = require('./tokenPrice');

const {
    getPairAddr,
    getBalanceOfPool,
    balanceOfEth,
    balanceOfToken,
    getAmountsIn,
    getAmountsOut
} = require('./getBalance');

const fs = require('fs');
const Provider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');

let tokenAbi = JSON.parse(fs.readFileSync('abi/erc20.json','utf-8'));
let uniswapAbi = JSON.parse(fs.readFileSync('abi/uniswapV2.json','utf-8'));

const { rmDecimals } = require('../utils/utils');

async function isAmountEth (ownerAddr, ether) {
    let bRes = false;
    const ethBalance = await balanceOfEth(ownerAddr);
    if(parseFloat(ethBalance.eth) >= (parseFloat(ether))) bRes = true;
    return bRes;
}

async function isAmountToken(tokenAddr, ownerAddr, token){
    let bRes = false;
    const tokenBalance = await balanceOfToken(tokenAddr, ownerAddr);
    const dec = await getDecimals(tokenAddr);
    const bal = parseFloat(rmDecimals(tokenBalance, dec));
    if(bal >= token) bRes = true;
    return bRes;
}

async function buyToken(ether) {    //Swap ETH to Token
    const tokenAddr = USDT_ADDR; //TODO
    let amountOutToken = getAmountsOut(ether, ETH_ADDR, tokenAddr);
    const bBal = isAmountEth(ether);
    if(!bBal) return;
    const provider = new Provider(PRIVATE_KEY, RPC_URL);
    const web3 = new Web3(provider);
    const uniswapRouter = new web3.eth.Contract(uniswapAbi, UNISWAP_ADDR);
    let deadline = web3.utils.toHex(Math.round(Date.now()/1000)+60*20);
    console.log(res);
    try{
        res = await uniswapRouter.methods.swapExactETHForTokens(amountOutToken, [ETH_ADDR, tokenAddr], PUBLIC_KEY, deadline).send({ from:PUBLIC_KEY, value:ether });
    }catch(e){}
}

async function sellToken(ether) {   //Swap Tokne to ETH
    const tokenAddr = USDT_ADDR; //TODO
    let amountInToken = getAmountsIn(ether, tokenAddr, ETH_ADDR);
    const bBal = isAmountToken(amountInToken);
    if(!bBal) return;
    const provider = new Provider(PRIVATE_KEY, RPC_URL);
    const web3 = new Web3(provider);
    const uniswapRouter = new web3.eth.Contract(uniswapAbi, UNISWAP_ADDR);
    let deadline = web3.utils.toHex(Math.round(Date.now()/1000)+60*20);
    let res = null;
    try{
        res = await uniswapRouter.methods.swapExactTokensForETH(amountInToken, ether, [tokenAddr, ETH_ADDR], PUBLIC_KEY, deadline).call();
    }catch(e){}
    console.log(res);
}

module.exports = {
    getPriceETH,
    getDecimals,
    getPriceByETH,
    getTargetPrice,
    buyToken,
    sellToken,

    getPairAddr,
    getBalanceOfPool,

    isAmountEth,
    isAmountToken
}
