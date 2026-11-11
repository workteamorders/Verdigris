'use client';

import Link from 'next/link';
import { Wheel } from '@/components/Wheel';
import { HeroArt } from '@/components/HeroArt';
import { Ticker } from '@/components/Ticker';
import { TiltCard } from '@/components/TiltCard';
import { PatinaScrubber } from '@/components/PatinaScrubber';
import { Plate } from '@/components/Ornament';
import { Disc } from '@/components/Disc';
import { Badge } from '@/components/Badge';
import { Panel } from '@/components/Panel';
import { Button } from '@/components/Button';
import { Facts, Grid, Section } from '@/components/Layout';
import { useCount } from '@/lib/chain-data';
import { SIGNS } from '@/lib/signs';
import { LEVEL_NAMES, type PatinaLevel } from '@/lib/patina';
import { formatCountdown } from '@/lib/format';
import { formatEthWei, wheelFor } from '@/lib/wheel';
import styles from './HomeView.module.css';

const EXAMPLE_LEVELS: readonly PatinaLevel[] = [0, 1, 2, 3, 4];
const LEVEL_AT = ['Minted or moved', '3 days unmoved', '14 days unmoved', '45 days unmoved', '120 days unmoved'];

export function HomeView() {
  const count = useCount();
  const wheel = wheelFor(count);
  const t = count.today;

  return (
    <>
      <div className={styles.stage}>
        <HeroArt />
      <div className={`container ${styles.hero}`}>
        <div className={styles.copy}>
          <p className="label">An 84-Day Count</p>
          <h1>One Sign and one Numeral each Day. Then time does the rest.</h1>
          <p className={styles.lead}>
            Verdigris Discs are bronze medals drawn fully on-chain. Each Day of the Count opens a single Sign and Numeral. A Disc gains Patina the longer it stays unmoved, and any move resets it.
          </p>
          <div className={styles.actions}>
            <Link href="/mint/" className={styles.cta}>
              <Button variant="primary" size="lg">
                {count.status === 'live' ? "Mint today's Disc" : 'Open Mint'}
              </Button>
            </Link>
            <Link href="/rules/" className={styles.cta}>
              <Button variant="secondary" size="lg">
                Read the rules
              </Button>
            </Link>
          </div>
        </div>
        <div className={styles.wheel}>
          <TiltCard round={false} max={3}>
            <Wheel {...wheel} />
          </TiltCard>
        </div>
      </div>
        <div className={`container ${styles.plate}`}>
          <Plate n={1}>The 84 Days of the Count, one tick each. Every seventh tick is longer, every twelfth longest.</Plate>
        </div>
      </div>
      <Ticker />

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

      <Section title="Five stages of Patina" chapter={{ n: 2, label: 'The clock' }} lead="Preview Discs show the same Sign and Numeral at each level. The thresholds shown are the mainnet defaults.">
        <Panel frame="moulding">
          <PatinaScrubber when={LEVEL_AT} />
        </Panel>
        <ol className={styles.levels}>
          {EXAMPLE_LEVELS.map((l) => (
            <li key={l} className={styles.level} data-reveal>
              <Disc sign={5} numeral={3} serial={7} level={l} />
              <p className={styles.levelName}>
                <Badge tone="patina">{`Level ${l}`}</Badge> {LEVEL_NAMES[l]}
              </p>
              <p className="dim">{LEVEL_AT[l]}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="What this is, and is not" chapter={{ n: 3, label: 'The promise' }}>
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
