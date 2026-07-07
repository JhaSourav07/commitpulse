import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeveloperCollaborationIntelligenceHub } from './DeveloperCollaborationIntelligenceHub';

describe('DeveloperCollaborationIntelligenceHub', () => {
  it('renders correctly', () => {
    render(<DeveloperCollaborationIntelligenceHub />);
    expect(screen.getByText('Developer Collaboration Intelligence Hub')).toBeInTheDocument();
    expect(screen.getByText('Collaboration Score')).toBeInTheDocument();
  });
});
