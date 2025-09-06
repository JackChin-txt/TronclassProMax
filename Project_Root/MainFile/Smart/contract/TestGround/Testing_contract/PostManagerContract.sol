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
    uint256 private nextID = 1;
    mapping(string => uint256) private CIDtoPostID;
    // Author = the address who posted this post
    // CID = create id = backendID for post
    // timestamp = time when this post go live

    struct Post
    {
        address Author;
        string CID;
        uint256 TimeStamp;
    }

    //a lsit of post
    mapping(uint256 => Post) private PostList;

    // Replyer = the address who reply
    // CID = create id = backendID for post
    // timestamp = time of this reply 
    struct Reply
    {
        address Replyer;
        string CID;
        uint256 TimeStamp;
        uint256 editTimes;
    }

    //tract reply's id for each post
    mapping(uint256 => uint256) private nextReplyID;
    //store reply log
    
    // JACK:postID -> replyID -> info of reply
    mapping(uint256 => mapping(uint256 => Reply)) private replies;

    //  Author: who edit this post
    //  editID: the ID of this edit
    //  timestamp: time of this edit
    struct Edit
    {
        address Author;
        uint256 editID;
        uint256 TimeStamp;
    }

    //tract the next EditID of different post
    mapping(uint256 => uint256) private nextEditID;

    //JACK: postID -> editID ->info of edit
    mapping(uint256 => mapping(uint256 => Edit)) private Edits;


    function CreatePost(string calldata CID) external
    {
        require(CIDtoPostID[CID] == 0 ,"post already exists");
        uint256 ID = nextID++;
        CIDtoPostID[CID] = ID;
        PostList[ID] = Post(msg.sender,CID, block.timestamp);
        nextReplyID[ID] = 0;
        nextEditID[ID] = 0;
        emit PostCreated(ID, msg.sender, CID);
    }
    //indexed is a topic for event, it can use for faster tracking
    //so postID and author can be used to search post
    event PostCreated(uint256 indexed postID , address indexed author , string indexed CID);

    function ReplyPost(string calldata CID, uint256 postID) external
    {
        require(postID > 0 && postID < nextID,"Post dose not exist");
        uint256 RID = nextReplyID[postID]++;
        replies[postID][RID] = Reply(msg.sender,CID,block.timestamp,0);
        emit PostReply(postID, RID, msg.sender, CID);
    }
    event PostReply(uint256 indexed postID ,uint256 indexed replyID , address indexed replier , string CID);

    function EditPost(string calldata CID) external
    {
        require(CIDtoPostID[CID] != 0, "post dost not exisit.");
        uint256 ID = CIDtoPostID[CID];
        require(msg.sender == PostList[ID].Author,"Only author can delete this post");
        uint256 editID = nextEditID[ID]++;
        Edits[ID][editID] = Edit(msg.sender, editID, block.timestamp);
        emit PostEdited(ID, msg.sender,block.timestamp);
    }
    event PostEdited(uint256 indexed postID, address indexed author, uint256 time);

    function DeletePost(string calldata CID) external
    {
        require(CIDtoPostID[CID] != 0 && msg.sender == PostList[CIDtoPostID[CID]].Author ,"Post not found / Only author can delete this post");
        uint256 ID = CIDtoPostID[CID];
        delete PostList[ID];
        for (uint256 index = 0; index < nextReplyID[ID]; index++) 
        {
            delete replies[ID][index];
        }
        delete nextReplyID[ID];
        for (uint256 index = 0; index < nextEditID[ID]; index++) 
        {
            delete Edits[ID][index];
        }
        delete nextEditID[ID];
        delete CIDtoPostID[CID];
        emit PostDeleted(ID, msg.sender,block.timestamp);
    }
    event PostDeleted(uint256 indexed postID , address indexed author,uint256 time);

    function EditReply(string calldata CID, uint256 RID ) external
    {
        require(CIDtoPostID[CID] != 0, "post not found / post have been deleted.");
        uint256 postID = CIDtoPostID[CID];
        require(msg.sender == replies[postID][RID].Replyer && RID < nextReplyID[postID], "only the author of this reply can edit.");
        replies[postID][RID].editTimes++;
        emit ReplyEdited(postID, RID, msg.sender);
    }
    event ReplyEdited(uint256 indexed postID, uint256 indexed RID, address indexed author);

    function DeleteReply(string calldata CID, uint256 RID)external 
    {

        require(CIDtoPostID[CID] != 0 ,"post not found / post have been deleted.");
        uint256 postID = CIDtoPostID[CID];
        require(RID < nextReplyID[postID] && replies[postID][RID].TimeStamp != 0 && replies[postID][RID].Replyer == msg.sender,"reply does not exisit.");
        delete replies[postID][RID];
        emit ReplyDeleted(postID, RID, msg.sender);
    }
    event ReplyDeleted(uint256 indexed postID, uint256 indexed RID, address indexed author);
    // getter & setter
    function getNextID() external view returns(uint256 ID)
    {
        return nextID;
    }//回傳下篇貼文的ID

    function getCIDtoPostID(string calldata CID) external view returns(uint256 returnID)
    {
        require(CIDtoPostID[CID] != 0, "post not found / post have been deleted.");
        return CIDtoPostID[CID];
    }//轉換CID成PostID 輸入鍊下ID取的鍊上ID

    function getPostInfo(uint256 postID)external view returns(address author, string memory CID, uint256 time)
    {
        require(PostList[postID].TimeStamp != 0 ,"post not found / post have been deleted.");
        return (PostList[postID].Author, PostList[postID].CID ,PostList[postID].TimeStamp);
    }//取得post的內容 會回傳一個address  一個string  一個uint265分別是post author、CID、時間戳

    function getNextReplyID(uint256 postID)external view returns(uint256 ID)
    {
        require(PostList[postID].TimeStamp != 0 ,"post not found / post have been deleted.");
        return nextReplyID[postID];
    }//還傳某貼文下個reply的ID是多少

    function getRepliesInfo(uint256 postID, uint256 replyID) external view returns(address Replyer, string memory CID,uint256 TimeStamp)
    {
        require(PostList[postID].TimeStamp != 0 ,"post not found / post have been deleted.");
        return(replies[postID][replyID].Replyer, replies[postID][replyID].CID, replies[postID][replyID].TimeStamp);
    }//取得reply的內容 會還傳一個address string uint256, 分別是reply author , CID , 時間戳

    function getEditID(uint256 postID)external view returns(uint256 editID)
    {
        require(PostList[postID].TimeStamp != 0 ,"post not found / post have been deleted.");
        return nextEditID[postID];
    }//得到某貼文下個edit的ID

    function getEditInfo(uint256 postID, uint256 ID) external view returns(address Author, uint256 editID,uint256 TimeStamp)
    {
        require(PostList[postID].TimeStamp != 0 ,"post not found / post have been deleted.");
        return (Edits[postID][ID].Author, Edits[postID][ID].editID, Edits[postID][ID].TimeStamp);
    }//得到某個post的edit資訊

    function postExists(string calldata CID) external view returns(bool exit)
    {
        if( CIDtoPostID[CID] != 0)
            return true;
        else
            return false;
    }//輸入鍊下ID 回傳貼文是否存在
}