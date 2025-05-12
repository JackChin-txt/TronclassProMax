// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
/*
this file will keeptract of posts' id 、 author etc.

need backend to sent postdata and its id for this to work
(all file will communicate through JavaSctipt)

Developer note
Function
    Must know while using:
        msg.sender = the address that call this function
    Coding things:
        calldata:data that need to be send form external part , read only and cost the least
        stroage:data that will be store on chain, cost the most
        memory:sth like new&free in c++, a data that will be remove afetr function call
    
Event
    Must know while using:
        Event will send a log on chain, it have 1.topic 2.data 
        Topic is a tagged veriable(indexed), min:0 , max:3
        Data is the veriable didnt got tage, min:1, max:no limit
    Coding things:
        indexed: use for veriable in "()", its for fast tracking in consol log, 

*/ 
contract PostManager
{
    uint256 public nextID = 1;

    struct Post
    {
        address Author;
        string CID;
        uint256 TimeStamp;
    }
    
    mapping(uint256 => Post) public PostList;

    struct Reply
    {
        address Replyer;
        string CID;
        uint256 TimeStamp;
    }

    //tract reply's id for each post
    mapping(uint256 => uint256) public nextReplyID;
    //store reply log
    mapping(uint256 => mapping(uint256 => Reply)) public replies;

    //calldata is a prompt for data location
    //storage(on chain) 、 memory(release after call like new & free) 、 calldata(call fome outter space , read only ,low gas cost)
    
    function CreatePost(string calldata CID) external
    {
        uint256 ID = nextID++;
        PostList[ID] = Post(msg.sender,CID, block.timestamp);
        emit PostCreated(ID, msg.sender, CID);
    }
    //indexed is a topic for event, it can use for faster tracking
    //so postID and author can be used to search post
    event PostCreated(uint256 indexed postID , address indexed author , string CID);

    function ReplyPost(string calldata CID, uint256 postID) external
    {
        require(postID > 0 && postID < nextID,"Post dose not exist");
        uint256 RID = nextReplyID[postID]++;
        replies[postID][RID] = Reply(msg.sender,CID,block.timestamp);
        emit PostReply(postID, RID, msg.sender, CID);
    }
    event PostReply(uint256 indexed postID ,uint256 indexed replyID , address indexed replier , string CID);
    //TODO
    /*
    function DeletePost(string calldata postID) external
    {

    }
    event PostDeleted(uint256 indexed postID , address indexed author , string CID);

    function EditPost(string calldata postID) external
    {
    
    }
    event PostEditted(uint256 indexed postID , address indexed author , string CID);
    
    */

    

}