import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import type {
  DailyTotals,
  Goal,
  Notification,
  ProgressNote,
  SeriesPoint,
} from "@/lib/api";

interface Database {
  totals: DailyTotals;
  series: SeriesPoint[];
  goals: Goal[];
  checkins: ProgressNote[];
  notifications: Notification[];
}

const initial = (): Database => ({
  totals: { date: "2026-04-24", pushups: 12, distance_m: 0, squats: 0, situps: 4 },
  series: [
    { date: "2026-04-22", pushups: 5, distance_m: 0, squats: 0, situps: 0 },
    { date: "2026-04-23", pushups: 10, distance_m: 500, squats: 0, situps: 0 },
    { date: "2026-04-24", pushups: 12, distance_m: 0, squats: 0, situps: 4 },
  ],
  goals: [
    {
      id: 1,
      title: "Run 5k",
      category: "cardio",
      priority: 2,
      status: "active",
      ai_reason: "Builds endurance",
    },
  ],
  checkins: [
    {
      id: 1,
      date: "2026-04-24",
      text: "Felt strong today.",
      sentiment: "positive",
      score: 0.8,
      summary: "Strong workout",
    },
  ],
  notifications: [
    {
      id: 1,
      kind: "checkin",
      message: "Quick check-in: ready for 10 more push-ups?",
      due_at: "2026-04-24T09:00:00Z",
      read_at: null,
    },
  ],
});

let db = initial();

export const resetDb = (): void => {
  db = initial();
};

export const getDb = (): Database => db;

export const handlers = [
  http.get("/api/activities/today", () => HttpResponse.json(db.totals)),
  http.get("/api/activities/series", () => HttpResponse.json(db.series)),
  http.post("/api/activities", async ({ request }) => {
    const body = (await request.json()) as { category: keyof DailyTotals; count: number };
    if (body.category in db.totals && body.category !== "date") {
      db.totals = {
        ...db.totals,
        [body.category]: (db.totals[body.category] as number) + body.count,
      };
    }
    return HttpResponse.json({ id: 99, date: "2026-04-24" }, { status: 201 });
  }),
  http.get("/api/goals", () => HttpResponse.json(db.goals)),
  http.post("/api/goals", async ({ request }) => {
    const body = (await request.json()) as { title: string };
    const goal: Goal = {
      id: db.goals.length + 1,
      title: body.title,
      category: null,
      priority: 3,
      status: "active",
    };
    db.goals = [...db.goals, goal];
    return HttpResponse.json({ id: goal.id }, { status: 201 });
  }),
  http.patch("/api/goals/:id/status", async ({ params, request }) => {
    const body = (await request.json()) as { status: Goal["status"] };
    db.goals = db.goals.map((g) =>
      g.id === Number(params.id) ? { ...g, status: body.status } : g,
    );
    return HttpResponse.json({ status: body.status });
  }),
  http.delete("/api/goals/:id", ({ params }) => {
    db.goals = db.goals.filter((g) => g.id !== Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),
  http.post("/api/goals/reprioritise", () => {
    db.goals = db.goals.map((g) => ({ ...g, priority: 1, ai_reason: "AI pick" }));
    return HttpResponse.json(db.goals);
  }),
  http.get("/api/checkins", () => HttpResponse.json(db.checkins)),
  http.post("/api/checkins", async ({ request }) => {
    const body = (await request.json()) as { text: string };
    const note: ProgressNote = {
      id: db.checkins.length + 1,
      date: "2026-04-24",
      text: body.text,
      sentiment: "positive",
      score: 0.7,
      summary: "Logged",
    };
    db.checkins = [note, ...db.checkins];
    return HttpResponse.json(note, { status: 201 });
  }),
  http.post("/api/checkins/prompt", () =>
    HttpResponse.json({ message: "Try a 2 minute plank." }),
  ),
  http.get("/api/notifications", ({ request }) => {
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unread_only") === "true";
    const items = unreadOnly ? db.notifications.filter((n) => !n.read_at) : db.notifications;
    return HttpResponse.json(items);
  }),
  http.get("/api/notifications/pending", () =>
    HttpResponse.json(db.notifications.filter((n) => !n.read_at)),
  ),
  http.post("/api/notifications/:id/read", ({ params }) => {
    db.notifications = db.notifications.map((n) =>
      n.id === Number(params.id) ? { ...n, read_at: "2026-04-24T09:30:00Z" } : n,
    );
    return HttpResponse.json({ status: "ok" });
  }),
  http.post("/api/chat", () =>
    HttpResponse.text("Hi there, keep going strong!", {
      headers: { "Content-Type": "text/plain" },
    }),
  ),
];

export const server = setupServer(...handlers);
