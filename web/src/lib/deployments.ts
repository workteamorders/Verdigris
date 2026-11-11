import { CONFIG } from './config';
import { DEPLOYMENTS } from './deployments.generated';

export interface Deployment {
  readonly chainId: number;
  readonly chainName: string;
  readonly disc: `0x${string}`;
  readonly renderer: `0x${string}`;
  readonly treasury: `0x${string}`;
  readonly startTime: number;
  readonly slotSeconds: number;
  readonly pricesWei: { readonly ordinary: string; readonly fine: string; readonly crown: string };
  readonly patinaSeconds: readonly number[];
  readonly deployBlock: number;
  readonly deployTx: `0x${string}`;
  readonly rendererTx: `0x${string}`;
}

export function activeDeployment(): Deployment | undefined {
  return DEPLOYMENTS[CONFIG.chainId];
}

export function allDeployments(): readonly Deployment[] {
  return Object.values(DEPLOYMENTS);
}
