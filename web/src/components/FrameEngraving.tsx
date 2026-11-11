import { useId } from 'react';
import type { FrameName } from './Frame';
import styles from './FrameEngraving.module.css';

const cuts: Record<FrameName, string> = {
  reed: 'M2 9Q9 0 16 9Q9 18 2 9ZM5 9Q9 3 13 9Q9 15 5 9ZM9 5V13',
  bead: 'M9 1C10 6 12 8 17 9C12 10 10 12 9 17C8 12 6 10 1 9C6 8 8 6 9 1ZM9 6L12 9L9 12L6 9Z',
  dentil: 'M2 14L9 3L16 14ZM5 12L9 6L13 12ZM7 14V16M11 14V16',
  rope: 'M1 9C5 0 10 1 13 7S11 18 7 14S6 4 10 3S15 6 17 9M1 9C4 15 8 16 12 11',
  lozenge: 'M9 1L17 9L9 17L1 9ZM9 4L14 9L9 14L4 9ZM7 9H11M9 7V11',
  moulding: 'M2 12Q9 1 16 12M4 13Q9 5 14 13M7 14Q9 10 11 14M9 3V1',
  scale: 'M2 5Q9 5 9 15Q9 5 16 5Q15 13 9 15Q3 13 2 5ZM9 2V10',
  inlay: 'M9 1L16 5V13L9 17L2 13V5ZM9 4L13 6.5V11.5L9 14L5 11.5V6.5ZM7 9H11',
};

const corners = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const;
const compactCorners = ['topLeft', 'bottomRight'] as const;
const shell = 'M1 1H80L74 6Q65 11 54 9Q47 17 35 15Q29 29 16 34Q18 47 9 54Q11 66 6 74L1 80Z';
const foliage = 'M7 68C15 55 2 45 15 36C25 29 32 32 34 22C36 11 51 17 55 8M9 59C9 49 15 46 20 46C25 46 25 52 21 52M12 38C11 28 21 23 28 25M31 28C42 30 48 24 47 18M49 13C57 15 63 11 68 6';
const cornerLeaves = 'M13 44Q18 36 25 36Q24 44 13 44ZM15 33Q16 23 24 22Q25 30 15 33ZM30 27Q39 21 44 22Q43 30 30 27ZM38 17Q44 8 51 10Q48 17 38 17ZM8 54Q3 46 8 40Q13 47 8 54Z';
const frond = 'M104 38C86 43 78 15 52 24C41 27 44 39 54 37C62 35 57 28 52 30M89 34C73 16 49 14 33 28C25 34 16 35 7 32M75 26C67 13 50 7 35 14M86 38C71 39 68 53 54 49M44 23C34 20 27 23 21 28';
const crestLeaves = 'M88 35Q80 22 68 24Q72 34 88 35ZM73 25Q68 11 54 12Q58 22 73 25ZM53 20Q44 13 36 16Q42 23 53 20ZM42 24Q25 20 19 30Q30 34 42 24ZM69 42Q55 40 48 49Q60 53 69 42ZM88 39Q78 40 76 49Q84 49 88 39Z';
const beads = [[19, 33], [25, 31], [31, 31], [37, 32], [43, 34], [48, 38], [54, 41], [60, 38], [67, 34], [73, 39], [77, 43]] as const;

function Bronze({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x2="83%" y2="100%">
        <stop offset="0" stopColor="var(--metal-spec)" />
        <stop offset=".24" stopColor="var(--metal-hi)" />
        <stop offset=".55" stopColor="var(--metal-mid)" />
        <stop offset=".76" stopColor="var(--metal-hi)" />
        <stop offset="1" stopColor="var(--metal-lo)" />
      </linearGradient>
    </defs>
  );
}

function Corner({ frame, position }: { frame: FrameName; position: (typeof corners)[number] }) {
  const metal = useId();
  return (
    <svg className={`${styles.corner} ${styles[position]}`} viewBox="0 0 80 80" focusable="false">
      <Bronze id={metal} />
      <path d={shell} className={styles.cast} />
      <path d="M3 4H72L68 7Q60 9 52 7Q45 14 34 12Q28 26 13 33Q15 46 7 53Q9 62 4 71Z" fill={`url(#${metal})`} className={styles.rim} />
      <path d={cornerLeaves} className={styles.leaf} />
      <path d={foliage} className={styles.shadowCut} transform="translate(0.8 1)" />
      <path d={foliage} className={styles.lightCut} />
      <path d="M8 10Q12 5 20 8Q28 9 26 16Q25 23 17 25Q8 25 7 18Z" className={styles.inset} />
      <path d={cuts[frame]} transform="translate(10.6 9.8) scale(.71)" className={styles.sign} />
      <path d="M8 56V64M7 66V69M56 8H64M66 7H69" className={styles.lightCut} />
      <circle cx="5.5" cy="5.5" r="1.1" className={styles.rivet} />
      <circle cx="17" cy="41" r="1.1" className={styles.rivet} />
      <circle cx="43" cy="14" r="1.1" className={styles.rivet} />
    </svg>
  );
}

function Frond({ mirror = false }: { mirror?: boolean }) {
  return (
    <g transform={mirror ? 'translate(220) scale(-1 1)' : undefined}>
      {beads.map(([cx, cy], index) => <circle key={cx} cx={cx} cy={cy} r={index % 3 ? 1.35 : 1.85} className={styles.pearl} />)}
      <path d={crestLeaves} className={styles.leaf} />
      <path d={frond} className={styles.shadowCut} transform="translate(0 1.4)" />
      <path d={frond} className={styles.lightCut} />
    </g>
  );
}

function Crown({ frame }: { frame: FrameName }) {
  const metal = useId();
  return (
    <svg className={styles.crown} viewBox="0 0 220 58" focusable="false">
      <Bronze id={metal} />
      <path d="M1 32C26 36 31 12 55 12C72 12 81 22 94 18L110 2L126 18C139 22 148 12 165 12C189 12 194 36 219 32C205 45 181 36 166 45C150 57 132 49 122 45L110 57L98 45C88 49 70 57 54 45C39 36 15 45 1 32Z" className={styles.cast} />
      <path d="M8 33C28 34 37 15 55 15C71 14 83 26 96 21L110 5L124 21C137 26 149 14 165 15C183 15 192 34 212 33C193 42 181 34 164 43C150 52 133 47 122 42L110 53L98 42C87 47 70 52 56 43C39 34 27 42 8 33Z" fill={`url(#${metal})`} className={styles.rim} />
      <Frond />
      <Frond mirror />
      <path d="M110 8C121 12 128 21 127 31C126 41 118 48 110 51C102 48 94 41 93 31C92 21 99 12 110 8Z" className={styles.inset} />
      <path d="M110 13Q100 17 102 25Q94 25 96 30Q100 38 108 35M110 13Q120 17 118 25Q126 25 124 30Q120 38 112 35M101 28L98 35M119 28L122 35" className={styles.lightCut} />
      <path d="M110 17Q118 22 116 32Q114 41 110 45Q106 41 104 32Q102 22 110 17Z" fill={`url(#${metal})`} className={styles.rim} />
      <path d={cuts[frame]} transform="translate(105.3 24) scale(.52)" className={styles.sign} />
      <circle cx="110" cy="41" r="1.75" className={styles.rivet} />
    </svg>
  );
}

const wingFeathers = [
  'M148 72C117 79 94 63 79 48C59 29 33 33 26 7C18 33 33 53 50 65C69 80 97 96 137 91Z',
  'M147 79C123 91 99 86 77 74C55 62 26 67 13 37C9 60 26 78 53 88C74 97 105 101 141 94Z',
  'M140 87C106 107 79 97 60 94C40 91 25 94 14 80C17 102 43 109 68 109C94 109 121 106 143 99Z',
  'M142 67C118 63 108 54 96 37C82 17 65 25 61 13C57 33 66 46 79 58C97 76 116 81 142 80Z',
  'M139 76C117 78 107 70 98 61C84 46 73 52 62 45C65 64 84 76 98 83C114 92 128 91 143 88Z',
] as const;

function SculptedWing({ metal, mirror = false }: { metal: string; mirror?: boolean }) {
  return (
    <g transform={mirror ? 'translate(320) scale(-1 1)' : undefined}>
      <path d="M5 114C30 116 43 99 69 102C93 105 110 90 139 96L151 113L141 127H47Z" className={styles.cast} />
      {wingFeathers.map((d) => <path key={d} d={d} fill={`url(#${metal})`} className={styles.sculptedRim} />)}
      <path d="M29 21C37 43 67 43 81 61C99 77 117 83 134 79M23 49C39 74 65 68 88 84C104 94 119 94 134 88M25 91C51 104 81 100 99 102M65 24C74 42 93 47 101 59M70 54C89 61 100 84 127 85" className={styles.lightCut} />
      <path d="M35 34L32 43M44 42L41 51M55 47L52 56M66 52L63 63M76 61L73 71M40 73L35 80M52 78L48 85M65 80L61 89M78 86L75 94M91 91L88 99M49 99L47 105M64 101L62 107M80 102L78 108M93 103L92 109" className={styles.shadowCut} />
      <path d="M50 114C61 103 76 111 77 118C78 125 64 126 65 120C65 117 69 116 72 118M84 120C94 106 109 105 117 111C124 116 119 124 112 123C106 122 107 116 112 116M94 117C87 115 84 109 87 105" className={styles.raisedVine} />
      {[[32, 111], [40, 114], [51, 119], [58, 121], [81, 124], [95, 123], [101, 119], [129, 119], [135, 116]].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="1.9" className={styles.pearl} />
      ))}
    </g>
  );
}

function SculptedCrown({ frame }: { frame: FrameName }) {
  const metal = useId();
  return (
    <svg className={styles.sculptedCrown} viewBox="0 0 320 132" focusable="false">
      <Bronze id={metal} />
      <SculptedWing metal={metal} />
      <SculptedWing metal={metal} mirror />
      <path d="M160 4C169 19 183 22 191 40C196 51 194 63 199 74C205 91 195 102 182 107L177 121L160 130L143 121L138 107C125 102 115 91 121 74C126 63 124 51 129 40C137 22 151 19 160 4Z" className={styles.cast} />
      <path d="M160 11C168 24 181 27 187 43C191 54 187 65 195 78C200 90 191 99 179 103L173 118L160 125L147 118L141 103C129 99 120 90 125 78C133 65 129 54 133 43C139 27 152 24 160 11Z" fill={`url(#${metal})`} className={styles.sculptedRim} />
      <path d="M160 17Q161 28 170 35Q175 40 172 45M160 17Q159 28 150 35Q145 40 148 45M139 49C132 54 133 63 140 67M181 49C188 54 187 63 180 67M127 84C132 73 141 78 139 85C137 91 130 87 132 83M193 84C188 73 179 78 181 85C183 91 190 87 188 83M137 95C144 102 152 100 156 94M183 95C176 102 168 100 164 94" className={styles.raisedVine} />
      <circle cx="160" cy="62" r="29" className={styles.cast} />
      <circle cx="160" cy="60" r="26" fill={`url(#${metal})`} className={styles.sculptedRim} />
      <circle cx="160" cy="60" r="20" className={styles.inset} />
      <circle cx="160" cy="60" r="17" className={styles.lightCut} />
      <path d="M160 46Q165 42 168 44M160 46Q155 42 152 44M160 52Q154 47 151 52Q148 60 157 63M160 52Q166 47 169 52Q172 60 163 63M160 50Q167 57 160 71Q153 57 160 50Z" fill={`url(#${metal})`} className={styles.sculptedRim} />
      <circle cx="160" cy="67" r="2.1" className={styles.rivet} />
      <path d="M160 95Q173 104 160 119Q147 104 160 95Z" className={styles.inset} />
      <path d={cuts[frame]} transform="translate(155.1 101) scale(.54)" className={styles.sign} />
    </svg>
  );
}

function Roots() {
  return (
    <svg className={styles.roots} viewBox="0 0 152 34" focusable="false">
      <path d="M2 24Q22 16 41 20Q54 22 65 10Q70 2 76 2Q82 2 87 10Q98 22 111 20Q130 16 150 24L139 29H13Z" className={styles.cast} />
      <path d="M12 24Q29 20 45 23Q63 26 76 10Q89 26 107 23Q123 20 140 24M40 26Q62 28 69 22M112 26Q90 28 83 22M56 17Q66 15 71 11M96 17Q86 15 81 11" className={styles.lightCut} />
      <path d="M76 5Q88 14 76 25Q64 14 76 5Z" className={styles.inset} />
      <path d="M76 9V21M72 15L76 18L80 15" className={styles.lightCut} />
      <circle cx="31" cy="24" r="1.6" className={styles.pearl} />
      <circle cx="121" cy="24" r="1.6" className={styles.pearl} />
    </svg>
  );
}

export function FrameEngraving({ frame, compact = false, featured = false }: { frame: FrameName; compact?: boolean; featured?: boolean }) {
  return (
    <span className={styles.engraving} data-compact={compact || undefined} aria-hidden="true">
      <span className={styles.keylines} />
      {(compact ? compactCorners : corners).map((position) => <Corner key={position} frame={frame} position={position} />)}
      {!compact && <>{featured ? <SculptedCrown frame={frame} /> : <Crown frame={frame} />}<Roots /></>}
    </span>
  );
}
