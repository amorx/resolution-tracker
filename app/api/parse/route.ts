import { NextResponse } from "next/server";
import { parseResolution } from "@/lib/llm/parse";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "Missing or empty text" },
        { status: 400 }
      );
    }

    const result = await parseResolution(text);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse failed";
    return NextResponse.json(
      { error: message, needsClarification: true, message },
      { status: 500 }
    );
  }
}
