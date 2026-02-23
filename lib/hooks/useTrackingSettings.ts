"use client";

import { useState, useEffect, useCallback } from "react";
import type { TrackingSettings } from "../types";
import { settingsStore } from "../store";

export function useTrackingSettings() {
  const [settings, setSettings] = useState<TrackingSettings | null>(null);

  const refresh = useCallback(async () => {
    const data = await settingsStore.get();
    setSettings(data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback(
    async (updates: Partial<TrackingSettings>) => {
      await settingsStore.set(updates);
      await refresh();
    },
    [refresh]
  );

  return {
    settings,
    loading: settings === null,
    update,
    refresh,
  };
}
