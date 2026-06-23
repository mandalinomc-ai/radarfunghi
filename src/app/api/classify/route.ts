import { NextResponse } from "next/server";
import { classifyMushroomImage } from "@/lib/mushroomClassifier";
import { SPY_MUSHROOMS } from "@/lib/spyMushroomIntel";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
    };

    if (!body.imageBase64) {
      return NextResponse.json({ error: "Immagine mancante" }, { status: 400 });
    }

    const result = await classifyMushroomImage(
      body.imageBase64,
      body.mimeType ?? "image/jpeg"
    );

    let spyHorizons:
      | { days: number; title: string; forecast: string; confidence: string }[]
      | undefined;

    if (result.isSpyMushroom && result.spyId) {
      const spy = SPY_MUSHROOMS.find((s) => s.id === result.spyId);
      if (spy) {
        spyHorizons = ([10, 14, 20] as const).map((days) => ({
          days,
          title:
            days === 10
              ? "Finestra 10 giorni (incubazione)"
              : days === 14
                ? "Finestra 14 giorni (picco buttata)"
                : "Finestra 20 giorni (mantenimento)",
          forecast: spy.indicates,
          confidence: days === 14 ? "alta" : "media",
        }));
      }
    }

    return NextResponse.json({ ...result, spyHorizons });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore classificazione" },
      { status: 500 }
    );
  }
}
