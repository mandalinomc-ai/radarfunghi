"use client";

import { useCallback, useEffect, useState } from "react";
import type { MushroomSpecies } from "@/lib/types";
import {
  createDiarioEntry,
  deleteDiarioEntry,
  listDiarioEntries,
  saveDiarioEntry,
  totalHarvestKg,
  type DiarioEntry,
} from "@/lib/diarioUtenteStore";
import { FUNGAL_ZONES } from "@/lib/mockData";
import SoilFruitingSection from "@/components/SoilFruitingSection";
import { todayISO } from "@/lib/dateUtils";

export default function DiarioPage() {
  const [entries, setEntries] = useState<DiarioEntry[]>([]);
  const [totalKg, setTotalKg] = useState(0);
  const [form, setForm] = useState({
    date: todayISO(),
    lat: "",
    lng: "",
    species: "porcino" as MushroomSpecies | "sconosciuto",
    weightKg: "",
    forestNotes: "",
  });

  const refresh = useCallback(async () => {
    setEntries(await listDiarioEntries());
    setTotalKg(await totalHarvestKg());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sampleZone = FUNGAL_ZONES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entry = createDiarioEntry({
      date: form.date,
      lat: Number(form.lat) || sampleZone.lat,
      lng: Number(form.lng) || sampleZone.lng,
      species: form.species,
      weightKg: Number(form.weightKg) || 0,
      forestNotes: form.forestNotes,
    });
    await saveDiarioEntry(entry);
    setForm({
      date: todayISO(),
      lat: "",
      lng: "",
      species: "porcino",
      weightKg: "",
      forestNotes: "",
    });
    await refresh();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 pb-24">
      <div>
        <h1 className="font-display text-2xl text-sage-100">
          Diario del Fungaiolo Pro
        </h1>
        <p className="text-sm text-sage-400 mt-1">
          IndexedDB locale · nessun server · totale raccolto:{" "}
          <span className="text-neon font-semibold">{totalKg} kg</span>
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="enterprise-panel rounded-2xl p-4 md:p-5 space-y-3"
      >
        <h2 className="text-sm font-semibold text-sage-200">Nuovo raccolto</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-sage-400">
            Data
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full enterprise-input rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-xs text-sage-400">
            Specie
            <select
              value={form.species}
              onChange={(e) =>
                setForm({
                  ...form,
                  species: e.target.value as MushroomSpecies | "sconosciuto",
                })
              }
              className="mt-1 w-full enterprise-input rounded-lg px-3 py-2"
            >
              <option value="porcino">Porcino</option>
              <option value="estatino">Estatino</option>
              <option value="galletto">Galletto</option>
              <option value="sconosciuto">Sconosciuto</option>
            </select>
          </label>
          <label className="text-xs text-sage-400">
            Lat
            <input
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
              className="mt-1 w-full enterprise-input rounded-lg px-3 py-2"
              placeholder="41.1297"
            />
          </label>
          <label className="text-xs text-sage-400">
            Lng
            <input
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
              className="mt-1 w-full enterprise-input rounded-lg px-3 py-2"
              placeholder="14.7826"
            />
          </label>
          <label className="text-xs text-sage-400 sm:col-span-2">
            Peso (kg)
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              className="mt-1 w-full enterprise-input rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-xs text-sage-400 sm:col-span-2">
            Note sul bosco
            <textarea
              value={form.forestNotes}
              onChange={(e) =>
                setForm({ ...form, forestNotes: e.target.value })
              }
              rows={3}
              className="mt-1 w-full enterprise-input rounded-lg px-3 py-2 resize-none"
            />
          </label>
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-neon/20 text-neon border border-neon/40 font-semibold text-sm touch-manipulation"
        >
          Salva nel diario locale
        </button>
      </form>

      <div className="enterprise-panel rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-sage-200 mb-3">
          Calcolatore fruttificazione (zona campione)
        </h2>
        <SoilFruitingSection zone={sampleZone} selectedDate={form.date} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-sage-200">Registro</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-sage-500">Nessun raccolto salvato.</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="enterprise-panel rounded-xl p-3 flex justify-between gap-3 items-start"
            >
              <div>
                <p className="text-sm font-semibold text-sage-100">
                  {entry.date} · {entry.species} · {entry.weightKg} kg
                </p>
                <p className="text-xs text-sage-500 mt-0.5">
                  {entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}
                </p>
                {entry.forestNotes && (
                  <p className="text-xs text-sage-400 mt-1">
                    {entry.forestNotes}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  void deleteDiarioEntry(entry.id).then(refresh);
                }}
                className="text-xs text-red-400 touch-manipulation"
              >
                Elimina
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
