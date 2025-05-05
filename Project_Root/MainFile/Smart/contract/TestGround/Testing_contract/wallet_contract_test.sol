// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
/*
this file will generate & destroy currency on the chain by
1.mint
2.burn

also it can trade with other by
1.trade

construcor is set so the one deploy the contract is the owner and owner is the only one who can do burn & mint

so we may need to 


also emit + event = when run emit -> send a event
*/ 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract wallet_contract_test is ERC20, Ownable 
{
    
    uint256 private STARTING_MINT = 100;
    uint256 private totalMinted = 0;
    //mapping = hashtable address是key -> Int變數當value
    //this will record everyone;s balance
    mapping(address => uint256) private _balances;
    //record who spent their money last time
    //for decay
    mapping(address => uint256) private _lastSpend;
    // constructor
    constructor() ERC20("MyToken", "MTK")  Ownable(msg.sender)
    {
        STARTING_MINT = 100;
        totalMinted = 0;
    }

    // mint  ( owner)
    function mint(address to, uint256 amount) external onlyOwner 
    {
        //_mint is a function built in ERC20
        _mint(to, amount);
        emit Mint(to,amount);
    }
    event Mint(address indexed to, uint256 amount);

    // burn ( owner)
    function burn(address from, uint256 amount) external onlyOwner 
    {
        //also burn is built in
        _burn(from, amount);
        emit Burn(from, amount);
    }
    event Burn(address indexed from, uint256 amount);

    // trade (maybe just use transfer ?）
    function trade(address to, uint256 amount) external 
    {
        //need
        require(balanceOf(msg.sender) >= amount, "Insufficient");
        _transfer(msg.sender, to, amount);
        emit Trade(msg.sender, to, amount);
        //update last spend & send a event out
        _lastSpend[to] = block.timestamp;
        emit LastSpendUpdate(to, block.timestamp);

    }
    event Trade(address indexed from, address indexed to, uint256 amount);
    event LastSpendUpdate(address indexed who, uint256 timeStamp);


    //TODO for future
    /*function devay(address user) internal
    {
        
    }*/

}
