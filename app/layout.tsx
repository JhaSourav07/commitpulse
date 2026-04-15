// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Navbar from './components/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CommitPulse | Visualize Your Rhythm',
  description: 'Premium GitHub streak monoliths',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <div className="pt-24 sm:pt-28">{children}</div>
        <Analytics />
      </body>
    </html>
  )
}