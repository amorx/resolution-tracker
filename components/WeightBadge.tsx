interface WeightBadgeProps {
  combined: number;
  className?: string;
}

export function WeightBadge({ combined, className = "" }: WeightBadgeProps) {
  const hue = Math.round((combined / 100) * 120); // 0=red, 120=green
  const bg = `hsl(${hue}, 70%, 92%)`;
  const text = `hsl(${hue}, 50%, 30%)`;

  return (
    <span
      className={`inline-flex min-h-[24px] min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-medium ${className}`}
      style={{ backgroundColor: bg, color: text }}
      title={`Strength: ${combined}/100`}
    >
      {combined}
    </span>
  );
}
