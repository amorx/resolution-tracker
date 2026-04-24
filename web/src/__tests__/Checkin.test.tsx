import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Checkin from "@/pages/Checkin";
import { renderWithProviders } from "@/test/testUtils";

describe("Checkin page", () => {
  it("loads existing notes and submits a new one with sentiment", async () => {
    renderWithProviders(<Checkin />);
    await waitFor(() => expect(screen.getByText(/Felt strong today/i)).toBeInTheDocument());
    const textarea = screen.getByLabelText(/How is your day tracking/i);
    await userEvent.type(textarea, "Great session");
    await userEvent.click(screen.getByRole("button", { name: /Save & analyse/i }));
    await waitFor(() => expect(screen.getByText(/Great session/i)).toBeInTheDocument());
    expect(screen.getAllByText(/Positive/i).length).toBeGreaterThan(0);
  });
});
