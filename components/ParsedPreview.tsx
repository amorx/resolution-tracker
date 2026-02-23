"use client";

import type { ParsedResolution } from "@/lib/llm/parse";

interface ParsedPreviewProps {
  parsed: ParsedResolution;
  onConfirm: () => void;
  onEdit: () => void;
  confirming?: boolean;
}

function formatFriendly(parsed: ParsedResolution): string {
  const freq =
    parsed.frequency === "daily"
      ? "per day"
      : parsed.frequency === "weekly"
        ? "per week"
        : "per month";
  return `You'll ${parsed.title.toLowerCase()} ${parsed.targetValue} ${parsed.targetUnit} ${freq}`;
}

export function ParsedPreview({
  parsed,
  onConfirm,
  onEdit,
  confirming = false,
}: ParsedPreviewProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-lg font-medium text-slate-900">
        {formatFriendly(parsed)}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {parsed.title} · {parsed.targetValue} {parsed.targetUnit} /{" "}
        {parsed.frequency}
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onEdit}
          disabled={confirming}
          className="min-h-[44px] flex-1 rounded-full border border-slate-200 px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirming}
          className="min-h-[44px] flex-1 rounded-full bg-teal-600 px-4 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
        >
          {confirming ? "Adding..." : "Add resolution"}
        </button>
      </div>
    </div>
  );
}
