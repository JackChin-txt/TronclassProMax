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
    function getPostInfo(uint256 postID)external view returns (address author, string memory CID, uint256 time);

    function getRepliesInfo(uint256 postID, uint256 replyID)external view returns (address Replyer, string memory CID, uint256 TimeStamp);
}


contract QnAManager is Ownable
{
    IWalletContract public walletCt;                            // send WalletContract in after deploy, like calling a class's instance
    IPostManager   public postMgr;                              // send PostManager in after deploy, like calling a class's instance
    //mapping(uint256 => bool)   public rewarded;                 // postId  -> have reward been given?
    mapping(uint256 => mapping(uint256 => bool)) public awarded;// postId  -> replyID -> who have been rewarded (for multi best ans)
    mapping(uint256 => uint256[]) private bestReply;            // postId  -> replys info
    
    //maybe we have to change this two thing, we may have mulitple answer that is good
    constructor(address _wallet, address _postMgr)
    Ownable(msg.sender) 
    {
        require(_wallet != address(0) && _postMgr != address(0), "zero addr");
        walletCt   = IWalletContract(_wallet);
        postMgr = IPostManager(_postMgr);
    }

    //a outer setting function for admin
    function setWallet(address _wallet) external onlyOwner 
    {
        require(_wallet != address(0), "zero addr");
        address old = address(walletCt);
        walletCt = IWalletContract(_wallet);
        emit WalletUpdated(old, _wallet);
    }
    event WalletUpdated(address indexed oldWallet, address indexed newWallet);

    //a outer setting function for admin
    function setPostMgr(address _postMgr) external onlyOwner 
    {
        require(_postMgr != address(0), "zero addr");
        address old = address(postMgr);
        postMgr = IPostManager(_postMgr);
        emit PostMgrUpdated(old, _postMgr);
    }
    event PostMgrUpdated(address indexed oldPostMgr, address indexed newPostMgr);

    //call this when selected best answer
    //note: if multiple replies have been chosen, then this function need to be call mulutple times
    //mint amount need to be calculated before calling this function
    function awardReply(uint256 postID, uint256 replyID, uint256 amount) external 
    {
        // author & time
        (address author,,) = postMgr.getPostInfo(postID);
        require(author != address(0), "post not exist");
        require(msg.sender == author, "not post author");
        // TimeStamp != 0 => this post is there
        (address replier,, uint256 ts) = postMgr.getRepliesInfo(postID, replyID);
        require(ts != 0, "reply not exist");
        // basic requie
        require(amount > 0, "amount=0");
        require(!awarded[postID][replyID], "already awarded");
        // mint（note：Wallet must transfer owner to this contract, or use AccessControl to authorize）
        walletCt.Mint(replier, amount);
        awarded[postID][replyID] = true;
        bestReply[postID].push(replyID);
        emit Awarded(postID, replyID, replier, amount);
    }
    event Awarded(uint256 indexed postID, uint256 indexed replyID, address indexed replier, uint256 amount);

    function isAwarded(uint256 postID, uint256 replyID) external view returns (bool) 
    {
        return awarded[postID][replyID];
    }

    function getbestReplyID(uint256 postID) external view returns(uint256[] memory replyID)
    {
        return bestReply[postID];
    }

    function bestReplyCount(uint256 postID) external view returns (uint256) 
    {
        return bestReply[postID].length;    
    }
}

contract MyWallet 
{
    function mintVia(address _wallet, address to, uint256 amount) external 
    {
        IWalletContract(_wallet).Mint(to, amount);
    }
}

contract MyPostMgr {
    function getReplyInfo(address _postMgr, uint256 postID, uint256 replyID) external view returns (address, string memory, uint256)
    {
        return IPostManager(_postMgr).getRepliesInfo(postID, replyID);
    }

    function getPostInfoProxy(address _postMgr, uint256 postID) external view returns (address, string memory, uint256)
    {
        return IPostManager(_postMgr).getPostInfo(postID);
    }
}