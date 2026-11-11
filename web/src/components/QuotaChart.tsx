import styles from './QuotaChart.module.css';

export interface QuotaRow {
  tier: string;
  minted: number;
  cap: number;
}

/**
 * Horizontal bars of today's quota. The title is the takeaway, every bar carries its own numbers,
 * and a plain-text table backs it for screen readers. Fill is length and a solid edge, never colour alone.
 */
export function QuotaChart({ title, rows }: { title: string; rows: readonly QuotaRow[] }) {
  return (
    <figure className={styles.fig}>
      <figcaption className={styles.title}>{title}</figcaption>
      <div className={styles.rows} aria-hidden="true">
        {rows.map((r) => (
          <div key={r.tier} className={styles.row} title={`${r.tier}: ${r.minted} of ${r.cap} minted`}>
            <span className={styles.tier}>{r.tier}</span>
            <span className={styles.track}>
              <span className={styles.fill} style={{ width: `${(r.minted / r.cap) * 100}%` }} />
            </span>
            <span className={`${styles.value} mono`}>
              {r.minted} / {r.cap}
            </span>
          </div>
        ))}
      </div>
      <table className="visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Tier</th>
            <th scope="col">Minted today</th>
            <th scope="col">Daily limit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.tier}>
              <th scope="row">{r.tier}</th>
              <td>{r.minted}</td>
              <td>{r.cap}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.axis}>Unit: Discs minted today, of the daily limit for that tier.</p>
    </figure>
  );
}
