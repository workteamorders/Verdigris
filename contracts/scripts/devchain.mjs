// A tiny local JSON-RPC chain for rehearsing the site WITHOUT anvil: the compiled contracts run in an in-process JS EVM
// (ethereumjs). Chain id 31337, ten unlocked test accounts, zero gas price, one block per transaction.
// It is a rehearsal tool, not Anvil and not a substitute for it. It never touches a public network and holds no keys.
//
// Usage: node scripts/devchain.mjs <node_modules with viem + @ethereumjs/*> <out dir from compile-check> <web dir> [port]
// Env:   SLOT_SECONDS (default 300), START_IN (seconds until Day 1, default 5)
// Extra RPC methods:  evm_increaseTime [seconds]   evm_mine
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const [nmArg, outArg, webArg, portArg] = process.argv.slice(2);
const nm = path.resolve(nmArg), outDir = path.resolve(outArg), webDir = path.resolve(webArg), PORT = Number(portArg ?? 8545);
const req = createRequire(path.join(nm, 'x.js'));
const { createEVM } = await import(req.resolve('@ethereumjs/evm'));
const { Address, createAccount, hexToBytes, bytesToHex } = await import(req.resolve('@ethereumjs/util'));
const { encodeDeployData, parseEther, keccak256, toHex } = await import(req.resolve('viem'));

const art = (n) => JSON.parse(fs.readFileSync(path.join(outDir, `${n}.json`), 'utf8'));
const evm = await createEVM();
const CHAIN_ID = 31337;
const addr = (n) => new Address(hexToBytes('0x' + n.toString(16).padStart(40, '0')));
const ACCOUNTS = Array.from({ length: 10 }, (_, i) => addr(0xa0000 + i));
for (const a of ACCOUNTS) await evm.stateManager.putAccount(a, createAccount({ balance: parseEther('10000') }));

let skew = 0; // seconds added to the wall clock by evm_increaseTime
const nowTs = () => Math.floor(Date.now() / 1000) + skew;
const blocks = [{ number: 0, timestamp: nowTs(), hash: keccak256(toHex('genesis')), txs: [] }];
const receipts = new Map(), txs = new Map(), logs = [];
const hex = (n) => '0x' + BigInt(n).toString(16);
const head = () => blocks[blocks.length - 1];
const blockObj = (b) => ({
  number: hex(b.number), hash: b.hash, parentHash: b.number ? blocks[b.number - 1].hash : '0x' + '0'.repeat(64), timestamp: hex(b.timestamp),
  nonce: '0x0000000000000000', sha3Uncles: '0x' + '0'.repeat(64), logsBloom: '0x' + '0'.repeat(512), transactionsRoot: '0x' + '0'.repeat(64),
  stateRoot: '0x' + '0'.repeat(64), receiptsRoot: '0x' + '0'.repeat(64), miner: '0x' + '0'.repeat(40), difficulty: '0x0', totalDifficulty: '0x0',
  extraData: '0x', size: '0x1', gasLimit: '0x1c9c380', gasUsed: '0x0', baseFeePerGas: '0x0', transactions: b.txs, uncles: [],
});
const blk = () => ({ header: { number: BigInt(head().number + 1), timestamp: BigInt(Math.max(head().timestamp + 1, nowTs())), coinbase: addr(0), gasLimit: 1_000_000_000n, baseFeePerGas: 0n, difficulty: 0n, prevRandao: new Uint8Array(32), getBlobGasPrice: () => 1n, cliqueSigner: () => addr(0) } });
const asAddr = (h) => new Address(hexToBytes(h));

function mine(tx, result, createdAddress) {
  const ts = Math.max(head().timestamp + 1, nowTs());
  const number = head().number + 1;
  const hash = keccak256(toHex(`block${number}${ts}${Math.random()}`));
  const txHash = keccak256(toHex(`tx${number}${ts}${Math.random()}`));
  blocks.push({ number, timestamp: ts, hash, txs: tx ? [txHash] : [] });
  if (tx) {
    const ls = (result.execResult.logs ?? []).map(([a, t, d], i) => ({
      address: bytesToHex(a), topics: t.map(bytesToHex), data: bytesToHex(d), blockNumber: hex(number), transactionHash: txHash, transactionIndex: '0x0', blockHash: hash, logIndex: hex(i), removed: false,
    }));
    logs.push(...ls);
    const ok = !result.execResult.exceptionError;
    receipts.set(txHash, {
      transactionHash: txHash, transactionIndex: '0x0', blockHash: hash, blockNumber: hex(number), from: tx.from, to: tx.to ?? null,
      cumulativeGasUsed: hex(result.execResult.executionGasUsed + 21000n), gasUsed: hex(result.execResult.executionGasUsed + 21000n),
      contractAddress: createdAddress ?? null, logs: ok ? ls : [], logsBloom: '0x' + '0'.repeat(512), status: ok ? '0x1' : '0x0', effectiveGasPrice: '0x0', type: '0x2',
    });
    txs.set(txHash, { hash: txHash, blockHash: hash, blockNumber: hex(number), from: tx.from, to: tx.to ?? null, input: tx.data ?? '0x', value: tx.value ?? '0x0', nonce: '0x0', gas: '0x1c9c380', gasPrice: '0x0', type: '0x2', transactionIndex: '0x0' });
  }
  return txHash;
}

async function run(tx, commit) {
  const data = tx.data ?? tx.input ?? '0x';
  const opts = { caller: asAddr(tx.from ?? bytesToHex(ACCOUNTS[0].bytes)), data: hexToBytes(data), value: BigInt(tx.value ?? '0x0'), gasLimit: 50_000_000n, block: blk() };
  if (tx.to) opts.to = asAddr(tx.to);
  await evm.stateManager.checkpoint();
  let r;
  try { r = await evm.runCall(opts); } catch (e) { await evm.stateManager.revert(); throw e; }
  if (commit && !r.execResult.exceptionError) await evm.stateManager.commit(); else await evm.stateManager.revert();
  return r;
}

const rpcErr = (code, message, data) => ({ code, message, ...(data ? { data } : {}) });

async function handle(method, params) {
  switch (method) {
    case 'eth_chainId': return hex(CHAIN_ID);
    case 'net_version': return String(CHAIN_ID);
    case 'eth_blockNumber': return hex(head().number);
    case 'eth_accounts': case 'eth_requestAccounts': return ACCOUNTS.map((a) => a.toString());
    case 'eth_gasPrice': case 'eth_maxPriorityFeePerGas': return '0x0';
    case 'eth_feeHistory': return { oldestBlock: hex(head().number), baseFeePerGas: ['0x0', '0x0'], gasUsedRatio: [0], reward: [['0x0']] };
    case 'eth_getBalance': return hex((await evm.stateManager.getAccount(asAddr(params[0])))?.balance ?? 0n);
    case 'eth_getTransactionCount': return hex((await evm.stateManager.getAccount(asAddr(params[0])))?.nonce ?? 0n);
    case 'eth_getCode': return bytesToHex(await evm.stateManager.getCode(asAddr(params[0])));
    case 'eth_getBlockByNumber': {
      const t = params[0];
      const b = t === 'latest' || t === 'pending' || t === 'safe' || t === 'finalized' ? head() : blocks[Number(BigInt(t))];
      return b ? blockObj(b) : null;
    }
    case 'eth_getBlockByHash': { const b = blocks.find((x) => x.hash === params[0]); return b ? blockObj(b) : null; }
    case 'eth_getTransactionReceipt': return receipts.get(params[0]) ?? null;
    case 'eth_getTransactionByHash': return txs.get(params[0]) ?? null;
    case 'eth_getLogs': {
      const f = params[0] ?? {};
      const addrs = (Array.isArray(f.address) ? f.address : f.address ? [f.address] : []).map((a) => a.toLowerCase());
      return logs.filter((l) => (!addrs.length || addrs.includes(l.address.toLowerCase())) && (!f.topics?.[0] || l.topics[0] === f.topics[0]));
    }
    case 'eth_call': case 'eth_estimateGas': {
      const r = await run(params[0], false);
      if (r.execResult.exceptionError) {
        const d = bytesToHex(r.execResult.returnValue);
        throw rpcErr(3, 'execution reverted', d === '0x' ? undefined : d);
      }
      return method === 'eth_call' ? bytesToHex(r.execResult.returnValue) : hex(r.execResult.executionGasUsed + 30000n);
    }
    case 'eth_sendTransaction': {
      const r = await run(params[0], true);
      if (r.execResult.exceptionError) {
        const d = bytesToHex(r.execResult.returnValue);
        throw rpcErr(3, 'execution reverted', d === '0x' ? undefined : d);
      }
      return mine(params[0], r);
    }
    case 'evm_increaseTime': skew += Number(params[0]); return hex(skew);
    case 'evm_mine': mine(null, null); return '0x0';
    case 'wallet_switchEthereumChain': return null;
    default: throw rpcErr(-32601, `method not supported by devchain: ${method}`);
  }
}

// Deploy the contracts.
const sender = ACCOUNTS[0];
const deployTx = async (artifact, args) => {
  const data = encodeDeployData({ abi: artifact.abi, bytecode: artifact.bytecode, args });
  const r = await evm.runCall({ caller: sender, data: hexToBytes(data), gasLimit: 50_000_000n, block: blk() });
  if (r.execResult.exceptionError) throw new Error('deploy failed ' + r.execResult.exceptionError.error);
  const h = mine({ from: sender.toString(), data }, r, r.createdAddress.toString());
  return { address: r.createdAddress.toString(), hash: h, block: head().number };
};
const SLOT = Number(process.env.SLOT_SECONDS ?? 300);
const START = nowTs() + Number(process.env.START_IN ?? 5);
const treasury = ACCOUNTS[9].toString();
const rend = await deployTx(art('VerdigrisRenderer'), []);
const prices = [parseEther('0.002'), parseEther('0.004'), parseEther('0.01')];
const patina = [SLOT * 1, SLOT * 3, SLOT * 6, SLOT * 12];
const disc = await deployTx(art('VerdigrisDisc'), [treasury, rend.address, BigInt(START), BigInt(SLOT), prices, patina]);
const dep = {
  chainId: CHAIN_ID, chainName: 'Local devchain (rehearsal)', disc: disc.address, renderer: rend.address, treasury, startTime: START, slotSeconds: SLOT,
  pricesWei: { ordinary: prices[0].toString(), fine: prices[1].toString(), crown: prices[2].toString() }, patinaSeconds: patina, deployBlock: disc.block, deployTx: disc.hash, rendererTx: rend.hash,
};
fs.mkdirSync(path.join(webDir, 'deployments'), { recursive: true });
fs.writeFileSync(path.join(webDir, 'deployments', `${CHAIN_ID}.json`), JSON.stringify(dep, null, 2) + '\n');
console.log(`devchain ready on http://127.0.0.1:${PORT}  chain ${CHAIN_ID}  disc ${disc.address}  Day length ${SLOT}s  starts in ${START - nowTs()}s`);

let queue = Promise.resolve();
http.createServer((rq, rs) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' };
  if (rq.method === 'OPTIONS') { rs.writeHead(204, cors); return rs.end(); }
  let body = '';
  rq.on('data', (c) => (body += c));
  rq.on('end', () => {
    queue = queue.then(async () => {
      const one = async (c) => {
        try { return { jsonrpc: '2.0', id: c.id, result: await handle(c.method, c.params ?? []) }; }
        catch (e) { return { jsonrpc: '2.0', id: c.id, error: e && e.code !== undefined ? e : rpcErr(-32000, String(e?.message ?? e)) }; }
      };
      const parsed = JSON.parse(body);
      const out = Array.isArray(parsed) ? await Promise.all(parsed.map(one)) : await one(parsed);
      rs.writeHead(200, { 'content-type': 'application/json', ...cors });
      rs.end(JSON.stringify(out));
    }).catch((e) => { rs.writeHead(500, cors); rs.end(String(e)); });
  });
}).listen(PORT, '127.0.0.1');
