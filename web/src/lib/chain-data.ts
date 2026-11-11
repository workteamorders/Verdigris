'use client';
// Read hooks. Everything the site shows about the Count comes from here: one chain, one deployment.
// States are explicit so every page can render loading, error and undeployed without guessing.
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { discAbi } from './abi.generated';
import { CONFIG } from './config';
import { activeDeployment, type Deployment } from './deployments';
import { signOfSlot, numeralOfSlot, tierOfNumeral, type Tier } from './signs';
import type { PatinaLevel } from './patina';

export const COUNT_DAYS = 84;
export const TX_CAP = 2;
export const WALLET_SLOT_CAP = 2;
export const TIER_CAP: Record<Tier, number> = { Ordinary: 24, Fine: 16, Crown: 8 };
export const MAX_SUPPLY = 1632;

export function useDeployment(): Deployment | undefined {
  return useMemo(() => activeDeployment(), []);
}

export function useClient() {
  return usePublicClient({ chainId: CONFIG.chainId });
}

export function priceWei(d: Deployment, tier: Tier): bigint {
  return BigInt(tier === 'Crown' ? d.pricesWei.crown : tier === 'Fine' ? d.pricesWei.fine : d.pricesWei.ordinary);
}

/** Chain time: latest block timestamp, re-based onto the local clock so countdowns follow the chain, not the device. */
export function useChainClock(): { now: number; ready: boolean } {
  const client = useClient();
  const dep = useDeployment();
  const q = useQuery({
    queryKey: ['clock', CONFIG.chainId],
    enabled: Boolean(client && dep),
    refetchInterval: 30_000,
    queryFn: async () => {
      const b = await client!.getBlock();
      return { chainTs: Number(b.timestamp), localMs: Date.now() };
    },
  });
  const [tick, setTick] = useState(0);
  const clockReady = Boolean(q.data);
  useEffect(() => {
    if (!clockReady) return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [clockReady]);
  void tick;
  if (!q.data) return { now: Math.floor(Date.now() / 1000), ready: false };
  return { now: q.data.chainTs + Math.floor((Date.now() - q.data.localMs) / 1000), ready: true };
}

export type CountStatus = 'undeployed' | 'loading' | 'error' | 'before' | 'live' | 'ended';

export interface DayView {
  readonly day: number; // 0-based
  readonly sign: number;
  readonly numeral: number;
  readonly tier: Tier;
  readonly cap: number;
  readonly minted: number;
  readonly priceWei: bigint;
}

export interface CountView {
  readonly status: CountStatus;
  readonly deployment?: Deployment;
  readonly today?: DayView;
  readonly secondsToStart?: number;
  readonly secondsToNextDay?: number;
  readonly testClock: boolean;
  readonly refetch: () => void;
  readonly error?: unknown;
}

export function dayView(day: number, minted: number, d: Deployment): DayView {
  const numeral = numeralOfSlot(day);
  const tier = tierOfNumeral(numeral);
  return { day, sign: signOfSlot(day), numeral, tier, cap: TIER_CAP[tier], minted, priceWei: priceWei(d, tier) };
}

export function useCount(): CountView {
  const dep = useDeployment();
  const client = useClient();
  const clock = useChainClock();
  const q = useQuery({
    queryKey: ['countState', CONFIG.chainId, dep?.disc],
    enabled: Boolean(client && dep),
    refetchInterval: 20_000,
    queryFn: async () => {
      const [state, block] = await Promise.all([
        client!.readContract({ address: dep!.disc, abi: discAbi, functionName: 'countState' }),
        client!.getBlock(),
      ]);
      const [status, day] = state;
      let minted = 0;
      if (status === 1) minted = Number(await client!.readContract({ address: dep!.disc, abi: discAbi, functionName: 'mintedOnDay', args: [day] }));
      return { status, day, minted, chainTs: Number(block.timestamp) };
    },
  });
  const testClock = Boolean(dep && dep.slotSeconds !== 86_400);
  if (!dep) return { status: 'undeployed', testClock, refetch: () => undefined };
  if (q.isError) return { status: 'error', deployment: dep, testClock, refetch: () => void q.refetch(), error: q.error };
  if (!q.data) return { status: 'loading', deployment: dep, testClock, refetch: () => undefined };
  const { status, day, minted } = q.data;
  const base = { deployment: dep, testClock, refetch: () => void q.refetch() };
  if (status === 0) return { ...base, status: 'before', secondsToStart: Math.max(0, dep.startTime - clock.now) };
  if (status === 2) return { ...base, status: 'ended' };
  const nextDayAt = dep.startTime + (day + 1) * dep.slotSeconds;
  return { ...base, status: 'live', today: dayView(day, minted, dep), secondsToNextDay: Math.max(0, nextDayAt - clock.now) };
}

/** Minted count for all 84 Days in one call. */
export function useMintedAll() {
  const dep = useDeployment();
  const client = useClient();
  return useQuery({
    queryKey: ['mintedAll', CONFIG.chainId, dep?.disc],
    enabled: Boolean(client && dep),
    refetchInterval: 30_000,
    queryFn: async () => (await client!.readContract({ address: dep!.disc, abi: discAbi, functionName: 'mintedAll' })).map(Number),
  });
}

export function useTotalMinted() {
  const dep = useDeployment();
  const client = useClient();
  return useQuery({
    queryKey: ['totalMinted', CONFIG.chainId, dep?.disc],
    enabled: Boolean(client && dep),
    refetchInterval: 30_000,
    queryFn: async () => Number(await client!.readContract({ address: dep!.disc, abi: discAbi, functionName: 'totalMinted' })),
  });
}

export interface DiscView {
  readonly id: number;
  readonly day: number;
  readonly sign: number;
  readonly numeral: number;
  readonly tier: Tier;
  readonly serial: number;
  readonly level: PatinaLevel;
  readonly mintedAt: number;
  readonly lastMovedAt: number;
  readonly owner: `0x${string}`;
}

export function useDisc(id: number | undefined) {
  const dep = useDeployment();
  const client = useClient();
  return useQuery({
    queryKey: ['disc', CONFIG.chainId, dep?.disc, id],
    enabled: Boolean(client && dep && id !== undefined && id > 0),
    staleTime: 60_000,
    retry: 1,
    queryFn: async (): Promise<DiscView> => {
      const i = await client!.readContract({ address: dep!.disc, abi: discAbi, functionName: 'discInfo', args: [BigInt(id!)] });
      return {
        id: id!,
        day: i.day,
        sign: i.sign,
        numeral: i.numeral,
        tier: tierOfNumeral(i.numeral),
        serial: i.serial,
        level: i.level as PatinaLevel,
        mintedAt: Number(i.mintedAt),
        lastMovedAt: Number(i.lastMovedAt),
        owner: i.owner,
      };
    },
  });
}

/** One page of Discs for the Gallery, fetched with a batched JSON-RPC request. */
export function useDiscPage(ids: readonly number[]) {
  const dep = useDeployment();
  const client = useClient();
  return useQuery({
    queryKey: ['discPage', CONFIG.chainId, dep?.disc, ids.join(',')],
    enabled: Boolean(client && dep && ids.length > 0),
    staleTime: 60_000,
    queryFn: async (): Promise<DiscView[]> =>
      Promise.all(
        ids.map(async (id) => {
          const i = await client!.readContract({ address: dep!.disc, abi: discAbi, functionName: 'discInfo', args: [BigInt(id)] });
          return {
            id,
            day: i.day,
            sign: i.sign,
            numeral: i.numeral,
            tier: tierOfNumeral(i.numeral),
            serial: i.serial,
            level: i.level as PatinaLevel,
            mintedAt: Number(i.mintedAt),
            lastMovedAt: Number(i.lastMovedAt),
            owner: i.owner,
          };
        }),
      ),
  });
}

/** The Discs a wallet holds, found with the contract's bounded scan. */
export function useOwned(address: `0x${string}` | undefined) {
  const dep = useDeployment();
  const client = useClient();
  return useQuery({
    queryKey: ['owned', CONFIG.chainId, dep?.disc, address],
    enabled: Boolean(client && dep && address),
    refetchInterval: 30_000,
    queryFn: async (): Promise<number[]> => {
      const out: number[] = [];
      let from = 1n;
      for (let guard = 0; guard < 40; guard++) {
        const [ids, next] = await client!.readContract({ address: dep!.disc, abi: discAbi, functionName: 'ownedIds', args: [address!, from, 400n] });
        out.push(...ids.map(Number));
        if (next === 0n) break;
        from = next;
      }
      return out;
    },
  });
}

/** Messages for the contract's custom errors and the usual wallet failures, in plain English. */
export function explainError(e: unknown): { what: string; safe: string } {
  const text = e instanceof Error ? `${e.name} ${e.message} ${(e as { shortMessage?: string }).shortMessage ?? ''}` : String(e);
  const has = (s: string): boolean => text.includes(s);
  if (has('User rejected') || has('User denied') || has('rejected the request')) return { what: 'You declined the request in your wallet.', safe: 'Nothing was sent and nothing was charged.' };
  if (has('WrongPayment')) return { what: 'The amount sent did not match the price exactly.', safe: 'The contract refused it, so nothing was charged. Reload and try again.' };
  if (has('WalletCapReached')) return { what: 'This wallet already holds its limit of 2 Discs from today.', safe: 'Nothing was charged. A new Day gives a fresh allowance.' };
  if (has('DaySoldOut')) return { what: 'Today is sold out.', safe: 'Nothing was charged. The next Day opens a new Sign and Numeral.' };
  if (has('CountEnded')) return { what: 'The Count has ended.', safe: 'Nothing was charged. No more Discs can be minted.' };
  if (has('NotStarted')) return { what: 'The Count has not started yet.', safe: 'Nothing was charged.' };
  if (has('BadQuantity')) return { what: 'Quantity must be 1 or 2.', safe: 'Nothing was charged.' };
  if (has('insufficient funds') || has('InsufficientFunds')) return { what: 'The wallet does not hold enough ETH for the price plus network fees.', safe: 'Nothing was sent.' };
  if (has('chain') && has('mismatch')) return { what: 'The wallet is on a different network.', safe: 'Nothing was sent. Switch network and try again.' };
  return { what: 'The request failed before it could be sent.', safe: 'Nothing was charged. If this repeats, reload the page and try again.' };
}
