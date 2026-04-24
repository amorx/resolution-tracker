import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

import { resetDb, server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetDb();
});
afterAll(() => server.close());

if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(globalThis, "ResizeObserver", {
    value: ResizeObserverStub,
  });
}

if (typeof window !== "undefined" && typeof window.Notification === "undefined") {
  class NotificationStub {
    static permission: NotificationPermission = "granted";
    static requestPermission(): Promise<NotificationPermission> {
      return Promise.resolve("granted");
    }
    constructor(_title: string, _options?: NotificationOptions) {
      // no-op
    }
  }
  Object.defineProperty(window, "Notification", {
    value: NotificationStub,
    writable: true,
  });
}
