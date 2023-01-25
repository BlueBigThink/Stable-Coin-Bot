const { getPriceETH } = require('../api/tokenPrice');
async function test() {
    console.log(await getPriceETH());
}

module.exports = {
    test
}