import { Providers } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';
import { SiteIntro } from '@/components/SiteIntro';
import { Ambient } from '@/components/Ambient';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <SiteIntro />
      <Ambient />
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
