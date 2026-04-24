import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import GoalList from "@/components/GoalList";
import { api, type Goal } from "@/lib/api";

export default function Goals() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");

  const goalsQuery = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: api.listGoals,
  });

  const createMutation = useMutation({
    mutationFn: api.createGoal,
    onSuccess: () => {
      toast.success("Goal added");
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ goal, status }: { goal: Goal; status: Goal["status"] }) =>
      api.setGoalStatus(goal.id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (goal: Goal) => api.deleteGoal(goal.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const reprioritiseMutation = useMutation({
    mutationFn: api.reprioritise,
    onSuccess: () => {
      toast.success("AI re-prioritised your goals");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: () => toast.error("Could not reach the LLM"),
  });

  return (
    <>
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Add a resolution</h2>
        <form
          className="flex flex-col sm:flex-row gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = title.trim();
            if (trimmed.length >= 3) {
              createMutation.mutate(trimmed);
            }
          }}
        >
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={3}
            maxLength={120}
            placeholder="e.g. Do 10 push-ups before every meal"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            aria-label="New goal title"
          />
          <button type="submit" className="btn-primary">
            Add goal
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => reprioritiseMutation.mutate()}
            disabled={reprioritiseMutation.isPending || (goalsQuery.data?.length ?? 0) === 0}
          >
            {reprioritiseMutation.isPending ? "Thinking..." : "Re-prioritise with AI"}
          </button>
        </form>
      </section>

      <GoalList
        goals={goalsQuery.data ?? []}
        onMarkDone={(goal) => statusMutation.mutate({ goal, status: "done" })}
        onDelete={(goal) => deleteMutation.mutate(goal)}
      />
    </>
  );
}
