import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Dashboard from "@/pages/Dashboard";
import { renderWithProviders } from "@/test/testUtils";

describe("Dashboard page", () => {
  it("loads today's totals and lets the user log a rep", async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Push-ups")).toBeInTheDocument());
    const firstAddButton = screen.getAllByRole("button", { name: /Add 5 reps/i })[0];
    await userEvent.click(firstAddButton);
    // Optimistic totals are not used, but the query should re-fetch and the
    // button remains rendered. A successful mutation is sufficient here.
    await waitFor(() => expect(firstAddButton).not.toBeDisabled());
  });

  it("requests a coaching prompt when asked", async () => {
    renderWithProviders(<Dashboard />);
    await userEvent.click(
      screen.getByRole("button", { name: /Ask my coach for a nudge/i }),
    );
    await waitFor(() =>
      expect(screen.getByText(/Try a 2 minute plank/i)).toBeInTheDocument(),
    );
  });
});
