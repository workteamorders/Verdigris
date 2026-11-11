'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAccount, useBalance, useWriteContract } from 'wagmi';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { parseEventLogs } from 'viem';
import { Button } from '@/components/Button';
import { TiltDisc } from '@/components/TiltDisc';
import { Badge } from '@/components/Badge';
import { Panel } from '@/components/Panel';
import { Dialog } from '@/components/Dialog';
import { Checkbox, Stepper } from '@/components/Field';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Facts } from '@/components/Layout';
import { WalletButton } from '@/components/WalletButton';
import { useToast } from '@/components/Toast';
import { discAbi } from '@/lib/abi.generated';
import { explainError, useClient, useCount, TX_CAP, WALLET_SLOT_CAP } from '@/lib/chain-data';
import { useGeoBlocked } from '@/lib/geo';
import { activeChain } from '@/lib/wagmi';
import { SIGNS } from '@/lib/signs';
import { CountClock } from '@/components/CountClock';
import { formatEthWei } from '@/lib/wheel';
import styles from './MintView.module.css';

type Phase = { name: 'idle' } | { name: 'simulating' } | { name: 'signing' } | { name: 'confirming'; hash: `0x${string}` } | { name: 'done'; ids: number[]; hash: `0x${string}` } | { name: 'failed'; what: string; safe: string };

export function MintView() {
  const count = useCount();
  const blocked = useGeoBlocked();
  const client = useClient();
  const qc = useQueryClient();
  const toast = useToast();
  const { address, isConnected, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [phase, setPhase] = useState<Phase>({ name: 'idle' });

  const dep = count.deployment;
  const today = count.today;

  const mine = useQuery({
    queryKey: ['mintedByWallet', dep?.disc, address, today?.day],
    enabled: Boolean(client && dep && address && today),
    queryFn: async () => Number(await client!.readContract({ address: dep!.disc, abi: discAbi, functionName: 'mintedByWalletOnDay', args: [address!, today!.day] })),
  });
  const balance = useBalance({ address, chainId: activeChain.id, query: { enabled: Boolean(address) } });

  const left = today ? today.cap - today.minted : 0;
  const walletLeft = Math.max(0, WALLET_SLOT_CAP - (mine.data ?? 0));
  const maxQty = Math.max(0, Math.min(TX_CAP, left, walletLeft));
  useEffect(() => {
    if (maxQty > 0 && qty > maxQty) setQty(maxQty);
  }, [maxQty, qty]);

  const total = useMemo(() => (today ? today.priceWei * BigInt(qty) : 0n), [today, qty]);
  const wrongNetwork = isConnected && chainId !== activeChain.id;
  const poor = balance.data !== undefined && balance.data.value < total;

  let blocker: string | null = null;
  if (blocked) blocker = 'Minting is not offered in your region.';
  else if (count.status === 'undeployed') blocker = 'No deployment is connected to this build yet.';
  else if (count.status === 'before') blocker = 'The Count has not started.';
  else if (count.status === 'ended') blocker = 'The Count has ended.';
  else if (today && left === 0) blocker = 'Today is sold out.';
  else if (isConnected && today && mine.data !== undefined && walletLeft === 0) blocker = 'This wallet has reached its limit of 2 Discs for today.';
  else if (wrongNetwork) blocker = `Switch your wallet to ${activeChain.name}.`;
  else if (isConnected && poor) blocker = 'This wallet does not hold enough ETH for the price plus network fees.';

  async function mint() {
    if (!client || !dep || !today || !address) return;
    setPhase({ name: 'simulating' });
    try {
      const { request } = await client.simulateContract({ account: address, address: dep.disc, abi: discAbi, functionName: 'mint', args: [qty], value: total });
      setPhase({ name: 'signing' });
      const hash = await writeContractAsync(request);
      setPhase({ name: 'confirming', hash });
      const receipt = await client.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw new Error('The transaction was included but failed.');
      const logs = parseEventLogs({ abi: discAbi, logs: receipt.logs, eventName: 'Minted' });
      const first = Number(logs[0]?.args.firstId ?? 0n);
      const n = Number(logs[0]?.args.quantity ?? qty);
      setPhase({ name: 'done', ids: first ? Array.from({ length: n }, (_, i) => first + i) : [], hash });
      toast({ tone: 'success', title: 'Minted', line: `${n} Disc${n > 1 ? 's' : ''} added to your wallet.` });
      await qc.invalidateQueries();
    } catch (e) {
      const x = explainError(e);
      setPhase({ name: 'failed', ...x });
      toast({ tone: 'danger', title: 'Not minted', line: x.what });
    }
  }

  if (count.status === 'loading') {
    return (
      <div className={`container ${styles.layout}`}>
        <Skeleton height="20rem" />
        <Skeleton height="20rem" />
      </div>
    );
  }
  if (count.status === 'error') {
    return (
      <div className="container">
        <ErrorState
          title="Cannot read the chain"
          what="The site could not reach the network just now."
          safe="Nothing was sent or charged."
          next={<Button variant="secondary" onClick={count.refetch}>Try again</Button>}
        />
      </div>
    );
  }

  const sign = today?.sign ?? 0;
  const numeral = today?.numeral ?? 1;
  const busy = phase.name === 'simulating' || phase.name === 'signing' || phase.name === 'confirming';

  return (
    <div className={`container ${styles.layout}`}>
      <div className={styles.preview}>
        <TiltDisc sign={sign} numeral={numeral} serial={(today?.minted ?? 4) + 1} level={0} />
        <p className="dim">
          {count.status === 'live' ? `Preview of Disc ${(today?.minted ?? 0) + 1} of today. The contract draws the final image.` : 'Preview of a Day 1 Disc.'}
        </p>
      </div>

      <div className={styles.panel}>
        {phase.name === 'done' ? (
          <Panel>
            <div className={styles.stack}>
              <Badge tone="success">Minted</Badge>
              <h2>
                {phase.ids.length > 1 ? 'Your Discs are in your wallet.' : 'Your Disc is in your wallet.'}
              </h2>
              <p>
                Patina starts at level 0 and begins to show after 3 days unmoved. {phase.ids.length ? 'Open them in the Gallery:' : ''}
              </p>
              <div className={styles.row}>
                {phase.ids.map((id) => (
                  <Link key={id} href={`/gallery/?id=${id}`}>
                    Disc #{id}
                  </Link>
                ))}
              </div>
              {activeChain.blockExplorers ? (
                <a href={`${activeChain.blockExplorers.default.url}/tx/${phase.hash}`} rel="noreferrer noopener" target="_blank">
                  View the transaction
                </a>
              ) : null}
              <Button variant="secondary" onClick={() => setPhase({ name: 'idle' })}>
                Mint another
              </Button>
            </div>
          </Panel>
        ) : (
          <Panel>
            <div className={styles.stack}>
              {today ? (
                <>
                  <div>
                    <p className="label">Day {today.day + 1} of 84</p>
                    <h2>
                      {SIGNS[today.sign]?.name}, Numeral {today.numeral}
                    </h2>
                    <p>
                      <Badge tone={today.tier === 'Crown' ? 'warning' : today.tier === 'Fine' ? 'info' : 'neutral'}>{today.tier}</Badge>
                    </p>
                  </div>
                  <Facts
                    items={[
                      ['Price each', formatEthWei(today.priceWei)],
                      ['Left today', `${left} of ${today.cap}`],
                      ['Your allowance', isConnected ? (mine.data === undefined ? 'Reading…' : `${walletLeft} of ${WALLET_SLOT_CAP} left`) : `${WALLET_SLOT_CAP} per wallet`],
                      ['Next Day in', <CountClock key="c" seconds={count.secondsToNextDay} />],
                    ]}
                  />
                  <Stepper label="Quantity" hint={`Up to ${TX_CAP} per transaction`} min={maxQty > 0 ? 1 : 0} max={maxQty} value={maxQty > 0 ? qty : 0} onChange={setQty} disabled={maxQty === 0 || busy} />
                  <p className={styles.total}>
                    Total <strong className="mono">{formatEthWei(total)}</strong>, plus network fees.
                  </p>
                </>
              ) : (
                <EmptyState title={blocker ?? 'Nothing to mint right now'}>
                  {count.status === 'before' && count.secondsToStart !== undefined ? (
                    <>Day 1 opens in <CountClock seconds={count.secondsToStart} />.</>
                  ) : (
                    <>Read the rules and browse the Calendar in the meantime.</>
                  )}
                </EmptyState>
              )}

              {today && blocker ? <p role="status" className={styles.blocker}>{blocker}</p> : null}
              {phase.name === 'failed' ? (
                <div role="alert" className={styles.failed}>
                  <strong>{phase.what}</strong> {phase.safe}
                </div>
              ) : null}
              {phase.name === 'confirming' ? <p role="status">Waiting for the network to include your transaction…</p> : null}

              {!isConnected ? (
                <WalletButton />
              ) : (
                <Button variant="primary" size="lg" disabled={Boolean(blocker) || !today || busy} loading={busy} onClick={() => { setAgreed(false); setOpen(true); }}>
                  {today ? `Mint ${qty} for ${formatEthWei(total)}` : 'Mint'}
                </Button>
              )}
              <p className="dim">
                Payment is exact and final: the contract rejects any other amount and there is no refund. Read the <Link href="/risk/">risks</Link> first.
              </p>
            </div>
          </Panel>
        )}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm your mint"
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!agreed}
              onClick={() => {
                setOpen(false);
                void mint();
              }}
            >
              Confirm in wallet
            </Button>
          </>
        }
      >
        {today ? (
          <div className={styles.stack}>
            <Facts
              items={[
                ['You mint', `${qty} × ${today.tier} Disc, ${SIGNS[today.sign]?.name}, Numeral ${today.numeral}`],
                ['You pay', `${formatEthWei(total)} plus network fees`],
                ['Network', activeChain.name],
              ]}
            />
            <p>The site checks the transaction against the contract before your wallet opens. If the check fails, nothing is sent.</p>
            <Checkbox label="I understand this payment is final and cannot be refunded." checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
