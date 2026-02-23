"use client";

import { Plus } from "lucide-react";
import type { Resolution } from "@/lib/types";

interface ProgressLogProps {
  resolution: Resolution;
  onLogIncrement: () => void;
  onLogValue: (value: number) => void;
}

export function ProgressLog({
  resolution,
  onLogIncrement,
  onLogValue,
}: ProgressLogProps) {
  const loggingStyle = resolution.tracking?.loggingStyle ?? "increment";

  if (loggingStyle === "increment") {
    return (
      <button
        type="button"
        onClick={onLogIncrement}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-teal-600 text-white transition-colors hover:bg-teal-700"
      >
        <Plus className="h-5 w-5" />
        Log +1
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.querySelector(
          'input[type="number"]'
        ) as HTMLInputElement;
        const val = Number(input?.value) || 0;
        if (val > 0) {
          onLogValue(val);
          input.value = "";
        }
      }}
      className="flex gap-2"
    >
      <input
        type="number"
        min={1}
        placeholder="Amount"
        className="min-h-[44px] flex-1 rounded-xl border border-slate-200 px-4"
        aria-label="Amount completed"
      />
      <button
        type="submit"
        className="min-h-[44px] rounded-full bg-teal-600 px-6 text-white"
      >
        Log
      </button>
    </form>
  );
}
