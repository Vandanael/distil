# Distil — User flow idéal MVP

Date : avril 2026
Auteur : Yvan
Statut : discovery sprint zero — Bloc B

---

## Structure générale

Le flow se décompose en deux temps distincts :

1. **Onboarding** : création du profil d'intérêt, point d'entrée unique avec bifurcation Express / Wizard
2. **Boucle principale** : usage quotidien, de la lecture au feedback loop sur le profil

---

## Partie 1 — Onboarding

### Point d'entrée commun

```
Découvre l'app
      |
Écran d'accueil
(2 chemins proposés)
```

L'écran d'accueil présente les deux options côte à côte, sans hiérarchie visuelle entre elles. Le choix appartient à l'utilisateur.

---

### Chemin A — Express (Marc, Yvan)

Chemin principal. Objectif : profil créé en moins de 2 minutes, zéro friction.

```
Textarea libre
"Je suis PM, je lis sur le product, l'IA, les startups..."
      |
Confirmation
Profil par défaut affiché (modifiable)
      |
[converge]
```

Contrainte technique : le produit doit fonctionner correctement même avec un profil Express d'une seule phrase. À valider dès le sprint 2.

Mitigation Marc : proposer un profil par défaut par secteur via une liste déroulante optionnelle ("je travaille dans [domaine]") pour les utilisateurs qui ne rempliront pas la textarea.

---

### Chemin B — Wizard guidé (Thomas, Claire)

Accessible depuis l'écran d'accueil, ou via "personnaliser davantage" depuis le chemin Express.

```
Étape 1 / 5 — Domaines d'intérêt
      |
Étapes 2 – 4 — Sources, rythme de lecture, quota anti-bulle
      |
Étape 5 — Récap + ajuster
      |
[converge]
```

Le wizard n'est pas une alternative dégradée : c'est le chemin pour les utilisateurs qui veulent un contrôle explicite sur le scoring dès le départ.

---

### Convergence

Les deux chemins aboutissent au même état :

```
Profil créé
Agent démarre
      |
Premier feed
Articles scorés disponibles
```

---

## Partie 2 — Boucle principale

### Vue d'ensemble

```
Agent actif (continu, asynchrone)
Web search + scoring
      |
Feed du jour
Articles scorés + justifiés  <----  Save manuel (bookmarklet)
      |
Choisit un article
ou consulte les rejetés
      |
[bifurcation]
```

---

### Branche A — Lecture

```
Lecture
Mode distraction-free
      |
Actions post-lecture
Highlight · note · tag · archive
      |
Search
Full-text + sémantique
      |
Affine le profil  --------> Agent (boucle)
Feedback loop · re-score
```

---

### Branche B — Écran rejetés

Accessible depuis le feed, avant même d'ouvrir un article.

```
Écran rejetés
Raison visible par article
      |
Actions post-lecture
(même destination que branche A)
```

L'écran rejetés est l'outil principal de diagnostic d'un scoring raté en production. Il doit être accessible tôt dans la navigation, pas en fin de parcours.

---

### Save manuel (entrée parallèle)

Un article peut entrer dans le feed sans passer par l'agent : via le bookmarklet desktop ou le Web Share Target mobile. Il atterrit dans le feed avec un label "sauvegardé par toi" distinct des articles trouvés par Distil.

```
Trouve un article en naviguant
      |
Bookmarklet / share mobile
      |
Confirmation de save (feedback immédiat)
      |
Article dans le feed
(label "sauvegardé par toi")
```

---

### La boucle de retour

```
Affine le profil
      |
      +--------> Agent re-score les prochains articles
```

C'est le coeur du produit. Sans cette boucle, Distil n'est qu'un reader. La boucle se déclenche :

- explicitement : l'utilisateur modifie son profil après avoir consulté les rejetés
- implicitement (phase 2) : inférence à partir des comportements (articles lus jusqu'au bout, temps passé, archives)

---

## Écrans impliqués — récapitulatif

| Écran | Sprint cible | Rôle dans le flow |
|---|---|---|
| Accueil / onboarding Express | Sprint 1 | Entrée principale, chemin Marc/Yvan |
| Wizard guidé | Sprint 1 | Entrée Thomas/Claire, "personnaliser" |
| Feed | Sprint 3 | Hub central, point de départ quotidien |
| Lecture distraction-free | Sprint 3 | Consommation de l'article |
| Écran rejetés | Sprint 3-4 | Diagnostic scoring, accessibilité haute |
| Actions post-lecture | Sprint 4 | Highlight, note, tag, archive |
| Search | Sprint 6 | Full-text + sémantique |
| Profil / préférences | Sprint 1 + Sprint 4 | Onboarding puis édition continue |

---

## Ce que ce flow ne couvre pas (hors MVP)

- Export Obsidian (phase 2)
- Web Share Target mobile (sprint 9 ou avant selon validation mobile-first)
- Profil implicite par comportement (phase 2)
- Serendipity avec paramètre de distance sémantique (sprint 7)
- Mode daily digest avec hard cap (à creuser sprint 3)

---

*Ce document est le flow idéal de référence. Les specs fonctionnelles par écran (Bloc C) sont l'étape suivante.*
