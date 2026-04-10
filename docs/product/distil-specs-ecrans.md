# Distil — Specs fonctionnelles par écran (MVP)

Date : avril 2026
Auteur : Yvan
Statut : discovery sprint zero — Bloc C
Portée : strict minimum pour dérisquer le build. Pas de pixel-perfect, pas de edge cases exhaustifs.

---

## Conventions

- Chaque écran = un objectif unique, un état par défaut, les actions qu'on peut y faire.
- "Hors scope" = à ne pas construire au MVP, même si tentant.
- Les specs visuelles (typo, couleurs) suivent les tokens déjà validés (Fraunces / Source Serif 4 / Geist, marine #11284B, orange #D94E1F, crème #FBF9F4).

---

## 1. Écran d'accueil onboarding

**Objectif** : faire choisir à l'utilisateur entre Express et Wizard sans hiérarchie visuelle.

**Contenu**
- Titre produit + baseline ("Moins de bruit, mieux lu." ou équivalent)
- Deux cartes côte à côte : "Express · 2 min" et "Guidé · 5 étapes"
- Chaque carte : un verbe d'action ("Décris-toi en une phrase" / "Configure ton profil pas à pas")

**Actions** : clic sur une carte → route correspondante.

**État par défaut** : aucune présélection.

**Hors scope** : login social, création de compte (auth Supabase basique email magic link suffit).

---

## 2. Onboarding Express

**Objectif** : profil créé en moins de 2 minutes.

**Contenu**
- Une textarea large, placeholder explicite ("Je suis PM, je lis sur le product, l'IA...")
- Une liste déroulante optionnelle "Je travaille dans [domaine]" (mitigation Marc)
- Bouton "Démarrer"
- Lien discret "Personnaliser davantage" → bascule vers Wizard en pré-remplissant

**Actions**
- Submit → crée le profil en BDD → route vers Feed (vide au départ, état "Distil cherche...")
- Lien wizard → route Wizard avec textarea pré-remplie

**Validation** : textarea ou domaine obligatoire (au moins un des deux).

**Hors scope** : suggestions auto-générées, preview du scoring, tutoriel.

---

## 3. Onboarding Wizard

**Objectif** : profil explicite et contrôlé en 5 étapes.

**Étapes**
1. Domaines d'intérêt (tags libres + suggestions)
2. Sources favorites optionnelles (URLs pinnées, zéro obligatoire)
3. Rythme de lecture (cap quotidien : 5 / 10 / 20 articles)
4. Quota Serendipity (0% / 15% / 30%)
5. Récap éditable

**Actions par étape** : Précédent / Suivant, "Passer" sur les étapes 2-4.

**Fin** : route vers Feed.

**Hors scope** : étape "importer OPML", étape "connecter un compte tiers".

---

## 4. Feed (hub central)

**Objectif** : point d'entrée quotidien, liste des articles scorés du jour.

**Contenu**
- Header : date du jour, compteur "X articles retenus sur Y analysés", lien "Voir les rejetés"
- Liste d'articles cards (titre, source, temps de lecture, 1-2 lignes de résumé, label origine "Trouvé par Distil" ou "Sauvegardé par toi")
- Badge de score : **caché par défaut**, visible au hover (desktop) ou via toggle dans préférences
- État vide : message "Distil cherche tes premiers articles..." avec spinner

**Actions**
- Clic sur card → écran Lecture
- Clic sur "Voir les rejetés" → écran Rejetés
- Clic sur label origine → filtre (phase 2, pas MVP)

**Tri** : par score décroissant, cap appliqué selon le rythme configuré.

**Hors scope** : filtres par tag, recherche depuis le feed, pagination (on coupe au cap).

---

## 5. Lecture distraction-free

**Objectif** : lire confortablement, rien d'autre.

**Contenu**
- Titre, auteur, source, date, temps de lecture estimé
- Corps de l'article parsé (Readability ou équivalent côté serveur)
- Barre d'actions flottante (highlight, note, tag, archive)
- Lien discret "Retour au feed"

**Actions**
- Sélection de texte → popover highlight / note
- Boutons action en bas ou en side
- Échap → retour feed

**Hors scope** : TTS, mode focus chronométré, annotations collaboratives, spaced repetition.

---

## 6. Écran Rejetés

**Objectif** : transparence du scoring, diagnostic.

**Contenu**
- Liste des articles rejetés du jour (ou période sélectionnable simple : aujourd'hui / 7 jours)
- Chaque ligne : titre, source, **raison du rejet en une phrase** (générée par Claude au moment du scoring)
- Action "Garder quand même" → article remonte au feed

**Actions**
- Clic sur un article → ouvre l'article en lecture (même écran que Feed)
- "Garder quand même" → upsert en feed, event loggé pour feedback loop

**Hors scope** : filtres avancés, analytics agrégés des raisons.

---

## 7. Actions post-lecture (highlights, notes, tags, archive)

**Objectif** : capturer le signal utilisateur minimal.

**Contenu**
- Highlight : sélection de texte → bouton unique, stocké avec offsets
- Note : textarea liée à un highlight ou à l'article entier
- Tag : input libre avec autocomplete sur tags existants
- Archive : un clic, retire du feed, reste searchable

**Actions** : create / delete uniquement. Pas d'édition d'un highlight existant au MVP.

**Hors scope** : couleurs de highlights, export Markdown, sync Obsidian.

---

## 8. Search

**Objectif** : retrouver un article ou une idée.

**Contenu**
- Input unique en haut
- Toggle "Full-text / Sémantique" (défaut : full-text, plus rapide)
- Résultats : cards simplifiées (titre, source, snippet, score de pertinence pour la sémantique)

**Actions**
- Submit → résultats
- Clic résultat → Lecture

**Hors scope** : filtres combinés, search dans les highlights seuls, search opérateurs booléens.

---

## 9. Profil / préférences

**Objectif** : éditer le profil d'intérêt et les réglages principaux.

**Contenu**
- Textarea profil (éditable)
- Rythme de lecture (cap)
- Quota Serendipity
- Toggle "Afficher les scores dans le feed"
- Toggle mode clair/sombre
- Sources pinnées (liste éditable)
- Bouton "Re-scorer le feed" (trigger manuel du re-scoring)

**Actions** : save inline, feedback visuel.

**Hors scope** : historique des versions du profil, A/B test de profils, export.

---

## 10. Save manuel (bookmarklet)

**Objectif** : ajouter un article depuis n'importe quelle page web.

**Flow**
- Clic sur le bookmarklet → POST vers API Distil avec URL courante
- Confirmation toast / popup minimal : "Ajouté à Distil"
- L'article est parsé côté serveur, stocké, ajouté au feed avec label "Sauvegardé par toi", pas scoré

**Hors scope MVP** : Web Share Target mobile, extension Chrome, sélection de texte depuis le bookmarklet.

---

## Écrans explicitement **hors MVP**

- Dashboard analytics (temps de lecture, articles lus par semaine)
- Settings sources avancées (scheduling, whitelist/blacklist)
- Page "À propos / philosophie produit"
- Écran d'erreur custom (on reste sur des toasts)
- Mode collaboratif / partage

---

## Priorisation des écrans par sprint

| Sprint | Écrans |
|---|---|
| Sprint 1 | Accueil onboarding, Express, Wizard, Profil (version édition) |
| Sprint 2 | (pas d'écran, agent de scoring backend) |
| Sprint 3 | Feed, Lecture, Rejetés (remonté du sprint 8) |
| Sprint 4 | Actions post-lecture, Profil v2 avec toggle score |
| Sprint 5 | (enrichissement highlights/notes) |
| Sprint 6 | Search |
| Sprint 9 | Bookmarklet |
| Sprint 10 | Polish, dark mode, PWA |

---

## Questions à trancher avant le code

1. Parser d'article : Readability open source suffit-il, ou passer par Mercury / un service externe ?
2. Storage des highlights : offsets DOM ou range-based ? (impact sur la fragilité lors de re-parsing)
3. Auth Supabase : magic link ou password ? (magic link plus simple, moins friction)
4. Format du profil en BDD : text brut ou JSON structuré ? (text brut plus flexible pour Express, JSON pour Wizard → probablement les deux)

---

*Ces specs sont volontairement minimales. Objectif : dérisquer le build, pas figer le produit. Toute feature non listée ici est hors scope MVP par défaut.*
