'use client';

import Link from 'next/link';
import { Wheel } from '@/components/Wheel';
import { Reveal } from '@/components/Reveal';
import { PatinaTimeline } from '@/components/PatinaTimeline';
import { CountClock } from '@/components/CountClock';
import { ExposureDivider } from '@/components/Artwork';
import { Panel } from '@/components/Panel';
import { ButtonLink } from '@/components/Button';
import { Facts, Grid, Section } from '@/components/Layout';
import { useCount } from '@/lib/chain-data';
import { SIGNS } from '@/lib/signs';
import { formatEthWei, wheelFor } from '@/lib/wheel';
import styles from './HomeView.module.css';

export function HomeView() {
  const count = useCount();
  const wheel = wheelFor(count);
  const t = count.today;

  return (
    <>
      <div className={`container ${styles.hero}`}>
        <div className={styles.heading}>
          <p className="label">An 84-Day Count</p>
          <h1>Time sets the Disc.</h1>
        </div>
        <div className={styles.wheel}>
          <Wheel {...wheel} example={!t} serial={t ? Math.min(t.cap, t.minted + 1) : undefined} />
        </div>
        <div className={styles.copy}>
          <p className={styles.lead}>
            Each Day opens one Sign and one Numeral. Verdigris Discs are bronze medals drawn fully on-chain. Patina spreads while a Disc stays unmoved. Any move resets it.
          </p>
          <div className={styles.actions}>
            <ButtonLink href="/mint/" variant="primary" size="lg">
              {count.status === 'live' ? "Mint today's Disc" : 'Open Mint'}
            </ButtonLink>
            <ButtonLink href="/rules/" size="lg">Read the rules</ButtonLink>
          </div>
        </div>
      </div>

      <Section title="Today">
        {t ? (
          <Panel>
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
                  ['Next Day opens in', <CountClock key="n" seconds={count.secondsToNextDay} />],
                ]}
              />
            </div>
          </Panel>
        ) : (
          <Panel>
            <p>
              {count.status === 'undeployed'
                ? 'No deployment is connected to this build yet, so there is no live Day to show. The wheel above is an EXAMPLE.'
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

      <Section title="How it works">
        <Reveal>
          <Panel>
            <h3>Time sets the identity</h3>
            <p>
              No draw, no reveal. The Day decides the Sign (one of 12) and the Numeral (one of 7). Numerals 1 to 4 are Ordinary, 5 and 6 are Fine, and 7 is Crown. At most 1,632 Discs will ever exist.
            </p>
          </Panel>
          <Panel>
            <h3>Patina follows the clock</h3>
            <p>A fresh Disc is clean bronze. The longer it sits unmoved, the more verdigris spreads from the rim. The contract works the level out from the time of the last move.</p>
          </Panel>
          <Panel>
            <h3>Any move starts it over</h3>
            <p>Selling, sending or even transferring a Disc to yourself resets its Patina to clean bronze. Approvals alone do not. Nothing about Patina is a promise about value.</p>
          </Panel>
        </Reveal>
      </Section>

      <Section title="Five stages of Patina" lead={count.deployment ? 'Thresholds for the connected Count.' : 'Thresholds for the mainnet Count.'}>
        <ExposureDivider />
        <Panel>
          <PatinaTimeline thresholds={count.deployment?.patinaSeconds} />
        </Panel>
      </Section>

      <Section title="What this is, and is not">
        <Grid cols={2}>
          <Panel>
            <h3>What it is</h3>
            <ul className={styles.list}>
              <li>A collection of at most 1,632 ERC-721 Discs, one design per Day.</li>
              <li>Images drawn by the contract itself, with no external file to go missing.</li>
              <li>Contracts with no owner, no admin and no upgrade path.</li>
            </ul>
          </Panel>
          <Panel>
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
