# Distil — Étude marché

Date : avril 2026
Auteur : Yvan
Statut : discovery sprint zero

## 1. Contexte marché

Deux événements structurants ont remodelé le paysage read-later récemment.

- **Pocket fermé par Mozilla le 8 juillet 2025**, suppression définitive des données le 12 novembre 2025. Environ 20 millions d'utilisateurs orphelins, 2 milliards d'articles sauvegardés perdus pour ceux qui n'ont pas exporté.
- **Omnivore racheté par ElevenLabs fin 2024 puis fermé**, créant une deuxième vague de migration vers Readwise Reader et Karakeep.

Tendances de fond :
1. Fatigue du bruit algorithmique et du LLM-slop, demande pour la curation explicite
2. L'IA générative devient un standard attendu, plus une option
3. Le self-hosting et la souveraineté des données redeviennent des arguments forts

## 2. Panorama open source

### Karakeep (ex-Hoarder) — benchmark direct
- Stack : TypeScript, self-hosted first, support Ollama pour modèles locaux
- Forces : auto-tagging IA, résumé IA, full-text search, extension navigateur, preview PDF/images, interface propre
- Limites vs Distil : purement passif (attend que l'utilisateur sauvegarde), pas de veille active, pas de scoring par profil d'intérêt, pas d'anti-bulle, pas de recherche sémantique avancée
- Lien : https://github.com/karakeep-app/karakeep
- À retenir : c'est notre benchmark technique. On doit être aussi propre, avec la couche active en plus.

### Wallabag — le vétéran
- Stack : PHP, très mature, grosse communauté FR
- Forces : parsing d'article excellent, tags, highlights, API documentée, plugin Obsidian maintenu, archive long terme fiable
- Limites : zéro IA native, UX vieillissante
- À retenir : s'inspirer de la robustesse du parsing. Ne pas essayer de le battre sur le stockage long terme.

### Linkwarden
- Bookmark manager open source orienté collaboration et archives permanentes
- Moins pertinent pour Distil solo. À noter pour phase 3 multi-user.

### Miniflux — le contre-modèle
- Stack : Go, ultra minimaliste
- Philosophie explicite anti-algorithme, anti-social, anti-reco
- Preuve qu'une partie du marché veut zéro IA et zéro push
- À retenir : si Distil se plante sur la qualité du scoring, les power users iront vers Miniflux. Le scoring doit être meilleur que "rien" dès le premier jour.

### FreshRSS
- RSS reader self-hosted avec règles de filtrage, auto-tagging basique, OPML
- Solide, populaire, pas d'IA
- Complémentaire plus que concurrent : certains utilisateurs combinent FreshRSS + Karakeep

### Ce que l'open source NE FAIT PAS (et que Distil peut faire)

Aucun projet open source ne combine ces 4 briques aujourd'hui :
1. Veille proactive par LLM avec web search (pas juste agrégateur RSS passif)
2. Scoring par profil d'intérêt en langage naturel (pas juste des règles)
3. Anti-bulle assumée et visible avec contrôle utilisateur
4. Recherche sémantique qualité production sur la mémoire personnelle

**Il y a une place.**

## 3. Panorama payant

### Readwise Reader — leader post-Pocket (7,99$/mois)
- Stack : propriétaire, cross-platform
- Forces : tout-en-un (articles, PDF, ebooks, newsletters, YouTube, Twitter), highlights qui syncent avec Notion/Obsidian/Roam/Logseq, spaced repetition, Ghostreader (IA copilote qui résume/traduit/répond)
- Limites vs Distil : aucune curation proactive, tu dois toujours apporter le contenu toi-même. UX de power tool fouillis.
- À retenir : benchmark qualité de lecture et écosystème PKM. Notre lecture doit être au moins aussi soignée. On ne rivalisera pas sur la profondeur de features.

### Matter — premium Apple
- Stack : iOS-only, design très soigné
- Forces : newsletters, audio/TTS premium, follow auteurs/curateurs, couche de discovery sociale
- Limites : lock-in Apple, opaque sur le "pourquoi" des recommandations
- À retenir : ils ont déjà une couche discovery curée, preuve que la demande existe. On fait mieux sur la transparence.

### Raindrop.io — archiviste cross-platform
- Forces : gros free tier, collections organisées, assistant IA sur Pro, extension navigateur excellente
- Plus archiviste que curateur. Choix safe des anciens Pocket.
- Pro : 38$/an

### BeeMind — AI-native
- Angle : "ne pas hoarder, retenir", chat IA sur la base de connaissances, spaced repetition
- Pricing : lifetime 79$ ou 7$/mois
- À surveiller comme entrant sérieux

### Readless — inspiration philosophique forte
- Angle radical : transforme tes newsletters en un digest IA quotidien au lieu de te donner une boîte de plus à vider
- Scope restreint (newsletters only) mais philosophie exactement alignée avec "distiller"
- À retenir : leur pitch "moins mais mieux" est le nôtre. S'inspirer de leur ton.

### Mymind
- AI-first sur l'auto-organisation, zéro effort utilisateur
- Totalement opaque : l'utilisateur ne sait pas pourquoi il voit ce qu'il voit
- Contre-exemple de ce qu'on ne veut pas (boîte noire)

### Ce qu'aucun payant NE FAIT (et que Distil peut faire)

- Curation proactive (agent qui va chercher activement)
- **+** scoring transparent et justifié par article
- **+** anti-bulle assumée avec contrôle utilisateur sur le quota
- **+** recherche sémantique sur la mémoire personnelle
- **+** souveraineté (potentiellement open source plus tard)

Readwise a la puissance mais aucune curation proactive. Matter a la curation mais iOS-only et opaque. Readless a la philosophie mais limité aux newsletters. Aucun ne propose l'écran Rejetés ni les justifications par article.

## 4. Leçons des grands journaux

### New York Times (Nieman Lab, octobre 2024)
- 250 articles publiés par jour, home page en accueille 50-60
- Approche "editorially driven algorithms" : jugement humain injecté à chaque étape, pas un substitut
- Techniquement : contextual bandits, pools de candidats soit manuels soit générés par règles
- Éditeur peut override les sorties de l'algo
- Source : https://www.niemanlab.org/2024/10/how-the-new-york-times-incorporates-editorial-judgment-in-algorithms-to-curate-its-home-page/
- **Leçon pour Distil** : l'algo seul ne suffit jamais. Chez nous, ce jugement c'est Claude qui l'applique via le profil verbal, et il doit être rendu visible.

### BBC Sounds recommender
- Principe explicite : limiter la personnalisation pour que les gens ne perdent pas l'expérience partagée du contenu largement pertinent
- Anti-bulle éditorial intégré dès la conception
- **Leçon pour Distil** : Serendipity validé par une référence média publique majeure. Ce n'est pas un gimmick.

### Recherche académique sur les bulles de filtre
- Constat robuste de Pariser (2011) jusqu'aux études 2024-2025 : personnalisation opaque = bulles
- L'injection de diversité réduit l'effet mais la vraie solution passe par la transparence + contrôle utilisateur
- Les utilisateurs valorisent la curation personnelle qui leur donne le contrôle sur les critères
- La transparence sur les valeurs éditoriales renforce la confiance
- **Leçon pour Distil** : socle éthique direct. Transparence et contrôle sont des features, pas des options.

### Étude multi-pays (26 pays, 53k répondants)
- Globalement les gens préfèrent la sélection algo
- MAIS dans 6 pays dont la France, l'Allemagne, les Pays-Bas, le Brésil, le Danemark et la Suisse, la sélection par éditeurs est considérée comme la meilleure façon d'obtenir l'information
- **Leçon pour Distil** : l'angle "newspaper" n'est pas juste esthétique, il est aligné avec une préférence culturelle mesurée en France. Go.

## 5. Les 4 principes volés aux journaux

À graver dans le produit, à afficher dans le `CLAUDE.md` :

1. **Le jugement humain pilote l'algo, pas l'inverse.** Le profil d'intérêt verbal de l'utilisateur est la source de vérité. Claude l'applique, ne le devine pas.
2. **La transparence est un pilier, pas une option.** Chaque article gardé a une justification écrite. Chaque article rejeté est consultable avec sa raison.
3. **La diversité est intégrée by design via Serendipity.** Ce n'est pas une feature bonus, c'est dans le cœur du scoring avec un quota paramétrable.
4. **Le design éditorial communique les valeurs avant le contenu.** Typographie, hiérarchie, labels. Comme une une de journal.

## 6. Benchmarks à garder en tête pendant le build

- **Karakeep** : benchmark technique open source. Aussi propre, avec la couche active en plus.
- **Readwise Reader** : benchmark qualité de lecture et PKM. Expérience de lecture au moins aussi soignée.
- **Readless** : inspiration philosophique "moins mais mieux".
- **NYT editorial algo** : référence éthique. Jugement humain dans l'algo, transparence, jamais de boîte noire.

## 7. Risques identifiés

### Risque 1 : le churn post-activation
Tous les outils read-later souffrent du cimetière d'articles non lus. Matter, Pocket, Instapaper, tous. La vraie valeur de Distil ne sera pas prouvée par "combien d'articles il ingère" mais par "combien tu en lis vraiment" et "à quel point ce que tu lis t'est utile".

**Mitigation** : KPIs à définir plus tard, mais instrumenter dès le MVP pour pouvoir mesurer.

### Risque 2 : la dépendance à un seul LLM
Si Claude a un outage ou si l'API bouge, l'agent s'arrête. Karakeep a anticipé avec le support Ollama local.

**Mitigation** : acceptable pour MVP solo. À rouvrir en phase 2 pour fallback local ou multi-provider.

### Risque 3 : biais de confirmation malgré Serendipity
15% de hasard injecté ne suffit pas toujours si l'utilisateur ignore systématiquement ces items. La recherche montre que la simple injection de diversité ne résout pas tout.

**Mitigation** : mesurer l'engagement sur items Serendipity séparément. Si toujours zappés, augmenter le signal ou changer la présentation.

## 8. Sources clés

- Nieman Lab — NYT editorial algorithms : https://www.niemanlab.org/2024/10/how-the-new-york-times-incorporates-editorial-judgment-in-algorithms-to-curate-its-home-page/
- Columbia Journalism Review — Journalistic newsfeed values : https://www.cjr.org/tow_center/journalism-newsfeeds-ai-artificial-intelligence.php
- Étude multi-pays personnalisation (Tandfonline) : https://www.tandfonline.com/doi/full/10.1080/21670811.2018.1493936
- User Perspectives on News Personalisation : https://www.tandfonline.com/doi/full/10.1080/21670811.2020.1773291
- Karakeep GitHub : https://github.com/karakeep-app/karakeep
- Best Pocket alternatives 2026 : https://beemind.app/blog/pocket-alternatives
- Best read-later apps 2026 : https://www.readless.app/compare/best-read-later-apps-2026
