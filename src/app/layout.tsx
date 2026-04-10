import type { Metadata } from 'next'
import { Bodoni_Moda, Quintessential, Geist } from 'next/font/google'
import './globals.css'

/* Logo : Bodoni Moda — exclusivement pour le mot "Distil" */
const bodoni = Bodoni_Moda({
  variable: '--font-bodoni',
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${bodoni.variable} ${quintessential.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
