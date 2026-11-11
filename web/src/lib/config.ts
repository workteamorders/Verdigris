// Build-time configuration. Only NEXT_PUBLIC_* values reach the browser, and none of them is a secret.
const num = (v: string | undefined, d: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined && v !== '' ? n : d;
};

export const CONFIG = {
  /** The one chain this build talks to. */
  chainId: num(process.env.NEXT_PUBLIC_CHAIN_ID, 4663),
  /** Direct RPC for local development (anvil). Empty in production: reads go through /api/rpc. */
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? '',
  /** Empty until an external audit exists. The site then says "No external audit yet". */
  auditReportUrl: process.env.NEXT_PUBLIC_AUDIT_REPORT_URL ?? '',
  /** Public repository link, optional. */
  sourceUrl: process.env.NEXT_PUBLIC_SOURCE_URL ?? '',
} as const;

export const MAINNET_SLOT_SECONDS = 86_400;
