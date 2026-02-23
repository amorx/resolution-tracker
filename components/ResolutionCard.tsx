import Link from "next/link";
import type { Resolution, TrackingSettings } from "@/lib/types";
import { DEFAULT_TRACKING_SETTINGS } from "@/lib/types";
import { WeightBadge } from "./WeightBadge";
import { getPeriodProgress } from "@/lib/tracking/utils";

interface ResolutionCardProps {
  resolution: Resolution;
  settings?: TrackingSettings | null;
}

function formatTarget(r: Resolution): string {
  const freq =
    r.frequency === "daily"
      ? "day"
      : r.frequency === "weekly"
        ? "week"
        : "month";
  return `${r.targetValue} ${r.targetUnit}/${freq}`;
}

export function ResolutionCard({ resolution, settings }: ResolutionCardProps) {
  const s = settings ?? DEFAULT_TRACKING_SETTINGS;
  const { current, target } = getPeriodProgress(resolution, s);
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  return (
    <Link
      href={`/resolution/${resolution.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-slate-900">{resolution.title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{formatTarget(resolution)}</p>
        </div>
        {resolution.weight && (
          <WeightBadge combined={resolution.weight.combined} />
        )}
      </div>
      <div className="mt-3">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {current} / {target} this period
        </p>
      </div>
    </Link>
  );
}
