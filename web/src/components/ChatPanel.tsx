import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  initialMessages?: Message[];
  onSend?: (messages: Message[]) => Promise<Response>;
}

async function defaultSend(messages: Message[]): Promise<Response> {
  return fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
}

export default function ChatPanel({ initialMessages = [], onSend = defaultSend }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }
    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);
    try {
      const response = await onSend(nextMessages);
      const reader = response.body?.getReader();
      if (!reader) {
        return;
      }
      const decoder = new TextDecoder();
      let assistant = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (chunk.value) {
          assistant += decoder.decode(chunk.value, { stream: !done });
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: assistant };
            return copy;
          });
        }
      }
    } finally {
      setStreaming(false);
    }
  };

  return (
    <section className="card flex flex-col gap-3" aria-label="AI chat">
      <h2 className="text-lg font-semibold">Chat with your coach</h2>
      <div
        className="space-y-2 max-h-72 overflow-y-auto border border-slate-100 rounded-lg p-3 bg-slate-50"
        data-testid="chat-log"
      >
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">Ask your local coach anything.</p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`text-sm ${
              message.role === "user" ? "text-slate-800" : "text-brand-700"
            }`}
          >
            <strong className="mr-1 uppercase text-[10px] tracking-wide">
              {message.role}
            </strong>
            {message.content}
          </div>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          aria-label="Chat input"
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={streaming || !input.trim()}
        >
          {streaming ? "..." : "Send"}
        </button>
      </form>
    </section>
  );
}
