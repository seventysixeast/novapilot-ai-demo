import { render, screen } from "@testing-library/react";

import { PremiumButton } from "@/components/ui/premium-button";

describe("PremiumButton", () => {
  it("renders button text", () => {
    render(<PremiumButton>Generate</PremiumButton>);
    expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<PremiumButton loading>Generate</PremiumButton>);
    const button = screen.getByRole("button", { name: "Generate" });
    expect(button).toBeDisabled();
  });
});
