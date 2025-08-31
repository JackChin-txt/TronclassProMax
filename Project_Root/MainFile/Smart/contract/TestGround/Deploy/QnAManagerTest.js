// QnAManagerTest.js
// ------------------------------------------------------------
// Notes (EN):
// 1) We assert OZ v5 Ownable custom error:
//    .to.be.revertedWithCustomError(qna, "OwnableUnauthorizedAccount")
// 2) needsDecay uses on-chain last + decayTime and checks both sides
// ------------------------------------------------------------

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("QnAManager", function () 
{ 
    let owner, alice, bob, charlie;
    let Wallet, wallet;
    let PM, pm;
    let QNA, qna;

    beforeEach(async () => 
    {
        [owner, alice, bob, charlie] = await ethers.getSigners();

        Wallet = await ethers.getContractFactory("wallet_contract_test");
        wallet = await Wallet.deploy();
        await wallet.waitForDeployment();

        PM = await ethers.getContractFactory("PostManager");
        pm = await PM.deploy();
        await pm.waitForDeployment();

        QNA = await ethers.getContractFactory("QnAManager");
        qna = await QNA.deploy(await wallet.getAddress(), await pm.getAddress());
        await qna.waitForDeployment();
    });

  // ------------------------------------------------------------
  // Constructor & admin setters
  // ------------------------------------------------------------
    describe("Constructor & admin setters", () => 
    {
        it("stores wallet & postMgr addresses and allows only owner to update", async () => 
        {
            expect(await qna.walletCt()).to.equal(await wallet.getAddress());
            expect(await qna.postMgr()).to.equal(await pm.getAddress());
            // onlyOwner: setWallet
            const Wallet2 = await ethers.getContractFactory("wallet_contract_test");
            const wallet2 = await Wallet2.deploy();
            await wallet2.waitForDeployment();
            
            await expect(qna.connect(alice).setWallet(await wallet2.getAddress()))
            .to.be.revertedWithCustomError(qna, "OwnableUnauthorizedAccount");

            await expect(qna.connect(owner).setWallet(await wallet2.getAddress()))
            .to.emit(qna, "WalletUpdated");

            // onlyOwner: setPostMgr
            const PM2 = await ethers.getContractFactory("PostManager");
            const pm2 = await PM2.deploy();
            await pm2.waitForDeployment();

            await expect(qna.connect(alice).setPostMgr(await pm2.getAddress()))
            .to.be.revertedWithCustomError(qna, "OwnableUnauthorizedAccount");

            await expect(qna.connect(owner).setPostMgr(await pm2.getAddress()))
            .to.emit(qna, "PostMgrUpdated");
        });
    });

  // ------------------------------------------------------------
  // Award & Best Reply
  // ------------------------------------------------------------
    describe("Award & Best Reply", () => 
    {
        beforeEach(async () => 
        {
            // 讓 QnA 成為 Wallet 的 owner（之後才能 Mint）
            await wallet.transferOwnership(await qna.getAddress());

            // 建立貼文與回覆
            await pm.connect(alice).CreatePost("CID-POST-1");   // postID = 1
            await pm.connect(bob).ReplyPost("CID-POST-1", 1);   // replyID = 0, replier=bob
            await pm.connect(charlie).ReplyPost("CID-POST-1", 1); // replyID = 1, replier=charlie

            // 開放商城一個商品，供後續測試使用（這裡只準備，不在此區塊使用）
            await qna.connect(owner).ItemListUpdate(1, 5, true); // itemID=1 price=5 available
        });

        it("author can award a reply (mints tokens) & record best list; non-author cannot; cannot award twice", async () => 
        {
            // Alice 是作者，只能她能 award
            await expect(qna.connect(bob).awardReply(1, 0, 100))
            .to.be.revertedWith("not post author");

            // Alice award Bob 的回覆 replyID=0, amount=100
            await expect(qna.connect(alice).awardReply(1, 0, 100))
            .to.emit(qna, "Awarded")
            .withArgs(1, 0, bob.address, 100);

            // 餘額驗證
            expect(await wallet.balanceOf(bob.address)).to.equal(100n);

            // 不可重複 award 同一筆
            await expect(qna.connect(alice).awardReply(1, 0, 100))
            .to.be.revertedWith("already awarded");

            // 再 award 第二個回覆（charlie, replyID=1）
            await expect(qna.connect(alice).awardReply(1, 1, 50))
            .to.emit(qna, "Awarded")
            .withArgs(1, 1, charlie.address, 50);

            expect(await wallet.balanceOf(charlie.address)).to.equal(50n);

            // bestReplyRange（offset/limit）檢查，兩筆依序 0,1
            const full = await qna.getBestReplyRange(1, 0, 10);
            expect(full.map(v => Number(v))).to.deep.equal([0, 1]);

            const sliced = await qna.getBestReplyRange(1, 1, 1);
            expect(sliced.map(v => Number(v))).to.deep.equal([1]);
        });
    
        it("getBestReplyRange returns [] when offset is larger than list length", async () => 
        {
            // 這個 describe 的 beforeEach 已把 wallet owner -> qna；這裡不要再 transferOwnership

            // 準備資料：作者 alice 發文，bob & charlie 回覆
            await pm.connect(alice).CreatePost("CID-RANGE");
            await pm.connect(bob).ReplyPost("CID-RANGE", 1);      // replyID = 0
            await pm.connect(charlie).ReplyPost("CID-RANGE", 1);  // replyID = 1

            // 作者 alice 經由 QnA 發獎（QnA 會 Mint，需要 QnA 已是 wallet owner）
            await qna.connect(alice).awardReply(1, 0, 5);
            await qna.connect(alice).awardReply(1, 1, 7);

            // offset 大於長度 -> 應回傳空陣列
            const out = await qna.getBestReplyRange(1, 99, 10);
            expect(out.length).to.equal(0);
        });

        it("removeBestReply works only for author; removing non-existing entry reverts", async () => 
        {
            // 先 award 兩筆
            await qna.connect(alice).awardReply(1, 0, 1);
            await qna.connect(alice).awardReply(1, 1, 1);

            // 非作者不可移除
            await expect(qna.connect(bob).removeBestReply(1, 0))
            .to.be.revertedWith("not post author");

            // 作者移除存在的
            await expect(qna.connect(alice).removeBestReply(1, 0))
            .to.emit(qna, "BestReplyRemoved")
            .withArgs(1, 0);

            const left = await qna.getBestReplyRange(1, 0, 10);
            expect(left.map(v => Number(v))).to.deep.equal([1]);

            // 再移除不存在的 -> revert
            await expect(qna.connect(alice).removeBestReply(1, 0))
            .to.be.revertedWith("reply not in best list");
        });
    });

  // ------------------------------------------------------------
  // Shop / redeemAttempt
  // ------------------------------------------------------------
    describe("Shop / redeemAttempt", () => 
    {
        beforeEach(async () => 
        {
        // 先給 Alice 一些初始代幣（在轉移 owner 之前由 deployer 鑄給 Alice）
        await wallet.connect(owner).Mint(alice.address, 1000);

        // 轉移 Wallet owner -> QnA，之後銷毀會由 QnA 觸發
        await wallet.transferOwnership(await qna.getAddress());

        // 開商品
        await qna.connect(owner).ItemListUpdate(1, 10, true); // price=10
        });

        it("redeemAttempt reverts when QnA is not the Wallet owner (wallet onlyOwner blocks)", async () => 
        {
            // 重新部署一組乾淨的合約，確保 Wallet.owner 仍是 deployer (owner)，而非 QnA
            const WalletX = await ethers.getContractFactory("wallet_contract_test");
            const walletX = await WalletX.deploy();
            await walletX.waitForDeployment();

            const QNAX = await ethers.getContractFactory("QnAManager");
            const qnaX = await QNAX.deploy(await walletX.getAddress(), await pm.getAddress());
            await qnaX.waitForDeployment();

            // Admin 在 QnA 開商品；注意這不需要 Wallet 的 owner 權限
            await qnaX.connect(owner).ItemListUpdate(99, 10, true);

            // 先給 Alice 一些錢（由 WalletX 的擁有者 owner 鑄）
            await walletX.connect(owner).Mint(alice.address, 100);

            // 這時 QnA 尚未擁有 WalletX，redeemAttempt 會在 Burn 時觸發 WalletX 的 onlyOwner 錯誤
            await expect(qnaX.connect(alice).redeemAttempt(99, 1))
            .to.be.revertedWithCustomError(walletX, "OwnableUnauthorizedAccount")
            .withArgs(await qnaX.getAddress()); // 未授權的是「QnA 合約位址」
        });



        it("redeem burns from msg.sender via QnA (owner of wallet)", async () => 
        {
          // Alice 消費 2 單位，應銷毀 20
            await expect(qna.connect(alice).redeemAttempt(1, 2))
            .to.emit(wallet, "BurnEvent") // 來自 Wallet
            .withArgs(alice.address, 20, 980); // amount=20, newBalance=980
        });

        it("redeem reverts if not available / price=0 / insufficient / amount=0", async () => 
        {
            // 關閉商品
            await qna.connect(owner).ItemListUpdate(2, 10, false);
            await expect(qna.connect(alice).redeemAttempt(2, 1))
            .to.be.revertedWith("item is not avaliable.");

            // 價格為 0
            await qna.connect(owner).ItemListUpdate(3, 0, true);
            await expect(qna.connect(alice).redeemAttempt(3, 1))
            .to.be.revertedWith("item error, please contact admin.");

            // 數量 0
            await expect(qna.connect(alice).redeemAttempt(1, 0))
            .to.be.revertedWith("request amount must be greater than 0.");

            // 餘額不足（先把 Alice 餘額幾乎花光）
            await qna.connect(owner).ItemListUpdate(4, 1000, true);
            // Alice 目前還有 980，買 2 個需要 2000
            await expect(qna.connect(alice).redeemAttempt(4, 2))
            .to.be.revertedWith(" user don't have enough money "); // 注意原訊息內有空白
        });

        it("emits ItemListUpdated when admin updates shop items", async () => 
        {
            // 新開一個商品，觀察事件
            await expect(qna.connect(owner).ItemListUpdate(10, 123, true))
            .to.emit(qna, "ItemListUpdated")
            .withArgs(10, 123, true);

            // 再關閉它
            await expect(qna.connect(owner).ItemListUpdate(10, 123, false))
            .to.emit(qna, "ItemListUpdated")
            .withArgs(10, 123, false);
        });

        it("emits ItemRedeemed AND burns the correct cost; balance decreases accordingly", async () => 
        {
            // 這個 describe 的 beforeEach 已經：
            // - Mint 1000 給 Alice
            // - wallet owner -> qna
            // - 開商品 itemID=1, price=10, available=true

            const before = await wallet.balanceOf(alice.address);
            const cost = 10n * 2n; // price * amount = 10 * 2

            // 不要先 await；把同一筆 tx 同時拿來驗證 2 個事件
            const tx = qna.connect(alice).redeemAttempt(1, 2);

            await expect(tx)
                .to.emit(qna, "ItemRedeemed")
                .withArgs(alice.address, 1, 2, Number(cost)); // 事件參數是 uint256，這裡用 Number(cost) 對齊

            await expect(tx)
                .to.emit(wallet, "BurnEvent")
                .withArgs(alice.address, Number(cost), Number(before - cost)); // (from, amount, newBalance)

            // 交易完成後再檢查餘額確實少了 cost
            await tx;
            const after = await wallet.balanceOf(alice.address);
            expect(after).to.equal(before - cost);
        });



    });

  // ------------------------------------------------------------
  // Decay flow（以鏈上 last+window 為準）
  // ------------------------------------------------------------
    describe("Decay flow", () => 
    {
        beforeEach(async () => 
        {
            // 轉移 owner -> QnA（之後由 QnA 觸發 decayUser）
            await wallet.transferOwnership(await qna.getAddress());

            // 建立貼文，且讓 Alice 透過商城進行一次花費以刷新 lastSpend
            await pm.connect(alice).CreatePost("DECAY-CID"); // 只是佔個位，不直接用
            await qna.connect(owner).ItemListUpdate(99, 1, true);

            // 先鑄給 Alice 一些錢，這步要在 owner=QnA 之前由 deployer 鑄，或用 awardReply 也可
            // 這裡示範用 awardReply（由 Alice 當作者，Bob 回覆，Alice award Bob 不會幫到 Alice）
            // 所以直接用 Wallet 原 owner 鑄給 Alice，再轉 owner -> QnA
            // 為了和上一段一致，補一次：此區塊我們改為先鑄再轉移，避免重複
    });

    it("needsDecay false then true after time passes; decayUser burns ~10%", async () => 
    {
      // 重新部署錢包與 QnA 的時間序：先鑄幣再轉 owner
        const W2 = await ethers.getContractFactory("wallet_contract_test");
        const wallet2 = await W2.deploy();
        await wallet2.waitForDeployment();

        const Q2 = await ethers.getContractFactory("QnAManager");
        const qna2 = await Q2.deploy(await wallet2.getAddress(), await pm.getAddress());
        await qna2.waitForDeployment();

        // 給 Alice 初始餘額並刷新 lastSpend（用商城扣 1）
        await wallet2.connect(owner).Mint(alice.address, 1000);
        await qna2.connect(owner).ItemListUpdate(77, 1, true);
        // 先把 owner 轉給 QnA（之後的 Burn 要由 QnA 觸發）
        await wallet2.transferOwnership(await qna2.getAddress());
        await qna2.connect(alice).redeemAttempt(77, 1); // burn 1 & update lastSpend

        const last = await wallet2.getAccountLastTrade(alice.address);
        const window = await wallet2.getDecayTime();
        expect(window).to.be.gt(0n);

        // 還沒到期：false
        expect(await qna2.needsDecay(alice.address)).to.equal(false);

        // 臨界點前 1 秒：仍 false
        await time.increaseTo(last + window - 1n);
        expect(await qna2.needsDecay(alice.address)).to.equal(false);

        // 超過臨界點：true
        await time.increaseTo(last + window + 1n);
        expect(await qna2.needsDecay(alice.address)).to.equal(true);

        const before = await wallet2.balanceOf(alice.address);
        const expectedBurn = before / 10n;

        await expect(qna2.connect(owner).decayUser(alice.address))
        .to.emit(qna2, "DecayTriggered")
        .withArgs(alice.address, anyValue); // 任意 timestamp

        const after = await wallet2.balanceOf(alice.address);
        expect(before - after).to.equal(expectedBurn);
        });

        it("decayUser is onlyOwner on QnA", async () => 
        {
        await expect(qna.connect(alice).decayUser(alice.address))
        .to.be.revertedWithCustomError(qna, "OwnableUnauthorizedAccount");
        });
    });

  // ------------------------------------------------------------
  // Getter sanity
  // ------------------------------------------------------------
    describe("Getter sanity", () => 
    {
        it("bestReply getters return consistent values", async () => 
        {
            await wallet.transferOwnership(await qna.getAddress());
            await pm.connect(alice).CreatePost("CID-G");
            await pm.connect(bob).ReplyPost("CID-G", 1);
            await pm.connect(charlie).ReplyPost("CID-G", 1);

            await qna.connect(alice).awardReply(1, 0, 10);
            await qna.connect(alice).awardReply(1, 1, 20);

            const list = await qna.getbestReplyID(1);
            expect(list.map(v => Number(v))).to.deep.equal([0, 1]);
            expect(await qna.bestReplyCount(1)).to.equal(2);
            expect(await qna.getBestReplyAt(1, 0)).to.equal(0);
            expect(await qna.getBestReplyAt(1, 1)).to.equal(1);

            const sliced = await qna.getBestReplyRange(1, 0, 1);
            expect(sliced.map(v => Number(v))).to.deep.equal([0]);
        });
    });
});
