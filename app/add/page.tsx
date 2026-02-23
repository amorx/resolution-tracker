"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useResolutions } from "@/lib/hooks/useResolutions";
import { NaturalLanguageInput } from "@/components/NaturalLanguageInput";
import { ParsedPreview } from "@/components/ParsedPreview";
import type { ParsedResolution, ParseClarification } from "@/lib/llm/parse";

const MAX_RESOLUTIONS = 5;

export default function AddPage() {
  const router = useRouter();
  const { resolutions, add, update } = useResolutions();
  const [step, setStep] = useState<"input" | "preview" | "clarify">("input");
  const [rawInput, setRawInput] = useState("");
  const [parsed, setParsed] = useState<ParsedResolution | null>(null);
  const [clarify, setClarify] = useState<ParseClarification | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atLimit = resolutions.length >= MAX_RESOLUTIONS;

  const handleParse = async (text: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setClarify({
          needsClarification: true,
          message: data.error || data.message || "Could not parse. Try adding a number.",
        });
        setStep("clarify");
        return;
      }

      if (data.needsClarification) {
        setClarify(data);
        setStep("clarify");
        return;
      }

      setParsed(data);
      setRawInput(text);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse failed");
      setClarify({
        needsClarification: true,
        message: "Ollama may not be running. Start it with: ollama serve",
      });
      setStep("clarify");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setConfirming(true);
    setError(null);
    try {
      const resolution = await add({
        title: parsed.title,
        targetValue: parsed.targetValue,
        targetUnit: parsed.targetUnit,
        frequency: parsed.frequency,
        rawInput,
      });

      const weightRes = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: {
            title: resolution.title,
            targetValue: resolution.targetValue,
            targetUnit: resolution.targetUnit,
            frequency: resolution.frequency,
          },
        }),
      });
      if (weightRes.ok) {
        const weight = await weightRes.json();
        await update(resolution.id, { weight });
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setConfirming(false);
    }
  };

  const handleEdit = () => {
    setStep("input");
    setParsed(null);
    setClarify(null);
  };

  if (atLimit) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white px-4 py-4">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-teal-600"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </Link>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-8">
          <p className="text-slate-600">
            You&apos;ve reached the limit of {MAX_RESOLUTIONS} resolutions.
            Remove one to add another.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 text-teal-600"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">
          Add a resolution
        </h2>

        {step === "input" && (
          <div>
            <p className="mb-4 text-slate-600">
              Describe your resolution in your own words.
            </p>
            <NaturalLanguageInput
              onSubmit={handleParse}
              disabled={loading}
              placeholder="e.g., I want to run 3 times a week"
            />
          </div>
        )}

        {step === "preview" && parsed && (
          <div>
            <p className="mb-4 text-slate-600">Does this look right?</p>
            <ParsedPreview
              parsed={parsed}
              onConfirm={handleConfirm}
              onEdit={handleEdit}
              confirming={confirming}
            />
          </div>
        )}

        {step === "clarify" && clarify && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-medium text-amber-900">{clarify.message}</p>
            {clarify.suggestion && (
              <p className="mt-2 text-sm text-amber-800">
                Try: &quot;{clarify.suggestion}&quot;
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setClarify(null);
              }}
              className="mt-4 min-h-[44px] rounded-full bg-amber-600 px-6 font-medium text-white transition-colors hover:bg-amber-700"
            >
              Try again
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-4 text-slate-500">Parsing your resolution...</p>
        )}
      </main>
    </div>
  );
}
