#!/usr/bin/env python3
"""Generates web/src/components/Frame.module.css: eight cast-bronze frames, each with its own engraved border and corner pieces.
Every value is a token; nothing here is a raw colour or size."""
import sys

S, H, M, L, D = ('var(--metal-spec)', 'var(--metal-hi)', 'var(--metal-mid)', 'var(--metal-lo)', 'var(--metal-deep)')
OX, OXH, OXT = 'var(--patina-deep)', 'var(--patina)', 'var(--patina-text)'
W = 'var(--frame-w)'
SP1, SP2, SP3 = 'var(--space-1)', 'var(--space-2)', 'var(--space-3)'


def a(c, p):
    return f'color-mix(in srgb, {c} {p}%, transparent)'


SIDES = {  # along-angle, outer->inner angle
    'top': ('90deg', '180deg'),
    'bottom': ('90deg', '0deg'),
    'left': ('180deg', '90deg'),
    'right': ('180deg', '270deg'),
}
LIT = ('top', 'left')


def tone(side, groove=False):
    _, x = SIDES[side]
    if groove:
        return f'linear-gradient({x}, {a(S,70)} 0 1px, {M} 1px, {D} 34%, {D} 66%, {M} calc(100% - 1px), {a(D,80) if side in LIT else a(S,45)} calc(100% - 1px) 100%)'
    if side in LIT:
        return f'linear-gradient({x}, {a(S,85)} 0 1px, {H} 1px, {M} calc(100% - 1px), {a(D,85)} calc(100% - 1px) 100%)'
    return f'linear-gradient({x}, {a(D,85)} 0 1px, {L} 1px, {M} calc(100% - 1px), {a(S,50)} calc(100% - 1px) 100%)'


def across(side, soft=0.0):
    """A tube-like shading across the strip, for rope."""
    _, x = SIDES[side]
    return f'linear-gradient({x}, {a(S,35)} 0, transparent 38%, {a(D,55)} 100%)'


# Each pattern returns a list of (image, size, repeat) layers, drawn above the tone.
def p_reed(side):
    A, _ = SIDES[side]
    return [(f'repeating-linear-gradient({A}, {a(S,55)} 0, transparent calc({SP1} / 2), {a(D,65)} {SP1})', f'{W} {W}', 'repeat')]


def p_bead(side):
    return [
        (f'radial-gradient(circle closest-side at 36% 32%, {S} 0, {a(S,0)} 46%)', f'{W} {W}', 'repeat'),
        (f'radial-gradient(circle closest-side at 50% 50%, {H} 0, {M} 52%, {L} 80%, {D} 90%, transparent 93%)', f'{W} {W}', 'repeat'),
    ]


def p_dentil(side):
    A, X = SIDES[side]
    return [
        (f'repeating-linear-gradient({A}, {a(S,60)} 0 1px, {H} 1px 3px, {L} 3px {SP1}, {D} {SP1} calc({SP1} * 2))', f'{W} {W}', 'repeat'),
        (f'linear-gradient({X}, {a(S,25)} 0, transparent 30%, {a(D,45)} 100%)', '100% 100%', 'no-repeat'),
    ]


def p_rope(side):
    return [
        (across(side), '100% 100%', 'no-repeat'),
        (f'repeating-linear-gradient(55deg, {a(D,70)} 0 1px, transparent 1px 2px, {a(S,30)} 2px 3px, transparent 3px {SP1})', f'{W} {W}', 'repeat'),
    ]


def p_lozenge(side):
    return [
        (f'repeating-linear-gradient(45deg, {a(D,55)} 0 1px, transparent 1px {SP2})', f'{W} {W}', 'repeat'),
        (f'repeating-linear-gradient(135deg, {a(S,38)} 0 1px, transparent 1px {SP2})', f'{W} {W}', 'repeat'),
    ]


def p_moulding(side):
    _, x = SIDES[side]
    if side in LIT:
        st = f'{a(S,70)} 0 1px, {H} 1px 18%, {D} 18% 26%, {M} 26% 52%, {a(S,45)} 52% 58%, {L} 58% 70%, {D} 70% 76%, {M} 76% 100%'
    else:
        st = f'{a(D,80)} 0 1px, {M} 1px 22%, {D} 22% 30%, {L} 30% 52%, {a(S,35)} 52% 57%, {M} 57% 72%, {D} 72% 78%, {H} 78% 100%'
    return [(f'linear-gradient({x}, {st})', '100% 100%', 'no-repeat')]


def p_scale(side):
    c = f'radial-gradient(circle at 50% 100%, {M} 0 46%, {a(D,85)} 47% 53%, {a(S,40)} 54% 57%, transparent 60%)'
    return [
        (c, f'{SP3} {SP3}', 'repeat'),
        (c.replace('circle at 50% 100%', 'circle at 50% 100%'), f'{SP3} {SP3}', 'repeat'),
    ]


def p_inlay(side):
    _, x = SIDES[side]
    return [
        (f'linear-gradient({x}, transparent 0 28%, {a(D,80)} 28% 32%, {OX} 32% 68%, {a(OXT,55)} 48% 52%, {a(D,80)} 68% 72%, transparent 72%)', '100% 100%', 'no-repeat'),
        (f'repeating-linear-gradient(155deg, {a(OXT,22)} 0 1px, transparent 1px {SP1})', '100% 100%', 'no-repeat'),
    ]


# name: (pattern fn, tone is a groove, boss css)
def boss_dome():
    return f"""border-radius: var(--radius-round);
  background: radial-gradient(circle at 34% 30%, {S} 0 6%, {H} 24%, {M} 54%, {L} 82%, {D} 100%);
  box-shadow: 0 2px 3px {a(D,85)}, inset 0 0 0 1px {a(D,55)};"""


def boss_pyramid():
    return f"""clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  background: radial-gradient(circle at 50% 50%, {a(S,70)} 0, transparent 22%), conic-gradient({S} 0 90deg, {M} 90deg 180deg, {L} 180deg 270deg, {H} 270deg 360deg);
  filter: drop-shadow(0 2px 2px {a(D,85)});"""


def boss_hex():
    return f"""clip-path: polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0 50%);
  background: radial-gradient(circle at 40% 36%, {a(S,60)} 0, {M} 26%, {L} 34%, {a(D,90)} 38%, transparent 40%), conic-gradient(from 30deg, {H} 0 60deg, {M} 60deg 120deg, {L} 120deg 180deg, {M} 180deg 240deg, {H} 240deg 300deg, {S} 300deg 360deg);
  filter: drop-shadow(0 2px 2px {a(D,85)});"""


def boss_rosette():
    return f"""border-radius: var(--radius-round);
  background: radial-gradient(circle at 36% 32%, {a(S,85)} 0 6%, transparent 24%), repeating-radial-gradient(circle at 50% 50%, {M} 0, {H} 1px, {L} 2px, {D} 3px);
  box-shadow: 0 2px 3px {a(D,85)}, inset 0 0 0 1px {a(D,60)};"""


def boss_plate():
    return f"""background: radial-gradient(circle at 36% 32%, {S} 0 5%, {H} 20%, {M} 38%, {L} 47%, {D} 49%, transparent 51%), linear-gradient(135deg, {H}, {M} 50%, {L});
  box-shadow: 0 2px 3px {a(D,85)}, inset 1px 1px 0 {a(S,70)}, inset -1px -1px 0 {a(D,80)};"""


def boss_screw():
    return f"""border-radius: var(--radius-round);
  background: linear-gradient(var(--slot, 20deg), transparent 43%, {D} 45% 55%, {a(S,40)} 57%, transparent 60%), radial-gradient(circle at 34% 30%, {S} 0 6%, {H} 26%, {M} 56%, {L} 84%, {D} 100%);
  box-shadow: 0 2px 3px {a(D,85)}, inset 0 0 0 1px {a(D,55)};"""


def boss_bezel():
    return f"""border-radius: var(--radius-round);
  background: radial-gradient(circle at 36% 32%, {a(S,55)} 0 6%, transparent 20%), radial-gradient(circle closest-side, {D} 0 38%, {L} 46%, {M} 52%, {H} 66%, {S} 70%, {M} 84%, {D} 100%);
  box-shadow: 0 2px 3px {a(D,85)};"""


def boss_cabochon():
    return f"""border-radius: var(--radius-round);
  background: radial-gradient(circle at 34% 30%, {OXT} 0 5%, {OXH} 22%, {OX} 46%, {D} 62%, transparent 64%), radial-gradient(circle closest-side, transparent 0 60%, {H} 64%, {S} 68%, {M} 82%, {D} 100%);
  box-shadow: 0 2px 3px {a(D,85)};"""


VARIANTS = [
    ('reed', p_reed, False, boss_dome),
    ('bead', p_bead, True, boss_pyramid),
    ('dentil', p_dentil, False, boss_hex),
    ('rope', p_rope, False, boss_rosette),
    ('lozenge', p_lozenge, False, boss_plate),
    ('moulding', p_moulding, False, boss_screw),
    ('scale', p_scale, False, boss_bezel),
    ('inlay', p_inlay, False, boss_cabochon),
]


def stack(side, pat, groove):
    layers = pat(side) + [(tone(side, groove), '100% 100%', 'no-repeat')]
    return layers


def decl(layers, pos=None):
    img = ',\n    '.join(l[0] for l in layers)
    size = ', '.join(l[1] for l in layers)
    rep = ', '.join(l[2] for l in layers)
    out = f'background-image:\n    {img};\n  background-size: {size};\n  background-repeat: {rep};'
    return out


out = []
out.append('/* GENERATED by tools/gen-frames.py. Edit the generator, not this file. Every value is a token. */\n')
out.append(f""".frame {{
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: {W};
  background-color: {M};
  box-shadow: var(--frame-shadow);
}}
.frame::before,
.frame::after {{
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: {W};
  pointer-events: none;
  z-index: 0;
}}
.frame::before {{ top: 0; }}
.frame::after {{ bottom: 0; }}
/* Grain, over the whole border. */
.grain {{
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background-image: var(--grain);
  opacity: 0.35;
}}
.face {{
  position: relative;
  z-index: 2;
  flex: 1;
  min-width: 0;
  background-color: var(--face, var(--surface));
  background-image: linear-gradient(180deg, {a('var(--surface-2)', 70)}, transparent 46%);
  box-shadow:
    inset 2px 2px 3px {a(D,80)},
    inset 0 0 {SP3} {a(D,45)},
    inset -1px -1px 0 {a(H,55)};
  padding: var(--space-5);
}}
@media (min-width: 48em) {{
  .face {{ padding: var(--space-6); }}
}}
.boss {{
  position: absolute;
  z-index: 3;
  width: var(--boss);
  height: var(--boss);
  pointer-events: none;
}}
.boss:nth-of-type(1) {{ top: calc(var(--frame-w) * -0.375); left: calc(var(--frame-w) * -0.375); --slot: 25deg; }}
.boss:nth-of-type(2) {{ top: calc(var(--frame-w) * -0.375); right: calc(var(--frame-w) * -0.375); --slot: 100deg; }}
.boss:nth-of-type(3) {{ bottom: calc(var(--frame-w) * -0.375); left: calc(var(--frame-w) * -0.375); --slot: 160deg; }}
.boss:nth-of-type(4) {{ bottom: calc(var(--frame-w) * -0.375); right: calc(var(--frame-w) * -0.375); --slot: 70deg; }}
""")

for name, pat, groove, boss in VARIANTS:
    sel = f".frame[data-frame='{name}']"
    for side in ('left', 'right'):
        pass
    # left/right strips on the element itself: two stacks side by side.
    left = stack('left', pat, groove)
    right = stack('right', pat, groove)
    # sizes on strips: pattern tiles stay square, tone fills the strip
    def strip(layers, pos):
        res = []
        for img, size, rep in layers:
            if size == '100% 100%':
                size = f'{W} 100%'
                rep = 'no-repeat'
            else:
                rep = 'repeat-y'
            res.append((img, size, rep, pos))
        return res
    allL = strip(left, 'left top') + strip(right, 'right top')
    img = ',\n    '.join(l[0] for l in allL)
    out.append(f"""{sel} {{
  background-image:
    {img};
  background-size: {', '.join(l[1] for l in allL)};
  background-repeat: {', '.join(l[2] for l in allL)};
  background-position: {', '.join(l[3] for l in allL)};
}}""")
    for side, pseudo in (('top', '::before'), ('bottom', '::after')):
        layers = stack(side, pat, groove)
        out.append(f"""{sel}{pseudo} {{
  {decl([(l[0], l[1] if l[1] != '100% 100%' else '100% 100%', 'repeat-x' if l[2]=='repeat' else l[2]) for l in layers])}
}}""")
    out.append(f"""{sel} .boss {{
  {boss()}
}}""")
out.append("""@media (prefers-reduced-motion: no-preference) {
  .linked .face { transition: background-color var(--dur-element) var(--ease-out); }
}
""")
open(sys.argv[1], 'w').write('\n'.join(out))
