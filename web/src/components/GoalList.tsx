import type { Goal } from "@/lib/api";

const categoryColours: Record<string, string> = {
  strength: "bg-amber-100 text-amber-700",
  cardio: "bg-rose-100 text-rose-700",
  endurance: "bg-indigo-100 text-indigo-700",
  flexibility: "bg-emerald-100 text-emerald-700",
  wellbeing: "bg-sky-100 text-sky-700",
};

interface Props {
  goals: Goal[];
  onMarkDone: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

export default function GoalList({ goals, onMarkDone, onDelete }: Props) {
  if (goals.length === 0) {
    return <p className="text-sm text-slate-500">Add your first resolution to get started.</p>;
  }

  return (
    <ul className="space-y-3">
      {goals.map((goal) => (
        <li key={goal.id} className="card flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">#{goal.priority}</span>
              <h3 className="font-medium">{goal.title}</h3>
              {goal.category && (
                <span
                  className={`badge ${categoryColours[goal.category] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {goal.category}
                </span>
              )}
              {goal.status === "done" && (
                <span className="badge bg-emerald-100 text-emerald-700">done</span>
              )}
            </div>
            {goal.ai_reason && (
              <p className="text-xs text-slate-500 mt-1">{goal.ai_reason}</p>
            )}
          </div>
          <div className="flex gap-2">
            {goal.status !== "done" && (
              <button type="button" className="btn-ghost" onClick={() => onMarkDone(goal)}>
                Done
              </button>
            )}
            <button
              type="button"
              className="btn-ghost text-rose-600 hover:bg-rose-50"
              onClick={() => onDelete(goal)}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
