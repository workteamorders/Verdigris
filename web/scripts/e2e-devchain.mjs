// End-to-end rehearsal against the local devchain (contracts/scripts/devchain.mjs) with a stand-in browser wallet.
// The wallet is a script injected into the page (EIP-6963) that forwards to the devchain's unlocked test accounts.
// No real wallet, no keys, no public network. Usage: node scripts/e2e-devchain.mjs <site url> <rpc url> <screenshot dir>
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [site = 'http://127.0.0.1:4173', rpc = 'http://127.0.0.1:8545', shots = 'e2e-shots'] = process.argv.slice(2);
fs.mkdirSync(shots, { recursive: true });
let n = 0, fails = 0;
const ok = (c, m) => { n++; if (!c) fails++; console.log(`${c ? '  ok  ' : '  FAIL'} ${m}`); };
const call = (method, params = []) => fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then((r) => r.json());

const walletScript = (rpcUrl, account) => `
(() => {
  const rpc = ${JSON.stringify(rpcUrl)}, account = ${JSON.stringify(account)};
  const KEY = 'test-wallet-connected';
  const isConn = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
  const provider = {
    isTestWallet: true,
    on() {}, removeListener() {},
    async request({ method, params = [] }) {
      if (method === 'eth_requestAccounts') { try { localStorage.setItem(KEY, '1'); } catch {} return [account]; }
      if (method === 'eth_accounts') return isConn() ? [account] : [];
      if (method === 'wallet_switchEthereumChain') return null;
      if (method === 'eth_sendTransaction') params = [{ ...params[0], from: account }];
      const r = await fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then((x) => x.json());
      if (r.error) { const e = new Error(r.error.message); e.code = r.error.code; e.data = r.error.data; throw e; }
      return r.result;
    },
  };
  const info = { uuid: '00000000-0000-4000-8000-000000000001', name: 'Test Wallet', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=', rdns: 'dev.verdigris.testwallet' };
  const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info, provider }) }));
  window.addEventListener('eip6963:requestProvider', announce);
  announce();
})();`;

const accounts = (await call('eth_accounts')).result;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(walletScript(rpc, accounts[1]));
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

console.log('Before the Count');
await page.goto(`${site}/`);
await page.waitForSelector('text=Count not started', { timeout: 15000 }).catch(() => {});
await page.screenshot({ path: path.join(shots, '01-home-before.png') });

console.log('Day 1 opens');
await call('evm_increaseTime', [10]); await call('evm_mine');
await page.goto(`${site}/mint/`);
await page.waitForSelector('text=Price each', { timeout: 20000 });
ok(await page.locator('text=TEST CLOCK').first().isVisible(), 'TEST CLOCK banner is shown for the short Day');
ok(await page.locator('text=Arcs, Numeral 1').first().isVisible(), 'Day 1 is Sign Arcs, Numeral 1');

console.log('Connect and mint');
await page.getByRole('button', { name: 'Connect wallet' }).first().click();
await page.getByRole('dialog').getByRole('button', { name: 'Test Wallet' }).click();
await page.waitForSelector('button:has-text("Mint 1 for")', { timeout: 15000 });
await page.screenshot({ path: path.join(shots, '02-mint-ready.png') });
await page.getByRole('button', { name: /Mint 1 for/ }).click();
const dlg = page.getByRole('dialog');
ok(await dlg.getByText('final and cannot be refunded').isVisible(), 'confirmation states that payment is final');
ok(await dlg.getByRole('button', { name: 'Confirm in wallet' }).isDisabled(), 'confirm is disabled until the box is ticked');
await dlg.getByRole('checkbox').check();
await page.screenshot({ path: path.join(shots, '03-mint-confirm.png') });
await dlg.getByRole('button', { name: 'Confirm in wallet' }).click();
await page.waitForSelector('text=Your Disc is in your wallet', { timeout: 20000 });
ok(true, 'mint 1 Disc succeeded');
await page.screenshot({ path: path.join(shots, '04-mint-done.png') });

console.log('Wallet allowance');
await page.getByRole('button', { name: 'Mint another' }).click();
await page.waitForSelector('text=Price each');
await page.getByRole('button', { name: /Mint 1 for/ }).click();
await page.getByRole('dialog').getByRole('checkbox').check();
await page.getByRole('dialog').getByRole('button', { name: 'Confirm in wallet' }).click();
await page.waitForSelector('text=Your Disc is in your wallet', { timeout: 20000 });
await page.getByRole('button', { name: 'Mint another' }).click();
await page.waitForSelector('text=reached its limit of 2 Discs for today', { timeout: 15000 });
ok(true, 'third Disc is blocked with a plain message');
await page.screenshot({ path: path.join(shots, '05-mint-limit.png') });

console.log('Vault, Gallery, Calendar');
await page.goto(`${site}/vault/`);
await page.waitForSelector('text=Sign, Numeral', { state: 'attached', timeout: 20000 }).catch(() => {});
await page.waitForSelector('text=2 Discs', { timeout: 20000 });
ok(true, 'Vault lists the two Discs');
await page.screenshot({ path: path.join(shots, '06-vault.png') });
await page.goto(`${site}/gallery/?id=1`);
await page.waitForSelector('text=Compare with the contract', { timeout: 20000 });
await page.getByRole('button', { name: /Compare with the contract/ }).click();
await page.waitForSelector('text=Identical to what the contract draws', { timeout: 30000 });
ok(true, 'browser-drawn image equals the contract\'s tokenURI image');
await page.screenshot({ path: path.join(shots, '07-gallery-detail.png') });
await page.goto(`${site}/gallery/`);
await page.waitForSelector('text=2 Discs minted', { timeout: 20000 });
await page.screenshot({ path: path.join(shots, '08-gallery.png') });
await page.goto(`${site}/calendar/`);
await page.waitForSelector('button[data-state="today"]', { timeout: 20000 });
await page.screenshot({ path: path.join(shots, '09-calendar.png') });

console.log('Patina advances with time, and a send resets it');
await call('evm_increaseTime', [300 * 7]); await call('evm_mine'); // past level 2 for a Disc minted two Days ago
await page.goto(`${site}/vault/`);
await page.waitForSelector('text=Patina 2', { timeout: 20000 }).catch(() => {});
await page.screenshot({ path: path.join(shots, '10-vault-aged.png') });
ok((await page.locator('text=/Patina [1-4]:/').count()) >= 1, 'Vault shows aged Patina after time passes');
await page.getByRole('button', { name: 'Send' }).first().click();
const sd = page.getByRole('dialog');
await sd.getByLabel('Recipient address').fill(accounts[2]);
await sd.getByRole('checkbox').check();
await page.screenshot({ path: path.join(shots, '11-vault-send.png') });
await sd.getByRole('button', { name: 'Send' }).click();
await page.waitForSelector('text=Its Patina is back to level 0', { timeout: 20000 });
ok(true, 'sending a Disc works and says Patina is reset');

console.log('404 and offline');
const r404 = await page.goto(`${site}/nope/`);
ok(r404?.status() === 404 || (await page.locator('text=weathered away').count()) > 0, '404 page renders');
await page.screenshot({ path: path.join(shots, '12-404.png') });

ok(errors.length === 0, `no uncaught page errors${errors.length ? ': ' + errors[0] : ''}`);
await browser.close();
console.log(`\n${n - fails}/${n} checks passed`);
process.exit(fails ? 1 : 0);
