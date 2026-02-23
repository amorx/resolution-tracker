import { ollamaChat } from "./ollama";
import type { Resolution, ResolutionWeight } from "../types";

const WEIGHT_SYSTEM = `You score resolutions on three dimensions (1-10 each) and a combined score (0-100).

Return ONLY valid JSON, no markdown, no extra text:
{"measurability": number, "achievement": number, "importance": number, "combined": number}

- measurability: Can progress be tracked? (1-10)
- achievability: Is it realistic given typical constraints? (1-10)
- importance: How meaningful/specific does it seem? (1-10)
- combined: Weighted average, 0-100. Give measurability higher weight (e.g., 40% measurability, 30% achievability, 30% importance).`;

export async function weightResolution(
  resolution: Pick<
    Resolution,
    "title" | "targetValue" | "targetUnit" | "frequency"
  >
): Promise<ResolutionWeight> {
  const content = await ollamaChat([
    { role: "system", content: WEIGHT_SYSTEM },
    {
      role: "user",
      content: `Score this resolution: ${resolution.title} - ${resolution.targetValue} ${resolution.targetUnit} per ${resolution.frequency}`,
    },
  ]);

  const cleaned = content
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const jsonStr =
    firstBrace >= 0 && lastBrace > firstBrace
      ? cleaned.slice(firstBrace, lastBrace + 1)
      : cleaned;

  try {
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    const measurability = Math.min(10, Math.max(1, Number(parsed?.measurability) || 5));
    const achievability = Math.min(10, Math.max(1, Number(parsed?.achievement ?? parsed?.achievability) || 5));
    const importance = Math.min(10, Math.max(1, Number(parsed?.importance) || 5));
    const combined = Math.min(100, Math.max(0, Number(parsed?.combined) || 50));

    return {
      measurability,
      achievability,
      importance,
      combined: Math.round(combined),
    };
  } catch {
    return {
      measurability: 5,
      achievability: 5,
      importance: 5,
      combined: 50,
    };
  }
}
