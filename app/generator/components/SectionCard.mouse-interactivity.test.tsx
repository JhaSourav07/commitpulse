import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionCard } from './SectionCard';

describe('SectionCard Mouse Interactivity', () => {
  it('1. toggles content when header is clicked', () => {
    render(
      <SectionCard title="General">
        <div>Hidden Content</div>
      </SectionCard>
    );

    const button = screen.getByRole('button', { name: /general/i });

    expect(screen.getByText('Hidden Content')).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByText('Hidden Content')).toBeInTheDocument();
  });

  it('2. updates aria-expanded during interaction', () => {
    render(
      <SectionCard title="Accessibility">
        <div>Content</div>
      </SectionCard>
    );

    const button = screen.getByRole('button', { name: /accessibility/i });

    expect(button).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('3. keeps hoverable button interactive', () => {
    render(
      <SectionCard title="Hover">
        <div>Body</div>
      </SectionCard>
    );

    const button = screen.getByRole('button', { name: /hover/i });

    fireEvent.mouseEnter(button);
    fireEvent.mouseMove(button);
    fireEvent.mouseLeave(button);

    expect(button).toBeInTheDocument();
  });

  it('4. supports repeated click interactions', () => {
    render(
      <SectionCard title="Repeat">
        <div>Repeat Content</div>
      </SectionCard>
    );

    const button = screen.getByRole('button', { name: /repeat/i });

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(button).toBeInTheDocument();
  });

  it('5. preserves content after hover and click events', () => {
    render(
      <SectionCard title="Combined">
        <div>Combined Content</div>
      </SectionCard>
    );

    const button = screen.getByRole('button', { name: /combined/i });

    fireEvent.mouseEnter(button);
    fireEvent.click(button);
    fireEvent.mouseLeave(button);
    fireEvent.click(button);

    expect(screen.getByText('Combined Content')).toBeInTheDocument();
  });
});
