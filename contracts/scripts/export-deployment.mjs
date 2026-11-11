// Turns the forge broadcast record into web/deployments/<chainId>.json (addresses and the parameters the site checks).
// Usage: node scripts/export-deployment.mjs <chainId> "<chain name>" <outDir>
import fs from 'node:fs';
import path from 'node:path';

const [chainId, chainName, outDir] = process.argv.slice(2);
if (!chainId || !chainName || !outDir) { console.error('usage: export-deployment.mjs <chainId> <name> <outDir>'); process.exit(1); }
const rec = JSON.parse(fs.readFileSync(path.join('broadcast', 'Deploy.s.sol', chainId, 'run-latest.json'), 'utf8'));
const find = (n) => rec.transactions.find((t) => t.contractName === n && t.transactionType === 'CREATE');
const rTx = find('VerdigrisRenderer'), dTx = find('VerdigrisDisc');
if (!rTx || !dTx) throw new Error('broadcast record has no CREATE for the renderer and the Disc contract');
const receipt = (h) => rec.receipts.find((r) => r.transactionHash === h);
const env = process.env;
const out = {
  chainId: Number(chainId),
  chainName,
  disc: dTx.contractAddress,
  renderer: rTx.contractAddress,
  treasury: env.TREASURY,
  startTime: Number(env.START_TIME),
  slotSeconds: Number(env.SLOT_SECONDS),
  pricesWei: { ordinary: env.PRICE_ORDINARY_WEI, fine: env.PRICE_FINE_WEI, crown: env.PRICE_CROWN_WEI },
  patinaSeconds: [env.PATINA_1_SECONDS, env.PATINA_2_SECONDS, env.PATINA_3_SECONDS, env.PATINA_4_SECONDS].map(Number),
  deployBlock: Number(BigInt(receipt(dTx.hash)?.blockNumber ?? 0)),
  deployTx: dTx.hash,
  rendererTx: rTx.hash,
};
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${chainId}.json`), JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${path.join(outDir, `${chainId}.json`)}`);
