import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

// Load the Inter font from Google Fonts.  The `subsets` option only
// downloads the required glyphs and keeps bundle size small.
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AstraCore',
  description: 'Internal web application for AstraCore',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
