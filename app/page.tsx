"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useResolutions } from "@/lib/hooks/useResolutions";
import { useTrackingSettings } from "@/lib/hooks/useTrackingSettings";
import { getResolutionsNeedingPrompt } from "@/lib/tracking/prompts";
import { Plus, Settings } from "lucide-react";
import { ResolutionCard } from "@/components/ResolutionCard";
import { PromptBanner } from "@/components/PromptBanner";

const MAX_RESOLUTIONS = 5;

export default function Home() {
  const { resolutions, loading } = useResolutions();
  const { settings } = useTrackingSettings();
  const [prompts, setPrompts] = useState<ReturnType<typeof getResolutionsNeedingPrompt>>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (settings && resolutions.length > 0 && !bannerDismissed) {
      setPrompts(getResolutionsNeedingPrompt(resolutions, settings));
    } else {
      setPrompts([]);
    }
  }, [resolutions, settings, bannerDismissed]);

  const handleDismissBanner = () => {
    setBannerDismissed(true);
  };

  const atLimit = resolutions.length >= MAX_RESOLUTIONS;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold">Resolution Tracker</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <Link
              href="/add"
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white transition-colors ${
                atLimit
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}
              aria-label="Add resolution"
              aria-disabled={atLimit}
            >
              <Plus className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <>
            {prompts.length > 0 && (
              <PromptBanner prompts={prompts} onDismiss={handleDismissBanner} />
            )}
            {resolutions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="mb-2 text-lg font-medium text-slate-700">
              No resolutions yet
            </p>
            <p className="mb-6 text-slate-500">
              Type your resolution in plain English—e.g., &quot;run 3 times a
              week&quot;
            </p>
            <Link
              href="/add"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-teal-600 px-6 text-white transition-colors hover:bg-teal-700"
            >
              Add your first resolution
            </Link>
          </div>
            ) : (
              <ul className="space-y-4">
                {resolutions.map((r) => (
                  <li key={r.id}>
                    <ResolutionCard resolution={r} settings={settings} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
