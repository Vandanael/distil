# Distil — Wrapup atelier card sorting

Date : avril 2026
Auteur : Yvan
Statut : discovery sprint zero — Bloc A

---

## Ce qu'on a fait

Atelier de tri par cartes simulé sur les 5 personae synthétiques (Yvan, Claire, Marc, Sarah, Thomas). Deux passes : une première passe "standard" (must / nice / non par feature), puis une passe adversariale sur les edge cases et contradictions internes.

**Avertissement de méthode** : ces personae sont des hypothèses, pas des utilisateurs réels. Les besoins identifiés ici sont des signaux à explorer, pas des specs à implémenter. Rien n'est validé tant que de vraies personnes n'ont pas utilisé les premiers écrans.

---

## Apprentissages certains

Ces points ont émergé comme robustes même après la passe critique.

### 1. Le triptyque non-négociable

Trois features obtiennent must have pour 5/5 personae sans ambiguïté :
- Feed d'articles scorés
- Lecture distraction-free
- Scoring avec justification visible

C'est le noyau dur. Si on ship ces trois choses bien, on a un produit. Tout le reste est arbitrable.

### 2. La search sémantique est attendue tôt

4/5 personae la classent must ou nice. C'est une bonne surprise : l'argument "on remplace Obsidian" résonne. La search full-text Supabase reste prioritaire (plus rapide à implémenter, Sarah en a besoin d'abord), mais pgvector ne doit pas être repoussé trop loin.

### 3. L'écran Rejetés est sous-estimé dans la roadmap

Il est actuellement sprint 8. Or Claire et Thomas le mettent en must, Yvan en nice. Techniquement, si les articles rejetés sont stockés en base dès le sprint 2 (ce qui est nécessaire de toutes façons pour re-scorer), l'écran est trivial à construire. C'est aussi l'outil principal pour diagnostiquer un scoring raté en production. À monter au sprint 3-4 au minimum.

### 4. L'onboarding double est validé

Marc churne sur un wizard à 5 étapes. Thomas n'a pas confiance dans un simple textarea. L'Express (textarea + 3 clics) en chemin principal, le guidé accessible en "personnaliser davantage" — cette structure est la bonne. Mais elle introduit une contrainte technique forte : le produit doit fonctionner correctement même avec un profil Express d'une phrase. À valider dès le sprint 2.

---

## Apprentissages sous réserve

Ces points semblent vrais mais nécessitent une confrontation avec de vraies personnes avant d'en tirer des conclusions.

### 5. Le modèle mental du "feed" diverge selon les profils

Yvan veut un digest rationné (5 articles max, c'est fini). Marc veut scroller. Claire veut filtrer par sujet. Sarah veut retrouver ses saves. Ces quatre modèles mentaux ne sont pas automatiquement compatibles dans une seule interface. Hypothèse à tester : un feed avec un "daily cap" configurable (défaut : 10) satisfait Yvan sans bloquer Marc. À vérifier avec les premiers testeurs.

### 6. Marc sans profil = produit cassé pour lui

Marc ne configurera rien. Sans profil, l'agent n'a aucun signal et produit un feed généraliste. Marc churne en semaine 2. La solution possible — inférence implicite à partir des comportements (articles lus, temps de lecture, archives) — n'est pas dans la roadmap actuelle. Pour le MVP, la mitigation est un profil par défaut par secteur lors de l'onboarding Express ("je travaille dans [domaine]", liste déroulante). Simple, mais non spécifié.

### 7. Le badge de scoring doit être invisible par défaut

Un badge "Pertinent · 87%" sur chaque article du feed crée de la charge cognitive pour Marc même s'il ne le lit pas. Hypothèse : le score est visible au hover uniquement, avec un mode "scoring visible" activable dans les préférences (Thomas et Claire l'activeront). À tester : est-ce que masquer le score par défaut réduit la confiance pour ceux qui veulent de la transparence ?

---

## Possibilités identifiées (non décidées)

Ces sujets ont émergé comme des options ouvertes. Elles méritent d'être gardées en tête, pas nécessairement implémentées.

### P1 — Daily digest mode

Un mode "je veux X articles ce matin, ensuite c'est fini" avec hard cap configurable. Différent du feed standard. Très aligné avec la philosophie Readless "moins mais mieux". Potentiellement LA feature qui différencie Distil de Karakeep aux yeux d'Yvan et de profils similaires. Pas complexe à implémenter si le feed est une vue sur les articles les mieux scorés du jour. A creuser en sprint 3.

### P2 — Save implicite par l'agent vs save manuel : distinction dans le feed

L'origine d'un article dans le feed (trouvé par l'agent / sauvegardé manuellement) doit être signalée. Ce n'est pas juste une feature UX cosmétique : c'est une question de confiance et de compréhension du produit. Pour Sarah notamment, voir un article qu'elle n'a pas sauvegardé peut être déstabilisant. Un label "trouvé par Distil" vs "sauvegardé par toi" est simple et clarifie le contrat produit.

### P3 — Web Share Target pour le save mobile

Le bookmarklet desktop fonctionne. Sur mobile (Chrome, Safari), il ne fonctionne pas correctement. La vraie solution pour Sarah sur mobile, c'est la Web Share Target API : "Partager > Distil" dans le menu natif iOS/Android. Ça nécessite que la PWA soit installée. Plus complexe que le bookmarklet, mais cohérent avec l'objectif mobile-first. A évaluer avant le sprint 9.

### P4 — Profil implicite par comportement

Pour Marc et les utilisateurs qui ne configurent rien : inférer un profil d'intérêt à partir des 5-10 premières interactions (articles lus jusqu'au bout, temps passé, archives). C'est de la logique de feedback loop, pas du ML complexe. Peut se faire avec de simples règles dans un premier temps ("tu as lu 3 articles sur le product management : j'ajoute ce signal à ton profil"). A envisager en phase 2 si Marc représente effectivement un segment important.

### P5 — Serendipity avec paramètre de distance sémantique

Le quota anti-bulle à 15% fonctionne si les contenus injectés sont "adjacents mais pas identiques". Pour Claire (profil académique précis), du contenu aléatoire sera vécu comme du bruit. Une Serendipity intelligente injecte des contenus à distance sémantique contrôlée du profil : proche (même discipline, auteur différent), moyen (discipline adjacente), loin (domaine complètement différent). Trois modes suffisent. A spécifier avant le sprint 7.

### P6 — Mode "reader only" sans scoring visible

Il existe un segment "fatigué de l'IA" (identifié dans l'étude marché, représenté par Miniflux) qui n'est dans aucun des 5 personae actuels. Ce segment veut un bon reader avec du contrôle, pas une couche IA supplémentaire. La question n'est pas résolue : est-ce une cible de Distil ? Si oui, un mode sans scoring visible (les articles sont triés par date ou par source, comme un RSS classique) est possible sans réécriture majeure. Décision à prendre avant la phase 2.

---

## Questions ouvertes pour les premiers tests

Quand les premiers écrans seront testables, ces questions doivent trouver une réponse :

1. Est-ce qu'un utilisateur qui ne configure pas de profil perçoit quand même le scoring comme "intelligent" ?
2. Est-ce que le badge de score au hover est suffisant pour Thomas, ou a-t-il besoin d'un mode scoring explicitement activé ?
3. Quelle est la réaction de Marc face à un feed de 15 articles dont 10 ne l'intéressent pas au bout d'une semaine ? Churne-t-il ou ajuste-t-il son profil ?
4. Sarah installe-t-elle la PWA naturellement, ou faut-il la guider explicitement ?
5. Le concept "Rejetés" est-il intuitif pour un utilisateur qui n'a pas lu le marketing copy ?

---

## Ce qui ne change pas dans la roadmap

L'ordre général des sprints reste cohérent. Les ajustements suggérés :
- Ecran Rejetés à monter au sprint 3-4 (trivial si les données sont stockées)
- Bookmarklet desktop sprint 4-5, Web Share Target mobile sprint 9 (ou plus tôt si mobile-first validé)
- Profil par défaut par secteur à ajouter dans le scope sprint 1 (mitigation Marc, coût faible)

---

*Ce document est un wrapup d'atelier, pas un backlog. Les besoins décrits ici sont des hypothèses de travail à confirmer ou infirmer avec les premiers utilisateurs réels.*
