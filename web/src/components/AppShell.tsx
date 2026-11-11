'use client';

import type { ReactNode } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { Banner } from './Banner';
import { Button } from './Button';
import { WalletButton } from './WalletButton';
import { useCount } from '@/lib/chain-data';
import { useGeoBlocked } from '@/lib/geo';
import { activeChain } from '@/lib/wagmi';
import styles from './AppShell.module.css';

export function AppShell({ children }: { children: ReactNode }) {
  const count = useCount();
  const blocked = useGeoBlocked();
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const wrongNetwork = isConnected && chainId !== activeChain.id;

  const status =
    count.status === 'undeployed'
      ? { tone: 'warning' as const, label: 'Not deployed yet' }
      : count.testClock
        ? { tone: 'warning' as const, label: 'TEST CLOCK' }
        : count.status === 'live' && count.today
          ? { tone: 'success' as const, label: `Day ${count.today.day + 1} of 84 live` }
          : count.status === 'before'
            ? { tone: 'info' as const, label: 'Count not started' }
            : count.status === 'ended'
              ? { tone: 'info' as const, label: 'Count complete' }
              : count.status === 'error'
                ? { tone: 'warning' as const, label: 'Cannot read the chain' }
                : undefined;

  return (
    <>
      <SiteHeader status={status} wallet={<WalletButton />} />
      <div className={styles.banners}>
        <div className="container">
          {count.status === 'undeployed' ? (
            <Banner tone="warning" title="Not deployed yet.">
              This build has no contract address for {activeChain.name}. You can read the rules and browse the Calendar; minting opens once a deployment is added.
            </Banner>
          ) : null}
          {count.testClock && count.deployment ? (
            <Banner tone="warning" title="TEST CLOCK.">
              On this deployment a Day lasts {Math.round(count.deployment.slotSeconds / 60)} minutes instead of 24 hours. It is a rehearsal, not the real Count.
            </Banner>
          ) : null}
          {blocked ? (
            <Banner tone="info" title="View only.">
              Minting is not offered in your region. You can still read everything here.
            </Banner>
          ) : null}
          {wrongNetwork ? (
            <Banner
              tone="warning"
              title="Wrong network."
              action={
                <Button size="sm" variant="secondary" loading={isPending} onClick={() => switchChain({ chainId: activeChain.id })}>
                  Switch to {activeChain.name}
                </Button>
              }
            >
              Your wallet is on another network. Nothing can be sent until you switch.
            </Banner>
          ) : null}
        </div>
      </div>
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
