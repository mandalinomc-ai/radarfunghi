"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  maxDayOffsetForTier,
  resolveTier,
  type ServiceTier,
} from "@/lib/tierUtils";

interface MushroomRadarContextValue {
  tier: ServiceTier;
  legalAccepted: boolean;
  acceptLegal: () => void;
  maxDayOffset: number;
  isPremium: boolean;
  enablePremiumDev: () => void;
}

const MushroomRadarContext = createContext<MushroomRadarContextValue | null>(
  null
);

const LEGAL_KEY = "mushroomradar-legal-accepted";
const LEGAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function readLegalAccepted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(LEGAL_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { at: number };
    return Date.now() - parsed.at < LEGAL_TTL_MS;
  } catch {
    return false;
  }
}

export function MushroomRadarProvider({ children }: { children: ReactNode }) {
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [tier, setTier] = useState<ServiceTier>("free");

  useEffect(() => {
    setLegalAccepted(readLegalAccepted());
    setTier(resolveTier());
  }, []);

  const acceptLegal = useCallback(() => {
    localStorage.setItem(LEGAL_KEY, JSON.stringify({ at: Date.now() }));
    setLegalAccepted(true);
  }, []);

  const enablePremiumDev = useCallback(() => {
    localStorage.setItem("mushroomradar-tier", "premium");
    setTier("premium");
  }, []);

  const value = useMemo(
    () => ({
      tier,
      legalAccepted,
      acceptLegal,
      maxDayOffset: maxDayOffsetForTier(tier),
      isPremium: tier === "premium",
      enablePremiumDev,
    }),
    [tier, legalAccepted, acceptLegal, enablePremiumDev]
  );

  return (
    <MushroomRadarContext.Provider value={value}>
      {children}
    </MushroomRadarContext.Provider>
  );
}

export function useMushroomRadarContext(): MushroomRadarContextValue {
  const ctx = useContext(MushroomRadarContext);
  if (!ctx) {
    throw new Error("useMushroomRadarContext requires MushroomRadarProvider");
  }
  return ctx;
}
