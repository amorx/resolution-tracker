import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { api, type Notification } from "@/lib/api";

function triggerDesktop(notification: Notification): void {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return;
  }
  if (window.Notification.permission === "granted") {
    new window.Notification("Resolution Tracker", {
      body: notification.message,
      tag: `rt-${notification.id}`,
    });
  }
}

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(new Set());

  const { data: unread = [] } = useQuery<Notification[]>({
    queryKey: ["notifications", "unread"],
    queryFn: () => api.listNotifications(true),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return;
    }
    if (window.Notification.permission === "default") {
      window.Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const newly = unread.filter((n) => !seen.has(n.id));
    if (newly.length === 0) {
      return;
    }
    newly.forEach((notification) => {
      toast(notification.message, { icon: "🔔" });
      triggerDesktop(notification);
    });
    setSeen((prev) => {
      const next = new Set(prev);
      newly.forEach((n) => next.add(n.id));
      return next;
    });
  }, [unread, seen]);

  const markRead = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-ghost relative"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications (${unread.length} unread)`}
      >
        <span>🔔</span>
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 rounded-full bg-rose-500 text-white text-[10px] px-1.5 py-0.5">
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 card p-4 z-10"
          role="menu"
          aria-label="Notifications list"
        >
          {unread.length === 0 && (
            <p className="text-sm text-slate-500">You are all caught up.</p>
          )}
          <ul className="space-y-3">
            {unread.map((notification) => (
              <li key={notification.id} className="text-sm">
                <p className="text-slate-700">{notification.message}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-400">{notification.due_at}</span>
                  <button
                    type="button"
                    className="text-xs text-brand-600 hover:underline"
                    onClick={() => markRead.mutate(notification.id)}
                  >
                    Mark read
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
