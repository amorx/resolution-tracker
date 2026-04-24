import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, categoryLabels, type SeriesPoint } from "@/lib/api";

export default function History() {
  const seriesQuery = useQuery<SeriesPoint[]>({
    queryKey: ["activities", "series", 30],
    queryFn: () => api.series(30),
  });

  return (
    <section className="card">
      <h2 className="text-lg font-semibold">Last 30 days</h2>
      <p className="text-sm text-slate-500 mb-4">
        Totals per category. Bars share a vertical axis in units of reps (distance shown in metres).
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={seriesQuery.data ?? []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pushups" stackId="a" fill="#6366f1" name={categoryLabels.pushups.label} />
            <Bar dataKey="squats" stackId="a" fill="#f59e0b" name={categoryLabels.squats.label} />
            <Bar dataKey="situps" stackId="a" fill="#10b981" name={categoryLabels.situps.label} />
            <Bar dataKey="distance_m" fill="#ec4899" name={categoryLabels.distance_m.label} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
