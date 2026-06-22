"use client";

import { useMushroomRadarContext } from "@/context/MushroomRadarContext";

export default function PremiumUpgradeBanner() {
  const { tier, enablePremiumDev } = useMushroomRadarContext();

  if (tier === "premium") return null;

  return (
    <div className="rounded-xl border border-mushroom-500/30 bg-mushroom-900/20 px-3 py-2 text-[10px] text-forest-300 leading-relaxed">
      <span className="text-mushroom-300 font-semibold">Free</span> — hotspot
      sfocati ±1.5 km, timeline Oggi/Domani.{" "}
      <button
        type="button"
        onClick={enablePremiumDev}
        className="text-mushroom-400 underline touch-manipulation"
      >
        Prova Premium
      </button>{" "}
      (14 giorni, coordinate precise).
    </div>
  );
}
