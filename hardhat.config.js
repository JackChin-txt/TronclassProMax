const path = require("path");
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");  

task("deploy", "Deploy all contracts", async (_, hre) => {
  const script = path.join(__dirname, "Project_Root/MainFile/Smart/contract/Deploy/deploy_all.js");
  await hre.run("run", { script });
});

task("seed", "Seed demo data", async (_, hre) => {
  const script = path.join(__dirname, "Project_Root/MainFile/Smart/contract/Deploy/seed_demo.js");
  await hre.run("run", { script });
});


module.exports = {
  solidity: "0.8.28",
  paths: {
    sources: path.join(__dirname, "Project_Root/MainFile/Smart/contract/Contract"),
    tests: path.join(__dirname, "test"),
    //tests: "./Project_Root/MainFile/Smart/contract/Deploy",
    scripts: path.join(__dirname, "Project_Root/MainFile/Smart/contract/Deploy")
  }
};
