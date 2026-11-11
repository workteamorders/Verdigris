import Link from 'next/link';
import { CONFIG } from '@/lib/config';
import { MotionToggle } from './MotionToggle';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.cols}>
          <div>
            <p className={styles.mark}>Verdigris</p>
            <p className="dim">Digital collectibles, drawn fully on-chain. One Sign and one Numeral each Day, for 84 Days.</p>
          </div>
          <nav aria-label="Footer" className={styles.links}>
            <Link href="/rules/">Rules</Link>
            <Link href="/contracts/">Contracts</Link>
            <Link href="/risk/">Risk and Terms</Link>
            {CONFIG.sourceUrl ? <a href={CONFIG.sourceUrl}>Source code</a> : null}
          </nav>
          <p className={styles.audit}>
            {CONFIG.auditReportUrl ? (
              <a href={CONFIG.auditReportUrl}>Read the audit report</a>
            ) : (
              <>
                <span className="label">Audit</span>
                <br />
                No external audit yet
              </>
            )}
          </p>
        </div>
        <div>
          <MotionToggle />
        </div>
        <p className={`dim ${styles.legal}`}>
          Verdigris Discs are digital collectibles, not financial advice. Verdigris is not affiliated with Robinhood, with any blockchain or marketplace, or with the reference collection that inspired its mood.
          Nothing here is an offer or a promise about future value.
        </p>
      </div>
    </footer>
  );
}
