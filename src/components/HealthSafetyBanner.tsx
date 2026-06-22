"use client";

export default function HealthSafetyBanner({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-orange-500/50 bg-orange-950/50 ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
      role="note"
    >
      <p
        className={`font-semibold text-orange-300 ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        ⚠️ NOTA SANITARIA OBBLIGATORIA
      </p>
      <p
        className={`text-orange-100/90 leading-relaxed mt-1 ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        I funghi raccolti devono essere controllati gratuitamente da un ispettore
        micologico ASL prima del consumo. La commestibilità non è stimabile tramite
        algoritmi o foto.
      </p>
    </div>
  );
}
