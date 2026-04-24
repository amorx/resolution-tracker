import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Goals from "@/pages/Goals";
import { renderWithProviders } from "@/test/testUtils";

describe("Goals page", () => {
  it("creates a goal and re-prioritises via AI", async () => {
    renderWithProviders(<Goals />);
    await waitFor(() => expect(screen.getByText(/Add a resolution/i)).toBeInTheDocument());
    const input = screen.getByLabelText(/New goal title/i);
    await userEvent.type(input, "Do mobility drills");
    await userEvent.click(screen.getByRole("button", { name: /^Add goal$/ }));
    await waitFor(() => expect(screen.getByText(/Do mobility drills/i)).toBeInTheDocument());
    await userEvent.click(
      screen.getByRole("button", { name: /Re-prioritise with AI/i }),
    );
    await waitFor(() => expect(screen.getAllByText(/AI pick/i).length).toBeGreaterThan(0));
  });

  it("marks a goal done and then deletes it", async () => {
    renderWithProviders(<Goals />);
    await waitFor(() => expect(screen.getByText(/Run 5k/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /^Done$/ }));
    await waitFor(() => expect(screen.getAllByText("done").length).toBeGreaterThan(0));
    await userEvent.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() => expect(screen.queryByText(/Run 5k/i)).not.toBeInTheDocument());
  });
});
