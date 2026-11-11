/** "07:42:19" from seconds remaining. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(sec)}`;
}

/** Wei-free display for ETH amounts given as a decimal string. */
export function formatEth(amount: string): string {
  return `${amount} ETH`;
}

export function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}
