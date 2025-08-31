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
    function decay(address user) external;
    function getAccountMoney(address who) external view returns (uint256);
    function getAccountLastTrade(address who) external view returns (uint256);
    function getDecayTime() external view returns (uint256);
}


interface IPostManager 
{
    function getPostInfo(uint256 postID)external view returns (address author, string memory CID, uint256 time);

    function getRepliesInfo(uint256 postID, uint256 replyID)external view returns (address Replyer, string memory CID, uint256 TimeStamp);
}


contract QnAManager is Ownable
{
    IWalletContract public walletCt;                                // send WalletContract in after deploy, like calling a class's instance
    IPostManager    public postMgr;                                 // send PostManager in after deploy, like calling a class's instance
    //mapping(uint256 => bool)   public rewarded;                   // postId  -> have reward been given?
    mapping(uint256 => mapping(uint256 => bool)) public awarded;    // postId  -> replyID -> who have been rewarded (for multi best ans)
    mapping(uint256 => uint256[]) private bestReply;                // postId  -> best reply number list
    
    constructor(address _wallet, address _postMgr)
    Ownable(msg.sender) 
    {
        require(_wallet != address(0) && _postMgr != address(0), "zero addr");
        walletCt   = IWalletContract(_wallet);
        postMgr = IPostManager(_postMgr);
    }
    
    //=========================
    //decay
    //=========================

    function needsDecay(address user) public view returns (bool) 
    {
        uint256 last = walletCt.getAccountLastTrade(user);
        uint256 window = walletCt.getDecayTime();
        return (last != 0 && block.timestamp >= last + window);
    }

    function decayUser(address user) external onlyOwner 
    {
        if (needsDecay(user)) 
        {
            walletCt.decay(user);
            emit DecayTriggered(user, block.timestamp);
        }
    }
    event DecayTriggered(address indexed user,uint256 timestamp);
    //=========================
    //shop
    //=========================

    struct Item
    {
        uint256 price;
        bool avaliable;
    }

    mapping (uint256 => Item) public ItemList;

    function redeemAttempt(uint256 itemID, uint256 amount) external
    {
        require( ItemList[itemID].avaliable, "item is not avaliable.");
        require( ItemList[itemID].price != 0,"item error, please contact admin.");
        require( amount > 0 ,"request amount must be greater than 0.");
        uint256 cost = ItemList[itemID].price * amount;
        require( walletCt.getAccountMoney(msg.sender) >= cost ," user don't have enough money ");
        walletCt.Burn(msg.sender, cost);
        emit ItemRedeemed(msg.sender, itemID, amount, cost);
    }
    event ItemRedeemed(address indexed user, uint256 indexed itemID, uint256 amount, uint256 cost);

    function ItemListUpdate(uint256 itemID, uint256 Iprice, bool Iavaliable) external onlyOwner
    {
        ItemList[itemID].price = Iprice;
        ItemList[itemID].avaliable = Iavaliable;
        emit ItemListUpdated(itemID,Iprice,Iavaliable);
    }
    event ItemListUpdated(uint256 indexed itemID, uint256 Iprice, bool Iavaliable);

    //=========================
    //QnAManaget main
    //=========================

    modifier onlyPostAuthor(uint256 postID) 
    {
        (address author,,) = postMgr.getPostInfo(postID);
        require(author != address(0), "post not exist");
        require(msg.sender == author, "not post author");
        _;
    }

    function awardReply(uint256 postID, uint256 replyID, uint256 amount) external onlyPostAuthor(postID)
    {
        (address replier,, uint256 ts) = postMgr.getRepliesInfo(postID, replyID);
        require(ts != 0, "reply not exist");
        require(amount > 0, "amount=0");
        require(!awarded[postID][replyID], "already awarded");
        walletCt.Mint(replier, amount);
        awarded[postID][replyID] = true;
        if (!_contains(bestReply[postID], replyID)) 
        {
            bestReply[postID].push(replyID);
        }
        emit Awarded(postID, replyID, replier, amount);
        }
    event Awarded(uint256 indexed postID, uint256 indexed replyID, address indexed replier, uint256 amount);

    function removeBestReply(uint256 postID, uint256 replyID) external onlyPostAuthor(postID) 
    {
        uint256[] storage arr = bestReply[postID];
        for (uint256 i = 0; i < arr.length; )
        {
            if (arr[i] == replyID) 
            {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                emit BestReplyRemoved(postID, replyID);
                return;
            }
            unchecked { ++i; }
        }
        revert("reply not in best list");
    }
    event BestReplyRemoved(uint256 indexed postID, uint256 indexed replyID);

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
    

    function isAwarded(uint256 postID, uint256 replyID) external view returns (bool) 
    {
        return awarded[postID][replyID];
    }

    
    //=========================
    //getter / setter
    //=========================
    

    function getbestReplyID(uint256 postID) external view returns(uint256[] memory replyID)
    {
        return bestReply[postID];
    }

    function getBestReplyAt(uint256 postID, uint256 idx) external view returns (uint256) 
    {
        require(idx < bestReply[postID].length, "index out of bounds");
        return bestReply[postID][idx];
    }

    function bestReplyCount(uint256 postID) external view returns (uint256) 
    {
        return bestReply[postID].length;    
    }

    function getBestReplyRange(uint256 postID, uint256 offset, uint256 limit)external view returns (uint256[] memory)
    {
        uint256[] storage arr = bestReply[postID];
        uint256 n = arr.length;

        uint256 end = offset + limit;
        if (end > n || end < offset) end = n;
        uint256 len = offset < n ? end - offset : 0;

        uint256[] memory slice = new uint256[](len);
        for (uint256 i = 0; i < len; ) 
        {
            slice[i] = arr[offset + i];
            unchecked { ++i; }
        }
        return slice;
    }

    function _contains(uint256[] storage arr, uint256 v) internal view returns (bool) {
        for (uint256 i = 0; i < arr.length; ) {
            if (arr[i] == v) return true;
            unchecked { ++i; }
        }
        return false;
    }
}
