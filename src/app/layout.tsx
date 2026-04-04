import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import { clerkAppearance } from '@/lib/clerk-appearance'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SoundSwap',
    template: '%s | SoundSwap',
  },
  description:
    'A premium credit-based music exchange where artists listen, earn credits, and grow real reach.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" className={inter.variable}>
        <body className="font-sans text-slate-100 antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
