// WCAG contrast check over the token pairs the UI actually uses. Writes src/lib/contrast.generated.json and fails below threshold.
import { readFileSync, writeFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const tokens = {};
for (const m of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) tokens[m[1]] = m[2];

const lin = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum, what]
const PAIRS = [
  ['text', 'field', 4.5, 'Body text on field'],
  ['text', 'surface', 4.5, 'Body text on slab'],
  ['text', 'surface-2', 4.5, 'Body text on slab 2'],
  ['text-dim', 'field', 4.5, 'Dim text on field'],
  ['text-dim', 'surface', 4.5, 'Dim text on slab'],
  ['text-dim', 'surface-2', 4.5, 'Dim text on slab 2'],
  ['text-dim', 'field-glow', 4.5, 'Dim text on field glow'],
  ['text-dim', 'field-oxide-core', 4.5, 'Dim text on ambient bloom core'],
  ['focus', 'field-oxide-core', 3, 'Focus ring on ambient bloom core (3:1)'],
  ['text-on-accent', 'accent', 4.5, 'Primary button label'],
  ['text-on-accent', 'accent-hover', 4.5, 'Primary button label, hover'],
  ['patina-text', 'surface', 4.5, 'Patina text on slab'],
  ['patina-text', 'field', 4.5, 'Patina text on field'],
  ['patina-text', 'patina-deep', 3, 'Switch edge on checked track (3:1)'],
  ['success', 'success-surface', 4.5, 'Success badge'],
  ['danger', 'danger-surface', 4.5, 'Danger badge and error'],
  ['warning', 'warning-surface', 4.5, 'Warning badge'],
  ['info', 'info-surface', 4.5, 'Info badge'],
  ['success', 'surface', 4.5, 'Success text on slab'],
  ['danger', 'field', 4.5, 'Error text on field'],
  ['danger', 'surface', 4.5, 'Error text on slab'],
  ['text', 'danger-surface', 4.5, 'Text on danger surface'],
  ['text', 'info-surface', 4.5, 'Text on info surface'],
  ['text', 'warning-surface', 4.5, 'Text on warning surface'],
  ['line-strong', 'field', 3, 'Input border on field (3:1)'],
  ['line-strong', 'surface', 3, 'Component edge on slab (3:1)'],
  ['focus', 'surface', 3, 'Focus ring on slab (3:1)'],
  ['focus', 'field', 3, 'Focus ring on field (3:1)'],
  ['accent', 'field', 3, 'Accent edge on field (3:1)'],
];

let failed = 0;
const rows = PAIRS.map(([fg, bg, min, what]) => {
  const f = tokens[fg];
  const b = tokens[bg];
  if (!f || !b) throw new Error(`Unknown token in pair ${fg}/${bg}`);
  const r = Math.round(ratio(f, b) * 100) / 100;
  const pass = r >= min;
  if (!pass) failed += 1;
  return { fg, bg, fgHex: f, bgHex: b, ratio: r, min, pass, what };
});
writeFileSync(new URL('../src/lib/contrast.generated.json', import.meta.url), JSON.stringify(rows, null, 2) + '\n');
for (const r of rows) console.log(`${r.pass ? 'ok  ' : 'FAIL'} ${String(r.ratio).padStart(5)}  (min ${r.min})  ${r.what}`);
if (failed) {
  console.error(`\n${failed} pair(s) below threshold`);
  process.exit(1);
}
console.log(`\nAll ${rows.length} pairs pass.`);
