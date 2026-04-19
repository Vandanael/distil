// Comptes demo - source unique.
// Ces UUIDs correspondent aux comptes stables crees par
// scripts/create-test-accounts.mjs et utilises par la home publique (/) et
// les pages /demo/[slug]. Toute duplication dans src/app est un bug : importer
// DEMO_ACCOUNTS depuis ici.
export type DemoAccountSlug = 'pm' | 'consultant' | 'dev' | 'chercheur' | 'ml'

export type DemoAccount = {
  slug: DemoAccountSlug
  id: string
  email: string
  label: { fr: string; en: string }
  description: { fr: string; en: string }
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    slug: 'pm',
    id: '795c2637-7e43-4b74-82b1-560899cf62d7',
    email: 'test-pm@distil.app',
    label: { fr: 'Politique & Monde', en: 'Politics & World' },
    description: {
      fr: 'Géopolitique, démocratie, actualité internationale',
      en: 'Geopolitics, democracy, international news',
    },
  },
  {
    slug: 'consultant',
    id: '17e9ac27-5bc3-403c-94e4-cb2d6db1e38c',
    email: 'test-consultant@distil.app',
    label: { fr: 'Cuisine & Gastronomie', en: 'Food & Gastronomy' },
    description: {
      fr: 'Techniques, chefs, restaurants, recettes',
      en: 'Techniques, chefs, restaurants, recipes',
    },
  },
  {
    slug: 'dev',
    id: 'a615fba9-490a-4dd9-a161-45f8c9b54943',
    email: 'test-dev@distil.app',
    label: { fr: 'Tech & Numérique', en: 'Tech & Digital' },
    description: { fr: 'Actualité tech, outils, open source', en: 'Tech news, tools, open source' },
  },
  {
    slug: 'chercheur',
    id: 'e970bbf3-eb89-476a-bf68-250f53f6ec13',
    email: 'test-chercheur@distil.app',
    label: { fr: 'Sport & Bien-être', en: 'Sport & Wellness' },
    description: {
      fr: 'Running, mental, nutrition, performance',
      en: 'Running, mindset, nutrition, performance',
    },
  },
  {
    slug: 'ml',
    id: 'ce745cc5-266e-4293-a677-2cad575f1aef',
    email: 'test-ml@distil.app',
    label: { fr: 'Culture & Société', en: 'Culture & Society' },
    description: {
      fr: 'Cinéma, musique, littérature, idées',
      en: 'Cinema, music, literature, ideas',
    },
  },
] as const

// Home publique : 5 comptes vitrine, 1 article par persona = bloc editorial uniforme.
export const HOME_FEATURED_SLUGS: readonly DemoAccountSlug[] = [
  'pm',
  'consultant',
  'dev',
  'chercheur',
  'ml',
]

export function getDemoAccountBySlug(slug: string): DemoAccount | null {
  return DEMO_ACCOUNTS.find((a) => a.slug === slug) ?? null
}
