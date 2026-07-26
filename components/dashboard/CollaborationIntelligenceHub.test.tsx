import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CollaborationIntelligenceHub } from './CollaborationIntelligenceHub';

describe('CollaborationIntelligenceHub', () => {
  it('renders title correctly', () => {
    render(<CollaborationIntelligenceHub />);
    expect(screen.getByText('Developer Collaboration Intelligence Hub')).toBeInTheDocument();
  });

  it('renders all 4 metric cards', () => {
    render(<CollaborationIntelligenceHub />);
    expect(screen.getByText('Metric 1')).toBeInTheDocument();
    expect(screen.getByText('Metric 4')).toBeInTheDocument();
  });
});
