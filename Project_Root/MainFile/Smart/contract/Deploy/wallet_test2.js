const { expect } = require("chai");
const { ethers } = require("hardhat");
/*
this file will test if wallet contract is working ok.
from
deploy -> mint -> brun -> decay -> getset

Dev Note: 
    describe: it will break everything into little part to run, the text in"" is the info of this part
    it: this is the part u should write what the testing subject should do,and use expect to determin the output is right
    beforeEach: will run before every it, it is use to initialize everything 
*/



describe("WalletContractTest", function () {
    let Wallet, wallet, owner, addr1, addr2;

    beforeEach(async function () 
    {
        [owner, addr1, addr2, _] = await ethers.getSigners();//get signer to interact with contract
        Wallet = await ethers.getContractFactory("wallet_contract_test");
        wallet = await Wallet.deploy();//deploy
        await wallet.waitForDeployment();
    });

    describe("Deployment", function () {
        it("initial STARTING_MINT and decayTime", async function () 
        {
            // 先檢查 STARTING_MINT
            expect(await wallet.getStartMintData()).to.equal(100n);
            // decayTime 在 constructor 裡設 120 days
            // 120 days = 120 * 24 * 60 * 60 秒
            expect(await wallet.getDecayTime()).to.equal(120n * 24n * 60n * 60n);
        });
    });

    describe("Minting", function () 
    {
        it("non-owner cannot mint", async function () 
        {
            await expect(
            wallet.connect(addr1).Mint(addr1.address, 50)
            ).to.be.reverted;
        });
    });

    describe("Minting", function () 
    {
        it("owner can mint tokens and emit MintEvent", async function () 
        {
            await expect(wallet.connect(owner).Mint(addr1.address, 123))
            .to.emit(wallet, "MintEvent")
            .withArgs(addr1.address, 123, 123);

            expect(await wallet.balanceOf(addr1.address)).to.equal(123n);
            expect(await wallet.getTotalMinted()).to.equal(123n);
        });
    });

    describe("Burning", function () 
    {
        it("non-owner cannot burn", async function () 
        {
            await expect(
            wallet.connect(addr1).Burn(addr1.address, 10)
            ).to.be.reverted;
        });
    });

    describe("Burning", function () 
    {
        beforeEach(async () => 
        {
            await wallet.connect(owner).Mint(addr1.address, 100);
        });

        it("owner can burn tokens and emit BurnEvent", async function () 
        {
            await expect(wallet.connect(owner).Burn(addr1.address, 30))
            .to.emit(wallet, "BurnEvent")
            .withArgs(addr1.address, 30, 70);
            expect(await wallet.balanceOf(addr1.address)).to.equal(70n);
        });

        it("cannot burn more than balance", async function () 
        {
            await expect(
            wallet.connect(owner).Burn(addr1.address, 200)
            ).to.be.revertedWith("Insufficient, not enough money.");
        });
    });

    describe("Decay", function () 
    {
        beforeEach(async () => 
        {
            await wallet.connect(owner).Mint(addr1.address, 100);
        });

        it("owner can decay 1/10 and emit DecayEvent", async function () 
        {
            await expect(wallet.connect(owner).decay(addr1.address))
            .to.emit(wallet, "DecayEvent")
            .withArgs(addr1.address, 10);
            expect(await wallet.balanceOf(addr1.address)).to.equal(90n);
        });

        it("non-owner cannot decay", async function () 
        {
            await expect(
            wallet.connect(addr1).decay(addr1.address)
            ).to.be.reverted;
        });
    });

    describe("Parameter Getters/Setters", function () 
    {
        it("only owner can set STARTING_MINT", async function () 
        {
            await expect(
            wallet.connect(addr1).setStartMintData(300)
            ).to.be.reverted;
            // owner 正常呼叫
            await wallet.connect(owner).setStartMintData(300);
            expect(await wallet.getStartMintData()).to.equal(300n);
        });

        it("only owner can set decayTime", async function () 
        {
            await expect(
            wallet.connect(addr1).setDecayTime(1000)
            ).to.be.reverted;

            await wallet.connect(owner).setDecayTime(1000);
            expect(await wallet.getDecayTime()).to.equal(1000n);
        });
    });

    describe("View Helpers", function () 
    {
        it("getAccountMoney matches balanceOf", async function () 
        {
            await wallet.connect(owner).Mint(addr1.address, 42);
            expect(await wallet.getAccountMoney(addr1.address)).to.equal(42n);
        });
        it("getAccountLastTrade defaults to 0", async function () 
        {
            expect(await wallet.getAccountLastTrade(addr1.address)).to.equal(0n);
        });
    });
});
