import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import CheckinForm from "@/components/CheckinForm";

describe("CheckinForm", () => {
  it("submits the text and clears the input", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CheckinForm onSubmit={onSubmit} />);
    const textarea = screen.getByLabelText(/How is your day tracking/i) as HTMLTextAreaElement;
    await userEvent.type(textarea, "Feeling strong");
    await userEvent.click(screen.getByRole("button", { name: /Save & analyse/i }));
    expect(onSubmit).toHaveBeenCalledWith("Feeling strong");
  });

  it("does not submit blank content", async () => {
    const onSubmit = vi.fn();
    render(<CheckinForm onSubmit={onSubmit} />);
    const button = screen.getByRole("button", { name: /Save & analyse/i });
    expect(button).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("honours the disabled prop", () => {
    render(<CheckinForm onSubmit={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: /Save & analyse/i })).toBeDisabled();
  });
});
