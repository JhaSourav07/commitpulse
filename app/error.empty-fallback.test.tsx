// app/error.empty-fallback.test.tsx

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import ErrorBoundary from "./error";

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: React.ReactNode;
  }) => <a {...props}>{children}</a>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Root Error Boundary - Empty & Missing Input Fallbacks", () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: mockWriteText,
      },
    });
  });

  const emptyErrorCases = [
    { description: "null", error: null as unknown as Error },
    { description: "undefined", error: undefined as unknown as Error },
    { description: "an empty object", error: {} as unknown as Error },
    {
      description: "missing message property",
      error: { name: "CustomError" } as unknown as Error,
    },
    { description: "an empty string message", error: new Error("") },
  ];

  it.each(emptyErrorCases)(
    "renders successfully when error is $description",
    ({ error }) => {
      expect(() =>
        render(<ErrorBoundary error={error} reset={vi.fn()} />)
      ).not.toThrow();

      expect(
        screen.getByRole("heading", {
          name: /Looks like an exception was thrown in the application/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByText("Unknown runtime error occurred.")
      ).toBeInTheDocument();
    }
  );

  it("renders interactive elements and triggers actions correctly in fallback state", async () => {
    const user = userEvent.setup(); // Initialize user-event
    const resetMock = vi.fn();

    render(<ErrorBoundary error={{} as unknown as Error} reset={resetMock} />);

    // Check actions
    const retryButton = screen.getByRole("button", { name: /git fetch/i });
    expect(retryButton).toBeInTheDocument();

    await user.click(retryButton);
    expect(resetMock).toHaveBeenCalledOnce();

    const homeLink = screen.getByRole("link", { name: /Return to main/i });
    expect(homeLink).toBeInTheDocument();

    // Check clipboard copy fallback behavior
    const terminalContainer = screen
      .getByText("commitpulse — error")
      .closest("div");

    expect(terminalContainer).not.toBeNull();

    await user.click(terminalContainer!);

    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining("Unknown exception in the render tree.")
    );
  });
});
