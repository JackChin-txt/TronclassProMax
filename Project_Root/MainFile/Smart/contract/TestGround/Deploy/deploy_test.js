const hre = require("hardhat");

async function main() {
  const Forum = await hre.ethers.getContractFactory("Forum");
  const forum = await Forum.deploy(); // 部署合約
  await forum.waitForDeployment();    // ✅ 正確：等待部署完成

  console.log(`Forum deployed to: ${forum.target}`); // ✅ .target 取得地址（新版 Hardhat 用法）
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
