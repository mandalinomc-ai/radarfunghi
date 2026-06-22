"use client";

import { useMushroomRadarContext } from "@/context/MushroomRadarContext";
import MushroomRadarApp from "./MushroomRadarApp";
import LegalGatekeeperModal from "./LegalGatekeeperModal";

export default function MushroomRadarShell() {
  const { legalAccepted } = useMushroomRadarContext();

  return (
    <>
      {legalAccepted ? (
        <MushroomRadarApp />
      ) : (
        <div className="w-full h-dvh bg-forest-950 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-12 h-12 border-2 border-mushroom-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-forest-400 text-sm">MushroomRadar</p>
          </div>
        </div>
      )}
      <LegalGatekeeperModal />
    </>
  );
}
