import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DependencyIntelligenceCenter } from './DependencyIntelligenceCenter';

describe('DependencyIntelligenceCenter', () => {
  it('renders correctly', () => {
    render(<DependencyIntelligenceCenter />);
    expect(screen.getByText('Repository Dependency Intelligence Center')).toBeInTheDocument();
  });
});
