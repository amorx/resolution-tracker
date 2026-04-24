import { useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ActivityCategory, SeriesPoint } from "@/lib/api";
import { categoryLabels } from "@/lib/api";

interface Props {
  category: ActivityCategory;
  total: number;
  series: SeriesPoint[];
  onAdd: (delta: number) => void;
  disabled?: boolean;
}

const quickAdds: Record<ActivityCategory, number[]> = {
  pushups: [5, 10, 25],
  squats: [5, 10, 25],
  situps: [5, 10, 25],
  distance_m: [100, 500, 1000],
};

export default function ActivityCard({ category, total, series, onAdd, disabled }: Props) {
  const label = categoryLabels[category];
  const [custom, setCustom] = useState("");

  const submitCustom = () => {
    const value = parseInt(custom, 10);
    if (Number.isFinite(value) && value > 0) {
      onAdd(value);
      setCustom("");
    }
  };

  return (
    <section className="card flex flex-col gap-4" aria-label={`${label.label} tracker`}>
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide">{label.label}</p>
          <p className="mt-1 text-3xl font-semibold">
            {total.toLocaleString()}
            <span className="ml-1 text-base text-slate-400">{label.unit}</span>
          </p>
        </div>
        <div className="flex gap-1">
          {quickAdds[category].map((value) => (
            <button
              key={value}
              type="button"
              className="btn-ghost px-2"
              onClick={() => onAdd(value)}
              disabled={disabled}
              aria-label={`Add ${value} ${label.unit}`}
            >
              +{value}
            </button>
          ))}
        </div>
      </header>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series}>
            <defs>
              <linearGradient id={`grad-${category}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              formatter={(value: number) => [value, label.label]}
              labelFormatter={(iso: string) => iso}
            />
            <Area
              type="monotone"
              dataKey={category}
              stroke="#4f46e5"
              fill={`url(#grad-${category})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder={`Custom ${label.unit}`}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          aria-label={`Custom ${label.label} amount`}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={submitCustom}
          disabled={disabled || !custom}
        >
          Log
        </button>
      </div>
    </section>
  );
}
