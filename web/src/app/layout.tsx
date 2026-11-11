import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import '@fontsource/schibsted-grotesk/latin-500.css';
import '@fontsource/schibsted-grotesk/latin-700.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-600.css';
import '@fontsource/dm-mono/latin-400.css';
import '@/styles/tokens.css';
import '@/styles/base.css';
import { ToastProvider } from '@/components/Toast';
import { RegisterSw } from '@/components/RegisterSw';
import { MotionProvider } from '@/lib/motion';

// The engraved display face (Bodoni Moda, SIL Open Font License), self-hosted and preloaded with a metric-matched fallback.
const engraved = localFont({
  src: [
    { path: '../../node_modules/@fontsource/bodoni-moda/files/bodoni-moda-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--face-engraved',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

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
    <html lang="en" className={engraved.variable}>
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <MotionProvider>
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
        <RegisterSw />
      </body>
    </html>
  );
}
