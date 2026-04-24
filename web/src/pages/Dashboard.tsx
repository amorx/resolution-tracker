import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import ActivityCard from "@/components/ActivityCard";
import {
  api,
  categoryLabels,
  type ActivityCategory,
  type DailyTotals,
  type SeriesPoint,
} from "@/lib/api";

const CATEGORIES: ActivityCategory[] = ["pushups", "distance_m", "squats", "situps"];

export default function Dashboard() {
  const queryClient = useQueryClient();

  const totals = useQuery<DailyTotals>({
    queryKey: ["activities", "today"],
    queryFn: api.totalsToday,
  });

  const series = useQuery<SeriesPoint[]>({
    queryKey: ["activities", "series"],
    queryFn: () => api.series(7),
  });

  const addMutation = useMutation({
    mutationFn: async ({
      category,
      count,
    }: {
      category: ActivityCategory;
      count: number;
    }) => api.createActivity(category, count),
    onSuccess: (_, variables) => {
      toast.success(`Logged ${variables.count} ${categoryLabels[variables.category].unit}`);
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: () => toast.error("Could not save activity"),
  });

  const promptQuery = useQuery({
    queryKey: ["prompt"],
    queryFn: api.checkinPrompt,
    enabled: false,
  });

  return (
    <>
      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Today at a glance</h2>
            <p className="text-sm text-slate-500">
              Log each rep as you go. Your local coach checks in on you automatically.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => promptQuery.refetch()}
            disabled={promptQuery.isFetching}
          >
            {promptQuery.isFetching ? "Thinking..." : "Ask my coach for a nudge"}
          </button>
        </div>
        {promptQuery.data && (
          <p className="mt-4 text-sm bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 text-brand-700">
            {promptQuery.data.message}
          </p>
        )}
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {CATEGORIES.map((category) => (
          <ActivityCard
            key={category}
            category={category}
            total={totals.data ? totals.data[category] : 0}
            series={series.data ?? []}
            onAdd={(count) => addMutation.mutate({ category, count })}
            disabled={addMutation.isPending}
          />
        ))}
      </section>
    </>
  );
}
