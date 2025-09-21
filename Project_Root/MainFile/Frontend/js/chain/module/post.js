/**
 * 初始化 Post 模組
 * @param {object} opts
 * @param {ethers.providers.Provider} opts.provider
 * @param {ethers.Signer} [opts.signer]
 * @param {string} opts.address
 * @param {Array|Object} [opts.abi]                 - 可傳純 abi 陣列或 {abi:[...]}
 * @param {number} [opts.expectedChainId]
 * @param {string} [opts.abiPath]                   - 預設 ./js/chain/ABI/PostManager.json
 */

export async function initPost({ provider, signer, address, abi, expectedChainId, abiPath }) 
{
    if (!provider) throw new Error("No provider provided");
    if (!address) throw new Error("No contract address provided");

    const net = await provider.getNetwork();
    if (typeof expectedChainId === "number" && net.chainId !== expectedChainId) 
    {
        throw new Error(`Wrong network: expected chainId=${expectedChainId}, got ${net.chainId}`);
    }

    // 載 ABI
    let _abi = abi;
    if (!_abi) 
    {
        const url = abiPath || "./js/chain/ABI/PostManager.json";
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
    function ensureSigner() {
        if (!signer || !contract.signer) throw new Error("No signer attached (需要簽名者)");
    }

    // 從交易回執挑出指定事件（只看這個合約的 logs）
    function pickEventFromReceipt(receipt, wanted) 
    {
        if (!receipt || !receipt.logs) 
            return null;
        for (const log of receipt.logs) 
        {
            try 
            {
                if (log.address && log.address.toLowerCase() !== address.toLowerCase()) 
                    continue;
                const parsed = contract.interface.parseLog(log);
                if (parsed && parsed.name === wanted) 
                    return parsed;
            } catch (_) { /* 不是此合約的 log，略過 */ }
            }
            return null;
    }

  // ========== Read (view) ==========
    async function getCIDtoPostID(CID) 
    {
        if (!CID) throw new Error("getCIDtoPostID: empty CID");
        return await contract.getCIDtoPostID(CID); // -> BigNumber
    }

    async function getPostInfo(postID) 
    {
        if (postID == null) throw new Error("getPostInfo: empty postID");
        const res = await contract.getPostInfo(postID);
        // (Author, CID, TimeStamp)
        const Author = res.Author || res[0];
        const CID    = res.CID    || res[1];
        const TimeStamp = res.TimeStamp || res[2];
        return { Author, CID, TimeStamp };
    }

    async function getRepliesInfo(postID, replyID) 
    {
        if (postID == null || replyID == null) throw new Error("getRepliesInfo: empty id");
        const res = await contract.getRepliesInfo(postID, replyID);
        // (Replyer, CID, TimeStamp)
        const Replyer   = res.Replyer || res[0];
        const CID       = res.CID     || res[1];
        const TimeStamp = res.TimeStamp || res[2];
        return { Replyer, CID, TimeStamp };
    }

    async function getNextID()              { return await contract.getNextID(); }                 // BigNum
    async function getNextReplyID(postID)   { if (postID==null) throw new Error("getNextReplyID: empty postID"); return await contract.getNextReplyID(postID); }
    async function postExists(CID)          { if (!CID) throw new Error("postExists: empty CID"); return await contract.postExists(CID); } // boolean

  // ========== Write  ==========
    async function createPost(CID, overrides = {}) 
    {
        ensureSigner();
        if (!CID) throw new Error("CreatePost: empty CID");
        try 
        {
            const tx = await contract.CreatePost(CID, overrides);
            const receipt = await tx.wait();
            // event PostCreated(uint256 postID, address author, string CID)
            const ev = pickEventFromReceipt(receipt, "PostCreated");
            const postID = ev ? (ev.args?.postID ?? ev.args?.[0]) : null;
            const author = ev ? (ev.args?.author ?? ev.args?.[1]) : null;
            return { tx: tx.hash, receipt, postID, author };
        } catch (e) { 
            throw new Error(normalizeErr(e)); 
        }
    }

    async function replyPost(CID, overrides = {}) 
    {
        ensureSigner();
        if (!CID) throw new Error("ReplyPost: empty CID");
        try 
        {
            const tx = await contract.ReplyPost(CID, overrides);
            const receipt = await tx.wait();
            // event PostReply(uint256 postID, uint256 replyID, address replier, string CID)
            const ev = pickEventFromReceipt(receipt, "PostReply");
            const postID  = ev ? (ev.args?.postID  ?? ev.args?.[0]) : null;
            const replyID = ev ? (ev.args?.replyID ?? ev.args?.[1]) : null;
            const replier = ev ? (ev.args?.replier ?? ev.args?.[2]) : null;
            return { tx: tx.hash, receipt, postID, replyID, replier };
        } catch (e) { 
            throw new Error(normalizeErr(e)); 
        }
    }

    // ========== Events (optional) ==========
    function onPostCreated(cb) 
    {
        const handler = (postID, author, CID, evt) => cb({ postID, author, CID, evt });
        contract.on("PostCreated", handler);
        return () => contract.off("PostCreated", handler);
    }
    function onPostReply(cb) 
    {
        const handler = (postID, replyID, replier, CID, evt) => cb({ postID, replyID, replier, CID, evt });
        contract.on("PostReply", handler);
        return () => contract.off("PostReply", handler);
    }

    return {
        // 基本
        address,
        instance: () => contract,
        network: () => net,

        // read
        getCIDtoPostID,
        getPostInfo,
        getRepliesInfo,
        getNextID,
        getNextReplyID,
        postExists,

        // write
        createPost,
        replyPost,

        // events
        onPostCreated,
        onPostReply,
    };
}
