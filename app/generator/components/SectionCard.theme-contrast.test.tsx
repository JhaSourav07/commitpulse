import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FieldLabel, SectionCard } from './SectionCard';

describe('SectionCard', () => {
  it('renders children when defaultOpen is true', () => {
    render(
      <SectionCard title="Profile">
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('does not render children when defaultOpen is false', () => {
    render(
      <SectionCard title="Profile" defaultOpen={false}>
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('toggles content visibility when the header button is clicked', () => {
    render(
      <SectionCard title="Profile" defaultOpen={false}>
        <div>Content</div>
      </SectionCard>
    );

    const toggleButton = screen.getByRole('button');

    fireEvent.click(toggleButton);

    expect(screen.getByText('Content')).toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders description and badge when provided', () => {
    render(
      <SectionCard title="Profile" description="User profile settings" badge={5}>
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.getByText('User profile settings')).toBeInTheDocument();

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not render a badge when badge value is 0', () => {
    render(
      <SectionCard title="Profile" badge={0}>
        <div>Content</div>
      </SectionCard>
    );

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders FieldLabel children correctly', () => {
    render(<FieldLabel>Email</FieldLabel>);

    expect(screen.getByText('Email')).toBeInTheDocument();
  });
});
