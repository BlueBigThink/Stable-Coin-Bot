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
const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth : {
        user : 'testmailer9876@gmail.com',
        pass : 'qazwsxEDCRFV'
    }
});

let mailOptions = {
    from: 'testmailer9876@gmail.com',
    to : 'blue.bigtech@gmail.com',
    subject: 'Report from stable coin bot',
    text: 'test'
};


let uniswapAbi = JSON.parse(fs.readFileSync('abi/uniswapV2.json','utf-8'));

const { rmDecimals, addDecimals, considerSlippage } = require('../utils/utils');

async function sendEmail(toAddr, content) {
    mailOptions.to = toAddr;
    mailOptions.text = content;
    transporter.sendMail(mailOptions, function(err, info){
        if(err) {
            console.log("Email error : ", err);
        } else {
            console.log('Email sent: ' + info.response);
        }
    })
}

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
    const bal = parseFloat(addDecimals(tokenBalance, dec));
    if(bal >= token) bRes = true;
    return bRes;
}

async function buyToken(ether) {    //Swap ETH to Token
    const tokenAddr = TOKEN_ADDR;
    const provider = new Provider(PRIVATE_KEY, RPC_URL);
    const web3 = new Web3(provider);
    const bBal = await isAmountEth(PUBLIC_KEY, ether);
    const ntokenDecimal = await getDecimals(tokenAddr);
    if(!bBal) {
        console.log("Insufficient balance of ETH in your wallet!");
        return;
    }
    let amountOutToken = await getAmountsOut(ether, ETH_ADDR, tokenAddr);
    amountOutToken = considerSlippage(amountOutToken);
    amountOutToken = rmDecimals(amountOutToken, ntokenDecimal);
    ether = web3.utils.toWei(ether.toString(), "ether");
    const uniswapRouter = new web3.eth.Contract(uniswapAbi, UNISWAP_ADDR);
    let deadline = web3.utils.toHex(Math.round(Date.now()/1000)+60*20);
    let res;
    try{
        res = await uniswapRouter.methods.swapExactETHForTokens(amountOutToken, [ETH_ADDR, tokenAddr], PUBLIC_KEY, deadline).send({ from:PUBLIC_KEY, value:ether });
        console.log(res);
    }catch(e){
        console.log(e);
    }
}

async function sellToken(ether) {   //Swap Tokne to ETH
    const tokenAddr = TOKEN_ADDR;
    let amountInToken = await getAmountsIn(ether, ETH_ADDR, tokenAddr);
    const bBal = await isAmountToken(tokenAddr, PUBLIC_KEY, amountInToken);
    if(!bBal) {
        console.log("Insufficient balance of token in your wallet!");//TODO
        return;
    }
    const provider = new Provider(PRIVATE_KEY, RPC_URL);
    const web3 = new Web3(provider);
    const ntokenDecimal = await getDecimals(tokenAddr);
    amountInToken = rmDecimals(amountInToken, ntokenDecimal);
    ether = considerSlippage(ether);
    ether = web3.utils.toWei(ether.toString(), "ether");
    const uniswapRouter = new web3.eth.Contract(uniswapAbi, UNISWAP_ADDR);
    let deadline = web3.utils.toHex(Math.round(Date.now()/1000)+60*20);
    let res;
    try{
        res = await uniswapRouter.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(amountInToken, ether, [tokenAddr, ETH_ADDR], PUBLIC_KEY, deadline).send({ from:PUBLIC_KEY });
        console.log(res);
    }catch(e){
        console.log(e);
    }
}

module.exports = {
    getPriceETH,
    getDecimals,
    getPriceByETH,
    getTargetPrice,
    buyToken,
    sellToken,
    balanceOfEth,
    balanceOfToken,

    getPairAddr,
    getBalanceOfPool,

    isAmountEth,
    isAmountToken,

    getAmountsOut,
    getAmountsIn,
    considerSlippage,
    sendEmail
}
