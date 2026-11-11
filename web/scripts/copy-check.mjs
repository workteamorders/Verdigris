// Scans the built site's visible text (out/**/*.html, except /styleguide) and the source for banned wording.
// A sentence that negates the word ("no rewards", "not financial advice") is allowed.
import fs from 'node:fs';
import path from 'node:path';

const BANNED = [
  'earn', 'earning', 'earnings', 'yield', 'profit', 'profits', 'passive income', 'apy', 'reward', 'rewards', 'dividend', 'dividends',
  'invest', 'investment', 'investments', 'investor', 'investors', 'guaranteed', 'moon', 'to the moon', 'floor price', 'will appreciate', 'gain value',
  'verified', 'audited',
];
const MESO = ['aztec', 'maya', 'mexica', 'tonalpohualli'];
const NEGATION = /\b(no|not|never|without|nor|cannot|can't|isn't|aren't|won't|doesn't|don't|neither|nothing)\b/i;

const root = path.resolve('out');
if (!fs.existsSync(root)) { console.error('Run `pnpm build` first: out/ is missing.'); process.exit(1); }

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name === 'styleguide' || e.name === '_next') continue; yield* walk(p); }
    else if (e.name.endsWith('.html')) yield p;
  }
}
const visible = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<svg[\s\S]*?<\/svg>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');

let bad = 0, pages = 0;
for (const file of walk(root)) {
  pages++;
  const text = visible(fs.readFileSync(file, 'utf8'));
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const s of sentences) {
    const low = s.toLowerCase();
    for (const w of BANNED) {
      if (new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(low) && !NEGATION.test(s)) { bad++; console.log(`BANNED "${w}" in ${path.relative(root, file)}: ${s.trim().slice(0, 140)}`); }
    }
    for (const w of MESO) if (new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(low)) { bad++; console.log(`FORBIDDEN "${w}" in ${path.relative(root, file)}: ${s.trim().slice(0, 140)}`); }
  }
}
// Source scan for the forbidden cultural words (comments included).
function* src(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* src(p); else if (/\.(ts|tsx|css|mjs)$/.test(e.name)) yield p;
  }
}
for (const f of src(path.resolve('src'))) {
  const t = fs.readFileSync(f, 'utf8').toLowerCase();
  for (const w of MESO) if (new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(t)) { bad++; console.log(`FORBIDDEN "${w}" in ${path.relative('.', f)}`); }
}
console.log(bad ? `copy:check FAILED with ${bad} finding(s)` : `copy:check ok: ${pages} pages scanned, no banned wording`);
process.exit(bad ? 1 : 0);
