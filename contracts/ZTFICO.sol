// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ZTFToken.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ZTFICO is Ownable, ReentrancyGuard {
    ZTFToken public token;
    IERC20 public usdt;
    AggregatorV3Interface internal priceFeed;

    uint256 public constant ROUND1_PRICE_USD = 40 * 10 ** 18; // Price in USD (scaled by 10**18 for precision)
    uint256 public constant ROUND2_PRICE_USD = 42 * 10 ** 18; // Price in USD (scaled by 10**18 for precision)
    uint256 public constant ROUND1_TOKENS = 7000 * 10 ** 18; // 7000 tokens in round 1
    uint256 public constant ROUND2_TOKENS = 28000 * 10 ** 18; // Remaining tokens in round 2

    uint256 public round1Sold;
    uint256 public round2Sold;

    bool public round1Active;
    bool public round2Active;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);

    constructor(
        address tokenAddress,
        address usdtAddress,
        address priceFeedAddress
    ) {
        token = ZTFToken(tokenAddress);
        usdt = IERC20(usdtAddress);
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function startRound1() external onlyOwner {
        require(!round1Active, "Round 1 already active");
        round1Active = true;
        round2Active = false;
    }

    function startRound2() external onlyOwner {
        require(
            round1Active && round1Sold >= ROUND1_TOKENS,
            "Round 1 not completed"
        );
        require(!round2Active, "Round 2 already active");
        round1Active = false;
        round2Active = true;
    }

    function getLatestPrice() public view returns (uint256) {
        (, int price, , , ) = priceFeed.latestRoundData();
        return uint256(price * 10 ** 10); // Adjust the price to 18 decimals
    }

    function buyTokensWithETH(uint256 amount) external payable nonReentrant {
        require(round1Active || round2Active, "No active sale round");

        uint256 priceUSD = round1Active ? ROUND1_PRICE_USD : ROUND2_PRICE_USD;
        uint256 availableTokens = round1Active
            ? (ROUND1_TOKENS - round1Sold)
            : (ROUND2_TOKENS - round2Sold);
        uint256 priceETH = (priceUSD * 10 ** 18) / getLatestPrice(); // Calculate price in Ether

        require(amount <= availableTokens, "Not enough tokens left for sale");
        require(
            msg.value >= (amount * priceETH) / 10 ** 18,
            "Insufficient funds sent"
        );

        if (round1Active) {
            round1Sold += amount;
        } else {
            round2Sold += amount;
        }

        token.transfer(msg.sender, amount);

        emit TokensPurchased(msg.sender, amount, msg.value);
    }

    function buyTokensWithUSDT(uint256 amount) external nonReentrant {
        require(round1Active || round2Active, "No active sale round");

        uint256 priceUSD = round1Active ? ROUND1_PRICE_USD : ROUND2_PRICE_USD;
        uint256 availableTokens = round1Active
            ? (ROUND1_TOKENS - round1Sold)
            : (ROUND2_TOKENS - round2Sold);
        // Calculate cost in USDT, adjusting for 6 decimals
        uint256 costUSDT = (priceUSD * amount) / 10 ** 30;

        require(amount <= availableTokens, "Not enough tokens left for sale");

        uint256 usdtBalance = usdt.balanceOf(msg.sender);
        uint256 usdtAllowance = usdt.allowance(msg.sender, address(this));

        require(usdtAllowance >= costUSDT, "USDT allowance too low");
        require(usdtBalance >= costUSDT, "USDT balance too low");

        require(
            usdt.transferFrom(msg.sender, address(this), costUSDT),
            "USDT transfer failed"
        );

        if (round1Active) {
            round1Sold += amount;
        } else {
            round2Sold += amount;
        }

        token.transfer(msg.sender, amount);

        emit TokensPurchased(msg.sender, amount, costUSDT);
    }

    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawUSDT() external onlyOwner {
        usdt.transfer(owner(), usdt.balanceOf(address(this)));
    }
}
