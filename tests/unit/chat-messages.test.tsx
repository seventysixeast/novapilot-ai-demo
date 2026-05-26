import { render, screen } from "@testing-library/react";

import { ChatMessages } from "@/components/chat/chat-messages";

describe("ChatMessages", () => {
  it("renders empty state when no messages", () => {
    const { container } = render(<ChatMessages messages={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders markdown content", () => {
    render(
      <ChatMessages
        messages={[
          {
            id: "1",
            role: "assistant",
            content: "## Hello\n\nThis is **markdown** content.",
          },
        ]}
      />,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
