import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Geist } from 'next/font/google'
// Playfair Display : titres d'articles en lecture (font-heading)
// Geist : tout le reste — UI, body, titres cartes, labels, logo
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

/* Titres d'articles en lecture : Playfair Display */
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
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
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Distil',
  },
}

export const viewport: Viewport = {
  themeColor: '#1c3028',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:font-ui focus:text-sm focus:border focus:border-border focus:outline-none"
        >
          Passer au contenu
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
