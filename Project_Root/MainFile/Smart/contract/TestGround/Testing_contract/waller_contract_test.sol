// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReplyPoing is ERC20
{
    //ERC20(name, symbol)
    constructor() ERC20("Reply Point", "RP") 
    {//reply point = the point user get while using our app; RPP = reply point in short;  
        
    }
}