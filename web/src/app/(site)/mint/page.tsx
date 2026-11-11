import type { Metadata } from 'next';
import { PageHead } from '@/components/Layout';
import { MintView } from './MintView';

export const metadata: Metadata = {
  title: 'Mint',
  description: "Mint today's Disc. The price is exact and payments are final.",
};

export default function Page() {
  return (
    <>
      <PageHead eyebrow="Mint" title="Today's Disc" lead="One Sign and one Numeral are open each Day. Up to 2 Discs per transaction and 2 per wallet per Day." />
      <MintView />
    </>
  );
}
