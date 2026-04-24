import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import NotificationBell from "@/components/NotificationBell";
import { renderWithProviders } from "@/test/testUtils";

describe("NotificationBell", () => {
  it("shows the unread count and lets the user mark notifications read", async () => {
    renderWithProviders(<NotificationBell />);
    const button = await screen.findByRole("button", { name: /Notifications \(1 unread\)/i });
    await userEvent.click(button);
    expect(screen.getByText(/Quick check-in/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Mark read/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Notifications \(0 unread\)/i }),
      ).toBeInTheDocument(),
    );
  });

  it("toggles the menu closed when clicked again", async () => {
    renderWithProviders(<NotificationBell />);
    const button = await screen.findByRole("button", { name: /Notifications/i });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
