// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZTFToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 50000 * 10 ** 18;
    uint256 public constant DEVELOPMENT_RESERVE = 15000 * 10 ** 18;
    uint256 public constant ICO_SUPPLY = TOTAL_SUPPLY - DEVELOPMENT_RESERVE;

    constructor() ERC20("ZTFToken", "ZTF") {
        _mint(msg.sender, TOTAL_SUPPLY); // Mint development reserve to contract owner
        //_mint(address(this), ICO_SUPPLY-DEVELOPMENT_RESERVE); // Mint ICO tokens to the contract
    }
}
