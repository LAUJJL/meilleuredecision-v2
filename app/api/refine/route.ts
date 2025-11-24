// app/api/refine/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAuxiliary, createConstant, ElementPivot } from "@/lib/pivot";

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  // Pour l'instant : petite démo très simple
  const elements: ElementPivot[] = [];

  // On crée une constante provisoire par défaut
  elements.push(
    createConstant("objectif", input, {
      // pas de kind → devient TEMP
    })
  );

  // Une auxiliaire non stabilisée (par défaut)
  elements.push(
    createAuxiliary("score_clarte", "longueur_texte ^ -1", ["longueur_texte"])
  );

  // Une auxiliaire stabilisée, pour illustrer
  elements.push(
    createAuxiliary(
      "ratio_signal_bruit",
      "informations_pertinentes / informations_totales",
      ["informations_pertinentes", "informations_totales"],
      { stable: true }
    )
  );

  return NextResponse.json({
    input,
    elements,
  });
}
