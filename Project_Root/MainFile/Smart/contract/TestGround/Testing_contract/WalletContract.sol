// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WalletContract {
    address public owner;
    mapping(address => uint256) public balances;

    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event Trade(address indexed from, address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than 0");
        balances[to] += amount;
        emit Mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        require(from != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than 0");
        require(balances[from] >= amount, "Insufficient balance");
        balances[from] -= amount;
        emit Burn(from, amount);
    }

    function trade(address to, uint256 amount) public {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Trade(msg.sender, to, amount);
    }
}