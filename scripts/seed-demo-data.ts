/**
 * Seed demo data for the 5 test accounts.
 * Injects hardcoded articles - no network calls, no LLM.
 * Run AFTER create-test-accounts.mjs
 *
 * Usage: npx tsx scripts/seed-demo-data.ts [--force]
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local', 'utf8')
function getEnv(key: string): string {
  const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'))
  if (!match) throw new Error(`Missing ${key} in .env.local`)
  return match[1].trim()
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface DemoArticle {
  url: string
  title: string
  author: string
  site_name: string
  published_at: string
  excerpt: string
  content_text: string
  word_count: number
  reading_time_minutes: number
  score: number
  justification: string
  is_serendipity: boolean
  status: 'accepted' | 'rejected'
  rejection_reason: string | null
}

// ---- Politique & Monde (test-pm@distil.app) ----

const POLITIQUE_ARTICLES: DemoArticle[] = [
  {
    url: 'https://www.lemonde.fr/international/article/2025/04/guerre-ukraine-negociations',
    title: 'Ukraine : ce que révèlent les premières négociations directes depuis 2022',
    author: 'Piotr Smolar',
    site_name: 'Le Monde',
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    excerpt:
      'Après trois ans de guerre totale, des contacts discrets ont repris entre Kiev et Moscou. Analyse des conditions, des acteurs et de ce que chaque camp peut accepter.',
    content_text: `Les premières négociations directes entre l'Ukraine et la Russie depuis le printemps 2022 se déroulent dans un contexte radicalement différent de celui qui avait vu échouer les pourparlers d'Istanbul. Trois ans de guerre de haute intensité ont reconfiguré les rapports de force, les positions intérieures des deux pays et la géographie du front.

Du côté ukrainien, la ligne rouge n'a pas bougé sur le papier : aucune cession de territoire souverain. Mais la pression militaire et économique pousse Kyiv vers des formulations plus ambiguës autour du "cessez-le-feu d'abord, statut des territoires ensuite". Une formule que Moscou lit comme une ouverture.

Du côté russe, l'objectif de "dénazification" a disparu du discours officiel. Ce qui reste : une Ukraine hors de l'OTAN, des garanties sur le statut du russe dans les régions à majorité russophone, et la reconnaissance de facto des territoires occupés - au minimum en termes de ligne de cessez-le-feu.

Les États-Unis jouent un rôle ambigu. Washington pousse à un accord avant la fin de l'année, mais refuse d'y être associé publiquement tant que les garanties de sécurité ukrainiennes ne sont pas résolues. L'Europe, elle, s'inquiète d'un accord conclu sans elle qui fixerait pour des décennies l'architecture de sécurité du continent.

La vraie question : un cessez-le-feu sans accord politique est-il stable ? Tous les précédents depuis 1945 suggèrent que non.`,
    word_count: 248,
    reading_time_minutes: 2,
    score: 91,
    justification: 'Correspond aux sujets : géopolitique, politique internationale',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.courrierinternational.com/article/democratie-recul-mondial-2025',
    title: 'Le grand recul démocratique : comment 40 pays ont basculé en dix ans',
    author: 'Anna Grzymala-Busse',
    site_name: 'Courrier International',
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    excerpt:
      "L'indice annuel de Freedom House dresse un tableau sombre : pour la 19e année consécutive, les libertés reculent dans le monde. Mais les mécanismes ont changé.",
    content_text: `L'érosion démocratique contemporaine ne ressemble pas aux coups d'État du XXe siècle. Elle est plus lente, plus légale en apparence, et donc plus difficile à enrayer. Les régimes qui basculent aujourd'hui vers l'autoritarisme le font en conservant les élections, les parlements, les constitutions - mais en les vidant progressivement de leur substance.

Le mécanisme est devenu un classique : un parti populiste remporte une élection libre. Il modifie la loi électorale, place des loyalistes aux commandes des médias publics et de la justice, rend plus difficile l'existence des ONG et de l'opposition. Au bout de deux ou trois mandats, les élections restent formellement libres mais ne sont plus équitables.

Ce que montrent les données de Freedom House pour 2025 : les pays qui régressent le plus vite ne sont plus des autocraties ouvertes comme la Russie ou la Chine - ils ont depuis longtemps quitté le classement des démocraties. Les chutes les plus fortes concernent des pays comme la Hongrie, la Tunisie, El Salvador, Israël et, dans une moindre mesure, l'Inde - des pays qui se réclamaient encore de la démocratie il y a dix ans.

Ce qui résiste : les démocraties où le pouvoir judiciaire reste indépendant et où la société civile est dense. La Pologne en est l'exemple inverse réussi : l'érosion sous PiS a été partiellement renversée par une alternance électorale, ce qui montre que le processus n'est pas irréversible.`,
    word_count: 242,
    reading_time_minutes: 2,
    score: 87,
    justification: 'Correspond aux sujets : politique, société, démocratie',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.monde-diplomatique.fr/2025/04/chine-afrique-nouvelle-phase',
    title: "Chine-Afrique : la nouvelle phase d'une relation qui se complexifie",
    author: 'Martine Bulard',
    site_name: 'Le Monde diplomatique',
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    excerpt:
      "Après vingt ans d'investissements massifs, la relation sino-africaine entre dans une phase de renégociation. Les États africains reprennent la main - avec des succès inégaux.",
    content_text: `La narrative des "pièges de la dette" chinoise en Afrique a longtemps dominé les analyses occidentales. La réalité qui émerge en 2025 est plus complexe : oui, certains pays ont signé des contrats déséquilibrés et se retrouvent en difficulté. Mais d'autres ont réussi à renégocier, à imposer des clauses de contenu local, à récupérer des actifs quand Pékin ne tenait pas ses engagements.

La Zambie est le cas d'école : après une restructuration de dette douloureuse, le pays a obtenu de Pékin des conditions plus favorables que ce que n'importe quel analyste prévoyait en 2021. L'Éthiopie a renégocié le contrat du chemin de fer Djibouti-Addis-Abeba et récupéré l'opération de la ligne.

Ce qui change structurellement : la nouvelle génération de dirigeants africains parle mandarin, a étudié en Chine, comprend les mécanismes de négociation. La relation n'est plus aussi asymétrique qu'au début des années 2000.

Ce qui ne change pas : Pékin conserve un avantage décisif sur les financements d'infrastructure. Les États-Unis et l'Europe ne proposent toujours pas d'alternative crédible à l'échelle et à la rapidité d'exécution des entreprises chinoises.`,
    word_count: 218,
    reading_time_minutes: 2,
    score: 84,
    justification: 'Correspond aux sujets : géopolitique, politique internationale',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.mediapart.fr/journal/france/2025/election-municipale-abstention',
    title: 'Abstention record aux municipales : ce que les chiffres disent vraiment',
    author: 'Rémi Lefebvre',
    site_name: 'Mediapart',
    published_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    excerpt:
      "63% d'abstention au premier tour. Derrière le chiffre brut, une analyse fine des territoires montre que le désengagement n'est pas uniforme - et que ses causes non plus.",
    content_text: `63% d'abstention. Le chiffre est là, massif. Mais l'uniformité du nombre cache une géographie du désengagement qui mérite d'être décortiquée.

Les zones qui abstiennent le plus : les quartiers populaires des grandes villes, les zones rurales isolées, les villes moyennes désindustrialisées. Ce sont des territoires qui partagent un point commun : le sentiment que la municipalité ne change pas fondamentalement leur quotidien, que les grandes décisions se prennent ailleurs.

Les zones qui participent le plus : les communes rurales à faible densité, les communes aisées des périphéries urbaines, les petites villes avec une tradition associative forte. Dans ces territoires, l'élection municipale conserve sa dimension de "vote de proximité" - on connaît les candidats, on peut les croiser au marché.

Ce qui frappe dans les données de 2025 par rapport à 2020 : la chute supplémentaire parmi les 25-40 ans, une tranche d'âge qui avait encore des taux de participation corrects en 2020. C'est le signe que l'abstention n'est plus seulement un phénomène de jeunes ou de milieux populaires - elle gagne des couches qui avaient jusqu'ici maintenu leur participation.

La vraie question politique : est-ce que les partis adaptent leur offre en conséquence, ou continuent-ils à optimiser pour l'électorat qui vote ?`,
    word_count: 228,
    reading_time_minutes: 2,
    score: 79,
    justification: 'Correspond aux sujets : politique française, société',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.lemonde.fr/sport/article/2025/04/football-paris-saint-germain-ligue-champions',
    title: 'Le PSG en demi-finale : comment le club a reconstruit son identité après les stars',
    author: 'Rémi Dupré',
    site_name: 'Le Monde',
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    excerpt:
      "Sans Mbappé, sans Neymar, le PSG atteint le dernier carré européen avec un collectif que personne n'attendait. L'analyse d'une métamorphose.",
    content_text:
      'Après les années faste des stars galactiques, le PSG version 2025 incarne un modèle différent...',
    word_count: 145,
    reading_time_minutes: 1,
    score: 41,
    justification: 'Article hors profil - serendipité',
    is_serendipity: true,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.voici.fr/news-people/people-francais/tension-entre-stars-cannes-2025',
    title: 'Tension au festival : les coulisses de la brouille entre deux stars de Cannes',
    author: 'Rédaction Voici',
    site_name: 'Voici',
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    excerpt:
      "On vous dit tout sur l'accrochage qui a fait jaser tout le festival. Les révélations exclusives d'un proche.",
    content_text: 'Le festival de Cannes cache rarement ses tensions, mais cette année...',
    word_count: 110,
    reading_time_minutes: 1,
    score: 14,
    justification: 'Article hors profil',
    is_serendipity: false,
    status: 'rejected',
    rejection_reason: 'low_score',
  },
]

// ---- Cuisine & Gastronomie (test-consultant@distil.app) ----

const CUISINE_ARTICLES: DemoArticle[] = [
  {
    url: 'https://www.lefooding.com/articles/la-revolution-silencieuse-du-sans-alcool',
    title: 'La révolution silencieuse du sans-alcool dans les restaurants étoilés',
    author: 'Alexandre Cammas',
    site_name: 'Le Fooding',
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    excerpt:
      "Les accords mets-sans-alcool sont passés du geste charitable au vrai travail de cave. Dans les grandes maisons, le mocktail est mort - le jus vivant l'a remplacé.",
    content_text: `Il y a cinq ans, demander un accord sans alcool dans un restaurant étoilé vous valait au mieux une eau pétillante et un sourire condescendant, au pire une série de sodas industriels servis sans conviction. 2025 marque une rupture nette.

Dans les maisons qui font aujourd'hui référence - Septime, Frenchie, La Scène - le menu de boissons sans alcool est travaillé avec la même rigueur que la carte des vins. Fermentations maison au kéfir et au kombucha, jus de légumes lacto-fermentés, infusions à chaud et à froid de plantes locales. Ce n'est plus un service de substitution : c'est une proposition gastronomique à part entière.

Le moteur de ce changement ? Pas seulement la santé ou la mode. C'est la montée en compétence des sommeliers sur les fermentations. Un bon verjus maison avec une réduction au vinaigre de cidre peut accompagner un plat de façon aussi précise qu'un vin naturel. L'acidité travaille pareil, la complexité aromatique aussi.

Ce qui reste compliqué : l'accord avec les plats gras et riches. Le vin a une structure tannique qui coupe le gras - les boissons sans alcool travaillent autrement, souvent par contraste acide ou par légèreté. Certains chefs adaptent désormais leur cuisine en fonction : moins de richesse, plus de fraîcheur, des sauces émulsionnées plutôt que montées au beurre.

À suivre : le travail de Margot Lecarpentier au Dauphin, qui explore les fermentations de fleurs sauvages comme accord avec la cuisine végétale.`,
    word_count: 245,
    reading_time_minutes: 2,
    score: 92,
    justification: 'Correspond aux sujets : gastronomie, cuisine, restaurants',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.lemangeur.fr/technique/maitriser-la-fermentation-lacto',
    title: 'Lacto-fermentation : le guide technique pour aller au-delà du kimchi',
    author: 'Estérelle Payany',
    site_name: 'Le Mangeur',
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    excerpt:
      "La fermentation lactique est la technique la plus sûre et la plus reproductible pour transformer n'importe quel légume. Voici comment maîtriser les variables qui font la différence.",
    content_text: `La lacto-fermentation repose sur un principe simple : en présence de sel, les bactéries lactiques naturellement présentes sur les légumes prolifèrent et produisent de l'acide lactique, qui conserve et transforme le produit. Mais entre le principe et la maîtrise, il y a beaucoup de variables.

Le sel d'abord. La concentration idéale se situe entre 2% et 3% du poids des légumes. En dessous de 2%, on risque la prolifération de mauvaises bactéries. Au-dessus de 3%, la fermentation ralentit trop. La précision ici n'est pas optionnelle - une balance de cuisine est indispensable.

La température ensuite. Entre 18°C et 22°C, la fermentation est active et produit un profil aromatique complexe. En dessous de 15°C, elle ralentit et donne des produits plus doux. Au-dessus de 25°C, elle s'emballe et peut donner des textures molles et des arômes trop prononcés. La cave est souvent l'endroit idéal.

L'anaérobiose enfin - les légumes doivent rester submergés. Un légume exposé à l'air moisit. La technique du poids (une pierre propre, un sac plastique rempli d'eau salée) est plus fiable que les joints de caoutchouc des bocaux spécialisés.

Ce qui change tout : fermenter des légumes de saison à leur pic. Un chou fermenté en octobre avec une tête de pleine saison n'a rien à voir avec ce qu'on obtient avec un chou de serre en mars. La lacto-fermentation amplifie la qualité du produit de base, elle ne la remplace pas.`,
    word_count: 238,
    reading_time_minutes: 2,
    score: 89,
    justification: 'Correspond aux sujets : cuisine, technique culinaire',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.lechefmagazine.fr/portrait/anne-sophie-pic-transmettre',
    title: 'Anne-Sophie Pic : "La transmission, c\'est accepter que le plat devienne autre chose"',
    author: 'Charlotte Langrand',
    site_name: 'Le Chef Magazine',
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    excerpt:
      "La cheffe triplement étoilée revient sur vingt ans à la tête de la maison Pic - et sur ce que transmettre une cuisine signifie vraiment quand on a construit quelque chose d'unique.",
    content_text: `Anne-Sophie Pic dirige la maison Pic à Valence depuis 1997. Trois étoiles Michelin depuis 2007, une expansion internationale mesurée, et une réflexion de fond sur ce que signifie transmettre une cuisine dans le monde contemporain.

"Transmettre, c'est d'abord accepter de lâcher prise. Si je forme quelqu'un à reproduire exactement ce que je fais, je n'ai pas transmis - j'ai cloné. La vraie transmission, c'est quand le plat évolue entre les mains de quelqu'un d'autre et devient quelque chose que je n'aurais pas imaginé seule."

Sur la question du genre dans la haute cuisine : "Les choses ont changé, mais moins vite qu'on ne le dit. Ce qui a vraiment changé, c'est que les jeunes femmes qui arrivent en cuisine aujourd'hui ne s'excusent plus d'être là. Elles n'ont plus ce réflexe de disparaître. C'est peut-être la vraie révolution."

Sur la créativité et la pression des classements : "Le risque du guide Michelin, c'est de vous faire cuisiner pour des inspectrices et inspecteurs plutôt que pour les gens qui sont à table. J'ai eu cette période. Ce qui m'en a sortie, c'est revenir aux émotions que je voulais provoquer - pas aux critères que je voulais cocher."

Ce qui la préoccupe aujourd'hui : "La disparition des petits producteurs. On peut faire toute la cuisine du monde qu'on veut, si les semences paysannes disparaissent et qu'il ne reste que deux ou trois variétés de tomates industrielles, on a perdu quelque chose d'irremplaçable."`,
    word_count: 255,
    reading_time_minutes: 2,
    score: 85,
    justification: 'Correspond aux sujets : gastronomie, cuisine, chefs',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.cuisineactuelle.fr/recettes/beurre-noisette-usage-avances',
    title: "Beurre noisette : tous les usages que vous n'avez pas encore essayés",
    author: 'Marie Abadie',
    site_name: 'Cuisine Actuelle',
    published_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    excerpt:
      "On sait l'utiliser sur une sole meunière ou une madeleine. Mais le beurre noisette peut transformer des plats auxquels on ne l'associe jamais - légumes rôtis, vinaigrettes, glaces.",
    content_text: `Le beurre noisette est l'une des transformations culinaires les plus accessibles et les plus puissantes : faire fondre du beurre jusqu'à ce que les protéines de lait caramélisent produit une profondeur aromatique sans commune mesure avec le beurre cru ou simplement fondu.

L'application classique - poisson meunière, madeleine, financier - ne représente qu'une fraction de ce que cette technique permet.

Sur les légumes : des haricots verts juste blanchis sautés dans un beurre noisette avec quelques câpres et du zeste de citron sont une garniture plus intéressante que 90% des préparations élaborées. La même logique fonctionne avec des brocolis, des asperges, des panais rôtis.

En vinaigrette : un beurre noisette mélangé à froid avec du vinaigre de xérès et une moutarde ancienne donne une vinaigrette chaude qui tient sur une salade de chicorée, de lentilles ou d'endives. La chaleur résidulle légèrement fane les feuilles - c'est l'effet recherché.

En base de glace : remplacer une partie de la crème ou du lait par un beurre noisette refroidi produit une glace aux notes de caramel et de noisette grillée sans avoir à faire un caramel. La technique fonctionne aussi bien dans une sorbetière qu'en méthode no-churn.

Le risque principal : aller trop loin. Entre beurre noisette et beurre brûlé, il y a trente secondes. La couleur cible est celle d'une noisette décortiquée, l'arôme doit être de noisette torréfiée - pas d'amer.`,
    word_count: 232,
    reading_time_minutes: 2,
    score: 81,
    justification: 'Correspond aux sujets : cuisine, techniques culinaires',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.leparisien.fr/economie/immobilier-paris-prix-2025',
    title: 'Immobilier parisien : les prix ont encore chuté dans 8 arrondissements',
    author: 'Sophie Bordier',
    site_name: 'Le Parisien',
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    excerpt:
      'La correction amorcée en 2023 se poursuit dans la capitale, avec des baisses atteignant 12% dans certains arrondissements. Les acheteurs reprennent la main.',
    content_text:
      'Après des années de hausse ininterrompue, le marché immobilier parisien connaît une correction...',
    word_count: 130,
    reading_time_minutes: 1,
    score: 17,
    justification: 'Article hors profil',
    is_serendipity: false,
    status: 'rejected',
    rejection_reason: 'low_score',
  },
]

// ---- Tech & Numérique (test-dev@distil.app) ----

const TECH_ARTICLES: DemoArticle[] = [
  {
    url: 'https://news.ycombinator.com/item?id=39847291',
    title: 'TypeScript 5.5 - Type-Safe Regex Groups, Inferred Type Predicates',
    author: 'Daniel Rosenwasser',
    site_name: 'Hacker News',
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    excerpt:
      'TypeScript 5.5 ships two long-requested features: type-safe capture groups from regex patterns, and inferred type predicates from return type analysis.',
    content_text: `TypeScript 5.5 lands with two features that will immediately change how many of us write type guards and work with regex.

Type-safe regex groups: when you match a regex with named capture groups, TypeScript now infers the type of each group automatically. No more casting match results. The type system understands your regex pattern.

Inferred type predicates: TypeScript now infers type predicates from function bodies. If a function returns x !== null && typeof x === 'string', TypeScript understands the function as a type predicate without you needing to declare it.

Both features reduce the ceremony of type-safe code in common patterns. The release also includes performance improvements to the type checker that reduce incremental build times by 10-15% on large projects.`,
    word_count: 140,
    reading_time_minutes: 1,
    score: 91,
    justification: 'Correspond aux sujets : TypeScript, développement',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://react.dev/blog/2025/04/react-19-stable',
    title: 'React 19 Stable : Actions, Server Components et le nouveau compilateur',
    author: 'React Team',
    site_name: 'React Blog',
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    excerpt:
      'React 19 est officiellement stable. Les trois grandes nouveautés : Actions pour les transitions async, Server Components stables, et le React Compiler en opt-in.',
    content_text: `React 19 est officiellement stable. Après une beta plus longue que prévu, les trois grandes features sont prêtes pour la production.

Les Actions formalisent le pattern des transitions d'état asynchrones déclenchées par des interactions utilisateur. useActionState et useFormStatus rendent les formulaires beaucoup moins verbeux.

Les Server Components font maintenant partie de React stable, pas uniquement de Next.js. Le modèle est plus simple qu'en preview : des composants async qui tournent côté serveur, zéro impact sur le bundle client.

Le React Compiler s'intègre en opt-in. Il analyse statiquement vos composants et élimine le besoin de useMemo et useCallback dans la plupart des cas. Les résultats sur le codebase de Meta sont significatifs.`,
    word_count: 145,
    reading_time_minutes: 1,
    score: 88,
    justification: 'Correspond aux sujets : React, développement web',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://lobste.rs/s/open-source-sustainability-2025',
    title: 'Open Source Sustainability : ce qui fonctionne vraiment',
    author: 'Drew DeVault',
    site_name: 'Lobsters',
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    excerpt:
      'Après des années de burnouts et de librairies critiques abandonnées, certains modèles de financement open source ont enfin assez de recul pour être évalués.',
    content_text: `Le Sovereign Tech Fund (Allemagne) et NLNET (UE) montrent que le financement public peut fonctionner sans les contraintes du financement corporate. La clé : ils financent la maintenance et la sécurité, pas uniquement les nouvelles features - c'est le travail ennuyeux qui fait tourner l'infrastructure critique.

Le dual licensing a fait un retour discret. Les projets AGPL pour l'open source et licence commerciale pour l'enterprise trouvent un équilibre durable. Avec un bémol : le CLA crée de la friction pour les contributeurs.

Ce qui ne fonctionne toujours pas : l'hypothèse que les entreprises qui dépendent de l'open source vont volontairement le financer à grande échelle. Ça n'a pas eu lieu, ça n'a pas lieu, et ça n'aura probablement pas lieu sans changement structurel.`,
    word_count: 158,
    reading_time_minutes: 1,
    score: 83,
    justification: 'Correspond aux sujets : open source, numérique',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://tldr.tech/tech/2025-04-10',
    title: 'Node.js 22 LTS, Vite 6 avec Rolldown, Deno Deploy edge crons',
    author: 'TLDR Team',
    site_name: 'TLDR',
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    excerpt:
      'Node.js 22 entre en LTS. Vite 6 sort avec Rolldown (bundler Rust, 3-5x plus rapide). Deno Deploy ajoute les cron jobs edge. GitHub Copilot ouvre les PRs en mode agent.',
    content_text: `Node.js 22 officiellement en Long Term Support. Les features marquantes : V8 12.4 avec WebAssembly amélioré, stripping TypeScript natif (plus besoin de transpilation pour la plupart des usages), et une meilleure compatibilité fetch() avec la spec navigateur.

Vite 6 sort avec Rolldown en beta comme bundler par défaut. Rolldown est un portage Rust de Rollup : 3 à 5x plus rapide sur les builds complets. La sortie est identique à Rollup, ce devrait être un drop-in.

GitHub Copilot mode agent (preview) peut maintenant ouvrir des PRs, lancer des tests, et itérer sur la base des retours CI sans intervention humaine.`,
    word_count: 130,
    reading_time_minutes: 1,
    score: 79,
    justification: 'Correspond aux sujets : outils dev, numérique',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.lequipe.fr/Football/Actualites/champions-league-psg-semifinale',
    title: 'Ligue des Champions : le PSG domine et file en demi-finale',
    author: "Rédaction L'Equipe",
    site_name: "L'Équipe",
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    excerpt:
      "Victoire 3-1 face à l'Atletico. Le PSG retrouve le dernier carré européen pour la première fois depuis 2021.",
    content_text:
      "Le Paris Saint-Germain s'est qualifié pour les demi-finales de la Ligue des Champions...",
    word_count: 110,
    reading_time_minutes: 1,
    score: 38,
    justification: 'Article hors profil - serendipité',
    is_serendipity: true,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.aufeminin.com/mode/tendances-ete-2025',
    title: "10 tendances mode incontournables de l'été 2025",
    author: 'Cécile Martin',
    site_name: 'aufeminin',
    published_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    excerpt:
      "Du crochet au total look beige, voici tout ce qu'il faut avoir dans son dressing cet été selon les défilés.",
    content_text:
      "L'été 2025 s'annonce coloré et textured selon les tendances venues des podiums...",
    word_count: 105,
    reading_time_minutes: 1,
    score: 13,
    justification: 'Article hors profil',
    is_serendipity: false,
    status: 'rejected',
    rejection_reason: 'low_score',
  },
]

// ---- Sport & Bien-être (test-chercheur@distil.app) ----

const SPORT_ARTICLES: DemoArticle[] = [
  {
    url: 'https://www.runnersworld.com/fr/entrainement/plan-semi-marathon-12-semaines',
    title: 'Plan 12 semaines : finir un semi-marathon sans se blesser',
    author: 'Claire Baudier',
    site_name: "Runner's World",
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    excerpt:
      "La majorité des blessures en course à pied surviennent non pas par manque d'effort, mais par progression trop rapide. Ce plan intègre les données récentes sur la gestion de la charge.",
    content_text: `La règle des 10% - ne jamais augmenter son volume hebdomadaire de plus de 10% - est un bon point de départ, mais la recherche récente montre qu'elle est trop simpliste. Ce qui compte davantage : le ratio entre la charge aigüe (la semaine en cours) et la charge chronique (la moyenne des quatre dernières semaines).

Un ratio charge aigüe/charge chronique supérieur à 1,5 est le principal prédicteur de blessure, indépendamment du volume total. Concrètement : si vous avez fait 30 km en moyenne sur les quatre dernières semaines, ne montez pas au-dessus de 45 km cette semaine, même si vous vous sentez en forme.

Le plan 12 semaines pour un premier semi-marathon s'articule autour de trois phases : fondation (semaines 1-4, rythme conversationnel, 3 sorties/semaine), construction (semaines 5-8, introduction d'une séance de fractionné, longue sortie qui monte à 16 km), et affûtage (semaines 9-12, réduction du volume, maintien de l'intensité).

Ce que la plupart des plans oublient : le travail de gainage et de renforcement des hanches. 80% des blessures courantes du coureur (syndrome de l'essuie-glace, syndrome rotulien, fasciite plantaire) ont pour origine une faiblesse des muscles stabilisateurs de la hanche, pas une faiblesse des jambes.

Intégrez deux séances de 20 minutes de gainage par semaine dès la première semaine. C'est l'investissement le plus rentable pour arriver à la ligne de départ en bonne santé.`,
    word_count: 242,
    reading_time_minutes: 2,
    score: 93,
    justification: 'Correspond aux sujets : running, sport, performance physique',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.sofoot.com/psychologie/mental-des-champions-zone-optimale',
    title: 'La zone optimale de performance : ce que les neurosciences ont appris des champions',
    author: 'Julien Momont',
    site_name: 'So Foot',
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    excerpt:
      "Être 'dans la zone', c'est un état neurologique précis. La recherche a maintenant assez de données pour comprendre comment y accéder - et comment le sport de haut niveau peut en apprendre au commun des mortels.",
    content_text: `L'état de flow décrit par Mihaly Csikszentmihalyi dans les années 90 a longtemps été traité comme un concept essentiellement psychologique. Les neurosciences de la dernière décennie lui donnent une base biologique plus précise.

En état de flow, on observe une réduction de l'activité dans le cortex préfrontal - la partie du cerveau qui gère la conscience de soi, le jugement, la planification. C'est paradoxal : mieux performer, c'est partiellement "éteindre" la partie rationnelle du cerveau. La transient hypofrontality theory (Dietrich, 2003, révisée en 2019) est maintenant bien étayée.

Ce qui déclenche cet état dans le sport : un défi légèrement supérieur aux compétences actuelles. Trop facile, c'est l'ennui. Trop difficile, c'est l'anxiété. La zone étroite entre les deux, c'est le flow.

Ce que les athlètes d'élite font différemment : ils ont des routines de pré-performance très précises qui servent d'interrupteur vers cet état. Pas parce que les routines sont magiques - parce qu'elles associent par conditionnement un ensemble de signaux sensoriels à un état mental. Avec suffisamment de répétitions, la routine devient un raccourci.

Application pratique pour le sportif amateur : identifier les 5-10 minutes qui précèdent votre meilleure performance et les ritualisir. Même musique, même ordre d'échauffement, même séquence mentale. La cohérence crée la prévisibilité de l'état.`,
    word_count: 238,
    reading_time_minutes: 2,
    score: 88,
    justification: 'Correspond aux sujets : mental, performance, sport',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.lequipe.fr/Tennis/Article/Roland-Garros-2025-tableau',
    title: 'Roland-Garros 2025 : le tableau, les favoris, les outsiders à surveiller',
    author: "Rédaction Tennis L'Équipe",
    site_name: "L'Équipe",
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    excerpt:
      "Alcaraz-Sinner, l'affiche rêvée en finale ? Analyse du tableau, des conditions de jeu et des possibilités de surprises dans les premiers tours.",
    content_text: `Le tableau de Roland-Garros 2025 s'est dévoilé ce jeudi. Carlos Alcaraz, tenant du titre, hérite d'une partie de tableau théoriquement abordable jusqu'en quart de finale. Jannik Sinner, numéro un mondial depuis janvier, se retrouve dans la moitié haute avec un potentiel quart contre Novak Djokovic.

Les favoris : Alcaraz reste le favori logique sur terre battue à Paris. Sa victoire de 2024 a démontré sa capacité à gérer la pression d'un Grand Chelem sur surface lente. Sinner a moins d'expérience sur terre mais son niveau global en 2025 en fait un prétendant sérieux.

Les outsiders à surveiller : Holger Rune, finaliste surprise en 2023, retrouve confiance après une période difficile. Stefanos Tsitsipas, quatre fois demi-finaliste, a le jeu pour une semaine exceptionnelle. Et du côté des Français, Arthur Fils a franchi un palier significatif.

Les conditions : le clay parisien a été retravaillé après les critiques de 2023 sur des rebonds irréguliers. La surface devrait être plus rapide que les deux dernières éditions.`,
    word_count: 198,
    reading_time_minutes: 1,
    score: 85,
    justification: 'Correspond aux sujets : tennis, sport',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.santemagazine.fr/nutrition/proteines-sport-guide-pratique',
    title: 'Protéines et sport : ce que la science dit vraiment (et ce que les marques taisent)',
    author: 'Dr. Stéphane Cascua',
    site_name: 'Santé Magazine',
    published_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    excerpt:
      'La fenêtre anabolique de 30 minutes post-effort est un mythe marketing. La réalité de la synthèse protéique est plus nuancée - et plus favorable aux sportifs qui ne comptent pas leurs grammes.',
    content_text: `La recherche en nutrition sportive a beaucoup évolué ces dix ans, mais le marketing des compléments alimentaires n'a pas suivi. Plusieurs croyances très répandues méritent d'être révisées.

La fenêtre anabolique post-effort : l'idée que vous devez absolument consommer des protéines dans les 30 minutes suivant l'exercice sous peine de "perdre" votre séance est une simplification excessive. Les études récentes (Morton et al., 2018 ; Schoenfeld, 2019) montrent que la synthèse protéique reste élevée pendant 24 à 48 heures après l'exercice intense. Manger vos protéines dans les 2 heures est bien, dans les 30 minutes n'est pas nécessaire pour la plupart des sportifs amateurs.

La dose optimale par repas : longtemps fixée à 20-30g, elle est maintenant réévaluée à la hausse pour les sportifs de plus de 40 ans et pour les séances de très haute intensité. Les données récentes suggèrent 0,4g/kg de poids corporel par repas comme référence plus pertinente que le chiffre absolu.

Les sources : whey, caséine, protéines végétales - toutes fonctionnent si l'apport total est suffisant. L'obsession pour la whey est un artefact marketing plus que scientifique. Pour un sportif qui mange équilibré, les compléments protéinés sont rarement nécessaires.`,
    word_count: 226,
    reading_time_minutes: 2,
    score: 82,
    justification: 'Correspond aux sujets : nutrition, sport, bien-être',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.lequipe.fr/Cyclisme/Article/tour-de-france-parcours-2025',
    title: 'Tour de France 2025 : un parcours taillé pour les grimpeurs, Pogacar en grand favori',
    author: 'Jean-François Quénet',
    site_name: "L'Équipe",
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    excerpt:
      'Le tracé dévoilé ce jeudi favorise clairement les grimpeurs avec 5 arrivées au sommet en altitude. Analyse du parcours et des forces en présence.',
    content_text:
      'Le parcours du Tour de France 2025 avec ses cinq arrivées au sommet va favoriser les grimpeurs purs...',
    word_count: 125,
    reading_time_minutes: 1,
    score: 44,
    justification: 'Article hors profil - serendipité',
    is_serendipity: true,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.bfmtv.com/economie/bourse-cac40-record-historique',
    title: 'Le CAC 40 bat un nouveau record historique porté par les valeurs du luxe',
    author: 'Rédaction BFMTV',
    site_name: 'BFM TV',
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    excerpt:
      "L'indice parisien a clôturé à 8.742 points, son plus haut niveau historique, tiré par LVMH et Hermès.",
    content_text: 'Le marché parisien a signé une nouvelle performance historique ce mercredi...',
    word_count: 95,
    reading_time_minutes: 1,
    score: 16,
    justification: 'Article hors profil',
    is_serendipity: false,
    status: 'rejected',
    rejection_reason: 'low_score',
  },
]

// ---- Culture & Société (test-ml@distil.app) ----

const CULTURE_ARTICLES: DemoArticle[] = [
  {
    url: 'https://www.telerama.fr/cinema/analyse-nouveau-cinema-africain-2025',
    title:
      "Le nouveau cinéma africain s'impose sur les grands festivals - et bouscule les récits dominants",
    author: 'Cécile Mury',
    site_name: 'Télérama',
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    excerpt:
      "De Cannes à Sundance, les films d'Afrique subsaharienne trustent les sélections officielles. Pas parce que c'est la mode - parce que la qualité est là, et les thèmes aussi.",
    content_text: `En 2024, trois films africains ont remporté des prix majeurs dans les festivals A. En 2025, ils sont six en sélection principale à Cannes seul. Ce n'est plus un phénomène émergent : c'est une présence installée, et elle mérite d'être analysée pour ce qu'elle est plutôt que comme une curiosité exotique.

Ce qui caractérise cette vague : une volonté de raconter des histoires africaines pour des publics africains d'abord - sans médiation occidentale, sans explication des codes culturels pour un supposé regard extérieur. Les films qui réussissent le plus sont ceux qui traitent le spectateur africain comme le spectateur de référence.

Techniquement, la génération 2020-2025 a accès à des outils de production qui existaient à peine en Afrique il y a dix ans. Les plateformes de streaming ont financé des formations, des écoles de cinéma ont ouvert à Lagos, Nairobi, Dakar. La chaîne de production existe maintenant localement pour des projets de niveau international.

Ce qui change dans les récits : moins de misère comme décor, moins de conflit comme unique trame. Des films sur la classe moyenne urbaine d'Abidjan, sur les dynamiques familiales à Accra, sur la relation à la tradition dans une Lagos hypermoderne. Des histoires qui ressemblent à celles que raconte n'importe quel cinéma national sur lui-même.

À voir absolument : "La Cour des miracles" de Maïmouna Doucouré (Mali/France), et "Eko Atlantic" du Nigérian Tunde Kelani, deux films qui seront en salles françaises cet automne.`,
    word_count: 258,
    reading_time_minutes: 2,
    score: 91,
    justification: 'Correspond aux sujets : cinéma, culture, société',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.lemonde.fr/livres/article/2025/04/litterature-ia-auteurs-resistance',
    title: "Face à l'IA, les écrivains réinventent ce que seul l'humain peut faire",
    author: 'Raphaëlle Leyris',
    site_name: 'Le Monde des livres',
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    excerpt:
      "Alors que des romans générés automatiquement inondent l'autoédition, une partie de la littérature contemporaine mise sur l'expérience incarnée, la durée et la vulnérabilité.",
    content_text: `La menace que l'intelligence artificielle fait peser sur l'écriture n'est pas la même selon les genres. Les formes les plus standardisées - le roman de genre, le contenu éditorial, les textes fonctionnels - sont effectivement vulnérables à une automatisation rapide. La littérature narrative ambitieuse l'est beaucoup moins, pour des raisons qui tiennent à sa nature même.

Ce que les modèles de langage produisent très bien : la cohérence formelle, la fluidité stylistique dans des registres établis, la capacité à imiter des voix connues. Ce qu'ils ne produisent pas : l'expérience incarnée d'une durée, la vulnérabilité authentique, la résistance de la forme à ce qu'elle dit.

Les auteurs qui s'en sortent le mieux dans ce contexte ne sont pas ceux qui font de la résistance frontale à l'IA ("mon livre est 100% humain") - cette posture est défensive et finira par sembler dérisoire. Ce sont ceux qui font confiance à ce que leur écriture a d'irréductiblement singulier : une syntaxe qui résiste à la fluidité, un rapport au temps qui ne s'optimise pas, une opacité qui n'est pas un défaut mais une intention.

Quelques noms à suivre dans la rentrée littéraire : Kaoutar Harchi, dont le nouveau roman travaille la langue comme matière politique, et Tiago Rodrigues, dont le premier roman prolonge son travail de metteur en scène sur la mémoire collective.`,
    word_count: 242,
    reading_time_minutes: 2,
    score: 87,
    justification: 'Correspond aux sujets : littérature, culture, société, IA',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.lesinrockuptibles.fr/musique/musique-electronique-france-renaissance',
    title:
      "La musique électronique française retrouve une identité - et ce n'est pas celle de Daft Punk",
    author: 'Johanna Seban',
    site_name: 'Les Inrockuptibles',
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    excerpt:
      "Après des années sous l'ombre de l'âge d'or, une nouvelle génération de producteurs français construit quelque chose de genuinement différent - avec des racines dans le club africain, le gqom et la cumbia.",
    content_text: `L'ombre de Daft Punk a longtemps pesé sur la musique électronique française comme une référence impossible à dépasser - et donc paralysante. La génération qui émerge maintenant a grandi après le casque de diamant. Elle ne cherche pas à en hériter. Elle part d'ailleurs.

Les influences structurantes de cette vague : le gqom sud-africain et ses rythmiques syncopées à 130 BPM, la cumbia électronique colombienne, la baile funk brésilienne. Des musiques de danse qui n'ont jamais eu besoin de validation européenne pour exister et qui sont arrivées en France par les diasporas avant d'arriver par les festivals.

Ce qui les distingue techniquement : un rapport au temps différent. La dance music européenne mainstream est obsédée par le "four on the floor" - le tempo régulier qui donne ses repères au dancefloor. La nouvelle vague française joue beaucoup plus avec la syncope, l'anticipation, les silences.

Les noms à connaître : ANAIS (Paris, productions hybrides club africain/ambient), Luzcid (collectif marseillais, croisement cumbia et techno industrielle), et Yseult qui sur son dernier EP emprunte aux rythmiques afrobeat sans tomber dans l'appropriation superficielle.

Le lieu qui cristallise tout ça : le Glazart à Paris, qui a construit une programmation internationale avec cette identité depuis 2022.`,
    word_count: 238,
    reading_time_minutes: 2,
    score: 83,
    justification: 'Correspond aux sujets : musique, culture',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.slate.fr/societe/solitude-epidemie-jeunes-adultes',
    title:
      "La solitude des jeunes adultes n'est pas un problème de téléphone - c'est un problème d'infrastructure",
    author: 'Marie Kirschen',
    site_name: 'Slate.fr',
    published_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    excerpt:
      "Les données de santé publique sont claires : les 25-35 ans sont la tranche d'âge la plus solitaire. Blâmer les réseaux sociaux est confortable. C'est aussi inexact.",
    content_text: `La solitude est devenue un enjeu de santé publique majeur. L'OMS a créé un bureau dédié en 2024. Le Royaume-Uni a un ministre de la solitude depuis 2018. Les données convergent : les 25-35 ans sont, dans la plupart des pays développés, la tranche d'âge qui déclare le plus de solitude chronique.

La réponse dominante dans les médias grand public : les réseaux sociaux, le télétravail, le smartphone. La réponse est satisfaisante parce qu'elle pointe vers des choix individuels ou des corporations. Elle est aussi insuffisante.

Les recherches en sciences sociales sur les causes de la solitude des jeunes adultes pointent vers quelque chose de beaucoup plus structurel : la disparition des "troisièmes lieux". La théorie, développée par Ray Oldenburg dans les années 80, distingue le premier lieu (le domicile), le deuxième (le travail) et le troisième : le café, le club de sport, le lieu de culte, l'association - les espaces où les gens se retrouvent régulièrement sans agenda précis.

Ces tiers-lieux se raréfient. Les cafés ferment ou deviennent trop chers pour y passer du temps sans consommer. Les clubs sportifs coûtent. Les associations peinent à recruter. La ville devient plus chère et plus fragmentée.

La solution n'est pas individuelle - "sortez, éteignez vos téléphones" - elle est politique : financer les tiers-lieux, rendre les villes plus habitables, construire l'infrastructure de la rencontre.`,
    word_count: 252,
    reading_time_minutes: 2,
    score: 86,
    justification: 'Correspond aux sujets : société, sciences humaines, culture',
    is_serendipity: false,
    status: 'accepted',
    rejection_reason: null,
  },
  {
    url: 'https://www.marieclaire.fr/beaute/soins/routine-skincare-5-etapes',
    title: 'Routine skincare 5 étapes : les produits qui ont vraiment changé notre peau',
    author: 'Emma Lopes',
    site_name: 'Marie Claire',
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    excerpt:
      'On a testé pendant 3 mois les produits dont tout le monde parle sur TikTok. Verdict honnête.',
    content_text:
      'Après trois mois de test intensif des sérums vitamine C, acides et SPF recommandés partout...',
    word_count: 105,
    reading_time_minutes: 1,
    score: 19,
    justification: 'Article hors profil',
    is_serendipity: false,
    status: 'rejected',
    rejection_reason: 'low_score',
  },
]

// ---- Map email -> articles ----

const PERSONA_ARTICLES: Record<string, DemoArticle[]> = {
  'test-pm@distil.app': POLITIQUE_ARTICLES,
  'test-consultant@distil.app': CUISINE_ARTICLES,
  'test-dev@distil.app': TECH_ARTICLES,
  'test-chercheur@distil.app': SPORT_ARTICLES,
  'test-ml@distil.app': CULTURE_ARTICLES,
}

// ---- Seeding logic ----

async function seedForUser(email: string, articles: DemoArticle[], force: boolean) {
  console.log(`\n--- ${email} ---`)

  const listResult = await supabase.auth.admin.listUsers()
  const allUsers = (listResult.data?.users ?? []) as Array<{ id: string; email?: string }>
  const user = allUsers.find((u) => u.email === email)

  if (!user) {
    console.log('  User not found - run create-test-accounts.mjs first')
    return
  }

  if (!force) {
    const { count } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (count && count > 0) {
      console.log(`  Already has ${count} articles - skipping (use --force to reseed)`)
      return
    }
  } else {
    await supabase.from('articles').delete().eq('user_id', user.id)
    await supabase.from('scoring_runs').delete().eq('user_id', user.id)
    console.log('  Cleared existing data')
  }

  const { data: run, error: runError } = await supabase
    .from('scoring_runs')
    .insert({
      user_id: user.id,
      agent_type: 'messages',
      completed_at: new Date().toISOString(),
      articles_analyzed: articles.length,
      articles_accepted: articles.filter((a) => a.status === 'accepted').length,
      articles_rejected: articles.filter((a) => a.status === 'rejected').length,
    })
    .select('id')
    .single()

  if (runError || !run) {
    console.log(`  Failed to create scoring run: ${runError?.message}`)
    return
  }

  const rows = articles.map((a) => ({
    user_id: user.id,
    url: a.url,
    title: a.title,
    author: a.author,
    site_name: a.site_name,
    published_at: a.published_at,
    content_html: `<p>${a.content_text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`,
    content_text: a.content_text,
    excerpt: a.excerpt,
    word_count: a.word_count,
    reading_time_minutes: a.reading_time_minutes,
    score: a.score,
    justification: a.justification,
    is_serendipity: a.is_serendipity,
    rejection_reason: a.rejection_reason,
    kept_anyway: false,
    status: a.status,
    origin: 'agent',
    scored_at: new Date().toISOString(),
  }))

  const { error: insertError } = await supabase.from('articles').insert(rows)

  if (insertError) {
    console.log(`  Insert error: ${insertError.message}`)
    return
  }

  const accepted = articles.filter((a) => a.status === 'accepted').length
  const rejected = articles.filter((a) => a.status === 'rejected').length
  console.log(`  Seeded: ${accepted} accepted, ${rejected} rejected`)
}

async function main() {
  const force = process.argv.includes('--force')
  console.log(`Seeding demo data for 5 test accounts${force ? ' (force mode)' : ''}...\n`)

  for (const [email, articles] of Object.entries(PERSONA_ARTICLES)) {
    try {
      await seedForUser(email, articles, force)
    } catch (err) {
      console.error(`  Error for ${email}: ${(err as Error).message}`)
    }
  }

  console.log('\nDone! Log in with magic links from create-test-accounts.mjs')
}

main().catch(console.error)
