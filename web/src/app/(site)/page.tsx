import type { Metadata } from 'next';
import { HomeView } from './HomeView';

export const metadata: Metadata = {
  title: { absolute: 'Verdigris: an 84-Day Count of bronze Discs' },
  description: 'Each Day of an 84-Day Count opens one Sign and one Numeral. A Disc gains Patina the longer it stays unmoved. Drawn fully on-chain.',
};

export default function Page() {
  return <HomeView />;
}
