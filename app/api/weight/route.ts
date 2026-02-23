import { NextResponse } from "next/server";
import { weightResolution } from "@/lib/llm/weight";
import type { Resolution } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { resolution?: Partial<Resolution> };
    const r = body?.resolution;

    if (!r || !r.title || r.targetValue == null || !r.targetUnit || !r.frequency) {
      return NextResponse.json(
        { error: "Invalid resolution: need title, targetValue, targetUnit, frequency" },
        { status: 400 }
      );
    }

    const weight = await weightResolution({
      title: r.title,
      targetValue: Number(r.targetValue),
      targetUnit: r.targetUnit,
      frequency: r.frequency as "daily" | "weekly" | "monthly",
    });

    return NextResponse.json(weight);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Weight failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
