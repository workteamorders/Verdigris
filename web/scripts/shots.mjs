// Screenshots every page at 360, 768 and 1440, plus a greyscale capture at 1440, and reports horizontal overflow.
// Usage: node scripts/shots.mjs <site url> <out dir> [wallet rpc url]   (CHROMIUM_PATH optional)
// With a wallet rpc url, a stand-in wallet (see e2e-devchain.mjs) is connected so Mint and Vault show a holder's view.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [site, out, rpc] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const PAGES = [['home', '/'], ['mint', '/mint/'], ['calendar', '/calendar/'], ['gallery', '/gallery/'], ['gallery-disc', '/gallery/?id=5'], ['vault', '/vault/'], ['rules', '/rules/'], ['contracts', '/contracts/'], ['risk', '/risk/'], ['404', '/nope/'], ['offline', '/offline/']];
const SIZES = [[360, 800], [768, 1024], [1440, 900]];

const wallet = (rpcUrl, account) => `(() => { const rpc=${JSON.stringify(rpcUrl)}, account=${JSON.stringify(account)};
const provider={ on(){}, removeListener(){}, async request({method,params=[]}){ if(method==='eth_requestAccounts'||method==='eth_accounts') return [account]; if(method==='wallet_switchEthereumChain') return null;
const r=await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}).then(x=>x.json()); if(r.error) throw new Error(r.error.message); return r.result; } };
const info={uuid:'00000000-0000-4000-8000-000000000001',name:'Test Wallet',icon:'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=',rdns:'dev.verdigris.testwallet'};
const a=()=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:Object.freeze({info,provider})})); window.addEventListener('eip6963:requestProvider',a); a(); localStorage.setItem('wagmi.recentConnectorId','"dev.verdigris.testwallet"'); })();`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let overflow = 0;
for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  if (rpc) {
    const accounts = (await (await fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_accounts', params: [] }) })).json()).result;
    await ctx.addInitScript(wallet(rpc, accounts[1]));
  }
  for (const [name, url] of PAGES) {
    const page = await ctx.newPage();
    await page.goto(site + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(rpc ? 1800 : 600);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (sw > 0) { overflow++; console.log(`OVERFLOW ${name} @${w}: ${sw}px`); }
    await page.screenshot({ path: path.join(out, `${name}-${w}.png`), fullPage: true });
    if (w === 1440) {
      await page.addStyleTag({ content: 'html{filter:grayscale(1)}' });
      await page.screenshot({ path: path.join(out, `${name}-grey.png`), fullPage: true });
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(overflow ? `${overflow} page(s) overflow horizontally` : 'no horizontal overflow at 360, 768 or 1440');
