import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VelocityIntelligenceDashboard } from './VelocityIntelligenceDashboard';

describe('VelocityIntelligenceDashboard', () => {
  it('renders correctly', () => {
    render(<VelocityIntelligenceDashboard />);
    expect(screen.getByText('Engineering Velocity Intelligence Dashboard')).toBeInTheDocument();
  });
});
