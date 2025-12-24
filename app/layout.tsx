import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function isZDomain(host: string) {
  const h = host.toLowerCase();
  return h === "decidezmieux.com" || h.endsWith(".decidezmieux.com");
}

export async function generateMetadata(): Promise<Metadata> {
  const host = headers().get("host") ?? "";
  const z = isZDomain(host);

  // Baseline / titre onglet
  const title = "Décider mieux – Une méthode simple pour mieux prendre des décisions";

  // Meta-descriptions (Z et R)
  const descriptionZ =
    "Une approche structurée pour raisonner une décision étape par étape, expliciter les hypothèses et comprendre les conséquences avant toute optimisation.";
  const descriptionR =
    "Décider mieux propose une méthode simple et progressive pour explorer un problème, comparer plusieurs façons de le traiter et améliorer ses décisions.";

  return {
    title,
    description: z ? descriptionZ : descriptionR,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
