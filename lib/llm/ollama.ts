const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:20b";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function ollamaChat(
  messages: OllamaMessage[],
  options?: { temperature?: number }
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: { temperature: options?.temperature ?? 0.3 },
    }),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Ollama model "${OLLAMA_MODEL}" not found. Run: ollama pull ${OLLAMA_MODEL}`
      );
    }
    if (res.status === 0 || res.status >= 500) {
      throw new Error(
        "Ollama is not running. Start it with: ollama serve"
      );
    }
    throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}
