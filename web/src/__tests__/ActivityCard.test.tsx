import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ActivityCard from "@/components/ActivityCard";
import type { SeriesPoint } from "@/lib/api";

const series: SeriesPoint[] = [
  { date: "2026-04-22", pushups: 5, distance_m: 0, squats: 0, situps: 0 },
  { date: "2026-04-23", pushups: 10, distance_m: 0, squats: 0, situps: 0 },
  { date: "2026-04-24", pushups: 12, distance_m: 0, squats: 0, situps: 0 },
];

describe("ActivityCard", () => {
  it("renders total and invokes quick-add buttons", async () => {
    const onAdd = vi.fn();
    render(
      <ActivityCard category="pushups" total={12} series={series} onAdd={onAdd} />,
    );
    expect(screen.getByText("Push-ups")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Add 10 reps/i }));
    expect(onAdd).toHaveBeenCalledWith(10);
  });

  it("submits a positive custom amount and resets the input", async () => {
    const onAdd = vi.fn();
    render(
      <ActivityCard category="distance_m" total={0} series={series} onAdd={onAdd} />,
    );
    const input = screen.getByLabelText(/Custom Distance amount/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "250" } });
    await userEvent.click(screen.getByRole("button", { name: /Log/i }));
    expect(onAdd).toHaveBeenCalledWith(250);
    expect(input.value).toBe("");
  });

  it("ignores non-positive custom amounts", async () => {
    const onAdd = vi.fn();
    render(
      <ActivityCard category="squats" total={0} series={series} onAdd={onAdd} />,
    );
    const input = screen.getByLabelText(/Custom Squats amount/i);
    fireEvent.change(input, { target: { value: "0" } });
    await userEvent.click(screen.getByRole("button", { name: /Log/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("disables quick-add when disabled prop is true", () => {
    render(
      <ActivityCard
        category="situps"
        total={0}
        series={series}
        onAdd={() => undefined}
        disabled
      />,
    );
    const button = screen.getByRole("button", { name: /Add 5 reps/i });
    expect(button).toBeDisabled();
  });
});
