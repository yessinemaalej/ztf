async function main() {
    const tokensForSale = ethers.utils.parseUnits("35000", 18); // 35,000 tokens with 18 decimals

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    // Deploying Token
    const ZTFToken = await ethers.getContractFactory("ZTFToken");
    const ztfToken = await ZTFToken.deploy();
    await ztfToken.deployed();
    console.log("Token deployed to:", ztfToken.address);

    // Deploy the MockV3Aggregator contract with an initial price of 2000 USD per ETH
    /*const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    mockPriceFeed = await MockV3Aggregator.deploy(8, 2000 * 10**8); // 2000 USD per ETH
    await mockPriceFeed.deployed();
    console.log("MockPriceFeed deployed to:", mockPriceFeed.address);
*/
    // Deploy the ZTFICO contract
    const ZTFICO = await ethers.getContractFactory("ZTFICO");
    const ztfICO = await ZTFICO.deploy(ztfToken.address,"0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0" ,"0x694AA1769357215DE4FAC081bf1f309aDC325306");
    await ztfICO.deployed();
    console.log("ZTFICO deployed to:", ztfICO.address);

    // Transfer tokens to the ICO contract
    await ztfToken.transfer(ztfICO.address, tokensForSale);
    console.log(`${tokensForSale} Tokens transferred to ICO contract`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
//Contract = 0x4DDc8857ef134EA49A9aB4c02B72596ebD7341a5
//token = 0x288514500d38cD3db503a5070013cA980206Ef8D
//Owner = 0x26e7CDeb1Eb11C18Fa760dc27C0Aab7653258612