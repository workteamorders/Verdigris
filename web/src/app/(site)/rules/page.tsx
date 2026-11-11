import type { Metadata } from 'next';
import { Facts, Grid, PageHead, Prose, Section } from '@/components/Layout';
import { Panel } from '@/components/Panel';
import { activeDeployment } from '@/lib/deployments';
import { LEVEL_NAMES, MAINNET_PATINA_THRESHOLDS_DAYS } from '@/lib/patina';
import { formatEthWei } from '@/lib/wheel';

export const metadata: Metadata = {
  title: 'Rules',
  description: 'How the Count, Signs, Numerals, tiers, limits, payment and Patina work. Every rule is enforced by the contract.',
};

const days = (s: number): string => (s % 86400 === 0 ? `${s / 86400} days` : `${s} seconds`);

export default function Page() {
  const dep = activeDeployment();
  const price = (k: 'ordinary' | 'fine' | 'crown'): string => (dep ? formatEthWei(BigInt(dep.pricesWei[k])) : 'Set when the contract is deployed');
  const thresholds = dep ? dep.patinaSeconds.map(days) : MAINNET_PATINA_THRESHOLDS_DAYS.map((d) => `${d} days`);

  return (
    <>
      <PageHead eyebrow="Rules" title="How it works" lead="Every rule on this page is enforced by the contract, not by the website. If this page and the contract ever disagree, the contract is right." />

      <Section title="The Count" id="count">
        <Prose>
          <p>
            The Count has 84 Days. Day 1 begins at a fixed time written into the contract, and each Day lasts 24 hours on the real Count. When Day 84 ends, minting is over for good.
          </p>
          <p>
            The Day alone decides what can be minted that Day: a Sign (one of 12) and a Numeral (one of 7). The Sign is the Day number modulo 12. The Numeral is the Day number modulo 7, plus one. Because 12 and 7 share no factor, all 84 Days are different pairs. There is no randomness and no reveal.
          </p>
        </Prose>
      </Section>

      <Section title="Tiers and supply" id="tiers">
        <Grid cols={3}>
          <Panel frame="dentil">
            <div style={{ padding: 'var(--space-4)' }}>
              <h3>Ordinary</h3>
              <p className="dim">Numerals 1 to 4</p>
              <Facts stacked items={[['Per Day', '24 Discs'], ['Days', '48'], ['Price', price('ordinary')]]} />
            </div>
          </Panel>
          <Panel frame="rope">
            <div style={{ padding: 'var(--space-4)' }}>
              <h3>Fine</h3>
              <p className="dim">Numerals 5 and 6</p>
              <Facts stacked items={[['Per Day', '16 Discs'], ['Days', '24'], ['Price', price('fine')]]} />
            </div>
          </Panel>
          <Panel frame="lozenge">
            <div style={{ padding: 'var(--space-4)' }}>
              <h3>Crown</h3>
              <p className="dim">Numeral 7</p>
              <Facts stacked items={[['Per Day', '8 Discs'], ['Days', '12'], ['Price', price('crown')]]} />
            </div>
          </Panel>
        </Grid>
        <Prose>
          <p>The most that can ever exist is 48 × 24 + 24 × 16 + 12 × 8 = 1,632 Discs. If a Day does not sell out, the Discs it did not sell are never created.</p>
        </Prose>
      </Section>

      <Section title="Limits and payment" id="payment">
        <Prose>
          <ul>
            <li>At most 2 Discs in one transaction, and at most 2 per wallet for each Day.</li>
            <li>You pay the exact price times the quantity. The contract rejects any other amount, so you cannot overpay by mistake.</li>
            <li>Payments are final. There is no refund path in the contract and nobody who can grant one.</li>
            <li>Limits apply per wallet address. They cannot tell whether several wallets belong to one person.</li>
          </ul>
        </Prose>
      </Section>

      <Section title="Patina" id="patina">
        <Prose>
          <p>
            Patina is the green bloom that spreads over a Disc the longer it stays unmoved. It is computed from the time of the Disc&apos;s last move, so nobody has to push a button for it to happen and nobody can speed it up or hold it back.
          </p>
        </Prose>
        <Facts
          items={[
            [`Level 0, ${LEVEL_NAMES[0]}`, 'From minting, or from the last move, until the first threshold'],
            [`Level 1, ${LEVEL_NAMES[1]}`, `After ${thresholds[0]} unmoved`],
            [`Level 2, ${LEVEL_NAMES[2]}`, `After ${thresholds[1]} unmoved`],
            [`Level 3, ${LEVEL_NAMES[3]}`, `After ${thresholds[2]} unmoved`],
            [`Level 4, ${LEVEL_NAMES[4]}`, `After ${thresholds[3]} unmoved`],
          ]}
        />
        <Prose>
          <p>
            Any transfer resets the Disc to level 0: a sale, a gift, a transfer to your own second wallet, or a transfer to yourself. Approving someone else to move a Disc does not reset it. Patina is part of how a Disc looks. It is not a claim about what a Disc is worth.
          </p>
        </Prose>
      </Section>

      <Section title="Where the money goes" id="money">
        <Prose>
          <p>
            Mint payments stay in the contract until someone calls its public <code>withdraw()</code> function. Anyone can call it, and it can only send the balance to one treasury address fixed at deployment. There is no way to point it anywhere else.
          </p>
          <p>Resale royalties are set at 5% (ERC-2981) to the same treasury address. Royalties are a request that marketplaces may or may not honour.</p>
        </Prose>
      </Section>

      <Section title="What cannot change" id="fixed">
        <Prose>
          <ul>
            <li>The contracts have no owner and no admin functions. They cannot be paused, upgraded or edited.</li>
            <li>Prices, limits, the start time, the treasury and the Patina thresholds were fixed at deployment.</li>
            <li>The image is drawn by the contract from the Disc&apos;s data. There is no external image file.</li>
          </ul>
          <p>
            Because nothing can be changed, a mistake in the contract cannot be fixed either. Read the <a href="/risk/">risks</a>.
          </p>
        </Prose>
      </Section>

      <Section title="Time" id="time">
        <Prose>
          <p>
            The contract reads the network&apos;s block clock. On this kind of network that clock is set by the sequencer and can be a few minutes away from real time, so a Day can open or close a few minutes early or late. Do not plan around the exact minute.
          </p>
        </Prose>
      </Section>
    </>
  );
}
