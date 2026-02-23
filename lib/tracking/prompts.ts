import type { Resolution, TrackingSettings } from "../types";
import { getPeriodProgress } from "./utils";
import { promptStore } from "../store";

export interface PromptResolution {
  resolution: Resolution;
  reason: "no_log" | "behind";
  current: number;
  target: number;
}

export function getResolutionsNeedingPrompt(
  resolutions: Resolution[],
  settings: TrackingSettings
): PromptResolution[] {
  if (
    settings.inAppPromptFrequency === "off" ||
    (settings.reminderMode !== "in_app" && settings.reminderMode !== "browser")
  ) {
    return [];
  }

  if (settings.inAppPromptFrequency === "once_per_day") {
    const last = promptStore.getLastPromptDate();
    const today = new Date().toISOString().slice(0, 10);
    if (last === today) return [];
  }

  const result: PromptResolution[] = [];

  for (const r of resolutions) {
    if (!settings.promptWhenBehind) continue;

    const { current, target } = getPeriodProgress(r, settings);

    if (current === 0) {
      result.push({ resolution: r, reason: "no_log", current, target });
    } else if (current < target) {
      result.push({ resolution: r, reason: "behind", current, target });
    }
  }

  return result;
}

export function markPromptShown(): void {
  const today = new Date().toISOString().slice(0, 10);
  promptStore.setLastPromptDate(today);
}
