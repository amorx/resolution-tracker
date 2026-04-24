import type { Sentiment } from "@/lib/api";

const styles: Record<Sentiment, string> = {
  positive: "bg-emerald-100 text-emerald-700",
  neutral: "bg-slate-100 text-slate-600",
  negative: "bg-rose-100 text-rose-700",
};

const labels: Record<Sentiment, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Needs support",
};

interface Props {
  sentiment: Sentiment;
  score?: number;
}

export default function SentimentBadge({ sentiment, score }: Props) {
  return (
    <span className={`badge ${styles[sentiment]}`} aria-label={`Sentiment: ${sentiment}`}>
      {labels[sentiment]}
      {typeof score === "number" && (
        <span className="ml-1 text-[10px] opacity-70">{score.toFixed(2)}</span>
      )}
    </span>
  );
}
