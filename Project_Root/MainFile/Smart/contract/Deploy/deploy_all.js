// scripts/deploy_all.js
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

// 你要輸出的前端設定位置（會自動建立資料夾）
const OUT_DIR = path.join(__dirname, "..", "..", ".." ,"Frontend", "js", "chain");
const ABI_DIR = path.join(OUT_DIR, "ABI");
const ADDR_FP = path.join(OUT_DIR, "addresses.json");

// 依需要調整
const TOKEN_NAME = "QnaToken";
const TOKEN_SYMBOL = "QNA";
const DEMO_MINT = "1000"; // 會依 decimals 轉成最小單位

// ---- 使用完整限定名 (FQN) 避免 HH701：合約重名 ----
const FQN_WALLET  = "Project_Root/MainFile/Smart/contract/Contract/wallet_contract_test.sol:wallet_contract_test";
const FQN_POSTMGR = "Project_Root/MainFile/Smart/contract/Contract/PostManagerContract.sol:PostManager";
const FQN_QNA     = "Project_Root/MainFile/Smart/contract/Contract/QnAManager.sol:QnAManager";

async function writeABI(fqn, saveAs) {
  const artifact = await hre.artifacts.readArtifact(fqn);
  fs.mkdirSync(ABI_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(ABI_DIR, `${saveAs}.json`),
    JSON.stringify(artifact.abi, null, 2)
  );
}

function writeAddresses(obj) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(ADDR_FP, JSON.stringify(obj, null, 2));
  console.log("📦 wrote addresses ->", ADDR_FP);
}

async function main() {
  const { ethers } = hre;
  const [deployer, demoUser] = await ethers.getSigners();

  console.log("\n  Deployer:", deployer.address);
  console.log("\n  Network :", hre.network.name);

  // 1) wallet_contract_test（自動判斷 constructor 是否需要 name/symbol）
  const Wallet = await ethers.getContractFactory(FQN_WALLET);
  const walletArtifact = await hre.artifacts.readArtifact(FQN_WALLET);
  const ctorInputs = (walletArtifact.abi.find(x => x.type === "constructor")?.inputs || []).length;

  let wallet;
  if (ctorInputs === 0) {
    wallet = await Wallet.deploy();
  } else if (ctorInputs === 2) {
    wallet = await Wallet.deploy(TOKEN_NAME, TOKEN_SYMBOL);
  } else {
    throw new Error(`wallet_contract_test unexpected constructor args length: ${ctorInputs}`);
  }
  await wallet.waitForDeployment();
  const walletAddr = await wallet.getAddress();
  console.log("✅ wallet_contract_test:", walletAddr);

  // 2) PostManager
  const PostManager = await ethers.getContractFactory(FQN_POSTMGR);
  const postMgr = await PostManager.deploy();
  await postMgr.waitForDeployment();
  const postMgrAddr = await postMgr.getAddress();
  console.log("✅ PostManager        :", postMgrAddr);

  // 3) QnAManager（constructor 需要 wallet + postMgr）
  const QnAManager = await ethers.getContractFactory(FQN_QNA);
  const qna = await QnAManager.deploy(walletAddr, postMgrAddr);
  await qna.waitForDeployment();
  const qnaAddr = await qna.getAddress();
  console.log("✅ QnAManager         :", qnaAddr);

  // 4) 先 mint 再轉 owner（Mint/Burn 只有 owner 可呼叫）
  const decimals = await wallet.decimals();
  const mintAmt = ethers.parseUnits(DEMO_MINT, decimals);
  await (await wallet.Mint(demoUser.address, mintAmt)).wait();
  await (await wallet.transferOwnership(qnaAddr)).wait();
  console.log("🔑 wallet owner -> QnAManager 完成");

  // 6) 輸出 ABI 與地址（前端直接讀）
  await writeABI(FQN_WALLET,  "wallet_contract_test");
  await writeABI(FQN_POSTMGR, "PostManager");
  await writeABI(FQN_QNA,     "QnAManager");

  writeAddresses({
    network: hre.network.name,
    wallet_contract_test: walletAddr,
    PostManager: postMgrAddr,
    QnAManager: qnaAddr,
  });

  // 7) 健康檢查
  const dec = await wallet.decimals();
  const sym = await wallet.symbol();
  const raw = await wallet.getAccountMoney(demoUser.address);
  const display = ethers.formatUnits(raw, dec);
  console.log("🩺 symbol            :", sym);
  console.log("🩺 demoUser balance  :", display);

  console.log("🎉 All contracts deployed & wired. Ready for frontend.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
