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
        marginTop: 24,
      }}
    >
      <h2 style={{ marginTop: 0, color: C.text }}>{title}</h2>
      {children}
    </section>
  );
}

function ProblemRow({
  number,
  title,
  subtitle,
  href,
  status,
}: {
  number: string;
  title: string;
  subtitle: string;
  href?: string;
  status: "disponible" | "en_cours" | "a_venir";
}) {
  const isDisabled = status === "a_venir";
  const badgeText =
    status === "disponible"
      ? "Disponible"
      : status === "en_cours"
      ? "En cours"
      : "À venir";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "90px 1fr auto",
        gap: 12,
        alignItems: "start",
        padding: 12,
        border: `1px solid ${C.softBorder}`,
        borderRadius: 12,
        marginTop: 10,
        opacity: isDisabled ? 0.75 : 1,
      }}
    >
      <div style={{ fontWeight: 700 }}>{number}</div>

      <div>
        <div style={{ fontWeight: 700 }}>
          {href && !isDisabled ? (
            <a href={href} style={{ color: C.link, textDecoration: "underline" }}>
              {title}
            </a>
          ) : (
            title
          )}
        </div>
        <div style={{ marginTop: 4, color: C.secondary, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          padding: "3px 8px",
          borderRadius: 999,
          border: `1px solid ${C.softBorder}`,
          background: status === "a_venir" ? C.bgDisabled : "white",
          color: C.secondary,
          whiteSpace: "nowrap",
        }}
      >
        {badgeText}
      </div>
    </div>
  );
}

export default function ProblemesPage() {
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
      {/* INTRODUCTION */}
      <div style={{ maxWidth: 900, marginBottom: 32 }}>
        <p style={{ marginBottom: 8, lineHeight: 1.6 }}>
          <b>Objectif du site.</b> Ce site propose une méthode pour analyser des
          décisions complexes à l’aide de <b>visions différentes</b> et de
          <b> raffinements successifs</b>, jusqu’à atteindre (ou non) un
          <b> objectif minimal</b>.
        </p>

        <p style={{ marginBottom: 0, lineHeight: 1.6 }}>
          Chaque problème ci-dessous applique exactement la même méthode,
          sur des situations de plus en plus réalistes.
        </p>
      </div>

      {/* TITRE + ACCUEIL */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>Les problèmes</h1>

        
      </div>

      {/* LISTE DES PROBLÈMES */}
      <Card title="Choisissez un problème">
        <p style={{ marginTop: 0, color: C.secondary, lineHeight: 1.6 }}>
          Chaque problème est une application guidée de la même méthode :
          <b> visions</b> et <b> raffinements successifs</b>.
        </p>

        <ProblemRow
          number="Problème 1"
          title="Comprendre la méthode sur un cas très simple"
          subtitle="Trésorerie sur 12 mois : voir comment un stock évolue sous l’effet de flux, et comment l’objectif minimal sert de boussole."
          href="/parcours?vision=1"
          status="disponible"
        />

        <ProblemRow
          number="Problème 2"
          title="Un salarié veut devenir patron"
          subtitle="Même méthode, mais sur une situation plus proche du réel (plusieurs options / visions)."
          href="/probleme-2"
          status="en_cours"
        />

        <ProblemRow
          number="Problème 3"
          title="Une entreprise traverse une crise générale qui menace son existence"
          subtitle="À venir."
          status="a_venir"
        />

        <ProblemRow
          number="Problème 4"
          title="Appliquer vous-même la méthode à votre propre problème"
          subtitle="À venir."
          status="a_venir"
        />
      </Card>
    </main>
  );
}
