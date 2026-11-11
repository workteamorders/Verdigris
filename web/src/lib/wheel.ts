import type { WheelState } from '@/components/Wheel';
import { formatCountdown } from './format';
import type { CountView } from './chain-data';

/** What the hero wheel should show for the current Count. */
export function wheelFor(c: CountView): { state: WheelState; sign: number; numeral: number; caption?: string } {
  switch (c.status) {
    case 'undeployed':
      return { state: 'undeployed', sign: 0, numeral: 1 };
    case 'loading':
      return { state: 'loading', sign: 0, numeral: 1 };
    case 'error':
      return { state: 'error', sign: 0, numeral: 1 };
    case 'before':
      return { state: 'before', sign: 0, numeral: 1, caption: formatCountdown(c.secondsToStart ?? 0) };
    case 'ended':
      return { state: 'done', sign: 0, numeral: 1 };
    case 'live': {
      const t = c.today;
      if (!t) return { state: 'loading', sign: 0, numeral: 1 };
      return { state: t.minted >= t.cap ? 'soldout' : 'today', sign: t.sign, numeral: t.numeral, caption: t.minted >= t.cap ? formatCountdown(c.secondsToNextDay ?? 0) : undefined };
    }
  }
}

export function formatEthWei(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const frac = (wei % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '');
  return `${whole}${frac ? `.${frac.slice(0, 6)}` : ''} ETH`;
}

export function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
