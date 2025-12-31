"use client";

import React from "react";

const C = {
  text: "#111",
  secondary: "#444",
  hint: "#666",
  border: "#ddd",
  softBorder: "#eee",
  link: "#0b5fff",
  bgDisabled: "#f3f4f6",
};

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        marginTop: 14,
      }}
    >
      <h2 style={{ marginTop: 0, color: C.text }}>{title}</h2>
      {children}
    </section>
  );
}

export default function Probleme2Page() {
  return (
    <main
      style={{
        padding: 40,
        maxWidth: 980,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        color: C.text,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>Problème 2 — Un salarié veut devenir patron</h1>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a href="/problemes" style={{ fontSize: 14, color: C.link, textDecoration: "underline" }}>
            Les problèmes
          </a>
          <a href="/" style={{ fontSize: 14, color: C.link, textDecoration: "underline" }}>
            Accueil
          </a>
        </div>
      </div>

      <Card title="Raccord pédagogique">
        <p style={{ marginTop: 0, color: C.secondary, lineHeight: 1.6 }}>
          Nous appliquons maintenant exactement la même méthode à un problème plus proche de situations réelles.
        </p>
      </Card>

      <Card title="Définition du problème (langage courant)">
        <div style={{ padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <b>Définition courte :</b>{" "}
            Un salarié veut augmenter fortement ses revenus en devenant patron.
          </div>

          <div style={{ color: C.secondary, lineHeight: 1.6 }}>
            <b>Définition longue :</b>{" "}
            Un salarié est responsable d’une succursale et a un salaire de{" "}
            <b>8&nbsp;000&nbsp;€ par mois (charges comprises)</b>. Son objectif minimal est de{" "}
            <b>doubler</b> ses revenus dans un délai maximum de{" "}
            <b>4 ans</b>. Il pense que le meilleur moyen d’y parvenir est de devenir le patron d’une entreprise
            ayant à peu près la même activité que celle où il travaille depuis longtemps. Il dispose d’un capital
            de départ disponible de <b>270&nbsp;000&nbsp;€</b>.
          </div>
        </div>

        <div style={{ marginTop: 12, padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12, color: C.hint }}>
          <b>État :</b> en cours de développement (visions + raffinements à venir).
        </div>
      </Card>

      <Card title="Vision 1 — Créer une entreprise à partir de zéro (définition)">
        <div style={{ padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <b>Définition courte :</b> Créer une entreprise à partir de zéro dans le même secteur.
          </div>

          <div style={{ color: C.secondary, lineHeight: 1.6 }}>
            <b>Définition longue :</b>{" "}
            Le requérant est responsable d’une succursale qui vend en gros des biens d’équipement et des consommables
            matures, avec des prix et des marges stables. Pour démarrer, il prévoit de{" "}
            <b>sous-traiter l’intendance</b> (transport, prise de commande, stockage éventuel, livraisons), afin de se
            concentrer sur la prospection et la relation client. Les frais correspondants sont intégrés sous forme
            d’un <b>pourcentage de frais de structure</b> déduit de la marge par vente. Cette approche réduit la marge
            unitaire, mais évite de supporter des coûts fixes élevés au démarrage et clarifie la politique commerciale.
          </div>
        </div>
      </Card>
    </main>
  );
}
