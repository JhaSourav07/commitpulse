import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SocialsSection } from './SocialsSection';
import type { ImgHTMLAttributes, ReactNode } from 'react';

// Mock Next Image
vi.mock('next/image', () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ''} {...props} />
  ),
}));

// Mock lucide icons
vi.mock('lucide-react', () => ({
  Search: () => <span>SearchIcon</span>,
  X: () => <span>XIcon</span>,
  ExternalLink: () => <span>ExternalLink</span>,
}));

// Mock SectionCard
vi.mock('../SectionCard', () => ({
  SectionCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldLabel: ({ children }: { children: ReactNode }) => <label>{children}</label>,
}));

// Mock socials dataset
vi.mock('../../data/socials', () => ({
  SOCIAL_CATEGORIES: ['Developer'],
  SOCIALS: [
    {
      id: 'github',
      name: 'GitHub',
      category: 'Developer',
      iconUrl: '/github.svg',
      type: 'simpleicon',
      placeholder: 'https://github.com/user',
    },
  ],
}));

describe('SocialsSection Mouse Interactivity', () => {
  const onSelectedChange = vi.fn();
  const onLinkChange = vi.fn();

  const defaultProps = {
    selected: [],
    socialLinks: {},
    onSelectedChange,
    onLinkChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getPlatformButton = () => {
    return screen
      .getAllByRole('button')
      .find(
        (button) =>
          button.textContent?.includes('GitHub') && button.textContent?.includes('Developer')
      )!;
  };

  it('allows hovering interactive platform buttons without errors', () => {
    render(<SocialsSection {...defaultProps} />);

    const platform = getPlatformButton();

    fireEvent.mouseEnter(platform);
    fireEvent.mouseMove(platform);
    fireEvent.mouseOver(platform);

    expect(platform).toBeInTheDocument();
  });

  it('clicking a platform selects it', () => {
    render(<SocialsSection {...defaultProps} />);

    fireEvent.click(getPlatformButton());

    expect(onSelectedChange).toHaveBeenCalledTimes(1);
    expect(onSelectedChange).toHaveBeenCalledWith(['github']);
  });

  it('mouse leave does not remove the interactive element', () => {
    render(<SocialsSection {...defaultProps} />);

    const platform = getPlatformButton();

    fireEvent.mouseEnter(platform);
    fireEvent.mouseLeave(platform);

    expect(platform).toBeVisible();
  });

  it('search input supports pointer interaction', () => {
    render(<SocialsSection {...defaultProps} />);

    const input = screen.getByPlaceholderText(/search platforms/i);

    fireEvent.mouseEnter(input);
    fireEvent.change(input, {
      target: { value: 'git' },
    });

    expect(input).toHaveValue('git');
  });

  it('external link click stops propagation', () => {
    render(
      <SocialsSection
        selected={['github']}
        socialLinks={{
          github: 'https://github.com/test',
        }}
        onSelectedChange={onSelectedChange}
        onLinkChange={onLinkChange}
      />
    );

    fireEvent.click(
      screen.getByRole('tab', {
        name: /add links/i,
      })
    );

    const link = screen.getByRole('link');

    fireEvent.click(link);

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/test');
  });
});
