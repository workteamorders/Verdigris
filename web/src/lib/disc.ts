// TypeScript port of contracts/src/VerdigrisRenderer.sol (discSvg). Same inputs, same bytes out.
// The site uses it for previews that the contract cannot serve cheaply (the Calendar draws 84 Days, the Mint page draws
// the live Day before anything exists). `pnpm check:parity` compares this port with the output of the compiled contract.
// Layering rule shared with the contract: flat vector layers first, texture filters only on separate overlay layers
// with fill="none", so a Disc stays readable if a marketplace strips filters.
import { keccak256, concatHex, toHex } from 'viem';
import { SIGNS, HALF_DISC_FILL, tierOfNumeral } from './signs';
import type { PatinaLevel } from './patina';

const COS64 =
  '03e803e303d503bd039c0372033f030502c3027a022c01d7017f012200c300620000ff9eff3dfedefe81fe29fdd4fd86fd3dfcfbfcc1fc8efc64fc43fc2bfc1dfc18fc1dfc2bfc43fc64fc8efcc1fcfbfd3dfd86fdd4fe29fe81fedeff3dff9e0000006200c30122017f01d7022c027a02c30305033f0372039c03bd03d503e3';
const NOTCH = '0000fc18030efd9103cf00df01b20385fe4e0385fc3100dffcf2fd91';
const RIVET =
  '03c6010102c402c2010503c5feff03c6fd3e02c4fc3b0105fc3afefffd3cfd3efefbfc3b0101fc3a02c2fd3c03c5fefb';

const EDGE = '#2A1810';
const LINE = '#2A1608';
const RING = '#D9A86E';
const RIVET_C = '#D98A4A';

export interface DiscSvgParams {
  readonly sign: number;
  readonly numeral: number;
  readonly serial: number;
  readonly level: PatinaLevel;
}

function t(tbl: string, i: number): number {
  const v = parseInt(tbl.slice(i * 4, i * 4 + 4), 16);
  return v >= 0x8000 ? v - 0x10000 : v;
}
const pt = (trig: number, r10: number): number => 2000 + Math.trunc((trig * r10) / 1000);
const ii = (v10: number): string => String(Math.floor((v10 + 5) / 10));
const tierIndex = (numeral: number): number => (numeral >= 7 ? 2 : numeral >= 5 ? 1 : 0);

function ringRadii(tier: number): number[] {
  if (tier === 0) return [176, 120];
  if (tier === 1) return [176, 140, 104];
  return [176, 148, 120, 92];
}

function pad32(n: number): `0x${string}` {
  return toHex(n, { size: 32 });
}
const u8 = (n: number): `0x${string}` => toHex(n, { size: 1 });

function defs(h: bigint, level: number): string {
  const washStart = ['0', '.8', '.58', '.34', '.05'];
  const washOp = ['0', '.35', '.55', '.72', '.88'];
  return (
    '<defs><radialGradient id="vb" cx="36%" cy="30%" r="85%"><stop offset="0" stop-color="#BC8149"/><stop offset=".5" stop-color="#8F5A2D"/><stop offset="1" stop-color="#4F2F18"/></radialGradient>' +
    '<linearGradient id="vh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>' +
    `<radialGradient id="vw" cx="50%" cy="50%" r="50%"><stop offset="${washStart[level]}" stop-color="#3E9484" stop-opacity="0"/><stop offset="1" stop-color="${level === 4 ? '#133F43' : '#3E9484'}" stop-opacity="${washOp[level]}"/></radialGradient>` +
    '<clipPath id="vc"><circle cx="200" cy="200" r="190"/></clipPath>' +
    `<filter id="vr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="${h % 97n}" result="n"/><feDiffuseLighting in="n" lighting-color="#8F5A2D" surfaceScale="2.4"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting></filter>` +
    `<filter id="vp" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="${h % 89n}" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="9"/></filter></defs>`
  );
}

function rings(tier: number): string {
  const r = ringRadii(tier);
  let out = `<circle cx="200" cy="200" r="176" fill="none" stroke="${LINE}" stroke-opacity=".18" stroke-width="${r.length === 2 ? '46' : '20'}"/>`;
  for (const x of r) {
    out += `<circle cx="200" cy="200" r="${x}" fill="none" stroke="${LINE}" stroke-width="3.2"/>`;
    out += `<circle cx="200" cy="200" r="${x - 3}" fill="none" stroke="${RING}" stroke-width="1.1" opacity=".55"/>`;
  }
  return out;
}

function notches(numeral: number): string {
  let out = '';
  for (let i = 0; i < 7; i++) {
    const on = i < numeral;
    const r1 = on ? 1640 : 1800;
    const c = t(NOTCH, 2 * i);
    const s = t(NOTCH, 2 * i + 1);
    out += `<line x1="${ii(pt(c, r1))}" y1="${ii(pt(s, r1))}" x2="${ii(pt(c, 1900))}" y2="${ii(pt(s, 1900))}" stroke="${EDGE}" stroke-width="${on ? '9' : '3'}"/>`;
  }
  return out;
}

function rivets(tier: number): string {
  if (tier === 0) return '';
  const rr = tier === 1 ? 1220 : 1340;
  let out = '';
  for (let i = 0; i < 12; i++) {
    const x = pt(t(RIVET, 2 * i), rr);
    const y = pt(t(RIVET, 2 * i + 1), rr);
    out += `<circle cx="${ii(x)}" cy="${ii(y)}" r="6" fill="${RIVET_C}" stroke="${LINE}" stroke-width="1.6"/>`;
    out += `<circle cx="${ii(x - 18)}" cy="${ii(y - 20)}" r="2" fill="#fff" opacity=".6"/>`;
  }
  return out;
}

function crown(tier: number): string {
  if (tier !== 2) return '';
  let studs = '';
  for (let i = 0; i < 4; i++) {
    studs += `<circle cx="${i === 1 ? '258' : i === 3 ? '142' : '200'}" cy="${i === 0 ? '142' : i === 2 ? '258' : '200'}" r="4" fill="${RIVET_C}" stroke="${LINE}" stroke-width="1.2"/>`;
  }
  return `<path d="M200 142L258 200L200 258L142 200Z" fill="none" stroke="${RING}" stroke-width="1.6" opacity=".95"/>${studs}`;
}

function glyph(sign: number, tier: number): string {
  const g = SIGNS[sign] ?? SIGNS[0];
  const d = g?.d ?? '';
  const scale = tier === 0 ? '1.45' : tier === 1 ? '1.15' : '0.85';
  let out = `<g transform="translate(200 200) scale(${scale})" stroke-linejoin="round" stroke-linecap="round">`;
  out += `<path d="${d}" transform="translate(1.4 1.8)" fill="none" stroke="${RING}" stroke-width="3" opacity=".5"/>`;
  out += `<path d="${d}" fill="${g?.solid ? LINE : 'none'}" fill-opacity=".9" stroke="${LINE}" stroke-width="3" fill-rule="evenodd"/>`;
  if (g?.fillHalf) out += `<path d="${HALF_DISC_FILL}" fill="${LINE}"/>`;
  return `${out}</g>`;
}

const PATINA_CFG: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0, 0, 0, 0, 0],
  [8, 8, 16, 800, 6],
  [16, 12, 24, 580, 10],
  [28, 16, 34, 340, 16],
  [40, 20, 44, 50, 24],
];

function hashOf(h: `0x${string}`, kind: number, i: number): bigint {
  return BigInt(keccak256(concatHex([h, u8(kind), pad32(i)])));
}

function blobRadius(r: bigint, tier: number, rin: number): number {
  if (Number(r & 0xffn) < 90) {
    const rs = ringRadii(tier);
    return (rs[Number((r >> 16n) % BigInt(rs.length))] ?? 0) * 10 + Number((r >> 24n) % 7n) * 10 - 30;
  }
  const s = Math.floor(Math.sqrt(Number((r >> 32n) % 10000n) * 10000));
  return Math.floor((1900 * (rin + Math.floor(((1000 - rin) * s) / 10000))) / 1000);
}

function blob(r: bigint, tier: number, smin: number, smax: number, rin: number): string {
  const rad = blobRadius(r, tier, rin);
  const ai = Number((r >> 8n) & 63n);
  const size = smin + Number((r >> 48n) % BigInt(smax - smin + 1));
  const op = 32 + Number((r >> 80n) % 31n);
  return `<circle cx="${ii(pt(t(COS64, ai), rad))}" cy="${ii(pt(t(COS64, (ai + 48) & 63), rad))}" r="${size}" opacity=".${op}"/>`;
}

function speck(r: bigint): string {
  const ai = Number(r & 63n);
  const rad = 1500 + Number((r >> 8n) % 380n);
  return `<circle cx="${ii(pt(t(COS64, ai), rad))}" cy="${ii(pt(t(COS64, (ai + 48) & 63), rad))}" r="${2 + Number((r >> 24n) % 5n)}" opacity=".${50 + Number((r >> 32n) % 40n)}"/>`;
}

function patina(h: `0x${string}`, level: number, tier: number): string {
  if (level === 0) return '';
  const [n, smin, smax, rin, nf] = PATINA_CFG[level] ?? PATINA_CFG[0]!;
  const group = (deep: boolean): string => {
    let out = '';
    for (let i = 0; i < n; i++) {
      const r = hashOf(h, 1, i);
      if ((r >> 72n) % 3n === 2n !== deep) continue;
      out += blob(r, tier, smin, smax, rin);
    }
    return out;
  };
  let specks = '';
  for (let i = 0; i < nf; i++) specks += speck(hashOf(h, 2, i));
  return `<g filter="url(#vp)"><circle cx="200" cy="200" r="190" fill="url(#vw)"/><g fill="#3E9484">${group(false)}</g><g fill="#1E5C59">${group(true)}</g><g fill="#79D1BA">${specks}</g></g>`;
}

/** The exact SVG document the contract returns for this Disc. */
export function discSvg(p: DiscSvgParams): string {
  const tier = tierIndex(p.numeral);
  const h = keccak256(concatHex([toHex('verdigris/0'), u8(p.sign), u8(p.numeral), u8(p.serial)]));
  const hn = BigInt(h);
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">${defs(hn, p.level)}`;
  out += `<circle cx="200" cy="200" r="192" fill="${EDGE}"/><g clip-path="url(#vc)"><circle cx="200" cy="200" r="190" fill="url(#vb)"/>`;
  out += '<rect width="400" height="400" fill="none" filter="url(#vr)" opacity="0.3"/><circle cx="200" cy="200" r="190" fill="url(#vh)"/>';
  out += rings(tier) + notches(p.numeral) + rivets(tier) + crown(tier) + glyph(p.sign, tier);
  out += `${patina(h, p.level, tier)}</g></svg>`;
  return out;
}

export interface DiscInlineOptions {
  /** Unique prefix so several Discs can share one HTML page without clashing ids. */
  readonly idPrefix: string;
  /** Strip the texture filters: shows the look a filter-stripping marketplace would produce. */
  readonly noFilters?: boolean;
}

/** The SVG's inner markup with re-prefixed ids, for inlining into a page. */
export function discInline(p: DiscSvgParams, o: DiscInlineOptions): string {
  let s = discSvg(p);
  s = s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  if (o.noFilters) {
    s = s.replace(/<rect width="400" height="400" fill="none" filter="url\(#vr\)" opacity="0.3"\/>/, '').replace(' filter="url(#vp)"', '');
  }
  return s.replace(/id="v([a-z])"/g, `id="${o.idPrefix}$1"`).replace(/url\(#v([a-z])\)/g, `url(#${o.idPrefix}$1)`);
}

export function tierNameOf(numeral: number) {
  return tierOfNumeral(numeral);
}
