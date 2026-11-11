'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { isAddress } from 'viem';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Checkbox, TextField } from '@/components/Field';
import { Disc } from '@/components/Disc';
import { Section } from '@/components/Layout';
import { DiscSkeleton, EmptyState, ErrorState } from '@/components/States';
import { useToast } from '@/components/Toast';
import { WalletButton } from '@/components/WalletButton';
import { discAbi } from '@/lib/abi.generated';
import { explainError, useChainClock, useClient, useDeployment, useDiscPage, useOwned, type DiscView } from '@/lib/chain-data';
import { LEVEL_NAMES, nextLevelAt } from '@/lib/patina';
import { SIGNS } from '@/lib/signs';
import { activeChain } from '@/lib/wagmi';
import { formatDuration } from '@/lib/wheel';
import styles from './VaultView.module.css';

export function VaultView() {
  const dep = useDeployment();
  const { address, isConnected } = useAccount();
  const owned = useOwned(address);
  const discs = useDiscPage(owned.data ?? []);
  const clock = useChainClock();
  const [sending, setSending] = useState<DiscView | null>(null);

  if (!dep) {
    return (
      <Section>
        <EmptyState title="No deployment connected">There is no contract to read Discs from in this build yet.</EmptyState>
      </Section>
    );
  }
  if (!isConnected) {
    return (
      <Section>
        <EmptyState title="Connect a wallet to open your Vault" action={<WalletButton />}>
          Connecting only lets the site read your address. It cannot move anything without a request you approve in your wallet.
        </EmptyState>
      </Section>
    );
  }
  if (owned.isError || discs.isError) {
    return (
      <Section>
        <ErrorState title="Cannot read the chain" what="The site could not list your Discs just now." safe="Nothing was changed." next={<Button variant="secondary" onClick={() => void owned.refetch()}>Try again</Button>} />
      </Section>
    );
  }
  if (owned.isLoading || (owned.data && owned.data.length > 0 && discs.isLoading)) {
    return (
      <Section>
        <ul className={styles.grid}>
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <DiscSkeleton />
            </li>
          ))}
        </ul>
      </Section>
    );
  }
  if (!owned.data || owned.data.length === 0) {
    return (
      <Section>
        <EmptyState title="No Discs in this wallet" action={<Link href="/mint/">Go to Mint</Link>}>
          When a Disc arrives, by minting or from another wallet, it appears here.
        </EmptyState>
      </Section>
    );
  }

  return (
    <Section>
      <p className="dim">
        {owned.data.length} Disc{owned.data.length === 1 ? '' : 's'}. Moving any Disc, even to another wallet of yours, resets its Patina to level 0.
      </p>
      <ul className={styles.grid}>
        {(discs.data ?? []).map((d) => {
          const next = nextLevelAt(d.lastMovedAt, d.level, dep.patinaSeconds);
          return (
            <li key={d.id} className={styles.item}>
              <Link href={`/gallery/?id=${d.id}`} className={styles.card}>
                <Disc sign={d.sign} numeral={d.numeral} serial={d.serial} level={d.level} />
              </Link>
              <p className={styles.title}>
                <span className="mono">#{d.id}</span> {SIGNS[d.sign]?.name}, Numeral {d.numeral}
              </p>
              <p>
                <Badge tone="patina">{`Patina ${d.level}: ${LEVEL_NAMES[d.level]}`}</Badge>
              </p>
              <p className="dim">{next === null ? 'Deepest level reached.' : `Next level in ${formatDuration(next - clock.now)} if unmoved.`}</p>
              <Button variant="secondary" size="sm" icon="send" onClick={() => setSending(d)}>
                Send
              </Button>
            </li>
          );
        })}
      </ul>
      <SendDialog disc={sending} from={address} onClose={() => setSending(null)} />
    </Section>
  );
}

function SendDialog({ disc, from, onClose }: { disc: DiscView | null; from: `0x${string}` | undefined; onClose: () => void }) {
  const dep = useDeployment();
  const client = useClient();
  const qc = useQueryClient();
  const toast = useToast();
  const { writeContractAsync } = useWriteContract();
  const [to, setTo] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ what: string; safe: string } | null>(null);

  const valid = isAddress(to) && to.toLowerCase() !== from?.toLowerCase();

  async function send() {
    if (!client || !dep || !disc || !from || !isAddress(to)) return;
    setBusy(true);
    setErr(null);
    try {
      const { request } = await client.simulateContract({ account: from, address: dep.disc, abi: discAbi, functionName: 'safeTransferFrom', args: [from, to, BigInt(disc.id)] });
      const hash = await writeContractAsync(request);
      await client.waitForTransactionReceipt({ hash });
      toast({ tone: 'success', title: 'Sent', line: `Disc #${disc.id} moved. Its Patina is back to level 0.` });
      setTo('');
      setAgreed(false);
      onClose();
      await qc.invalidateQueries();
    } catch (e) {
      setErr(explainError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={disc !== null}
      onClose={onClose}
      title={disc ? `Send Disc #${disc.id}` : 'Send'}
      actions={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!valid || !agreed} loading={busy} onClick={() => void send()}>
            Send
          </Button>
        </>
      }
    >
      <div className={styles.dialog}>
        <p>
          Sending resets this Disc&apos;s Patina to level 0 for whoever holds it, and it cannot be undone. Check the address character by character: a wrong address cannot be recovered. Network: {activeChain.name}.
        </p>
        <TextField label="Recipient address" placeholder="0x…" value={to} onChange={(e) => setTo(e.target.value.trim())} autoComplete="off" spellCheck={false} validate={(v) => (v === '' ? 'Enter an address.' : isAddress(v) ? (v.toLowerCase() === from?.toLowerCase() ? 'That is your own address.' : undefined) : 'This is not a valid address.')} />
        <Checkbox label="I checked the address and understand this cannot be undone." checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        {err ? (
          <p role="alert">
            <strong>{err.what}</strong> {err.safe}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
