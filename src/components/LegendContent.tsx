const LEGEND_ITEMS = [
  { label: "Alta (>80%)", color: "rgba(228, 90, 30, 0.8)" },
  { label: "Media (60-80%)", color: "rgba(245, 154, 74, 0.7)" },
  { label: "Moderata (40-60%)", color: "rgba(122, 184, 114, 0.6)" },
  { label: "Bassa (<40%)", color: "rgba(61, 107, 56, 0.4)" },
  { label: "Segnalazione utente (con foto)", color: "rgba(34, 197, 94, 0.9)" },
];

const FEATURE_ITEMS = [
  {
    icon: "🧭",
    label: "Bussola live",
    desc: "Orientamento verso parcheggio/zona (GPS + bussola su smartphone)",
  },
  {
    icon: "🗺️",
    label: "Guida territorio",
    desc: "Video e link ufficiali per ogni area (parchi, FM, YouTube verificato)",
  },
  {
    icon: "📌",
    label: "Zona spia",
    desc: "Punto segnato da utenti (link Maps o coordinate)",
    color: "rgba(245, 158, 11, 0.85)",
  },
];

export default function LegendContent() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">
          Legenda probabilità
        </p>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-3 py-1">
            <span
              className="w-5 h-5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-forest-300">{item.label}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">
          Strumenti di orientamento
        </p>
        {FEATURE_ITEMS.map((item) => (
          <div key={item.label} className="flex items-start gap-3 py-1.5">
            {item.color ? (
              <span
                className="w-5 h-5 rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: item.color }}
              />
            ) : (
              <span className="text-base shrink-0 w-5 text-center">
                {item.icon}
              </span>
            )}
            <div>
              <p className="text-sm text-forest-200 font-medium">{item.label}</p>
              <p className="text-[11px] text-forest-500 leading-snug">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
