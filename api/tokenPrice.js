const fs = require('fs')
const Web3 = require('web3');

const web3 = new Web3(RPC_URL);
const { setDecimals, addDecimals } = require('../utils/utils');

let uniswapABI = JSON.parse(fs.readFileSync('abi/uniswapV2.json','utf-8'));
let tokenAbi = JSON.parse(fs.readFileSync('abi/erc20.json','utf-8'));

async function getDecimals( tokenAddress ){
    let tokenRouter = await new web3.eth.Contract( tokenAbi, tokenAddress );
    return await tokenRouter.methods.decimals().call();
}
async function getPriceByETH( tokenAmountToSell, tokenAddr){
    let tokenRouter = await new web3.eth.Contract( tokenAbi, tokenAddr );
    let tokenDecimals = await tokenRouter.methods.decimals().call();
    
    tokenAmountToSell = setDecimals(tokenAmountToSell, tokenDecimals);
    let amountOut;
    try {
        let router = await new web3.eth.Contract( uniswapABI, UNISWAP_ADDR );
        amountOut = await router.methods.getAmountsOut(tokenAmountToSell, [tokenAddr ,ETH_ADDR]).call();
        amountOut =  web3.utils.fromWei(amountOut[1]);
    } catch (error) {}
    if(!amountOut) return 0;
    return amountOut;
}

async function getPriceETH(){
    let ethToSell = web3.utils.toWei("1", "ether");
    let amountOut;
    try {
        let router = await new web3.eth.Contract( uniswapABI, UNISWAP_ADDR );
        amountOut = await router.methods.getAmountsOut(ethToSell, [ETH_ADDR ,USDT_ADDR]).call();
        // const dec = await getDecimals(USDT_ADDR);
        amountOut =  amountOut[1];
        amountOut = addDecimals(amountOut, 6);
    } catch (error) {}


    if(!amountOut) return 0;
    return amountOut;
}

module.exports = {
    getPriceETH,
    getDecimals,
    getPriceByETH
}
