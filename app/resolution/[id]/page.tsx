"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useResolutions } from "@/lib/hooks/useResolutions";
import { useTrackingSettings } from "@/lib/hooks/useTrackingSettings";
import { WeightBadge } from "@/components/WeightBadge";
import { ProgressLog } from "@/components/ProgressLog";
import { getPeriodProgress } from "@/lib/tracking/utils";
import { DEFAULT_TRACKING_SETTINGS } from "@/lib/types";
import type { Resolution } from "@/lib/types";

function formatTarget(r: Resolution): string {
  const freq =
    r.frequency === "daily"
      ? "day"
      : r.frequency === "weekly"
        ? "week"
        : "month";
  return `${r.targetValue} ${r.targetUnit}/${freq}`;
}

function getStreak(r: Resolution): number {
  const sorted = [...r.progress].sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let expected = today;
  for (const entry of sorted) {
    if (entry.date === expected) {
      streak++;
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toISOString().slice(0, 10);
    } else if (entry.date < expected) {
      break;
    }
  }
  return streak;
}

export default function ResolutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { resolutions, addProgress, remove } = useResolutions();
  const { settings } = useTrackingSettings();
  const [resolution, setResolution] = useState<Resolution | null>(null);

  const id = params.id as string;
  const s = settings ?? DEFAULT_TRACKING_SETTINGS;

  useEffect(() => {
    const r = resolutions.find((res) => res.id === id);
    setResolution(r ?? null);
  }, [resolutions, id]);

  const handleLogIncrement = async () => {
    if (!resolution) return;
    const today = new Date().toISOString().slice(0, 10);
    await addProgress(resolution.id, { date: today, completed: 1 });
  };

  const handleLogValue = async (value: number) => {
    if (!resolution) return;
    const today = new Date().toISOString().slice(0, 10);
    await addProgress(
      resolution.id,
      { date: today, completed: value },
      { replace: true }
    );
  };

  const handleDelete = async () => {
    if (!resolution || !confirm("Delete this resolution?")) return;
    await remove(resolution.id);
    router.push("/");
  };

  if (!resolution) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const { current, target } = getPeriodProgress(resolution, s);
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const streak = getStreak(resolution);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-teal-600"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-red-600 transition-colors hover:bg-red-50"
            aria-label="Delete resolution"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {resolution.title}
            </h1>
            <p className="mt-1 text-slate-500">{formatTarget(resolution)}</p>
          </div>
          {resolution.weight && (
            <WeightBadge combined={resolution.weight.combined} />
          )}
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-600">This period</span>
            <span className="font-medium">
              {current} / {target}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {streak > 0 && (
            <p className="mt-2 text-sm text-teal-600">
              {streak} day streak
            </p>
          )}
        </div>

        <div className="mb-6">
          <h2 className="mb-3 font-medium text-slate-900">Log completion</h2>
          <ProgressLog
            resolution={resolution}
            onLogIncrement={handleLogIncrement}
            onLogValue={handleLogValue}
          />
        </div>

        <div>
          <h2 className="mb-3 font-medium text-slate-900">Recent activity</h2>
          {resolution.progress.length === 0 ? (
            <p className="text-slate-500">No logs yet</p>
          ) : (
            <ul className="space-y-2">
              {[...resolution.progress]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 10)
                .map((p) => (
                  <li
                    key={`${p.date}-${p.completed}`}
                    className="flex justify-between rounded-lg bg-white px-4 py-2"
                  >
                    <span className="text-slate-700">{p.date}</span>
                    <span className="font-medium">{p.completed}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
