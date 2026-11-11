'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { activeChain } from '@/lib/wagmi';

export const shortAddress = (a: string): string => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Connect, show the address, disconnect. Browser wallets only: no relay service, no account. */
export function WalletButton() {
  const { address, isConnected, status } = useAccount();
  const { connect, connectors, isPending, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const wallets = connectors.filter((c) => c.type === 'injected');
  const reconnecting = status === 'reconnecting' || status === 'connecting';

  if (isConnected && address) {
    return (
      <>
        <Button variant="secondary" icon="wallet" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <span className="mono">{shortAddress(address)}</span>
        </Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Wallet"
          actions={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  disconnect();
                  setOpen(false);
                }}
              >
                Disconnect
              </Button>
            </>
          }
        >
          <p className="label">Connected address</p>
          <p className="mono" style={{ overflowWrap: 'anywhere' }}>
            {address}
          </p>
          <p className="dim">Network for this site: {activeChain.name}.</p>
          <Button
            variant="ghost"
            size="sm"
            icon="copy"
            onClick={() => {
              void navigator.clipboard?.writeText(address).then(() => setCopied(true));
            }}
          >
            {copied ? 'Copied' : 'Copy address'}
          </Button>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        icon="wallet"
        loading={isPending || reconnecting}
        onClick={() => {
          reset();
          if (wallets.length === 1 && wallets[0]) connect({ connector: wallets[0] });
          else setOpen(true);
        }}
        aria-haspopup="dialog"
      >
        Connect wallet
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Connect a wallet" actions={<Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>}>
        {wallets.length === 0 ? (
          <p>No browser wallet was found. Install a wallet extension, or open this page in your wallet&apos;s own browser, then reload. You can still read everything on this site without one.</p>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {wallets.map((w) => (
              <Button
                key={w.uid}
                variant="secondary"
                onClick={() => {
                  connect({ connector: w }, { onSuccess: () => setOpen(false) });
                }}
              >
                {w.name}
              </Button>
            ))}
          </div>
        )}
        {error ? <p role="alert">Could not connect: {error.message.split('\n')[0]}</p> : null}
      </Dialog>
    </>
  );
}
