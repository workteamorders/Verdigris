'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, ViewTransition } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Disc } from '@/components/Disc';
import { TiltCard } from '@/components/TiltCard';
import { Facts, Section } from '@/components/Layout';
import { Panel } from '@/components/Panel';
import { DiscSkeleton, EmptyState, ErrorState } from '@/components/States';
import { discAbi } from '@/lib/abi.generated';
import { useClient, useDeployment, useDisc, useDiscPage, useTotalMinted } from '@/lib/chain-data';
import { discSvg } from '@/lib/disc';
import { LEVEL_NAMES, nextLevelAt } from '@/lib/patina';
import { SIGNS } from '@/lib/signs';
import { activeChain } from '@/lib/wagmi';
import { formatDate, formatDuration } from '@/lib/wheel';
import { useChainClock } from '@/lib/chain-data';
import styles from './GalleryView.module.css';

const PAGE = 12;

export function GalleryView() {
  const params = useSearchParams();
  const id = Number(params.get('id'));
  return Number.isInteger(id) && id > 0 ? <DiscDetail id={id} /> : <DiscGrid page={Math.max(1, Number(params.get('page')) || 1)} />;
}

function DiscGrid({ page }: { page: number }) {
  const dep = useDeployment();
  const total = useTotalMinted();
  const n = total.data ?? 0;
  const pages = Math.max(1, Math.ceil(n / PAGE));
  const p = Math.min(page, pages);
  // Newest first.
  const top = n - (p - 1) * PAGE;
  const ids = Array.from({ length: Math.max(0, Math.min(PAGE, top)) }, (_, i) => top - i);
  const discs = useDiscPage(ids);

  if (!dep) {
    return (
      <Section>
        <EmptyState title="No Discs to show yet">No deployment is connected to this build. Once the Count opens, every Disc appears here.</EmptyState>
      </Section>
    );
  }
  if (total.isError || discs.isError) {
    return (
      <Section>
        <ErrorState title="Cannot read the chain" what="The site could not load the Discs just now." safe="Nothing was changed." next={<Button variant="secondary" onClick={() => void total.refetch()}>Try again</Button>} />
      </Section>
    );
  }
  if (total.data === 0) {
    return (
      <Section>
        <EmptyState title="Nothing minted yet">The first Disc will appear here the moment it exists.</EmptyState>
      </Section>
    );
  }
  return (
    <Section>
      <p className="dim">{total.data === undefined ? 'Reading the chain…' : `${n} Disc${n === 1 ? '' : 's'} minted. Showing ${ids.length}, newest first.`}</p>
      <ul className={styles.grid}>
        {discs.data
          ? discs.data.map((d) => (
              <li key={d.id}>
                <Link href={`/gallery/?id=${d.id}`} className={styles.card} aria-label={`Disc ${d.id}, ${SIGNS[d.sign]?.name}, Numeral ${d.numeral}, Patina level ${d.level}`}>
                  <ViewTransition name={`disc-${d.id}`}>
                    <TiltCard max={6}>
                      <Disc sign={d.sign} numeral={d.numeral} serial={d.serial} level={d.level} noFilters />
                    </TiltCard>
                  </ViewTransition>
                  <span className={styles.meta}>
                    <span className="mono">#{d.id}</span>
                    <span className="dim">
                      {SIGNS[d.sign]?.name} · {d.numeral}
                    </span>
                  </span>
                </Link>
              </li>
            ))
          : (ids.length > 0 ? ids : Array.from({ length: PAGE }, (_, i) => -i)).map((i) => (
              <li key={i}>
                <div className={styles.card} aria-hidden={i <= 0 ? undefined : true}>
                  <DiscSkeleton />
                  <span className={styles.meta}>
                    <span className="mono">&nbsp;</span>
                  </span>
                </div>
              </li>
            ))}
      </ul>
      {pages > 1 ? (
        <nav aria-label="Pages" className={styles.pager}>
          {p > 1 ? <Link href={`/gallery/?page=${p - 1}`}>Newer</Link> : <span />}
          <span className="mono">
            {p} / {pages}
          </span>
          {p < pages ? <Link href={`/gallery/?page=${p + 1}`}>Older</Link> : <span />}
        </nav>
      ) : null}
    </Section>
  );
}

function DiscDetail({ id }: { id: number }) {
  const dep = useDeployment();
  const q = useDisc(id);
  const total = useTotalMinted();
  const client = useClient();
  const clock = useChainClock();
  const [cmp, setCmp] = useState<'idle' | 'running' | 'match' | 'differs' | 'failed'>('idle');
  const d = q.data;

  async function compare() {
    if (!client || !dep || !d) return;
    setCmp('running');
    try {
      const uri = await client.readContract({ address: dep.disc, abi: discAbi, functionName: 'tokenURI', args: [BigInt(id)] });
      const json = JSON.parse(atob(uri.split(',')[1] ?? '')) as { image: string };
      const svg = atob(json.image.split(',')[1] ?? '');
      setCmp(svg === discSvg({ sign: d.sign, numeral: d.numeral, level: d.level, serial: d.serial }) ? 'match' : 'differs');
    } catch {
      setCmp('failed');
    }
  }

  if (!dep) {
    return (
      <Section>
        <EmptyState title="No deployment connected">There is no contract to read Discs from in this build.</EmptyState>
      </Section>
    );
  }
  if (q.isLoading) {
    return (
      <Section>
        <DiscSkeleton />
      </Section>
    );
  }
  if (q.isError || !d) {
    return (
      <Section>
        <ErrorState
          title={`Disc #${id} was not found`}
          what="Either this Disc has not been minted yet, or the chain could not be read."
          safe="Nothing was changed."
          next={<Link href="/gallery/">Back to the Gallery</Link>}
        />
      </Section>
    );
  }

  const next = nextLevelAt(d.lastMovedAt, d.level, dep.patinaSeconds);
  const n = total.data ?? 0;
  return (
    <Section>
      <div className={styles.detail}>
        <div className={styles.big}>
          <ViewTransition name={`disc-${d.id}`}>
            <TiltCard max={10}>
              <Disc sign={d.sign} numeral={d.numeral} serial={d.serial} level={d.level} />
            </TiltCard>
          </ViewTransition>
        </div>
        <Panel>
          <div className={styles.info}>
            <p className="label">Disc #{d.id} · Day {d.day + 1}</p>
            <h2>
              {SIGNS[d.sign]?.name}, Numeral {d.numeral}
            </h2>
            <p className={styles.badges}>
              <Badge tone={d.tier === 'Crown' ? 'warning' : d.tier === 'Fine' ? 'info' : 'neutral'}>{d.tier}</Badge>
              <Badge tone="patina">{`Patina ${d.level}: ${LEVEL_NAMES[d.level]}`}</Badge>
            </p>
            <Facts
              items={[
                ['Serial in its Day', `${d.serial}`],
                ['Minted', formatDate(d.mintedAt)],
                ['Last moved', formatDate(d.lastMovedAt)],
                ['Next Patina level', next === null ? 'None: this is the deepest level' : `${formatDate(next)} (in ${formatDuration(next - clock.now)}) if it stays unmoved`],
                [
                  'Holder',
                  activeChain.blockExplorers ? (
                    <a key="o" className="mono" href={`${activeChain.blockExplorers.default.url}/address/${d.owner}`} target="_blank" rel="noreferrer noopener">
                      {d.owner}
                    </a>
                  ) : (
                    <span className="mono">{d.owner}</span>
                  ),
                ],
              ]}
            />
            <div className={styles.verify}>
              <Button variant="secondary" size="sm" loading={cmp === 'running'} onClick={() => void compare()}>
                Compare with the contract&apos;s own image
              </Button>
              {cmp === 'match' ? <Badge tone="success">Identical to what the contract draws</Badge> : null}
              {cmp === 'differs' ? <Badge tone="danger">Differs from the contract&apos;s image</Badge> : null}
              {cmp === 'failed' ? <Badge tone="warning">Could not read tokenURI from the network</Badge> : null}
              <p className="dim">The picture above is drawn in your browser from the Disc&apos;s data. This button asks the contract for its own image and checks the two match.</p>
            </div>
            <nav className={styles.pager} aria-label="Neighbouring Discs">
              {id > 1 ? <Link href={`/gallery/?id=${id - 1}`}>Disc #{id - 1}</Link> : <span />}
              <Link href="/gallery/">All Discs</Link>
              {id < n ? <Link href={`/gallery/?id=${id + 1}`}>Disc #{id + 1}</Link> : <span />}
            </nav>
          </div>
        </Panel>
      </div>
    </Section>
  );
}
