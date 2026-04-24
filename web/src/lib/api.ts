export type ActivityCategory = "pushups" | "distance_m" | "squats" | "situps";

export interface DailyTotals {
  date: string;
  pushups: number;
  distance_m: number;
  squats: number;
  situps: number;
}

export interface SeriesPoint extends DailyTotals {
  date: string;
}

export interface Goal {
  id: number;
  title: string;
  category: string | null;
  priority: number;
  status: "active" | "done" | "archived";
  ai_reason?: string | null;
}

export type Sentiment = "positive" | "neutral" | "negative";

export interface ProgressNote {
  id: number;
  date: string;
  text: string;
  sentiment: Sentiment;
  score: number;
  summary: string;
}

export interface Notification {
  id: number;
  kind: string;
  message: string;
  due_at: string;
  read_at: string | null;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  async createActivity(category: ActivityCategory, count: number): Promise<{ id: number; date: string }> {
    return request("/api/activities", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ category, count }),
    });
  },
  async totalsToday(): Promise<DailyTotals> {
    return request("/api/activities/today");
  },
  async series(days = 7): Promise<SeriesPoint[]> {
    return request(`/api/activities/series?days=${days}`);
  },
  async listGoals(): Promise<Goal[]> {
    return request("/api/goals");
  },
  async createGoal(title: string): Promise<{ id: number }> {
    return request("/api/goals", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ title }),
    });
  },
  async setGoalStatus(id: number, status: Goal["status"]): Promise<{ status: string }> {
    return request(`/api/goals/${id}/status`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ status }),
    });
  },
  async deleteGoal(id: number): Promise<void> {
    await request(`/api/goals/${id}`, { method: "DELETE" });
  },
  async reprioritise(): Promise<Goal[]> {
    return request("/api/goals/reprioritise", { method: "POST" });
  },
  async listCheckins(): Promise<ProgressNote[]> {
    return request("/api/checkins");
  },
  async submitCheckin(text: string): Promise<ProgressNote> {
    return request("/api/checkins", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ text }),
    });
  },
  async checkinPrompt(): Promise<{ message: string }> {
    return request("/api/checkins/prompt", { method: "POST" });
  },
  async listNotifications(unreadOnly = false): Promise<Notification[]> {
    return request(`/api/notifications${unreadOnly ? "?unread_only=true" : ""}`);
  },
  async pendingNotifications(): Promise<Notification[]> {
    return request("/api/notifications/pending");
  },
  async markNotificationRead(id: number): Promise<{ status: string }> {
    return request(`/api/notifications/${id}/read`, { method: "POST" });
  },
};

export const categoryLabels: Record<ActivityCategory, { label: string; unit: string }> = {
  pushups: { label: "Push-ups", unit: "reps" },
  distance_m: { label: "Distance", unit: "m" },
  squats: { label: "Squats", unit: "reps" },
  situps: { label: "Sit-ups", unit: "reps" },
};
