import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RPC Watch — Which chains are one outage from going dark?',
  description:
    'Public security dashboard tracking which blockchains rely on a single RPC endpoint. A single point of failure for wallets, dApps, and users.',
  openGraph: {
    title: 'RPC Watch',
    description:
      'Which blockchains are one outage away from going dark? Public security dashboard for RPC endpoint coverage.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RPC Watch',
    description:
      'Which blockchains are one outage away from going dark?',
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg font-sans text-text antialiased">{children}</body>
    </html>
  );
}
