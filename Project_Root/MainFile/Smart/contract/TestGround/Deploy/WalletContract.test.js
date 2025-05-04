const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WalletContract", function () {
  let WalletContract, walletContract, owner, addr1, addr2;

  beforeEach(async function () {
    // 獲取合約工廠和帳號
    WalletContract = await ethers.getContractFactory("WalletContract");
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署合約
    walletContract = await WalletContract.deploy();
    //await walletContract.deployed(); // this line is wrong while testing please explain what is this and why this is here
    //line 14 is not valid in ethers.js V6   by.jack
    await walletContract.waitForDeployment();
  });

  it("Should allow owner to mint tokens and emit Mint event", async function () {
    const mintAmount = 100;
    await expect(walletContract.mint(addr1.address, mintAmount))
      .to.emit(walletContract, "Mint")
      .withArgs(addr1.address, mintAmount);
    expect(await walletContract.balances(addr1.address)).to.equal(mintAmount);
  });

  it("Should prevent non-owner from minting tokens", async function () {
    const mintAmount = 100;
    await expect(
      walletContract.connect(addr1).mint(addr2.address, mintAmount)
    ).to.be.revertedWith("Only owner can call this function");
  });

  it("Should allow trading tokens and emit Trade event", async function () {
    const mintAmount = 100;
    const tradeAmount = 50;

    // Owner 先鑄造代幣給 addr1
    await walletContract.mint(addr1.address, mintAmount);

    // addr1 轉帳給 addr2
    await expect(
      walletContract.connect(addr1).trade(addr2.address, tradeAmount)
    )
      .to.emit(walletContract, "Trade")
      .withArgs(addr1.address, addr2.address, tradeAmount);

    expect(await walletContract.balances(addr1.address)).to.equal(
      mintAmount - tradeAmount
    );
    expect(await walletContract.balances(addr2.address)).to.equal(tradeAmount);
  });

  it("Should allow owner to burn tokens and emit Burn event", async function () {
    const mintAmount = 100;
    const burnAmount = 50;

    // Owner 先鑄造代幣給 addr1
    await walletContract.mint(addr1.address, mintAmount);

    // Owner 銷毀 addr1 的代幣
    await expect(walletContract.burn(addr1.address, burnAmount))
      .to.emit(walletContract, "Burn")
      .withArgs(addr1.address, burnAmount);

    expect(await walletContract.balances(addr1.address)).to.equal(
      mintAmount - burnAmount
    );
  });

  it("Should prevent trading with insufficient balance", async function () {
    const tradeAmount = 50;
    await expect(
      walletContract.connect(addr1).trade(addr2.address, tradeAmount)
    ).to.be.revertedWith("Insufficient balance");
  });

  it("Should prevent burning more than balance", async function () {
    const mintAmount = 50;
    const burnAmount = 100;

    // Owner 先鑄造代幣給 addr1
    await walletContract.mint(addr1.address, mintAmount);

    // 嘗試銷毀超過餘額的代幣
    await expect(
      walletContract.burn(addr1.address, burnAmount)
    ).to.be.revertedWith("Insufficient balance");
  });
});
