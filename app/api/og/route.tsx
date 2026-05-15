import './globals.css';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Navbar from './components/navbar';
import CherryBlossom from '@/components/CherryBlossom';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CommitPulse | Visualize Your Rhythm',
  description: 'Premium GitHub streak monoliths',
  openGraph: {
    title: 'CommitPulse | Visualize Your Rhythm',
    description: 'Your GitHub contributions as a cinematic SVG monolith.',
    url: 'https://commitpulse.vercel.app',
    siteName: 'CommitPulse',
    images: [
      {
        url: '/api/og?user=jhasourav07',
        width: 1200,
        height: 630,
        alt: 'CommitPulse Preview',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CommitPulse | Visualize Your Rhythm',
    description: 'Your GitHub contributions as a cinematic SVG monolith.',
    images: ['/api/og?user=jhasourav07'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black`}>
        <CherryBlossom />
        <Navbar />
        <div className="pt-24 sm:pt-28 relative z-10">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
