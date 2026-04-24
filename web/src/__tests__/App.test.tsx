import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "@/App";
import { renderWithProviders } from "@/test/testUtils";

describe("App", () => {
  it("renders the layout and dashboard by default", async () => {
    renderWithProviders(<App />);
    expect(await screen.findByText(/Today at a glance/i)).toBeInTheDocument();
    expect(screen.getByText(/Resolution Tracker/i)).toBeInTheDocument();
  });

  it("navigates to Goals, Check-in, and History", async () => {
    renderWithProviders(<App />);
    await userEvent.click(screen.getByRole("link", { name: /^Goals$/ }));
    await waitFor(() => expect(screen.getByText(/Add a resolution/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole("link", { name: /^Check-in$/ }));
    await waitFor(() =>
      expect(screen.getByText(/Chat with your coach/i)).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("link", { name: /^History$/ }));
    await waitFor(() => expect(screen.getByText(/Last 30 days/i)).toBeInTheDocument());
  });

  it("redirects unknown routes to the dashboard", async () => {
    renderWithProviders(<App />, { initialEntries: ["/not-a-route"] });
    expect(await screen.findByText(/Today at a glance/i)).toBeInTheDocument();
  });
});
