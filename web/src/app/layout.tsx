import type { Metadata, Viewport } from 'next';
import '@fontsource/schibsted-grotesk/latin-500.css';
import '@fontsource/schibsted-grotesk/latin-700.css';
import '@fontsource/schibsted-grotesk/latin-800.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-600.css';
import '@fontsource/dm-mono/latin-400.css';
import '@fontsource/dm-mono/latin-500.css';
import '@/styles/tokens.css';
import '@/styles/base.css';
import { ToastProvider } from '@/components/Toast';
import { RegisterSw } from '@/components/RegisterSw';

export const metadata: Metadata = {
  title: { default: 'Verdigris', template: '%s · Verdigris' },
  description: 'Verdigris Discs: bronze medals drawn on-chain. Each UTC Day opens one Sign and one Numeral, and a Disc gains Patina the longer it stays unmoved.',
};

export const viewport: Viewport = {
  themeColor: '#1a0606',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <ToastProvider>{children}</ToastProvider>
        <RegisterSw />
      </body>
    </html>
  );
}
