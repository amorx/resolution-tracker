import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SentimentBadge from "@/components/SentimentBadge";

describe("SentimentBadge", () => {
  it("renders the positive label and score", () => {
    render(<SentimentBadge sentiment="positive" score={0.9} />);
    expect(screen.getByText("Positive")).toBeInTheDocument();
    expect(screen.getByText("0.90")).toBeInTheDocument();
  });

  it("maps neutral and negative to human labels", () => {
    const { rerender } = render(<SentimentBadge sentiment="neutral" />);
    expect(screen.getByText("Neutral")).toBeInTheDocument();
    rerender(<SentimentBadge sentiment="negative" />);
    expect(screen.getByText("Needs support")).toBeInTheDocument();
  });
});
