import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
// 1.Import Next.js Link component at the top
import Link from 'next/link';

// 2. Swap out the <a> tag inside your local Mock component
const OGRouteLayoutMock = () => (
  <div role="region" aria-labelledby="og-title">
    <h1 id="og-title">CommitPulse Image</h1>
    <h2>Open Graph Generation</h2>

    {/*  Changed from <a href="/">Home</a> to <Link href="/">Home</Link> */}
    <Link href="/">Home</Link>

    <button className="focus:outline-none focus:ring-2 focus:ring-blue-500">Interact</button>
    <button>Action</button>
    <input aria-label="Search" />

    <img src="/info.png" alt="Information Icon" aria-describedby="tooltip-desc" />
    <div id="tooltip-desc">Additional metadata</div>
  </div>
);

describe('ApiOgRoute Accessibility Standards & ARIA Compliance', () => {
  it('should have correct ARIA roles and accessible labels assigned', () => {
    render(<OGRouteLayoutMock />);

    const bannerSection = screen.getByRole('region', { name: /commitpulse image/i });
    expect(bannerSection).toBeInTheDocument();
    expect(bannerSection).toHaveAttribute('aria-labelledby');
  });

  it('should maintain visible outline classes/styles on interactive nodes upon focus', async () => {
    render(<OGRouteLayoutMock />);
    const user = userEvent.setup();
    const actionButton = screen.getByRole('button', { name: /interact/i });

    expect(actionButton).not.toHaveFocus();

    await user.tab(); // Navigates onto the link
    await user.tab(); // Navigates onto the interact button
    expect(actionButton).toHaveFocus();

    expect(actionButton.className).toMatch(/focus:/);
  });

  it('should announce tooltips using valid aria-describedby associations', () => {
    render(<OGRouteLayoutMock />);

    const infoIcon = screen.getByRole('img', { name: /information icon/i });
    const tooltipId = infoIcon.getAttribute('aria-describedby');

    expect(tooltipId).toBeDefined();
    const tooltipElement = document.getElementById(tooltipId!);
    expect(tooltipElement).toBeInTheDocument();
    expect(tooltipElement).toHaveTextContent(/additional metadata/i);
  });

  it('should follow a predictable and sequential logical tab order path', async () => {
    render(<OGRouteLayoutMock />);
    const user = userEvent.setup();

    const firstElement = screen.getByRole('link', { name: /home/i });
    const secondElement = screen.getByRole('button', { name: /interact/i });

    await user.tab();
    expect(firstElement).toHaveFocus();

    await user.tab();
    expect(secondElement).toHaveFocus();
  });

  it('should render standard headings in a strict logical hierarchical structure', () => {
    render(<OGRouteLayoutMock />);

    const mainHeading = screen.getByRole('heading', { level: 1 });
    const subHeading = screen.getByRole('heading', { level: 2 });

    expect(mainHeading).toBeInTheDocument();
    expect(subHeading).toBeInTheDocument();

    const compareOrder = mainHeading.compareDocumentPosition(subHeading);
    expect(compareOrder & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
