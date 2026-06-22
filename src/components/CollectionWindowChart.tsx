"use client";



import type { FungalZone } from "@/lib/types";

import { hourInRange, type HourRange } from "@/lib/timeRange";



interface CollectionWindowChartProps {

  zone: FungalZone;

  hourRange: HourRange;

}



export default function CollectionWindowChart({

  zone,

  hourRange,

}: CollectionWindowChartProps) {

  const { hourlyForecasts, collectionWindow } = zone;

  const maxScore = 100;

  const width = 320;

  const height = 100;

  const padding = 20;



  const chartWidth = width - padding * 2;

  const chartHeight = height - padding * 2;



  const points = hourlyForecasts.map((f, i) => {

    const inWindow =

      f.hour >= collectionWindow.startHour &&

      f.hour <= collectionWindow.endHour;

    const inSearchRange = hourInRange(f.hour, hourRange);

    const score =

      f.soilMoisture * 0.5 +

      f.humidity * 0.3 +

      (inWindow ? 20 : 0) +

      (f.hour >= 5 && f.hour <= 10 ? 10 : 0);

    const x = padding + (i / 23) * chartWidth;

    const y = padding + chartHeight - (score / maxScore) * chartHeight;

    return { x, y, hour: f.hour, score, inWindow, inSearchRange };

  });



  const pathD = points

    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)

    .join(" ");



  const windowStartX =

    padding + (collectionWindow.startHour / 23) * chartWidth;

  const windowEndX =

    padding + (collectionWindow.endHour / 23) * chartWidth;

  const searchStartX = padding + (hourRange.startHour / 23) * chartWidth;

  const searchEndX = padding + (hourRange.endHour / 23) * chartWidth;



  return (

    <div className="mt-3">

      <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">

        Finestra temporale di raccolta ottimale

      </p>

      <svg

        viewBox={`0 0 ${width} ${height}`}

        className="w-full h-auto bg-forest-950/50 rounded-lg border border-forest-700/30"

      >

        <rect

          x={searchStartX}

          y={padding}

          width={Math.max(searchEndX - searchStartX, 2)}

          height={chartHeight}

          fill="rgba(96, 165, 250, 0.12)"

          rx={4}

        />

        <rect

          x={windowStartX}

          y={padding}

          width={windowEndX - windowStartX}

          height={chartHeight}

          fill="rgba(228, 120, 48, 0.15)"

          rx={4}

        />

        <path

          d={`${pathD} L ${points[23].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`}

          fill="url(#gradient)"

          opacity={0.3}

        />

        <path

          d={pathD}

          fill="none"

          stroke="#f59a4a"

          strokeWidth={2}

        />

        {points

          .filter((p) => p.inSearchRange)

          .map((p) => (

            <circle

              key={p.hour}

              cx={p.x}

              cy={p.y}

              r={p.hour === hourRange.startHour || p.hour === hourRange.endHour ? 4 : 3}

              fill="#60a5fa"

              stroke="#fff"

              strokeWidth={1.5}

            />

          ))}

        <defs>

          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">

            <stop offset="0%" stopColor="#f59a4a" />

            <stop offset="100%" stopColor="transparent" />

          </linearGradient>

        </defs>

      </svg>

      <p className="text-xs text-mushroom-300 mt-1.5 italic">

        {collectionWindow.label}

      </p>

    </div>

  );

}


