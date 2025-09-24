import { initWallet } from "../module/wallet.js";
import { initQna }    from "../module/qna.js";

// ---- 小工具----
async function loadAddresses(path = "./js/chain/addresses.json") 
{
    const res = await fetch(path);
    if (!res.ok) 
        throw new Error(`addresses.json 載入失敗: ${path}`);
    return res.json();
}
async function postJSON(url, data) 
{
    const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(data ?? {}),
    });
    if (!r.ok) 
    {
        const t = await r.text().catch(()=>String(r.status));
        throw new Error(`${url} ${r.status} ${t}`);
    }
    return r.json();
}
const toBN = (x) => ethers.BigNumber.isBigNumber(x) ? x : ethers.BigNumber.from(String(x));
const nonEmpty = (v, name) => { if (v===undefined || v===null || v==="") throw new Error(`${name} 不可為空`); };

// 1) 選最佳解答 + 發獎勵（可一次多筆）
// 後端先回 "上鏈計畫"：[{ postIdOnChain, replyIdOnChain, amountHuman }]
// 然後逐筆呼叫 qna.awardReply(...)（QnA 內部會對 Wallet.Mint）

export async function awardBestFlow({
  provider, signer,
  payloadForBackend,                // 你送去後端做計畫的資料（任意物件）
  addressesPath = "./js/chain/addresses.json",
  apiBase = "/api",
  verbose = true,                   // 設 false 可關 console
}) 
{
    nonEmpty(payloadForBackend, "payloadForBackend");

    const addrs  = await loadAddresses(addressesPath);
    const wallet = await initWallet({ provider, signer, address: addrs.wallet_contract_test });
    const qna    = await initQna   ({ provider, signer, address: addrs.QnAManager, wallet });

    // 1) 後端產出上鏈計畫
    const { plan } = await postJSON(`${apiBase}/awards/plan`, payloadForBackend);
    if (!Array.isArray(plan) || plan.length === 0) 
        throw new Error("後端未回任何頒獎計劃");

    // 2) 逐筆上鏈（串行避免 nonce 競爭）
    const results = [];
    for (let i = 0; i < plan.length; i++) 
    {
        const item   = plan[i];
        const postId = toBN(item.postIdOnChain);
        const replyId= toBN(item.replyIdOnChain);
        const amt    = String(item.amountHuman); // 人類數字；qna 會用 wallet.decimals() 轉最小單位

        const r = await qna.awardReply(postId, replyId, amt); // { tx, receipt, amount(BigNumber), to? ... }
        const amountHuman = await wallet.fromUnit(r.amount);

        if (verbose) 
        {
            console.groupCollapsed(`🏆 Award ${i+1}/${plan.length} 完成（點我展開）`);
            console.log("postID    :", postId.toString());
            console.log("replyID   :", replyId.toString());
            console.log("tx hash   :", r.tx);
            console.log("block     :", r.receipt?.blockNumber);
            console.log("to        :", r.to);
            console.log("amount    :", `${amountHuman} ${await wallet.symbol?.()?.catch?.(()=> "") || ""}`);
            console.groupEnd();
        }
        results.push({ tx: r.tx, postId, replyId, amountHuman });
    }
    return { results };
}

// 2) 兌換商品（扣點 Burn）
// 後端回「總金額 totalHuman」或舊格式「priceHuman + count」 → qna.redeemAttempt(...)

export async function redeemFlow({
  provider, signer,
  payloadForBackend,               // 你送去後端檢核/計價的資料
  addressesPath = "./js/chain/addresses.json",
  apiBase = "/api",
  verbose = true,
}) 
{
    nonEmpty(payloadForBackend, "payloadForBackend");

    const addrs  = await loadAddresses(addressesPath);
    const wallet = await initWallet({ provider, signer, address: addrs.wallet_contract_test });
    const qna    = await initQna   ({ provider, signer, address: addrs.QnAManager, wallet });

    // 1) 後端檢核 & 計價
    //   新版：{ totalHuman, orderDraftId }
    //   舊版：{ priceHuman, count, orderDraftId }
    const plan = await postJSON(`${apiBase}/redeem/plan`, payloadForBackend);

    // 2) 上鏈扣點（QnA 內部會對 Wallet.Burn）
    let txRes;
    if (plan.totalHuman != null) 
    {
        txRes = await qna.redeemAttempt(plan.totalHuman);
    } 
    else 
    {
        txRes = await qna.redeemAttempt(plan.priceHuman, plan.count);
    }

    // 3) 驗證輸出（可讀金額）
    if (verbose) 
    {
        const human = plan.totalHuman != null ? String(plan.totalHuman) : (await wallet.fromUnit((await wallet.toUnit(plan.priceHuman)).mul(ethers.BigNumber.from(String(plan.count||1)))));
        console.groupCollapsed("🛒 Redeem 完成（點我展開）");
        console.log("total     :", human);
        console.log("tx hash   :", txRes.tx);
        console.log("block     :", txRes.receipt?.blockNumber);
        console.groupEnd();
    }
    return { tx: txRes.tx };
}
