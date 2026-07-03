import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DependencyIntelligenceCenter } from './DependencyIntelligenceCenter';

describe('DependencyIntelligenceCenter', () => {
  it('renders title correctly', () => {
    render(<DependencyIntelligenceCenter />);
    expect(screen.getByText('Repository Dependency Intelligence Center')).toBeInTheDocument();
  });

  it('renders all 4 metric cards', () => {
    render(<DependencyIntelligenceCenter />);
    expect(screen.getByText('Metric 1')).toBeInTheDocument();
    expect(screen.getByText('Metric 4')).toBeInTheDocument();
  });
});
