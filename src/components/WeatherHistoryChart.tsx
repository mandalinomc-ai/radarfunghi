"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import type { DailyWeatherHistory } from "@/lib/openMeteoHistory";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface WeatherHistoryChartProps {
  history: DailyWeatherHistory;
  compact?: boolean;
}

export default function WeatherHistoryChart({
  history,
  compact,
}: WeatherHistoryChartProps) {
  const labels = history.points.map((p) => p.date.slice(5));

  const data: ChartData<"bar" | "line", number[], string> = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: "Precipitazioni (mm)",
        data: history.points.map((p) => p.precipitationMm),
        backgroundColor: "rgba(59, 130, 246, 0.55)",
        borderColor: "rgba(96, 165, 250, 0.9)",
        borderWidth: 1,
        yAxisID: "yRain",
        order: 3,
      },
      {
        type: "line" as const,
        label: "Umidità relativa (%)",
        data: history.points.map((p) => p.humidityPct),
        borderColor: "rgba(74, 222, 128, 0.95)",
        backgroundColor: "rgba(74, 222, 128, 0.1)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25,
        yAxisID: "yHum",
        order: 1,
      },
      {
        type: "line" as const,
        label: "Raffiche vento max (km/h)",
        data: history.points.map((p) => p.windGustsKmh),
        borderColor: "rgba(251, 146, 60, 0.95)",
        backgroundColor: "rgba(251, 146, 60, 0.08)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2,
        yAxisID: "yWind",
        order: 2,
      },
    ],
  };

  const options: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#7ab872",
          boxWidth: 12,
          font: { size: compact ? 9 : 10 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 26, 14, 0.95)",
        titleColor: "#fbb86e",
        bodyColor: "#7ab872",
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#5a8f54",
          maxTicksLimit: compact ? 8 : 14,
          font: { size: 9 },
        },
        grid: { color: "rgba(61, 107, 56, 0.2)" },
      },
      yRain: {
        type: "linear",
        position: "left",
        title: {
          display: !compact,
          text: "mm",
          color: "#60a5fa",
        },
        ticks: { color: "#60a5fa", font: { size: 9 } },
        grid: { color: "rgba(61, 107, 56, 0.15)" },
      },
      yHum: {
        type: "linear",
        position: "right",
        min: 0,
        max: 100,
        title: {
          display: !compact,
          text: "%",
          color: "#4ade80",
        },
        ticks: { color: "#4ade80", font: { size: 9 } },
        grid: { drawOnChartArea: false },
      },
      yWind: {
        type: "linear",
        position: "right",
        offset: true,
        title: {
          display: false,
        },
        ticks: { display: false },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className={compact ? "h-48" : "h-64 md:h-72"}>
      <Chart type="bar" data={data} options={options} />
    </div>
  );
}
