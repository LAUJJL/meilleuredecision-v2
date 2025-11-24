// app/api/refine/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  createAuxiliary,
  createConstant,
  ElementPivot,
} from '@/lib/pivot';

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  const elements: ElementPivot[] = [];

  // constante provisoire par défaut
  elements.push(
    createConstant('objectif', input, {
      // pas de kind -> TEMP (provisoire)
    })
  );

  // auxiliaire non stabilisée
  elements.push(
    createAuxiliary(
      'score_longueur',
      '1 / longueur_texte',
      ['longueur_texte']
    )
  );

  // auxiliaire stabilisée (exemple)
  elements.push(
    createAuxiliary(
      'ratio_signal_bruit',
      'informations_pertinentes / informations_totales',
      ['informations_pertinentes', 'informations_totales'],
      { stable: true }
    )
  );

  return NextResponse.json({ input, elements });
}
