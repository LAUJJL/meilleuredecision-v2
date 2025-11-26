# Langage Pivot – Définition Officielle

Le Langage Pivot est le langage interne utilisé par le système pour traduire
les raffinements du visiteur en un modèle cohérent, mathémique et calculable.

Il est composé d’éléments de différents types, chacun jouant un rôle distinct
dans la construction du modèle.

---

# 1. Types d’éléments

## 1.1 TEMP — Constantes provisoires / précaires
- Valeurs temporaires introduites par le visiteur.
- Peuvent varier dans les limites définies.
- Peuvent être transformées plus tard en :
  - CONST,
  - PARAM,
  - AUX,
  - ou équations complètes.

## 1.2 CONST — Constantes fixes
- Valeurs considérées comme immuables dans le modèle.
- Déterminées par le visiteur.
- Ne changent plus durant les raffinements suivants.

## 1.3 PARAM — Paramètres
- Informations nécessaires au modèle mais non déterminées.
- Doivent être spécifiées plus tard ou évaluées au moment du calcul.
- Rôle intermédiaire entre TEMP et CONST.

## 1.4 AUX — Variables auxiliaires
- Variables introduites pour aider à formuler des relations intermédiaires.
- Leur équation peut changer lors des raffinements suivants.
- Elles peuvent même disparaître si le visiteur ne les stabilise pas.

## 1.5 AUX_STABLE — Variables auxiliaires stabilisées
- Le visiteur décide explicitement :
  - que la variable ne sera plus modifiée,
  - que son équation ne changera plus.
- Sert à figer une partie de la structure interne.

---

# 2. Boucle de Raffinement Validé

Chaque cycle de raffinement suit les étapes suivantes :

1. Le visiteur propose un texte.
2. Le système génère **deux reformulations** en langage naturel.
3. Le visiteur juge si ces deux reformulations expriment la même idée que lui.
4. S’il valide :
   - Le système choisit une reformulation comme base du modèle interne.
   - Une étape est créée.
5. Le visiteur valide ou rejette l’étape.
6. Seules les étapes validées alimentent le modèle interne.

---

# 3. Contributions (structure prévue)

Chaque étape de raffinement peut contenir :
- des définitions,
- des contraintes,
- des relations,
- des mécanismes,
- des buts,
- des clarifications, etc.

Le système accepte que **plusieurs contributions** apparaissent dans une même étape.

Une structure est prévue :
```ts
contributions: string[];
