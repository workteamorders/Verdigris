import { AmbientField } from '@/components/AmbientField';
import { Providers } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AmbientField />
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
