"use client";

import { MushroomRadarProvider, useMushroomRadarContext } from "@/context/MushroomRadarContext";
import { RadarSearchProvider } from "@/context/RadarSearchContext";
import { GlobalChatProvider } from "@/context/GlobalChatContext";
import AppShell from "@/components/shell/AppShell";
import GlobalChatDock from "@/components/shell/GlobalChatDock";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import LegalGatekeeperModal from "@/components/LegalGatekeeperModal";

function AppInner({ children }: { children: React.ReactNode }) {
  const { legalAccepted } = useMushroomRadarContext();

  if (!legalAccepted) {
    return (
      <>
        <div className="w-full h-dvh bg-enterprise-bg flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-12 h-12 border-2 border-neon border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sage-400 text-sm">MushroomRadar Enterprise</p>
          </div>
        </div>
        <LegalGatekeeperModal />
      </>
    );
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      <GlobalChatDock />
      <LegalGatekeeperModal />
    </>
  );
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MushroomRadarProvider>
      <ServiceWorkerRegister />
      <RadarSearchProvider>
        <GlobalChatProvider>
          <AppInner>{children}</AppInner>
        </GlobalChatProvider>
      </RadarSearchProvider>
    </MushroomRadarProvider>
  );
}
