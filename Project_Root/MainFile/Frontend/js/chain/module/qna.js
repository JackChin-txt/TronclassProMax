/**
 * 初始化 QnA 模組
 * @param {object} opts
 * @param {ethers.providers.Provider} opts.provider
 * @param {ethers.Signer} [opts.signer]
 * @param {string} opts.address
 * @param {Array|Object} [opts.abi]       - 可傳純 abi 陣列或 {abi:[...]}
 * @param {number} [opts.expectedChainId]
 * @param {string} [opts.abiPath]         - 預設 ./js/chain/ABI/QnAManager.json
 * @param {object} [opts.wallet]          - （強烈建議）已 init 的 wallet module，用於單位轉換：{ decimals(), toUnit(), fromUnit(), symbol()? }
 */

export async function initQna({ provider, signer, address, abi, expectedChainId, abiPath, wallet }) 
{
    if (!provider) throw new Error("No provider provided");
    if (!address) throw new Error("No contract address provided");

    const net = await provider.getNetwork();
    if (typeof expectedChainId === "number" && net.chainId !== expectedChainId) 
    {
        throw new Error(`Wrong network: expected chainId=${expectedChainId}, got ${net.chainId}`);
    }

    // 載 ABI（若未傳入）
    let _abi = abi;
    if (!_abi) 
    {
        const url = abiPath || "./js/chain/ABI/QnAManager.json";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`ABI fetch failed: ${url}`);
        _abi = await res.json();
        if (_abi && _abi.abi) _abi = _abi.abi; // 兼容 {abi:[...]} 或純陣列
    }

    const contract = new ethers.Contract(address, _abi, signer || provider);

    // ---- 小工具 ----
    function normalizeErr(e) 
    {
        return (e && (e.reason || e.error?.message || e.data?.message || e.message)) || String(e);
    }

    function ensureSigner() 
    {
        if (!signer || !contract.signer) throw new Error("No signer attached (需要簽名者)");
    }

    function hasFn(name) 
    {
        return typeof contract[name] === "function";
    }

    // 單位轉換  優先使用 wallet module  否則嘗試用 ERC20 最小 ABI 查 decimals
    const ERC20_MIN_ABI = [
        { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" },
        { "constant": true, "inputs": [], "name": "symbol",   "outputs": [{ "name": "", "type": "string" }], "type": "function" },
    ];
    let _decimalsCache = null;
    async function tokenDecimals() 
    {
        if (_decimalsCache != null) return _decimalsCache;
        if (wallet && typeof wallet.decimals === "function") 
        {
            const d = await wallet.decimals();
            _decimalsCache = ethers.BigNumber.isBigNumber(d) ? d.toNumber() : Number(d);
            return _decimalsCache;
        }
        // 嘗試從 QnA 讀出錢包地址
        let tokenAddr = null;
        for (const cand of ["wallet", "Wallet", "token", "Token", "walletAddr", "walletAddress", "getWallet"]) 
        {
            if (hasFn(cand)) 
            {
                try 
                {
                    const v = await contract[cand]();
                    if (typeof v === "string" && v.startsWith("0x")) { tokenAddr = v; break; }
                } catch (_) {}
            }
        }
        if (!tokenAddr) 
            throw new Error("無法取得 token decimals，請於 initQna 傳入 opts.wallet 以供單位轉換");
        const erc20 = new ethers.Contract(tokenAddr, ERC20_MIN_ABI, provider);
        const d = await erc20.decimals();
        _decimalsCache = ethers.BigNumber.isBigNumber(d) ? d.toNumber() : Number(d);
        return _decimalsCache;
    }

    async function toUnit(human) 
    {
        if (ethers.BigNumber.isBigNumber(human)) 
            return human;
        const d = await tokenDecimals();
        return ethers.utils.parseUnits(String(human), d); // BigNumber（v5）
    }

    async function fromUnit(bn) 
    {
        const d = await tokenDecimals();
        return ethers.utils.formatUnits(bn, d);
    }

  // ========== Read ==========

    async function getbestReplyID(postID) 
    {
        if (postID == null) 
            throw new Error("getbestReplyID: empty postID");
        if (!hasFn("getbestReplyID")) 
            throw new Error("QnA 合約缺少 getbestReplyID");
        return await contract.getbestReplyID(postID); // -> BigNumber
    }

  // 可選的一些查詢
    async function isAwarded(postID, replyID) 
    {
        if (!hasFn("isAwarded")) 
            throw new Error("QnA 合約缺少 isAwarded");
        return await contract.isAwarded(postID, replyID);
    }

    async function bestReplyCount(postID) 
    {
        if (!hasFn("bestReplyCount")) 
            throw new Error("QnA 合約缺少 bestReplyCount");
        return await contract.bestReplyCount(postID);
    }

    async function getBestReplyRange(postID) 
    {
        if (!hasFn("getBestReplyRange")) 
            throw new Error("QnA 合約缺少 getBestReplyRange");
        const r = await contract.getBestReplyRange(postID);
        const min = r.min || r[0]; const max = r.max || r[1];
        return { min, max };
    }

    // 從交易回執挑出指定事件
    function pickEventFromReceipt(receipt, wanted) {
        if (!receipt || !receipt.logs) return null;
        for (const log of receipt.logs) 
        {
            try 
            {
                if (log.address && log.address.toLowerCase() !== address.toLowerCase()) 
                    continue;
                const parsed = contract.interface.parseLog(log);
                if (parsed && parsed.name === wanted) 
                    return parsed;
            } catch (_) { /* 不是此合約的 log略過 */ }
        }
        return null;
    }

  // ========== Write (state-changing) ==========
  // 獎勵回覆：QnA 內部會對 Wallet 執行 Mint（你部署時已把 owner 交給 QnA）
  // 參數 amountHumanOrBN 可以是人類數字（"10"）或 BigNumber（最小單位）
    async function awardReply(postID, replyID, amountHumanOrBN, overrides = {}) 
    {
        ensureSigner();
        if (postID == null || replyID == null) 
            throw new Error("awardReply: empty postID/replyID");
        if (!hasFn("awardReply")) 
            throw new Error("QnA 合約缺少 awardReply");
        try 
        {
            const amt = ethers.BigNumber.isBigNumber(amountHumanOrBN)
                ? amountHumanOrBN
                : await toUnit(amountHumanOrBN);
            const tx = await contract.awardReply(postID, replyID, amt, overrides);
            const receipt = await tx.wait();
            // 嘗試解析 Awarded/RewardIssued 類事件
            const ev = pickEventFromReceipt(receipt, "Awarded") || pickEventFromReceipt(receipt, "RewardIssued");
            const out = { tx: tx.hash, receipt, postID, replyID, amount: amt };
            if (ev) 
            {
                out.postID  = ev.args?.postID  ?? out.postID;
                out.replyID = ev.args?.replyID ?? out.replyID;
                out.to      = ev.args?.to      ?? ev.args?.solver ?? undefined;
                out.amount  = ev.args?.amount  ?? out.amount;
            }
            return out;
        } catch (e) { throw new Error(normalizeErr(e)); }
    }

  // 商店購買 / 扣點：QnA 內部會對 Wallet 執行 Burn
  // 常見簽名：redeemAttempt(uint256 itemPrice, uint256 amount)
  // - itemPriceHumanOrBN：單價（人類數字或最小單位）
  // - countHumanOrBN：數量（通常就是整數；直接丟 BigNumber.from）
    // qna.js 中，覆蓋 redeemAttempt
    async function redeemAttempt(arg1, arg2, overrides = {}) 
    {
        ensureSigner();
        if (!hasFn("redeemAttempt")) 
            throw new Error("QnA 合約缺少 redeemAttempt");
        try 
        {
            // 先把第一個參數轉成最小單位
            let totalBN = ethers.BigNumber.isBigNumber(arg1) ? arg1 : await toUnit(arg1);
            // 若有第二個參數，先相乘成總額
            if (arg2 != null) 
            {
                const countBN = ethers.BigNumber.isBigNumber(arg2)
                    ? arg2
                    : ethers.BigNumber.from(String(arg2));
                totalBN = totalBN.mul(countBN);
            }
            const tx = await contract.redeemAttempt(totalBN, overrides);
            const receipt = await tx.wait();
            const ev = pickEventFromReceipt(receipt, "Redeemed") || pickEventFromReceipt(receipt, "RedeemAttempt");
            const out = { tx: tx.hash, receipt, total: totalBN };
            if (ev) 
            {
                out.user   = ev.args?.user ?? ev.args?.from ?? undefined;
                out.amount = ev.args?.amount ?? ev.args?.burnAmount ?? out.total;
            }
            return out;
        } catch (e) 
        {
            throw new Error(normalizeErr(e));
        }
    }

  // ========== Events  ==========
    function onAwarded(cb) 
    {
        // 嘗試綁兩個候選事件名；存在的就會觸發，不存在不會報錯
        const handler1 = (postID, replyID, to, amount, evt) => cb({ postID, replyID, to, amount, evt, name: "Awarded" });
        const handler2 = (to, amount, reason, evt)          => cb({ to, amount, reason, evt, name: "RewardIssued" });
        contract.on("Awarded", handler1);
        contract.on("RewardIssued", handler2);
        return () => 
        {
            contract.off("Awarded", handler1);
            contract.off("RewardIssued", handler2);
        };
    }

    function onRedeemed(cb) 
    {
        const h1 = (user, amount, evt) => cb({ user, amount, evt, name: "Redeemed" });
        const h2 = (price, count, evt) => cb({ price, count, evt, name: "RedeemAttempt" });
        contract.on("Redeemed", h1);
        contract.on("RedeemAttempt", h2);
        return () => 
        {
            contract.off("Redeemed", h1);
            contract.off("RedeemAttempt", h2);
        };
    }

    return {
        // 基本
        address,
        instance: () => contract,
        network: () => net,

        // 工具（單位）
        toUnit,
        fromUnit,
        tokenDecimals,

        // read
        getbestReplyID,
        isAwarded,
        bestReplyCount,
        getBestReplyRange,

        // write
        awardReply,
        redeemAttempt,

        // events
        onAwarded,
        onRedeemed,
    };
}
