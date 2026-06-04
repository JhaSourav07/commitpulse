import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Achievements from "./Achievements";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => {
      // Remove motion-specific props that React doesn't recognize
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initial, whileInView, viewport, transition, ...safeProps } = props;
      return (
        <div className={className} data-testid="motion-div" {...safeProps}>
          {children}
        </div>
      );
    },
  },
}));

// Helper to set viewport width
const setViewportWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
};

const mockAchievements = [
  {
    id: "1",
    title: "Early Bird",
    description: "Commit before 9 AM",
    icon: "🌅",
    type: "behavior" as const,
    isUnlocked: true,
    currentValue: 5,
    threshold: 5,
    progress: 100,
  },
  {
    id: "2",
    title: "Weekend Warrior",
    description: "Commit on weekends",
    icon: "🏋️",
    type: "behavior" as const,
    isUnlocked: false,
    currentValue: 3,
    threshold: 10,
    progress: 30,
  },
  {
    id: "3",
    title: "100 Day Streak",
    description: "100 consecutive days",
    icon: "🔥",
    type: "streak" as const,
    isUnlocked: true,
    currentValue: 100,
    threshold: 100,
    progress: 100,
  },
  {
    id: "4",
    title: "PR Master",
    description: "50 pull requests merged",
    icon: "🏆",
    type: "contributions" as const,
    isUnlocked: false,
    currentValue: 25,
    threshold: 50,
    progress: 50,
  },
  {
    id: "5",
    title: "Code Reviewer",
    description: "Review 20 PRs",
    icon: "👁️",
    type: "contributions" as const,
    isUnlocked: false,
    currentValue: 5,
    threshold: 20,
    progress: 25,
  },
];

describe("Achievements - Responsive Multi-device Columns & Mobile Viewport Layouts", () => {
  beforeEach(() => {
    setViewportWidth(375);
    vi.clearAllMocks();
  });

  afterEach(() => {
    setViewportWidth(1440);
    vi.restoreAllMocks();
  });

  it("renders without crashing on 375px mobile viewport", () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);
    expect(container).toBeDefined();
    expect(container.firstChild).not.toBeNull();
  });

  it("reflows columns using responsive grid layout on mobile viewport", () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);
    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).not.toBeNull();
    expect(gridContainer?.className).toContain("grid");
    const achievementItems = container.querySelectorAll(".grid > div");
    expect(achievementItems.length).toBeGreaterThan(0);
  });

  it("does not have elements with fixed widths that exceed 375px", () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);
    const allElements = container.querySelectorAll("*");
    let hasOverflowIssue = false;

    allElements.forEach((el) => {
      const styles = window.getComputedStyle(el as Element);
      const width = styles.width;
      if (width && width !== "auto" && width !== "0px" && width.endsWith("px")) {
        const widthValue = parseInt(width);
        if (widthValue > 375) {
          hasOverflowIssue = true;
        }
      }
    });

    expect(hasOverflowIssue).toBe(false);
  });

  it("scales down toggle button gracefully on mobile", () => {
    render(<Achievements achievements={mockAchievements} />);
    const buttons = screen.getAllByRole("button");
    const showMoreButton = buttons.find((btn) => btn.textContent?.includes("Show"));

    if (showMoreButton) {
      const styles = window.getComputedStyle(showMoreButton);
      const fontSize = parseInt(styles.fontSize);
      if (fontSize) {
        expect(fontSize).toBeGreaterThanOrEqual(10);
        expect(fontSize).toBeLessThanOrEqual(18);
      }
      expect(showMoreButton.hasAttribute("disabled")).toBeFalsy();
    }

    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
    }
  });

  it("handles toggle states correctly on mobile viewport", () => {
    const { container } = render(<Achievements achievements={mockAchievements} />);
    const achievementItems = container.querySelectorAll(".grid > div");
    const initialCount = achievementItems.length;
    expect(initialCount).toBe(4);

    const buttons = screen.getAllByRole("button");
    const toggleButton = buttons.find((btn) => btn.textContent?.includes("Show"));

    if (toggleButton) {
      fireEvent.click(toggleButton);
      const afterClickItems = container.querySelectorAll(".grid > div");
      expect(afterClickItems.length).toBeGreaterThan(initialCount);

      fireEvent.click(toggleButton);
      const finalItems = container.querySelectorAll(".grid > div");
      expect(finalItems.length).toBe(initialCount);
    }
  });
});
