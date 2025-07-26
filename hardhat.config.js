console.log(" ▶ hardhat.config.js loaded, tests path is:", __dirname + "/" + (module.exports.paths?.tests||""));
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  paths: {
    sources: "./Project_Root/MainFile/Smart/contract/TestGround/Testing_contract",
    tests: "./Project_Root/MainFile/Smart/contract/TestGround/Deploy"
  }
};
