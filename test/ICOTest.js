const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZTFICO with Oracle", function () {
    let ztfToken,usdt, ztfICO, owner, addr1, addr2, mockPriceFeed;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the ZTFToken contract
        const ZTFToken = await ethers.getContractFactory("ZTFToken");
        ztfToken = await ZTFToken.deploy();
        await ztfToken.deployed();

        // Mint 35,000 tokens to the owner's address
        const tokensForSale = ethers.utils.parseUnits("35000", 18); // 35,000 tokens with 18 decimals

        // Deploy the MockV3Aggregator contract with an initial price of 2000 USD per ETH
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        mockPriceFeed = await MockV3Aggregator.deploy(8, 2000 * 10 ** 8); // 2000 USD per ETH
        await mockPriceFeed.deployed();

        // Deploy USDT mock token
        const USDT = await ethers.getContractFactory("MockERC20");
        usdt = await USDT.deploy("USDT", "USDT", 6); // Ensure USDT has 6 decimals
        await usdt.deployed();

        // Mint USDT to addr1
        await usdt.mint(addr1.address, ethers.utils.parseUnits("10000", 6)); // 10,000 USDT

        // Deploy the ZTFICO contract
        const ZTFICO = await ethers.getContractFactory("ZTFICO");
        ztfICO = await ZTFICO.deploy(ztfToken.address, usdt.address, mockPriceFeed.address);
        await ztfICO.deployed();

        // Transfer 35,000 tokens from the owner to the ICO contract
        await ztfToken.transfer(ztfICO.address, tokensForSale);

        const ownerBalance = await ztfToken.balanceOf(owner.address);
        const contractBalance = await ztfToken.balanceOf(ztfICO.address);
    });

    

    it("should start round 1", async function () {
        await ztfICO.startRound1();
        expect(await ztfICO.round1Active()).to.equal(true);
        expect(await ztfICO.round2Active()).to.equal(false);
    });

    it("should allow a user to buy tokens with ETH", async function () {
        await ztfICO.startRound1();

        const tokenAmount = ethers.utils.parseUnits("100", 18); // 100 tokens
        const priceUSD = ethers.utils.parseUnits("40", 18); // Round 1 price
        const ethPrice = await ztfICO.getLatestPrice();
        const priceETH = priceUSD.mul(tokenAmount).div(ethPrice);

        await ztfICO.connect(addr1).buyTokensWithETH(tokenAmount, { value: priceETH });

        // Check balances
        const buyerBalance = await ztfToken.balanceOf(addr1.address);
        expect(buyerBalance).to.equal(tokenAmount);

        const icoBalance = await ethers.provider.getBalance(ztfICO.address);
        expect(icoBalance).to.equal(priceETH);

        const round1Sold = await ztfICO.round1Sold();
        expect(round1Sold).to.equal(tokenAmount);
    });

    it("should allow a user to buy tokens with USDT", async function () {
        await ztfICO.startRound1();

        const tokenAmount = ethers.utils.parseUnits("50", 18); // 50 tokens
        const priceUSD = ethers.utils.parseUnits("40", 18); // Round 1 price
        const costUSDT = priceUSD.mul(tokenAmount).div(ethers.utils.parseUnits("1", 18)).div(ethers.utils.parseUnits("1", 12)); // Calculate cost in USDT (6 decimals)

        // Check initial USDT balance of addr1
        const initialUSDTBalance = await usdt.balanceOf(addr1.address);
        console.log("Initial USDT Balance of addr1:", initialUSDTBalance.toString());
        console.log("Calculated cost in USDT:", costUSDT.toString());

        // Ensure addr1 has enough USDT
        expect(initialUSDTBalance).to.be.at.least(costUSDT);

        // Log expected and actual allowances
        console.log("Expected allowance:", costUSDT.toString());
        await usdt.connect(addr1).approve(ztfICO.address, costUSDT);
        const actualAllowance = await usdt.allowance(addr1.address, ztfICO.address);
        console.log("Actual allowance:", actualAllowance.toString());

        // Verify balance and allowance before transferFrom
        const allowanceBefore = await usdt.allowance(addr1.address, ztfICO.address);
        const balanceBefore = await usdt.balanceOf(addr1.address);
        console.log("Allowance before transferFrom:", allowanceBefore.toString());
        console.log("Balance before transferFrom:", balanceBefore.toString());

        // Ensure allowance is enough
        expect(allowanceBefore).to.be.at.least(costUSDT);

        // Buy tokens with USDT
        await ztfICO.connect(addr1).buyTokensWithUSDT(tokenAmount);

        // Verify balance and allowance after transferFrom
        const allowanceAfter = await usdt.allowance(addr1.address, ztfICO.address);
        const balanceAfter = await usdt.balanceOf(addr1.address);
        console.log("Allowance after transferFrom:", allowanceAfter.toString());
        console.log("Balance after transferFrom:", balanceAfter.toString());

        // Check balances
        const buyerBalance = await ztfToken.balanceOf(addr1.address);
        expect(buyerBalance).to.equal(tokenAmount);

        const icoUSDTBalance = await usdt.balanceOf(ztfICO.address);
        expect(icoUSDTBalance).to.equal(costUSDT);

        const round1Sold = await ztfICO.round1Sold();
        expect(round1Sold).to.equal(tokenAmount);
    });



   it("should not allow purchase beyond available tokens in round 1", async function () {
        await ztfICO.startRound1();

        await expect(
            ztfICO.connect(addr1).buyTokensWithETH(ethers.utils.parseUnits("8000", 18), { value: ethers.utils.parseUnits("160", 18) })
        ).to.be.revertedWith("Not enough tokens left for sale");
        await expect(
            ztfICO.connect(addr1).buyTokensWithUSDT(ethers.utils.parseUnits("8000", 18))
        ).to.be.revertedWith("Not enough tokens left for sale");
    });

    it("should start round 2 after round 1 completes", async function () {
        await ztfICO.startRound1();

        // Assume 1 ETH = 2000 USD, so 40 USD = 0.02 ETH
        await ztfICO.connect(addr1).buyTokensWithETH(ethers.utils.parseUnits("7000", 18), { value: ethers.utils.parseUnits("140", 18) });

        expect(await ztfICO.round1Sold()).to.equal(ethers.utils.parseUnits("7000", 18));

        // Start round 2
        await ztfICO.startRound2();
        expect(await ztfICO.round1Active()).to.equal(false);
        expect(await ztfICO.round2Active()).to.equal(true);
    });

    it("should allow purchase in round 2", async function () {
        await ztfICO.startRound1();
        await ztfICO.connect(addr1).buyTokensWithETH(ethers.utils.parseUnits("7000", 18), { value: ethers.utils.parseUnits("140", 18) });

        // Start round 2
        await ztfICO.startRound2();

        // Assume 1 ETH = 2000 USD, so 42 USD = 0.021 ETH
        await ztfICO.connect(addr2).buyTokensWithETH(ethers.utils.parseUnits("5000", 18), { value: ethers.utils.parseUnits("105", 18) });

        expect(await ztfToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits("5000", 18));
        expect(await ztfICO.round2Sold()).to.equal(ethers.utils.parseUnits("5000", 18));
    });

    it("should not allow purchase beyond available tokens in round 2", async function () {
        await ztfICO.startRound1();
        await ztfICO.connect(addr1).buyTokensWithETH(ethers.utils.parseUnits("7000", 18), { value: ethers.utils.parseUnits("140", 18) });

        // Start round 2
        await ztfICO.startRound2();

        await expect(
            ztfICO.connect(addr2).buyTokensWithETH(ethers.utils.parseUnits("30000", 18), { value: ethers.utils.parseUnits("630", 18) })
        ).to.be.revertedWith("Not enough tokens left for sale");
    });
 
    it("should allow the owner to withdrawETH ETH", async function () {
        await ztfICO.startRound1();

        const tokenAmount = ethers.utils.parseUnits("100", 18); // 100 tokens
        const priceUSD = ethers.utils.parseUnits("40", 18); // Round 1 price
        const ethPrice = await ztfICO.getLatestPrice();
        const priceETH = priceUSD.mul(tokenAmount).div(ethPrice);

        await ztfICO.connect(addr1).buyTokensWithETH(tokenAmount, { value: priceETH });

        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

        // Withdraw ETH
        const withdrawTx = await ztfICO.withdrawETH();
        const withdrawReceipt = await withdrawTx.wait();
        const gasUsed = withdrawReceipt.gasUsed.mul(withdrawTx.gasPrice);

        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

        expect(finalOwnerBalance).to.equal(initialOwnerBalance.add(priceETH).sub(gasUsed));
    });

    it("should allow the owner to withdraw USDT", async function () {
        await ztfICO.startRound1();
    
        const tokenAmount = ethers.utils.parseUnits("100", 18); // 100 tokens
        const priceUSD = ethers.utils.parseUnits("40", 18); // Round 1 price
        const costUSDT = priceUSD.mul(tokenAmount).div(ethers.utils.parseUnits("1", 30)); // Calculate cost in USDT
    
        console.log("Initial token amount:", tokenAmount.toString());
        console.log("Token price in USD:", priceUSD.toString());
        console.log("Calculated cost in USDT:", costUSDT.toString());
    
        // Approve USDT transfer to the ICO contract
        await usdt.connect(addr1).approve(ztfICO.address, costUSDT);
    
        // Check and log the USDT allowance before purchasing
        const allowanceBefore = await usdt.allowance(addr1.address, ztfICO.address);
        console.log("USDT Allowance before purchase:", allowanceBefore.toString());
    
        // Purchase tokens with USDT
        await ztfICO.connect(addr1).buyTokensWithUSDT(tokenAmount);
    
        // Check balances after purchase
        const buyerBalance = await ztfToken.balanceOf(addr1.address);
        console.log("Buyer balance after purchase:", buyerBalance.toString());
        const icoUSDTBalance = await usdt.balanceOf(ztfICO.address);
        console.log("ICO USDT balance after purchase:", icoUSDTBalance.toString());
    
        const round1Sold = await ztfICO.round1Sold();
        console.log("Round 1 tokens sold:", round1Sold.toString());
    
        const initialOwnerUSDTBalance = await usdt.balanceOf(owner.address);
        console.log("Initial owner USDT balance:", initialOwnerUSDTBalance.toString());
    
        // Withdraw USDT
        await ztfICO.withdrawUSDT();
    
        const finalOwnerUSDTBalance = await usdt.balanceOf(owner.address);
        console.log("Final owner USDT balance:", finalOwnerUSDTBalance.toString());
    
        expect(finalOwnerUSDTBalance).to.equal(initialOwnerUSDTBalance.add(costUSDT));
    });
    
    it("should have correct initial ztfToken allocation", async function () {
        // Corrected expected value for ICO ztfToken balance
        const expectedIcoBalance = ethers.utils.parseUnits("35000", 18);
        expect(await ztfToken.balanceOf(ztfICO.address)).to.equal(expectedIcoBalance);
        expect(await ztfICO.round1Sold()).to.equal(0);
        expect(await ztfICO.round2Sold()).to.equal(0);
    });

   it("should not allow starting round 2 before round 1 completes", async function () {
        await ztfICO.startRound1();
        
        await expect(ztfICO.startRound2()).to.be.revertedWith("Round 1 not completed");
    });

   it("should revert when buying tokens with insufficient funds", async function () {
        await ztfICO.startRound1();
        
        await expect(
            ztfICO.connect(addr1).buyTokensWithETH(ethers.utils.parseUnits("1000", 18), { value: ethers.utils.parseUnits("10", 18) }) // Only sending 10 ETH instead of 20 ETH
        ).to.be.revertedWith("Insufficient funds sent");
    });

     it("should not allow purchase when no tokens are available", async function () {
        await ztfICO.startRound1();
        
        await ztfICO.connect(addr1).buyTokensWithETH(ethers.utils.parseUnits("7000", 18), { value: ethers.utils.parseUnits("140", 18) }); // Buy all tokens in round 1
    
        await expect(
            ztfICO.connect(addr2).buyTokensWithETH(ethers.utils.parseUnits("1", 18), { value: ethers.utils.parseUnits("0.02", 18) }) // Attempt to buy tokens after round 1 is over
        ).to.be.revertedWith("Not enough tokens left for sale");
    });
    
    it("should handle ztfToken purchases from multiple addresses", async function () {
        await ztfICO.startRound1();
        
        // addr1 buys 1000 tokens
        await ztfICO.connect(addr1).buyTokensWithETH(ethers.utils.parseUnits("1000", 18), { value: ethers.utils.parseUnits("20", 18) });
        // addr2 buys 2000 tokens
        await ztfICO.connect(addr2).buyTokensWithETH(ethers.utils.parseUnits("2000", 18), { value: ethers.utils.parseUnits("40", 18) });
    
        expect(await ztfToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits("1000", 18));
        expect(await ztfToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits("2000", 18));
    });
    
    it("should correctly withdrawETH ETH from the contract", async function () {
        await ztfICO.startRound1();
        
        // Assume 1 ETH = 2000 USD, so 40 USD = 0.02 ETH
        await ztfICO.connect(addr1).buyTokensWithETH(ethers.utils.parseUnits("1000", 18), { value: ethers.utils.parseUnits("20", 18) });
        
        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
        const initialContractBalance = await ethers.provider.getBalance(ztfICO.address);
        
        const tx = await ztfICO.withdrawETH();
        const receipt = await tx.wait();
        
        // Calculate gas cost
        const gasUsed = receipt.cumulativeGasUsed;
        const gasPrice = receipt.effectiveGasPrice;
        const gasCost = gasUsed.mul(gasPrice);
        
        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        
        // Contract balance should be zero after withdrawal
        expect(await ethers.provider.getBalance(ztfICO.address)).to.equal(0);
        
        // Owner balance should increase by the contract balance minus gas costs
        expect(finalOwnerBalance).to.be.closeTo(initialOwnerBalance.add(initialContractBalance), gasCost);
    });
    
   it("should use the oracle price feed to determine ztfToken price", async function () {
        await ztfICO.startRound1();
        
        // Assume 1 ETH = 2000 USD, so 40 USD per ztfToken
        const round1PriceInUSD = ethers.utils.parseUnits("40", 8); // 40 USD per ztfToken, scaled to 8 decimals
        const ethPriceInUSD = await mockPriceFeed.latestAnswer(); // Fetch ETH price from oracle
        
        // Calculate the price of one ztfToken in ETH
        const pricePerTokenInETH = round1PriceInUSD.mul(ethers.utils.parseUnits("1", 18)).div(ethPriceInUSD); // Price of one ztfToken in ETH
    
        // Calculate total amount of ETH needed for 1000 tokens
        const amountOfTokens = ethers.utils.parseUnits("1000", 18);
        const totalCostInETH = pricePerTokenInETH.mul(amountOfTokens).div(ethers.utils.parseUnits("1", 18));
    
        // Buy tokens
        await ztfICO.connect(addr1).buyTokensWithETH(amountOfTokens, { value: totalCostInETH });
    
        // Verify ztfToken purchase
        expect(await ztfToken.balanceOf(addr1.address)).to.equal(amountOfTokens);
    });
    it("should allow a user to buy tokens with ETH and USDT, reducing the ICO contract's token balance", async function () {
        await ztfICO.startRound1();

        // Calculate the amount of tokens to be bought with ETH
        const tokenAmountETH = ethers.utils.parseUnits("50", 18); // 50 tokens
        const priceUSD = ethers.utils.parseUnits("40", 18); // Round 1 price
        const ethPrice = await ztfICO.getLatestPrice();
        const priceETH = priceUSD.mul(tokenAmountETH).div(ethPrice);

        // Calculate the amount of tokens to be bought with USDT
        const tokenAmountUSDT = ethers.utils.parseUnits("50", 18); // 50 tokens
        const costUSDT = priceUSD.mul(tokenAmountUSDT).div(ethers.utils.parseUnits("1", 30)); // Calculate cost in USDT

        // Initial balances
        const initialContractBalance = await ztfToken.balanceOf(ztfICO.address);

        // Buy tokens with ETH
        await ztfICO.connect(addr1).buyTokensWithETH(tokenAmountETH, { value: priceETH });

        // Approve and buy tokens with USDT
        await usdt.connect(addr1).approve(ztfICO.address, costUSDT);
        await ztfICO.connect(addr1).buyTokensWithUSDT(tokenAmountUSDT);

        // Check balances
        const buyerBalance = await ztfToken.balanceOf(addr1.address);
        expect(buyerBalance).to.equal(tokenAmountETH.add(tokenAmountUSDT));

        const finalContractBalance = await ztfToken.balanceOf(ztfICO.address);
        expect(finalContractBalance).to.equal(initialContractBalance.sub(tokenAmountETH.add(tokenAmountUSDT)));
        
        const icoETHBalance = await ethers.provider.getBalance(ztfICO.address);
        expect(icoETHBalance).to.equal(priceETH);

        const icoUSDTBalance = await usdt.balanceOf(ztfICO.address);
        expect(icoUSDTBalance).to.equal(costUSDT);

        const round1Sold = await ztfICO.round1Sold();
        expect(round1Sold).to.equal(tokenAmountETH.add(tokenAmountUSDT));
    });
    it("should allow a user to buy 1 token with USDT", async function () {
        await ztfICO.startRound1();
    
        const tokenAmount = ethers.utils.parseUnits("1", 18); // 1 token
        const priceUSD = ethers.utils.parseUnits("40", 18); // Round 1 price
        const costUSDT = priceUSD.div(ethers.utils.parseUnits("1", 12)); // Calculate cost in USDT
    
        // Check initial USDT balance of addr1
        const initialUSDTBalance = await usdt.balanceOf(addr1.address);
        console.log("Initial USDT Balance of addr1:", initialUSDTBalance.toString());
        console.log("Calculated cost in USDT:", costUSDT.toString());
    
        // Ensure addr1 has enough USDT
        expect(initialUSDTBalance).to.be.at.least(costUSDT);
    
        // Approve USDT transfer to the ICO contract
        await usdt.connect(addr1).approve(ztfICO.address, costUSDT);
    
        // Check the allowance after approval
        const allowance = await usdt.allowance(addr1.address, ztfICO.address);
        console.log("USDT Allowance:", allowance.toString());
    
        expect(allowance).to.equal(costUSDT);
    
        // Purchase tokens with USDT
        await ztfICO.connect(addr1).buyTokensWithUSDT(tokenAmount);
    
        // Check balances
        const buyerBalance = await ztfToken.balanceOf(addr1.address);
        expect(buyerBalance).to.equal(tokenAmount);
    
        const icoUSDTBalance = await usdt.balanceOf(ztfICO.address);
        expect(icoUSDTBalance).to.equal(costUSDT);
    
        const round1Sold = await ztfICO.round1Sold();
        expect(round1Sold).to.equal(tokenAmount);
    });
    
    
});
//10000000000
//4000000000