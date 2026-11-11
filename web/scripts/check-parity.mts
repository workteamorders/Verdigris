// Compares the TypeScript renderer port with the SVG the compiled contract returned (fixtures from contracts/scripts/smoke-evm.mjs).
import fs from 'node:fs';
import { discSvg } from '../src/lib/disc';
import type { PatinaLevel } from '../src/lib/patina';

interface Fixture { sign: number; numeral: number; level: PatinaLevel; serial: number; svg: string }
const fixtures = JSON.parse(fs.readFileSync(new URL('../test-fixtures/disc-svgs.json', import.meta.url), 'utf8')) as Fixture[];
let bad = 0;
for (const f of fixtures) {
  const mine = discSvg({ sign: f.sign, numeral: f.numeral, level: f.level, serial: f.serial });
  if (mine !== f.svg) {
    bad++;
    let i = 0;
    while (mine[i] === f.svg[i]) i++;
    console.log(`MISMATCH sign ${f.sign} numeral ${f.numeral} level ${f.level} serial ${f.serial} at byte ${i}:\n  ts   ${mine.slice(i - 20, i + 60)}\n  sol  ${f.svg.slice(i - 20, i + 60)}`);
    if (bad > 3) break;
  }
}
console.log(bad ? `${bad} mismatches` : `parity ok: ${fixtures.length} Discs byte-identical to the contract output`);
process.exit(bad ? 1 : 0);
