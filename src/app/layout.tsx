import type { Metadata } from 'next'
import { Cormorant_Garamond, Lora, Geist } from 'next/font/google'
import './globals.css'

/* Titres display : Cormorant Garamond
   Haute-contraste, magistral en italique, associations litteraires (pas tech) */
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

/* Corps de lecture : Lora
   Serif humaniste, pense pour l'ecran, chaleureux */
const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  style: ['normal', 'italic'],
})

/* UI / labels / donnees : Geist */
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
      className={`${cormorant.variable} ${lora.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
