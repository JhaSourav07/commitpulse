// app/layout.tsx
import './globals.css'
import { JetBrains_Mono, Fira_Code, Roboto_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Navbar from './components/navbar'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

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
      <body data-font="jetbrains-mono" className={`${jetbrainsMono.variable} ${firaCode.variable} ${robotoMono.variable}`}>
        <Navbar />
        <div className="pt-24 sm:pt-28">{children}</div>
        <Analytics />
      </body>
    </html>
  )
}