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
      <PageHead eyebrow="Calendar" title="The 84 Days" lead="Twelve weeks of seven Days. The column is the Numeral; the Sign turns every Day and comes round again after 12. Pick a Day to see its details." />
      <CalendarView />
    </>
  );
}
