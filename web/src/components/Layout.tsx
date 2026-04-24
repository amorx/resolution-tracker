import { NavLink, Outlet } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const navItem = ({ isActive }: { isActive: boolean }) =>
  [
    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
    isActive ? "bg-brand-600 text-white shadow-card" : "text-slate-600 hover:bg-slate-100",
  ].join(" ");

export default function Layout() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-brand-600 grid place-items-center text-white font-bold shadow-card">
            RT
          </div>
          <div>
            <h1 className="text-xl font-semibold">Resolution Tracker</h1>
            <p className="text-sm text-slate-500">Your local coach, powered by Ollama</p>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <NavLink to="/" end className={navItem}>
            Dashboard
          </NavLink>
          <NavLink to="/goals" className={navItem}>
            Goals
          </NavLink>
          <NavLink to="/checkin" className={navItem}>
            Check-in
          </NavLink>
          <NavLink to="/history" className={navItem}>
            History
          </NavLink>
          <NotificationBell />
        </nav>
      </header>
      <main className="space-y-8">
        <Outlet />
      </main>
      <footer className="mt-16 text-xs text-slate-400 text-center">
        Runs entirely on your machine. No data leaves this container.
      </footer>
    </div>
  );
}
