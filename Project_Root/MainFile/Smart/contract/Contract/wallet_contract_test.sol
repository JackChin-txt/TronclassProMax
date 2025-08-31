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
    //record who spent their money last time
    //for decay
    mapping(address => uint256) private _lastSpend;
    uint private decayTime = 120;

    // constructor
    constructor() ERC20("MyToken", "MTK")  Ownable(msg.sender)
    {
        STARTING_MINT = 100;
        totalMinted = 0;
        decayTime = 120 days;
    }

    // mint  ( owner)
    function Mint(address to, uint256 amount) external onlyOwner 
    {
        //_mint is a function built in ERC20
        _mint(to, amount);
        totalMinted += amount;
        emit MintEvent(to,amount,balanceOf(to));
    }
    event MintEvent(address indexed to, uint256 amount, uint256 currentBal);

    // burn ( owner)
    function Burn(address from, uint256 amount) external onlyOwner 
    {
        //also burn is built in
        require(balanceOf(from) >= amount, "Insufficient, not enough money.");
        _burn(from, amount);
        _lastSpend[from] = block.timestamp; 
        emit BurnEvent(from, amount, balanceOf(from));
        emit LastSpendUpdate(from, block.timestamp);
    }
    event BurnEvent(address indexed from, uint256 amount,uint256 currentBal);
    event LastSpendUpdate(address indexed who, uint256 timeStamp);

    // view = it won't change any data in contract, can only read
    function getStartMintData() external view returns(uint starting_mint)
    {
        return STARTING_MINT;
    }

    function setStartMintData(uint amount) external onlyOwner
    {
        STARTING_MINT = amount;
    }

    function getDecayTime() external view returns(uint time)
    {
        return decayTime;
    }

    function setDecayTime(uint time) external onlyOwner
    {
        decayTime = time;
    }
    //these dont need set, its a tracker
    function getTotalMinted() external view returns(uint total)
    {
        return totalMinted;
    }

    function getAccountMoney(address who) external view returns(uint money)
    {
        return balanceOf(who);
    }

    function getAccountLastTrade(address who) external view returns(uint time)
    {
        return _lastSpend[who];
    }

    function decay(address user) external onlyOwner
    {
        require( balanceOf(user) > 0, "user's balance is 0.");
        uint256 bal = balanceOf(user)/10;
        _burn(user, bal);
        _lastSpend[user] = block.timestamp; 
        emit DecayEvent(user, bal);
    }
    event DecayEvent(address indexed user, uint256 amount);
}
