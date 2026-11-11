// Fails when a component stylesheet or component file uses a raw colour or raw px size instead of a token.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../src/', import.meta.url).pathname;
// Artwork and SVG-unit files: colours or px are artwork constants, not UI values.
const EXEMPT = new Set(['styles/tokens.css', 'lib/disc.ts', 'lib/contrast.generated.json', 'components/Wheel.module.css']);
const ALLOWED_PX = /^-?(0|1|2|3|4)px$/; // hairlines, fixed press depth, focus offsets
let bad = 0;

function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(css|tsx|ts)$/.test(n)) check(p);
  }
}
function check(path) {
  const rel = path.slice(ROOT.length);
  if (EXEMPT.has(rel)) return;
  const lines = readFileSync(path, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const code = line.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '');
    for (const m of code.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      if (/^#(main|h-|\d)/.test(m[0]) || rel.endsWith('.ts') && !/(color|fill|stroke|background)/i.test(code)) continue;
      if (/href=|id=|`#|'#|"#/.test(code)) continue;
      bad++; console.log(`${rel}:${i + 1} raw colour ${m[0]}`);
    }
    if (rel.endsWith('.css')) {
      for (const m of code.matchAll(/(-?\d*\.?\d+)px\b/g)) {
        if (ALLOWED_PX.test(m[0])) continue;
        if (/@media/.test(code)) continue;
        bad++; console.log(`${rel}:${i + 1} raw size ${m[0]}`);
      }
    }
  });
}
walk(ROOT);
if (bad) { console.error(`\n${bad} wild value(s)`); process.exit(1); }
console.log('No wild colours or sizes outside tokens.css and the artwork renderer.');
