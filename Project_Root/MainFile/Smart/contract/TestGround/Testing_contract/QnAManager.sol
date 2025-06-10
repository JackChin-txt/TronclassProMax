// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import "@openzeppelin/contracts/access/Ownable.sol";

interface IWalletContract 
{
    function Mint(address to, uint256 amount) external;
    function Burn(address from, uint256 amount) external;
}

interface IPostManager 
{
    function posts(uint256 postId) external view returns (
        address author,
        string memory cid,
        uint256 timestamp
    );
    function getReply(uint256 postId, uint256 replyId) external view returns (
        uint256 id,
        string memory cid,
        address replier,
        uint256 timestamp
    );
}


contract QnAManager is Ownable
{
    IWalletContract public token;               // send WalletContract in after deploy
    IPostManager   public postMgr;              // send PostManager in after deploy
    mapping(uint256=>bool)   public rewarded;   // postId  -> have reward been given?
    mapping(uint256=>uint256) public bestReply; // postId  -> replyId
    event BestAnsSeleted(uint256 postID, uint256 replyID, address winner, uint256 amount);

    constructor(address _wallet, address _postMgr)
    Ownable(msg.sender) 
    {
        token   = IWalletContract(_wallet);
        postMgr = IPostManager(_postMgr);
    }

    function BestAns(uint256 amount , address winnner) external onlyOwner
    {

    }

    function getRewardInfo(uint256 postID) external view returns(bool result)
    {
        return rewarded[postID];
    }
}