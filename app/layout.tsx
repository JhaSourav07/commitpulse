import './globals.css';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Navbar from './components/navbar';
import BrandParticles from '@/components/BrandParticles';
import ReturnToTop from '@/components/ReturnToTop';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://commitpulse.vercel.app'),
  title: 'CommitPulse | 3D Isometric GitHub Contribution Graph',
  description:
    'Transform your GitHub contribution history into a cinematic, 3D isometric SVG monolith. Drop it into your README and visualize your developer rhythm with real-time accuracy.',
  keywords: [
    'GitHub',
    'contribution graph',
    'isometric',
    '3D SVG',
    'GitHub stats',
    'README widget',
    'developer portfolio',
    'CommitPulse',
  ],
  authors: [{ name: 'Sourav Jha', url: 'https://github.com/JhaSourav07' }],
  creator: 'Sourav Jha',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://commitpulse.vercel.app/',
    title: 'CommitPulse | 3D Isometric GitHub Contribution Graph',
    description:
      'Generate a cinematic, isometric 3D SVG of your GitHub contributions for your README. Stop being boring and visualize your grind.',
    siteName: 'CommitPulse',
    images: [
      {
        url: 'https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=neon',
        width: 1200,
        height: 630,
        alt: 'CommitPulse 3D GitHub Contribution Graph Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CommitPulse | Elevate Your GitHub README',
    description:
      'Generate a cinematic, isometric 3D SVG of your GitHub contributions for your README.',
    images: ['https://commitpulse.vercel.app/api/streak?user=jhasourav07&theme=neon'],
    // creator: '@your_twitter_handle', // Uncomment and add your Twitter handle here
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black`}>
        <BrandParticles />
        <Navbar />
        <div className="pt-24 sm:pt-28 relative z-10">{children}</div>
        <ReturnToTop />
        <Analytics />
      </body>
    </html>
  );
}
