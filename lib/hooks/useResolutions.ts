"use client";

import { useState, useEffect, useCallback } from "react";
import type { Resolution, ProgressEntry } from "../types";
import { resolutionStore } from "../store";

export function useResolutions() {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await resolutionStore.getAll();
    setResolutions(data);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const add = useCallback(
    async (resolution: Omit<Resolution, "id" | "createdAt" | "progress">) => {
      const created = await resolutionStore.add(resolution);
      await refresh();
      return created;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, updates: Partial<Resolution>) => {
      const updated = await resolutionStore.update(id, updates);
      await refresh();
      return updated;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const ok = await resolutionStore.delete(id);
      await refresh();
      return ok;
    },
    [refresh]
  );

  const addProgress = useCallback(
    async (
      id: string,
      entry: { date: string; completed: number },
      options?: { replace?: boolean }
    ) => {
      const updated = await resolutionStore.addProgress(id, entry, options);
      await refresh();
      return updated;
    },
    [refresh]
  );

  return {
    resolutions,
    loading,
    refresh,
    add,
    update,
    remove,
    addProgress,
  };
}
