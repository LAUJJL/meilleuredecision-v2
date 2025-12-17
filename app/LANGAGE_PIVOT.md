LANGAGE_PIVOT.md (version V1 active, R1–R3)
0) Objet du langage pivot

Ce document définit le langage pivot utilisé par le site pour représenter un problème et ses raffinements de manière calculable et reproductible.

Version actuelle (V1) : cas Trésorerie (un stock + flux) avec 2 visions et 3 raffinements (R1–R3).
Les concepts avancés (statuts de constantes, auxiliaires, équations figées/variables, etc.) sont reportés en annexe V2+.

1) Principes de méthode (V1)
1.1 Top-down

La méthode est strictement top-down :

Problème → Vision → Raffinements

1.2 Immutabilité

Une fois validé, un élément (problème, vision, raffinement) devient immuable (lecture seule).
Un raffinement ultérieur peut changer l’évaluation globale (atteint/non atteint), mais ne modifie pas les étapes validées.

1.3 V1 minimaliste

La V1 vise un périmètre volontairement réduit :

un seul type de problème : Trésorerie

une seule vision active à la fois (choix parmi deux visions)

raffinements R1, R2, R3

2) Entités et données (V1)
2.1 Noms et unités

stock_name : nom du stock (ex : “Trésorerie”)

stock_unit : unité du stock (ex : “euros”)

time_unit : unité de temps (ex : “mois”)

horizon : nombre de périodes (entier > 0)

2.2 Modèle de base (R1)

R1 décrit un modèle minimal commun (stock + flux + horizon) et permet de produire un premier tableau.

Variables (R1)

stock_initial : valeur initiale du stock

inflow_base : flux entrant constant par période

outflow_base : flux sortant constant par période

Tableau (R1)
Pour chaque période t de 1 à horizon :

stock_begin[t]

inflow[t]

outflow[t]

stock_end[t]

avec la règle :

stock_end[t] = stock_begin[t] + inflow[t] - outflow[t]

stock_begin[t+1] = stock_end[t]

En V1 :

inflow[t] = inflow_base

outflow[t] = outflow_base
(sauf modification au raffinement 3)

Note méthodologique : R1 n’est pas “le problème de base” mais un premier raffinement commun. Les valeurs saisies peuvent être indicatives/démonstratives. Les valeurs “réalistes” peuvent arriver en R2, mais on autorise aussi des valeurs dès R1 pour éviter de surcharger R2.

3) Objectif et évaluation courante (R2)
3.1 Objectif (R2)

R2 introduit un objectif minimal, défini comme une constante :

objectif_stock : valeur + unité (constante)

L’objectif est évalué à l’horizon :

stock_final = stock_end[horizon]

3.2 Évaluation courante (règle fondamentale)

À tout moment, l’évaluation est faite sur le modèle courant, donc peut évoluer avec les raffinements ultérieurs (ex : R3) :

stock_final = stock_end[horizon]

ecart = stock_final - objectif_stock

atteint = (ecart >= 0)

Règle clé (V1)
stock_final, ecart, atteint sont recalculés dynamiquement dès qu’un raffinement modifie la trajectoire.

3.3 Arrêt possible en R2

Si atteint = true en R2, l’utilisateur peut s’arrêter : problème “résolu” au niveau de raffinement atteint.

4) Activité ajoutée (R3)

R3 introduit une activité ajoutée qui modifie le modèle en ajoutant des flux supplémentaires à partir d’une période donnée.

Variables (R3)

from_period : période de démarrage (1..horizon)

delta_inflow : supplément de flux entrant par période à partir de from_period

delta_outflow : supplément de flux sortant par période à partir de from_period

Règle de modification des flux
Pour t < from_period :

inflow[t] = inflow_base

outflow[t] = outflow_base

Pour t >= from_period :

inflow[t] = inflow_base + delta_inflow

outflow[t] = outflow_base + delta_outflow

Puis on recalcule le tableau complet et l’évaluation (stock_final, ecart, atteint) sur ce modèle courant.

5) Visions (V1)

En V1, on considère 2 visions dans le cas trésorerie (une seule active à la fois) :

Vision 1 : “Salarié (pas d’activité ajoutée)”

Vision 2 : “Salarié + activité ajoutée (revenu/dépenses supplémentaires)”

En V1, les visions servent surtout à :

guider l’utilisateur

préciser le vocabulaire

rendre explicite le sens des flux

Les notions avancées pour “structurer la descente” (statuts de variables, auxiliaires, équations figées/variables) sont reportées en V2+.

6) Annexe — Concepts V2+ (non utilisés en V1)

Cette annexe conserve des concepts destinés à la V2+ (raffinements R4+ et/ou assistance IA).
Ils ne sont pas utilisés dans la V1 publiée.

Statuts de valeurs : fixe / paramétrique / provisoire

Notion d’auxiliaires

Équations figées vs équations variables

Règles détaillées de passage d’information entre raffinements (héritage, verrouillage, substitution)

Scénarios et incertitudes (fourchettes, distributions)

Phases, événements ponctuels, dette/financement, etc.