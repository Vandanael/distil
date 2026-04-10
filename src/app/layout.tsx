import type { Metadata } from 'next'
import { Quintessential, Geist } from 'next/font/google'
import './globals.css'

/* Titres display : Quintessential
   Calligraphique, caractere unique, associations litteraires (pas tech) */
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
    <html lang="fr" className={`${quintessential.variable} ${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
