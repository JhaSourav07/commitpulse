import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PRIntelligenceWorkspace } from './PRIntelligenceWorkspace';

describe('PRIntelligenceWorkspace', () => {
  it('renders correctly', () => {
    render(<PRIntelligenceWorkspace />);
    expect(screen.getByText('Pull Request Intelligence Workspace')).toBeInTheDocument();
  });
});
