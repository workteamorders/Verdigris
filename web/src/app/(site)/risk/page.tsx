import type { Metadata } from 'next';
import { PageHead, Prose, Section } from '@/components/Layout';

export const metadata: Metadata = {
  title: 'Risk and Terms',
  description: 'What can go wrong, and the terms of using this site.',
};

export default function Page() {
  return (
    <>
      <PageHead eyebrow="Risk and Terms" title="Read this before you pay" lead="Verdigris Discs are digital collectibles. You can lose everything you spend on them. Last updated 2026-11-11." />

      <Section title="Risks" id="risks">
        <Prose>
          <h3>Payments are final</h3>
          <p>The contract accepts only the exact price and has no refund function. Once a mint is confirmed it cannot be reversed by us, by the network or by anyone else.</p>
          <h3>The contracts cannot be fixed</h3>
          <p>They have no owner and cannot be paused or upgraded. If they contain a bug, it stays. No external audit has been completed yet unless the Contracts page links to a report. Software of this kind can fail in ways nobody expected.</p>
          <h3>The network can fail</h3>
          <p>The network&apos;s operator runs the sequencer that orders transactions. It can be slow, go down, or refuse some transactions, including those linked to sanctioned addresses. Block times can be a few minutes away from real time, so Days can open or close a little early or late.</p>
          <h3>Marketplaces differ</h3>
          <p>Each marketplace draws the image its own way. Some do not apply texture filters, and many cache images, so the Patina on a listing can lag behind what the contract says. The Gallery here is drawn from the contract&apos;s own data.</p>
          <h3>Value is not promised</h3>
          <p>Nothing about the Count, the tiers, the Patina or the supply is a claim that a Disc is or will become worth anything. You may be unable to sell a Disc at all.</p>
          <h3>Your wallet is your responsibility</h3>
          <p>We cannot recover lost keys, reverse a wrong transfer or help with a compromised wallet. We never ask for your seed phrase and no one connected to this site should.</p>
          <h3>Limits are per wallet</h3>
          <p>The per-wallet limits cannot tell whether several wallets belong to one person.</p>
          <h3>Rules, tax and local law</h3>
          <p>Laws about collectibles and digital assets differ by country, and some regions are not offered minting here. Tax treatment is your own responsibility.</p>
        </Prose>
      </Section>

      <Section title="Terms of use" id="terms">
        <Prose>
          <ol>
            <li>This site is a window onto public contracts. The contracts, not the site, decide what happens to your Disc and your payment.</li>
            <li>The site and the contracts are provided as they are, without warranty of any kind, to the fullest extent the law allows.</li>
            <li>You are responsible for choosing to mint and for any transaction you approve in your wallet.</li>
            <li>Verdigris Discs are digital collectibles, not financial advice and not an offer of any security or investment. Nothing here recommends that you buy anything.</li>
            <li>Verdigris is not affiliated with Robinhood, with any blockchain or marketplace, or with the reference collection that inspired its mood.</li>
            <li>The site stores nothing about you on a server. It sets no tracking cookies and uses no analytics. Your wallet and the network see the requests you make.</li>
            <li>Access may be limited by region. If you are in a region where minting is not offered, the site shows a notice and works in view-only mode.</li>
          </ol>
          <p>These terms may change. The date at the top of this page tells you which version you are reading.</p>
        </Prose>
      </Section>
    </>
  );
}
