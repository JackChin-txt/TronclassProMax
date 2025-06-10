// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
/*
Developer note
interface
    Must know while using:
        it is a tool to call other contract's funtion
        it need two contract to work, one for main、one for deploy
        while deploying contract, deploy the one that interface connected to first, then the one that have interface(cuz u need the address of the contract)
    Coding thing:
        the second contract need to get the address of the contract that is connected with
        

*/

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
    IWalletContract public walletCt;               // send WalletContract in after deploy, like calling a class's instance
    IPostManager   public postMgr;                  // send PostManager in after deploy, like calling a class's instance
    mapping(uint256=>bool)   public rewarded;       // postId  -> have reward been given?
    mapping(uint256=>uint256) public bestReply;     // postId  -> replyId
    //maybe we have to change this two thing, we may have mulitple answer that is good

    
    constructor(address _wallet, address _postMgr)
    Ownable(msg.sender) 
    {
        walletCt   = IWalletContract(_wallet);
        postMgr = IPostManager(_postMgr);
    }

    function BestAns(uint256 postID,uint256 amount , address winner) external onlyOwner
    {
        require(!rewarded[postID], "Already claimed reward");
        walletCt.Mint(winner,amount);
        uint256 replyID = postMgr.getReply(postID, winner);
        rewarded[postID] = true;
        bestReply[postID] = replyID;
    }
    event BestAnsSelected(uint256 indexed postID, uint256 indexed replyID, address indexed winner, uint256 amount);

    function getRewardInfo(uint256 postID) external view returns(bool result)
    {
        return rewarded[postID];
    }

    function getGestReplyID(uint256 postID) external view returns(uint256 replyID)
    {
        return bestReply[postID];
    }
}

contract MyWallet
{
    function mintDeploy(address _wallet, address to, uint256 amount) external
    {
        IWalletContract(_wallet).Mint(to, amount);
    }
}

contract MyPostMgr
{
    function getReplyID_Deploy(address _postMgr)external
    {
        
    }

}