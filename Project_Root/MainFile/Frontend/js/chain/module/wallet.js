
/**
 * 初始化 Wallet 模組（含 Mint / Burn / 基本 getters）
 * @param {object} opts
 * @param {ethers.providers.Provider} opts.provider             - 讀取用 provider（必要）
 * @param {ethers.Signer} [opts.signer]                         - 寫入交易需要 signer（管理員帳號）
 * @param {string} opts.address                                  - 合約地址
 * @param {Array|Object} [opts.abi]                             - ABI（可傳純 abi array 或 {abi:[...]} 物件）
 * @param {number} [opts.expectedChainId]                       - 可選；指定正確網路（錯鏈會丟錯）
 * @param {string} [opts.abiPath]                               - 可選；若未提供 abi，預設從 ./js/chain/ABI/wallet_contract_test.json 載
 */
export async function initWallet({ provider, signer, address, abi, expectedChainId, abiPath }) 
{
    if (!provider) throw new Error("No provider provided");
    if (!address) throw new Error("No contract address provided");

    // --- 網路檢查 ---
    const net = await provider.getNetwork();
    if (typeof expectedChainId === "number" && net.chainId !== expectedChainId) {
        throw new Error(`Wrong network: expected chainId=${expectedChainId}, got ${net.chainId}`);
    }

  // --- 載入 ABI ---
    let _abi = abi;
    if (!_abi) 
    {
        const url = abiPath || "./js/chain/ABI/wallet_contract_test.json";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`ABI fetch failed: ${url}`);
        _abi = await res.json();
        if (_abi && _abi.abi) _abi = _abi.abi;
    }

  // --- 建立合約實例 ---
    const contract = new ethers.Contract(address, _abi, signer || provider);

    // --- 錯誤訊息壓縮 ---
    function normalizeErr(e) 
    {
        return (e && (e.reason || e.error?.message || e.data?.message || e.message)) || String(e);
    }
    function ensureSigner() 
    {
        if (!signer || !contract.signer) throw new Error("No signer attached (管理員簽章者未連線)");
    }

    // --- 單位換算 ---
    let _decimalsCache = null;
    async function decimals() 
    {
        if (_decimalsCache === null) 
        {
            const d = await contract.decimals();
            _decimalsCache = ethers.BigNumber.isBigNumber(d) ? d.toNumber() : Number(d);
        }
        return _decimalsCache;
    }
    async function toUnit(x) 
    {
        const d = await decimals();
        return ethers.utils.parseUnits(String(x), d);
    }
    async function fromUnit(v) 
    {
        const d = await decimals();
        return ethers.utils.formatUnits(v, d);
    }

  // --- 讀取 ---
    async function symbol() 
    {
        return await contract.symbol();
    }
    async function balanceOf(user) 
    {
        if (!user) throw new Error("balanceOf: empty address");
        return await contract.balanceOf(user); // -> BigNumber（v5）
    }

    // --- 寫入 ---

    async function assertWalletOwnerIsSigner() 
    {
        if (!contract.owner) return;
        const owner = await contract.owner();
        const me    = signer && (await signer.getAddress());
        if (!me || owner.toLowerCase() !== me.toLowerCase()) 
        {
            throw new Error("Wallet 的 owner 是 QnAManager：請改呼叫 QnA 的 award/redeem");
        }
    }

    async function mint(to, amountHumanOrBN, overrides = {}) 
    {
        ensureSigner();
        await assertWalletOwnerIsSigner();
        try 
        {
            const amt = ethers.BigNumber.isBigNumber(amountHumanOrBN)
                ? amountHumanOrBN
                : await toUnit(amountHumanOrBN);
            const tx = await contract.Mint(to, amt, overrides);
            const receipt = await tx.wait();
            return { tx: tx.hash, receipt };
        } catch (e) {
            throw new Error(normalizeErr(e));
        }
    }

    async function burn(from, amountHumanOrBN, overrides = {}) 
    {
        ensureSigner();
        await assertWalletOwnerIsSigner();
            try {
            const amt = ethers.BigNumber.isBigNumber(amountHumanOrBN)
                ? amountHumanOrBN
                : await toUnit(amountHumanOrBN);
            const tx = await contract.Burn(from, amt, overrides);
            const receipt = await tx.wait();
            return { tx: tx.hash, receipt };
        } catch (e) {
            throw new Error(normalizeErr(e));
        }
    }

  // --- 事件（若將來要即時 UI 可解開） ---
  // function onMint(cb) {
  //   const handler = (to, amount, currentBal, evt) => cb({ to, amount, currentBal, evt });
  //   contract.on("MintEvent", handler);
  //   return () => contract.off("MintEvent", handler);
  // }
  // function onBurn(cb) {
  //   const handler = (from, amount, currentBal, evt) => cb({ from, amount, currentBal, evt });
  //   contract.on("BurnEvent", handler);
  //   return () => contract.off("BurnEvent", handler);
  // }

    return {
    // 基本
    address,
    instance: () => contract,
    network: () => net,

    // 工具
    decimals,
    toUnit,
    fromUnit,

    // 讀取
    symbol,
    balanceOf,

    // 管理員操作
    mint,
    burn,

    // 事件（需要再開）
    // onMint,
    // onBurn,
  };
}
