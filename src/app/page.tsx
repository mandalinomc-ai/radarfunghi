import { MushroomRadarProvider } from "@/context/MushroomRadarContext";
import MushroomRadarShell from "@/components/MushroomRadarShell";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export default function Home() {
  return (
    <MushroomRadarProvider>
      <ServiceWorkerRegister />
      <MushroomRadarShell />
    </MushroomRadarProvider>
  );
}
