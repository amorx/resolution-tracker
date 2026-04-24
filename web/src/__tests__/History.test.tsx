import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import History from "@/pages/History";
import { renderWithProviders } from "@/test/testUtils";

describe("History page", () => {
  it("renders the last 30 day title and category legend entries", async () => {
    renderWithProviders(<History />);
    await waitFor(() => expect(screen.getByText(/Last 30 days/i)).toBeInTheDocument());
  });
});
