---
numero: "ADR-009"
titre: "Reequilibrage bonus sources etablies vs marqueurs intrinseques de qualite"
statut: "supersede par ADR-010"
date: 2026-04-13
---

## Contexte

Le system prompt de scoring attribue +8 pts aux sources de reference (lemonde.fr, nytimes.com, stratechery.com, etc.) et -8 pts aux fermes a clics. Ce bonus favorise les marques connues, ce qui est en tension avec la mission produit : faire emerger les blogs pointus, les sources de fond et les signaux faibles qui disparaissent des feeds classiques.

Problemes observes :

1. Un blog de niche avec un contenu dense et original ne beneficie d'aucun bonus, tandis qu'un article creux d'une source listee gagne +8 pts.
2. Le bonus marque est un proxy de qualite, pas une mesure directe. Il reproduit les biais des feeds mainstream que Distil cherche a contourner.
3. Risque de "blanchiment d'autorite" : un contenu bien redige mais factuellement faux pourrait etre survalorise si on remplace le bonus marque par des marqueurs purement stylistiques (densite argumentative, signature humaine).

Trois options sont envisagees.

## Option A - Statu quo (bonus marques)

Conserver le systeme actuel : +8 pts pour une liste de sources de reference, -8 pts pour les fermes a clics.

- Avantage : simple, previsible, pas de risque de regression
- Inconvenient : biais en faveur des marques connues, les blogs pointus restent sous-valorises
- Risque : perpetue le filtre mainstream que Distil veut combattre

## Option B - Marqueurs intrinseques detectables par LLM

Remplacer le bonus marque par des criteres de qualite intrinseques :

- Densite argumentative : ratio affirmations/preuves ou references
- Signature humaine identifiable : auteur nomme, bio existante, historique d'ecriture
- Anciennete et specificite du domaine : blog actif depuis > 2 ans, niche thematique claire
- Originalite de l'angle : pas un doublon de communique de presse

- Avantage : valorise la qualite intrinseque, permet aux sources inconnues d'emerger
- Inconvenient : plus complexe pour le LLM, risque d'inconsistance entre Haiku/Llama/Gemini
- Risque : blanchiment d'autorite - un contenu bien ecrit mais faux peut passer les filtres stylistiques

## Option C - Combiner bonus marque et marqueurs intrinseques

Garder le bonus source (+5 pts au lieu de +8) et ajouter un bonus intrinseque (+3 a +5 pts) cumuilable :

- Le bonus marque sert de plancher de confiance
- Les marqueurs intrinseques permettent aux sources inconnues d'atteindre le meme niveau
- Plafond combine : +10 pts max pour eviter l'inflation

- Avantage : transition douce, pas de regression sur les sources fiables
- Inconvenient : plus de parametres dans le prompt, risque de sur-scoring si les deux s'empilent
- Risque : complexite accrue du prompt, difficulte a calibrer entre modeles

## Decision

A trancher apres une semaine d'usage personnel avec l'instrumentation en place (PR 4 - model_used + prompt_version). Les donnees de scoring_runs permettront de mesurer si les sources de niche sont effectivement sous-representees et dans quelle proportion.

## Consequences

- La decision impactera `buildSystemPrompt()` dans `src/lib/agents/prompts.ts` et devra s'accompagner d'un bump de `PROMPT_VERSION`.
- Si option B ou C retenue, prevoir un test comparatif sur un corpus fixe avec les trois modeles (Haiku, Llama, Gemini) pour verifier la coherence inter-modeles.
- Documenter les resultats de la semaine de self-usage dans `docs/lessons/`.
