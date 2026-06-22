"use client";

import { useMushroomRadarContext } from "@/context/MushroomRadarContext";

export default function LegalGatekeeperModal() {
  const { legalAccepted, acceptLegal } = useMushroomRadarContext();

  if (legalAccepted) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 bg-forest-950/90 backdrop-blur-sm pointer-events-auto">
      <div
        className="w-full max-w-lg bg-forest-900 border border-mushroom-500/30 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-gate-title"
      >
        <div className="px-5 py-4 border-b border-forest-700/50">
          <h2
            id="legal-gate-title"
            className="text-base font-semibold text-forest-100"
          >
            ⚖️ Termini obbligatori — MushroomRadar
          </h2>
          <p className="text-xs text-forest-500 mt-1">
            Accetta per usare mappe, Sprout Score e Mastro Fungaiolo (valido 30
            giorni).
          </p>
        </div>

        <div className="px-5 py-4 space-y-3 text-xs text-forest-300 leading-relaxed max-h-[50dvh] overflow-y-auto">
          <p>
            <strong className="text-mushroom-300">1. Sicurezza sanitaria</strong>{" "}
            — MushroomRadar non verifica la commestibilità. Fai controllare ogni
            raccolto dagli ispettori micologici ASL prima del consumo.
          </p>
          <p>
            <strong className="text-mushroom-300">2. Legge Campania n. 8/2007</strong>{" "}
            — Serve tesserino regionale. Max 3 kg/giorno per persona, rispetta
            orari e giorni di chiusura.
          </p>
          <p>
            <strong className="text-mushroom-300">3. Proprietà e riserve</strong>{" "}
            — Gli hotspot possono ricadere in parchi, riserve o private: verifica
            sempre divieti di accesso e raccolta.
          </p>
          <p>
            <strong className="text-mushroom-300">5. Limiti raccolta (Sud)</strong>{" "}
            — Campania: max 3 kg/giorno (1 kg Ovolo+Prugnolo), tesserino obbligatorio
            (L.R. 8/2007). Molise ~2 kg. Basilicata ~3 kg. Vietati rastrelli e
            sacchetti plastica chiusi. Orario: da 1h prima alba a 1h dopo tramonto.
          </p>
          <p>
            <strong className="text-mushroom-300">6. Identificazione</strong>{" "}
            — Ogni raccolto va controllato dal servizio micologico ASL prima del
            consumo. MushroomRadar non sostituisce il micologo.
          </p>
          <p>
            <strong className="text-mushroom-300">4. Normative regionali</strong>{" "}
            — Tesserino e calendari di chiusura variano per regione. Consulta i
            portali ufficiali prima di raccogliere:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-forest-400">
            <li>
              Campania —{" "}
              <a
                href="https://www.regione.campania.it"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mushroom-400 underline"
              >
                regione.campania.it
              </a>
            </li>
            <li>
              Molise —{" "}
              <a
                href="https://www.regione.molise.it"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mushroom-400 underline"
              >
                regione.molise.it
              </a>
            </li>
            <li>
              Basilicata —{" "}
              <a
                href="https://www.regione.basilicata.it"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mushroom-400 underline"
              >
                regione.basilicata.it
              </a>
            </li>
          </ul>
        </div>

        <div className="px-5 py-4 border-t border-forest-700/50 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={acceptLegal}
            className="flex-1 px-4 py-3 rounded-xl bg-mushroom-600 hover:bg-mushroom-500 text-white font-semibold text-sm touch-manipulation"
          >
            Accetto e continuo
          </button>
        </div>
      </div>
    </div>
  );
}
