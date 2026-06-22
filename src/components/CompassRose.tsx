"use client";

import { bearingToCardinal, relativeBearingToTarget } from "@/lib/bearingUtils";

interface CompassRoseProps {
  heading: number | null;
  targetBearing: number;
  distanceKm: number;
  targetLabel: string;
  compact?: boolean;
}

export default function CompassRose({
  heading,
  targetBearing,
  distanceKm,
  targetLabel,
  compact,
}: CompassRoseProps) {
  const hasLiveHeading = heading != null;
  const rel = hasLiveHeading
    ? relativeBearingToTarget(heading!, targetBearing)
  : targetBearing;

  const size = compact ? 160 : 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16;

  const needleLen = r - 8;
  const needleRad = ((rel - 90) * Math.PI) / 180;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  const ringRotate = hasLiveHeading ? -heading! : 0;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative rounded-full bg-forest-950 border-2 border-amber-500/40 shadow-inner"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
          aria-hidden
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(245,158,11,0.25)"
            strokeWidth="1"
          />
          <g
            transform={`rotate(${ringRotate} ${cx} ${cy})`}
            style={{ transition: "transform 0.15s ease-out" }}
          >
            {["N", "E", "S", "O"].map((label, i) => {
              const ang = i * 90 - 90;
              const rad = (ang * Math.PI) / 180;
              const tx = cx + (r - 22) * Math.cos(rad);
              const ty = cy + (r - 22) * Math.sin(rad);
              return (
                <text
                  key={label}
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-[11px] font-bold ${
                    label === "N" ? "fill-amber-300" : "fill-forest-500"
                  }`}
                >
                  {label}
                </text>
              );
            })}
          </g>
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="#f59e0b"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <polygon
            points={`${nx},${ny} ${nx - 8},${ny + (rel > 180 ? -14 : 14)} ${nx + 8},${ny + (rel > 180 ? -14 : 14)}`}
            fill="#f59e0b"
          />
          <circle cx={cx} cy={cy} r="6" fill="#1a2e1a" stroke="#f59e0b" strokeWidth="2" />
        </svg>
      </div>

      <div className="mt-3 text-center space-y-1 px-2">
        <p className="text-sm font-semibold text-amber-200 truncate max-w-[260px]">
          {targetLabel}
        </p>
        <p className="text-xs text-forest-300">
          {bearingToCardinal(targetBearing)} · {Math.round(targetBearing)}° ·{" "}
          {distanceKm} km
        </p>
        <p className="text-[11px] text-forest-500 leading-relaxed">
          {hasLiveHeading
            ? "Ruota il telefono finché la freccia arancione punta in alto — cammina dritto."
            : "Su desktop vedi solo la direzione. Apri da smartphone e attiva bussola per navigare sul campo."}
        </p>
      </div>
    </div>
  );
}
