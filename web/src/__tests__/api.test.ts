import { describe, expect, it } from "vitest";

import { api, categoryLabels } from "@/lib/api";
import { server } from "@/test/server";
import { http, HttpResponse } from "msw";

describe("api client", () => {
  it("fetches today's totals", async () => {
    const totals = await api.totalsToday();
    expect(totals.pushups).toBeGreaterThanOrEqual(0);
  });

  it("creates an activity", async () => {
    const result = await api.createActivity("pushups", 10);
    expect(result.id).toBe(99);
  });

  it("fetches goals and creates a goal", async () => {
    const before = await api.listGoals();
    await api.createGoal("Stretch daily");
    const after = await api.listGoals();
    expect(after.length).toBe(before.length + 1);
  });

  it("changes goal status and deletes a goal", async () => {
    const goals = await api.listGoals();
    const target = goals[0];
    const response = await api.setGoalStatus(target.id, "done");
    expect(response.status).toBe("done");
    await api.deleteGoal(target.id);
    const remaining = await api.listGoals();
    expect(remaining.find((goal) => goal.id === target.id)).toBeUndefined();
  });

  it("reprioritises goals", async () => {
    const result = await api.reprioritise();
    expect(result[0].priority).toBe(1);
  });

  it("submits and lists check-ins", async () => {
    const note = await api.submitCheckin("Great pace today");
    expect(note.sentiment).toBe("positive");
    const list = await api.listCheckins();
    expect(list[0].text).toBe("Great pace today");
  });

  it("asks for a prompt", async () => {
    const result = await api.checkinPrompt();
    expect(result.message).toContain("plank");
  });

  it("lists notifications and marks them read", async () => {
    const unread = await api.listNotifications(true);
    expect(unread.length).toBe(1);
    const pending = await api.pendingNotifications();
    expect(pending[0].message).toContain("check-in");
    await api.markNotificationRead(unread[0].id);
    const after = await api.listNotifications(true);
    expect(after.length).toBe(0);
  });

  it("exposes category labels", () => {
    expect(categoryLabels.distance_m.unit).toBe("m");
  });

  it("throws on non-OK responses", async () => {
    server.use(
      http.get("/api/activities/today", () =>
        HttpResponse.text("boom", { status: 500 }),
      ),
    );
    await expect(api.totalsToday()).rejects.toThrow();
  });

  it("throws with default message when body is empty", async () => {
    server.use(
      http.get("/api/activities/today", () =>
        HttpResponse.text("", { status: 503 }),
      ),
    );
    await expect(api.totalsToday()).rejects.toThrow(/503/);
  });

  it("returns undefined for 204 responses", async () => {
    server.use(http.get("/api/activities/today", () => new HttpResponse(null, { status: 204 })));
    const result = await api.totalsToday();
    expect(result).toBeUndefined();
  });
});
