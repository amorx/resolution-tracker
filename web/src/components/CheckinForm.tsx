import { useState } from "react";

interface Props {
  onSubmit: (text: string) => Promise<void> | void;
  disabled?: boolean;
}

export default function CheckinForm({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    setBusy(true);
    try {
      await onSubmit(trimmed);
      setValue("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="card space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label htmlFor="checkin-text" className="text-sm font-medium text-slate-600">
        How is your day tracking?
      </label>
      <textarea
        id="checkin-text"
        rows={4}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Quick note about what you did or how you're feeling..."
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-primary"
          disabled={disabled || busy || !value.trim()}
        >
          {busy ? "Analysing..." : "Save & analyse"}
        </button>
      </div>
    </form>
  );
}
