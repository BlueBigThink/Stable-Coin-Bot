// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// Chainlink Imports
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract UniCredToken is ERC20, ChainlinkClient, ConfirmedOwner {
    using SafeMath for uint256;
    using Chainlink for Chainlink.Request;

    address public feeAddress; // should be contract owner.
    uint256 public price; // token price

    /**
     * @notice Initialize the link token and target oracle
     *
     * Ethereum mainnet details:
     * Link Token: 0x514910771AF9Ca656af840dff83E8264EcF986CA
     * Oracle: 0x188b71C9d27cDeE01B9b0dfF5C1aff62E8D6F434
     * jobId: 7599d3c8f31e4ce78ad2b790cbcfc673
     *
     **************************************************
     *
     * Goerli Testnet details:
     * Link Token: 0x326C977E6efc84E512bB9C30f76E30c160eD06FB
     * Oracle: 0xCC79157eb46F5624204f47AB42b3906cAA40eaB7 (Chainlink DevRel)
     * jobId: ca98366cc7314957b8c012c72f05aeeb
     *
     */

    LinkTokenInterface LINK;
    address linkToken = 0x514910771AF9Ca656af840dff83E8264EcF986CA;
    address oracle = 0x188b71C9d27cDeE01B9b0dfF5C1aff62E8D6F434;
    string constant jobId = "7599d3c8f31e4ce78ad2b790cbcfc673";

    uint256 private constant ORACLE_PAYMENT = 1360000000000000000; // 1.36LINK

    uint256 private transferFee; // percentage.
    event RequestValue(bytes32 indexed requestId, uint256 indexed value);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) ERC20(_name, _symbol) ConfirmedOwner(msg.sender) {
        _mint(msg.sender, _totalSupply);
        feeAddress = msg.sender;
        transferFee = 500; // fee 5 %

        setChainlinkToken(linkToken);
        setChainlinkOracle(oracle);
    }

    function setFeeAddress(address _newAddress) external onlyOwner {
        feeAddress = _newAddress;
    }

    function setPrice(uint256 _price) external onlyOwner {
        price = _price;
    }

    function getPrice() external view returns (uint256) {
        return price;
    }

    /**
     * Create a Chainlink request to retrieve API response, find the target
     * data, then multiply by 1000000000000000000 (to remove decimal places from data).
     */

    function requestVolumeData() public returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(
            stringToBytes32(jobId),
            address(this),
            this.fulfill.selector
        );

        // Set the URL to perform the GET request on
        req.add("get", "https://api.un1credapp.com/api/forex/avg");

        req.add("path", "result");

        // Multiply the result by 1000000000000000000 to remove decimals
        int256 timesAmount = 10**18;
        req.addInt("times", timesAmount);

        // Sends the request
        return sendChainlinkRequest(req, ORACLE_PAYMENT);
    }

    /**
     * Receive the response in the form of uint256
     */

    function stringToBytes32(string memory source)
        private
        pure
        returns (bytes32 result)
    {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            // solhint-disable-line no-inline-assembly
            result := mload(add(source, 32))
        }
    }

    function fulfill(bytes32 _requestId, uint256 _price)
        public
        recordChainlinkFulfillment(_requestId)
    {
        if (_price > 0) {
            price = _price;
        }

        LinkTokenInterface(linkToken).transferFrom(
            owner(),
            address(this),
            ORACLE_PAYMENT
        );
        emit RequestValue(_requestId, _price);
    }

    function getLinkBalance() public view returns (uint256) {
        return LinkTokenInterface(linkToken).balanceOf(address(this));
    }

    function getLinkTokenTotalSupply() public view returns (uint256) {
        return LinkTokenInterface(linkToken).totalSupply();
    }

    /*
     * @dev Sets the transactionFee rate (in Wei) for this specific contract instance
     * 10000 wei is equivalent to 100%
     * 1000 wei is equivalent to 10%
     * 100 wei is equivalent to 1%
     * 10 wei is equivalent to 0.1%
     * 1 wei is equivalent to 0.01%
     * Whereby a traditional floating point percentage like 8.54% would simply be
     * 854 percentage basis points (or in terms of the ethereum uint256 variable, 854 wei)
     *
     * $0 - $3,124 (5%)
     * $3,125 - $6,249 (4.5%)
     * $6,250 - $12,499 (4%)
     * $12,500 - $25,000 (3.5%)
     * $25,000 - $49,999 (3%)
     * $50,000 - $89,999 (2.5%)
     * $90,000 - $249,999 (2%)
     * $250,000 - $499,999 (1.5%)
     * $500,000 - $850,000 (1%)
     * $1,000,000 + (0.5%)
     */
    function setTransferFee(uint256 _amount) internal {
        uint8 decimals = super.decimals();
        // 5%
        if (
            _amount > 0 &&
            _amount <= (3124 * (10**decimals)).div(price).mul(10**decimals)
        ) {
            transferFee = 500;
        }
        // 4.5%
        else if (
            _amount > (3124 * (10**decimals)).div(price).mul(10**decimals) &&
            _amount <= (6429 * (10**decimals)).div(price).mul(10**decimals)
        ) {
            transferFee = 450;
        }
        // 4%
        else if (
            _amount > (6429 * (10**decimals)).div(price).mul(10**decimals) &&
            _amount <= (12499 * (10**decimals)).div(price).mul(10**decimals)
        ) {
            transferFee = 400;
        }
        // 3.5%
        else if (
            _amount > (12499 * (10**decimals)).div(price).mul(10**decimals) &&
            _amount <= (25000 * (10**decimals)).div(price).mul(10**decimals)
        ) {
            transferFee = 350;
        }
        // 3%
        else if (
            _amount > (25000 * (10**decimals)).div(price).mul(10**decimals) &&
            _amount <= (49999 * (10**decimals)).div(price).mul(10**decimals)
        ) {
            transferFee = 300;
        }
        // 2.5%
        else if (
            _amount > (49999 * (10**decimals)).div(price).mul(10**decimals) &&
            _amount <= (89999 * (10**decimals)).div(price).mul(10**decimals)
        ) {
            transferFee = 250;
        }
        // 2%
        else if (
            _amount > (89999 * (10**decimals)).div(price).mul(10**decimals) &&
            _amount <= (249999 * (10**decimals)).div(price).mul(10**decimals)
        ) {
            transferFee = 250;
        }
        // 1.5%
        else if (
            _amount > (249999 * (10**decimals)).div(price).mul(10**decimals) &&
            _amount <= (499999 * (10**decimals)).div(price).mul(10**decimals)
        ) {
            transferFee = 150;
        }
        // 1%
        else if (
            _amount > (499999 * (10**decimals)).div(price).mul(10**decimals) &&
            _amount <= (850000 * (10**decimals)).div(price).mul(10**decimals)
        ) {
            transferFee = 100;
        }
        // 0.5%
        else {
            transferFee = 50;
        }
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        setTransferFee(amount);
        uint256 feeAmount = (amount.mul(transferFee)).div(10000);
        super._transfer(from, to, amount - feeAmount);
        super._transfer(from, feeAddress, feeAmount);
    }
}
