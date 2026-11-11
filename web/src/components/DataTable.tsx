'use client';

import { useMemo, useState, type ReactNode } from 'react';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header: string;
  /** Numbers and prices: right aligned, tabular figures. */
  numeric?: boolean;
  sortable?: boolean;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
}

interface DataTableProps<T> {
  caption: string;
  columns: ReadonlyArray<Column<T>>;
  rows: readonly T[];
  rowKey: (row: T) => string;
}

/** Sticky header, right-aligned numbers, focusable rows, visible sort state. Below tablet width each row becomes a card. */
export function DataTable<T>({ caption, columns, rows, rowKey }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const sv = col.sortValue;
    const out = [...rows].sort((a, b) => {
      const x = sv(a);
      const y = sv(b);
      return x < y ? -1 : x > y ? 1 : 0;
    });
    return sort.dir === 'asc' ? out : out.reverse();
  }, [rows, columns, sort]);

  return (
    <div className={styles.wrap} tabIndex={0} role="region" aria-label={caption}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th key={c.key} scope="col" className={c.numeric ? styles.numeric : undefined} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : c.sortable ? 'none' : undefined}>
                  {c.sortable ? (
                    <button type="button" className={styles.sortBtn} onClick={() => setSort({ key: c.key, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })}>
                      {c.header}
                      <span aria-hidden="true" className={styles.arrow}>
                        {active ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={rowKey(r)} tabIndex={0}>
              {columns.map((c) => (
                <td key={c.key} data-label={c.header} className={c.numeric ? styles.numeric : undefined}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
