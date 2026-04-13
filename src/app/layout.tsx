import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Geist } from 'next/font/google'
// Playfair Display : titres d'articles en lecture (font-heading)
// Geist : tout le reste - UI, body, titres cartes, labels, logo
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { cookies } from 'next/headers'
import { LocaleProvider } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/translations'
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://distil.app'),
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const initialLocale: Locale = localeCookie === 'en' ? 'en' : 'fr'

  return (
    <html
      lang={initialLocale}
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LocaleProvider initialLocale={initialLocale}>
            {children}
            <Toaster position="bottom-center" />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
