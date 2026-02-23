export interface ResolutionWeight {
  measurability: number; // 1-10
  achievability: number; // 1-10
  importance: number; // 1-10
  combined: number; // 0-100 weighted score
}

export interface ProgressEntry {
  date: string; // ISO date
  completed: number; // e.g., 2 (for "2 of 3 times")
}

export interface ResolutionTrackingConfig {
  reminderMode?: "off" | "in_app" | "browser";
  loggingStyle?: "increment" | "set_value";
}

export interface Resolution {
  id: string;
  title: string;
  targetValue: number;
  targetUnit: string;
  frequency: "daily" | "weekly" | "monthly";
  rawInput?: string;
  weight?: ResolutionWeight;
  tracking?: ResolutionTrackingConfig;
  progress: ProgressEntry[];
  createdAt: string;
}

export interface TrackingSettings {
  weekStartsOn: "sunday" | "monday";
  dayResetsAt: number; // Hour (0-23)
  reminderMode: "off" | "in_app" | "browser";
  reminderTime?: string; // "09:00"
  inAppPromptFrequency: "every_visit" | "once_per_day" | "off";
  promptWhenBehind: boolean;
}

export const DEFAULT_TRACKING_SETTINGS: TrackingSettings = {
  weekStartsOn: "monday",
  dayResetsAt: 0,
  reminderMode: "in_app",
  inAppPromptFrequency: "once_per_day",
  promptWhenBehind: true,
};
