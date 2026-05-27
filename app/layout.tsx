import './globals.css';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Navbar from './components/navbar';
import BrandParticles from '@/components/BrandParticles';
import ReturnToTop from '@/components/ReturnToTop';
import type { Metadata } from 'next';

import { ShortcutProvider } from '@/context/ShortcutContext';
import { GlobalShortcutListener } from '@/components/GlobalShortcutListener';

// 1. ADD THESE TWO IMPORTS
import { KeyboardHelpModal } from '@/components/ui/KeyboardHelpModal';
import { CommandPalette } from '@/components/ui/CommandPalette';

const inter = Inter({ subsets: ['latin'] });

// ... (keep your existing metadata config) ...

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black`}>
        <ShortcutProvider>
          <GlobalShortcutListener />

          {/* 2. MOUNT THE MODALS HERE SO THEY CAN RENDER */}
          <KeyboardHelpModal />
          <CommandPalette />

          <BrandParticles />
          <Navbar />
          <div className="pt-24 sm:pt-28 relative z-10">{children}</div>
          <ReturnToTop />
          <Analytics />
        </ShortcutProvider>
      </body>
    </html>
  );
}
