import { initPost } from "../module/post.js";


async function loadAddresses(path = "./js/chain/addresses.json") 
{
    const res = await fetch(path);
    if (!res.ok) 
        throw new Error(`addresses.json 載入失敗: ${path}`);
    return res.json();
}

async function postJSON(url, data) 
{
    const r = await fetch(url, 
    {
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

/**
 * 發文流程
 * 1) 後端封存 -> 回 CID
 * 2) 上鏈 CreatePost(CID)
 * 3) 完成後 console.groupCollapsed 印出鏈上資訊供驗證
 */
export async function createPostFlow({
    provider, signer,
    postPayload,                    // 送後端封存的物件
    addressesPath = "./js/chain/addresses.json",
    apiBase = "/api",
    verbose = true,                 // 設 false 可關閉 console 驗證輸出
}) 
{
    if (!postPayload) 
        throw new Error("createPostFlow: postPayload 不可為空");
    // 1) 後端封存 -> CID
    const { cid } = await postJSON(`${apiBase}/posts`, postPayload);
    if (!cid) 
        throw new Error("後端未回 CID");
    // 2) 上鏈
    const addrs = await loadAddresses(addressesPath);
    const post  = await initPost({ provider, signer, address: addrs.PostManager }); // uses CreatePost / getPostInfo  :contentReference[oaicite:1]{index=1}
    const { tx, receipt, postID, author } = await post.createPost(cid);

    // 3) 查鏈上資訊 & 驗證輸出
    let info = null;
    try 
    { 
        if (postID) 
            info = await post.getPostInfo(postID); 
    } catch (_) {}
    if (verbose) 
    {
        console.groupCollapsed(" CreatePost 完成（點我展開）");
        console.log("CID       :", cid);
        console.log("tx hash   :", tx);
        console.log("block     :", receipt?.blockNumber);
        console.log("postID    :", postID?.toString?.());
        console.log("author    :", author || info?.Author);
        console.log("postInfo  :", info); // { Author, CID, TimeStamp }  :contentReference[oaicite:2]{index=2}
        console.groupEnd();
    }
    return { tx, postID, author, info };
}

/**
 * 回文流程
 * 1) 後端封存 -> 回 CID（就算後端也回 replyID，這裡不上鏈前不依賴）
 * 2) 上鏈 ReplyPost(CID)
 * 3) 完成後 console.groupCollapsed 印出鏈上資訊供驗證
 */
export async function replyPostFlow({
    provider, signer,
    replyPayload,                   // 送後端封存的物件
    addressesPath = "./js/chain/addresses.json",
    apiBase = "/api",
    verbose = true,
}) 
{
    if (!replyPayload) 
        throw new Error("replyPostFlow: replyPayload 不可為空");

    // 1) 後端封存 -> CID
    const { cid } = await postJSON(`${apiBase}/replies`, replyPayload);
    if (!cid) 
        throw new Error("後端未回 CID");

    // 2) 上鏈
    const addrs = await loadAddresses(addressesPath);
    const post  = await initPost({ provider, signer, address: addrs.PostManager }); // uses ReplyPost / getRepliesInfo  :contentReference[oaicite:3]{index=3}
    const { tx, receipt, postID, replyID, replier } = await post.replyPost(cid);

    // 3) 查鏈上資訊 & 驗證輸出
    let replyInfo = null;
    try 
    { 
        if (postID && replyID) 
            replyInfo = await post.getRepliesInfo(postID, replyID); 
    } catch (_) {}
    if (verbose) 
    {
        console.groupCollapsed("✅ ReplyPost 完成（點我展開）");
        console.log("CID        :", cid);
        console.log("tx hash    :", tx);
        console.log("block      :", receipt?.blockNumber);
        console.log("postID     :", postID?.toString?.());
        console.log("replyID    :", replyID?.toString?.());
        console.log("replier    :", replier || replyInfo?.Replyer);
        console.log("replyInfo  :", replyInfo); // { Replyer, CID, TimeStamp }  :contentReference[oaicite:4]{index=4}
        console.groupEnd();
    }

    return { tx, postID, replyID, replier, replyInfo };
}
