import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SectionCard } from './SectionCard';

describe('SectionCard - Empty Fallback & Edge Cases', () => {
  it('renders successfully without optional props', () => {
    render(
      <SectionCard title="Test Section">
        <div>Test Content</div>
      </SectionCard>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('does not render description when description is omitted', () => {
    render(
      <SectionCard title="Test Section">
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.queryByText(/sample description/i)).not.toBeInTheDocument();
  });

  it('does not render badge when badge is undefined', () => {
    render(
      <SectionCard title="Test Section">
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('does not render badge when badge is zero', () => {
    render(
      <SectionCard title="Test Section" badge={0}>
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('does not render description for empty string', () => {
    render(
      <SectionCard title="Test Section" description="">
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('starts collapsed when defaultOpen is false', () => {
    render(
      <SectionCard title="Collapsed Section" defaultOpen={false}>
        <div>Hidden Content</div>
      </SectionCard>
    );

    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
  });

  it('toggles content visibility when header button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <SectionCard title="Toggle Section" defaultOpen={false}>
        <div>Toggle Content</div>
      </SectionCard>
    );

    expect(screen.queryByText('Toggle Content')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /toggle section/i }));

    expect(screen.getByText('Toggle Content')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /toggle section/i }));

    expect(screen.queryByText('Toggle Content')).not.toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <SectionCard title="Test Section" description="Sample description">
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.getByText('Sample description')).toBeInTheDocument();
  });

  it('renders badge when badge is greater than zero', () => {
    render(
      <SectionCard title="Test Section" badge={5}>
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <SectionCard title="Test Section" icon="🔥">
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.getByText('🔥')).toBeInTheDocument();
  });
});
