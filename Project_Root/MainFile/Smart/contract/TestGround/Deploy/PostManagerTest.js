require("@nomicfoundation/hardhat-ethers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ZeroAddress } = require("ethers");

describe("PostManager", function () 
{
    let PostManager, pm, owner, alice, bob;

    beforeEach(async function () 
    {
        [owner, alice, bob] = await ethers.getSigners();
        PostManager = await ethers.getContractFactory("PostManager");
        pm = await PostManager.deploy();
        await pm.waitForDeployment();
    });

    describe("Deployment & initial state", function () 
    {
        console.log("Ethers version:", ethers.version);
        it("nextID starts at 1", async function () 
        {
            expect(await pm.getNextID()).to.equal(1);
        });

        it("postExists returns false for any CID", async function () 
        {
            expect(await pm.postExists("QmNOPE")).to.equal(false);
        });

        it("getCIDtoPostID reverts for missing CID", async function () 
        {
            await expect(pm.getCIDtoPostID("QmNOPE"))
                .to.be.revertedWith("post not found / post have been deleted.");
        });
    });

    describe("CreatePost", function () 
    {
        it("creates a post, emits event, updates state", async function () 
        {
            await expect(pm.connect(alice).CreatePost("CID1"))
                .to.emit(pm, "PostCreated")
                .withArgs(1, alice.address, "CID1");

            expect(await pm.getNextID()).to.equal(2);
            expect(await pm.postExists("CID1")).to.equal(true);
            expect(await pm.getCIDtoPostID("CID1")).to.equal(1);

            const [author, cid, ts] = await pm.getPostInfo(1);
            expect(author).to.equal(alice.address);
            expect(cid).to.equal("CID1");
            expect(ts).to.be.a("bigint").that.is.greaterThan(0n);
        });

        it("allows multiple different CIDs", async function () 
        {
            await pm.CreatePost("CID_A");
            await pm.CreatePost("CID_B");

            expect(await pm.getCIDtoPostID("CID_A")).to.equal(1);
            expect(await pm.getCIDtoPostID("CID_B")).to.equal(2);
            expect(await pm.getNextID()).to.equal(3);
        });

        it("reverts on duplicate CID", async function () 
        {
            await pm.CreatePost("DUP");
            await expect(pm.CreatePost("DUP"))
                .to.be.revertedWith("post already exists");
        });
    });

    describe("ReplyPost", function () 
    {
        beforeEach(async function () 
        {
            await pm.CreatePost("P1");
        });

        it("replies to a post, emits event, increments nextReplyID", async function () 
        {
            await expect(pm.connect(bob).ReplyPost("P1", 1))
                .to.emit(pm, "PostReply")
                .withArgs(1, 0, bob.address, "P1");

            expect(await pm.getNextReplyID(1)).to.equal(1);

            const [replier, rcid, rts] = await pm.getRepliesInfo(1, 0);
            expect(replier).to.equal(bob.address);
            expect(rcid).to.equal("P1");
            expect(rts).to.be.a("bigint").that.is.greaterThan(0n);
        });

        it("reverts when replying to nonexistent postID", async function () 
        {
            await expect(pm.ReplyPost("P1", 0))
                .to.be.revertedWith("Post dose not exist");
            await expect(pm.ReplyPost("P1", 2))
                .to.be.revertedWith("Post dose not exist");
        });
    });

    describe("EditReply", function () 
    {
        beforeEach(async function () 
        {
            await pm.CreatePost("PX");
            await pm.connect(bob).ReplyPost("PX", 1);
        });

        it("author can edit reply and emit event", async function () 
        {
            await expect(pm.connect(bob).EditReply("PX", 0))
                .to.emit(pm, "ReplyEdited")
                .withArgs(1, 0, bob.address);
        });

        it("reverts if non-author tries to edit", async function () 
        {
            await expect(pm.connect(alice).EditReply("PX", 0))
                .to.be.revertedWith("only the author of this reply can edit.");
        });

        it("reverts for out-of-range RID", async function () 
        {
            await expect(pm.connect(bob).EditReply("PX", 1))
                .to.be.revertedWith("only the author of this reply can edit.");
        });
    });

    describe("DeleteReply", function () 
    {
        beforeEach(async function () 
        {
            await pm.CreatePost("DEL");
            await pm.connect(alice).ReplyPost("DEL", 1);
        });

        it("author can delete reply and emit ReplyDeleted", async function () 
        {
            await expect(pm.connect(alice).DeleteReply("DEL", 0))
            .to.emit(pm, "ReplyDeleted")
            .withArgs(1, 0, alice.address);
            const [replyer, cid, ts] = await pm.getRepliesInfo(1, 0);
            expect(replyer).to.equal(ZeroAddress);
            expect(cid).to.equal("");
            expect(ts).to.equal(0n);
        });

        it("reverts if non-author tries to delete", async function () 
        {
            await expect(pm.connect(bob).DeleteReply("DEL", 0))
            .to.be.revertedWith("reply does not exisit.");
        });

        it("reverts for nonexistent reply", async function () 
        {
            await expect(pm.connect(alice).DeleteReply("DEL", 1))
            .to.be.revertedWith("reply does not exisit.");
        });
    });

    describe("EditPost & getters", function () 
    {
        beforeEach(async function () 
        {
            await pm.connect(alice).CreatePost("E1");
        });

        it("author can record edit and emit PostEdited", async function () 
        {
            await expect(pm.connect(alice).EditPost("E1"))
                .to.emit(pm, "PostEdited")
                .withArgs(1, alice.address);

            expect(await pm.getEditID(1)).to.equal(1);
            const [auth, eid, ets] = await pm.getEditInfo(1, 0);
            expect(auth).to.equal(alice.address);
            expect(eid).to.equal(0);
            expect(ets).to.be.a("bigint").that.is.greaterThan(0n);
        });

        it("reverts if non-author tries to edit", async function () 
        {
            await expect(pm.connect(bob).EditPost("E1"))
                .to.be.revertedWith("Only author can delete this post");
        });

        it("reverts for nonexistent CID", async function () 
        {
            await expect(pm.connect(alice).EditPost("NO"))
                .to.be.revertedWith("post dost not exisit.");
        });
    });

    describe("DeletePost", function () 
    {
        beforeEach(async function () 
        {
            await pm.connect(alice).CreatePost("D1");
            await pm.connect(bob).ReplyPost("D1", 1);
            await pm.connect(alice).ReplyPost("D1", 1);
            await pm.connect(alice).EditPost("D1");
        });

        it("author can delete post and clear all data", async function () 
        {
            await expect(pm.connect(alice).DeletePost("D1"))
                .to.emit(pm, "PostDeleted")
                .withArgs(1, alice.address);

            expect(await pm.postExists("D1")).to.equal(false);
            await expect(pm.getCIDtoPostID("D1"))
                .to.be.revertedWith("post not found / post have been deleted.");
            await expect(pm.getPostInfo(1))
                .to.be.revertedWith("post not found / post have been deleted.");
            await expect(pm.getNextReplyID(1))
                .to.be.revertedWith("post not found / post have been deleted.");
            await expect(pm.getRepliesInfo(1, 0))
                .to.be.revertedWith("post not found / post have been deleted.");
            await expect(pm.getEditID(1))
                .to.be.revertedWith("post not found / post have been deleted.");
            await expect(pm.getEditInfo(1, 0))
                .to.be.revertedWith("post not found / post have been deleted.");
        });

        it("reverts if non-author tries to delete", async function () 
        {
            await expect(pm.connect(bob).DeletePost("D1"))
                .to.be.revertedWith("Post not found / Only author can delete this post");
        });

        it("reverts for nonexistent CID", async function () 
        {
            await expect(pm.connect(alice).DeletePost("NOPE"))
                .to.be.revertedWith("Post not found / Only author can delete this post");
        });
    });

    describe("postExists helper", function () 
    {
        it("returns true after CreatePost", async function () 
        {
            await pm.CreatePost("X");
            expect(await pm.postExists("X")).to.equal(true);
        });

        it("returns false after DeletePost", async function () 
        {
            await pm.CreatePost("Y");
            await pm.DeletePost("Y");
            expect(await pm.postExists("Y")).to.equal(false);
        });
    });

    describe("Additional Edge Cases & Getters", function () 
    {
        it("getNextID increments and is unchanged by delete", async function () 
        {
            expect(await pm.getNextID()).to.equal(1);
            await pm.CreatePost("A1");
            expect(await pm.getNextID()).to.equal(2);
            await pm.CreatePost("A2");
            expect(await pm.getNextID()).to.equal(3);
            await pm.DeletePost("A1");
            expect(await pm.getNextID()).to.equal(3);
        });

        it("getCIDtoPostID returns correct ID and reverts after delete", async function () 
        {
            await pm.CreatePost("B1");
            expect(await pm.getCIDtoPostID("B1")).to.equal(1);
            await pm.DeletePost("B1");
            await expect(pm.getCIDtoPostID("B1"))
            .to.be.revertedWith("post not found / post have been deleted.");
        });

        describe("getPostInfo boundary conditions", function () 
        {
            beforeEach(async () => { await pm.CreatePost("C1"); });
            it("reverts for ID 0 or >= nextID", async function () 
            {
                await expect(pm.getPostInfo(0))
                    .to.be.revertedWith("post not found / post have been deleted.");
                await expect(pm.getPostInfo(2))
                    .to.be.revertedWith("post not found / post have been deleted.");
            });
        });

        describe("Reply getters boundary", function () 
        {
            beforeEach(async () => { await pm.CreatePost("D1"); });

            it("inspect empty reply shape", async function () {
                const reply = await pm.getRepliesInfo(1, 0);
                console.log(">>> reply result:", reply);
                console.log(">>> reply keys:", Object.keys(reply));
                // 暫時不要寫 expect，先看印出的內容
            });
            it("initial nextReplyID is 0 and getRepliesInfo reverts for empty reply", async function () 
            {
                expect(await pm.getNextReplyID(1)).to.equal(0);
                const reply = await pm.getRepliesInfo(1, 0);
                expect(reply[0]).to.equal(ZeroAddress);
                expect(reply[1]).to.equal("");
                expect(reply[2]).to.equal(0n);
            });
            it("getNextReplyID reverts for invalid postID", async function () 
            {
                await expect(pm.getNextReplyID(0))
                    .to.be.revertedWith("post not found / post have been deleted.");
                await expect(pm.getNextReplyID(2))
                    .to.be.revertedWith("post not found / post have been deleted.");
            });
        });

        describe("Edit getters boundary", function () 
        {
            beforeEach(async () => { await pm.CreatePost("E1"); });
            it("initial editID is 0 and getEditInfo reverts for no edits", async function () 
            {
                expect(await pm.getEditID(1)).to.equal(0);
                const [author, editID, ets] = await pm.getEditInfo(1, 0);
                expect(author).to.equal(ZeroAddress);
                expect(editID).to.equal(0);
                expect(ets).to.equal(0n);
            });
            it("getEditID reverts for invalid postID", async function () 
            {
                await expect(pm.getEditID(0))
                    .to.be.revertedWith("post not found / post have been deleted.");
                await expect(pm.getEditID(2))
                    .to.be.revertedWith("post not found / post have been deleted.");
            });
        });

        describe("Delete paths getters after delete", function () 
        {
            beforeEach(async () => {
            await pm.CreatePost("F1");
            await pm.ReplyPost("F1", 1);
            await pm.EditPost("F1");
            await pm.DeletePost("F1");
            });
            it("all getters revert after deletion", async function () 
            {
            await expect(pm.getPostInfo(1))
                .to.be.revertedWith("post not found / post have been deleted.");
            await expect(pm.getNextReplyID(1))
                .to.be.revertedWith("post not found / post have been deleted.");
            await expect(pm.getRepliesInfo(1, 0))
                .to.be.revertedWith("post not found / post have been deleted.");
            await expect(pm.getEditID(1))
                .to.be.revertedWith("post not found / post have been deleted.");
            await expect(pm.getEditInfo(1, 0))
                .to.be.revertedWith("post not found / post have been deleted.");
            await expect(pm.getCIDtoPostID("F1"))
                .to.be.revertedWith("post not found / post have been deleted.");
            });
        });

        it("CreatePost with empty CID succeeds and postExists is true", async function () 
        {
            await pm.CreatePost("");
            expect(await pm.postExists("")).to.equal(true);
        });
    });

});
