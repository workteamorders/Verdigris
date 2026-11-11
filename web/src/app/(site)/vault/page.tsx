import type { Metadata } from 'next';
import { PageHead } from '@/components/Layout';
import { VaultView } from './VaultView';

export const metadata: Metadata = {
  title: 'Vault',
  description: 'The Discs your wallet holds, their Patina, and when the next level begins.',
};

export default function Page() {
  return <><PageHead eyebrow="Vault" title="Your Discs" lead="Connect a wallet to see what it holds. The site reads your address from your wallet and keeps nothing about you." /><VaultView /></>;
}
