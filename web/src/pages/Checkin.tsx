import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import ChatPanel from "@/components/ChatPanel";
import CheckinForm from "@/components/CheckinForm";
import SentimentBadge from "@/components/SentimentBadge";
import { api, type ProgressNote } from "@/lib/api";

export default function Checkin() {
  const queryClient = useQueryClient();

  const notesQuery = useQuery<ProgressNote[]>({
    queryKey: ["checkins"],
    queryFn: api.listCheckins,
  });

  const submit = useMutation({
    mutationFn: api.submitCheckin,
    onSuccess: (note) => {
      toast.success(`Logged - ${note.sentiment}`);
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
    },
    onError: () => toast.error("Could not save check-in"),
  });

  return (
    <>
      <section className="grid gap-5 md:grid-cols-2">
        <CheckinForm
          onSubmit={async (text) => {
            await submit.mutateAsync(text);
          }}
        />
        <ChatPanel />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent progress notes</h2>
        {(notesQuery.data ?? []).length === 0 && (
          <p className="text-sm text-slate-500">Nothing here yet. Your next check-in shows up above.</p>
        )}
        <ul className="space-y-3">
          {(notesQuery.data ?? []).map((note) => (
            <li key={note.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">{note.date}</p>
                  <p className="mt-1 text-sm text-slate-700">{note.text}</p>
                </div>
                <SentimentBadge sentiment={note.sentiment} score={note.score} />
              </div>
              {note.summary && (
                <p className="mt-2 text-xs italic text-slate-500">{note.summary}</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
