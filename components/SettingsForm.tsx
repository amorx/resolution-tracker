"use client";

import type { TrackingSettings } from "@/lib/types";

interface SettingsFormProps {
  settings: TrackingSettings;
  onUpdate: (updates: Partial<TrackingSettings>) => Promise<void>;
}

export function SettingsForm({ settings, onUpdate }: SettingsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Week starts on
        </label>
        <select
          value={settings.weekStartsOn}
          onChange={(e) =>
            onUpdate({
              weekStartsOn: e.target.value as "sunday" | "monday",
            })
          }
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-4"
        >
          <option value="sunday">Sunday</option>
          <option value="monday">Monday</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Day resets at
        </label>
        <select
          value={settings.dayResetsAt}
          onChange={(e) => onUpdate({ dayResetsAt: Number(e.target.value) })}
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-4"
        >
          <option value={0}>Midnight</option>
          <option value={4}>4:00 AM</option>
          <option value={6}>6:00 AM</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Reminders
        </label>
        <select
          value={settings.reminderMode}
          onChange={(e) =>
            onUpdate({
              reminderMode: e.target.value as
                | "off"
                | "in_app"
                | "browser",
            })
          }
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-4"
        >
          <option value="off">Off</option>
          <option value="in_app">In-app only</option>
          <option value="browser">Browser notifications</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          In-app prompts
        </label>
        <select
          value={settings.inAppPromptFrequency}
          onChange={(e) =>
            onUpdate({
              inAppPromptFrequency: e.target.value as
                | "every_visit"
                | "once_per_day"
                | "off",
            })
          }
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-4"
        >
          <option value="off">Off</option>
          <option value="once_per_day">Once per day</option>
          <option value="every_visit">Every visit</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          Prompt when behind on target
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={settings.promptWhenBehind}
          onClick={() =>
            onUpdate({ promptWhenBehind: !settings.promptWhenBehind })
          }
          className={`relative inline-flex h-8 w-14 rounded-full transition-colors ${
            settings.promptWhenBehind ? "bg-teal-600" : "bg-slate-200"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              settings.promptWhenBehind ? "translate-x-7" : "translate-x-1"
            }`}
            style={{ marginTop: 4 }}
          />
        </button>
      </div>
    </div>
  );
}
