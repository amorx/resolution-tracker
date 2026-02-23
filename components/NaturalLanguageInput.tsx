"use client";

import { useState } from "react";

interface NaturalLanguageInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function NaturalLanguageInput({
  onSubmit,
  disabled = false,
  placeholder = "e.g., I want to run 3 times a week",
}: NaturalLanguageInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50"
        aria-label="Describe your resolution"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="w-full min-h-[44px] rounded-full bg-teal-600 px-6 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
      >
        Parse resolution
      </button>
    </form>
  );
}
