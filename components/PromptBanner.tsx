"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { PromptResolution } from "@/lib/tracking/prompts";
import { markPromptShown } from "@/lib/tracking/prompts";

interface PromptBannerProps {
  prompts: PromptResolution[];
  onDismiss: () => void;
}

function formatTarget(r: PromptResolution): string {
  const freq =
    r.resolution.frequency === "daily"
      ? "today"
      : r.resolution.frequency === "weekly"
        ? "this week"
        : "this month";
  return `${r.resolution.targetValue} ${r.resolution.targetUnit} ${freq}`;
}

export function PromptBanner({ prompts, onDismiss }: PromptBannerProps) {
  if (prompts.length === 0) return null;

  const handleDismiss = () => {
    markPromptShown();
    onDismiss();
  };

  const first = prompts[0];
  const rest = prompts.length - 1;

  return (
    <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-teal-900">
            {first.reason === "no_log"
              ? `Haven't logged ${first.resolution.title} yet`
              : `${first.resolution.title}: ${first.current} of ${first.target} done`}
          </p>
          <p className="mt-0.5 text-sm text-teal-700">
            {formatTarget(first)}
          </p>
          <Link
            href={`/resolution/${first.resolution.id}`}
            className="mt-2 inline-block min-h-[36px] rounded-full bg-teal-600 px-4 font-medium text-white transition-colors hover:bg-teal-700"
          >
            Log progress
          </Link>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full text-teal-600 transition-colors hover:bg-teal-100"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {rest > 0 && (
        <p className="mt-2 text-sm text-teal-600">
          +{rest} more resolution{rest > 1 ? "s" : ""} need attention
        </p>
      )}
    </div>
  );
}
