import type { Metadata } from 'next';
import { Facts, PageHead, Prose, Section } from '@/components/Layout';
import { Panel } from '@/components/Panel';
import { EmptyState } from '@/components/States';
import { ABI_SOURCE } from '@/lib/abi.generated';
import { chainById } from '@/lib/chains';
import { CONFIG } from '@/lib/config';
import { activeDeployment } from '@/lib/deployments';
import { formatDate, formatEthWei } from '@/lib/wheel';

export const metadata: Metadata = {
  title: 'Contracts',
  description: 'Contract addresses, fixed parameters and how to check them yourself.',
};

export default function Page() {
  const dep = activeDeployment();
  const chain = chainById(CONFIG.chainId);
  const explorer = chain.blockExplorers?.default.url;
  const link = (kind: 'address' | 'tx', v: string) =>
    explorer ? (
      <a className="mono" href={`${explorer}/${kind}/${v}`} target="_blank" rel="noreferrer noopener">
        {v}
      </a>
    ) : (
      <span className="mono">{v}</span>
    );

  return (
    <>
      <PageHead eyebrow="Contracts" title="What is deployed" lead="Addresses and the values fixed at deployment. Do not trust this page alone: check the same facts on a block explorer." />

      <Section title={dep ? dep.chainName : chain.name}>
        {dep ? (
          <Panel>
            <div style={{ padding: 'var(--space-4)' }}>
              <Facts
                items={[
                  ['Disc contract (ERC-721)', link('address', dep.disc)],
                  ['Renderer contract', link('address', dep.renderer)],
                  ['Treasury (fixed)', link('address', dep.treasury)],
                  ['Chain id', String(dep.chainId)],
                  ['Count starts', formatDate(dep.startTime)],
                  ['Day length', dep.slotSeconds === 86400 ? '24 hours' : `${dep.slotSeconds} seconds (TEST CLOCK)`],
                  ['Price: Ordinary / Fine / Crown', `${formatEthWei(BigInt(dep.pricesWei.ordinary))} / ${formatEthWei(BigInt(dep.pricesWei.fine))} / ${formatEthWei(BigInt(dep.pricesWei.crown))}`],
                  ['Patina levels begin after', dep.patinaSeconds.map((s) => (s % 86400 === 0 ? `${s / 86400}d` : `${s}s`)).join(', ')],
                  ['Deployed in block', String(dep.deployBlock)],
                  ['Deployment transaction', link('tx', dep.deployTx)],
                ]}
              />
            </div>
          </Panel>
        ) : (
          <EmptyState title="Not deployed yet">This build has no contract address for {chain.name}. Addresses appear here once a deployment is added, and nothing on this page should be treated as live until then.</EmptyState>
        )}
      </Section>

      <Section title="Check it yourself" id="check">
        <Prose>
          <ol>
            <li>Open the Disc contract on the block explorer and compare the address with the one above.</li>
            <li>Read the public values (<code>START_TIME</code>, <code>SLOT_SECONDS</code>, <code>TREASURY</code>, the prices and the Patina thresholds) and compare them with the table.</li>
            <li>Confirm the contract has no owner or admin functions. If the source is published on the explorer, read it.</li>
            <li>Anyone who builds this site can also run <code>pnpm verify:deployment</code>, which reads these values from the chain and compares them with the deployment record.</li>
          </ol>
          <p>The site never labels anything &quot;verified&quot; for you. That judgement is yours.</p>
        </Prose>
      </Section>

      <Section title="Audit" id="audit">
        <Prose>
          {CONFIG.auditReportUrl ? (
            <p>
              An external audit report is available: <a href={CONFIG.auditReportUrl}>read the report</a>. An audit reduces risk; it does not remove it.
            </p>
          ) : (
            <p>
              <strong>No external audit yet.</strong> The contracts have been tested by their authors only. Until a report exists, assume bugs are possible and spend only what you can afford to lose.
            </p>
          )}
          <p className="dim">Interface definition used by this site: {ABI_SOURCE}.</p>
        </Prose>
      </Section>
    </>
  );
}
