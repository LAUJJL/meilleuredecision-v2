# Archive du Projet – Synthèse Permanente

Ce fichier résume l’état stable du projet et permet de le reconstruire
même si la conversation ChatGPT est perdue.

---

## 1. Objectif du projet

Construire un site où un visiteur développe progressivement un modèle logique
via des raffinements successifs, validés étape par étape.

---

## 2. Composants actuels

- Saisie de texte de raffinement
- Reformulations automatiques
- Validation par le visiteur
- Étapes acceptées ou rejetées
- Modèle interne structuré par :
  - TEMP
  - CONST
  - PARAM
  - AUX
  - AUX_STABLE
- Contributions textuelles
- Bornes (logiques + utilisateur) prévues dans la structure

---

## 3. Boucle de Raffinement Validé

1. Texte du visiteur  
2. Deux reformulations  
3. Validation des reformulations  
4. Création d’une étape  
5. Validation ou rejet  
6. Mise à jour du modèle interne

---

## 4. Structure du modèle interne

Chaque étape validée inclut :
- texte d’origine,
- texte normalisé,
- type d’éléments Pivot,
- contributions,
- (plus tard) bornes.

---

## 5. Priorités de conception

- simplicité,
- transparence,
- contrôle par le visiteur,
- éviter l’usine à gaz,
- IA utilisée dans un cadre structuré,
- chacun doit comprendre ce qu’il valide.

---

## 6. Bornes de variation

Les éléments non fixes peuvent avoir :

### Bornes logiques (internes)
- définies automatiquement selon le type (ex : probabilité → [0 ; 1])

### Bornes utilisateur (optionnelles)
- fournies par le visiteur pour refléter sa réalité.

---

## 7. Redémarrage complet du projet (si tout est perdu)

1. Installer Node, Git, VS Code, GitHub Desktop.  
2. `git clone` du dépôt GitHub.  
3. Lire `LANGAGE_PIVOT.md` et `ARCHIVE_CHAT.md`.  
4. `npm install`  
5. `npm run dev`  
6. Reprendre les raffinements.

---

## 8. Position actuelle

- Moteur simple opérationnel  
- Langage Pivot formalisé  
- Bornes intégrées dans la structure  
- Sauvegarde Git opérationnelle  
- Sécurité du projet garantie  
- Prochaine étape : enrichir le moteur si besoin
Décisions récentes arrêtées au 2/12/2025 (continuité)

Méthode strictement top-down : Problème → Visions → Raffinements.

Immutabilité : une fois validé, un problème/vision/raffinement n’est jamais modifiable (lecture seule seulement).

V1 minimaliste : on accepte de tester un problème/une vision à la fois.

Raffinement 1 : stock + flux + horizon + tableau (début/fin de période).

Raffinement 2 : objectif minimal ; on peut s’arrêter au R2 si l’objectif est atteint.

L’évaluation (atteint/non atteint) doit être recalculée à chaque raffinement qui change la trajectoire.

Raffinement 3 : “activité ajoutée” modifie les flux et peut rendre l’objectif atteint.

Prochaine étape : produire app/refinements/page.tsx V-next2 avec R3 + recalcul dynamique de l’évaluation de l’objectif.

- Méthode strictement top-down : Problème → Visions → Raffinements.
- Immutabilité : une fois validé, un problème/vision/raffinement n’est jamais modifiable (lecture seule seulement).
- V1 minimaliste : on accepte de tester un problème/une vision à la fois.
- Raffinement 1 : stock + flux + horizon + tableau (début/fin de période).
- Raffinement 2 : objectif minimal ; on peut s’arrêter au R2 si l’objectif est atteint.
- Raffinement 3 : “activité ajoutée” modifie les flux et peut rendre l’objectif atteint.
- L’évaluation (atteint/non atteint) est recalculée à chaque raffinement qui change la trajectoire.

### Nuance clé (méthode) : raffinement = état d’information explicité par le visiteur

- Un raffinement ne représente pas “le problème de base” : il représente l’état courant de ce que le visiteur
  choisit d’exprimer à ce stade, et qu’il enrichit ensuite.
- Les valeurs saisies peuvent être indicatives/démonstratives (notamment en R1) : en stricte méthode, des “vraies données”
  pourraient arriver seulement en R2, mais on autorise certains éléments dès R1 pour ne pas surcharger.
- Le visiteur décide où placer certaines sources/charges (ex : salaire) selon la vision :
  - Vision “salarié sans activité ajoutée” : salaire et dépenses peuvent être posés dès R1 (flux de base).
  - Vision “avec activité ajoutée” : le visiteur peut intégrer le salaire dans l’activité ajoutée (R3) et choisir des flux de base différents.
- Règle générale : le modèle reflète uniquement l’information fournie à ce stade ; l’enrichissement est progressif.

### Régime des constantes / paramètres et passage entre raffinements (important pour éviter des pertes en bascule)

- Distinguer durablement :
  1) bornes/identité d’un objet (type, unité, domaine, définition) : immuables une fois définies ;
  2) valeur : peut être révisable selon le statut.
- Une “constante paramètre” peut évoluer de statut au fil des raffinements :
  - provisoire → paramètre révisable → fixée ;
  - ou devenir une variable/auxiliaire d’équation (fixe ou variable) selon le raffinement.
- Règle d’interface : au passage Rn → Rn+1, on propose par défaut la valeur précédente (préremplissage)
  pour les éléments dont la valeur est révisable ; si l’élément est devenu “fixé”, il reste en lecture seule.
- Règle d’affichage : les résultats calculés (stock_final / ecart / atteint, etc.) sont des dérivés du modèle courant :
  ils ne doivent pas être stockés dans un raffinement validé ; ils doivent pouvoir s’afficher dynamiquement en prévisualisation.

  Décision V1 : simplification du Langage Pivot
Pour une V1 limitée à R1–R3 (Trésorerie), on retire du pivot actif les notions “fixe/paramétrique/provisoire”, “auxiliaires”, et “équations figées/variables”, jugées trop lourdes et non nécessaires à ce stade.
Ces notions sont conservées en annexe V2+ pour être réintroduites lorsque la méthode inclura R4+ et/ou une assistance IA.
## Raffinement R1 — Structure fixe

R1 est un raffinement structurel universel et invariant.

Il repose sur une structure minimale commune à tous les modèles dynamiques :
- un stock,
- des flux entrants,
- des flux sortants,
- un stock initial,
- un horizon.

À ce stade :
- les flux sont conceptuels et constants,
- leur signification n’est pas précisée,
- les valeurs sont libres et démonstratives,
- aucun objectif n’est introduit.

R1 ne vise pas à représenter fidèlement la réalité.
Il sert uniquement à poser une ossature commune, sur laquelle les raffinements suivants
viendront introduire des hypothèses, du sens et, le cas échéant, un objectif.
