import { JsonRpcProvider, Wallet, Contract, Interface, parseEther, hexlify } from "ethers";
import crypto from "crypto";

const RPC     = process.env.REACT_APP_LIGHTCHAIN_RPC;
const GATEWAY = process.env.REACT_APP_LIGHTCHAIN_GATEWAY;
const RELAY   = process.env.REACT_APP_LIGHTCHAIN_RELAY;
const JOB_REG = process.env.REACT_APP_LIGHTCHAIN_JOB_REGISTRY;
const JOB_FEE = parseEther(process.env.REACT_APP_LIGHTCHAIN_JOB_FEE ?? "0.02");

const ABI = [
  "function createSession(bytes32 paramsHash, address worker, bytes encWorkerKey, bytes ephemeralPubKey, bytes initState, uint256 expiry) payable returns (uint256 sessionId)",
  "function submitJob(uint256 sessionId, bytes32 promptHash) payable returns (uint256 jobId)",
  "event SessionCreated(uint256 indexed sessionId, address indexed user, bytes32 indexed paramsHash, address worker, bytes encWorkerKey, bytes ephemeralPubKey)",
  "event JobSubmitted(uint256 indexed jobId, uint256 indexed sessionId, address worker)",
  "event JobCompleted(uint256 indexed jobId, address indexed worker, bytes32 responseHash, bytes32 ciphertextHash)",
];

function decodePubKey(s) {
  if (/^0x[0-9a-fA-F]{130}$/.test(s)) return Buffer.from(s.slice(2), "hex");
  if (/^[0-9a-fA-F]{130}$/.test(s))   return Buffer.from(s, "hex");
  const b = Buffer.from(s, "base64");
  if (b.length !== 65) throw new Error(`pubkey bad length: ${b.length}`);
  return b;
}

function ecdhWrap(sessionKey, peerPub) {
  const e = crypto.createECDH("prime256v1");
  e.generateKeys();
  const ephemPub = e.getPublicKey(null, "uncompressed");
  const shared   = e.computeSecret(peerPub);
  const nonce    = crypto.randomBytes(12);
  const c        = crypto.createCipheriv("aes-256-gcm", shared, nonce);
  const ct       = Buffer.concat([c.update(sessionKey), c.final()]);
  return Buffer.concat([ephemPub, nonce, ct, c.getAuthTag()]);
}

function aesEncrypt(key, pt) {
  const nonce = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, nonce);
  const ct = Buffer.concat([c.update(pt), c.final()]);
  return Buffer.concat([nonce, ct, c.getAuthTag()]);
}

function aesDecrypt(key, blob) {
  const nonce = blob.subarray(0, 12);
  const tag   = blob.subarray(blob.length - 16);
  const ct    = blob.subarray(12, blob.length - 16);
  const d = crypto.createDecipheriv("aes-256-gcm", key, nonce);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]);
}

class Gateway {
  constructor(wallet) {
    this.wallet = wallet;
    this.jwt = null;
  }

  async getToken() {
    if (this.jwt && this.jwt.expMs - Date.now() > 30000) return this.jwt.token;
    const ch = await fetch(
      `${GATEWAY}/api/auth/challenge?address=${this.wallet.address}`,
      { headers: { Accept: "application/json" } }
    ).then(r => r.json());
    const signature = await this.wallet.signMessage(ch.message);
    const v = await fetch(`${GATEWAY}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: ch.message, signature }),
    }).then(r => r.json());
    if (!v.token) throw new Error("Auth failed");
    this.jwt = { token: v.token, expMs: new Date(v.expiresAt).getTime() };
    return v.token;
  }

  async req(path, init = {}, auth = true) {
    const headers = { Accept: "application/json" };
    if (init.body) headers["Content-Type"] = "application/json";
    if (auth) headers.Authorization = `Bearer ${await this.getToken()}`;
    const r = await fetch(`${GATEWAY}${path}`, { ...init, headers });
    const t = await r.text();
    if (!r.ok) throw new Error(`${path} ${r.status}: ${t.slice(0, 200)}`);
    return JSON.parse(t);
  }

  listModels()          { return this.req("/api/models", {}, false); }
  selectSession(mid)    { return this.req("/api/sessions/select", { method:"POST", body: JSON.stringify({ modelId: mid }) }); }
  prepareSession(b)     { return this.req("/api/sessions/prepare", { method:"POST", body: JSON.stringify(b) }); }
  uploadBlob(base64)    { return this.req("/api/blobs", { method:"POST", body: JSON.stringify({ data: base64 }) }); }

  async waitForRelayToken(sessionId, timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const r = await fetch(`${GATEWAY}/api/sessions/${sessionId}/token`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${await this.getToken()}` }
      });
      const t = await r.text();
      if (r.status === 200) {
        const p = JSON.parse(t);
        if (p?.token) return p.token;
      }
      await new Promise(res => setTimeout(res, 1000));
    }
    throw new Error("Relay token timeout");
  }
}

function parseEvent(logs, iface, name, field) {
  for (const l of logs) {
    try {
      const p = iface.parseLog(l);
      if (p?.name === name) return p.args[field];
    } catch {}
  }
  throw new Error(`${name} event not found`);
}

export async function runInference(prompt, onLog = () => {}) {
  const provider = new JsonRpcProvider(RPC);
  const wallet   = new Wallet(process.env.REACT_APP_PRIVATE_KEY, provider);
  const gw       = new Gateway(wallet);
  const reg      = new Contract(JOB_REG, ABI, wallet);
  const iface    = new Interface(ABI);

  // 1-2. auth + model
  const { models } = await gw.listModels();
  const model = models.find(m => m.name === "llama3-8b") ?? models[0];
  if (!model) throw new Error("No models available");
  onLog("Model found: " + model.name);

  // 3. select worker
  const sel = await gw.selectSession(model.id);
  onLog("Worker assigned: " + sel.worker);

  // 4-5. session key + wrap
  const sessionKey  = crypto.randomBytes(32);
  const encWorker   = ecdhWrap(sessionKey, decodePubKey(sel.workerEncryptionKey));
  const encDisputer = ecdhWrap(sessionKey, decodePubKey(sel.disputerEncryptionKey));

  // 6. prepare
  const prep = await gw.prepareSession({
    modelId: model.id,
    encWorkerKey:   encWorker.toString("base64"),
    encDisputerKey: encDisputer.toString("base64"),
  });

  // 7. createSession on-chain
  const tx1 = await reg.createSession(
    model.id, prep.worker,
    hexlify(encWorker), hexlify(encDisputer),
    prep.signature, BigInt(prep.expiry),
    { gasLimit: 1000000n }
  );
  const r1 = await tx1.wait(1);
  if (!r1 || r1.status !== 1) throw new Error("createSession failed");
  const sessionId = parseEvent(r1.logs, iface, "SessionCreated", "sessionId");
  onLog("Session created: " + sessionId);

  // 8. open relay BEFORE submitting job
  const relayToken = await gw.waitForRelayToken(sessionId);
  const chunks = [];
  const ws = new WebSocket(`${RELAY}?token=${encodeURIComponent(relayToken)}`);
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
  ws.addEventListener("message", (e) => {
    let frame;
    try { frame = JSON.parse(e.data); } catch { return; }
    if (!frame?.payload) return;
    try { chunks.push(aesDecrypt(sessionKey, Buffer.from(frame.payload, "base64")).toString("utf8")); }
    catch {}
  });
  onLog("Relay connected");

  // 9. encrypt + upload prompt
  const cipher = aesEncrypt(sessionKey, Buffer.from(prompt, "utf8"));
  const { blobHashes } = await gw.uploadBlob(cipher.toString("base64"));
  if (!blobHashes?.length) throw new Error("No blob hash returned");

  // 10. submitJob
  const tx2 = await reg.submitJob(sessionId, blobHashes[0], { value: JOB_FEE, gasLimit: 500000n });
  const r2 = await tx2.wait(1);
  if (!r2 || r2.status !== 1) throw new Error("submitJob failed");
  const jobId = parseEvent(r2.logs, iface, "JobSubmitted", "jobId");
  onLog("Job submitted: " + jobId);

  // 11. await JobCompleted
  const topic  = iface.getEvent("JobCompleted").topicHash;
  const jobTop = "0x" + jobId.toString(16).padStart(64, "0");
  let done = null;
  for (let i = 0; i < 60 && !done; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const head = await provider.getBlockNumber();
    const logs = await provider.getLogs({
      address: JOB_REG, fromBlock: r2.blockNumber, toBlock: head,
      topics: [topic, jobTop],
    });
    if (logs.length) done = logs[0];
  }
  if (!done) throw new Error("Timeout waiting for job completion");
  await new Promise(r => setTimeout(r, 4000));
  ws.close();

  return chunks.join("");
}