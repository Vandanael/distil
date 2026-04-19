// Reseed les 5 profils demo pour correspondre a leurs personas publiques
// (src/app/demo/[slug]/page.tsx). Met a jour profile_text + interests + sector,
// puis regenere l'embedding via Voyage voyage-3 (1024-dim).
// Usage : node --env-file=.env.local scripts/reseed-demo-profiles.mjs
import { createClient } from '@supabase/supabase-js'

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings'
const MODEL = 'voyage-3'

const PROFILES = [
  {
    id: '795c2637-7e43-4b74-82b1-560899cf62d7',
    label: 'Politique & Monde',
    profile_text:
      "Cadre interesse par la geopolitique, la democratie et l'actualite internationale. Suit les dynamiques de pouvoir, les relations diplomatiques, les transformations democratiques, les enjeux europeens et le contexte economique mondial. Cherche des analyses de fond plutot que du breaking news, des perspectives contrastees sur les grands sujets, et comprend mieux les elections, guerres, crises via des regards longs.",
    interests: [
      'geopolitique',
      'democratie',
      'relations internationales',
      'Europe',
      'analyse politique',
    ],
    sector: 'Politique',
  },
  {
    id: '17e9ac27-5bc3-403c-94e4-cb2d6db1e38c',
    label: 'Cuisine & Gastronomie',
    profile_text:
      "Passionne de cuisine et de gastronomie. S'interesse aux techniques culinaires, aux chefs, aux restaurants, aux produits et terroirs, aux recettes, a la critique gastronomique et a la culture food. Lit aussi bien des tests de produits que des profils de chefs, des histoires de plats ou des enquetes sur la filiere. Apprecie les longs formats qui racontent le pourquoi derriere une recette ou un mouvement culinaire.",
    interests: ['cuisine', 'gastronomie', 'chefs', 'restaurants', 'recettes'],
    sector: 'Cuisine',
  },
  {
    id: 'a615fba9-490a-4dd9-a161-45f8c9b54943',
    label: 'Tech & Numerique',
    profile_text:
      "Developpeur et curieux de l'ecosysteme tech et numerique. Suit l'actualite des outils, frameworks, langages, open source, IA appliquee, produits tech, startups et culture du dev. S'interesse autant au fond technique (papers, post-mortems, architecture) qu'a l'industrie (leadership tech, trends, releases). Eviter le marketing creux, privilegier les sources primaires et les retours d'experience.",
    interests: ['tech', 'developpement', 'open source', 'IA', 'dev tools'],
    sector: 'Tech',
  },
  {
    id: 'e970bbf3-eb89-476a-bf68-250f53f6ec13',
    label: 'Sport & Bien-etre',
    profile_text:
      "Sportif amateur qui s'interesse au running, au mental et a la performance, a la nutrition, au sommeil, au bien-etre physique et psychologique. Lit des analyses d'entrainement, des recits d'athletes, des enquetes sur la science du sport, des conseils de preparation, des reflexions sur la longevite et l'equilibre vie-sport. Cherche du concret, base sur la science, pas du coaching pop-psy.",
    interests: ['running', 'performance', 'nutrition', 'mental', 'bien-etre'],
    sector: 'Sport',
  },
  {
    id: 'ce745cc5-266e-4293-a677-2cad575f1aef',
    label: 'Culture & Societe',
    profile_text:
      "Curieux de culture et de societe. S'interesse au cinema, a la musique, a la litterature, aux idees, aux essais, aux debats de societe, a l'art contemporain, aux mouvements culturels et aux grands themes (ecologie, genre, travail, technologie dans la societe). Apprecie les longs formats, les critiques fouillees, les essais qui prennent du recul sur l'actualite et les enquetes culturelles.",
    interests: ['culture', 'cinema', 'musique', 'litterature', 'societe'],
    sector: 'Culture',
  },
]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const voyageKey = process.env.VOYAGE_API_KEY
if (!url || !key || !voyageKey) {
  console.error('Manque env')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function embed(text) {
  const r = await fetch(VOYAGE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${voyageKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, input: [text] }),
  })
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`Voyage ${r.status}: ${body.slice(0, 200)}`)
  }
  const json = await r.json()
  return json.data[0].embedding
}

for (const p of PROFILES) {
  const text = `${p.profile_text} Interets: ${p.interests.join(', ')}.`
  const embedding = await embed(text)
  const { error } = await sb
    .from('profiles')
    .update({
      profile_text: p.profile_text,
      interests: p.interests,
      sector: p.sector,
      embedding: JSON.stringify(embedding),
      updated_at: new Date().toISOString(),
    })
    .eq('id', p.id)
  if (error) {
    console.error(`[err] ${p.label}: ${error.message}`)
    continue
  }
  console.log(`[ok] ${p.label} — embedding ${embedding.length}d`)
}

console.log(`\n${PROFILES.length} profils reseedés.`)
