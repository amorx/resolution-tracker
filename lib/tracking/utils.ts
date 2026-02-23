import type { Resolution, TrackingSettings } from "../types";

export function getToday(settings: TrackingSettings): string {
  const now = new Date();
  const hour = now.getHours();
  if (hour < settings.dayResetsAt) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10);
  }
  return now.toISOString().slice(0, 10);
}

export function getCurrentWeekStart(settings: TrackingSettings): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOnSunday = settings.weekStartsOn === "sunday";
  const offset = startOnSunday
    ? dayOfWeek
    : dayOfWeek === 0
      ? 6
      : dayOfWeek - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - offset);
  return start.toISOString().slice(0, 10);
}

export function getCurrentMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function getPeriodProgress(
  resolution: Resolution,
  settings: TrackingSettings
): { current: number; target: number } {
  const today = getToday(settings);
  const monthStr = today.slice(0, 7);

  if (resolution.frequency === "daily") {
    const entry = resolution.progress.find((p) => p.date === today);
    return {
      current: entry?.completed ?? 0,
      target: resolution.targetValue,
    };
  }

  if (resolution.frequency === "monthly") {
    const total = resolution.progress
      .filter((p) => p.date.startsWith(monthStr))
      .reduce((sum, p) => sum + p.completed, 0);
    return { current: total, target: resolution.targetValue };
  }

  const weekStart = getCurrentWeekStart(settings);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const total = resolution.progress
    .filter((p) => p.date >= weekStart && p.date < weekEndStr)
    .reduce((sum, p) => sum + p.completed, 0);
  return { current: total, target: resolution.targetValue };
}

export function isBehindTarget(
  resolution: Resolution,
  settings: TrackingSettings
): boolean {
  const { current, target } = getPeriodProgress(resolution, settings);
  return current < target;
}

export function hasNoLogThisPeriod(
  resolution: Resolution,
  settings: TrackingSettings
): boolean {
  const { current } = getPeriodProgress(resolution, settings);
  return current === 0;
}
