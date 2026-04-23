import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, Geist, Geist_Mono } from 'next/font/google'
// Instrument Serif : titres hero / chapitres / lecture (font-display, font-heading)
// Geist Sans : corps, UI, labels, logo (font-body, font-ui, font-sans)
// Geist Mono : metadonnees, chiffres de chapitre, dates (font-mono)
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { cookies } from 'next/headers'
import { LocaleProvider } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/translations'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
})

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const DEFAULT_DESCRIPTION = 'Veille intelligente. Moins de bruit, mieux lu.'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://distil.app'),
  title: { default: 'Distil', template: '%s - Distil' },
  description: DEFAULT_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  // Beta privee : on coupe l'indexation le temps de tester en cercle ferme.
  robots: { index: false, follow: false, nocache: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Distil',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/icons/favicon-32.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Distil',
    title: 'Distil',
    description: DEFAULT_DESCRIPTION,
    locale: 'fr_FR',
    alternateLocale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Distil',
    description: DEFAULT_DESCRIPTION,
  },
}

export const viewport: Viewport = {
  themeColor: '#1a3a2e',
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
      className={`${instrumentSerif.variable} ${geist.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:font-ui focus:text-sm focus:border focus:border-border focus:outline-none"
        >
          Passer au contenu
        </a>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LocaleProvider initialLocale={initialLocale}>
            <TooltipProvider delay={500}>{children}</TooltipProvider>
            <Toaster position="bottom-center" />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
