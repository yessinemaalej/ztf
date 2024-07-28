const { ethers } = require("hardhat");

const contractAddress = "0xD9E6E7CAe34A2A0Ad03C21340D7dCC5c7380a801"; // Replace with your contract address
const contractABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "priceFeedAddress",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "cost",
                "type": "uint256"
            }
        ],
        "name": "TokensPurchased",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "ROUND1_PRICE_USD",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "ROUND1_TOKENS",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "ROUND2_PRICE_USD",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "ROUND2_TOKENS",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "buyTokens",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getLatestPrice",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "round1Active",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "round1Sold",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "round2Active",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "round2Sold",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "startRound1",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "startRound2",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "token",
        "outputs": [
            {
                "internalType": "contract ZTFToken",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

let web3;
let contract;
/*window.addEventListener('load', async () => {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        console.log(web3)
        await window.ethereum.enable(); // Request account access if needed
    } else if (window.web3) {
        web3 = new Web3(web3.currentProvider); // Legacy dapp browsers...
        console.log(web3)

    } else {
        alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
        return;
    }

    contract = new web3.eth.Contract(contractABI, contractAddress);
    console.log(contract)
});
*/
function shortenAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            //alert(`Wallet connected: ${accounts[0]}`);
            localStorage.setItem('connectedAccount', accounts[0]);
            displayWallet(accounts[0]);
        } catch (error) {
            console.error('Wallet connection error:', error);
            alert('Wallet connection error: ' + error.message);
        }
    } else {
        alert('Please install MetaMask or another Ethereum wallet to use this feature.');
    }
}


async function displayWallet(account) {
    document.getElementById('connectButton').style.display = 'none';
    const walletAddressElem = document.getElementById('wallet-address');
    walletAddressElem.textContent = `Connected to: ${shortenAddress(account)}`;

    const owner = await contract.methods.owner().call();
    if (account.toLowerCase() === owner.toLowerCase()) {
        document.getElementById('startRound1Button').style.display = 'block';
        document.getElementById('startRound2Button').style.display = 'block';

    } else {
        document.getElementById('startRound1Button').style.display = 'none';
        document.getElementById('startRound2Button').style.display = 'none';

    }
}

async function checkWalletConnection() {
    console.log("checking...");
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
        localStorage.setItem('connectedAccount', accounts[0]);
        displayWallet(accounts[0]);
    } else {
        localStorage.removeItem('connectedAccount');
        document.getElementById('connectButton').style.display = 'block';
        document.getElementById('wallet-address').textContent = '';
        connectWallet()
    }
}

window.addEventListener('load', async () => {
    await checkWalletConnection();

    // Listen for account change events
    window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
            localStorage.setItem('connectedAccount', accounts[0]);
            displayWallet(accounts[0]);
        } else {
            localStorage.removeItem('connectedAccount');
            document.getElementById('connectButton').style.display = 'block';
            document.getElementById('wallet-address').textContent = '';
        }
    });
});

document.getElementById('connectButton').addEventListener('click', connectWallet);
//window.addEventListener('load', checkWalletConnection);
/*
Token deployed to: 0x3f7D49f66068cfA4d4B30D270eD5a57AEC6de990
ICO contract deployed to: 0xeF148F091f9b20f43Ea248717F0192c0d10e817c
*/





async function buyTokens() {
    const accounts = await web3.eth.getAccounts();
    console.log(accounts)
    const amount = document.getElementById('tokenAmount').value;
    console.log("amount", amount)
    const priceUSD = await contract.methods.round1Active().call() ? await contract.methods.ROUND1_PRICE_USD().call() : await contract.methods.ROUND2_PRICE_USD().call();
    console.log("priceUSD", priceUSD)
    const latestPrice = await contract.methods.getLatestPrice().call();
    console.log("latestPrice", latestPrice)
    const priceETH = (priceUSD * 10 ** 18) / latestPrice;
    console.log("priceETH", priceETH)

    try {
        await contract.methods.buyTokens(amount).send({
            from: accounts[0],
            value: (amount * priceETH) / 10 ** 18
        }).then(res => console.log(res));
        alert('Tokens purchased successfully!');
    } catch (error) {
        console.log('Error buying tokens: ' + error.message);
    }
}


async function startRound1() {
    const accounts = await web3.eth.getAccounts();
    const owner = await contract.methods.owner().call();
    if (accounts[0].toLowerCase() !== owner.toLowerCase()) {
        alert('Only the owner can start round 1');
        return;
    }

    const round1Active = await contract.methods.round1Active().call();
    if (round1Active) {
        alert('Round 1 is already active');
        return;
    }

    try {
        await contract.methods.startRound1().send({
            from: accounts[0],
            gas: 3000000 // Adjust gas limit if necessary
        });
        alert('Round 1 started successfully!');
    } catch (error) {
        alert('Error starting Round 1: ' + error.message);
        console.error(error);
    }
}

async function startRound2() {
    const accounts = await web3.eth.getAccounts();
    try {
        await contract.methods.startRound2().send({ from: accounts[0] });
        alert('Round 2 started successfully!');
    } catch (error) {
        alert('Error starting Round 2: ' + error.message);
    }
}

/*
Deploying contracts with the account: 0xB3F4D133b49D7744dda6ad84005573998E146A5F
Token deployed to: 0xD9E6E7CAe34A2A0Ad03C21340D7dCC5c7380a801
MockPriceFeed deployed to: 0xF42602119d937a359112AF33ebA15D464D5e7Abb
Token deployed to: 0xD9E6E7CAe34A2A0Ad03C21340D7dCC5c7380a801
Tokens transferred to ICO contract
 */

async function main() {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy the ZTFToken contract
    const ZTFToken = await ethers.getContractFactory("ZTFToken");
    token = await ZTFToken.deploy();
    await token.deployed();
    const bal = await token.balanceOf(token.address)
    console.log(bal.toString())

    // Mint 35,000 tokens to the owner's address (assuming ZTFToken has a mint function)
    const tokensForSale = ethers.utils.parseUnits("35000", 18); // 35,000 tokens with 18 decimals
    //await token.mint(owner.address, tokensForSale);

    // Deploy the MockV3Aggregator contract with an initial price of 2000 USD per ETH
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    mockPriceFeed = await MockV3Aggregator.deploy(8, 2000 * 10**8); // 2000 USD per ETH
    await mockPriceFeed.deployed();

    // Deploy the ZTFICO contract
    const ZTFICO = await ethers.getContractFactory("ZTFICO");
    ico = await ZTFICO.deploy(token.address, mockPriceFeed.address);
    await ico.deployed();

    // Transfer 35,000 tokens from the owner to the ICO contract
    await token.transfer(ico.address, tokensForSale);

    //const startRound1 = await 
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
