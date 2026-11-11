'use client';

import Link from 'next/link';
import { Wheel } from '@/components/Wheel';
import { TiltCard } from '@/components/TiltCard';
import { PatinaScrubber } from '@/components/PatinaScrubber';
import { Panel } from '@/components/Panel';
import { Facts, Grid, Section } from '@/components/Layout';
import { useCount } from '@/lib/chain-data';
import { SIGNS } from '@/lib/signs';
import { formatCountdown } from '@/lib/format';
import { formatEthWei, wheelFor } from '@/lib/wheel';
import styles from './HomeView.module.css';

const LEVEL_AT = ['Minted or moved', '3 days unmoved', '14 days unmoved', '45 days unmoved', '120 days unmoved'];

export function HomeView() {
  const count = useCount();
  const wheel = wheelFor(count);
  const t = count.today;

  return (
    <>
      <section className={styles.stage} aria-labelledby="exhibit-title">
        <div className={`container ${styles.exhibit}`}>
          <h1 id="exhibit-title">Time leaves a mark.</h1>
          <figure className={styles.figure}>
            <div className={styles.wheel}>
              <TiltCard round={false} max={3}>
                <Wheel {...wheel} featured />
              </TiltCard>
            </div>
            <figcaption className={styles.caption}>
              <p className="label">The 84-Day Count</p>
              <p className={styles.lead}>
                Each Day of the Count sets the Sign and Numeral for that Day’s bronze Disc. Its image is drawn on-chain.
              </p>
              <nav className={styles.actions} aria-label="Explore the Count">
                <Link href="/calendar/" className={`${styles.cta} ${styles.primary}`}>Explore the Calendar</Link>
                <Link href="/mint/" className={styles.cta}>
                  {count.status === 'live' ? "Mint today's Disc" : 'Open Mint'}
                </Link>
              </nav>
            </figcaption>
          </figure>
        </div>
      </section>

      <Section id="patina">
        <div className={styles.patina}>
          <div className={styles.patinaIntro}>
            <h2 id="patina-h">Five stages of Patina</h2>
            <p className="dim">Move the slider to see how bronze changes while a Disc stays unmoved.</p>
          </div>
          <Panel frame="moulding">
            <PatinaScrubber when={LEVEL_AT} initialLevel={0} />
          </Panel>
          <p className={styles.thresholdNote}>Thresholds shown are the mainnet defaults.</p>
        </div>
      </Section>

      <Section title="Today">
        {t ? (
          <Panel frame="reed">
            <div className={styles.today}>
              <div>
                <p className="label">Day {t.day + 1} of 84</p>
                <h3>
                  {SIGNS[t.sign]?.name}, Numeral {t.numeral}
                </h3>
                <p className="dim">{t.tier} tier</p>
              </div>
              <Facts
                items={[
                  ['Price', formatEthWei(t.priceWei)],
                  ['Left today', `${t.cap - t.minted} of ${t.cap}`],
                  ['Next Day opens in', <span key="n" className="mono">{formatCountdown(count.secondsToNextDay ?? 0)}</span>],
                ]}
              />
            </div>
          </Panel>
        ) : (
          <Panel frame="bead">
            <p>
              {count.status === 'undeployed'
                ? 'No deployment is connected to this build yet, so there is no live Day to show. The wheel shows a preview.'
                : count.status === 'before'
                  ? 'The Count has not started. Day 1 opens when the countdown in the wheel reaches zero.'
                  : count.status === 'ended'
                    ? 'The Count has ended. No more Discs can be minted. Every Disc keeps aging on its holder\'s shelf.'
                    : count.status === 'error'
                      ? 'The site could not read the chain just now. Nothing was changed. Reload to try again.'
                      : 'Reading the chain.'}
            </p>
          </Panel>
        )}
      </Section>

      <Section title="How it works" chapter={{ n: 1, label: 'The rule' }}>
        <Grid cols={3}>
          <Panel frame="dentil">
            <h3>Time sets the identity</h3>
            <p>
              No draw, no reveal. The Day decides the Sign (one of 12) and the Numeral (one of 7). Numerals 1 to 4 are Ordinary, 5 and 6 are Fine, and 7 is Crown. At most 1,632 Discs will ever exist.
            </p>
          </Panel>
          <Panel frame="rope">
            <h3>Patina follows the clock</h3>
            <p>A fresh Disc is clean bronze. The longer it sits unmoved, the more verdigris spreads from the rim. The contract works the level out from the time of the last move.</p>
          </Panel>
          <Panel frame="lozenge">
            <h3>Any move starts it over</h3>
            <p>Selling, sending or even transferring a Disc to yourself resets its Patina to clean bronze. Approvals alone do not. Nothing about Patina is a promise about value.</p>
          </Panel>
        </Grid>
      </Section>

      <Section title="What this is, and is not" chapter={{ n: 2, label: 'The promise' }}>
        <Grid cols={2}>
          <Panel frame="scale">
            <h3>What it is</h3>
            <ul className={styles.list}>
              <li>A collection of at most 1,632 ERC-721 Discs, one design per Day.</li>
              <li>Images drawn by the contract itself, with no external file to go missing.</li>
              <li>Contracts with no owner, no admin and no upgrade path.</li>
            </ul>
          </Panel>
          <Panel frame="inlay">
            <h3>What it is not</h3>
            <ul className={styles.list}>
              <li>Not a token, and nothing to trade except the Discs themselves.</li>
              <li>No rewards, no staking, no whitelist, no promises about the future.</li>
              <li>Not financial advice. Read the <Link href="/risk/">risks</Link> before you pay for anything.</li>
            </ul>
          </Panel>
        </Grid>
      </Section>
    </>
  );
}
