// Reads the deployed contracts from the chain and compares them with deployments/<chainId>.json.
// Usage: pnpm verify:deployment [chainId]      RPC_URL overrides the chain's default public RPC.
// It never signs or sends anything. Exit code 1 on any mismatch.
import fs from 'node:fs';
import path from 'node:path';
import { createPublicClient, http, getAddress } from 'viem';
import { discAbi } from '../src/lib/abi.generated';
import { chainById } from '../src/lib/chains';
import type { Deployment } from '../src/lib/deployments';

const dir = path.resolve('deployments');
const wanted = process.argv[2];
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f) && (!wanted || f === `${wanted}.json`)) : [];
if (files.length === 0) { console.log('No deployment records to check.'); process.exit(wanted ? 1 : 0); }

let bad = 0;
const check = (cond: boolean, label: string, detail = ''): void => {
  if (!cond) bad++;
  console.log(`${cond ? '  ok  ' : '  FAIL'} ${label}${cond ? '' : detail ? `  (${detail})` : ''}`);
};

for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Deployment;
  const chain = chainById(d.chainId);
  console.log(`\n${d.chainName} (chain ${d.chainId})`);
  const client = createPublicClient({ chain, transport: http(process.env.RPC_URL || undefined) });
  const read = <N extends 'START_TIME' | 'SLOT_SECONDS' | 'TREASURY' | 'RENDERER' | 'PRICE_ORDINARY' | 'PRICE_FINE' | 'PRICE_CROWN' | 'PATINA_1' | 'PATINA_2' | 'PATINA_3' | 'PATINA_4' | 'MAX_SUPPLY' | 'WALLET_SLOT_CAP' | 'TX_CAP' | 'ROYALTY_BPS' | 'COUNT_DAYS' | 'name' | 'symbol'>(fn: N) =>
    client.readContract({ address: d.disc, abi: discAbi, functionName: fn });

  check((await client.getChainId()) === d.chainId, 'RPC reports the expected chain id');
  check(((await client.getCode({ address: d.disc })) ?? '0x') !== '0x', 'Disc contract has code at the recorded address');
  check(((await client.getCode({ address: d.renderer })) ?? '0x') !== '0x', 'Renderer contract has code at the recorded address');
  check(getAddress(await read('RENDERER')) === getAddress(d.renderer), 'Disc points at the recorded renderer');
  check(getAddress(await read('TREASURY')) === getAddress(d.treasury), 'Treasury matches');
  check(Number(await read('START_TIME')) === d.startTime, 'Start time matches');
  check(Number(await read('SLOT_SECONDS')) === d.slotSeconds, 'Day length matches');
  check((await read('PRICE_ORDINARY')).toString() === d.pricesWei.ordinary, 'Ordinary price matches');
  check((await read('PRICE_FINE')).toString() === d.pricesWei.fine, 'Fine price matches');
  check((await read('PRICE_CROWN')).toString() === d.pricesWei.crown, 'Crown price matches');
  const pat = await Promise.all([read('PATINA_1'), read('PATINA_2'), read('PATINA_3'), read('PATINA_4')]);
  check(pat.every((p, i) => Number(p) === d.patinaSeconds[i]), 'Patina thresholds match');
  check((await read('COUNT_DAYS')) === 84n && (await read('MAX_SUPPLY')) === 1632n, 'Count is 84 Days and supply 1,632');
  check((await read('WALLET_SLOT_CAP')) === 2n && (await read('TX_CAP')) === 2n, 'Wallet and transaction limits are 2');
  check((await read('ROYALTY_BPS')) === 500n, 'Royalty is 500 bps');
  check((await read('name')) === 'Verdigris Discs' && (await read('symbol')) === 'VERD', 'Name and symbol');
  const [receiver, amount] = await client.readContract({ address: d.disc, abi: discAbi, functionName: 'royaltyInfo', args: [1n, 10_000n] });
  check(getAddress(receiver) === getAddress(d.treasury) && amount === 500n, 'ERC-2981 pays 5% to the treasury');
  for (const [id, label] of [['0x80ac58cd', 'ERC-721'], ['0x5b5e139f', 'ERC-721 Metadata'], ['0x2a55205a', 'ERC-2981'], ['0x49064906', 'ERC-4906']] as const) {
    check(await client.readContract({ address: d.disc, abi: discAbi, functionName: 'supportsInterface', args: [id] }), `supports ${label}`);
  }
  const names = discAbi.filter((x) => x.type === 'function').map((x) => x.name as string);
  check(!names.some((n) => /^(owner|transferOwnership|renounceOwnership|pause|unpause|upgradeTo|grantRole|setRoyalty|setDefaultRoyalty|setPrice|setRenderer|setTreasury|adminMint|burn)$/i.test(n)), 'the interface has no admin-style functions');
}
console.log(bad ? `\n${bad} check(s) FAILED. Do not trust this deployment record.` : '\nAll checks passed. This confirms the record matches the chain; it is not an audit.');
process.exit(bad ? 1 : 0);
