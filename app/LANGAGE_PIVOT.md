# Langage Pivot – Définition Officielle

Le Langage Pivot est le langage interne utilisé par le système pour traduire
les raffinements du visiteur en un modèle cohérent, mathématique et calculable.

---

## 1. Types d’éléments

### 1.1 TEMP — Constantes provisoires / précaires
- Valeurs temporaires introduites par le visiteur.
- Peuvent varier dans les limites définies.
- Peuvent devenir PARAM, CONST, AUX, ou une équation.

### 1.2 CONST — Constantes fixes
- Valeur immuable dans le modèle.
- Ne nécessite pas de bornes.

### 1.3 PARAM — Paramètres
- Nécessaires au modèle mais non définis.
- Peuvent avoir des bornes (logiques ou utilisateur).

### 1.4 AUX — Variables auxiliaires
- Variables intermédiaires.
- Leur équation peut changer.
- Peuvent avoir des bornes.

### 1.5 AUX_STABLE — Variables auxiliaires stabilisées
- Le visiteur impose que l’équation ne change plus.
- Peuvent avoir des bornes.

---

## 2. Boucle de Raffinement Validé

1. Le visiteur propose un texte.
2. Le système génère deux reformulations.
3. Le visiteur valide si elles expriment bien la même idée.
4. Le système crée une étape.
5. Le visiteur valide ou rejette l’étape.
6. Seules les étapes validées construisent le modèle.

---

## 3. Contributions

Chaque étape peut contenir plusieurs contributions textuelles :

```ts
contributions: string[];
```

---

## 4. Bornes associées aux éléments non fixes

Deux types possibles :

### 4.1 Bornes logiques (internes au système)

- probabilité : [0 ; 1]
- pourcentage : [0 ; 100]
- temps : ≥ 0
- stock physique : ≥ 0

Ces bornes peuvent être déduites automatiquement.

### 4.2 Bornes utilisateur (optionnelles)

Valeurs réalistes selon la situation du visiteur.

Exemples :
- revenu mensuel : [2000 ; 4000]
- fatigue sur 10 : [0 ; 10]

---

## 5. Structure technique pour les bornes

```ts
interface Bounds {
  logical?: {
    min?: number;
    max?: number;
  };
  user?: {
    min?: number;
    max?: number;
  };
}
```

Les éléments Pivot peuvent avoir :

```ts
bounds?: Bounds;
```

---

## 6. Rôle du Langage Pivot

- structurer la pensée du visiteur,
- organiser les raffinements successifs,
- fournir un modèle stable pour le moteur de calcul,
- assurer que l’IA reste cohérente avec l’intention du visiteur.
