import type { ReactNode } from 'react';
import styles from './Layout.module.css';

export function PageHead({ eyebrow, title, lead, children }: { eyebrow?: string; title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <header className={`container ${styles.head}`}>
      {eyebrow ? <p className="label">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      {children}
    </header>
  );
}

export function Section({ title, id, children, lead }: { title?: string; id?: string; children: ReactNode; lead?: ReactNode }) {
  return (
    <section className={`container ${styles.section}`} aria-labelledby={id ? `${id}-h` : undefined} id={id}>
      {title ? <h2 id={id ? `${id}-h` : undefined}>{title}</h2> : null}
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      {children}
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className={styles.prose}>{children}</div>;
}

export function Grid({ cols = 3, children }: { cols?: 2 | 3; children: ReactNode }) {
  return <div className={`${styles.grid} ${cols === 2 ? styles.two : styles.three}`}>{children}</div>;
}

/** Definition list of label and value pairs. */
export function Facts({ items, stacked = false }: { items: ReadonlyArray<readonly [string, ReactNode]>; stacked?: boolean }) {
  return (
    <dl className={`${styles.facts} ${stacked ? styles.stacked : ''}`}>
      {items.map(([k, v]) => (
        <div key={k} className={styles.fact}>
          <dt className="label">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}
