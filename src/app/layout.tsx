import type { Metadata } from 'next'
import { Playfair_Display, Quintessential, Geist } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

/* Logo : Playfair Display — exclusivement pour le mot "DISTIL" */
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
})

/* Titres display : Quintessential */
const quintessential = Quintessential({
  variable: '--font-quintessential',
  subsets: ['latin'],
  weight: '400',
})

/* Corps + UI : Geist sans-serif */
const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Distil',
  description: 'Veille intelligente. Moins de bruit, mieux lu.',
  manifest: '/manifest.webmanifest',
  themeColor: '#1c3028',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Distil',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${quintessential.variable} ${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
