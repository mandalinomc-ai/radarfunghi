const LEGEND_ITEMS = [
  { label: "Alta (>80%)", color: "rgba(228, 90, 30, 0.8)" },
  { label: "Media (60-80%)", color: "rgba(245, 154, 74, 0.7)" },
  { label: "Moderata (40-60%)", color: "rgba(122, 184, 114, 0.6)" },
  { label: "Bassa (<40%)", color: "rgba(61, 107, 56, 0.4)" },
];

export default function LegendContent() {
  return (
    <div className="space-y-2">
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
  );
}
