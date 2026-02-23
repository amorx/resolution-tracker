import type { Resolution, TrackingSettings } from "./types";
import { DEFAULT_TRACKING_SETTINGS } from "./types";

const RESOLUTIONS_KEY = "resolution-tracker:resolutions";
const SETTINGS_KEY = "resolution-tracker:settings";
const LAST_PROMPT_KEY = "resolution-tracker:lastPromptDate";

export interface ResolutionStore {
  getAll: () => Promise<Resolution[]>;
  getById: (id: string) => Promise<Resolution | null>;
  add: (resolution: Omit<Resolution, "id" | "createdAt" | "progress">) => Promise<Resolution>;
  update: (id: string, updates: Partial<Resolution>) => Promise<Resolution | null>;
  delete: (id: string) => Promise<boolean>;
  addProgress: (
    id: string,
    entry: { date: string; completed: number },
    options?: { replace?: boolean }
  ) => Promise<Resolution | null>;
}

export interface SettingsStore {
  get: () => Promise<TrackingSettings>;
  set: (settings: Partial<TrackingSettings>) => Promise<void>;
}

export interface PromptStore {
  getLastPromptDate: () => string | null;
  setLastPromptDate: (date: string) => void;
}

function createResolutionStore(): ResolutionStore {
  return {
    async getAll() {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem(RESOLUTIONS_KEY);
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },

    async getById(id: string) {
      const all = await this.getAll();
      return all.find((r) => r.id === id) ?? null;
    },

    async add(resolution) {
      const all = await this.getAll();
      const now = new Date().toISOString();
      const newResolution: Resolution = {
        ...resolution,
        id: crypto.randomUUID(),
        progress: [],
        createdAt: now,
      };
      all.push(newResolution);
      localStorage.setItem(RESOLUTIONS_KEY, JSON.stringify(all));
      return newResolution;
    },

    async update(id: string, updates: Partial<Resolution>) {
      const all = await this.getAll();
      const idx = all.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], ...updates };
      localStorage.setItem(RESOLUTIONS_KEY, JSON.stringify(all));
      return all[idx];
    },

    async delete(id: string) {
      const all = await this.getAll();
      const filtered = all.filter((r) => r.id !== id);
      if (filtered.length === all.length) return false;
      localStorage.setItem(RESOLUTIONS_KEY, JSON.stringify(filtered));
      return true;
    },

    async addProgress(
      id: string,
      entry: { date: string; completed: number },
      options?: { replace?: boolean }
    ) {
      const resolution = await this.getById(id);
      if (!resolution) return null;
      const progress = [...resolution.progress];
      const existingIdx = progress.findIndex((p) => p.date === entry.date);
      if (existingIdx >= 0) {
        progress[existingIdx] = {
          ...progress[existingIdx],
          completed: options?.replace
            ? entry.completed
            : progress[existingIdx].completed + entry.completed,
        };
      } else {
        progress.push(entry);
      }
      return this.update(id, { progress });
    },
  };
}

function createSettingsStore(): SettingsStore {
  return {
    async get() {
      if (typeof window === "undefined") return DEFAULT_TRACKING_SETTINGS;
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return DEFAULT_TRACKING_SETTINGS;
      try {
        return { ...DEFAULT_TRACKING_SETTINGS, ...JSON.parse(raw) };
      } catch {
        return DEFAULT_TRACKING_SETTINGS;
      }
    },

    async set(settings: Partial<TrackingSettings>) {
      if (typeof window === "undefined") return;
      const current = await this.get();
      const next = { ...current, ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    },
  };
}

function createPromptStore(): PromptStore {
  return {
    getLastPromptDate() {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(LAST_PROMPT_KEY);
    },
    setLastPromptDate(date: string) {
      if (typeof window === "undefined") return;
      localStorage.setItem(LAST_PROMPT_KEY, date);
    },
  };
}

export const resolutionStore = createResolutionStore();
export const settingsStore = createSettingsStore();
export const promptStore = createPromptStore();
