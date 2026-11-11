// Compile-check with solc-js. NOT a substitute for `forge build` / `forge test`.
// Usage: node scripts/compile-check.mjs <node_modules with solc + @openzeppelin/contracts@5.1.0> [outDir] [stubsDir with forge-std/ to also compile test/]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const nm = path.resolve(process.argv[2] ?? 'node_modules');
const outDir = path.resolve(process.argv[3] ?? 'out-solcjs');
const stubs = process.argv[4] ? path.resolve(process.argv[4]) : null;
const require = createRequire(path.join(nm, 'x.js'));
const solc = require('solc');

const root = path.resolve('.');
const sources = {};
for (const dir of stubs ? ['src', 'test', 'script'] : ['src']) {
  for (const f of fs.readdirSync(path.join(root, dir))) {
    if (f.endsWith('.sol')) sources[`${dir}/${f}`] = { content: fs.readFileSync(path.join(root, dir, f), 'utf8') };
  }
}
const input = {
  language: 'Solidity',
  sources,
  settings: {
    evmVersion: 'paris',
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } },
  },
};
function findImports(p) {
  let file;
  if (p.startsWith('@openzeppelin/')) file = path.join(nm, p);
  else if (p.startsWith('forge-std/') && stubs) file = path.join(stubs, p);
  else file = path.join(root, p);
  return fs.existsSync(file) ? { contents: fs.readFileSync(file, 'utf8') } : { error: `not found: ${p}` };
}
const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
let failed = false;
for (const e of out.errors ?? []) {
  console.log(`${e.severity.toUpperCase()}: ${e.formattedMessage}`);
  if (e.severity === 'error') failed = true;
}
if (failed) process.exit(1);
fs.mkdirSync(outDir, { recursive: true });
for (const [file, contracts] of Object.entries(out.contracts)) {
  if (!file.startsWith('src/')) continue;
  for (const [name, c] of Object.entries(contracts)) {
    if (!c.evm.bytecode.object) continue;
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify({ abi: c.abi, bytecode: '0x' + c.evm.bytecode.object, deployedBytecode: '0x' + c.evm.deployedBytecode.object }, null, 1));
    console.log(`${name}: runtime ${c.evm.deployedBytecode.object.length / 2} bytes`);
  }
}
if (stubs) console.log('tests: compile-checked against a stub forge-std (not run)');
