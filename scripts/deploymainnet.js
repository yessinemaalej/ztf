async function main() {
    const tokensForSale = ethers.utils.parseUnits("35000", 18); // 35,000 tokens with 18 decimals

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    // Deploying Token
    const ZTFToken = await ethers.getContractFactory("ZTFToken");
    const ztfToken = await ZTFToken.deploy();
    await ztfToken.deployed();
    console.log("Token deployed to:", ztfToken.address);

    
    // Deploy the ZTFICO contract
    const ZTFICO = await ethers.getContractFactory("ZTFICO");
    const ztfICO = await ZTFICO.deploy(ztfToken.address,"0xdac17f958d2ee523a2206206994597c13d831ec7" ,"0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419");
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
