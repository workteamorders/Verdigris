'use client';

import { useState } from 'react';
import { Badge } from '@/components/Badge';
import { DataTable, type Column } from '@/components/DataTable';
import { Disc } from '@/components/Disc';
import { Facts, Section } from '@/components/Layout';
import { Panel } from '@/components/Panel';
import { QuotaChart } from '@/components/QuotaChart';
import { dayView, priceWei, TIER_CAP, useCount, useDeployment, useMintedAll, type DayView } from '@/lib/chain-data';
import { SIGNS, numeralOfSlot, signOfSlot, tierOfNumeral } from '@/lib/signs';
import { formatDate, formatEthWei } from '@/lib/wheel';
import styles from './CalendarView.module.css';

interface Row {
  readonly day: number;
  readonly sign: string;
  readonly numeral: number;
  readonly tier: string;
  readonly cap: number;
  readonly minted: number | null;
  readonly price: string;
  readonly opens: string;
}

export function CalendarView() {
  const dep = useDeployment();
  const count = useCount();
  const all = useMintedAll();
  const [picked, setPicked] = useState<number | null>(null);
  const todayDay = count.today?.day ?? null;
  const selected = picked ?? todayDay ?? 0;
  const minted = (d: number): number | null => (all.data ? (all.data[d] ?? 0) : null);

  const rows: Row[] = Array.from({ length: 84 }, (_, d) => {
    const numeral = numeralOfSlot(d);
    const tier = tierOfNumeral(numeral);
    return {
      day: d + 1,
      sign: SIGNS[signOfSlot(d)]?.name ?? '',
      numeral,
      tier,
      cap: TIER_CAP[tier],
      minted: minted(d),
      price: dep ? formatEthWei(priceWei(dep, tier)) : 'Set at deployment',
      opens: dep ? formatDate(dep.startTime + d * dep.slotSeconds) : 'After deployment',
    };
  });

  const columns: Column<Row>[] = [
    { key: 'day', header: 'Day', numeric: true, sortable: true, cell: (r) => r.day, sortValue: (r) => r.day },
    { key: 'sign', header: 'Sign', sortable: true, cell: (r) => r.sign, sortValue: (r) => r.sign },
    { key: 'numeral', header: 'Numeral', numeric: true, sortable: true, cell: (r) => r.numeral, sortValue: (r) => r.numeral },
    { key: 'tier', header: 'Tier', sortable: true, cell: (r) => r.tier, sortValue: (r) => r.tier },
    { key: 'minted', header: 'Minted', numeric: true, sortable: true, cell: (r) => (r.minted === null ? 'n/a' : `${r.minted} / ${r.cap}`), sortValue: (r) => r.minted ?? -1 },
    { key: 'price', header: 'Price', numeric: true, cell: (r) => r.price },
    { key: 'opens', header: 'Opens', cell: (r) => r.opens },
  ];

  const view: DayView = dep ? dayView(selected, minted(selected) ?? 0, dep) : { day: selected, sign: signOfSlot(selected), numeral: numeralOfSlot(selected), tier: tierOfNumeral(numeralOfSlot(selected)), cap: TIER_CAP[tierOfNumeral(numeralOfSlot(selected))], minted: 0, priceWei: 0n };
  const mintedSel = minted(selected);

  return (
    <>
      <Section>
        <div className={styles.layout}>
          <div>
            <div className={styles.head} aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} className="label">
                  N{i + 1}
                </span>
              ))}
            </div>
            <ol className={styles.grid} aria-label="The 84 Days, seven per row">
              {Array.from({ length: 84 }, (_, d) => {
                const m = minted(d);
                const cap = TIER_CAP[tierOfNumeral(numeralOfSlot(d))];
                const state = todayDay === null ? 'unknown' : d < todayDay ? 'past' : d === todayDay ? 'today' : 'future';
                const full = m !== null && m >= cap;
                return (
                  <li key={d}>
                    <button
                      type="button"
                      className={styles.cell}
                      data-state={state}
                      data-tier={tierOfNumeral(numeralOfSlot(d))}
                      data-selected={d === selected || undefined}
                      aria-pressed={d === selected}
                      aria-label={`Day ${d + 1}, Sign ${SIGNS[signOfSlot(d)]?.name}, Numeral ${numeralOfSlot(d)}, ${tierOfNumeral(numeralOfSlot(d))}${state === 'today' ? ', today' : ''}${m !== null ? `, ${m} of ${cap} minted` : ''}`}
                      onClick={() => setPicked(d)}
                    >
                      <span className={styles.num}>{d + 1}</span>
                      <svg viewBox="-44 -44 88 88" className={styles.glyph} aria-hidden="true">
                        <path d={SIGNS[signOfSlot(d)]?.d ?? ''} fill={SIGNS[signOfSlot(d)]?.solid ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className={styles.bar} aria-hidden="true">
                        <span style={{ width: m === null ? '0%' : `${Math.min(100, (m / cap) * 100)}%` }} data-full={full || undefined} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="dim">{dep ? 'Bars show how much of each Day has been minted.' : 'No deployment is connected, so supply is not shown. The layout is fixed by the rules.'}</p>
          </div>

          <Panel>
            <div className={styles.detail}>
              <p className="label">Day {selected + 1} of 84{todayDay === selected ? ', today' : ''}</p>
              <h2>
                {SIGNS[view.sign]?.name}, Numeral {view.numeral}
              </h2>
              <p>
                <Badge tone={view.tier === 'Crown' ? 'warning' : view.tier === 'Fine' ? 'info' : 'neutral'}>{view.tier}</Badge>
              </p>
              <div className={styles.preview}>
                <Disc sign={view.sign} numeral={view.numeral} serial={1} level={0} />
              </div>
              <Facts
                items={[
                  ['Supply', `${view.cap} Discs`],
                  ['Minted', mintedSel === null ? 'Not available' : `${mintedSel} of ${view.cap}`],
                  ['Price', dep ? formatEthWei(view.priceWei) : 'Set at deployment'],
                  ['Opens', dep ? formatDate(dep.startTime + selected * dep.slotSeconds) : 'After deployment'],
                ]}
              />
              {mintedSel !== null ? <QuotaChart title={`Day ${selected + 1}: ${mintedSel} of ${view.cap} minted`} rows={[{ tier: view.tier, minted: mintedSel, cap: view.cap }]} /> : null}
            </div>
          </Panel>
        </div>
      </Section>

      <Section title="All 84 Days" lead="The same information as a table you can sort.">
        <DataTable caption="The 84 Days of the Count" columns={columns} rows={rows} rowKey={(r) => String(r.day)} />
      </Section>
    </>
  );
}
