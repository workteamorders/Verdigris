import { Providers } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';
import { Ambient } from '@/components/Ambient';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Ambient />
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
