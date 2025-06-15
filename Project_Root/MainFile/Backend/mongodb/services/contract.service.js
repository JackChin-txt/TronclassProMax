// services/contract.service.js
const { ethers } = require('ethers');

/**
 * 驗證錢包是否為簽署者本人
 * @param {string} message - 原始訊息
 * @param {string} signature - 使用者的簽章
 * @param {string} expectedWallet - 預期的 wallet address
 * @returns {boolean}
 */
function verifySignature(message, signature, expectedWallet) {
  try {
    const signerAddress = ethers.utils.verifyMessage(message, signature);
    return signerAddress.toLowerCase() === expectedWallet.toLowerCase();
  } catch (err) {
    console.error('Signature verification error:', err.message);
    return false;
  }
}

module.exports = { verifySignature };
