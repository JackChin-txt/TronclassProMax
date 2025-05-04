const hre = require("hardhat");

async function main() {
  const forumAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // 確認為剛剛部屬回傳的地址

  const Forum = await hre.ethers.getContractFactory("Forum");
  const forum = Forum.attach(forumAddress); // 不要用 await attach 不是 async

  const message = await forum.welcome();
  console.log("Message from contract:", message);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
