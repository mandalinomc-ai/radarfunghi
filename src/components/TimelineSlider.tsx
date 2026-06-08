"use client";

interface TimelineSliderProps {
  dayOffset: number;
  hour: number;
  onDayChange: (day: number) => void;
  onHourChange: (hour: number) => void;
}

const DAY_LABELS = ["Oggi", "Domani", "Dopodomani", "+3g", "+4g"];
const DAY_LABELS_FULL = ["Oggi", "Domani", "Dopodomani", "+3 giorni", "+4 giorni"];

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

export default function TimelineSlider({
  dayOffset,
  hour,
  onDayChange,
  onHourChange,
}: TimelineSliderProps) {
  const dayLabel = DAY_LABELS_FULL[dayOffset] ?? `+${dayOffset} giorni`;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-auto safe-bottom">
      <div className="bg-forest-900/95 backdrop-blur-md border-t border-forest-600/40 px-3 py-3 md:px-6 md:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0 mb-2 md:mb-3">
          <div className="min-w-0">
            <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-forest-400">
              Timeline predittiva
            </p>
            <p className="text-sm md:text-lg font-semibold text-forest-300 truncate">
              {dayLabel}{" "}
              <span className="text-mushroom-400">ore {formatHour(hour)}</span>
            </p>
          </div>
          <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
            {DAY_LABELS.map((label, idx) => (
              <button
                key={label}
                onClick={() => onDayChange(idx)}
                className={`shrink-0 px-3 py-2 md:py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation min-h-[36px] ${
                  dayOffset === idx
                    ? "bg-mushroom-500 text-white"
                    : "bg-forest-800 text-forest-300 active:bg-forest-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <input
            type="range"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => onHourChange(Number(e.target.value))}
            className="w-full h-3 md:h-2 rounded-full appearance-none cursor-pointer touch-manipulation
              bg-gradient-to-r from-forest-800 via-mushroom-500/50 to-forest-800
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-7
              [&::-webkit-slider-thumb]:h-7
              [&::-webkit-slider-thumb]:md:w-5
              [&::-webkit-slider-thumb]:md:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-mushroom-400
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-forest-900
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-moz-range-thumb]:w-7
              [&::-moz-range-thumb]:h-7
              [&::-moz-range-thumb]:md:w-5
              [&::-moz-range-thumb]:md:h-5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-mushroom-400
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-forest-900"
          />
          <div className="flex justify-between mt-1 px-0.5">
            {[0, 6, 12, 18].map((h) => (
              <span key={h} className="text-[9px] md:text-[10px] text-forest-500">
                {formatHour(h)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
