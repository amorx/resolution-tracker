import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import GoalList from "@/components/GoalList";
import type { Goal } from "@/lib/api";

const activeGoal: Goal = {
  id: 1,
  title: "Run 5k",
  category: "cardio",
  priority: 2,
  status: "active",
  ai_reason: "Builds endurance",
};

const doneGoal: Goal = {
  id: 2,
  title: "Plank daily",
  category: "strength",
  priority: 1,
  status: "done",
};

describe("GoalList", () => {
  it("renders empty state when there are no goals", () => {
    render(<GoalList goals={[]} onMarkDone={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/Add your first resolution/i)).toBeInTheDocument();
  });

  it("renders goals with category badges and reasons", () => {
    render(
      <GoalList goals={[activeGoal, doneGoal]} onMarkDone={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Run 5k")).toBeInTheDocument();
    expect(screen.getByText("cardio")).toBeInTheDocument();
    expect(screen.getByText("Builds endurance")).toBeInTheDocument();
    expect(screen.getAllByText("done").length).toBeGreaterThan(0);
  });

  it("fires callbacks for mark-done and delete", async () => {
    const onMarkDone = vi.fn();
    const onDelete = vi.fn();
    render(
      <GoalList goals={[activeGoal]} onMarkDone={onMarkDone} onDelete={onDelete} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /^Done$/ }));
    await userEvent.click(screen.getByRole("button", { name: /^Delete$/ }));
    expect(onMarkDone).toHaveBeenCalledWith(activeGoal);
    expect(onDelete).toHaveBeenCalledWith(activeGoal);
  });

  it("hides the Done button for completed goals and uses fallback category colour", () => {
    const unknownCategoryGoal: Goal = { ...doneGoal, category: "unknown" };
    render(
      <GoalList goals={[unknownCategoryGoal]} onMarkDone={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.queryByRole("button", { name: /^Done$/ })).not.toBeInTheDocument();
  });
});
