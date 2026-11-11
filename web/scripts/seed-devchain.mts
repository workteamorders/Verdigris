// Fills the local devchain with a spread of Discs of different ages, so every page can be looked at with data.
// Usage: tsx scripts/seed-devchain.mts <rpc url>
import { createPublicClient, createWalletClient, http } from 'viem';
import { discAbi } from '../src/lib/abi.generated';
import { localChain } from '../src/lib/chains';
import fs from 'node:fs';

const rpc = process.argv[2] ?? 'http://127.0.0.1:8545';
const transport = http(rpc);
const pub = createPublicClient({ chain: localChain, transport });
const raw = (method: string, params: unknown[] = []) => fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then((r) => r.json() as Promise<{ result: string }>);
const accounts = ((await raw('eth_accounts')).result as unknown as string[]) as `0x${string}`[];
const wallet = createWalletClient({ chain: localChain, transport });
// Read at run time, so a clean checkout with no local record still type-checks.
const deployment = JSON.parse(fs.readFileSync(new URL('../deployments/31337.json', import.meta.url), 'utf8')) as { disc: string; pricesWei: { ordinary: string; fine: string; crown: string } };
const disc = deployment.disc as `0x${string}`;
const prices = [BigInt(deployment.pricesWei.ordinary), BigInt(deployment.pricesWei.fine), BigInt(deployment.pricesWei.crown)];

await raw('evm_increaseTime', [2]);
await raw('evm_mine');
let minted = 0;
for (let day = 0; day < 14; day++) {
  const [status, d] = await pub.readContract({ address: disc, abi: discAbi, functionName: 'countState' });
  if (status !== 1) throw new Error('Count is not live');
  const numeral = (d % 7) + 1;
  const price = numeral >= 7 ? prices[2]! : numeral >= 5 ? prices[1]! : prices[0]!;
  for (const [i, who] of accounts.slice(1, 5).entries()) {
    const qty = ((day + i) % 2) + 1;
    try {
      await wallet.writeContract({ account: who, address: disc, abi: discAbi, functionName: 'mint', args: [qty], value: price * BigInt(qty) });
      minted += qty;
    } catch { /* a cap was hit; fine */ }
  }
  await raw('evm_increaseTime', [300]);
  await raw('evm_mine');
}
// Move two Discs so the Vault and Gallery show a fresh Disc among old ones.
const total = Number(await pub.readContract({ address: disc, abi: discAbi, functionName: 'totalMinted' }));
for (const id of [3, 4]) {
  const info = await pub.readContract({ address: disc, abi: discAbi, functionName: 'discInfo', args: [BigInt(id)] });
  await wallet.writeContract({ account: info.owner, address: disc, abi: discAbi, functionName: 'transferFrom', args: [info.owner, accounts[1]!, BigInt(id)] });
}
console.log(`seeded ${minted} Discs (total ${total}) over 14 Days`);
