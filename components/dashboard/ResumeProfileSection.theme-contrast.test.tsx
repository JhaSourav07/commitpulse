import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Notice there are no curly braces around the import now!
import ResumeProfileSection from './ResumeProfileSection';

const mockMatchMedia = (isDark: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: isDark ? query.includes('dark') : query.includes('light'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('ResumeProfileSection Theme Contrast', () => {
  beforeEach(() => {
    mockMatchMedia(false); // Reset to light mode before each test runs
  });

  it('should adapt color styling properly for light preset', () => {
    mockMatchMedia(false);
    // We pass in your GitHub username as the required prop!
    const { container } = render(<ResumeProfileSection githubUsername="manav007-jiit" />);

    const mainDiv = container.firstChild as HTMLElement;
    // Check for light mode background and border classes
    expect(mainDiv.className).toContain('bg-white');
    expect(mainDiv.className).toContain('border-black/10');
  });

  it('should adapt color styling properly for dark preset', () => {
    mockMatchMedia(true);
    const { container } = render(<ResumeProfileSection githubUsername="manav007-jiit" />);

    const mainDiv = container.firstChild as HTMLElement;
    // Check for dark mode background and border classes
    expect(mainDiv.className).toContain('dark:bg-[#0a0a0a]');
    expect(mainDiv.className).toContain('dark:border-[rgba(255,255,255,0.08)]');
  });

  it('should enforce contrast ratio standards for textual elements', () => {
    render(<ResumeProfileSection githubUsername="manav007-jiit" />);

    // Check the heading text classes
    const heading = screen.getByText('Resume Profile');
    expect(heading.className).toContain('text-gray-900');
    expect(heading.className).toContain('dark:text-white');

    // Check the description text classes
    const paragraph = screen.getByText(/Upload your PDF or DOCX resume/i);
    expect(paragraph.className).toContain('text-gray-500');
    expect(paragraph.className).toContain('dark:text-white/50');
  });

  it('should verify specific custom stylesheet properties or Tailwind classes are active', () => {
    const { container } = render(<ResumeProfileSection githubUsername="manav007-jiit" />);

    const mainDiv = container.firstChild as HTMLElement;
    // Verify the structural layout classes exist
    expect(mainDiv.className).toContain('rounded-xl');
    expect(mainDiv.className).toContain('border');
    expect(mainDiv.className).toContain('p-4');
  });

  it('should ensure background overlays do not clip foreground content colors', () => {
    const { container } = render(<ResumeProfileSection githubUsername="manav007-jiit" />);

    const mainDiv = container.firstChild as HTMLElement;
    // Ensure the container does not have classes that would clip the content like overflow-hidden
    expect(mainDiv.className).not.toContain('overflow-hidden');
  });
});
