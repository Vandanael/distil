---
numero: "ADR-007"
titre: "Stockage des highlights par ancrage texte avec fallback"
statut: "accepte"
date: 2026-04-10
---

## Contexte

Les highlights sont des selections de texte dans un article. Il faut les stocker de facon a pouvoir les re-ancrer precisement lors d'un retour en lecture. Deux approches principales ont ete evaluees :

- **DOM offsets** (offset caractere depuis le debut du document) : simple a implementer, mais fragile. Si le HTML de l'article est re-parse ou si la version de Readability change, tous les offsets se decalent et les highlights se desancrent.
- **Ancrage texte avec contexte** : on stocke le texte selectionne lui-meme, plus le contexte immediat (30 chars avant/apres), un selecteur CSS du parent identifiable, et l'offset dans ce parent. Si le re-ancrage echoue, le texte est toujours disponible comme citation orpheline.

Readability parse l'article une seule fois et stocke `content_html` en base. Le DOM est donc stable entre les lectures (pas de re-fetch). Le risque d'offset est limite mais non nul (mise a jour de Readability, correction manuelle d'un article).

L'approche par ancrage texte est celle utilisee par Hypothesis, Apache Annotator, et le W3C Web Annotation Data Model.

## Decision

Nous utilisons le stockage par ancrage texte avec fallback sur le texte brut. La table `highlights` contient :
- `text_content TEXT` : le texte selectionne (toujours present, fallback ultime)
- `prefix_context TEXT` : 30 caracteres avant le debut de la selection
- `suffix_context TEXT` : 30 caracteres apres la fin de la selection
- `css_selector TEXT` : selecteur CSS du plus proche parent identifiable (id ou classe stable)
- `text_offset INT` : offset caractere dans ce parent

A l'affichage, le systeme tente de re-ancrer dans cet ordre :
1. Correspondance exacte prefix + text_content + suffix dans le DOM
2. Correspondance css_selector + text_offset
3. Fallback : affichage du highlight comme citation orpheline avec `text_content`

## Consequences

- Resilience : un highlight ne "disparait" jamais. Au pire il est affiche hors contexte.
- Implementation cote client : un serialiseur (~200 lignes) capture la selection (`window.getSelection().getRangeAt(0)`) et produit le schema. Un anchreur re-applique le highlight au rendu.
- Pas de dependance a une bibliotheque tierce : implementation maison suffisante pour ce schema.
- Limite : si le texte de l'article change (correction editoriale, re-fetch depuis une source modifiee), le re-ancrage peut echouer et tomber en mode orphelin. Acceptable pour un MVP solo.
- Fichiers concernes : `src/lib/highlights/serializer.ts` (capture), `src/lib/highlights/anchorer.ts` (rendu).
