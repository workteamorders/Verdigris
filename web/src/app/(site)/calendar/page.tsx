import type { Metadata } from 'next';
import { PageHead } from '@/components/Layout';
import { CalendarView } from './CalendarView';

export const metadata: Metadata = {
  title: 'Calendar',
  description: 'All 84 Days of the Count: Sign, Numeral, tier, supply and price for each.',
};

export default function Page() {
  return (
    <>
      <PageHead eyebrow="Calendar" title="The 84 Days" lead="Each row is a Sign and each column is a Numeral. Pick any Day to see its details." />
      <CalendarView />
    </>
  );
}
