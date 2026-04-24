import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ChatPanel from "@/components/ChatPanel";

function textStream(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain" },
  });
}

describe("ChatPanel", () => {
  it("renders an empty state initially", () => {
    render(<ChatPanel onSend={vi.fn()} />);
    expect(screen.getByText(/Ask your local coach anything/i)).toBeInTheDocument();
  });

  it("streams chunks from onSend and appends assistant content", async () => {
    const onSend = vi.fn().mockResolvedValue(textStream(["Hello ", "there"]));
    render(<ChatPanel onSend={onSend} />);
    const input = screen.getByLabelText(/Chat input/i);
    await userEvent.type(input, "hi");
    await userEvent.click(screen.getByRole("button", { name: /Send/i }));
    await waitFor(() =>
      expect(screen.getByTestId("chat-log").textContent).toContain("Hello there"),
    );
    expect(onSend).toHaveBeenCalled();
  });

  it("ignores blank input", async () => {
    const onSend = vi.fn();
    render(<ChatPanel onSend={onSend} />);
    const button = screen.getByRole("button", { name: /Send/i });
    expect(button).toBeDisabled();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("handles a response with no body gracefully", async () => {
    const onSend = vi.fn().mockResolvedValue(new Response(null));
    render(<ChatPanel onSend={onSend} />);
    await userEvent.type(screen.getByLabelText(/Chat input/i), "ping");
    await userEvent.click(screen.getByRole("button", { name: /Send/i }));
    await waitFor(() => expect(onSend).toHaveBeenCalled());
  });
});
