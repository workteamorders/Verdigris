// Smoke harness: runs the solc-js build in an in-process JS EVM (ethereumjs). This is NOT the Foundry suite.
// Usage: node scripts/smoke-evm.mjs <node_modules dir with viem + @ethereumjs/*> <out dir from compile-check> [svgOutDir]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const nm = path.resolve(process.argv[2]);
const outDir = path.resolve(process.argv[3]);
const svgDir = process.argv[4] ? path.resolve(process.argv[4]) : null;
const req = createRequire(path.join(nm, 'x.js'));
const { createEVM } = await import(req.resolve('@ethereumjs/evm'));
const { Address, createAccount, hexToBytes, bytesToHex } = await import(req.resolve('@ethereumjs/util'));
const { encodeDeployData, encodeFunctionData, decodeFunctionResult, decodeErrorResult, parseEther } = await import(req.resolve('viem'));

const art = (n) => JSON.parse(fs.readFileSync(path.join(outDir, `${n}.json`), 'utf8'));
const DISC = art('VerdigrisDisc');
const REND = art('VerdigrisRenderer');

const evm = await createEVM();
const addr = (n) => new Address(hexToBytes('0x' + n.toString(16).padStart(40, '0')));
const ALICE = addr(0xa11ce), BOB = addr(0xb0b), TREASURY = addr(0x7e45), CAROL = addr(0xca401);
for (const a of [ALICE, BOB, CAROL, TREASURY]) await evm.stateManager.putAccount(a, createAccount({ balance: parseEther('1000') }));

const DAY = 86400, T0 = 1_800_000_000; // arbitrary start
let ts = T0 - 10;
const block = () => ({ header: { number: 1n, timestamp: BigInt(ts), coinbase: addr(0), gasLimit: 1_000_000_000n, baseFeePerGas: 0n, difficulty: 0n, prevRandao: new Uint8Array(32), getBlobGasPrice: () => 1n, cliqueSigner: () => addr(0) } });

async function run({ from, to, data, value = 0n, gas = 50_000_000n }) {
  const r = await evm.runCall({ caller: from, to, data: hexToBytes(data), value, gasLimit: gas, block: block() });
  return r;
}
async function deploy(from, art_, args = []) {
  const data = encodeDeployData({ abi: art_.abi, bytecode: art_.bytecode, args });
  const r = await run({ from, data });
  if (r.execResult.exceptionError) throw new Error('deploy failed: ' + r.execResult.exceptionError.error);
  return r.createdAddress;
}
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok  ', m); } else { fail++; console.log('  FAIL', m); } };

async function call(from, to, fn, args = [], value = 0n, abi = DISC.abi) {
  const r = await run({ from, to, data: encodeFunctionData({ abi, functionName: fn, args }), value });
  const ex = r.execResult;
  if (ex.exceptionError) {
    let err = ex.exceptionError.error;
    if (ex.returnValue.length) { try { const d = decodeErrorResult({ abi, data: bytesToHex(ex.returnValue) }); err = d.errorName; } catch { err = 'revert'; } }
    return { ok: false, err, gas: ex.executionGasUsed };
  }
  let value_; try { value_ = decodeFunctionResult({ abi, functionName: fn, data: bytesToHex(ex.returnValue) }); } catch { value_ = undefined; }
  return { ok: true, value: value_, gas: ex.executionGasUsed, logs: ex.logs ?? [] };
}

const prices = [parseEther('0.002'), parseEther('0.004'), parseEther('0.01')];
const thresholds = [3 * DAY, 14 * DAY, 45 * DAY, 120 * DAY];
const renderer = await deploy(ALICE, REND);
const disc = await deploy(ALICE, DISC, [TREASURY.toString(), renderer.toString(), BigInt(T0), BigInt(DAY), prices, thresholds]);
const D = disc;
const c = (from, fn, args, value) => call(from, D, fn, args, value);

console.log('Count and rules');
ts = T0 - 10;
let r = await c(ALICE, 'mint', [1], prices[0]);
ok(!r.ok && r.err === 'NotStarted', 'mint before start reverts NotStarted');
ts = T0 + 5; // Day 0: Sign 0, Numeral 1, Ordinary
r = await c(ALICE, 'countState');
ok(r.value[0] === 1 && r.value[1] === 0, 'Day 0 is live');
r = await c(ALICE, 'mint', [1], prices[0] - 1n);
ok(!r.ok && r.err === 'WrongPayment', 'underpay reverts');
r = await c(ALICE, 'mint', [1], prices[0] + 1n);
ok(!r.ok && r.err === 'WrongPayment', 'overpay reverts (no refund path)');
r = await c(ALICE, 'mint', [3], prices[0] * 3n);
ok(!r.ok && r.err === 'BadQuantity', 'quantity 3 reverts');
r = await c(ALICE, 'mint', [0], 0n);
ok(!r.ok && r.err === 'BadQuantity', 'quantity 0 reverts');
r = await c(ALICE, 'mint', [2], prices[0] * 2n);
ok(r.ok, `Alice mints 2 on Day 0 (gas ${r.gas})`);
r = await c(ALICE, 'mint', [1], prices[0]);
ok(!r.ok && r.err === 'WalletCapReached', 'third Disc on the same Day reverts WalletCapReached');
r = await c(ALICE, 'ownerOf', [1n]); ok(r.value.toLowerCase() === ALICE.toString(), 'Alice owns #1');
r = await c(ALICE, 'totalMinted'); ok(r.value === 2n, 'totalMinted = 2');

console.log('Caps per Day (Ordinary 24)');
// Fill Day 0 with 22 more Discs from 11 wallets
let more = 0;
for (let i = 0; i < 11; i++) {
  const w = addr(0x1000 + i);
  await evm.stateManager.putAccount(w, createAccount({ balance: parseEther('10') }));
  const x = await c(w, 'mint', [2], prices[0] * 2n);
  if (x.ok) more += 2;
}
ok(more === 22, 'eleven wallets minted 22 more');
r = await c(BOB, 'mint', [1], prices[0]);
ok(!r.ok && r.err === 'DaySoldOut', 'Day 0 sold out at 24');
r = await c(BOB, 'dayInfo', [0]);
ok(r.value[4] === 24n && r.value[3] === 24n, 'dayInfo reports 24 of 24');

r = await c(BOB, 'mintedAll'); ok(r.value[0] === 24 && r.value[6] === 0 && r.value.length === 84, 'mintedAll returns the per-Day counts');
console.log('Tiers on later Days');
const dayInfo = async (d) => (await c(ALICE, 'dayInfo', [d])).value;
let tiers = [0, 0, 0], caps = 0;
for (let d = 0; d < 84; d++) { const i = await dayInfo(d); tiers[i[2]]++; caps += Number(i[3]); }
ok(tiers[0] === 48 && tiers[1] === 24 && tiers[2] === 12, 'Days per tier 48 / 24 / 12');
ok(caps === 1632, 'sum of Day caps = 1632');
const seen = new Set(); for (let d = 0; d < 84; d++) { const i = await dayInfo(d); seen.add(i[0] * 10 + i[1]); }
ok(seen.size === 84, '84 distinct (Sign, Numeral) pairs');
ts = T0 + 6 * DAY + 5; // Day 6: Numeral 7, Crown
r = await c(BOB, 'mint', [1], prices[2] - 1n);
ok(!r.ok && r.err === 'WrongPayment', 'Crown price enforced');
r = await c(BOB, 'mint', [2], prices[2] * 2n);
ok(r.ok, 'Bob mints 2 Crowns on Day 6');
const bobIds = (await c(BOB, 'ownedIds', [BOB.toString(), 1n, 5000n])).value;
ok(bobIds[0].length === 2 && bobIds[1] === 0n, `ownedIds finds Bob's two Discs (${bobIds[0]})`);

console.log('Patina and moves');
const crownId = bobIds[0][0];
r = await c(BOB, 'patinaLevel', [crownId]); ok(r.value === 0, 'fresh Disc is level 0');
ts += 3 * DAY - 1; r = await c(BOB, 'patinaLevel', [crownId]); ok(r.value === 0, 'level 0 just before 3 days');
ts += 1; r = await c(BOB, 'patinaLevel', [crownId]); ok(r.value === 1, 'level 1 at 3 days');
ts += 11 * DAY; r = await c(BOB, 'patinaLevel', [crownId]); ok(r.value === 2, 'level 2 at 14 days');
ts += 31 * DAY; r = await c(BOB, 'patinaLevel', [crownId]); ok(r.value === 3, 'level 3 at 45 days');
ts += 75 * DAY; r = await c(BOB, 'patinaLevel', [crownId]); ok(r.value === 4, 'level 4 at 120 days');
r = await c(BOB, 'transferFrom', [BOB.toString(), CAROL.toString(), crownId]);
ok(r.ok, 'transfer works');
ok(r.logs.some((l) => bytesToHex(l[1][0]) === '0xf8e1a15aba9398e019f0b49df1a4fde98ee17ae345cb5f6b5e2c27f5033e8ce7'), 'transfer emits MetadataUpdate (ERC-4906)');
r = await c(CAROL, 'patinaLevel', [crownId]); ok(r.value === 0, 'transfer resets Patina to 0');
r = await c(ALICE, 'transferFrom', [CAROL.toString(), ALICE.toString(), crownId]);
ok(!r.ok, 'a stranger cannot move someone else\'s Disc');
r = await c(CAROL, 'safeTransferFrom', [CAROL.toString(), TREASURY.toString(), crownId]);
ok(r.ok, 'safeTransferFrom to an empty account works');

console.log('Treasury');
const bal = async (a) => (await evm.stateManager.getAccount(a))?.balance ?? 0n;
const contractBal = await bal(D);
ok(contractBal > 0n, `contract holds ${contractBal} wei of mint payments`);
const t0 = await bal(TREASURY);
r = await c(CAROL, 'withdraw', []); // anyone may call
ok(r.ok, 'a stranger can call withdraw()');
ok((await bal(D)) === 0n && (await bal(TREASURY)) === t0 + contractBal, 'whole balance went to TREASURY');
r = await c(CAROL, 'withdraw', []); ok(!r.ok && r.err === 'NothingToWithdraw', 'withdraw with zero balance reverts');
const abiNames = DISC.abi.filter((x) => x.type === 'function').map((x) => x.name);
ok(!abiNames.some((n) => /^(owner|transferOwnership|renounceOwnership|pause|unpause|upgrade|grantRole|revokeRole|setRoyalty|setDefaultRoyalty|setPrice|setRenderer|setTreasury|burn|adminMint|mintTo)$/i.test(n)), 'no admin-style functions in the ABI');

console.log('Interfaces and royalty');
const sup = async (id) => (await c(ALICE, 'supportsInterface', [id])).value;
ok(await sup('0x80ac58cd'), 'ERC-721'); ok(await sup('0x5b5e139f'), 'ERC-721 Metadata');
ok(await sup('0x2a55205a'), 'ERC-2981'); ok(await sup('0x49064906'), 'ERC-4906'); ok(!(await sup('0xffffffff')), 'rejects 0xffffffff');
r = await c(ALICE, 'royaltyInfo', [1n, 10_000n]);
ok(r.value[0].toLowerCase() === TREASURY.toString() && r.value[1] === 500n, 'royalty 500 bps to TREASURY');

console.log('Count end');
ts = T0 + 84 * DAY + 1;
r = await c(BOB, 'mint', [1], prices[0]); ok(!r.ok && r.err === 'CountEnded', 'mint after Day 84 reverts CountEnded');

console.log('tokenURI gas and output');
ts = T0 + 6 * DAY + 5 + 200 * DAY; // everything is old
const mintedIds = [1n, 5n, bobIds[0][1]];
for (const id of mintedIds) {
  r = await c(ALICE, 'tokenURI', [id]);
  ok(r.ok, `tokenURI(${id}) ok, gas ${r.gas}`);
  if (r.ok) {
    ok(r.gas < 3_000_000n, `  gas under the 3,000,000 budget (${r.gas})`);
    const json = JSON.parse(Buffer.from(r.value.split(',')[1], 'base64').toString());
    const svg = Buffer.from(json.image.split(',')[1], 'base64').toString();
    console.log(`        ${json.name}; svg ${svg.length} bytes; ${json.attributes.map((a) => a.trait_type + '=' + a.value).join(' ')}`);
    if (svgDir) { fs.mkdirSync(svgDir, { recursive: true }); fs.writeFileSync(path.join(svgDir, `disc-${id}.svg`), svg); }
  }
}
r = await c(ALICE, 'tokenURI', [999n]); ok(!r.ok, 'tokenURI of a missing id reverts');
r = await c(ALICE, 'contractURI', []); ok(r.ok, `contractURI ok, gas ${r.gas}`);
if (svgDir) {
  // render every Sign x tier x level straight from the renderer
  const rr = (s, n, t, l) => call(ALICE, renderer, 'discSvg', [s, n, t, l, 1], 0n, REND.abi);
  const gasMax = { v: 0n };
  for (const [s, n, t] of [[0, 1, 0], [5, 3, 0], [8, 5, 1], [9, 6, 1], [4, 7, 2], [10, 7, 2]]) for (const l of [0, 1, 2, 3, 4]) {
    const x = await rr(s, n, t, l); if (x.gas > gasMax.v) gasMax.v = x.gas;
    fs.writeFileSync(path.join(svgDir, `s${s}-n${n}-t${t}-l${l}.svg`), x.value);
  }
  console.log(`  max discSvg gas ${gasMax.v}`);
}

// Parity fixtures: the exact bytes discSvg returns, for the web port to compare against.
{
  const fx = [];
  const rr = (s, n, t, l, sr) => call(ALICE, renderer, 'discSvg', [s, n, t, l, sr], 0n, REND.abi);
  const tierOf = (n) => (n >= 7 ? 2 : n >= 5 ? 1 : 0);
  for (let d = 0; d < 84; d++) {
    const sign = d % 12, numeral = (d % 7) + 1, level = d % 5, serial = (d * 7) % 24 + 1;
    const x = await rr(sign, numeral, tierOf(numeral), level, serial);
    if (!x.ok) throw new Error('discSvg failed for day ' + d);
    fx.push({ sign, numeral, level, serial, svg: x.value });
  }
  // every level for one Disc of each tier
  for (const [sign, numeral] of [[0, 1], [3, 5], [4, 7]]) for (let level = 0; level < 5; level++) {
    const x = await rr(sign, numeral, tierOf(numeral), level, 9); fx.push({ sign, numeral, level, serial: 9, svg: x.value });
  }
  if (process.env.FIXTURE_OUT) { fs.mkdirSync(path.dirname(process.env.FIXTURE_OUT), { recursive: true }); fs.writeFileSync(process.env.FIXTURE_OUT, JSON.stringify(fx)); }
  ok(fx.length === 99, `wrote ${fx.length} parity fixtures`);
}
console.log(`\n${pass} passed, ${fail} failed (smoke harness, not the Foundry suite)`);
process.exit(fail ? 1 : 0);
