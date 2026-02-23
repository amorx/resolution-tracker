"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTrackingSettings } from "@/lib/hooks/useTrackingSettings";
import { SettingsForm } from "@/components/SettingsForm";

export default function SettingsPage() {
  const { settings, loading, update } = useTrackingSettings();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 text-teal-600"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">
          Settings
        </h1>

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : settings ? (
          <SettingsForm settings={settings} onUpdate={update} />
        ) : (
          <p className="text-slate-500">Loading settings...</p>
        )}
      </main>
    </div>
  );
}
