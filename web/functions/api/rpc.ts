// The only server code in this project: a read-only JSON-RPC relay for Cloudflare Pages Functions.
//   POST /api/rpc?chain=<id>   forwards allow-listed read calls to the RPC set in the environment
//   GET  /api/rpc              returns { blocked: boolean } for the visitor's country (BLOCKED_COUNTRIES)
// No state, no keys in the repository, no way to send a transaction. Each call costs one request of the free quota,
// so the browser batches calls and caches answers.
//
// Environment (set in the Cloudflare dashboard, never in the repo):
//   RPC_URL_<chainId>      upstream JSON-RPC endpoint for that chain
//   ALLOWED_CONTRACTS      comma-separated addresses that eth_call and eth_getLogs may target
//   BLOCKED_COUNTRIES      comma-separated ISO country codes, optional

interface Env {
  [key: string]: string | undefined;
  ALLOWED_CONTRACTS?: string;
  BLOCKED_COUNTRIES?: string;
}

interface Ctx {
  request: Request;
  env: Env;
}

interface RpcCall {
  jsonrpc?: string;
  id?: number | string | null;
  method?: unknown;
  params?: unknown;
}

const READ_METHODS = new Set([
  'eth_chainId',
  'eth_blockNumber',
  'eth_getBlockByNumber',
  'eth_call',
  'eth_getLogs',
  'eth_getCode',
  'eth_getBalance',
  'eth_getTransactionReceipt',
  'eth_getTransactionByHash',
  'eth_estimateGas',
  'eth_gasPrice',
  'eth_maxPriorityFeePerGas',
  'eth_feeHistory',
  'eth_getTransactionCount',
]);

const MAX_BODY_BYTES = 16 * 1024;
const MAX_BATCH = 24;

const json = (body: unknown, status = 200, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra } });

const rpcError = (id: RpcCall['id'], code: number, message: string): unknown => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

function allowedAddresses(env: Env): Set<string> {
  return new Set((env.ALLOWED_CONTRACTS ?? '').split(',').map((a) => a.trim().toLowerCase()).filter(Boolean));
}

function check(call: RpcCall, allowed: Set<string>): string | null {
  if (typeof call.method !== 'string' || !READ_METHODS.has(call.method)) return 'method not allowed';
  if (call.method === 'eth_call' || call.method === 'eth_estimateGas') {
    const tx = Array.isArray(call.params) ? (call.params[0] as { to?: unknown } | undefined) : undefined;
    const to = typeof tx?.to === 'string' ? tx.to.toLowerCase() : '';
    if (allowed.size === 0 || !allowed.has(to)) return 'target not allowed';
  }
  if (call.method === 'eth_getLogs') {
    const f = Array.isArray(call.params) ? (call.params[0] as { address?: unknown } | undefined) : undefined;
    const list = Array.isArray(f?.address) ? f.address : [f?.address];
    if (allowed.size === 0 || list.length === 0 || !list.every((a) => typeof a === 'string' && allowed.has(a.toLowerCase()))) return 'address not allowed';
  }
  return null;
}

function country(request: Request): string {
  const cf = (request as unknown as { cf?: { country?: string } }).cf;
  return (cf?.country ?? '').toUpperCase();
}

export const onRequestGet = ({ request, env }: Ctx): Response => {
  const blocked = (env.BLOCKED_COUNTRIES ?? '').split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
  const c = country(request);
  // The country itself is never returned.
  return json({ blocked: c !== '' && blocked.includes(c) });
};

export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return json({ error: 'cross-origin use is not allowed' }, 403);

  const chain = url.searchParams.get('chain') ?? '';
  const upstream = /^\d{1,10}$/.test(chain) ? env[`RPC_URL_${chain}`] : undefined;
  if (!upstream) return json({ error: 'unknown chain' }, 404);

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json({ error: 'body too large' }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'invalid JSON' }, 400);
  }

  const calls = (Array.isArray(body) ? body : [body]) as RpcCall[];
  if (calls.length === 0 || calls.length > MAX_BATCH) return json({ error: 'bad batch size' }, 400);
  const allowed = allowedAddresses(env);
  for (const call of calls) {
    const why = check(call, allowed);
    if (why) return json(Array.isArray(body) ? calls.map((c) => rpcError(c.id, -32601, why)) : rpcError(call.id, -32601, why), 403);
  }

  let res: Response;
  try {
    res = await fetch(upstream, { method: 'POST', headers: { 'content-type': 'application/json' }, body: text });
  } catch {
    return json({ error: 'upstream unreachable' }, 502);
  }
  const out = await res.text();
  return new Response(out, { status: res.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
};

// Anything else (PUT, DELETE, ...) gets a 405 from Pages by default.
