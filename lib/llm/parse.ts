import { ollamaChat } from "./ollama";

export interface ParsedResolution {
  title: string;
  targetValue: number;
  targetUnit: string;
  frequency: "daily" | "weekly" | "monthly";
}

export interface ParseClarification {
  needsClarification: true;
  message: string;
  suggestion?: string;
}

export type ParseResult = ParsedResolution | ParseClarification;

const PARSE_SYSTEM = `You are a resolution parser. Extract measurable goal structure from natural language.

Return ONLY valid JSON, no markdown, no extra text.

If the input has a clear measurable target (number + unit + frequency), return:
{"title": "activity name", "targetValue": number, "targetUnit": "times|minutes|pages|days|etc", "frequency": "daily|weekly|monthly"}

If the input is vague (e.g., "exercise more", "read more"), return:
{"needsClarification": true, "message": "friendly conversational message asking for a number", "suggestion": "optional example like 'Run 3 times a week'"}

Support variations: "3x/week", "three times weekly", "every day", "daily", "20 pages", "10 minutes".`;

export async function parseResolution(text: string): Promise<ParseResult> {
  const content = await ollamaChat([
    { role: "system", content: PARSE_SYSTEM },
    {
      role: "user",
      content: `Parse this resolution: "${text}"`,
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
    const parsed = JSON.parse(jsonStr) as unknown;

    if (parsed && typeof parsed === "object" && "needsClarification" in parsed) {
      const c = parsed as ParseClarification;
      return {
        needsClarification: true,
        message: c.message || "Add a number so you can track your progress.",
        suggestion: c.suggestion,
      };
    }

    const p = parsed as Record<string, unknown>;
    const title = String(p?.title ?? "").trim();
    const targetValue = Number(p?.targetValue);
    const targetUnit = String(p?.targetUnit ?? "times").trim();
    const freq = String(p?.frequency ?? "weekly").toLowerCase();
    const frequency =
      freq === "daily" || freq === "monthly" ? freq : "weekly";

    if (!title || isNaN(targetValue) || targetValue < 1) {
      return {
        needsClarification: true,
        message:
          "Add a number so you can celebrate wins—e.g., how many times, minutes, or pages?",
        suggestion: "Run 3 times a week",
      };
    }

    return { title, targetValue, targetUnit, frequency };
  } catch {
    return {
      needsClarification: true,
      message: "Couldn't parse that. Try something like: 'Run 3 times a week'",
      suggestion: "Run 3 times a week",
    };
  }
}
