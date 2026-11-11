import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { CONFIG } from './config';
import { chainById } from './chains';

export const activeChain = chainById(CONFIG.chainId);

/** Reads go to our read-only relay unless a direct RPC is set for local work. */
export const rpcUrl = CONFIG.rpcUrl || `/api/rpc?chain=${CONFIG.chainId}`;

export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [injected()],
  transports: { [activeChain.id]: http(rpcUrl, { batch: { wait: 16 }, retryCount: 1, timeout: 15_000 }) } as Record<number, ReturnType<typeof http>>,
  ssr: true,
  multiInjectedProviderDiscovery: true,
});
