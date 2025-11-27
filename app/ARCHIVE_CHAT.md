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
